
import React from 'react';
import { Home, Code2, Globe, Bot, Github, Calendar, Rocket, Search, Settings, Briefcase } from 'lucide-react';
import { MainView } from '../types';

interface ActivityBarProps {
    activeView: MainView;
    onNavigate: (view: MainView) => void;
    onSpotlight: () => void;
}

const buttons = [
    { view: 'dashboard', icon: Home, tooltip: 'Dashboard' },
    { view: 'projects', icon: Briefcase, tooltip: 'Projects & Team' },
    { view: 'code', icon: Code2, tooltip: 'Code Workspace' },
    { view: 'browser', icon: Globe, tooltip: 'Web Browser' },
    { view: 'flow', icon: Bot, tooltip: 'Jules Flow' },
    { view: 'github', icon: Github, tooltip: 'GitHub' },
    { view: 'scheduler', icon: Calendar, tooltip: 'Scheduler' },
    { view: 'deploy', icon: Rocket, tooltip: 'Deploy' },
] as const;


export const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onNavigate, onSpotlight }) => {
    return (
        <div className="w-16 flex flex-col items-center py-5 bg-os-bg border-r border-os-border gap-2 z-30 shrink-0">
            <div className="w-10 h-10 bg-aussie-500 rounded-xl flex items-center justify-center text-os-bg font-bold text-lg mb-4 shadow-lg shadow-aussie-500/20 cursor-pointer hover:scale-105 transition-transform">
                A
            </div>
            
            <div className="flex flex-col gap-2 w-full items-center">
                {buttons.map(({ view, icon, tooltip }) => (
                     <ActivityButton 
                        key={view}
                        icon={icon} 
                        active={activeView === view} 
                        onClick={() => onNavigate(view)} 
                        tooltip={tooltip}
                    />
                ))}
            </div>

            <div className="flex-1" />
            
            <div className="flex flex-col gap-2 w-full items-center">
                <ActivityButton icon={Search} active={false} onClick={onSpotlight} tooltip="Search (Cmd+K)" />
                <ActivityButton icon={Settings} active={activeView === 'settings'} onClick={() => onNavigate('settings')} tooltip="Settings" />
            </div>
        </div>
    );
};

const ActivityButton = ({ icon: Icon, active, onClick, tooltip }: any) => (
    <div className="w-full h-12 flex items-center justify-center relative">
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-aussie-500 rounded-r-full shadow-[0_0_10px] shadow-aussie-500/50" />}
        <button 
            onClick={onClick}
            title={tooltip}
            className={`
                p-3 rounded-xl transition-all duration-200 group relative
                ${active 
                    ? 'text-aussie-500 bg-aussie-500/10' 
                    : 'text-os-textDim hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon className={`w-6 h-6 stroke-[1.5]`} />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-os-panel text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-os-border shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all">
                {tooltip}
            </div>
        </button>
    </div>
);
