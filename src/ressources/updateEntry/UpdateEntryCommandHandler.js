// CommandHandler: UpdateEntryCommandHandler
// Validates and emits EntryUpdated event

export default function UpdateEntryCommandHandler(events, command, userEmail) {
  const { entryId, changeId, newStartMonth, newEndMonth } = command;
  if (!changeId) throw new Error('changeId is required');
  if (!entryId) throw new Error('entryId is required');
  if (!userEmail || userEmail === 'anonymous') {
    throw new Error('You need to authenticate to update an entry.');
  }
  if (!newStartMonth || !newEndMonth) throw new Error('Start and end month are required');
  // Find ressourceVersionId for this changeId
  const ressourceVersionId = (() => {
    const opened = events.find(e => e.event === 'RessourcesOpenedForChange' && e.changeId === changeId);
    return opened ? opened.ressourceVersionId : null;
  })();
  // Find the previous entry to copy all fields
  const prevEntry = events.slice().reverse().find(e => e.entryId === entryId && e.event === 'EntryAdded');
  if (!prevEntry) throw new Error('Previous entry not found for update.');
  // Copy all fields from previous entry
  const { amount, label, code, type, startMonth, endMonth } = prevEntry;
  // Generate a new entryId for the new entry
  const { v4: uuidv4 } = require('uuid');
  const newEntryId = uuidv4();
  // Emit EntryDeleted for the old entry
  const deletedEvent = {
    timestamp: new Date().toISOString(),
    event: 'EntryDeleted',
    entryId,
    changeId,
    ressourceVersionId,
    userEmail,
    code,
    label,
    amount,
    type,
    startMonth,
    endMonth
  };
  // Emit EntryAdded for the new entry
  const addedEvent = {
    timestamp: new Date().toISOString(),
    event: 'EntryAdded',
    entryId: newEntryId,
    changeId,
    ressourceVersionId,
    userEmail,
    code,
    label,
    amount,
    type,
    startMonth: newStartMonth,
    endMonth: newEndMonth
  };
  return [deletedEvent, addedEvent];
}
