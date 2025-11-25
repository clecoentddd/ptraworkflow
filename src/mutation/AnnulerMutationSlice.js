// AnnulerMutationSlice.js
// Vertical slice: cancellation logic and MutationAnnulée event

// F function: checks if mutation can be cancelled
export function canCancelMutation(eventLog, changeId) {
  let mutationInProgress = false;
  let mutationCancelled = false;
  for (const event of eventLog) {
    if (event.changeId === changeId) {
      if (event.event === 'MutationAnnulée') mutationCancelled = true;
      if (event.event === 'MutationChangeCreated') mutationInProgress = true;
      if (event.event === 'StepDone' && event.step === 7) mutationInProgress = false;
    }
  }
  return mutationInProgress && !mutationCancelled;
}

// Event creator for cancellation
export function createMutationAnnuleeEvent({ changeId, workflowId, userEmail }) {
  return {
    event: 'MutationAnnulée',
    workflowId,
    changeId,
    timestamp: new Date().toISOString(),
    userEmail,
  };
}

