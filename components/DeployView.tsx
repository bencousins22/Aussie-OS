
import React, { useState, useEffect } from 'react';
import { Rocket, Github, Terminal, CheckCircle, ExternalLink, Play } from 'lucide-react';
import { render } from '../services/render';
import { DeployState, DeployLog, DeployStatus } from '../types';

const statusConfig: Record<DeployStatus, { label: string; color: string; desc: string }> = {
    pending: { label: 'Pending', color: 'bg-gray-500', desc: 'Waiting to start...' },
    build_started: { label: 'Building', color: 'bg-yellow-500 animate-pulse', desc: 'Build process initiated.' },
    build_success: { label: 'Build OK', color: 'bg-blue-500', desc: 'Build artifacts created.' },
    deploy_started: { label: 'Deploying', color: 'bg-purple-500 animate-pulse', desc: 'Pushing to global infrastructure.' },
    live: { label: 'Live', color: 'bg-green-500', desc: 'Your service is now online.' },
    failed: { label: 'Failed', color: 'bg-red-500', desc: 'Deployment encountered an error.' },
    canceled: { label: 'Canceled', color: 'bg-gray-700', desc: 'Deployment was canceled.' },
};

export const DeployView: React.FC = () => {
    const [repo, setRepo] = useState('https://github.com/bencousins22/Aussie-OS.git');
    const [deployState, setDeployState] = useState<DeployState>(render.getState());
    const [isDeploying, setIsDeploying] = useState(false);

    useEffect(() => {
        const unsubscribe = render.subscribe(setDeployState);
        return () => unsubscribe();
    }, []);

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            await render.createService(repo);
        } catch(e: any) {
            console.error(e);
        }
    };
    
    useEffect(() => {
        if(deployState.status === 'live' || deployState.status === 'failed' || deployState.status === 'canceled') {
            setIsDeploying(false);
        }
    }, [deployState.status]);

    return (
        <div className="h-full bg-os-bg flex flex-col">
            <div className="p-6 border-b border-os-border bg-os-panel flex items-center gap-3">
                <Rocket className="w-6 h-6 text-purple-400" />
                <div>
                    <h2 className="text-xl font-bold text-white">Deploy to Render.com</h2>
                    <p className="text-sm text-os-textDim">Deploy your GitHub projects directly from Aussie OS.</p>
                </div>
            </div>

            <div className="flex-1 p-8 grid grid-cols-3 gap-8 overflow-hidden">
                {/* Left: Config */}
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-os-panel border border-os-border rounded-xl p-4">
                         <div className="flex items-center gap-2 mb-2">
                             <Github className="w-4 h-4 text-os-textDim" />
                             <label className="text-sm font-bold text-white">GitHub Repository</label>
                         </div>
                         <input
                            value={repo}
                            onChange={e => setRepo(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            className="w-full bg-os-bg border border-os-border rounded-lg p-2 text-sm font-mono outline-none focus:border-aussie-500"
                        />
                    </div>
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying || !repo}
                        className="w-full py-3 bg-aussie-500 hover:bg-aussie-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                       {isDeploying ? 'Deploying...' : <><Play className="w-4 h-4 fill-current"/> Deploy Service</>}
                    </button>
                    {deployState.status === 'live' && (
                         <a href={deployState.url || '#'} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2">
                             <ExternalLink className="w-4 h-4" /> Visit Site
                         </a>
                    )}
                </div>

                {/* Right: Status & Logs */}
                <div className="col-span-2 bg-os-panel border border-os-border rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-os-border">
                        <h3 className="font-bold text-white">Deployment Status</h3>
                        <p className="text-xs text-os-textDim font-mono mt-1">{deployState.id || 'No active deployment'}</p>
                    </div>
                    
                    {/* Timeline */}
                    <div className="p-6 flex justify-between border-b border-os-border">
                        {Object.keys(statusConfig).filter(s => s !== 'pending').map((statusKey, idx) => {
                            const currentIdx = Object.keys(statusConfig).indexOf(deployState.status);
                            const isActive = deployState.status === statusKey;
                            const isDone = idx < currentIdx;
                            
                            return (
                                <div key={statusKey} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full transition-colors ${isActive || isDone ? statusConfig[statusKey as DeployStatus].color : 'bg-os-border'}`}></div>
                                    <span className={`text-xs font-bold ${isActive || isDone ? 'text-white' : 'text-os-textDim'}`}>{statusConfig[statusKey as DeployStatus].label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Logs */}
                    <div className="flex-1 bg-black/50 p-4 overflow-y-auto font-mono text-xs text-os-textDim relative">
                        {deployState.logs.length === 0 && <div className="opacity-50">Awaiting deployment to start logs...</div>}
                        {deployState.logs.map(log => (
                            <div key={log.timestamp} className="flex gap-4">
                                <span className="opacity-30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="flex-1 text-gray-400">{log.line}</span>
                            </div>
                        ))}
                         <div className="absolute bottom-4 right-4 p-2 rounded-lg bg-os-bg border border-os-border flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusConfig[deployState.status].color}`}></div>
                            <span className="text-xs font-bold text-white">{statusConfig[deployState.status].label}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
