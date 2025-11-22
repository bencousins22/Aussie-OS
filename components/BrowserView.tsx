
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Search, Globe, MousePointer2, Layout, Zap, Code } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { bus } from '../services/eventBus';
import { browserAutomation } from '../services/browserAutomation';

export const BrowserView: React.FC = () => {
    const [url, setUrl] = useState('http://localhost:3000/welcome.html');
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
                // Extract path or serve default welcome
                if (url.endsWith('welcome.html')) {
                    content = getWelcomePage();
                } else {
                    const path = url.replace('http://localhost:3000', '/workspace').replace('file://', '');
                    
                    if (fs.exists(path)) {
                        content = fs.readFile(path);
                        // Inject script to catch errors
                        content += `
                            <script>
                                window.onerror = function(msg) { console.error("Browser Error:", msg); };
                            </script>
                        `;
                    } else {
                        content = get404Page(path);
                    }
                }
            } else {
                // External URL mock
                content = getExternalMock(url);
            }
            setIframeContent(content);
            browserAutomation.setPageContent(content.replace(/<[^>]*>?/gm, ''));

        } catch (e) {
            setIframeContent(`<h1>Error</h1><p>${e}</p>`);
        }
        setTimeout(() => setIsLoading(false), 500);
    };

    useEffect(() => {
        loadContent();
        
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
        <div className="flex flex-col h-full bg-os-bg text-os-text min-w-0">
            {/* Browser Chrome */}
            <div className="h-10 bg-os-panel border-b border-os-border flex items-center px-3 gap-3 shrink-0">
                <div className="flex items-center gap-2 text-os-textDim">
                    <ArrowLeft className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
                    <ArrowRight className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
                    <RotateCw className={`w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors ${isLoading ? 'animate-spin' : ''}`} onClick={loadContent} />
                </div>
                
                <div className="flex-1 bg-os-bg border border-os-border rounded-lg h-7 flex items-center px-3 gap-2 text-xs transition-all focus-within:border-aussie-500/50">
                    <Lock className="w-3 h-3 text-aussie-500" />
                    <input 
                        className="flex-1 bg-transparent outline-none text-gray-300 font-mono"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
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
                
                {/* Ghost Cursor */}
                {ghostCursor.visible && (
                    <div 
                        className="absolute pointer-events-none transition-all duration-500 z-50"
                        style={{ left: ghostCursor.x, top: ghostCursor.y }}
                    >
                        <MousePointer2 className="w-6 h-6 text-aussie-500 fill-aussie-500 drop-shadow-lg" />
                        <div className="absolute left-6 top-0 bg-aussie-500 text-[#0f1216] text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                            Aussie
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Page Templates ---

const getWelcomePage = () => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #14161b; color: #e6edf3; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(to right, #00e599, #33ffb3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.05em; }
        p { color: #8b949e; max-width: 400px; text-align: center; line-height: 1.6; }
        .card { background: #1c1f24; border: 1px solid #2a2e36; padding: 1.5rem; border-radius: 12px; margin-top: 2rem; width: 300px; text-align: left; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
        .status { display: inline-block; width: 8px; height: 8px; background: #00e599; border-radius: 50%; margin-right: 8px; box-shadow: 0 0 10px #00e599; }
        .btn { display: block; width: 100%; background: #00e599; color: #0f1216; text-align: center; padding: 10px 0; border-radius: 6px; font-weight: bold; text-decoration: none; margin-top: 15px; border: none; cursor: pointer; transition: transform 0.1s; }
        .btn:hover { transform: scale(1.02); }
        .code { font-family: monospace; background: #0d1117; padding: 4px 8px; border-radius: 4px; color: #a5d6ff; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Aussie OS</h1>
    <p>The intelligent operating system for the AI era.</p>
    <div class="card">
        <div style="margin-bottom: 10px; font-size: 0.85rem; color: #8b949e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">System Status</div>
        <div style="display: flex; align-items: center; color: white; font-weight: 500;">
            <span class="status"></span> Kernel Active
        </div>
        <hr style="border: 0; border-top: 1px solid #2a2e36; margin: 15px 0;">
        <p style="font-size: 0.9rem; margin-bottom: 15px; text-align: left;">To get started, try asking the agent:</p>
        <div class="code">"Create a React component"</div>
        <button class="btn">Read Documentation</button>
    </div>
</body>
</html>
`;

const get404Page = (path: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #14161b; color: #8b949e; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        h1 { color: #ff6b6b; font-size: 4rem; margin: 0; }
        p { margin-top: 1rem; }
    </style>
</head>
<body>
    <h1>404</h1>
    <p>File not found: ${path}</p>
</body>
</html>
`;

const getExternalMock = (url: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: white; color: #333; font-family: sans-serif; margin: 0; }
        .header { background: #1a1a1a; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .hero { padding: 4rem 2rem; text-align: center; background: #f5f5f5; }
        .btn { background: #00e599; color: #0f1216; padding: 12px 24px; border-radius: 6px; font-weight: bold; border: none; cursor: pointer; font-size: 1rem; }
    </style>
</head>
<body>
    <div class="header">
        <div style="font-weight: bold; font-size: 1.2rem;">External Site</div>
        <div>${url}</div>
    </div>
    <div class="hero">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Welcome to the Web</h1>
        <p style="font-size: 1.1rem; color: #666; max-width: 600px; margin: 0 auto 2rem auto;">
            This is a simulated view of <strong>${url}</strong>. 
            In a production environment, this would be proxied securely.
        </p>
        <button class="btn">Get Started</button>
    </div>
</body>
</html>
`;
