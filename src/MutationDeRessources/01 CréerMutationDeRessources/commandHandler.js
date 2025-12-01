import { createMutationF } from './mutationF';
import { appendWorkflowEvents, readWorkflowEventLog } from '../../workflowEventLog';
import { getLatestDroitsValidéesPeriod } from '../../sharedProjections/projectionPériodesDeDroitsValidées';
import { publish } from '../../eventBus';

/**
 * Command handler for creating a mutation de ressources.
 * Calls the F function, persists the event(s), and returns the result.
 * @param {Object} droitsPeriod - { startMonth, endMonth }
 * @returns {Array} - Array of events (either mutation started or blocked)
 */
export function handleCreerMutationDeRessourcesCommand(droitsPeriod) {
  const eventLog = readWorkflowEventLog();
  // Use projection to get latest droits period
  const latestPeriod = getLatestDroitsValidéesPeriod(eventLog);
  let effectivePeriod = droitsPeriod;
  if (latestPeriod && latestPeriod.startMonth && latestPeriod.endMonth) {
    effectivePeriod = latestPeriod;
  }
  const result = createMutationF(eventLog, effectivePeriod);
  // Only persist if not blocked
  if (result && result[0] && result[0].event === 'MutationDeRessourcesCréée') {
    appendWorkflowEvents(result);
    publish('MutationDeRessourcesCréée', result[0]);
  }
  return result;
}
