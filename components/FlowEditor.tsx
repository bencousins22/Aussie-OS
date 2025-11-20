
import React, { useState, useEffect, useRef } from 'react';
import { FlowGraph, FlowNode, FlowEdge } from '../types';
import { Play, Plus, Save, Zap, Terminal, CheckCircle, AlertCircle, Github, Video } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { JulesOrchestrator } from '../services/jules';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const FlowEditor: React.FC = () => {
    const [graph, setGraph] = useState<FlowGraph>({
        id: 'default',
        name: 'New Automation Flow',
        nodes: [
            { id: '1', type: 'trigger', label: 'Start Manual', x: 50, y: 100, status: 'pending' }
        ],
        edges: []
    });

    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [savedFlows, setSavedFlows] = useState<string[]>([]);

    useEffect(() => {
        loadSavedFlows();
    }, []);

    const loadSavedFlows = () => {
        try {
            if (!fs.exists('/workspace/flows')) {
                fs.mkdir('/workspace/flows');
            }
            const files = fs.readDir('/workspace/flows');
            setSavedFlows(files.map(f => f.name));
        } catch (e) {
            console.error(e);
        }
    };

    const saveFlow = () => {
        try {
            const content = JSON.stringify(graph, null, 2);
            const filename = `/workspace/flows/${graph.name.replace(/\s+/g, '_')}.json`;
            fs.writeFile(filename, content);
            loadSavedFlows();
            alert(`Flow saved to ${filename}`);
        } catch (e) {
            alert('Failed to save flow');
        }
    };

    const loadFlow = (filename: string) => {
        try {
            const content = fs.readFile(`/workspace/flows/${filename}`);
            setGraph(JSON.parse(content));
        } catch (e) {
            console.error(e);
        }
    };

    const addNode = (type: 'action' | 'github' | 'media') => {
        const id = generateId();
        let label = 'Action';
        let prompt = 'Describe task...';
        
        if (type === 'github') {
            label = 'GitHub Ops';
            prompt = 'Review PR #123 or Sync Repo...';
        } else if (type === 'media') {
            label = 'Media Gen';
            prompt = 'Create a video using Veo3 about...';
        }

        const newNode: FlowNode = {
            id,
            type: 'action', // Generic action type for execution, but UI distinguishes label
            label,
            prompt,
            x: 200,
            y: 100 + (graph.nodes.length * 80),
            status: 'pending'
        };

        const lastNode = graph.nodes[graph.nodes.length - 1];
        const newEdge: FlowEdge = {
            id: generateId(),
            source: lastNode.id,
            target: id
        };

        setGraph(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode],
            edges: [...prev.edges, newEdge]
        }));
    };

    const updateNode = (id: string, updates: Partial<FlowNode>) => {
        setGraph(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
        }));
    };

    const runFlow = async () => {
        setIsRunning(true);
        setLogs([]);
        
        setGraph(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => ({ ...n, status: 'pending', result: undefined }))
        }));

        const jules = new JulesOrchestrator(
            graph,
            (nodeId, status) => {
                setGraph(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...status } : n)
                }));
            },
            (msg) => setLogs(prev => [...prev, msg])
        );

        await jules.run();
        setIsRunning(false);
    };

    return (
        <div className="flex h-full bg-[#0d1117] text-gray-300">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="font-bold text-white mb-4">Jules Automator</h2>
                    <button 
                        onClick={runFlow}
                        disabled={isRunning}
                        className={`w-full py-2 rounded-md font-bold flex items-center justify-center gap-2 mb-4 transition-all ${isRunning ? 'bg-gray-700' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                        {isRunning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Play className="w-4 h-4" />}
                        {isRunning ? 'Running...' : 'Run Flow'}
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => addNode('action')} className="py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded flex flex-col items-center justify-center gap-1 text-[10px]">
                            <Terminal className="w-3 h-3" /> Action
                        </button>
                        <button onClick={() => addNode('github')} className="py-2 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded flex flex-col items-center justify-center gap-1 text-[10px]">
                            <Github className="w-3 h-3" /> GitHub
                        </button>
                        <button onClick={() => addNode('media')} className="py-2 bg-pink-600/20 text-pink-400 border border-pink-600/30 rounded flex flex-col items-center justify-center gap-1 text-[10px]">
                            <Video className="w-3 h-3" /> Media
                        </button>
                    </div>
                    <button onClick={saveFlow} className="mt-2 w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-xs flex items-center justify-center gap-1">
                        <Save className="w-3 h-3" /> Save Flow
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Saved Flows</div>
                    {savedFlows.map(f => (
                        <div 
                            key={f} 
                            onClick={() => loadFlow(f)}
                            className="p-2 hover:bg-gray-800 rounded cursor-pointer text-sm flex items-center gap-2"
                        >
                            <Terminal className="w-3 h-3 text-gray-500" />
                            {f.replace('.json', '')}
                        </div>
                    ))}
                </div>
                
                <div className="h-48 border-t border-gray-800 bg-black p-2 font-mono text-xs overflow-y-auto">
                    {logs.map((l, i) => (
                        <div key={i} className="mb-1 opacity-70">{l}</div>
                    ))}
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative overflow-hidden bg-[#0f1115]">
                <div className="absolute inset-0 p-8 overflow-auto">
                    <div className="max-w-3xl mx-auto space-y-8 relative">
                        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-800 -z-10" />

                        {graph.nodes.map((node, index) => (
                            <div 
                                key={node.id}
                                onClick={() => setSelectedNode(node.id)}
                                className={`
                                    relative ml-8 p-4 rounded-lg border-2 transition-all cursor-pointer group
                                    ${selectedNode === node.id ? 'border-aussie-500 bg-[#1c2128]' : 'border-gray-700 bg-[#161b22] hover:border-gray-600'}
                                `}
                            >
                                <div className={`
                                    absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#0f1115]
                                    ${node.status === 'success' ? 'bg-green-500' : node.status === 'running' ? 'bg-blue-500 animate-pulse' : node.status === 'error' ? 'bg-red-500' : 'bg-gray-600'}
                                `} />

                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {node.type === 'trigger' ? <Zap className="w-4 h-4 text-yellow-400" /> :
                                         node.label.includes('GitHub') ? <Github className="w-4 h-4 text-purple-400" /> :
                                         node.label.includes('Media') ? <Video className="w-4 h-4 text-pink-400" /> :
                                         <Terminal className="w-4 h-4 text-blue-400" />
                                        }
                                        <input 
                                            value={node.label}
                                            onChange={(e) => updateNode(node.id, { label: e.target.value })}
                                            className="bg-transparent font-bold outline-none text-gray-200 w-full"
                                        />
                                    </div>
                                    {node.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {node.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                </div>

                                {node.type !== 'trigger' && (
                                    <textarea 
                                        value={node.prompt}
                                        onChange={(e) => updateNode(node.id, { prompt: e.target.value })}
                                        placeholder="Instructions..."
                                        className="w-full bg-[#0d1117] p-2 rounded text-sm text-gray-400 border border-gray-800 outline-none resize-y min-h-[60px] focus:border-gray-600"
                                    />
                                )}

                                {node.result && (
                                    <div className="mt-3 p-2 bg-black/30 rounded border border-gray-800 text-xs font-mono text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {typeof node.result === 'object' ? JSON.stringify(node.result, null, 2) : node.result}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
