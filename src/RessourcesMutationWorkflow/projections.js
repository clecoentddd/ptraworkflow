
// projections.js for RessourcesMutationWorkflow
import getAllDroitsPeriods from '../ressources/projections/getAllDroitsPeriods';

// Returns a summary projection of all mutation events
export function getMutationProjection(eventLog) {
  const mutations = eventLog.filter(e => e.event === 'RessourceMutationStarted');
  const annulled = eventLog.filter(e => e.event === 'MutationAnnulée' || e.event === 'RessourceMutationAnnulée' || e.event === 'RessourceMutationCancelled');
  return {
    mutations,
    annulled,
    openMutation: hasOpenMutation(eventLog),
    latestDroitsPeriod: getLatestDroitsPeriod(eventLog)
  };
}

export function getLatestDroitsPeriod(eventLog) {
  const allDroitsPeriods = getAllDroitsPeriods(eventLog);
  return allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;
}

export function hasOpenMutation(eventLog) {
  // Find all started mutations
  const started = eventLog.filter(e => e.event === 'RessourceMutationStarted');
  // Find all annulled/cancelled mutations
  const annulledIds = new Set(
      eventLog
        .filter(e => e.event === 'MutationAnnulée' || e.event === 'RessourceMutationAnnulée' || e.event === 'RessourceMutationCancelled')
        .map(e => e.changeId)
  );
  // An open mutation is one that is started and not annulled/cancelled
    return started.some(e => e.changeId && !annulledIds.has(e.changeId));
}
