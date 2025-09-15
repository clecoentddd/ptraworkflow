// Simple pub/sub event bus for cross-component or internal triggers
const listeners = {};

export const subscribe = (eventType, callback) => {
  if (!listeners[eventType]) listeners[eventType] = [];
  listeners[eventType].push(callback);
  return () => {
    listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
  };
};

export const publish = (eventType, payload) => {
  if (listeners[eventType]) {
    listeners[eventType].forEach(cb => cb(payload));
  }
};
