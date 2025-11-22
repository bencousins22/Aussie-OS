
import React, { useState, useEffect, useRef } from 'react';
import { fs } from '../services/fileSystem';
import { 
    Bot, Terminal, Globe, FileText, Rocket, Github, 
    Cpu, HardDrive, Wifi, Calendar, Zap, Folder, 
    MoreHorizontal, Trash, Maximize2, Image, Activity
} from 'lucide-react';
import { MainView } from '../types';
import { notify } from '../services/notification';

interface Props {
    onNavigate: (view: MainView) => void;
}

interface DesktopIcon {
    name: string;
    path: string;
    type: 'app' | 'file' | 'folder';
    appTarget?: MainView;
    x?: number; // For future drag n drop
    y?: number;
}

export const Dashboard: React.FC<Props> = ({ onNavigate }) => {
    const [icons, setIcons] = useState<DesktopIcon[]>([]);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [time, setTime] = useState(new Date());
    const [stats, setStats] = useState({ cpu: 12, ram: 45 });
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, visible: boolean}>({x:0, y:0, visible: false});

    // Kernel Loop: Refresh Desktop & Stats
    useEffect(() => {
        const refreshDesktop = () => {
            try {
                const files = fs.readDir('/home/aussie/Desktop');
                const desktopIcons: DesktopIcon[] = files.map(f => {
                    let type: DesktopIcon['type'] = f.type === 'directory' ? 'folder' : 'file';
                    let appTarget: MainView | undefined;

                    // Parse shortcuts
                    if (f.name.endsWith('.lnk')) {
                        const content = fs.readFile(f.path);
                        if (content.startsWith('app:')) {
                            type = 'app';
                            appTarget = content.split(':')[1] as MainView;
                        }
                    }

                    return {
                        name: f.name.replace('.lnk', ''),
                        path: f.path,
                        type,
                        appTarget
                    };
                });
                setIcons(desktopIcons);
            } catch (e) {
                console.error("Desktop crash", e);
            }
        };

        refreshDesktop();
        const timer = setInterval(() => setTime(new Date()), 1000);
        const statTimer = setInterval(() => {
            setStats({
                cpu: Math.floor(Math.random() * 30) + 10,
                ram: Math.floor(Math.random() * 15) + 35
            });
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(statTimer);
        };
    }, []);

    const handleIconClick = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setSelectedIcon(name);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleDoubleClick = (icon: DesktopIcon) => {
        if (icon.type === 'app' && icon.appTarget) {
            onNavigate(icon.appTarget);
        } else if (icon.type === 'file') {
            // For text files, simple alert/notify for now, or open in editor if we wired it
            const content = fs.readFile(icon.path);
            notify.info(icon.name, content.substring(0, 100));
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
    };

    const getIconComponent = (icon: DesktopIcon) => {
        switch (icon.name) {
            case 'Browser': return Globe;
            case 'Terminal': return Terminal;
            case 'Jules Flow': return Zap;
            case 'GitHub': return Github;
            case 'Deploy': return Rocket;
            case 'My Projects': return Folder;
            default: return icon.type === 'folder' ? Folder : FileText;
        }
    };

    const getIconColor = (icon: DesktopIcon) => {
        switch (icon.name) {
            case 'Browser': return 'text-blue-400';
            case 'Jules Flow': return 'text-yellow-400';
            case 'GitHub': return 'text-white';
            case 'Deploy': return 'text-purple-400';
            case 'Terminal': return 'text-aussie-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div 
            className="h-full w-full relative overflow-hidden bg-os-bg select-none"
            onClick={() => { setSelectedIcon(null); setContextMenu(prev => ({...prev, visible: false})); }}
            onContextMenu={handleRightClick}
        >
            {/* Desktop Wallpaper Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Abstract Tech Grid Background */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ 
                         backgroundImage: 'radial-gradient(#2a2e36 1px, transparent 1px)', 
                         backgroundSize: '30px 30px' 
                     }} 
                />
                {/* Vave Glow */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-aussie-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Desktop Icons Grid */}
            <div className="relative z-10 p-6 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] grid-rows-[repeat(auto-fill,minmax(100px,1fr))] gap-2 h-full content-start w-fit">
                {icons.map(icon => {
                    const IconComp = getIconComponent(icon);
                    const isSelected = selectedIcon === icon.name;
                    
                    return (
                        <div 
                            key={icon.name}
                            onClick={(e) => handleIconClick(e, icon.name)}
                            onDoubleClick={() => handleDoubleClick(icon)}
                            className={`
                                flex flex-col items-center justify-center gap-2 p-2 rounded-lg w-[100px] h-[100px] cursor-pointer border transition-all group
                                ${isSelected 
                                    ? 'bg-aussie-500/20 border-aussie-500/50 shadow-[0_0_15px_rgba(0,229,153,0.1)]' 
                                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}
                            `}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}`}>
                                <IconComp className={`w-8 h-8 ${getIconColor(icon)}`} strokeWidth={1.5} />
                            </div>
                            <span className={`
                                text-[11px] font-medium text-center leading-tight px-1 py-0.5 rounded
                                ${isSelected ? 'text-white bg-os-bg/80' : 'text-gray-300 group-hover:text-white text-shadow-sm'}
                            `}>
                                {icon.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Widgets Layer (Top Right) */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 w-72 pointer-events-none">
                {/* Clock Widget */}
                <div className="pointer-events-auto bg-os-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl hover:bg-os-panel/60 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold text-aussie-500 uppercase tracking-widest">Local Time</div>
                        <Calendar className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-400 font-medium mt-1">
                        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* System Status Widget */}
                <div className="pointer-events-auto bg-os-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl hover:bg-os-panel/60 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">System Health</div>
                        <Activity className="w-4 h-4 text-white/50" />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                                <span>CPU Load</span>
                                <span>{stats.cpu}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-aussie-600 to-aussie-400 transition-all duration-1000"
                                    style={{ width: `${stats.cpu}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                                <span>Memory</span>
                                <span>{stats.ram}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000"
                                    style={{ width: `${stats.ram}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Network Widget */}
                <div className="pointer-events-auto bg-os-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between hover:bg-os-panel/60 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">AussieNet 5G</div>
                            <div className="text-[10px] text-green-400">Connected • 1.2 Gbps</div>
                        </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>

            {/* Desktop Context Menu */}
            {contextMenu.visible && (
                <div 
                    className="fixed bg-os-panel/90 backdrop-blur-xl border border-os-border rounded-lg shadow-2xl py-1 w-48 z-50 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                        Desktop
                    </div>
                    <MenuItem label="New Folder" icon={Folder} />
                    <MenuItem label="New Text File" icon={FileText} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem label="Refresh" icon={Activity} onClick={() => { setIcons([...icons]); setContextMenu(prev => ({...prev, visible: false}))}} />
                    <MenuItem label="Change Wallpaper" icon={Image} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem label="System Settings" icon={Maximize2} onClick={() => onNavigate('settings')} />
                </div>
            )}
        </div>
    );
};

const MenuItem = ({ label, icon: Icon, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full px-3 py-2 flex items-center gap-3 text-sm text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left"
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);
