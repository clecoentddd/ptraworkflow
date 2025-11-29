export function ressourceMutationStartedEvent({ mutationId, droitsPeriod }) {
  return {
    event: 'MutationDeRessourcesCréé',
    changeId: mutationId,
    droitsPeriod,
    timestamp: new Date().toISOString(),
  };
}
