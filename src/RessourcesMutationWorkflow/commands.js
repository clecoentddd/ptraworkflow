// commands.js for RessourcesMutationWorkflow
export const START_RESSOURCE_MUTATION = 'StartRessourceMutation';

export function startRessourceMutationCommand(droitsPeriod) {
  return {
    type: START_RESSOURCE_MUTATION,
    droitsPeriod,
  };
}
