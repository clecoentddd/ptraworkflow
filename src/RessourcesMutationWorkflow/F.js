// F.js for RessourcesMutationWorkflow
import { RESSOURCE_MUTATION_STARTED } from './events';

export function ressourceMutationF(eventLog, newEvent) {
  // Only react to RessourceMutationStarted
  if (newEvent.event !== RESSOURCE_MUTATION_STARTED) return [];
  // No additional events for now (could add more rules later)
  return [];
}
