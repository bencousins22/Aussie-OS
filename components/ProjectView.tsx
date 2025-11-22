
import React, { useState, useEffect } from 'react';
import { collaboration } from '../services/collaboration';
import { Project, Collaborator } from '../types';
import { Briefcase, Plus, Folder, Users, Activity, Search, Code2, Terminal, Database, Zap, Circle, ExternalLink } from 'lucide-react';
import { shell } from '../services/shell';

export const ProjectView: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [showNewModal, setShowNewModal] = useState(false);
    
    // New Project Form
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStack, setNewStack] = useState<string[]>([]);

    useEffect(() => {
        const refresh = () => {
            setProjects(collaboration.getProjects());
            setCollaborators(collaboration.getCollaborators());
        };
        refresh();
        const interval = setInterval(refresh, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        if (!newName) return;
        collaboration.createProject(newName, newDesc, newStack);
        setShowNewModal(false);
        setNewName('');
        setNewDesc('');
        setNewStack([]);
    };

    const toggleStack = (tech: string) => {
        if (newStack.includes(tech)) setNewStack(newStack.filter(s => s !== tech));
        else setNewStack([...newStack, tech]);
    };

    const openProject = async (path: string) => {
        await shell.execute(`cd ${path}`);
        // In a real app, this might also switch view to 'code'
    };

    return (
        <div className="h-full bg-os-bg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-os-border bg-os-panel flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-aussie-500/20 p-2 rounded-lg">
                        <Briefcase className="w-6 h-6 text-aussie-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Projects</h2>
                        <p className="text-sm text-os-textDim">Manage workspaces and collaborate with your team.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-aussie-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Projects Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="group bg-os-panel border border-os-border rounded-xl p-5 hover:border-aussie-500/50 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-os-bg p-2 rounded-lg border border-os-border group-hover:border-aussie-500/30 transition-colors">
                                        <Folder className="w-6 h-6 text-aussie-500" />
                                    </div>
                                    <button onClick={() => openProject(project.path)} className="text-os-textDim hover:text-white transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                                <p className="text-xs text-os-textDim mb-4 line-clamp-2 flex-1">{project.description}</p>
                                
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    {project.stack.map(tech => (
                                        <span key={tech} className="px-2 py-1 bg-os-bg border border-os-border rounded text-[10px] font-bold text-gray-300 uppercase">
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-os-border flex items-center justify-between text-xs text-os-textDim">
                                    <span>Updated {new Date(project.lastUpdated).toLocaleDateString()}</span>
                                    <div className="flex -space-x-2">
                                        {collaborators.slice(0,3).map(c => (
                                            <div key={c.id} className="w-6 h-6 rounded-full border-2 border-os-panel flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: c.color }}>
                                                {c.avatar}
                                            </div>
                                        ))}
                                        {collaborators.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-os-panel bg-gray-700 flex items-center justify-center text-[8px] text-white">
                                                +{collaborators.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar: Team & Activity */}
                <div className="w-80 bg-[#0f1115] border-l border-os-border flex flex-col shrink-0">
                    {/* Team Section */}
                    <div className="p-4 border-b border-os-border">
                        <h3 className="text-xs font-bold text-os-textDim uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Team Members
                        </h3>
                        <div className="space-y-3">
                            {collaborators.map(user => (
                                <div key={user.id} className="flex items-center gap-3 group cursor-pointer p-2 rounded hover:bg-os-panel transition-colors">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: user.color }}>
                                            {user.avatar}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1115] ${
                                            user.status === 'online' ? 'bg-green-500' : 
                                            user.status === 'coding' ? 'bg-blue-500 animate-pulse' : 
                                            user.status === 'reviewing' ? 'bg-purple-500' : 'bg-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">{user.name}</div>
                                        <div className="text-[10px] text-os-textDim uppercase">{user.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <h3 className="text-xs font-bold text-os-textDim uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Live Activity
                        </h3>
                        <div className="space-y-4 relative">
                            <div className="absolute top-2 bottom-2 left-1.5 w-px bg-os-border" />
                            {collaborators.filter(c => c.status === 'coding').map((user, i) => (
                                <div key={user.id + i} className="flex gap-3 relative">
                                    <div className="w-3 h-3 rounded-full bg-os-bg border-2 border-aussie-500 shrink-0 z-10 mt-1" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-300">{user.name}</div>
                                        <div className="text-[11px] text-gray-500">Editing <span className="text-aussie-500 font-mono">main.tsx</span></div>
                                        <div className="text-[10px] text-os-textDim mt-0.5">Just now</div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3 relative">
                                <div className="w-3 h-3 rounded-full bg-os-bg border-2 border-purple-500 shrink-0 z-10 mt-1" />
                                <div>
                                    <div className="text-xs font-bold text-gray-300">System</div>
                                    <div className="text-[11px] text-gray-500">Deployed to Render</div>
                                    <div className="text-[10px] text-os-textDim mt-0.5">2m ago</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Project Modal */}
            {showNewModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
                    <div className="bg-os-panel border border-os-border rounded-xl p-6 w-[500px] shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-6">Create Workspace</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Project Name</label>
                                <input 
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-os-bg border border-os-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-aussie-500"
                                    placeholder="e.g., Super App"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Description</label>
                                <textarea 
                                    value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                    className="w-full bg-os-bg border border-os-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-aussie-500 resize-none h-20"
                                    placeholder="Brief description of the project..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">Tech Stack</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['react', 'node', 'python', 'gemini', 'rust'].map(tech => (
                                        <button
                                            key={tech}
                                            onClick={() => toggleStack(tech)}
                                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase border transition-colors ${
                                                newStack.includes(tech) 
                                                ? 'bg-aussie-500 text-[#0f1216] border-aussie-500' 
                                                : 'bg-os-bg text-gray-400 border-os-border hover:border-gray-500'
                                            }`}
                                        >
                                            {tech}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-aussie-500 text-[#0f1216] font-bold rounded-lg text-sm">Create Project</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
