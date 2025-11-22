
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
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
import { deployment } from './deployment';
import { bus } from './eventBus';
import { audioUtils } from './audio.ts';

const uuid = () => Math.random().toString(36).substring(2, 15);

export const useAgent = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [terminalBlocks, setTerminalBlocks] = useState<TerminalBlock[]>([]);
    const [workflowPhase, setWorkflowPhase] = useState<WorkflowPhase>('idle');
    const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<{ path: string; type: 'video' | 'image' | 'audio' } | null>(null);
    const [isLive, setIsLive] = useState(false);
    
    const chatSessionRef = useRef<any>(null);
    const isProcessingRef = useRef(false);

    // Live API Refs
    const liveSessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const nextAudioStartTimeRef = useRef<number>(0);

    // Subscribe to agent messages from Swarm/Jules
    useEffect(() => {
        const unsubscribe = bus.subscribe((e) => {
            if (e.type === 'agent-message') {
                setMessages(prev => [...prev, {
                    id: uuid(),
                    role: 'system',
                    sender: e.payload.agent,
                    text: e.payload.text,
                    timestamp: Date.now()
                }]);
            }
        });
        return () => unsubscribe();
    }, []);

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

                case 'switch_view':
                    bus.emit('switch-view', { view: args.view });
                    notify.info("Interface", `Switched to ${args.view} view`);
                    return { status: "success", message: `Switched view to ${args.view}` };

                case 'file_read':
                    return { content: fs.readFile(args.file) };

                case 'file_write':
                    fs.writeFile(args.file, args.content, args.append);
                    return { status: "success" };
                
                case 'file_list':
                    return { files: fs.readDir(args.path).map(f => f.name) };

                case 'shell_exec':
                    const res = await shell.execute(args.command);
                    if (res.stdout) addBlock('output', res.stdout);
                    if (res.stderr) addBlock('error', res.stderr);
                    return { stdout: res.stdout, stderr: res.stderr, exit_code: res.exitCode };
                
                case 'deploy_app':
                    const provider = args.provider || 'render';
                    try {
                        const deployId = await deployment.deploy(provider, args.repoUrl);
                        notify.info("Deployment Started", `Deploying to ${provider}...`);
                        return { status: "initiated", deploymentId: deployId, provider };
                    } catch(e: any) {
                        return { error: e.message };
                    }

                case 'apm_install':
                    const apmRes = await apm.install(args.package);
                    addBlock('system', apmRes);
                    notify.success("Package Installed", args.package);
                    return { status: "installed", message: apmRes };

                case 'github_ops':
                    return await github.processOperation(args.operation, args.data);

                case 'media_gen':
                    return await orchestrator.generateMedia(args.service, args.prompt, args.params);

                case 'browser_navigate':
                    return { result: await browserAutomation.goto(args.url) };
                
                case 'browser_click':
                    return { result: await browserAutomation.click(args.selector) };
                
                case 'browser_scrape':
                    return { content: await browserAutomation.scrape() };

                case 'browser_screenshot':
                    return { image: await browserAutomation.screenshot() };

                case 'schedule_task':
                    scheduler.addTask({
                        name: args.name,
                        type: args.type as any,
                        action: args.action,
                        schedule: args.interval ? 'interval' : 'once',
                        intervalSeconds: args.interval,
                        nextRun: Date.now() + (args.interval ? args.interval * 1000 : 0)
                    });
                    return { status: "scheduled" };

                case 'idle':
                    isProcessingRef.current = false;
                    setWorkflowPhase('idle');
                    addBlock('system', 'Agent task completed.');
                    notify.success("Task Completed", "Aussie has finished the assignment.");
                    return { status: "idle" };

                default:
                    return { error: `Tool ${name} not implemented.` };
            }
        } catch (e: any) {
            addBlock('error', `Tool Error: ${e.message}`);
            return { error: e.message };
        }
    };

    // --- GEMINI LIVE IMPLEMENTATION ---

    const startLiveSession = async () => {
        if (!process.env.API_KEY) return notify.error("Error", "Missing API Key");
        
        try {
            setIsLive(true);
            notify.info("Aussie Live", "Connecting to Gemini Live...");

            // 1. Setup Audio Contexts
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // 2. Connect to Live API
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: TOOLS }],
                    systemInstruction: AUSSIE_SYSTEM_INSTRUCTION + "\n\nNote: You are in Voice Mode. Be concise.",
                },
                callbacks: {
                    onopen: () => {
                        notify.success("Aussie Live", "Voice Connection Established");
                        
                        // Start recording pipeline
                        inputSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                        processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            // Downsample/Convert Float32 to Int16 PCM
                            const pcmData = audioUtils.floatTo16BitPCM(inputData);
                            const base64 = audioUtils.arrayBufferToBase64(pcmData);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64
                                    }
                                });
                            });
                        };
                        
                        inputSourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // 1. Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputContextRef.current) {
                             const buffer = await audioUtils.convertPCMToAudioBuffer(audioData, outputContextRef.current);
                             const source = outputContextRef.current.createBufferSource();
                             source.buffer = buffer;
                             source.connect(outputContextRef.current.destination);
                             
                             const currentTime = outputContextRef.current.currentTime;
                             const startTime = Math.max(currentTime, nextAudioStartTimeRef.current);
                             source.start(startTime);
                             nextAudioStartTimeRef.current = startTime + buffer.duration;
                        }

                        // 2. Handle Tool Calls
                        if (msg.toolCall) {
                            for (const fc of msg.toolCall.functionCalls) {
                                notify.info("Live Agent", `Executing: ${fc.name}`);
                                const result = await executeTool(fc.name, fc.args);
                                
                                sessionPromise.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result }
                                        }]
                                    });
                                });
                            }
                        }
                    },
                    onclose: () => {
                        setIsLive(false);
                        notify.info("Aussie Live", "Session Disconnected");
                    },
                    onerror: (e) => {
                        console.error("Live Error", e);
                        notify.error("Live Error", "Connection interrupted");
                        stopLiveSession();
                    }
                }
            });
            
            liveSessionRef.current = sessionPromise;

        } catch (e: any) {
            notify.error("Connection Failed", e.message);
            setIsLive(false);
        }
    };

    const stopLiveSession = () => {
        if (inputSourceRef.current) inputSourceRef.current.disconnect();
        if (processorRef.current) processorRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (outputContextRef.current) outputContextRef.current.close();
        
        // We can't strictly "close" the session promise object easily without the session object itself,
        // but typically we just tear down the local audio. 
        // Ideally call session.close() if available in the resolved promise.
        liveSessionRef.current?.then((s: any) => s.close());
        
        setIsLive(false);
    };

    const toggleLive = () => {
        if (isLive) stopLiveSession();
        else startLiveSession();
    };

    // --- EXISTING TEXT CHAT ---

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
        runShellCommand,
        isLive,
        toggleLive
    };
};
