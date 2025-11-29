// commands.js for RessourcesMutationWorkflow
import { createMutationF } from './mutationF';
export const START_RESSOURCE_MUTATION = 'StartRessourceMutation';

// Refactored to use createMutationF for business rule validation and event creation
// Usage: créerMutationDeRessourcesCommand(eventLog, droitsPeriod)
export function créerMutationDeRessourcesCommand(eventLog, droitsPeriod) {
  // Defensive: ensure eventLog is always an array
  const safeEventLog = Array.isArray(eventLog) ? eventLog : [];
  return createMutationF(safeEventLog, droitsPeriod);
}

