
import { Widget } from '../types';

const DASHBOARD_KEY = 'aussie_os_dashboard_state_v1';

interface DashboardState {
    wallpaper: string;
    widgets: Widget[];
}

class DashboardStateService {
    private state: DashboardState;

    constructor() {
        this.state = this.load() || {
            wallpaper: 'default',
            widgets: [
                { id: 'w1', type: 'clock', x: 1000, y: 20 },
                { id: 'w2', type: 'system', x: 1000, y: 180 },
                { id: 'w3', type: 'network', x: 1000, y: 380 }
            ]
        };
    }

    private load(): DashboardState | null {
        try {
            const raw = localStorage.getItem(DASHBOARD_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    private save() {
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.state));
    }

    public getWidgets(): Widget[] {
        return this.state.widgets;
    }

    public addWidget(type: Widget['type'], x: number = 100, y: number = 100) {
        const newWidget: Widget = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x,
            y,
            data: type === 'note' ? { content: 'New Note' } : type === 'todo' ? { items: [] } : undefined
        };
        this.state.widgets.push(newWidget);
        this.save();
        return newWidget;
    }

    public removeWidget(id: string) {
        this.state.widgets = this.state.widgets.filter(w => w.id !== id);
        this.save();
    }

    public updateWidget(id: string, updates: Partial<Widget>) {
        this.state.widgets = this.state.widgets.map(w => w.id === id ? { ...w, ...updates } : w);
        this.save();
    }

    public getWallpaper() {
        return this.state.wallpaper;
    }

    public setWallpaper(url: string) {
        this.state.wallpaper = url;
        this.save();
    }
}

export const dashboardState = new DashboardStateService();
