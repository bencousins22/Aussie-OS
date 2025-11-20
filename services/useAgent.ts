
import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, TerminalBlock, WorkflowPhase, EditorTab } from '../types';
import { AUSSIE_SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { fs } from './fileSystem';
import { shell } from './shell';
import { apm } from './packageManager';
import { github } from './github';
import { orchestrator } from './orchestrator';
import { browserAutomation } from './browserAutomation';
import { notify } from './notification';
import { scheduler } from './scheduler';

const uuid = () => Math.random().toString(36).substring(2, 15);

export const useAgent = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [terminalBlocks, setTerminalBlocks] = useState<TerminalBlock[]>([]);
    const [workflowPhase, setWorkflowPhase] = useState<WorkflowPhase>('idle');
    const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<{ path: string; type: 'video' | 'image' | 'audio' } | null>(null);
    
    const chatSessionRef = useRef<any>(null);
    const isProcessingRef = useRef(false);

    const addBlock = (type: TerminalBlock['type'], content: string, metadata?: any) => {
        setTerminalBlocks(prev => [...prev, {
            id: uuid(),
            timestamp: Date.now(),
            type,
            content,
            metadata
        }]);
    };

    const openFile = (path: string) => {
        // Media Check
        const ext = path.split('.').pop()?.toLowerCase();
        if (['mp4', 'webm', 'mov'].includes(ext || '')) {
            setMediaFile({ path, type: 'video' });
            return;
        }
        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
            setMediaFile({ path, type: 'image' });
            return;
        }
        if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
            setMediaFile({ path, type: 'audio' });
            return;
        }

        try {
            fs.readFile(path);
            const name = path.split('/').pop() || 'file';
            
            setEditorTabs(prev => {
                if (prev.find(t => t.path === path)) return prev;
                const langMap: any = { 
                    ts: 'typescript', tsx: 'typescript',
                    js: 'javascript', jsx: 'javascript',
                    py: 'python', md: 'markdown', json: 'json',
                    html: 'html', css: 'css'
                };
                
                return [...prev, {
                    path,
                    title: name,
                    isDirty: false,
                    language: langMap[ext || ''] || 'plaintext'
                }];
            });
            setActiveTabPath(path);
            // Note: View switching logic is handled in App.tsx effect/handler
        } catch (e) {
            addBlock('error', `Cannot open file: ${path}`);
        }
    };

    const executeTool = async (name: string, args: any): Promise<any> => {
        addBlock('tool-call', name, { args });
        
        try {
            switch (name) {
                case 'message_notify_user':
                    setMessages(prev => [...prev, { id: uuid(), role: 'model', text: args.text, timestamp: Date.now() }]);
                    notify.info("Aussie Agent", args.text);
                    return { status: "ok" };

                case 'file_read':
                    return { content: fs.readFile(args.file) };

                case 'file_write': {
                    let content = args.content;
                    if (args.append) {
                         try { content = fs.readFile(args.file) + content; } catch (e) {}
                    }
                    fs.writeFile(args.file, content);
                    // If it's an HTML file, notify likely needed for Browser refresh (handled by EventBus)
                    return { status: "success", bytes: content.length };
                }

                case 'file_list': {
                    const files = fs.readDir(args.path);
                    return { files: files.map(f => f.name) };
                }

                case 'shell_exec': {
                    const res = await shell.execute(args.command);
                    if (res.stdout) addBlock('output', res.stdout);
                    if (res.stderr) addBlock('error', res.stderr);
                    return { stdout: res.stdout, stderr: res.stderr, exit_code: res.exitCode };
                }

                case 'apm_install': {
                    const res = await apm.install(args.package);
                    addBlock('system', res);
                    notify.success("Package Installed", args.package);
                    return { status: "installed", message: res };
                }

                case 'github_ops': {
                    const res = await github.processOperation(args.operation, args.data);
                    return res;
                }

                case 'media_gen': {
                    const res = await orchestrator.generateMedia(args.service, args.prompt, args.params);
                    return res;
                }

                case 'browser_navigate':
                    return { result: await browserAutomation.goto(args.url) };
                
                case 'browser_click':
                    return { result: await browserAutomation.click(args.selector) };
                
                case 'browser_scrape':
                    return { content: await browserAutomation.scrape() };

                case 'browser_screenshot':
                    return { image: await browserAutomation.screenshot() };

                case 'schedule_task': {
                    scheduler.addTask({
                        name: args.name,
                        type: args.type as any,
                        action: args.action,
                        schedule: args.interval ? 'interval' : 'once',
                        intervalSeconds: args.interval,
                        nextRun: Date.now() + (args.interval ? args.interval * 1000 : 0)
                    });
                    return { status: "scheduled" };
                }

                case 'idle':
                    isProcessingRef.current = false;
                    setWorkflowPhase('idle');
                    addBlock('system', 'Agent task completed.');
                    notify.success("Task Completed", "Aussie has finished the assignment.");
                    return { status: "idle" };

                default:
                    return { error: `Tool ${name} not implemented in Aussie OS kernel.` };
            }
        } catch (e: any) {
            addBlock('error', `Tool Error: ${e.message}`);
            return { error: e.message };
        }
    };

    const processUserMessage = async (text: string) => {
        if (!process.env.API_KEY) {
            addBlock('error', 'System Error: API_KEY missing.');
            setWorkflowPhase('error');
            return;
        }
        
        isProcessingRef.current = true;
        setWorkflowPhase('planning');
        
        setMessages(prev => [...prev, { id: uuid(), role: 'user', text, timestamp: Date.now() }]);

        if (!chatSessionRef.current) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction: AUSSIE_SYSTEM_INSTRUCTION,
                    tools: [{ functionDeclarations: TOOLS }],
                },
            });
        }

        try {
            let response = await chatSessionRef.current.sendMessage({ message: text });
            
            while (isProcessingRef.current) {
                const candidates = response.candidates;
                if (!candidates || !candidates.length) break;

                const parts = candidates[0].content.parts;
                const calls = parts.filter((p: any) => p.functionCall);
                const thoughts = parts.filter((p: any) => p.text && !p.functionCall);

                if (thoughts.length) thoughts.forEach((t: any) => addBlock('ai-thought', t.text));

                if (calls.length > 0) {
                    setWorkflowPhase('coding');
                    const responses = [];
                    for (const callPart of calls) {
                        const call = callPart.functionCall;
                        const result = await executeTool(call.name, call.args);
                        
                        if (call.name === 'idle') isProcessingRef.current = false;

                        responses.push({
                            functionResponse: {
                                name: call.name,
                                response: { result }
                            }
                        });
                    }

                    if (isProcessingRef.current) {
                        response = await chatSessionRef.current.sendMessage({ message: responses });
                    }
                } else {
                    isProcessingRef.current = false;
                }
            }
        } catch (error: any) {
            addBlock('error', `Kernel Panic: ${error.message}`);
            setWorkflowPhase('error');
        } finally {
            isProcessingRef.current = false;
            setWorkflowPhase('idle');
        }
    };

    const runShellCommand = async (cmd: string) => {
        addBlock('command', cmd, { cwd: shell.getCwd() });
        const res = await shell.execute(cmd);
        if (res.stdout) addBlock('output', res.stdout);
        if (res.stderr) addBlock('error', res.stderr);
    };

    return {
        messages,
        isProcessing: isProcessingRef.current,
        workflowPhase,
        terminalBlocks,
        editorTabs,
        activeTabPath,
        setActiveTabPath,
        openFile,
        mediaFile,
        setMediaFile,
        processUserMessage,
        runShellCommand
    };
};
