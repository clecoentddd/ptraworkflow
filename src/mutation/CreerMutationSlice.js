// CreerMutationSlice.js
// Vertical slice: creation logic and MutationChangeCreated event

// F function: checks if a mutation can be created
export function canCreateMutation(eventLog) {
  // Only allow creation if no mutation is in progress (not completed or cancelled)
  let mutationInProgress = false;
  for (const event of eventLog) {
    if (event.event === 'MutationChangeCreated') {
      mutationInProgress = true;
    }
    if (event.event === 'MutationAnnulée' || (event.event === 'StepDone' && event.step === 7)) {
      mutationInProgress = false;
    }
  }
  return !mutationInProgress;
}

// Event creator for mutation creation
export function createMutationChangeCreatedEvent({ changeId, workflowId, userEmail }) {
  return {
    event: 'MutationChangeCreated',
    workflowId,
    changeId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
}
