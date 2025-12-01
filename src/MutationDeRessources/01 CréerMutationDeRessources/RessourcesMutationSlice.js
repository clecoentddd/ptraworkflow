// RessourcesMutationSlice.js
// Vertical slice for starting a mutation de ressources workflow

import { v4 as uuidv4 } from 'uuid';
import { hasOpenMutation } from '../../sharedProjections/mutationHistoryProjection';

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
    event: 'MutationDeRessourcesCréée',
    changeId: uuidv4(),
    droitsPeriod,
    timestamp: new Date().toISOString(),
  }];
}

// F function for this slice
export function ressourceMutationF(eventLog, newEvent) {
  // Only react to MutationDeRessourcesCréée
  if (newEvent.event !== 'MutationDeRessourcesCréée') return [];
  // No additional events for now (could add more rules later)
  return [];
}
