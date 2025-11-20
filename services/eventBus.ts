
import { SystemEvent, SystemEventType } from '../types';

type Listener = (event: SystemEvent) => void;

class EventBus {
    private listeners: Set<Listener> = new Set();

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public emit(type: SystemEventType, payload: any) {
        const event: SystemEvent = { type, payload };
        this.listeners.forEach(l => l(event));
    }
}

export const bus = new EventBus();
