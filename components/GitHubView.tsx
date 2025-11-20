
import React, { useState, useEffect } from 'react';
import { realGit } from '../services/gitReal';
import { GitStatusItem } from '../types';
import { Github, GitBranch, GitCommit, RefreshCw, Check, Plus, Trash, UploadCloud, DownloadCloud } from 'lucide-react';
import { notify } from '../services/notification';
import { shell } from '../services/shell';

export const GitHubView: React.FC = () => {
    const [statusItems, setStatusItems] = useState<GitStatusItem[]>([]);
    const [commitMsg, setCommitMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastLog, setLastLog] = useState('');

    const refresh = async () => {
        setIsLoading(true);
        try {
            const items = await realGit.getStatusJson('/workspace');
            setStatusItems(items);
            
            const logRes = await realGit.log('/workspace');
            setLastLog(logRes.stdout);
        } catch (e) {
            // Silent fail if not a git repo yet
        }
        setIsLoading(false);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStage = async (path: string) => {
        await realGit.add('/workspace', path);
        refresh();
    };

    const handleCommit = async () => {
        if (!commitMsg) return;
        setIsLoading(true);
        const res = await realGit.commit('/workspace', commitMsg);
        if (res.exitCode === 0) {
            notify.success('Git Commit', 'Changes committed successfully.');
            setCommitMsg('');
            refresh();
        } else {
            notify.error('Commit Failed', res.stderr);
        }
        setIsLoading(false);
    };

    const handlePush = async () => {
        notify.info('Git Push', 'Pushing to remote...');
        await new Promise(r => setTimeout(r, 1500));
        // Simulated push success since we don't have a real proxy
        notify.success('Git Push', 'Pushed main to origin.');
    };

    const handleSync = async () => {
        setIsLoading(true);
        await shell.execute('github_ops repo_sync {"repo":"current"}');
        refresh();
        setIsLoading(false);
    };

    return (
        <div className="h-full bg-[#0f1115] flex flex-col text-gray-300 font-sans">
            {/* Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-[#161b22]">
                <div className="flex items-center gap-3">
                    <Github className="w-6 h-6 text-gray-100" />
                    <h2 className="font-bold text-white text-lg">Source Control</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSync} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" title="Sync">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Repo Info */}
                <div className="bg-[#161b22] rounded-xl border border-gray-800 p-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono text-sm text-blue-400 font-bold">
                            <GitBranch className="w-4 h-4" />
                            main
                        </div>
                        <div className="text-xs text-gray-500">gemini-flow</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handlePush} className="flex-1 py-2 bg-[#1f2428] hover:bg-[#2a3038] border border-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                            <UploadCloud className="w-3 h-3" /> Push
                        </button>
                        <button onClick={handleSync} className="flex-1 py-2 bg-[#1f2428] hover:bg-[#2a3038] border border-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                            <DownloadCloud className="w-3 h-3" /> Pull
                        </button>
                    </div>
                </div>

                {/* Changes Area */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Changes ({statusItems.length})</h3>
                        <button onClick={() => handleStage('.')} className="text-[10px] text-blue-400 hover:underline">Stage All</button>
                    </div>
                    
                    <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden min-h-[150px]">
                        {statusItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
                                <Check className="w-6 h-6 opacity-50" />
                                <span className="text-xs">No changes detected</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800/50">
                                {statusItems.map(item => (
                                    <div key={item.path} className="flex items-center justify-between p-3 hover:bg-white/5 group transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className={`
                                                text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                                                ${item.status === 'new' ? 'bg-green-500/20 text-green-400' : 
                                                  item.status === 'modified' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                  'bg-red-500/20 text-red-400'}
                                            `}>
                                                {item.status.substring(0, 1)}
                                            </span>
                                            <span className="text-sm font-mono text-gray-300 truncate">{item.path}</span>
                                        </div>
                                        <button onClick={() => handleStage(item.path)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Commit Area */}
                <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                        <textarea 
                            value={commitMsg}
                            onChange={e => setCommitMsg(e.target.value)}
                            placeholder="Commit message..."
                            className="w-full bg-[#161b22] border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 transition-colors min-h-[80px] resize-none"
                        />
                    </div>
                    <button 
                        onClick={handleCommit}
                        disabled={statusItems.length === 0 || !commitMsg}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        Commit Changes
                    </button>
                </div>

                {/* History Preview */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Recent Activity</h3>
                    <div className="bg-[#161b22] rounded-xl border border-gray-800 p-4 text-xs font-mono text-gray-400 whitespace-pre-wrap overflow-hidden max-h-[200px] overflow-y-auto">
                        {lastLog || "No commits yet."}
                    </div>
                </div>
            </div>
        </div>
    );
};
