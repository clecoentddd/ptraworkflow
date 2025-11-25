// CréerMutationSlice.js
// Event-sourced slice for creating a new changeId mutation

import { createSlice } from '@reduxjs/toolkit';

// F function: eventz-compliant, checks if a mutation can be created
// Only checks for MutationChangeCreated and step status events
export function canCreateChangeId(eventLog) {
  // Project: { [changeId]: { [stepId]: status } }
  const changeSteps = {};
  for (const event of eventLog) {
    if (event.event === 'MutationChangeCreated') {
      const { changeId } = event;
      if (!changeSteps[changeId]) changeSteps[changeId] = {};
    }
    if (event.type === 'StepStatusChanged') {
      const { changeId, stepId, status } = event;
      if (!changeSteps[changeId]) changeSteps[changeId] = {};
      changeSteps[changeId][stepId] = { status };
    }
  }
  // Check for any changeId with a step not marked as 'Done' or 'Cancelled'
  for (const changeId in changeSteps) {
    const steps = changeSteps[changeId];
    for (const stepId in steps) {
      if (steps[stepId].status !== 'Done' && steps[stepId].status !== 'Cancelled') {
        return false; // Change in progress
      }
    }
  }
  return true; // No change in progress
}

const initialState = {
  changeId: null,
  error: null,
};

const créerMutationSlice = createSlice({
  name: 'créerMutation',
  initialState,
  reducers: {
    createChangeId: (state, action) => {
      const { eventLog, newChangeId } = action.payload;
      if (canCreateChangeId(eventLog)) {
        // Create mutation change event externally, todo workflow starts at step2
        state.changeId = newChangeId;
        state.error = null;
      } else {
        state.error = 'A change is already in progress.';
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { createChangeId, clearError } = créerMutationSlice.actions;
export default créerMutationSlice.reducer;
