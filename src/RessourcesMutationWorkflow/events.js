// events.js for RessourcesMutationWorkflow
export const RESSOURCE_MUTATION_STARTED = 'RessourceMutationStarted';

export function ressourceMutationStartedEvent({ mutationId, droitsPeriod }) {
  return {
    event: RESSOURCE_MUTATION_STARTED,
    changeId: mutationId,
    droitsPeriod,
    timestamp: new Date().toISOString(),
  };
}
