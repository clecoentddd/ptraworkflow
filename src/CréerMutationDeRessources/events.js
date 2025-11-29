export function ressourceMutationStartedEvent({ mutationId, droitsPeriod }) {
  return {
    event: 'MutationDeRessourcesCréée',
    changeId: mutationId,
    droitsPeriod,
    timestamp: new Date().toISOString(),
  };
}
