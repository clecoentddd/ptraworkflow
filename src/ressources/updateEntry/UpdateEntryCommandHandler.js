// CommandHandler: UpdateEntryCommandHandler
// Emits EntryUpdatedEvent

import EntryUpdatedEvent from './EntryUpdatedEvent';

export default function UpdateEntryCommandHandler(events, command, userEmail) {
  console.log('[UpdateEntryCommandHandler] called with:', { events, command, userEmail });
  const { entryId, changeId, ressourceVersionId, startMonth, endMonth } = command.payload;
  console.log('[UpdateEntryCommandHandler] payload:', command.payload);
  if (!changeId) throw new Error('changeId is required');
  if (!ressourceVersionId) throw new Error('ressourceVersionId is required');
  if (!entryId) throw new Error('entryId is required');
  if (!userEmail || userEmail === 'anonymous') {
    throw new Error('You need to authenticate to update an entry.');
  }
  if (!startMonth || !endMonth) throw new Error('Start and end month are required');
  // Find the previous entry to copy all fields (if needed for projections)
  const prevEntry = events.slice().reverse().find(e => e.entryId === entryId && e.event === 'EntryAdded');
  if (!prevEntry) throw new Error('Previous entry not found for update.');
  // Emit EntryDeletedEvent and EntryAddedEvent
  const { createEntryDeletedEvent } = require('../deleteEntry/EntryDeletedEvent');
  const { createEntryAddedEvent } = require('../addEntry/EntryAddedEvent');
  const deleteEvent = createEntryDeletedEvent({
    entryId,
    changeId,
    ressourceVersionId,
    userEmail
  });
  const addEvent = createEntryAddedEvent({
    entryId,
    changeId,
    ressourceVersionId,
    userEmail,
    payload: {
      ...prevEntry.payload,
      startMonth,
      endMonth
    }
  });
  return [deleteEvent, addEvent];
}
