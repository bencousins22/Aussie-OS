
import React, { useState, useEffect, useRef } from 'react';
import { fs } from '../services/fileSystem';
import { FileStat } from '../types';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw, Plus, Trash2, FilePlus, FolderPlus } from 'lucide-react';

interface Props {
    onFileClick: (path: string) => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    path: string;
    type: 'file' | 'directory';
}

const EXPANDED_KEY = 'aussie_os_expanded_folders';

export const FileExplorer: React.FC<Props> = ({ onFileClick }) => {
    const [items, setItems] = useState<FileStat[]>([]);
    // Initialize expansion state from localStorage
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(EXPANDED_KEY);
            return saved ? new Set(JSON.parse(saved)) : new Set(['/workspace']);
        } catch {
            return new Set(['/workspace']);
        }
    });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [creating, setCreating] = useState<{ parentPath: string, type: 'file' | 'directory' } | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const newItemInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = (path: string): FileStat[] => {
        try {
            return fs.readDir(path).sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
        } catch (e) {
            return [];
        }
    };

    const refresh = () => {
        // Trigger re-render by fetching (state update driven by parent or interval in real app usually, 
        // but here we force update by setting items if we were using items state for root, 
        // but we generate tree dynamically. 
        // We can force update by toggling a dummy state or just relying on the interval.)
        // In this component structure, fetchFiles is called during render for the tree.
        // We just need to trigger a re-render.
        setItems(fetchFiles('/workspace'));
    };

    // Persist expansion state
    useEffect(() => {
        try {
            localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(expandedFolders)));
        } catch (e) {
            console.error("Failed to save expansion state", e);
        }
    }, [expandedFolders]);

    useEffect(() => {
        refresh();
        const i = setInterval(refresh, 1000); // Poll for FS changes
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (creating && newItemInputRef.current) {
            newItemInputRef.current.focus();
        }
    }, [creating]);

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    const handleContextMenu = (e: React.MouseEvent, path: string, type: 'file' | 'directory') => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, path, type });
    };

    const handleCreate = (type: 'file' | 'directory') => {
        if (!contextMenu) return;
        // If clicked on file, use parent dir. If folder, use that folder.
        const parentPath = contextMenu.type === 'file' 
            ? contextMenu.path.substring(0, contextMenu.path.lastIndexOf('/')) 
            : contextMenu.path;
        
        setCreating({ parentPath, type });
        // Ensure parent is expanded so we see the new item input
        setExpandedFolders(prev => new Set(prev).add(parentPath));
        setContextMenu(null);
    };

    const handleDelete = () => {
        if (!contextMenu) return;
        if (confirm(`Delete ${contextMenu.path}?`)) {
            fs.delete(contextMenu.path);
            refresh();
        }
        setContextMenu(null);
    };

    const submitNewItem = () => {
        if (!creating || !newItemName.trim()) {
            setCreating(null);
            return;
        }
        const fullPath = `${creating.parentPath}/${newItemName.trim()}`;
        try {
            if (creating.type === 'file') {
                fs.writeFile(fullPath, '');
                onFileClick(fullPath);
            } else {
                fs.mkdir(fullPath);
                setExpandedFolders(prev => new Set(prev).add(fullPath));
            }
            refresh();
        } catch (e) {
            alert('Error creating item');
        }
        setCreating(null);
        setNewItemName('');
    };

    const FileTreeItem: React.FC<{ path: string, depth: number }> = ({ path, depth }) => {
        const files = fetchFiles(path);
        // Determine if we are creating something inside this folder
        const isCreatingHere = creating && creating.parentPath === path;

        return (
            <div className="flex flex-col">
                {files.map(file => (
                    <div key={file.path}>
                        <div 
                            className="flex items-center gap-1.5 py-1 px-2 hover:bg-os-panel cursor-pointer text-[13px] text-os-textDim hover:text-white select-none transition-colors group relative border-l-2 border-transparent hover:border-aussie-500/50"
                            style={{ paddingLeft: `${depth * 12 + 12}px` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (file.type === 'directory') toggleFolder(file.path);
                                else onFileClick(file.path);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, file.path, file.type)}
                        >
                            {file.type === 'directory' && (
                                expandedFolders.has(file.path) ? 
                                <ChevronDown className="w-3 h-3 text-os-textDim shrink-0" /> : 
                                <ChevronRight className="w-3 h-3 text-os-textDim shrink-0" />
                            )}
                            {file.type === 'directory' ? 
                                (expandedFolders.has(file.path) ? <FolderOpen className="w-4 h-4 text-aussie-500 shrink-0" /> : <Folder className="w-4 h-4 text-aussie-500 shrink-0" />) :
                                <File className="w-4 h-4 text-blue-400 shrink-0" />
                            }
                            <span className="truncate opacity-90 flex-1">{file.name}</span>
                        </div>
                        {file.type === 'directory' && expandedFolders.has(file.path) && (
                             <FileTreeItem path={file.path} depth={depth + 1} />
                        )}
                    </div>
                ))}
                
                {/* Inline Creation Input */}
                {isCreatingHere && (
                    <div className="flex items-center gap-1.5 py-1 px-2 animate-in fade-in slide-in-from-left-1 duration-200" style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}>
                        {creating.type === 'directory' ? <Folder className="w-4 h-4 text-aussie-500" /> : <File className="w-4 h-4 text-blue-400" />}
                        <input
                            ref={newItemInputRef}
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => {
                                if(e.key === 'Enter') submitNewItem();
                                if(e.key === 'Escape') setCreating(null);
                            }}
                            onBlur={submitNewItem}
                            className="bg-os-bg border border-aussie-500 rounded px-1 py-0.5 text-xs text-white outline-none w-full min-w-[100px]"
                            placeholder="Name..."
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-os-bg" onContextMenu={(e) => handleContextMenu(e, '/workspace', 'directory')}>
            <div className="flex items-center justify-between px-3 py-2 bg-os-panel border-b border-os-border shrink-0">
                <span className="text-[10px] font-bold text-os-textDim uppercase tracking-widest">Explorer</span>
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 cursor-pointer text-os-textDim hover:text-white transition-colors" onClick={refresh} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                <FileTreeItem path="/workspace" depth={0} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-[9999] w-40 bg-os-panel border border-os-border shadow-2xl rounded-lg py-1 flex flex-col animate-in fade-in zoom-in duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => handleCreate('file')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left">
                        <FilePlus className="w-3.5 h-3.5" /> New File
                    </button>
                    <button onClick={() => handleCreate('directory')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left">
                        <FolderPlus className="w-3.5 h-3.5" /> New Folder
                    </button>
                    <div className="h-px bg-os-border my-1" />
                    <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors text-left w-full">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};
