
import { FileNode, FileStat } from '../types';
import { bus } from './eventBus';

const STORAGE_KEY = 'aussie_os_fs_v2';

// TextEncoder/Decoder for Git binary handling simulation
const encoder = new TextEncoder();
const decoder = new TextDecoder();

class FileSystemService {
    private root: FileNode;
    private _gitFsInterface: any = null;

    constructor() {
        this.root = this.loadFromStorage() || this.createDefaultStructure();
    }

    private createDefaultStructure(): FileNode {
        const root: FileNode = {
            name: 'root',
            type: 'directory',
            children: new Map(),
            lastModified: Date.now()
        };

        const workspace: FileNode = {
            name: 'workspace',
            type: 'directory',
            children: new Map(),
            lastModified: Date.now()
        };
        root.children?.set('workspace', workspace);

        const welcome: FileNode = {
            name: 'WELCOME.md',
            type: 'file',
            content: '# Welcome to Aussie OS\n\nThis is a fully persistent browser-based operating system.\n\n## Features\n- **Real Git**: Run `git init`, `git add`, `git commit`.\n- **Jules VM**: Run `gemini-flow jules` commands.\n- **Persistence**: All files are saved to LocalStorage.',
            lastModified: Date.now()
        };
        workspace.children?.set('WELCOME.md', welcome);

        const indexHtml: FileNode = {
            name: 'index.html',
            type: 'file',
            content: '<!DOCTYPE html>\n<html>\n<head>\n<style>\n  body { background: #0f1115; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }\n  h1 { font-size: 3rem; background: linear-gradient(to right, #2f81f7, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n</style>\n</head>\n<body>\n  <h1>Aussie OS Live Preview</h1>\n</body>\n</html>',
            lastModified: Date.now()
        };
        workspace.children?.set('index.html', indexHtml);

        return root;
    }

