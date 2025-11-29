
import { v4 as uuidv4 } from 'uuid';

/**
 * Pure F function to create a new mutation event after validating business rules.
 * Returns an array with the new event if allowed, or a MutationCreationBlocked event if not.
 * @param {Array} eventLog - Array of past events
 * @param {Object} droitsPeriod - { startMonth, endMonth }
 * @returns {Array} - Array of events (either mutation started or blocked)
 */
export function createMutationF(eventLog, droitsPeriod) {
  console.log('[createMutationF] eventLog:', eventLog);
  console.log('[createMutationF] droitsPeriod:', droitsPeriod);

  // Find latest DecisionValidee event for droitsPeriod
  let latestDecision = null;
  for (let i = eventLog.length - 1; i >= 0; i--) {
    const e = eventLog[i];
    if (e.event === 'DecisionValidee' && e.droitsPeriod) {
      latestDecision = e.droitsPeriod;
      break;
    }
  }

  // Business rule: no open mutation
  const openMutation = eventLog.some(e =>
    (e.event === 'MutationChangeCreated' || e.event === 'MutationDeRessourcesCréé') &&
    !eventLog.some(x => (x.event === 'MutationAnnulée' || x.event === 'MutationDeRessourcesAnnulée' || x.event === 'DecisionValidee') && x.changeId === e.changeId)
  );
  console.log('[createMutationF] openMutation:', openMutation);
  if (openMutation) {
    console.log('[createMutationF] Blocking: mutation already open');
    return [{
      event: 'MutationCreationBlocked',
      reason: 'A mutation is already open',
      droitsPeriod: latestDecision || null,
      timestamp: new Date().toISOString()
    }];
  }
  // Business rule: droits period must exist
  if (!droitsPeriod || !droitsPeriod.startMonth || !droitsPeriod.endMonth) {
    console.log('[createMutationF] Blocking: no droits period');
    return [{
      event: 'MutationCreationBlocked',
      reason: 'Aucune période de droits active.',
      droitsPeriod: latestDecision || null,
      timestamp: new Date().toISOString()
    }];
  }
  // Create mutation event
  const mutationEvent = {
    event: 'MutationDeRessourcesCréé',
    changeId: uuidv4(),
    droitsPeriod,
    timestamp: new Date().toISOString(),
  };
  console.log('[createMutationF] mutationEvent:', mutationEvent);
  return [mutationEvent];
}


