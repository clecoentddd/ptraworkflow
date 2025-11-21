// workflowRules.js
// EventZ F function for workflow checklist: enforces business rules and emits additional events as needed
import { projectWorkflowSteps } from './workflowProjections';

/**
 * F(Y, newEvent): Given the full event log Y and a new event, returns zero or more new events to append.
 * Implements automatic step opening, business rules, etc.
 */
export function workflowF(Y, newEvent) {
  const { event, workflowId, step } = newEvent;
  const emitted = [];
  if (!workflowId) return emitted;
  const steps = projectWorkflowSteps(Y, workflowId);

  // Auto-open next step when a step is Done or Skipped
  if ((event === 'StepDone' || event === 'StepSkipped') && step >= 1 && step <= 5) {
    const nextStep = step + 1;
    if (steps[nextStep] && steps[nextStep].state === 'ToDo') {
      emitted.push({
        event: 'StepOpened',
        workflowId,
        step: nextStep,
      });
    }
  }
  // Add more business rules as needed
  return emitted;
}

export default workflowF;
