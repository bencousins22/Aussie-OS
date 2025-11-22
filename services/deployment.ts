
import { DeployState, DeployStatus, DeploymentProvider } from '../types';

/**
 * Unified Deployment Service
 * Simulates deployment to multiple cloud providers (Render, Vercel, Replit, Netlify).
 */
class DeploymentService {
    private state: DeployState = {
        id: null,
        provider: 'render',
        status: 'pending',
        logs: [],
        url: null,
    };
    private subscribers: Set<(state: DeployState) => void> = new Set();
    private isRunning = false;
    
    // API Keys Storage Keys
    private keys = {
        render: 'settings_render_key',
        vercel: 'settings_vercel_key',
        replit: 'settings_replit_key',
        netlify: 'settings_netlify_key'
    };

    constructor() {
        // Pre-populate Render key if in environment/demo mode
        if (!this.getApiKey('render')) {
            this.setApiKey('render', 'rnd_wiYCof8RUSWKCfwOfnBnT2nJXLRk'); 
        }
    }

    public subscribe(callback: (state: DeployState) => void): () => void {
        this.subscribers.add(callback);
        callback(this.state);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb({ ...this.state }));
    }

    public getState(): DeployState {
        return { ...this.state };
    }

    public setApiKey(provider: DeploymentProvider, key: string) {
        localStorage.setItem(this.keys[provider], key);
    }

    public getApiKey(provider: DeploymentProvider): string | null {
        return localStorage.getItem(this.keys[provider]);
    }

    public async deploy(provider: DeploymentProvider, repoUrl: string): Promise<string> {
        if (this.isRunning) {
            throw new Error("A deployment is already in progress.");
        }
        
        const apiKey = this.getApiKey(provider);
        if (!apiKey) {
            throw new Error(`No API Key found for ${provider}. Please configure in Settings.`);
        }

        this.isRunning = true;
        
        // Reset state
        this.state = {
            id: `dpl-${Math.random().toString(36).substring(2, 11)}`,
            provider,
            status: 'pending',
            logs: [],
            url: null,
        };
        this.notify();

        this.addLog(`[${provider.toUpperCase()}] Starting deployment for ${repoUrl}`);
        this.addLog(`Authenticated with key: ${apiKey.substring(0, 8)}...`);

        // Start simulation based on provider
        this.runSimulation(provider);
        
        return this.state.id!;
    }

    private addLog(line: string) {
        this.state.logs.push({ timestamp: Date.now(), line });
        this.notify();
    }
    
    private setStatus(status: DeployStatus) {
        this.state.status = status;
        this.addLog(`==> Status changed to: ${status.toUpperCase()}`);
        this.notify();
    }

    private runSimulation(provider: DeploymentProvider) {
        const scenarios: Record<DeploymentProvider, any> = {
            render: [
                { status: 'build_started', delay: 2000, logs: ['Build instance running on Node.js 20', 'Cloning repository...', 'Installing dependencies...'] },
                { status: 'build_success', delay: 5000, logs: ['Dependencies installed.', 'Running `npm run build`...', 'Artifact created.'] },
                { status: 'deploy_started', delay: 3000, logs: ['Uploading to CDN...', 'Provisioning instances in Frankfurt...', 'Starting service...'] },
                { status: 'live', delay: 2000, logs: ['Service is live.', 'Health checks passed.'] }
            ],
            vercel: [
                { status: 'build_started', delay: 1500, logs: ['Retrieved Cache...', 'Running "vercel build"...', 'Optimizing static assets...'] },
                { status: 'build_success', delay: 3000, logs: ['Build Completed.', 'Output: .next/'] },
                { status: 'deploy_started', delay: 2000, logs: ['Deploying to Edge Network...', 'Propagating DNS...', 'Running Edge Functions...'] },
                { status: 'live', delay: 1500, logs: ['Deployment complete.', 'Assigned domain: .vercel.app'] }
            ],
            replit: [
                { status: 'build_started', delay: 2000, logs: ['Importing from GitHub...', 'Detecting language: TypeScript', 'Provisioning Repl container...'] },
                { status: 'build_success', delay: 4000, logs: ['Nix environment ready.', 'Installing packages via Bun...'] },
                { status: 'deploy_started', delay: 3000, logs: ['Waking up Autoscale group...', 'Binding ports...', 'Starting server...'] },
                { status: 'live', delay: 2000, logs: ['Repl is live.', 'Monitoring active.'] }
            ],
            netlify: [
                { status: 'build_started', delay: 1800, logs: ['Netlify Build initialized', 'Cloning...', 'Fetching cache...'] },
                { status: 'build_success', delay: 4000, logs: ['Build script success', '152 asset files generated', 'Functions bundled'] },
                { status: 'deploy_started', delay: 2500, logs: ['Uploading to Netlify Global CDN...', 'Post-processing HTML...'] },
                { status: 'live', delay: 1500, logs: ['Site is live 🚀'] }
            ]
        };

        const steps = scenarios[provider];
        let promise = Promise.resolve();
        
        steps.forEach((step: any) => {
            promise = promise.then(() => new Promise(resolve => {
                setTimeout(() => {
                    this.setStatus(step.status);
                    step.logs.forEach((log: string) => this.addLog(log));
                    resolve();
                }, step.delay);
            }));
        });
        
        promise.then(() => {
            const domains = {
                render: 'onrender.com',
                vercel: 'vercel.app',
                replit: 'replit.app',
                netlify: 'netlify.app'
            };
            this.state.url = `https://${this.state.id}.${domains[provider]}`;
            this.isRunning = false;
            this.notify();
        });
    }
}

export const deployment = new DeploymentService();
