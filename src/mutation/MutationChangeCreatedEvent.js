// MutationChangeCreatedEvent.js
// Business event creator for mutation change creation

export function createMutationChangeCreatedEvent({ changeId, userEmail, workflowId }) {
  const event = {
    event: "MutationChangeCreated",
    changeId,
    workflowId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
  console.log('[MutationChangeCreatedEvent] Created:', event);
  return event;
}
