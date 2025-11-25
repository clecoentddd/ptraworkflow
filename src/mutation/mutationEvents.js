// mutationEvents.js
// Event type constants and event creators for mutation workflow

export const MUTATION_CHANGE_CREATED_EVENT = 'MutationChangeCreated';
export const MUTATION_ANNULEE_EVENT = 'MutationAnnulée';

// Event creator for mutation creation
export function createMutationChangeCreatedEvent({ changeId, workflowId, userEmail }) {
  return {
    event: MUTATION_CHANGE_CREATED_EVENT,
    workflowId,
    changeId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
}

// Event creator for mutation cancellation
export function createMutationAnnuleeEvent({ changeId, workflowId, userEmail }) {
  return {
    event: MUTATION_ANNULEE_EVENT,
    workflowId,
    changeId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
}
