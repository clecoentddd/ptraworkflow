// Command: DeleteEntryCommand
// Usage: { type: 'DeleteEntryCommand', payload: { entryId } }

export default function DeleteEntryCommand(payload) {
	console.log('[DeleteEntryCommand] called with payload:', payload);
	if (!payload.entryId) throw new Error('entryId is required');
	return { type: 'DeleteEntryCommand', payload };
}