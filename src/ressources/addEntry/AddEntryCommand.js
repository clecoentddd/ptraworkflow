// Command: AddEntryCommand
// Usage: { type: 'AddEntryCommand', payload: { amount, label, date, entryId, type } }

export default function AddEntryCommand(payload) {
	console.log('[AddEntryCommand] called with payload:', payload);
	if (!payload.changeId) throw new Error('changeId is required');
	return { type: 'AddEntryCommand', payload };
}