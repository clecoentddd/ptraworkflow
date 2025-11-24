// Canonical event definitions and utilities
// All events must have: { event, timestamp, ... }

export function createEvent(type, payload = {}) {
  return {
    event: type,
  timestamp: new Date().toISOString(),
    ...payload
  };
}

// Utility to normalize any event object to canonical shape
export function normalizeEvent(e) {
  const { event, timestamp, ts, ...rest } = e;
  return {
    event,
  timestamp: timestamp || new Date().toISOString(),
    ...rest
  };
}

// Usage:
// const evt = createEvent('EntryAdded', { todoId, text });
// const normalized = normalizeEvent(evt);
