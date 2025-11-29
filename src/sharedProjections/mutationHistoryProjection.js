// mutationHistoryProjection.js (moved from projections.js)
import getAllDroitsPeriods from '../ressources/projections/getAllDroitsPeriods';

export function projectRessourceMutation(eventLog) {
  const startedMutations = [];
  const annulledIds = new Set();
  const validatedIds = new Set();
  const mutationTypes = {};
  const mutationPeriods = {};
  // For each changeId, store the CalculationCreated event that comes before DecisionValidee
  const calculationByChangeId = {};

  for (const e of eventLog) {
    switch (e.event) {
      case 'MutationChangeCreated':
        startedMutations.push(e);
        mutationTypes[e.changeId] = 'MutationChange';
        mutationPeriods[e.changeId] = null;
        break;
      case 'MutationDeRessourcesCréée':
        startedMutations.push(e);
        mutationTypes[e.changeId] = 'RessourceMutation';
        mutationPeriods[e.changeId] = null;
        break;
      case 'MutationAnnulée':
      case 'RessourceMutationAnnulé':
        annulledIds.add(e.changeId);
        break;
      case 'DecisionValidee':
        validatedIds.add(e.changeId);
        break;
      case 'PeriodesDroitsModifiees':
        if (e.changeId) {
          mutationPeriods[e.changeId] = e.payload?.period || null;
        }
        break;
      case 'CalculationCreated':
        if (e.changeId) {
          // Only store CalculationCreated if DecisionValidee for this changeId has not yet occurred
          if (!validatedIds.has(e.changeId) && !calculationByChangeId[e.changeId]) {
            calculationByChangeId[e.changeId] = {
              startMonth: e.startMonth || null,
              endMonth: e.endMonth || null
            };
          }
        }
        break;
      default:
        break;
    }
  }

  // Build mutation status list
  const mutations = startedMutations.map(m => {
    let status = 'created';
    if (annulledIds.has(m.changeId)) status = 'annulé';
    else if (validatedIds.has(m.changeId)) status = 'décision made';
    // Only use CalculationCreated that comes before DecisionValidee
    const months = calculationByChangeId[m.changeId] || { startMonth: null, endMonth: null };
    return {
      changeId: m.changeId,
      type: mutationTypes[m.changeId] || 'unknown',
      status,
      period: mutationPeriods[m.changeId] || null,
      startMonth: months.startMonth,
      endMonth: months.endMonth
    };
  });

  // Find open mutations: started, not annulled, not validated
  const openMutations = mutations.filter(m => m.status === 'created');

  // Use period from the latest mutation with status 'décision made'
  let latestDroitsPeriod = null;
  const latestDecisionMutation = [...mutations].reverse().find(m => m.status === 'décision made');
  if (latestDecisionMutation) {
    latestDroitsPeriod = {
      startMonth: latestDecisionMutation.startMonth,
      endMonth: latestDecisionMutation.endMonth
    };
  }

  const latestMutation = openMutations.length > 0 ? openMutations[openMutations.length - 1] : null;
  const openMutationChangeId = latestMutation ? latestMutation.changeId : null;

  return {
    latestDroitsPeriod,
    latestMutation,
    hasOpenMutation: openMutations.length > 0,
    openMutationChangeId,
    mutations
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
    mutations: proj.mutations.map(({ period, ...rest }) => rest),
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
