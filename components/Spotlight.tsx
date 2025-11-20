
import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, File, Command, Bot } from 'lucide-react';
import { shell } from '../services/shell';
import { fs } from '../services/fileSystem';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: any) => void;
}

export const Spotlight: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const searchResults = [];

        // 1. Commands
        if (query.startsWith('>')) {
            const cmd = query.slice(1).trim();
            searchResults.push({ type: 'command', label: `Run: ${cmd}`, action: () => shell.execute(cmd) });
        }

        // 2. Navigation
        if ('dashboard'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Dashboard', action: () => onNavigate('dashboard') });
        if ('editor'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Editor', action: () => onNavigate('explorer') });
        if ('browser'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Browser', action: () => onNavigate('browser') });
        if ('flow'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Flow Automator', action: () => onNavigate('flow') });

        // 3. Files
        try {
            const files = fs.readDir('/workspace'); // Simple flat search for demo
            files.forEach(f => {
                if (f.name.toLowerCase().includes(query.toLowerCase())) {
                    searchResults.push({ type: 'file', label: f.name, action: () => { /* Open file logic */ } });
                }
            });
        } catch(e) {}

        setResults(searchResults);
        setSelectedIndex(0);
    }, [query, onNavigate]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length);
            e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                results[selectedIndex].action();
                onClose();
            }
            e.preventDefault();
        }
        if (e.key === 'Escape') onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
            <div 
                className="w-[600px] bg-[#161b22] rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-gray-700 gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search files, run commands (>), or navigate..."
                        className="flex-1 bg-transparent outline-none text-lg text-white placeholder-gray-500"
                        autoFocus
                    />
                    <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">ESC</div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {results.length === 0 && query && (
                        <div className="p-4 text-center text-gray-500">No results found</div>
                    )}
                    {results.map((res, idx) => (
                        <div 
                            key={idx}
                            onClick={() => { res.action(); onClose(); }}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                ${idx === selectedIndex ? 'bg-aussie-600 text-white' : 'text-gray-300 hover:bg-gray-800'}
                            `}
                        >
                            {res.type === 'command' && <Terminal className="w-4 h-4 opacity-70" />}
                            {res.type === 'file' && <File className="w-4 h-4 opacity-70" />}
                            {res.type === 'nav' && <Command className="w-4 h-4 opacity-70" />}
                            <span className="text-sm font-medium">{res.label}</span>
                        </div>
                    ))}
                    {!query && (
                        <div className="p-8 text-center text-gray-600">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Type to search Aussie OS</p>
                            <p className="text-xs mt-2 opacity-50">Try "> echo hello"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
