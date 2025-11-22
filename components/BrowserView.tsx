
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Search, Globe, MousePointer2 } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { bus } from '../services/eventBus';
import { browserAutomation } from '../services/browserAutomation';

export const BrowserView: React.FC = () => {
    const [url, setUrl] = useState('http://localhost:3000/index.html');
    const [iframeContent, setIframeContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ghostCursor, setGhostCursor] = useState<{x: number, y: number, visible: boolean}>({ x: 0, y: 0, visible: false });
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const loadContent = () => {
        setIsLoading(true);
        try {
            let content = '';
            // Simulate localhost routing
            if (url.includes('localhost') || url.startsWith('file://')) {
                // Extract path
                const path = url.replace('http://localhost:3000', '/workspace').replace('file://', '');
                
                if (fs.exists(path)) {
                    content = fs.readFile(path);
                    // Inject simple script to catch errors
                    content += `
                        <script>
                            window.onerror = function(msg) { console.error("Browser Error:", msg); };
                        </script>
                    `;
                } else {
                    content = `<h1>404 Not Found</h1><p>The file ${path} does not exist.</p>`;
                }
            } else {
                // External URL mock
                content = `
                    <div style="font-family: sans-serif; padding: 2rem;">
                        <h1>External Site: ${url}</h1>
                        <p>External access is simulated in this environment.</p>
                        <button style="padding: 10px 20px; background: #00e599; color: #0f1216; border: none; border-radius: 6px; font-weight: bold;">
                            Sign Up
                        </button>
                        <div style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
                            <h3>Latest News</h3>
                            <ul>
                                <li>Aussie OS 2.0 Released</li>
                                <li>Gemini Flow Integration complete</li>
                            </ul>
                        </div>
                    </div>
                `;
            }
            setIframeContent(content);
            // Inform automation service about content
            // Strip HTML tags for "scraping" simulation
            browserAutomation.setPageContent(content.replace(/<[^>]*>?/gm, ''));

        } catch (e) {
            setIframeContent(`<h1>Error</h1><p>${e}</p>`);
        }
        setTimeout(() => setIsLoading(false), 500);
    };

    useEffect(() => {
        loadContent();
        
        // Subscribe to Hot Reload & Automation Events
        const unsubscribe = bus.subscribe((e) => {
            if (e.type === 'file-change') {
                if (e.payload.path.endsWith('.html') || e.payload.path.endsWith('.css') || e.payload.path.endsWith('.js')) {
                     loadContent();
                }
            }
            if (e.type === 'browser-navigate') {
                setUrl(e.payload.url);
            }
            if (e.type === 'browser-action') {
                if (e.payload.type === 'click') {
                    // Simulate Ghost Cursor
                    setGhostCursor({ x: Math.random() * 400 + 100, y: Math.random() * 300 + 100, visible: true });
                    setTimeout(() => setGhostCursor(prev => ({ ...prev, visible: false })), 1000);
                }
            }
        });
        return () => unsubscribe();
    }, [url]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            loadContent();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f1115]">
            {/* Browser Chrome */}
            <div className="h-14 bg-[#161b22] border-b border-gray-800 flex items-center px-4 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <ArrowLeft className="w-4 h-4 hover:text-white cursor-pointer" />
                    <ArrowRight className="w-4 h-4 hover:text-white cursor-pointer" />
                    <RotateCw className={`w-4 h-4 hover:text-white cursor-pointer ${isLoading ? 'animate-spin' : ''}`} onClick={loadContent} />
                </div>
                
                <div className="flex-1 bg-[#0d1117] border border-gray-700 rounded-full h-9 flex items-center px-4 gap-2 text-sm">
                    <Lock className="w-3 h-3 text-green-500" />
                    <input 
                        className="flex-1 bg-transparent outline-none text-gray-300 font-mono"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="font-bold text-xs text-aussie-500">A</span>
                    </div>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 relative bg-white overflow-hidden">
                <iframe 
                    title="browser-viewport"
                    ref={iframeRef}
                    srcDoc={iframeContent}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                />
                
                {/* Ghost Cursor for Automation Visualization */}
                {ghostCursor.visible && (
                    <div 
                        className="absolute pointer-events-none transition-all duration-500 z-50"
                        style={{ left: ghostCursor.x, top: ghostCursor.y }}
                    >
                        <MousePointer2 className="w-6 h-6 text-red-500 fill-red-500 drop-shadow-lg" />
                        <div className="absolute left-6 top-0 bg-red-500 text-white text-[10px] px-1 rounded whitespace-nowrap">
                            Aussie Agent
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
