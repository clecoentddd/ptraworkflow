// Event: EntryUpdatedEvent
// Usage: emitted when an entry is updated

export default function EntryUpdatedEvent({ entryId, changeId, newStartMonth, newEndMonth, userEmail, ressourceVersionId }) {
  return {
    timestamp: new Date().toISOString(),
    event: 'EntryUpdated',
    entryId,
    changeId,
    ressourceVersionId,
    userEmail,
    payload: {
      newStartMonth,
      newEndMonth
    }
  };
}
