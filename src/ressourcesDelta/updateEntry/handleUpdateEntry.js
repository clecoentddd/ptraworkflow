// CommandHandler: handleUpdateEntry
// Validates and emits EntryUpdated event

export default function handleUpdateEntry(events, command, userEmail) {
  const { entryId, changeId, newStartMonth, newEndMonth } = command.payload;
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
  // Copy all fields from previous entry, override months
  const { amount, label, code, type } = prevEntry.payload;
  return [{
    timestamp: new Date().toISOString(),
    event: 'EntryUpdated',
    entryId,
    changeId,
    ressourceVersionId,
    userEmail,
    payload: {
      amount,
      label,
      code,
      type,
      startMonth: newStartMonth,
      endMonth: newEndMonth
    }
  }];
}
