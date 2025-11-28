// MutationAnnuleeEvent.js
// Event creator for mutation cancellation

export function createMutationAnnuleeEvent({ changeId, workflowId, userEmail }) {
  return {
    event: 'MutationAnnulée',
    workflowId,
    changeId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
}
