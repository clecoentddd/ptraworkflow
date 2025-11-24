// CommandHandler: handleDeleteEntry
// Emits EntryDeleted event

export default function handleDeleteEntry(events, command, userEmail) {
	if (!userEmail || userEmail === 'anonymous') {
		throw new Error('You need to authenticate to delete an entry.');
	}
	// Check if entry exists
	const exists = events.some(e => e.entryId === command.entryId && e.event !== 'EntryDeleted');
	if (!exists) throw new Error('Entry does not exist');
	// Try to get changeId from the last event for this entry
	const last = [...events].reverse().find(e => e.entryId === command.entryId);
	const changeId = last && last.changeId ? last.changeId : 'default';
	return [{
		timestamp: new Date().toISOString(),
		event: 'EntryDeleted',
		entryId: command.entryId,
		changeId,
		userEmail: userEmail
	}];
}