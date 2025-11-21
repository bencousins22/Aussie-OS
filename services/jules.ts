
import { GoogleGenAI } from '@google/genai';
import { FlowGraph, FlowNode, FlowEdge } from '../types';
import { fs } from './fileSystem';
import { shell } from './shell';
import { github } from './github';
import { orchestrator } from './orchestrator';
import { bus } from './eventBus';
import { AUSSIE_SYSTEM_INSTRUCTION, TOOLS } from '../constants';

/**
 * Jules: The Flow Orchestrator
 * Connects Visual Flows -> Gemini -> Aussie OS Kernel
 * 
 * Features:
 * - Autonomous Graph Traversal
 * - Self-Healing Execution Loop (Try -> Catch -> Fix -> Retry)
 * - GitHub A2A & Multi-modal Support
 */
export class JulesOrchestrator {
    private graph: FlowGraph;
    private updateNodeCallback: (nodeId: string, status: any) => void;
    private logCallback: (msg: string) => void;
    private ai: GoogleGenAI | null = null;

    constructor(
        graph: FlowGraph, 
        onUpdateNode: (nodeId: string, status: any) => void,
        onLog: (msg: string) => void
    ) {
        this.graph = graph;
        this.updateNodeCallback = onUpdateNode;
        this.logCallback = onLog;

        if (process.env.API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }

    private async executeTool(name: string, args: any): Promise<any> {
        this.logCallback(`[TOOL] ${name}`);
        
        try {
            switch (name) {
                case 'file_read': return { content: fs.readFile(args.file) };
                case 'file_write': 
                    fs.writeFile(args.file, args.content);
                    return { status: "ok" };
                case 'file_list': return { files: fs.readDir(args.path).map(f => f.name) };
                case 'shell_exec': 
                    const res = await shell.execute(args.command);
                    if (res.stdout) this.logCallback(`[STDOUT] ${res.stdout.substring(0, 100)}...`);
                    if (res.stderr) this.logCallback(`[STDERR] ${res.stderr}`);
                    return { stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode };
                case 'message_notify_user':
                    this.logCallback(`[MSG] ${args.text}`);
                    bus.emit('agent-message', { agent: 'Jules', text: args.text });
                    return { status: "ok" };
                case 'github_ops':
                    return await github.processOperation(args.operation, args.data);
                case 'media_gen':
                    return await orchestrator.generateMedia(args.service, args.prompt, args.params);
                default: return { status: "ok" };
            }
        } catch (e: any) {
            return { error: e.message };
        }
    }

    public async run() {
        if (!this.ai) {
            this.logCallback("Error: No API Key found.");
            bus.emit('agent-message', { agent: 'Jules', text: "Error: No API Key found. Cannot start flow." });
            return;
        }

        // 1. Find Start Node
        const startNode = this.graph.nodes.find(n => n.type === 'trigger');
        if (!startNode) {
            this.logCallback("Error: No Trigger node found.");
            return;
        }

        this.logCallback("Starting Flow Execution...");
        bus.emit('agent-message', { agent: 'Jules', text: `🚀 Starting Flow: ${this.graph.name}` });
        
        await this.traverse(startNode, "Flow Started");
        
        this.logCallback("Flow Execution Completed.");
        bus.emit('agent-message', { agent: 'Jules', text: `✅ Flow "${this.graph.name}" completed successfully.` });
    }

    private async traverse(node: FlowNode, context: string) {
        this.updateNodeCallback(node.id, { status: 'running' });
        
        // Execute Node Logic with Self-Healing
        let result = "";
        try {
            if (node.type === 'trigger') {
                result = "Triggered manually.";
            } else {
                result = await this.executeNodeStepWithRetry(node, context);
            }
            
            this.updateNodeCallback(node.id, { status: 'success', result });
        } catch (e: any) {
            this.updateNodeCallback(node.id, { status: 'error', result: e.message });
            this.logCallback(`CRITICAL FAILURE in node ${node.label}: ${e.message}`);
            bus.emit('agent-message', { agent: 'Jules', text: `❌ Critical failure in node "${node.label}": ${e.message}` });
            return; // Stop flow on critical error
        }

        // Find Next Nodes
        const edges = this.graph.edges.filter(e => e.source === node.id);
        for (const edge of edges) {
            const nextNode = this.graph.nodes.find(n => n.id === edge.target);
            if (nextNode) {
                // Pass the result of previous step as context
                await this.traverse(nextNode, `Previous Step (${node.label}) Result: ${result}`);
            }
        }
    }

    /**
     * Executes a node's logic with a self-healing loop.
     */
    private async executeNodeStepWithRetry(node: FlowNode, previousContext: string): Promise<string> {
        if (!this.ai) throw new Error("AI not initialized");

        const chat = this.ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: {
                systemInstruction: AUSSIE_SYSTEM_INSTRUCTION,
                tools: [{ functionDeclarations: TOOLS }],
            }
        });

