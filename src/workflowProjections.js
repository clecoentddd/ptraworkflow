// workflowProjections.js
// EventZ Workflow Checklist: Projection logic and incremental cache

import { readWorkflowEventLog } from './workflowEventLog';

// Derive the current state of all steps for a workflow from the event log
export function projectWorkflowSteps(events, workflowId) {
  // { [step]: { state, lastEvent } }
  const steps = {};
  for (let i = 1; i <= 6; i++) {
    steps[i] = { state: 'ToDo', lastEvent: null };
  }
  for (const e of events) {
    if (e.workflowId !== workflowId) continue;
    const { step, event: evt } = e;
    if (!step) continue;
    if (evt === 'StepOpened') {
      steps[step] = { state: 'Ouverte', lastEvent: e };
    } else if (evt === 'StepDone') {
      steps[step] = { state: 'Done', lastEvent: e };
    } else if (evt === 'StepSkipped') {
      steps[step] = { state: 'Skipped', lastEvent: e };
    } else if (evt === 'StepCancelled') {
      steps[step] = { state: 'Cancelled', lastEvent: e };
    }
    // StepRollback, StepOpenRejected, StepDoneRejected can be handled as needed
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
