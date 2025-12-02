// CommandHandler: handleDeleteEntry
// Emits EntryDeleted event

import { createEntryDeletedEvent } from './EntryDeletedEvent';
import { appendWorkflowEvents } from '../../workflowEventLog';

export default function handleDeleteEntry(events, command, userEmail) {
	console.log('[handleDeleteEntry] called with:', { events, command, userEmail });
	const entryId = command.payload?.entryId;
	const matchingEvents = events.filter(e => e.entryId === entryId);
	console.log('[handleDeleteEntry] matchingEvents:', matchingEvents.map(e => ({ event: e.event, entryId: e.entryId })));
	if (!userEmail || userEmail === 'anonymous') {
		throw new Error('Vous devez vous authentifier pour supprimer une entrée.');
	}
	// Check if entry exists
	const exists = matchingEvents.some(e => e.event !== 'EntryDeleted');
	if (!exists) throw new Error('Entry does not exist');
	// Try to get changeId from the last event for this entry
	const last = [...events].reverse().find(e => e.entryId === entryId);
	const changeId = last && last.changeId ? last.changeId : 'default';
	// Find ressourceVersionId for this changeId
	const ressourceVersionId = (() => {
		const opened = events.find(e => e.event === 'RessourcesOpenedForChange' && e.changeId === changeId);
		return opened ? opened.ressourceVersionId : null;
	})();
	const event = createEntryDeletedEvent({
		entryId,
		changeId,
		ressourceVersionId,
		userEmail
	});
	console.log('[handleDeleteEntry] emitting event:', event);
	appendWorkflowEvents([event]);
	return [event];
}