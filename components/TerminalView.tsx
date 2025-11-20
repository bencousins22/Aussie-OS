import React, { useEffect, useRef, useState } from 'react';
import { TerminalBlock } from '../types';
import { Terminal, AlertCircle, Cpu, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { shell } from '../services/shell';

interface Props {
    blocks: TerminalBlock[];
    onCommand?: (cmd: string) => void; // If parent handles execution
}

export const TerminalView: React.FC<Props> = ({ blocks }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('/workspace');

    // Keep CWD in sync
    useEffect(() => {
        const timer = setInterval(() => {
            setCwd(shell.getCwd());
        }, 500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [blocks]);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            // Use the shell service via App's context/props usually, 
            // but here we can trigger the shell directly if needed or via prop
            // Ideally, we want the App to handle this to update blocks state
            // Dispatch custom event or use the passed prop if we had one, 
            // BUT since `useAgent` manages blocks, we need a way to call `runShellCommand`.
            // For now, we will dispatch a custom event that App listens to, or hack it:
            const event = new CustomEvent('shell-cmd', { detail: input });
            window.dispatchEvent(event);
            setInput('');
        }
    };

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <div 
            className="flex flex-col h-full bg-[#0d1117] font-mono text-sm relative overflow-hidden"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Header */}
            <div className="h-8 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4 text-xs text-gray-500 select-none z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    <span>aussie@local</span>
                </div>
                <div className="flex gap-2">
                    <span>vsh</span>
                    <span className="opacity-50">|</span>
                    <span>{cwd}</span>
                </div>
            </div>

            {/* Blocks Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {blocks.length === 0 && (
                    <div className="opacity-30 text-gray-500 text-xs mb-4">
                        Welcome to Aussie VSH v1.0.0<br/>
                        Type 'help' for available commands.
                    </div>
                )}

                {blocks.map((block) => (
                    <div key={block.id} className="group relative">
                        {/* Command Block */}
                        {block.type === 'command' && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                    <span className="text-aussie-500 font-bold">➜</span>
                                    <span className="text-blue-400">{block.metadata?.cwd || cwd}</span>
                                </div>
                                <div className="text-gray-200 font-semibold pl-4">
                                    {block.content}
                                </div>
                            </div>
                        )}

                        {/* Tool / Output Blocks */}
                        {block.type === 'tool-call' && (
                            <div className="pl-4 border-l-2 border-aussie-500/30 my-2 py-1">
                                <div className="flex items-center gap-2 text-aussie-500 text-xs font-bold">
                                    <PlayCircle className="w-3 h-3" />
                                    {block.content}
                                </div>
                            </div>
                        )}

                        {block.type === 'ai-thought' && (
                            <div className="pl-4 border-l-2 border-purple-500/30 my-2 text-xs text-gray-400 italic">
                                <ReactMarkdown>{block.content}</ReactMarkdown>
                            </div>
                        )}

                        {block.type === 'output' && (
                            <div className="pl-4 text-gray-300 whitespace-pre-wrap text-xs leading-tight my-1">
                                {block.content}
                            </div>
                        )}

                        {block.type === 'error' && (
                            <div className="pl-4 text-red-400 text-xs whitespace-pre-wrap my-1">
                                {block.content}
                            </div>
                        )}
                    </div>
                ))}

                {/* Active Input Line */}
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-aussie-500 font-bold text-xs">➜</span>
                    <span className="text-blue-400 text-xs">{cwd}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 font-mono text-sm"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
                
                {/* Spacer for scrolling */}
                <div className="h-8"></div>
            </div>
        </div>
    );
};
