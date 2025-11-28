// CreerMutationSlice.js
// Vertical slice: creation logic and MutationChangeCreated event

import { v4 as uuidv4 } from 'uuid';
import { createMutationChangeCreatedEvent } from './events/MutationChangeCreatedEvent';
import { hasOpenMutation } from '../../sharedProjections/mutationHistoryProjection';

// F function: checks if a mutation can be created
export function canCreateMutation(eventLog) {
  // Use shared projection logic to determine if a mutation can be created
  return !hasOpenMutation(eventLog);
}

// Event creator for mutation creation is now imported from events/MutationChangeCreatedEvent.js
