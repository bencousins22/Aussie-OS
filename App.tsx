
import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Play, Search, Settings, Terminal as TermIcon, FileText, Bot, Globe, Home, Calendar, Code2, Github, CheckCircle, Rocket, SplitSquareHorizontal, Columns } from 'lucide-react';
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
import { scheduler } from './services/scheduler';
import { MainView, EditorTab } from './types';

const App: React.FC = () => {
    // State
    const [activeView, setActiveView] = useState<MainView>('dashboard');
    const [input, setInput] = useState('');
    const [activePanel, setActivePanel] = useState<'terminal' | 'problems'>('terminal');
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
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

        window.addEventListener('shell-cmd', handleShellCmd);
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            scheduler.stop();
            window.removeEventListener('shell-cmd', handleShellCmd);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [runShellCommand]);

    // Derived State
    const activeTab = editorTabs.find(t => t.path === activeTabPath);

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim()) return;
        setInput('');
        await processUserMessage(text);
    };

    const handleNavigate = (view: MainView) => {
        if (view === 'code') {
            if (activeTabPath === null && editorTabs.length > 0) {
                setActiveTabPath(editorTabs[0].path);
            }
        }
        setActiveView(view);
    };

    return (
        <div className="flex h-screen w-screen bg-os-bg text-os-text overflow-hidden font-sans relative selection:bg-aussie-500/30">
            
            <NotificationCenter />
            <Spotlight 
                isOpen={showSpotlight} 
                onClose={() => setShowSpotlight(false)} 
                onNavigate={(view) => handleNavigate(view as MainView)}
            />

            <ActivityBar activeView={activeView} onNavigate={handleNavigate} onSpotlight={() => setShowSpotlight(true)} />

            <div className="flex flex-1 min-w-0">
                {/* PERSISTENT CHAT COLUMN (LEFT) */}
                <div className="w-[360px] flex flex-col bg-[#0f1115] border-r border-os-border shrink-0 z-20 shadow-2xl">
                    <div className="h-14 border-b border-os-border flex items-center justify-between px-5 bg-[#0f1115]">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-all ${isProcessing ? 'bg-yellow-400 shadow-yellow-400/50 animate-subtle-pulse' : 'bg-green-400 shadow-green-400/50'}`} />
                            <span className="font-bold text-sm text-white tracking-wide">Aussie Agent</span>
                        </div>
                        <AgentStatus state={workflowPhase} />
                    </div>
                    <ChatInterface messages={messages} onQuickAction={handleSendMessage} />
                    <div className="p-4 border-t border-os-border bg-[#0f1115]">
                        <div className="relative group">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                                }}
                                placeholder="Ask Aussie to do something..."
                                className="w-full bg-os-panel text-os-text text-sm p-4 pb-10 rounded-xl border border-os-border focus:border-aussie-500/50 outline-none resize-none h-32 font-medium shadow-inner transition-all"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={isProcessing || !input.trim()}
                                    className="p-2 bg-aussie-500 hover:bg-aussie-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
                                >
                                    <Play className="w-3 h-3 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN WORKSPACE (CENTER) */}
                <main className="flex-1 flex flex-col min-w-0 bg-os-bg relative overflow-hidden">
                    {activeView === 'dashboard' && <Dashboard onNavigate={(v) => handleNavigate(v as MainView)} />}
                    {activeView === 'browser' && <BrowserView />}
                    {activeView === 'flow' && <FlowEditor />}
                    {activeView === 'scheduler' && <TaskScheduler />}
                    {activeView === 'github' && <GitHubView />}
                    {activeView === 'settings' && <SettingsView />}
                    {activeView === 'deploy' && <DeployView />}
                    
                    {activeView === 'code' && (
                        <div className="flex h-full">
                            {/* Editor & Terminal Area (Flexible) */}
                            <div className="flex-1 flex flex-col min-w-0">
                                {/* Tab Bar */}
                                <div className="h-10 flex bg-os-bg border-b border-os-border justify-between">
                                    <div className="flex overflow-x-auto scrollbar-hide flex-1">
                                        {editorTabs.map(tab => (
                                            <div 
                                                key={tab.path}
                                                onClick={() => setActiveTabPath(tab.path)}
                                                className={`flex items-center gap-2 px-4 min-w-[140px] max-w-[240px] cursor-pointer border-r border-os-border select-none text-xs transition-colors group relative ${activeTabPath === tab.path ? 'bg-os-panel text-white' : 'text-os-textDim hover:bg-os-panel/50'}`}
                                            >
                                                {activeTabPath === tab.path && <div className="absolute top-0 left-0 right-0 h-0.5 bg-aussie-500" />}
                                                <FileText className={`w-3.5 h-3.5 ${activeTabPath === tab.path ? 'text-aussie-500' : 'opacity-50'}`} />
                                                <span className="truncate flex-1 font-medium">{tab.title}</span>
                                            </div>
                                        ))}
                                        {editorTabs.length === 0 && <div className="flex items-center justify-center px-6 text-xs text-os-textDim italic h-full">No open files</div>}
                                    </div>
                                    {/* Toolbar */}
                                    <div className="flex items-center px-2 border-l border-os-border bg-os-panel">
                                        <button 
                                            onClick={() => setShowPreview(!showPreview)}
                                            className={`p-1.5 rounded hover:bg-white/10 ${showPreview ? 'text-aussie-500 bg-white/5' : 'text-os-textDim'}`}
                                            title="Toggle Artifact Preview"
                                        >
                                            <Columns className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Editor Content */}
                                <div className="flex-1 flex min-h-0">
                                    <div className="flex-1 relative bg-[#0d1117]">
                                        <MonacoEditor filePath={activeTab?.path || null} language={activeTab?.language || 'plaintext'} />
                                    </div>
                                    
                                    {/* Split Preview Pane */}
                                    {showPreview && (
                                        <div className="w-1/2 border-l border-os-border bg-black flex flex-col animate-in slide-in-from-right duration-300">
                                            <div className="h-8 bg-os-panel border-b border-os-border flex items-center px-4 text-xs font-bold text-os-textDim uppercase tracking-wider">
                                                Artifact Preview
                                            </div>
                                            <div className="flex-1 relative">
                                                 {mediaFile ? (
                                                    <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />
                                                 ) : (
                                                    <BrowserView />
                                                 )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Terminal */}
                                <div className="h-[280px] border-t border-os-border flex flex-col bg-os-bg">
                                    <div className="h-9 flex items-center px-4 border-b border-os-border gap-6 bg-os-bg">
                                        <PanelTab title="Terminal" active={activePanel === 'terminal'} onClick={() => setActivePanel('terminal')} />
                                        <PanelTab title="Problems" active={activePanel === 'problems'} onClick={() => setActivePanel('problems')} />
                                    </div>
                                    <div className="flex-1 overflow-hidden bg-[#0d1117] relative">
                                        {activePanel === 'terminal' ? <TerminalView blocks={terminalBlocks} /> : (
                                            <div className="p-4 text-sm text-os-textDim flex flex-col items-center justify-center h-full opacity-50"><CheckCircle className="w-8 h-8 mb-2" />No problems detected.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File Explorer (Right) */}
                            <div className="w-64 border-l border-os-border flex flex-col bg-os-bg shrink-0">
                                <FileExplorer onFileClick={(path) => { openFile(path); handleNavigate('code'); }} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            {/* Modal Media Player (Fallback if not in preview mode) */}
            {!showPreview && <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />}
        </div>
    );
};

const PanelTab = ({ title, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`h-full text-[11px] uppercase tracking-wider font-bold border-b-2 transition-colors px-1 ${active ? 'border-aussie-500 text-white' : 'border-transparent text-os-textDim hover:text-white'}`}
    >
        {title}
    </button>
);

export default App;
