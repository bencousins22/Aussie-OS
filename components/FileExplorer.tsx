
import React, { useState, useEffect } from 'react';
import { fs } from '../services/fileSystem';
import { FileStat } from '../types';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw, Plus } from 'lucide-react';

interface Props {
    onFileClick: (path: string) => void;
}

export const FileExplorer: React.FC<Props> = ({ onFileClick }) => {
    const [items, setItems] = useState<FileStat[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/workspace']));

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
        setItems(fetchFiles('/workspace'));
    };

    useEffect(() => {
        refresh();
        const i = setInterval(refresh, 1000); // Poll for FS changes
        return () => clearInterval(i);
    }, []);

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    const FileTreeItem: React.FC<{ path: string, depth: number }> = ({ path, depth }) => {
        const files = fetchFiles(path);
        if (depth > 10) return null;

        return (
            <div className="flex flex-col">
                {files.map(file => (
                    <div key={file.path}>
                        <div 
                            className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#2a2d2e] cursor-pointer text-[13px] text-gray-300 select-none transition-colors"
                            style={{ paddingLeft: `${depth * 12 + 12}px` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (file.type === 'directory') toggleFolder(file.path);
                                else onFileClick(file.path);
                            }}
                        >
                            {file.type === 'directory' && (
                                expandedFolders.has(file.path) ? 
                                <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : 
                                <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                            )}
                            {file.type === 'directory' ? 
                                (expandedFolders.has(file.path) ? <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" /> : <Folder className="w-4 h-4 text-blue-400 shrink-0" />) :
                                <File className="w-4 h-4 text-gray-400 shrink-0" />
                            }
                            <span className="truncate opacity-90">{file.name}</span>
                        </div>
                        {file.type === 'directory' && expandedFolders.has(file.path) && (
                             <FileTreeItem path={file.path} depth={depth + 1} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-[#0d1117]">
            <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-gray-800">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Explorer</span>
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 cursor-pointer text-gray-500 hover:text-white" onClick={refresh} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2">
                <FileTreeItem path="/workspace" depth={0} />
            </div>
        </div>
    );
};