    private loadFromStorage(): FileNode | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return this.deserializeNode(parsed);
        } catch (e) {
            console.error("Failed to load FS:", e);
            return null;
        }
    }

    private saveToStorage() {
        try {
            const serialized = this.serializeNode(this.root);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
        } catch (e) {
            console.error("Failed to save FS:", e);
        }
    }

    private serializeNode(node: FileNode): any {
        return {
            ...node,
            children: node.children ? Array.from(node.children.entries()).map(([k, v]) => [k, this.serializeNode(v)]) : undefined
        };
    }

    private deserializeNode(data: any): FileNode {
        return {
            ...data,
            children: data.children ? new Map(data.children.map(([k, v]: any) => [k, this.deserializeNode(v)])) : undefined
        };
    }

    private resolveNode(path: string): FileNode | null {
        if (path === '/') return this.root;
        const parts = path.split('/').filter(p => p);
        let current = this.root;

        for (const part of parts) {
            if (current.type !== 'directory' || !current.children) return null;
            const next = current.children.get(part);
            if (!next) return null;
            current = next;
        }
        return current;
    }

    public exists(path: string): boolean {
        return !!this.resolveNode(path);
    }

    public readFile(path: string): string {
        const node = this.resolveNode(path);
        if (!node) throw new Error(`File not found: ${path}`);
        if (node.type !== 'file') throw new Error(`Is a directory: ${path}`);
        return node.content || '';
    }

    // FIX: Updated writeFile to accept an optional `append` parameter.
    public writeFile(path: string, content: string, append?: boolean) {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        if (!fileName) throw new Error('Invalid path');

        let current = this.root;
        for (const part of parts) {
            if (!current.children) current.children = new Map();
            let next = current.children.get(part);
            if (!next) {
                next = {
                    name: part,
                    type: 'directory',
                    children: new Map(),
                    lastModified: Date.now()
                };
                current.children.set(part, next);
            }
            if (next.type !== 'directory') throw new Error(`Path component ${part} is not a directory`);
            current = next;
        }

        let finalContent = content;
        if (append) {
            const existingNode = current.children?.get(fileName);
            if (existingNode && existingNode.type === 'file' && existingNode.content) {
                finalContent = existingNode.content + content;
            }
        }

        const fileNode: FileNode = {
            name: fileName,
            type: 'file',
            content: finalContent,
            lastModified: Date.now()
        };
        
        if (!current.children) current.children = new Map();
        current.children.set(fileName, fileNode);
        this.saveToStorage();
        bus.emit('file-change', { path });
    }

    public mkdir(path: string) {
        const parts = path.split('/').filter(p => p);
        let current = this.root;
        
        for (const part of parts) {
             if (!current.children) current.children = new Map();
             let next = current.children.get(part);
             if (!next) {
                 next = {
                     name: part,
                     type: 'directory',
                     children: new Map(),
                     lastModified: Date.now()
                 };
                 current.children.set(part, next);
             }
             current = next;
        }
        this.saveToStorage();
        bus.emit('file-change', { path });
    }

    public readDir(path: string): FileStat[] {
        const node = this.resolveNode(path);
        if (!node) throw new Error(`Path not found: ${path}`);
        if (node.type !== 'directory' || !node.children) throw new Error(`Not a directory: ${path}`);

        const results: FileStat[] = [];
        for (const [name, child] of node.children.entries()) {
            results.push({
                name: child.name,
                path: path === '/' ? `/${name}` : `${path === '/' ? '' : path}/${name}`,
                type: child.type,
                size: child.content?.length || 0,
                lastModified: child.lastModified
            });
        }
        return results;
    }
    
    public delete(path: string) {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        if (!fileName) return;

        let current = this.root;
        for (const part of parts) {
            if (!current.children) return;
            const next = current.children.get(part);
            if (!next) return; 
            current = next;
        }

        if (current.children && current.children.has(fileName)) {
            current.children.delete(fileName);
            this.saveToStorage();
            bus.emit('file-change', { path });
        }
    }

    public rmdir(path: string) {
        this.delete(path);
    }

    // --- Git Compatible Interface ---
    // Provides a promise-based interface compatible with isomorphic-git expectations
    public get gitFs() {
        if (this._gitFsInterface) return this._gitFsInterface;
        
        const self = this;
        this._gitFsInterface = {
            promises: {
                readFile: async (path: string, opts: any) => {
                    try {
                        const content = self.readFile(path);
                        // Handle encoding simulation (Git often wants buffer/uint8array)
                        if (opts && opts.encoding === 'utf8') return content;
                        return encoder.encode(content);
                    } catch (e: any) {
                        // Git expects specific error codes
                        const err: any = new Error(e.message);
                        err.code = 'ENOENT';
                        throw err;
                    }
                },
                writeFile: async (path: string, data: any, opts: any) => {
                    let content = '';
                    if (typeof data === 'string') content = data;
                    else content = decoder.decode(data);
                    self.writeFile(path, content);
                },
                unlink: async (path: string) => {
                    if (!self.exists(path)) {
                         const err: any = new Error('ENOENT');
                         err.code = 'ENOENT';
                         throw err;
                    }
                    self.delete(path);
                },
                readdir: async (path: string) => {
                    try {
                        const stats = self.readDir(path);
                        return stats.map(s => s.name);
                    } catch (e) {
                        const err: any = new Error('ENOENT');
                        err.code = 'ENOENT';
                        throw err;
                    }
                },
                mkdir: async (path: string) => self.mkdir(path),
                rmdir: async (path: string) => self.rmdir(path),
                stat: async (path: string) => {
                    const node = self.resolveNode(path);
                    if (!node) {
                        const err: any = new Error('ENOENT');
                        err.code = 'ENOENT';
                        throw err;
                    }
                    return {
                        isFile: () => node.type === 'file',
                        isDirectory: () => node.type === 'directory',
                        isSymbolicLink: () => false,
                        size: node.content?.length || 0,
                        mtimeMs: node.lastModified,
                        type: node.type === 'file' ? 1 : 2, // internal type simulation
                        mode: node.type === 'file' ? 0o100644 : 0o40755,
                        uid: 0,
                        gid: 0,
                        ino: 0,
                        ctimeMs: node.lastModified
                    };
                },
                lstat: async (path: string) => {
                    // Just reuse the stat logic
                    // In a real FS, lstat would differ for symlinks, but we don't support symlinks yet
                    const node = self.resolveNode(path);
                    if (!node) {
                        const err: any = new Error('ENOENT');
                        err.code = 'ENOENT';
                        throw err;
                    }
                    return {
                         isFile: () => node.type === 'file',
                         isDirectory: () => node.type === 'directory',
                         isSymbolicLink: () => false,
                         size: node.content?.length || 0,
                         mtimeMs: node.lastModified,
                         type: node.type === 'file' ? 1 : 2,
                         mode: node.type === 'file' ? 0o100644 : 0o40755,
                         uid: 0,
                         gid: 0,
                         ino: 0,
                         ctimeMs: node.lastModified
                    };
                }
            }
        };
        return this._gitFsInterface;
    }
}

export const fs = new FileSystemService();