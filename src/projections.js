// projections.js
// EventZ Todo List: Projection logic and incremental cache

import { readEventLog } from './eventLog';

// Derive the current state of all todos from the event log
export function projectTodos(events) {
  // { [todoId]: { text, state, lastEvent, ... } }
  const todos = {};
  // Track cancelled changeIds
  const cancelledChangeIds = new Set();
  for (const e of events) {
    if (e.event === 'MutationAnnulée' && e.changeId) {
      cancelledChangeIds.add(e.changeId);
    }
  }
  for (const e of events) {
    const { todoId, event, text, changeId } = e;
    if (!todoId) continue;
    // Exclude todos for cancelled changeIds
    if (changeId && cancelledChangeIds.has(changeId)) continue;
    if (event === 'TodoAdded') {
      todos[todoId] = { todoId, text, state: 'active', lastEvent: e };
    } else if (event === 'TodoEdited' && todos[todoId] && todos[todoId].state !== 'deleted') {
      todos[todoId] = { ...todos[todoId], text, lastEvent: e };
    } else if (event === 'TodoCompleted' && todos[todoId] && todos[todoId].state !== 'deleted') {
      todos[todoId] = { ...todos[todoId], state: 'completed', lastEvent: e };
    } else if (event === 'TodoUncompleted' && todos[todoId] && todos[todoId].state !== 'deleted') {
      todos[todoId] = { ...todos[todoId], state: 'active', lastEvent: e };
    } else if (event === 'TodoDeleted' && todos[todoId]) {
      todos[todoId] = { ...todos[todoId], state: 'deleted', lastEvent: e };
    } else if (event === 'TodoRestored' && todos[todoId] && todos[todoId].state === 'deleted') {
      todos[todoId] = { ...todos[todoId], state: 'active', lastEvent: e };
    }
  }
  return todos;
}

// Get all active (not deleted) todos as an array
export function getActiveTodos(events) {
  const todos = projectTodos(events);
  return Object.values(todos).filter(t => t.state === 'active' || t.state === 'completed');
}

// Get a single todo's state by id
export function getTodoState(events, todoId) {
  const todos = projectTodos(events);
  return todos[todoId] || null;
}

// --- Optional: Incremental projection cache ---

let cachedEventsLength = 0;
let cachedTodos = {};

export function getTodosCached() {
  const events = readEventLog();
  if (events.length === cachedEventsLength) {
    return cachedTodos;
  }
  cachedTodos = projectTodos(events);
  cachedEventsLength = events.length;
  return cachedTodos;
}

export default {
  projectTodos,
  getActiveTodos,
  getTodoState,
  getTodosCached,
};
