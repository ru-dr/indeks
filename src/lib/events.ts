// Simple event emitter for cross-component communication

type EventCallback = () => void;

const listeners: Record<string, EventCallback[]> = {};

export const appEvents = {
  on(event: string, callback: EventCallback) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    };
  },
  
  emit(event: string) {
    if (listeners[event]) {
      listeners[event].forEach(callback => callback());
    }
  }
};

// Event names
export const EVENTS = {
  OPEN_CREATE_PROJECT_DIALOG: 'open-create-project-dialog',
} as const;
