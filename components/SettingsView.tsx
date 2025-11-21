
import React, { useState, useEffect } from 'react';
import { Settings, Github, Key, CheckCircle } from 'lucide-react';
import { github } from '../services/github';
import { notify } from '../services/notification';

export const SettingsView: React.FC = () => {
    const [pat, setPat] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (github.hasToken()) {
            github.getUser().then(setUser).catch(() => setUser(null));
        }
    }, []);

    const handleSave = async () => {
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

    return (
        <div className="h-full bg-os-bg flex flex-col">
            <div className="p-6 border-b border-os-border bg-os-panel flex items-center gap-3">
                <Settings className="w-6 h-6 text-os-textDim" />
                <div>
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <p className="text-sm text-os-textDim">Configure Aussie OS integrations and preferences.</p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
                <div className="bg-os-panel border border-os-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Github className="w-5 h-5" />
                        <h3 className="font-bold text-lg text-white">GitHub Integration</h3>
                    </div>
                    <p className="text-sm text-os-textDim mb-6">
                        Provide a Personal Access Token (PAT) with `repo` scope to enable live GitHub operations.
                        Your token is stored securely in your browser's local storage and never sent anywhere else.
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
                            <button
                                onClick={handleSave}
                                className="px-4 py-3 bg-aussie-500 hover:bg-aussie-600 text-white font-bold rounded-lg text-sm"
                            >
                                Connect
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
