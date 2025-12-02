// Event: EntryUpdatedEvent
// Usage: emitted when an entry is updated

export default function EntryUpdatedEvent({ entryId, changeId, startMonth, endMonth, userEmail, ressourceVersionId }) {
  console.log('[EntryUpdatedEvent] called with:', { entryId, changeId, startMonth, endMonth, userEmail, ressourceVersionId });
  return {
    timestamp: new Date().toISOString(),
    event: 'EntryUpdated',
    entryId,
    changeId,
    ressourceVersionId,
    userEmail,
    payload: {
      startMonth,
      endMonth
    }
  };
}
