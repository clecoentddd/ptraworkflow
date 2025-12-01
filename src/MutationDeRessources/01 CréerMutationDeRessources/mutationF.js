
import { v4 as uuidv4 } from 'uuid';
// import { publish } from '../../eventBus';

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
  // Always use latestDecision if available
  const effectivePeriod = latestDecision || droitsPeriod;

  // Business rule: no open mutation (closed if MutationAnnulée, MutationDeRessourcesAnnulée, or DecisionValidee exists for changeId)
  const openMutation = eventLog.some(e =>
    (e.event === 'MutationChangeCreated' || e.event === 'MutationDeRessourcesCréée') &&
    !eventLog.some(x => (
      x.event === 'MutationAnnulée' ||
      x.event === 'MutationDeRessourcesAnnulée' ||
      x.event === 'DecisionValidee' ||
      x.event === 'MutationDesRessourcesAnnulée'
    ) && x.changeId === e.changeId)
  );
  console.log('[createMutationF] openMutation:', openMutation);
  if (openMutation) {
    console.log('[createMutationF] Blocking: mutation already open');
    return [{
      event: 'MutationCreationBlocked',
      reason: 'A mutation is already open',
      droitsPeriod: effectivePeriod || null,
      timestamp: new Date().toISOString()
    }];
  }
  // Business rule: droits period must exist
  if (!effectivePeriod || !effectivePeriod.startMonth || !effectivePeriod.endMonth) {
    console.log('[createMutationF] Blocking: no droits period');
    return [{
      event: 'MutationCreationBlocked',
      reason: 'Aucune période de droits active.',
      droitsPeriod: effectivePeriod || null,
      timestamp: new Date().toISOString()
    }];
  }
  // Create mutation event
  const mutationEvent = {
    event: 'MutationDeRessourcesCréée',
    changeId: uuidv4(),
    droitsPeriod: effectivePeriod,
    timestamp: new Date().toISOString()
  };
  console.log('[createMutationF] mutationEvent:', mutationEvent);
  // Only return the event, do not publish here
  return [mutationEvent];
}


