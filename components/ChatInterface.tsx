
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot, Paperclip, Sparkles, ArrowRight, Zap, Activity, Trash2, Plus } from 'lucide-react';
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
            <div className="flex-1 flex flex-col items-center justify-center text-os-textDim p-6 overflow-y-auto text-center">
                <div className="w-16 h-16 bg-os-panel rounded-2xl mb-6 border border-os-border shadow-lg flex items-center justify-center animate-in fade-in zoom-in duration-300">
                    <Bot className="w-8 h-8 text-aussie-500" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">How can I help?</h2>
                <p className="text-xs text-os-textDim leading-relaxed mb-8 max-w-[240px]">
                    I'm Aussie, your intelligent OS kernel.
                    I can write code, deploy apps, and browse the web.
                </p>

                <div className="flex flex-col gap-2 w-full max-w-sm">
                    <QuickAction onClick={() => onQuickAction?.("Run system diagnostics")} label="Run Diagnostics" />
                    <QuickAction onClick={() => onQuickAction?.("Switch to the browser view")} label="Open Browser" />
                    <QuickAction onClick={() => onQuickAction?.("Create a new Jules Flow")} label="New Automation Flow" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {messages.map((msg, index) => {
                // Check if previous message was same sender to group them visually
                const isSequence = index > 0 && messages[index-1].role === msg.role && messages[index-1].sender === msg.sender;
                
                return (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        {!isSequence && (
                            <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} mb-1 mt-2`}>
                                {msg.sender ? (
                                    <div className="flex items-center gap-1.5">
                                        {msg.sender === 'Hive Mind' ? <Activity className="w-3.5 h-3.5 text-purple-400" /> : 
                                         msg.sender === 'Jules' ? <Zap className="w-3.5 h-3.5 text-yellow-400" /> :
                                         <Bot className="w-3.5 h-3.5 text-blue-400" />}
                                        <span className="text-[10px] text-os-textDim font-bold uppercase tracking-wider opacity-70">{msg.sender}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {msg.role === 'user' ? 
                                            <div className="w-5 h-5 rounded-full bg-aussie-500 flex items-center justify-center"><User className="w-3 h-3 text-black" /></div> :
                                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Bot className="w-3 h-3 text-white" /></div>
                                        }
                                        <span className="text-[10px] text-os-textDim font-bold uppercase tracking-wider opacity-70">{msg.role === 'user' ? 'You' : 'Aussie'}</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-700">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        )}

                        <div className={`
                            max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative group border backdrop-blur-sm
                            ${msg.role === 'user' 
                                ? 'bg-aussie-500 text-[#0f1216] border-aussie-500 rounded-tr-sm font-medium shadow-[0_4px_15px_rgba(0,229,153,0.1)]' 
                                : msg.role === 'system' 
                                    ? 'bg-os-panel border-os-border text-gray-300 rounded-tl-sm'
                                    : 'bg-[#1c2128]/80 border-os-border text-gray-200 rounded-tl-sm shadow-lg'}
                        `}>
                             <div className={`prose max-w-none prose-p:my-1 prose-pre:rounded-lg text-[13px] ${msg.role === 'user' ? 'prose-p:text-[#0f1216] prose-strong:text-black' : 'prose-invert prose-pre:bg-[#0a0c10] prose-pre:border prose-pre:border-gray-800 prose-code:text-aussie-400 prose-code:bg-black/20 prose-code:px-1 prose-code:rounded prose-a:text-blue-400'}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>

                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`flex flex-wrap gap-2 mt-3 pt-2 border-t ${msg.role === 'user' ? 'border-black/10' : 'border-white/10'}`}>
                                    {msg.attachments.map((att, i) => (
                                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border ${msg.role === 'user' ? 'bg-black/10 border-black/5' : 'bg-black/20 border-white/10'}`}>
                                            <Paperclip className="w-3 h-3" />
                                            {att}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>
    );
};

const QuickAction = ({ label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3 bg-os-panel hover:bg-os-active border border-os-border hover:border-aussie-500/30 rounded-xl transition-all group shadow-sm hover:shadow-md"
    >
        <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-aussie-500" />
            <span className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">{label}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-aussie-500 group-hover:translate-x-1 transition-all" />
    </button>
);
