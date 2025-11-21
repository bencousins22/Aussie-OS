
export type Role = 'user' | 'model' | 'system';

export interface Message {
    id: string;
    role: Role;
    text: string;
    timestamp: number;
    attachments?: string[];
    sender?: string; // Name of the specific agent/service
}

export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    content?: string;
    children?: Map<string, FileNode>;
    lastModified: number;
    path?: string;
}

export interface FileStat {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    lastModified: number;
    language?: string;
}

export type BlockType = 'command' | 'output' | 'ai-thought' | 'tool-call' | 'error' | 'system';

export interface TerminalBlock {
    id: string;
    type: BlockType;
    content: string;
    timestamp: number;
    metadata?: any;
}

export type WorkflowPhase = 'idle' | 'exploring' | 'planning' | 'coding' | 'verifying' | 'reviewing' | 'deploying' | 'error';

export interface EditorTab {
    path: string;
    title: string;
    isDirty: boolean;
    language: string;
}

export interface ShellResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export type FlowNodeType = 'trigger' | 'action' | 'decision' | 'end';

export interface FlowNode {
    id: string;
    type: FlowNodeType;
    label: string;
    prompt?: string;
    x: number;
    y: number;
    status?: 'pending' | 'running' | 'success' | 'error';
    result?: any;
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
}

export interface FlowGraph {
    id: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export interface JulesState {
    isRunning: boolean;
    currentStepId: string | null;
    logs: string[];
}

export type SystemEventType = 'file-change' | 'shell-output' | 'browser-navigate' | 'browser-action' | 'notification' | 'task-run' | 'task-complete' | 'agent-message';

export interface SystemEvent {
    type: SystemEventType;
    payload: any;
}

export interface BrowserState {
    url: string;
    history: string[];
    isLoading: boolean;
}

export interface AgentState {
    id: number;
    status: 'idle' | 'working' | 'success' | 'failed';
    output?: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: number;
}

export interface BrowserAction {
    type: 'goto' | 'click' | 'type' | 'screenshot' | 'scrape';
    selector?: string;
    value?: string;
    url?: string;
}

export interface ScheduledTask {
    id: string;
    name: string;
    type: 'command' | 'swarm' | 'flow';
    action: string;
    schedule: 'once' | 'hourly' | 'daily' | 'interval';
    intervalSeconds?: number;
    lastRun?: number;
    nextRun: number;
    status: 'active' | 'paused' | 'completed';
    lastResult?: string;
}

export interface GitStatusItem {
    path: string;
    status: 'modified' | 'new' | 'deleted' | 'unmodified';
    staged: boolean;
}

// --- RENDER.COM DEPLOYMENT ---
export type DeployStatus = 'pending' | 'build_started' | 'build_success' | 'deploy_started' | 'live' | 'failed' | 'canceled';

export interface DeployLog {
    timestamp: number;
    line: string;
}

export interface DeployState {
    id: string | null;
    status: DeployStatus;
    logs: DeployLog[];
    url: string | null;
}


export type MainView = 'dashboard' | 'code' | 'flow' | 'browser' | 'scheduler' | 'github' | 'settings' | 'deploy';
