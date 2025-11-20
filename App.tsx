
import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Play, Search, Settings, Terminal as TermIcon, FileText, Bot, Globe, Home, Calendar, Code2, Github, CheckCircle } from 'lucide-react';
import { useAgent } from './services/useAgent';
import { MonacoEditor } from './components/MonacoEditor';
import { TerminalView } from './components/TerminalView';
import { ChatInterface } from './components/ChatInterface';
import { FileExplorer } from './components/FileExplorer';
import { AgentStatus } from './components/AgentStatus';
import { FlowEditor } from './components/FlowEditor';
import { BrowserView } from './components/BrowserView';
import { Dashboard } from './components/Dashboard';
import { MediaPlayer } from './components/MediaPlayer';
import { NotificationCenter } from './components/NotificationCenter';
import { Spotlight } from './components/Spotlight';
import { TaskScheduler } from './components/TaskScheduler';
import { GitHubView } from './components/GitHubView';
import { scheduler } from './services/scheduler';
import { MainView, EditorTab } from './types';

const App: React.FC = () => {
    // State
    const [activeView, setActiveView] = useState<MainView>('dashboard');
    const [input, setInput] = useState('');
    const [activePanel, setActivePanel] = useState<'terminal' | 'problems'>('terminal');
    const [showSpotlight, setShowSpotlight] = useState(false);
    
    // Agent Hook
    const {
        messages,
        isProcessing,
        workflowPhase,
        terminalBlocks,
        editorTabs,
        activeTabPath,
        setActiveTabPath,
        openFile,
        mediaFile,
        setMediaFile,
        processUserMessage,
        runShellCommand
    } = useAgent();

    // Effects
    useEffect(() => {
        scheduler.start();

        const handleShellCmd = (e: any) => runShellCommand(e.detail);
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
        };

        // Listen for "Open File" intent to switch view
        const handleViewSwitch = (e: any) => {
             // If the agent opens a file, switch to code view
             if (activeView !== 'code') setActiveView('code');
        };

        window.addEventListener('shell-cmd', handleShellCmd);
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            scheduler.stop();
            window.removeEventListener('shell-cmd', handleShellCmd);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [runShellCommand, activeView]);

    // Derived State
    const activeTab = editorTabs.find(t => t.path === activeTabPath);

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim()) return;
        setInput('');
        await processUserMessage(text);
    };

    const handleNavigate = (view: any) => {
        // Map the generic nav types to our new MainView types
        if (view === 'explorer') setActiveView('code');
        else if (view === 'chat') { /* Chat is always open */ }
        else setActiveView(view);
    };

    return (
        <div className="flex h-screen w-screen bg-os-bg text-os-text overflow-hidden font-sans relative selection:bg-aussie-500/30">
            
            {/* Global Overlay Components */}
            <NotificationCenter />
            <Spotlight 
                isOpen={showSpotlight} 
                onClose={() => setShowSpotlight(false)} 
                onNavigate={handleNavigate}
            />

            {/* 1. Activity Bar (Far Left) */}
            <div className="w-16 flex flex-col items-center py-6 bg-[#0b0d11] border-r border-white/5 gap-5 z-30 shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg shadow-blue-900/30 cursor-pointer hover:scale-105 transition-transform">
                    A
                </div>
                
                <div className="flex flex-col gap-3 w-full px-3">
                    <ActivityButton icon={Home} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} tooltip="Dashboard" />
                    <ActivityButton icon={Code2} active={activeView === 'code'} onClick={() => setActiveView('code')} tooltip="Code Workspace" />
                    <ActivityButton icon={Globe} active={activeView === 'browser'} onClick={() => setActiveView('browser')} tooltip="Web Browser" />
                    <ActivityButton icon={Bot} active={activeView === 'flow'} onClick={() => setActiveView('flow')} tooltip="Jules Flow" />
                    <ActivityButton icon={Github} active={activeView === 'github'} onClick={() => setActiveView('github')} tooltip="GitHub Ops" />
                    <ActivityButton icon={Calendar} active={activeView === 'scheduler'} onClick={() => setActiveView('scheduler')} tooltip="Scheduler" />
                </div>

                <div className="flex-1" />
                <ActivityButton icon={Search} active={showSpotlight} onClick={() => setShowSpotlight(true)} tooltip="Search (Cmd+K)" />
                <ActivityButton icon={Settings} active={false} onClick={() => {}} tooltip="Settings" />
            </div>

            {/* 2. Persistent Chat Column (Middle Left) */}
            <div className="w-[360px] flex flex-col bg-[#0f1115] border-r border-white/5 shrink-0 z-20 shadow-2xl">
                {/* Header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#0f1115]">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)] ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                        <span className="font-bold text-sm text-white tracking-wide">Aussie Agent</span>
                    </div>
                    <AgentStatus state={workflowPhase} />
                </div>

                {/* Messages Area */}
                <ChatInterface messages={messages} onQuickAction={handleSendMessage} />

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-[#0f1115]">
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                            }}
                            placeholder="Ask Aussie to do something..."
                            className="w-full bg-[#161b22] text-gray-200 text-sm p-4 pb-10 rounded-xl border border-white/5 focus:border-blue-500/50 outline-none resize-none h-32 font-medium shadow-inner transition-all"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-mono hidden md:inline opacity-50">CMD+ENTER</span>
                            <button 
                                onClick={() => handleSendMessage()}
                                disabled={isProcessing || !input.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
                            >
                                <Play className="w-3 h-3 fill-current" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Main Workspace (Right) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0f1115] relative overflow-hidden">
                
                {/* View Router */}
                {activeView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
                
                {activeView === 'browser' && <BrowserView />}
                
                {activeView === 'flow' && <FlowEditor />}
                
                {activeView === 'scheduler' && <TaskScheduler />}

                {activeView === 'github' && <GitHubView />}
                
                {activeView === 'code' && (
                    <div className="flex h-full">
                        {/* Sidebar: File Explorer */}
                        <div className="w-64 border-r border-white/5 flex flex-col bg-[#0b0d11]">
                             <FileExplorer onFileClick={(path) => { openFile(path); setActiveView('code'); }} />
                        </div>

                        {/* Main: Editor & Terminal */}
                        <div className="flex-1 flex flex-col min-w-0 bg-[#0f1115]">
                             {/* Tabs */}
                            <div className="h-10 flex bg-[#0f1115] border-b border-white/5 overflow-x-auto scrollbar-hide">
                                {editorTabs.map(tab => (
                                    <div 
                                        key={tab.path}
                                        onClick={() => setActiveTabPath(tab.path)}
                                        className={`
                                            flex items-center gap-2 px-4 min-w-[140px] max-w-[240px] cursor-pointer border-r border-white/5 select-none text-xs transition-colors group relative
                                            ${activeTabPath === tab.path ? 'bg-[#161b22] text-white' : 'text-gray-500 hover:bg-[#161b22]/50'}
                                        `}
                                    >
                                        {activeTabPath === tab.path && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />}
                                        <FileText className={`w-3.5 h-3.5 ${activeTabPath === tab.path ? 'text-blue-400' : 'opacity-50'}`} />
                                        <span className="truncate flex-1 font-medium">{tab.title}</span>
                                        <span className="opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-white/10 rounded p-0.5 transition-all">×</span>
                                    </div>
                                ))}
                                {editorTabs.length === 0 && (
                                    <div className="flex items-center justify-center px-6 text-xs text-gray-600 italic h-full">No open files</div>
                                )}
                            </div>

                            {/* Editor Surface */}
                            <div className="flex-1 relative bg-[#0f1115]">
                                <MonacoEditor 
                                    filePath={activeTab?.path || null} 
                                    language={activeTab?.language || 'plaintext'}
                                />
                            </div>

                            {/* Bottom Panel (Terminal) */}
                            <div className="h-[320px] border-t border-white/5 flex flex-col bg-[#0b0d11]">
                                <div className="h-9 flex items-center px-4 border-b border-white/5 gap-6 bg-[#0f1115]">
                                    <PanelTab title="Terminal" active={activePanel === 'terminal'} onClick={() => setActivePanel('terminal')} />
                                    <PanelTab title="Problems" active={activePanel === 'problems'} onClick={() => setActivePanel('problems')} />
                                    <div className="flex-1" />
                                </div>
                                <div className="flex-1 overflow-hidden bg-[#0b0d11] relative">
                                    {activePanel === 'terminal' ? (
                                        <TerminalView blocks={terminalBlocks} />
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500 flex flex-col items-center justify-center h-full opacity-50">
                                            <CheckCircle className="w-8 h-8 mb-2" />
                                            No problems detected in workspace.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Media Overlay */}
            <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />
        </div>
    );
};

const ActivityButton = ({ icon: Icon, active, onClick, tooltip }: any) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`
            p-3 rounded-xl transition-all duration-300 group relative
            ${active 
                ? 'text-white bg-white/10 shadow-inner' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}
        `}
    >
        <Icon className={`w-6 h-6 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
        {/* Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#161b22] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all">
            {tooltip}
        </div>
    </button>
);

const PanelTab = ({ title, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`
            h-full text-[11px] uppercase tracking-wider font-bold border-b-2 transition-colors px-1
            ${active ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}
        `}
    >
        {title}
    </button>
);

export default App;
