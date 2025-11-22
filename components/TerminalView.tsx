
import React, { useEffect, useRef, useState } from 'react';
import { TerminalBlock } from '../types';
import { Terminal, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { shell } from '../services/shell';

interface Props {
    blocks: TerminalBlock[];
}

export const TerminalView: React.FC<Props> = ({ blocks }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('/workspace');
    
    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

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
        if (e.key === 'Enter') {
            if (!input.trim()) return;

            // Special internal command
            if (input.trim() === 'clear') {
                setInput('');
                // In a real app, we'd send a signal to clear blocks, but here we just reset input
                return;
            }

            // Add to history
            setHistory(prev => [...prev, input]);
            setHistoryIndex(-1);

            const event = new CustomEvent('shell-cmd', { detail: input });
            window.dispatchEvent(event);
            setInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = Math.min(history.length - 1, historyIndex + 1);
                if (historyIndex === history.length - 1) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setInput(history[newIndex]);
                }
            }
        }
    };

    return (
        <div 
            className="flex flex-col h-full bg-os-bg font-mono text-sm relative overflow-hidden border-t border-os-border"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Header */}
            <div className="h-8 bg-os-panel border-b border-os-border flex items-center justify-between px-4 text-xs text-os-textDim select-none z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-aussie-500" />
                    <span className="text-aussie-500/80 font-bold">aussie@local</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs font-bold text-os-textDim">vsh</span>
                    <span className="opacity-50">|</span>
                    <span className="text-aussie-400">{cwd}</span>
                </div>
            </div>

            {/* Blocks Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {blocks.length === 0 && (
                    <div className="opacity-30 text-gray-500 text-xs mb-4">
                        Welcome to Aussie VSH v3.0.0<br/>
                        Type 'help' for available commands.
                    </div>
                )}

                {blocks.map((block) => (
                    <div key={block.id} className="group relative">
                        {/* Command Block */}
                        {block.type === 'command' && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-aussie-500 font-bold">➜</span>
                                    <span className="text-aussie-400 opacity-80">{block.metadata?.cwd || cwd}</span>
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
                    <span className="text-aussie-400 text-xs opacity-80">{cwd}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 font-mono text-sm placeholder-gray-700 caret-aussie-500"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        placeholder=""
                    />
                </div>
                
                {/* Spacer for scrolling */}
                <div className="h-8"></div>
            </div>
        </div>
    );
};
