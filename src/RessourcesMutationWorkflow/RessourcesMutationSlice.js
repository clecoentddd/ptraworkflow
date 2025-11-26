// RessourcesMutationSlice.js
// Vertical slice for starting a mutation de ressources workflow

import { v4 as uuidv4 } from 'uuid';
import { hasOpenMutation } from './projections';

// Event type
export const RESSOURCE_MUTATION_STARTED = 'RessourceMutationStarted';

// Command type
export const START_RESSOURCE_MUTATION = 'StartRessourceMutation';

// Command handler
export function handleStartRessourceMutation({ droitsPeriod, eventLog }) {
  // Rule: no open change
  if (hasOpenMutation(eventLog)) {
    throw new Error('Une mutation est déjà ouverte.');
  }
  // Rule: droits period must exist
  if (!droitsPeriod || !droitsPeriod.startMonth || !droitsPeriod.endMonth) {
    throw new Error('Aucune période de droits active.');
  }
  // Emit event
  return [{
    event: RESSOURCE_MUTATION_STARTED,
    changeId: uuidv4(),
    droitsPeriod,
    timestamp: new Date().toISOString(),
  }];
}

// F function for this slice
export function ressourceMutationF(eventLog, newEvent) {
  // Only react to RessourceMutationStarted
  if (newEvent.event !== RESSOURCE_MUTATION_STARTED) return [];
  // No additional events for now (could add more rules later)
  return [];
}
