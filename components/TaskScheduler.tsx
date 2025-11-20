
import React, { useState, useEffect } from 'react';
import { scheduler } from '../services/scheduler';
import { ScheduledTask } from '../types';
import { Plus, Trash2, Play, Clock, Activity, Calendar, RefreshCw, Terminal } from 'lucide-react';

export const TaskScheduler: React.FC = () => {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'command' | 'swarm'>('command');
    const [newAction, setNewAction] = useState('');
    const [newSchedule, setNewSchedule] = useState<'once' | 'interval'>('once');
    const [newInterval, setNewInterval] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            setTasks([...scheduler.getTasks()]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAdd = () => {
        if (!newName || !newAction) return;
        
        scheduler.addTask({
            name: newName,
            type: newType,
            action: newAction,
            schedule: newSchedule,
            intervalSeconds: newSchedule === 'interval' ? newInterval : undefined,
            nextRun: Date.now() // Run immediately/soon
        });

        setShowForm(false);
        setNewName('');
        setNewAction('');
    };

    const handleDelete = (id: string) => {
        scheduler.removeTask(id);
    };

    return (
        <div className="h-full bg-[#0f1115] text-gray-300 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-[#161b22] flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-400" />
                        Task Scheduler
                    </h2>
                    <p className="text-sm text-gray-400">Automate system operations and agents</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Task
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {showForm && (
                    <div className="mb-6 p-4 bg-[#1c2128] border border-gray-700 rounded-xl animate-in slide-in-from-top duration-200">
                        <h3 className="font-bold text-white mb-4">Create New Automated Task</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Task Name</label>
                                <input 
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                                    placeholder="e.g., Hourly System Scan"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Type</label>
                                <select 
                                    value={newType} onChange={e => setNewType(e.target.value as any)}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-sm text-white outline-none"
                                >
                                    <option value="command">Shell Command</option>
                                    <option value="swarm">Swarm Objective</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">
                                    {newType === 'command' ? 'Shell Command' : 'Swarm Objective'}
                                </label>
                                <input 
                                    value={newAction} onChange={e => setNewAction(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-sm text-white font-mono outline-none focus:border-blue-500"
                                    placeholder={newType === 'command' ? 'echo "Backup started" >> log.txt' : 'Analyze system logs and fix errors'}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                                <select 
                                    value={newSchedule} onChange={e => setNewSchedule(e.target.value as any)}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-sm text-white outline-none"
                                >
                                    <option value="once">Run Once</option>
                                    <option value="interval">Recurring Interval</option>
                                </select>
                            </div>
                            {newSchedule === 'interval' && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Interval (Seconds)</label>
                                    <input 
                                        type="number"
                                        value={newInterval} onChange={e => setNewInterval(parseInt(e.target.value))}
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-sm text-white outline-none"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleAdd} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold">Save Task</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-[#161b22] border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-colors">
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center shrink-0
                                ${task.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700/50 text-gray-500'}
                            `}>
                                {task.type === 'swarm' ? <Activity className="w-6 h-6" /> : <Terminal className="w-6 h-6" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white">{task.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        task.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        {task.status}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 font-mono truncate mb-2">
                                    {task.action}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> 
                                        {task.schedule === 'once' ? 'One-time' : `Every ${task.intervalSeconds}s`}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 
                                        Next: {task.status === 'completed' ? '-' : new Date(task.nextRun).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right max-w-[150px]">
                                <div className="text-xs text-gray-500 mb-1">Last Result</div>
                                <div className={`text-xs truncate ${task.lastResult?.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                                    {task.lastResult || '-'}
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDelete(task.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    
                    {tasks.length === 0 && !showForm && (
                        <div className="text-center py-12 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No tasks scheduled.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
