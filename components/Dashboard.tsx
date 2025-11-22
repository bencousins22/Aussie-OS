
import React, { useState, useEffect } from 'react';
import { autoSetup } from '../services/autoSetup';
import { 
    Bot, DownloadCloud, Zap, Video, Github, Terminal, Layers, Play, 
    Cpu, HardDrive, Wifi, Activity, Clock, Cloud, Shield, Box, 
    ChevronRight, Star
} from 'lucide-react';
import { shell } from '../services/shell';

interface Props {
    onNavigate: (view: 'flow' | 'code' | 'explorer' | 'browser' | 'github') => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigate }) => {
    const [installed, setInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [time, setTime] = useState(new Date());
    const [stats, setStats] = useState({ cpu: 12, memory: 45, net: 1.2 });

    useEffect(() => {
        setInstalled(autoSetup.isInstalled());
        
        const timer = setInterval(() => setTime(new Date()), 1000);
        
        const statTimer = setInterval(() => {
            setStats({
                cpu: Math.floor(Math.random() * 30) + 10,
                memory: Math.floor(Math.random() * 10) + 40,
                net: Number((Math.random() * 5 + 0.5).toFixed(1))
            });
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(statTimer);
        };
    }, []);

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await autoSetup.installSystem();
            setInstalled(true);
        } catch (e) {
            alert('Installation Failed');
        } finally {
            setInstalling(false);
        }
    };

    const runQuickAction = async (action: string) => {
        if (action === 'swarm') {
            await shell.execute('gemini-flow hive-mind spawn --objective "Optimize System" --agents "architect,coder"');
        }
        if (action === 'video') {
            await shell.execute('gemini-flow veo3 --prompt "Cinematic drone shot of mars colony"');
        }
    };

    if (installing) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-os-bg text-white p-8">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-t-2 border-b-2 border-aussie-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-aussie-500" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold mb-3 text-white">System Initialization</h2>
                <p className="text-os-textDim font-mono text-sm tracking-wide">Hydrating Virtual Kernel...</p>
            </div>
        );
    }

    if (!installed) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-os-bg text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-aussie-900/20 via-os-bg to-os-bg z-0"></div>
                
                <div className="z-10 text-center max-w-2xl animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-aussie-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-aussie-500/20">
                        <Bot className="w-12 h-12 text-os-bg" />
                    </div>
                    
                    <h1 className="text-6xl font-bold mb-6 tracking-tight text-white">
                        Aussie OS
                    </h1>
                    <p className="text-xl text-os-textDim mb-10 leading-relaxed max-w-lg mx-auto font-light">
                        The Intelligent Autonomous Operating System.
                        <br/>Connect. Automate. Deploy.
                    </p>

                    <button 
                        onClick={handleInstall}
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold transition-all duration-200 bg-aussie-500 text-[#0f1216] text-lg rounded-2xl hover:bg-aussie-400 hover:scale-105 hover:shadow-2xl hover:shadow-aussie-500/30"
                    >
                        <DownloadCloud className="w-5 h-5 mr-3" />
                        Boot System
                    </button>
                </div>
            </div>
        );
    }

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="h-full bg-os-bg text-white overflow-y-auto custom-scrollbar relative">
            {/* Decorative Mint Glow */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-aussie-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto p-8 relative z-10">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">{getGreeting()}, User</h1>
                        <div className="flex items-center gap-6 text-sm text-os-textDim font-medium">
                            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="flex items-center gap-2"><Cloud className="w-4 h-4" /> Connected</span>
                            <span className="flex items-center gap-2 text-aussie-500 bg-aussie-500/10 px-2 py-0.5 rounded-full"><Shield className="w-3 h-3" /> Protected</span>
                        </div>
                    </div>
                    
                    {/* System Metrics */}
                    <div className="flex gap-3">
                        <MetricCard label="CPU" value={`${stats.cpu}%`} icon={Cpu} color="text-aussie-500" />
                        <MetricCard label="MEM" value={`${stats.memory}%`} icon={HardDrive} color="text-purple-400" />
                        <MetricCard label="NET" value={`${stats.net}`} icon={Wifi} color="text-blue-400" />
                    </div>
                </div>

                {/* Core Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <DashboardCard 
                        title="Jules Flow" 
                        desc="Visual Automator"
                        icon={Zap}
                        iconColor="text-yellow-400"
                        bg="bg-yellow-400/10"
                        onClick={() => onNavigate('flow')}
                    />
                    <DashboardCard 
                        title="Hive Mind" 
                        desc="Agent Swarm"
                        icon={Layers}
                        iconColor="text-blue-400"
                        bg="bg-blue-400/10"
                        onClick={() => runQuickAction('swarm')}
                    />
                    <DashboardCard 
                        title="GitHub Ops" 
                        desc="Source Control"
                        icon={Github}
                        iconColor="text-white"
                        bg="bg-white/10"
                        onClick={() => onNavigate('github')}
                    />
                    <DashboardCard 
                        title="Workspace" 
                        desc="Code Editor"
                        icon={Terminal}
                        iconColor="text-aussie-500"
                        bg="bg-aussie-500/10"
                        onClick={() => onNavigate('code')}
                    />
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Swarm Status Panel */}
                    <div className="lg:col-span-2 bg-os-panel border border-os-border rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-3 text-white">
                                <Activity className="w-5 h-5 text-aussie-500" /> 
                                System Activity
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <ActivityItem 
                                icon={Play} iconColor="text-green-400" bg="bg-green-400/10"
                                title="System Initialized" 
                                desc="Kernel loaded successfully. All modules active."
                                time="Just now" 
                            />
                            <ActivityItem 
                                icon={Github} iconColor="text-purple-400" bg="bg-purple-400/10"
                                title="Repo Synced" 
                                desc="gemini-flow repository hydrated from hydrator."
                                time="2m ago" 
                            />
                             <ActivityItem 
                                icon={Box} iconColor="text-orange-400" bg="bg-orange-400/10"
                                title="Packages Ready" 
                                desc="Dependency graph resolved via APM."
                                time="3m ago" 
                            />
                        </div>
                    </div>

                    {/* Quick Launch Panel */}
                    <div className="bg-os-panel border border-os-border rounded-2xl p-6 flex flex-col shadow-xl">
                         <h3 className="font-bold text-lg mb-6 flex items-center gap-3 text-white">
                            <Star className="w-5 h-5 text-yellow-400" /> 
                            Quick Access
                        </h3>
                        <div className="flex-1 space-y-2">
                            <QuickLink label="New Automation Flow" onClick={() => onNavigate('flow')} />
                            <QuickLink label="Browse Filesystem" onClick={() => onNavigate('code')} />
                            <QuickLink label="Open Web Browser" onClick={() => onNavigate('browser')} />
                            <QuickLink label="Manage Repository" onClick={() => onNavigate('github')} />
                        </div>
                        <div className="mt-6 pt-6 border-t border-os-border">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-aussie-500 flex items-center justify-center font-bold text-sm text-os-bg shadow-lg shadow-aussie-500/20">AU</div>
                                <div>
                                    <div className="text-sm font-bold text-white">Aussie Kernel</div>
                                    <div className="text-xs text-aussie-500 font-medium">v3.0.0 Online</div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-os-panel border border-os-border rounded-xl p-3 min-w-[110px] flex flex-col gap-1 shadow-lg">
        <div className="flex items-center gap-2 text-os-textDim text-[10px] font-bold uppercase tracking-wider">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            {label}
        </div>
        <div className="text-xl font-mono font-bold text-white">{value}</div>
    </div>
);

const DashboardCard = ({ title, desc, icon: Icon, bg, iconColor, onClick }: any) => (
    <div 
        onClick={onClick}
        className="group relative overflow-hidden bg-os-panel rounded-2xl border border-os-border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-aussie-500/30"
    >
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        
        <div className="relative z-10">
            <h3 className="font-bold text-base mb-0.5 text-white">{title}</h3>
            <p className="text-xs text-os-textDim font-medium">{desc}</p>
        </div>
        
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <ChevronRight className="w-4 h-4 text-aussie-500" />
        </div>
    </div>
);

const ActivityItem = ({ icon: Icon, iconColor, bg, title, desc, time }: any) => (
    <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-default">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-xs text-gray-200">{title}</h4>
                <span className="text-[10px] text-os-textDim font-medium">{time}</span>
            </div>
            <p className="text-xs text-os-textDim leading-relaxed truncate">{desc}</p>
        </div>
    </div>
);

const QuickLink = ({ label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-os-bg hover:bg-white/5 border border-os-border hover:border-aussie-500/30 text-xs text-gray-300 font-medium transition-all group"
    >
        <span>{label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-aussie-500 group-hover:translate-x-1 transition-all" />
    </button>
);
