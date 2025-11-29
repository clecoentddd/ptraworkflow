// CommandHandler: handleAddEntry
// Validates and emits EntryAdded event

function isMonthBeforeOrEqual(a, b) {
	// a, b: 'YYYY-MM'
	const [ay, am] = a.split('-').map(Number);
	const [by, bm] = b.split('-').map(Number);
	return ay < by || (ay === by && am <= bm);
}

export default function handleAddEntry(events, command, userEmail) {
	const { startMonth, endMonth, changeId, entryId } = command.payload;
	if (!changeId) throw new Error('changeId is required');
	if (!userEmail || userEmail === 'anonymous') {
		throw new Error('You need to authenticate to add an entry.');
	}
	// Find all cancelled changeIds
	const cancelled = new Set(events.filter(e => e.event === 'ChangeCancelled').map(e => e.changeId));
	// Check for duplicate entryId among non-cancelled entries
	const exists = events.some(e => e.entryId === entryId && e.changeId && !cancelled.has(e.changeId));
	if (exists) throw new Error('Entry with this ID already exists (active change)');
	if (!startMonth || !endMonth) throw new Error('Start and end month are required');
	if (!isMonthBeforeOrEqual(startMonth, endMonth)) throw new Error('Start month must be before or equal to end month');
	// Find ressourceVersionId for this changeId
	const ressourceVersionId = (() => {
		const opened = events.find(e => e.event === 'RessourcesOpenedForChange' && e.changeId === changeId);
		return opened ? opened.ressourceVersionId : null;
	})();
	const { entryId: _eid, changeId: _cid, ...payloadRest } = command.payload;
	return [{
		timestamp: new Date().toISOString(),
		event: 'EntryAdded',
		entryId,
		changeId,
		ressourceVersionId,
		userEmail: userEmail,
		payload: { ...payloadRest }
	}];
}