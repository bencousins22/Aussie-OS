
import React, { useState, useEffect } from 'react';
import { realGit } from '../services/gitReal';
import { GitStatusItem } from '../types';
import { Github, GitBranch, GitCommit, RefreshCw, Check, Plus, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { notify } from '../services/notification';
import { github } from '../services/github';

export const GitHubView: React.FC = () => {
    const [statusItems, setStatusItems] = useState<GitStatusItem[]>([]);
    const [commitMsg, setCommitMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastLog, setLastLog] = useState('');
    const [user, setUser] = useState<any>(null);

    const refresh = async () => {
        setIsLoading(true);
        try {
            if (github.hasToken()) {
                if(!user) {
                    const userData = await github.getUser();
                    setUser(userData);
                }
            } else {
                setUser(null);
            }
            const items = await realGit.getStatusJson('/workspace');
            setStatusItems(items);
            
            const logRes = await realGit.log('/workspace');
            setLastLog(logRes.stdout);
        } catch (e) {
            // Silently fail if not a git repo yet
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
        if(!user) return notify.error("Not Connected", "Please connect your GitHub account in Settings.");
        notify.info('Git Push', 'Pushing to remote...');
        // In a real env, we'd use isomorphic-git's push with an http client
        await new Promise(r => setTimeout(r, 1500));
        notify.success('Git Push', 'Pushed main to origin (simulated).');
    };

    return (
        <div className="h-full bg-os-bg flex flex-col text-os-text font-sans">
            <div className="h-14 border-b border-os-border flex items-center justify-between px-6 bg-os-panel">
                <div className="flex items-center gap-3">
                    <Github className="w-6 h-6" />
                    <h2 className="font-bold text-white text-lg">Source Control</h2>
                </div>
                {user && (
                     <div className="flex items-center gap-2">
                        <img src={user.avatar_url} className="w-6 h-6 rounded-full" />
                        <span className="text-xs font-bold text-os-text">{user.login}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {!user ? (
                     <div className="flex flex-col items-center justify-center h-full text-os-textDim text-center p-4 bg-os-panel border border-os-border rounded-xl">
                        <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Not Connected to GitHub</h3>
                        <p className="text-sm max-w-sm">Please go to Settings and add a Personal Access Token to enable live GitHub integration.</p>
                     </div>
                ) : (
                    <>
                    <div className="bg-os-panel rounded-xl border border-os-border p-4 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 font-mono text-sm text-blue-400 font-bold">
                                <GitBranch className="w-4 h-4" />
                                main
                            </div>
                            <div className="text-xs text-os-textDim">gemini-flow</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={handlePush} className="flex-1 py-2 bg-[#1f2428] hover:bg-[#2a3038] border border-os-border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                                <UploadCloud className="w-3 h-3" /> Push
                            </button>
                            <button onClick={refresh} className="flex-1 py-2 bg-[#1f2428] hover:bg-[#2a3038] border border-os-border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                                <DownloadCloud className="w-3 h-3" /> Fetch
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-sm font-bold text-os-textDim uppercase tracking-wider">Changes ({statusItems.length})</h3>
                        </div>
                        
                        <div className="bg-os-panel rounded-xl border border-os-border overflow-hidden min-h-[150px]">
                            {statusItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-os-textDim/50 gap-2">
                                    <Check className="w-6 h-6" />
                                    <span className="text-xs">No changes detected</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-os-border/50">
                                    {statusItems.map(item => (
                                        <div key={item.path} className="flex items-center justify-between p-3 hover:bg-white/5 group transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.status === 'new' ? 'bg-green-500/20 text-green-400' : item.status === 'modified' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {item.status.substring(0, 1)}
                                                </span>
                                                <span className="text-sm font-mono text-os-text truncate">{item.path}</span>
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

                    <div className="mb-6">
                        <textarea 
                            value={commitMsg}
                            onChange={e => setCommitMsg(e.target.value)}
                            placeholder="Commit message..."
                            className="w-full bg-os-panel border border-os-border rounded-xl p-3 text-sm outline-none focus:border-aussie-500 transition-colors min-h-[80px] resize-none"
                        />
                        <button 
                            onClick={handleCommit}
                            disabled={statusItems.length === 0 || !commitMsg}
                            className="w-full mt-2 py-2.5 bg-aussie-500 hover:bg-aussie-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                        >
                            Commit Changes
                        </button>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-os-textDim uppercase tracking-wider mb-3 px-1">Recent Activity</h3>
                        <div className="bg-os-panel rounded-xl border border-os-border p-4 text-xs font-mono text-os-textDim whitespace-pre-wrap overflow-hidden max-h-[200px] overflow-y-auto">
                            {lastLog || "No commits yet."}
                        </div>
                    </div>
                </>
            )}
            </div>
        </div>
    );
};
