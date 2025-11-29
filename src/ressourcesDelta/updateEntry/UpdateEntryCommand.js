// Command: UpdateEntryCommand
// Usage: { type: 'UpdateEntryCommand', payload: { entryId, changeId, newStartMonth, newEndMonth } }

export default function UpdateEntryCommand(payload) {
  if (!payload.changeId) throw new Error('changeId is required');
  if (!payload.entryId) throw new Error('entryId is required');
  return { type: 'UpdateEntryCommand', payload };
}
