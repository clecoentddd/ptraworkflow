// EntryAddedEvent.js
// Defines the EntryAdded event structure

export function createEntryAddedEvent({ entryId, changeId, ressourceVersionId, userEmail, payload }) {
	return {
		timestamp: new Date().toISOString(),
		event: 'EntryAdded',
		entryId,
		changeId,
		ressourceVersionId,
		userEmail,
		payload
	};
}