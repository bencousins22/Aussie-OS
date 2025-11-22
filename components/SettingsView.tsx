
import React, { useState, useEffect } from 'react';
import { Settings, Github, Key, CheckCircle, Cloud, Box, Zap } from 'lucide-react';
import { github } from '../services/github';
import { deployment } from '../services/deployment';
import { notify } from '../services/notification';
import { DeploymentProvider } from '../types';

export const SettingsView: React.FC = () => {
    const [pat, setPat] = useState('');
    const [user, setUser] = useState<any>(null);
    
    // API Keys
    const [keys, setKeys] = useState({
        render: '',
        vercel: '',
        replit: '',
        netlify: ''
    });

    useEffect(() => {
        if (github.hasToken()) {
            github.getUser().then(setUser).catch(() => setUser(null));
        }
        setKeys({
            render: deployment.getApiKey('render') || '',
            vercel: deployment.getApiKey('vercel') || '',
            replit: deployment.getApiKey('replit') || '',
            netlify: deployment.getApiKey('netlify') || ''
        });
    }, []);

    const handleGitHubSave = async () => {
        if (!pat) return;
        github.saveToken(pat);
        try {
            const userData = await github.getUser();
            setUser(userData);
            notify.success('GitHub Connected', `Authenticated as ${userData.login}.`);
        } catch (e: any) {
            setUser(null);
            notify.error('Authentication Failed', e.message);
        }
    };

    const handleKeySave = (provider: DeploymentProvider, value: string) => {
        deployment.setApiKey(provider, value);
        setKeys(prev => ({ ...prev, [provider]: value }));
        notify.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Updated`, 'API Key saved successfully.');
    };

    return (
        <div className="h-full bg-os-bg flex flex-col">
            <div className="p-6 border-b border-os-border bg-os-panel flex items-center gap-3">
                <Settings className="w-6 h-6 text-os-textDim" />
                <div>
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <p className="text-sm text-os-textDim">Configure Aussie OS integrations and preferences.</p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* GitHub Section */}
                    <div className="bg-os-panel border border-os-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Github className="w-5 h-5" />
                            <h3 className="font-bold text-lg text-white">GitHub Integration</h3>
                        </div>
                        <p className="text-sm text-os-textDim mb-6">
                            Provide a Personal Access Token (PAT) with `repo` scope to enable live GitHub operations.
                        </p>

                        {user ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-4">
                                <img src={user.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="text-sm text-os-textDim">Connected as</div>
                                    <div className="font-bold text-white text-lg">{user.login}</div>
                                </div>
                                <CheckCircle className="w-6 h-6 text-green-400 ml-auto" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-textDim" />
                                    <input
                                        type="password"
                                        value={pat}
                                        onChange={e => setPat(e.target.value)}
                                        placeholder="Enter your GitHub PAT"
                                        className="w-full bg-os-bg border border-os-border rounded-lg p-3 pl-10 text-sm font-mono outline-none focus:border-aussie-500"
                                    />
                                </div>
                                <button onClick={handleGitHubSave} className="px-4 py-3 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] font-bold rounded-lg text-sm">
                                    Connect
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Deployment Providers */}
                    <div className="bg-os-panel border border-os-border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-white mb-6">Deployment Providers</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProviderInput 
                                label="Render" 
                                icon={Cloud} 
                                value={keys.render} 
                                onChange={(v: string) => handleKeySave('render', v)} 
                                placeholder="rnd_..."
                            />
                            <ProviderInput 
                                label="Vercel" 
                                icon={Zap} 
                                value={keys.vercel} 
                                onChange={(v: string) => handleKeySave('vercel', v)} 
                                placeholder="vc_..."
                            />
                            <ProviderInput 
                                label="Replit" 
                                icon={Box} 
                                value={keys.replit} 
                                onChange={(v: string) => handleKeySave('replit', v)} 
                                placeholder="repl_..."
                            />
                            <ProviderInput 
                                label="Netlify" 
                                icon={Cloud} 
                                value={keys.netlify} 
                                onChange={(v: string) => handleKeySave('netlify', v)} 
                                placeholder="nfp_..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProviderInput = ({ label, icon: Icon, value, onChange, placeholder }: any) => {
    const [val, setVal] = useState(value);
    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <Icon className="w-4 h-4 text-os-textDim" /> {label}
            </label>
            <div className="flex gap-2">
                <input 
                    type="password"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onBlur={() => onChange(val)}
                    placeholder={placeholder}
                    className="flex-1 bg-os-bg border border-os-border rounded-lg p-2 text-sm font-mono outline-none focus:border-aussie-500"
                />
            </div>
            <div className="h-1 w-full bg-transparent">
                {value ? <div className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Saved</div> : null}
            </div>
        </div>
    );
};
