// eventLog.js
// EventZ Todo List: Event Log implementation
// Stores and retrieves the append-only event log for todos in localStorage

const TODO_EVENT_LOG_KEY = 'eventz_todo_event_log';

// Read the event log from localStorage (returns array of events)
export function readEventLog() {
  const raw = localStorage.getItem(TODO_EVENT_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// Write the event log to localStorage
function writeEventLog(events) {
  localStorage.setItem(TODO_EVENT_LOG_KEY, JSON.stringify(events));
}

// Append one or more events to the log (with auto-timestamp)
export function appendEvents(newEvents) {
  const now = new Date().toISOString();
  const events = readEventLog();
  const toAppend = Array.isArray(newEvents) ? newEvents : [newEvents];
  const stamped = toAppend.map(e => ({ ...e, timestamp: e.timestamp || now }));
  const updated = events.concat(stamped);
  writeEventLog(updated);
  return stamped;
}

// Clear the event log (for testing/dev only)
export function clearEventLog() {
  localStorage.removeItem(TODO_EVENT_LOG_KEY);
}

// Export for testing
export default {
  readEventLog,
  appendEvents,
  clearEventLog,
};
