
import { bus } from './eventBus';
import { BrowserAction } from '../types';

/**
 * Browser Automation Service (Puppeteer Lite)
 * Allows the Agent to control the BrowserView component.
 */
class BrowserAutomationService {
    
    // Store the latest page content reported by the BrowserView
    private pageContent: string = '';
    
    constructor() {
        // Listen for content updates from the UI
        // In a real app, this would be a two-way binding or IPC
    }

    public setPageContent(content: string) {
        this.pageContent = content;
    }

    public async goto(url: string): Promise<string> {
        bus.emit('browser-navigate', { url });
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1500));
        return `Navigated to ${url}`;
    }

    public async click(selector: string): Promise<string> {
        bus.emit('browser-action', { type: 'click', selector });
        await new Promise(r => setTimeout(r, 800));
        return `Clicked element: ${selector}`;
    }

    public async type(selector: string, text: string): Promise<string> {
        bus.emit('browser-action', { type: 'type', selector, value: text });
        await new Promise(r => setTimeout(r, 1000));
        return `Typed "${text}" into ${selector}`;
    }

    public async scrape(): Promise<string> {
        // In this simulation, we return the content we have buffered
        // In a real implementation, we'd ask the view for the DOM
        return this.pageContent || "<html><body><h1>Empty Page</h1></body></html>";
    }

    public async screenshot(): Promise<string> {
        bus.emit('browser-action', { type: 'screenshot' });
        // Return a fake base64 string for the agent to "see"
        return "data:image/png;base64,fake-screenshot-data...";
    }
}

export const browserAutomation = new BrowserAutomationService();
