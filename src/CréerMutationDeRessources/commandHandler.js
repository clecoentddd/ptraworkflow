import { createMutationF } from './mutationF';
import { appendWorkflowEvents, readWorkflowEventLog } from '../workflowEventLog';

/**
 * Command handler for creating a mutation de ressources.
 * Calls the F function, persists the event(s), and returns the result.
 * @param {Object} droitsPeriod - { startMonth, endMonth }
 * @returns {Array} - Array of events (either mutation started or blocked)
 */
export function handleCreerMutationDeRessourcesCommand(droitsPeriod) {
  const eventLog = readWorkflowEventLog();
  // Find latest DecisionValidee event for period
  let latestDecision = null;
  for (let i = eventLog.length - 1; i >= 0; i--) {
    const e = eventLog[i];
    if (e.event === 'DecisionValidee' && e.droitsPeriod) {
      latestDecision = e.droitsPeriod;
      break;
    }
  }
  const result = createMutationF(eventLog, latestDecision || droitsPeriod);
  // Only persist if not blocked
  if (result && result[0] && result[0].event === 'MutationDeRessourcesCréée') {
    appendWorkflowEvents(result);
  }
  return result;
}
