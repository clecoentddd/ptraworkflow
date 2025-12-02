// EntryDeletedEvent.js
// Defines the EntryDeleted event structure

export function createEntryDeletedEvent({ entryId, changeId, ressourceVersionId, userEmail }) {
	return {
		timestamp: new Date().toISOString(),
		event: 'EntryDeleted',
		entryId,
		changeId,
		ressourceVersionId,
		userEmail
	};
}