// Command: DeleteEntryCommand
// Usage: { type: 'DeleteEntryCommand', entryId }

export default function DeleteEntryCommand(entryId) {
	return { type: 'DeleteEntryCommand', entryId };
}