type EventCallback = () => void;

const listeners: Record<string, EventCallback[]> = {};

export const appEvents = {
  on(event: string, callback: EventCallback) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);

    return () => {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    };
  },

  emit(event: string) {
    if (listeners[event]) {
      listeners[event].forEach((callback) => callback());
    }
  },
};

export const EVENTS = {
  OPEN_CREATE_PROJECT_DIALOG: "open-create-project-dialog",
} as const;
