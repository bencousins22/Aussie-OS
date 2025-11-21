
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot, Paperclip, Sparkles, ArrowRight, Zap, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    messages: Message[];
    onQuickAction?: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onQuickAction }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 overflow-y-auto text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-6 border border-gray-700 shadow-inner flex items-center justify-center">
                    <Bot className="w-8 h-8 text-aussie-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-200 mb-2">System Online</h2>
                <p className="text-xs text-gray-500 leading-relaxed mb-8 max-w-[200px]">
                    Aussie OS Kernel v3.0 ready.
                    <br/>Select a task to begin.
                </p>

                <div className="flex flex-col gap-2 w-full">
                    <QuickAction onClick={() => onQuickAction?.("Run system diagnostics")} label="Run Diagnostics" />
                    <QuickAction onClick={() => onQuickAction?.("Open the Browser")} label="Open Browser" />
                    <QuickAction onClick={() => onQuickAction?.("Create a new Jules Flow")} label="New Automation Flow" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                    <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.sender ? (
                            <div className="flex items-center gap-1">
                                {msg.sender === 'Hive Mind' ? <Activity className="w-3 h-3 text-purple-400" /> : 
                                 msg.sender === 'Jules' ? <Zap className="w-3 h-3 text-yellow-400" /> :
                                 <Bot className="w-3 h-3 text-blue-400" />}
                                <span className="text-[10px] text-gray-400 font-bold">{msg.sender}</span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-gray-500 font-mono uppercase">{msg.role === 'user' ? 'You' : 'Aussie'}</span>
                        )}
                        <span className="text-[10px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div className={`
                        max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative group
                        ${msg.role === 'user' 
                            ? 'bg-[#2f81f7] text-white rounded-tr-none' 
                            : msg.role === 'system' 
                                ? 'bg-[#161b22] border border-gray-700 text-gray-300 rounded-tl-none'
                                : 'bg-[#1f2428] text-gray-300 border border-gray-800 rounded-tl-none'}
                    `}>
                         <div className="prose prose-invert max-w-none prose-p:my-1 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-code:text-aussie-400 prose-code:bg-black/20 prose-code:px-1 prose-code:rounded prose-a:text-blue-400 text-[13px]">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/10">
                                {msg.attachments.map((att, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded text-[10px] border border-white/10">
                                        <Paperclip className="w-3 h-3" />
                                        {att}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

const QuickAction = ({ label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1f2428] hover:bg-[#2a3038] border border-gray-800 hover:border-gray-700 rounded-lg transition-all group"
    >
        <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-aussie-500" />
            <span className="text-xs text-gray-300 font-medium">{label}</span>
        </div>
        <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-aussie-500 group-hover:translate-x-1 transition-all" />
    </button>
);
