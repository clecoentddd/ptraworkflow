// MutationChangeCreatedEvent.js
// Event creator for mutation creation

export function createMutationChangeCreatedEvent({ changeId, workflowId, userEmail }) {
  return {
    event: 'MutationChangeCreated',
    workflowId,
    changeId: changeId || require('uuid').v4(),
    timestamp: new Date().toISOString(),
    userEmail,
  };
}