        // Initial Prompt construction
        let currentMessage = `
        CONTEXT: You are Jules, executing a workflow step in Aussie OS.
        PREVIOUS STEP OUTPUT: ${previousContext}
        
        CURRENT GOAL: ${node.label}
        USER INSTRUCTIONS: ${node.prompt || "Perform the task best suited for this label."}
        
        You have full access to the OS (Shell, FS, GitHub, Google AI). 
        1. Plan your action.
        2. Write any necessary code or call orchestrator tools.
        3. EXECUTE using 'shell_exec', 'github_ops', or 'media_gen'.
        4. If it fails, FIX it.
        
        Return a final summary only when the task is successfully verified.
        `;

        const MAX_ATTEMPTS = 3; 
        let attempts = 0;
        let finalSummary = "";

        while (attempts < MAX_ATTEMPTS) {
            this.logCallback(`[Step: ${node.label}] Thinking (Attempt ${attempts + 1}/${MAX_ATTEMPTS})...`);
            
            try {
                let response = await chat.sendMessage({ message: currentMessage });
                
                // Inner Loop: Process multi-turn tool calls
                let toolTurnCount = 0;
                let stepSuccess = true;
                let stepError = "";

                while (toolTurnCount < 8) {
                    const candidates = response.candidates;
                    if (!candidates || !candidates.length) break;

                    const parts = candidates[0].content.parts;
                    const calls = parts.filter((p: any) => p.functionCall);
                    const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');

                    if (text) finalSummary += text;

                    if (calls.length > 0) {
                        const responses = [];
                        for (const callPart of calls) {
                            const call = callPart.functionCall;
                            const res = await this.executeTool(call.name, call.args);
                            
                            if (call.name === 'shell_exec' && res.exitCode !== 0) {
                                stepSuccess = false;
                                stepError = `Command '${call.args.command}' failed with exit code ${res.exitCode}. STDERR: ${res.stderr}`;
                                this.logCallback(`[AUTO-FIX] Detected failure: ${stepError}`);
                                bus.emit('agent-message', { agent: 'Jules', text: `🔧 Auto-Fixing error in ${node.label}: ${stepError.substring(0, 50)}...` });
                            }
                            
                            if (res.error) {
                                stepSuccess = false;
                                stepError = `Tool '${call.name}' failed: ${res.error}`;
                            }

                            responses.push({
                                functionResponse: {
                                    name: call.name,
                                    response: { result: res }
                                }
                            });
                        }
                        
                        response = await chat.sendMessage({ message: responses });
                        toolTurnCount++;

                        if (!stepSuccess) break;
                    } else {
                        break;
                    }
                }

                if (stepSuccess) {
                    return finalSummary || "Task completed successfully.";
                } else {
                    // Self-Healing Logic
                    attempts++;
                    if (attempts < MAX_ATTEMPTS) {
                        currentMessage = `
                        CRITICAL: The previous action failed. 
                        ERROR: ${stepError}
                        
                        Analyze the error above. 
                        1. Explain why it failed.
                        2. Modify your code or command to fix the issue.
                        3. Retry the execution.
                        `;
                        this.logCallback(`[AUTO-FIX] Retrying task due to error...`);
                    } else {
                        throw new Error(`Failed after ${MAX_ATTEMPTS} attempts. Last error: ${stepError}`);
                    }
                }

            } catch (e: any) {
                this.logCallback(`[API ERROR] ${e.message}`);
                throw e;
            }
        }

        return finalSummary;
    }
}
