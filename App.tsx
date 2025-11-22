
import React, { useState, useEffect } from 'react';
import { Play, Bot, FileText, CheckCircle, Columns, Mic, MicOff, X } from 'lucide-react';
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
import { SettingsView } from './components/SettingsView';
import { DeployView } from './components/DeployView';
import { ActivityBar } from './components/ActivityBar';
import { StatusBar } from './components/StatusBar';
import { scheduler } from './services/scheduler';
import { MainView, EditorTab } from './types';
import { Resizable } from './components/Resizable';
import { bus } from './services/eventBus';

const App: React.FC = () => {
    // State
    const [activeView, setActiveView] = useState<MainView>('dashboard');
    const [input, setInput] = useState('');
    const [activePanel, setActivePanel] = useState<'terminal' | 'problems'>('terminal');
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [showPreview, setShowPreview] = useState(false); // Artifact Split Pane
    const [booting, setBooting] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [chatOpen, setChatOpen] = useState(true); // Mobile Drawer / Desktop Visibility
    
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
        runShellCommand,
        isLive,
        toggleLive
    } = useAgent();

    const handleNavigate = (view: MainView) => {
        if (view === 'code') {
            if (activeTabPath === null && editorTabs.length > 0) {
                setActiveTabPath(editorTabs[0].path);
            }
        }
        setActiveView(view);
        // On mobile, navigating usually implies we want to see the view, so close chat
        if (window.innerWidth < 768) setChatOpen(false);
    };

    // Effects
    useEffect(() => {
        setTimeout(() => setBooting(false), 2500);
        scheduler.start();

        const handleShellCmd = (e: any) => runShellCommand(e.detail);
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
        };

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Auto-close chat on mobile, auto-open on desktop
            if (mobile) setChatOpen(false);
            else setChatOpen(true);
        };

        window.addEventListener('shell-cmd', handleShellCmd);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        
        const unsubBus = bus.subscribe((e) => {
            if (e.type === 'switch-view') handleNavigate(e.payload.view || 'dashboard');
            if (e.type === 'browser-navigate') {
                // If in code view, open preview pane; otherwise switch to browser view
                if (activeView === 'code') setShowPreview(true);
                else handleNavigate('browser');
            }
        });

        handleResize(); // Init
        
        return () => {
            scheduler.stop();
            window.removeEventListener('shell-cmd', handleShellCmd);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            unsubBus();
        };
    }, [activeView, runShellCommand, editorTabs, activeTabPath]);

    // Derived State
    const activeTab = editorTabs.find(t => t.path === activeTabPath);

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim()) return;
        setInput('');
        // On mobile, sending a message usually requires seeing the response, so keep chat open
        await processUserMessage(text);
    };

    if (booting) {
        return (
            <div className="h-screen w-screen bg-os-bg text-aussie-500 font-mono p-10 flex flex-col justify-end pb-20 select-none cursor-wait overflow-hidden">
                <div className="text-lg space-y-2 font-bold">
                    <div className="animate-pulse text-aussie-500">&gt; POWER_ON_SELF_TEST... <span className="text-white">OK</span></div>
                    <div className="animate-pulse delay-75 text-aussie-500">&gt; LOADING_KERNEL... <span className="text-white">OK</span></div>
                    <div className="animate-pulse delay-150 text-aussie-500">&gt; MOUNTING_VFS... <span className="text-white">OK</span></div>
                    <div className="animate-pulse delay-300 text-aussie-500">&gt; CONNECTING_NEURAL_UPLINK... <span className="text-white">OK</span></div>
                    <div className="animate-pulse delay-500 text-white mt-4">&gt; STARTING_AUSSIE_OS...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-os-bg text-os-text overflow-hidden font-sans relative selection:bg-aussie-500/30 selection:text-black">
            
            <div className="flex-1 flex min-h-0 relative">
                <NotificationCenter />
                <Spotlight 
                    isOpen={showSpotlight} 
                    onClose={() => setShowSpotlight(false)} 
                    onNavigate={(view) => handleNavigate(view as MainView)}
                />

                {/* Activity Bar: Left on Desktop, Bottom on Mobile */}
                <div className={`
                    ${isMobile 
                        ? 'fixed bottom-0 left-0 right-0 h-16 flex-row border-t border-os-border bg-[#0f1216] px-4 justify-around' 
                        : 'flex flex-col w-16 border-r border-os-border bg-[#0f1216] py-4 items-center'} 
                    z-50 flex shrink-0 shadow-2xl
                `}>
                    <ActivityBar activeView={activeView} onNavigate={handleNavigate} onSpotlight={() => setShowSpotlight(true)} />
                </div>

                {/* Main Horizontal Layout */}
                <div className={`flex flex-1 min-w-0 relative ${isMobile ? 'pb-16' : ''}`}>
                    
                    {/* Persistent Chat Column */}
                    {/* On Mobile: It's a full screen drawer z-40. On Desktop: It's a resizable column. */}
                    <div 
                        className={`
                            ${isMobile 
                                ? `absolute inset-0 z-40 bg-[#0f1216] transition-transform duration-300 ${chatOpen ? 'translate-x-0' : '-translate-x-full'}` 
                                : `relative flex flex-row bg-[#0f1216] ${chatOpen ? 'flex' : 'hidden'}`}
                            flex shrink-0 shadow-2xl
                        `}
                        style={!isMobile ? { width: 360 } : {}}
                    >
                        {/* Chat Content Column */}
                        <div className="flex flex-col flex-1 min-w-0 h-full border-r border-os-border bg-[#0f1216]">
                            {/* Chat Header */}
                            <div className="h-12 border-b border-os-border flex items-center justify-between px-4 bg-os-panel shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] transition-all ${isProcessing || isLive ? 'bg-aussie-500 animate-pulse shadow-aussie-500' : 'bg-aussie-500 shadow-aussie-500/50'}`} />
                                    <span className="font-bold text-sm text-white tracking-wide">Aussie Agent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AgentStatus state={workflowPhase} />
                                    {isMobile && (
                                        <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Chat Messages */}
                            <ChatInterface messages={messages} onQuickAction={handleSendMessage} />
                            
                            {/* Chat Input */}
                            <div className="p-4 border-t border-os-border bg-[#0f1216] shrink-0">
                                <div className="relative group">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                                        }}
                                        placeholder={isLive ? "Listening..." : "Ask Aussie..."}
                                        disabled={isLive}
                                        className="w-full bg-os-panel text-os-text text-sm p-4 pb-12 rounded-xl border border-os-border focus:border-aussie-500/50 outline-none resize-none h-32 font-medium shadow-inner transition-all disabled:opacity-50 placeholder-gray-600"
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <button
                                            onClick={toggleLive}
                                            className={`p-2 rounded-lg transition-all ${isLive ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                                            title="Toggle Gemini Live (Voice Mode)"
                                        >
                                            {isLive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleSendMessage()}
                                            disabled={isProcessing || isLive || !input.trim()}
                                            className="p-2 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-aussie-500/20"
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Resizer Handle (Desktop Only) */}
                        {!isMobile && (
                            <Resizable direction="horizontal" mode="parent" minSize={300} maxSize={600} />
                        )}
                    </div>

                    {/* MAIN WORKSPACE (CENTER/RIGHT) */}
                    <main className="flex-1 flex flex-col min-w-0 bg-os-bg relative overflow-hidden">
                        {/* Workspace Header */}
                        <div className="h-10 bg-[#0d1117] border-b border-os-border flex items-center justify-between px-4 shrink-0 select-none">
                            <div className="flex items-center gap-3">
                                {isMobile && !chatOpen && (
                                    <button onClick={() => setChatOpen(true)} className="p-1 hover:bg-white/10 rounded text-aussie-500">
                                        <Bot className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex items-center text-xs text-os-textDim gap-2">
                                    <span className="font-bold text-white tracking-tight">Aussie OS</span>
                                    <span className="opacity-30">/</span>
                                    <span className="font-medium text-aussie-500 uppercase tracking-wider">{activeView}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${isLive ? 'border-red-500/50 bg-red-500/10' : 'border-aussie-500/20 bg-aussie-500/5'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-aussie-500'}`}></div>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isLive ? 'text-red-400' : 'text-aussie-500'}`}>
                                        {isLive ? 'Live Voice' : 'Online'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Content */}
                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            {activeView === 'dashboard' && <Dashboard onNavigate={(v) => handleNavigate(v as MainView)} />}
                            {activeView === 'browser' && <BrowserView />}
                            {activeView === 'flow' && <FlowEditor />}
                            {activeView === 'scheduler' && <TaskScheduler />}
                            {activeView === 'github' && <GitHubView />}
                            {activeView === 'settings' && <SettingsView />}
                            {activeView === 'deploy' && <DeployView />}
                            
                            {/* Integrated Code Workspace */}
                            {activeView === 'code' && (
                                <div className="flex h-full w-full">
                                    {/* Editor + Terminal Column (Flex-1) */}
                                    <div className="flex-1 flex flex-col min-w-0 relative">
                                        {/* Tabs */}
                                        <div className="h-9 flex bg-[#0f1216] border-b border-os-border shrink-0">
                                            <div className="flex overflow-x-auto scrollbar-hide flex-1">
                                                {editorTabs.map(tab => (
                                                    <div 
                                                        key={tab.path}
                                                        onClick={() => setActiveTabPath(tab.path)}
                                                        className={`
                                                            flex items-center gap-2 px-4 min-w-[120px] max-w-[200px] cursor-pointer border-r border-os-border select-none text-[11px] transition-all group relative
                                                            ${activeTabPath === tab.path ? 'bg-os-panel text-white font-medium' : 'text-os-textDim hover:bg-os-panel/50 hover:text-gray-300'}
                                                        `}
                                                    >
                                                        {activeTabPath === tab.path && <div className="absolute top-0 left-0 right-0 h-[2px] bg-aussie-500" />}
                                                        <FileText className={`w-3.5 h-3.5 ${activeTabPath === tab.path ? 'text-aussie-500' : 'opacity-50'}`} />
                                                        <span className="truncate flex-1">{tab.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center px-2 border-l border-os-border bg-[#0f1216]">
                                                <button 
                                                    onClick={() => setShowPreview(!showPreview)}
                                                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${showPreview ? 'text-aussie-500 bg-aussie-500/10' : 'text-os-textDim'}`}
                                                    title="Toggle Split Preview"
                                                >
                                                    <Columns className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Editor Surface (Top Half) */}
                                        <div className="flex-1 flex min-h-0 relative bg-[#0d1117]">
                                            {/* Monaco Editor */}
                                            <div className="flex-1 relative min-w-0">
                                                <MonacoEditor filePath={activeTab?.path || null} language={activeTab?.language || 'plaintext'} />
                                            </div>
                                            
                                            {/* Split Preview Pane (Browser/Media) */}
                                            {showPreview && (
                                                <>
                                                    {/* Resizer for Preview Pane */}
                                                    {!isMobile && (
                                                        <Resizable direction="horizontal" mode="next" reversed={true} />
                                                    )}
                                                    <div className="w-[400px] flex flex-col border-l border-os-border bg-[#0f1216] relative z-10 min-w-[300px] max-w-[80%]">
                                                        <div className="h-8 bg-os-panel border-b border-os-border flex items-center px-4 justify-between shrink-0">
                                                            <span className="text-[10px] font-bold text-aussie-500 uppercase tracking-wider">Artifact Preview</span>
                                                            <button onClick={() => setShowPreview(false)}><X className="w-3 h-3 text-gray-500 hover:text-white"/></button>
                                                        </div>
                                                        <div className="flex-1 relative overflow-hidden">
                                                            {mediaFile ? (
                                                                <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />
                                                            ) : (
                                                                <BrowserView />
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Terminal Area (Bottom Half) */}
                                        {!isMobile && <Resizable direction="vertical" mode="next" reversed={true} />}
                                        <div className="h-[280px] flex flex-col bg-os-bg shrink-0 min-h-[100px] max-h-[80vh]">
                                            <div className="h-8 flex items-center px-2 border-b border-os-border gap-4 bg-os-panel shrink-0">
                                                <PanelTab title="Terminal" active={activePanel === 'terminal'} onClick={() => setActivePanel('terminal')} />
                                                <PanelTab title="Problems" active={activePanel === 'problems'} onClick={() => setActivePanel('problems')} />
                                            </div>
                                            <div className="flex-1 overflow-hidden bg-os-bg relative">
                                                {activePanel === 'terminal' ? <TerminalView blocks={terminalBlocks} /> : (
                                                    <div className="p-8 text-center text-os-textDim flex flex-col items-center justify-center h-full opacity-50">
                                                        <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                                                        <span className="text-xs">No problems detected in workspace.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Explorer (Right Side) */}
                                    {!isMobile && (
                                        <>
                                            <Resizable direction="horizontal" mode="next" reversed={true} />
                                            <div className="w-64 border-l border-os-border flex flex-col bg-os-bg shrink-0 min-w-[200px] max-w-[500px]">
                                                <FileExplorer onFileClick={(path) => { openFile(path); handleNavigate('code'); }} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
                
                {/* Modal Media Player (Fallback if preview pane closed) */}
                {!showPreview && mediaFile && activeView !== 'code' && (
                    <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />
                )}
            </div>
            
            {/* Global Status Bar (Bottom) */}
            {!isMobile && <StatusBar activeTab={activeTab} />}
        </div>
    );
};

const PanelTab = ({ title, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`
            h-full text-[10px] uppercase tracking-wider font-bold border-b-[2px] transition-all px-3
            ${active ? 'border-aussie-500 text-white bg-white/5' : 'border-transparent text-os-textDim hover:text-white hover:bg-white/5'}
        `}
    >
        {title}
    </button>
);

export default App;
