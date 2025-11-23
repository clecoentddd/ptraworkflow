// workflowProjections.js
// EventZ Workflow Checklist: Projection logic and incremental cache

import { readWorkflowEventLog } from './workflowEventLog';

// Derive the current state of all steps for a workflow from the event log
export function projectWorkflowSteps(events, workflowId) {
  // Find the latest changeId for this workflow
  let latestChangeId = null;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.workflowId === workflowId && e.changeId) {
      latestChangeId = e.changeId;
      break;
    }
  }
  // Only consider events for the latest changeId, ignore events without changeId
  const filtered = events.filter(e => e.workflowId === workflowId && e.changeId && e.changeId === latestChangeId);
  // { [step]: { state, lastEvent } }
  const steps = {};
  for (let i = 1; i <= 7; i++) {
    steps[i] = { state: 'ToDo', lastEvent: null };
  }
  for (const e of filtered) {
    const { step, event: evt } = e;
    if (!step) continue;
    if (evt === 'StepOpened') {
      steps[step] = { state: 'Ouverte', lastEvent: e };
    } else if (evt === 'StepDone') {
      steps[step] = { state: 'Done', lastEvent: e };
    } else if (evt === 'StepCancelled') {
      steps[step] = { state: 'Cancelled', lastEvent: e };
    }
    // Ignore Skipped and other states
  }
  return steps;
}

// Get the state of a single step
export function getStepState(events, workflowId, step) {
  const steps = projectWorkflowSteps(events, workflowId);
  return steps[step] || { state: 'ToDo', lastEvent: null };
}

// --- Optional: Incremental projection cache ---

let cachedEventsLength = 0;
let cachedWorkflowId = null;
let cachedSteps = {};

export function getWorkflowStepsCached(workflowId) {
  const events = readWorkflowEventLog();
  if (events.length === cachedEventsLength && workflowId === cachedWorkflowId) {
    return cachedSteps;
  }
  cachedSteps = projectWorkflowSteps(events, workflowId);
  cachedEventsLength = events.length;
  cachedWorkflowId = workflowId;
  return cachedSteps;
}

export default {
  projectWorkflowSteps,
  getStepState,
  getWorkflowStepsCached,
};
