
import { DeployState, DeployStatus, DeployLog } from '../types';

const RENDER_API_KEY = 'rnd_wiYCof8RUSWKCfwOfnBnT2nJXLRk';

/**
 * Render.com Deployment Service (Simulated)
 * This service mimics the Render.com API flow to provide a realistic
 * frontend experience without making actual API calls in this sandboxed environment.
 */
class RenderService {
    private state: DeployState = {
        id: null,
        status: 'pending',
        logs: [],
        url: null,
    };
    private subscribers: Set<(state: DeployState) => void> = new Set();
    private isRunning = false;

    public subscribe(callback: (state: DeployState) => void): () => void {
        this.subscribers.add(callback);
        callback(this.state); // Immediately send current state
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb({ ...this.state }));
    }

    public getState(): DeployState {
        return { ...this.state };
    }

    public async createService(repoUrl: string): Promise<string> {
        if (this.isRunning) {
            throw new Error("A deployment is already in progress.");
        }
        this.isRunning = true;
        
        // Reset state
        this.state = {
            id: `dpl-${Math.random().toString(36).substring(2, 11)}`,
            status: 'pending',
            logs: [],
            url: null,
        };
        this.notify();

        this.addLog(`Render API Key detected: ${RENDER_API_KEY.substring(0, 12)}...`);
        this.addLog(`Creating new Web Service for repository: ${repoUrl}`);

        // Start the simulated deployment flow
        this.runSimulation();
        
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

    private runSimulation() {
        const steps: { status: DeployStatus; delay: number; logs: string[] }[] = [
            { 
                status: 'build_started', 
                delay: 2000, 
                logs: [
                    'Build instance running on Node.js 20',
                    'Cloning repository from GitHub...',
                    'Analyzing source code...',
                    'Installing dependencies with `npm install`...',
                ]
            },
            {
                status: 'build_success',
                delay: 5000,
                logs: [
                    'Dependencies installed successfully.',
                    'Running `npm run build` command...',
                    'Build successful. Creating a deployable artifact.',
                ]
            },
            {
                status: 'deploy_started',
                delay: 3000,
                logs: [
                    'Uploading build artifact to global CDN...',
                    'Provisioning instances in Frankfurt (fra1)...',
                    'Starting up service...',
                ]

            },
            {
                status: 'live',
                delay: 2000,
                logs: [
                    'Service is live.',
                    'Health checks passed.',
                    'Deployment successful!',
                ]
            }
        ];

        let promise = Promise.resolve();
        
        steps.forEach(step => {
            promise = promise.then(() => new Promise(resolve => {
                setTimeout(() => {
                    this.setStatus(step.status);
                    step.logs.forEach(log => this.addLog(log));
                    resolve();
                }, step.delay);
            }));
        });
        
        promise.then(() => {
             this.state.url = `https://${this.state.id}.onrender.com`;
             this.isRunning = false;
             this.notify();
        });
    }
}

export const render = new RenderService();
