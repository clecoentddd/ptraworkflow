// projections.js for RessourcesMutationWorkflow
import getAllDroitsPeriods from '../ressources/projections/getAllDroitsPeriods';


// Unified mutation projection
export function projectRessourceMutation(eventLog) {
  const state = {
    latestDroitsPeriod: null,
    startedMutations: [],
    annulledIds: new Set()
  };

  for (const e of eventLog) {
    switch (e.event) {
      case 'RessourceMutationStarted':
        state.startedMutations.push(e);
        break;

      case 'MutationAnnulée':
      case 'RessourceMutationAnnulée':
      case 'RessourceMutationCancelled':
        state.annulledIds.add(e.changeId);
        break;

      default:
        break;
    }
  }

  // Fallback: use droitsPeriod from latest mutation if available
  if (!state.latestDroitsPeriod) {
    const latestMutation = [...state.startedMutations].reverse().find(m => !state.annulledIds.has(m.changeId));
    state.latestDroitsPeriod = latestMutation?.droitsPeriod || null;
  }

  const latestMutation = [...state.startedMutations]
    .reverse()
    .find(m => !state.annulledIds.has(m.changeId));

  return {
    latestDroitsPeriod: state.latestDroitsPeriod,
    latestMutation,
    hasOpenMutation: !!latestMutation,
    mutations: state.startedMutations
  };
}

// Aliases for compatibility
export function getOverallStatus(eventLog) {
  const proj = projectRessourceMutation(eventLog);
  return {
    latestDroitsPeriod: proj.latestDroitsPeriod,
    latestMutation: proj.latestMutation,
    hasOpenMutation: proj.hasOpenMutation
  };
}

export function getMutationProjection(eventLog) {
  const proj = projectRessourceMutation(eventLog);
  return {
    mutations: proj.mutations,
    openMutation: proj.hasOpenMutation,
    latestDroitsPeriod: proj.latestDroitsPeriod
  };
}


export function getLatestDroitsPeriod(eventLog) {
  return projectRessourceMutation(eventLog).latestDroitsPeriod;
}


export function hasOpenMutation(eventLog) {
  return projectRessourceMutation(eventLog).hasOpenMutation;
}
