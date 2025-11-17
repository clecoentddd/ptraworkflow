// CommandHandler: handleAddEntry
// Validates and emits EntryAdded event

function isMonthBeforeOrEqual(a, b) {
	// a, b: 'YYYY-MM'
	const [ay, am] = a.split('-').map(Number);
	const [by, bm] = b.split('-').map(Number);
	return ay < by || (ay === by && am <= bm);
}

export default function handleAddEntry(events, command) {
	const { startMonth, endMonth, changeId, entryId } = command.payload;
	if (!changeId) throw new Error('changeId is required');
	// Find all cancelled changeIds
	const cancelled = new Set(events.filter(e => e.event === 'ChangeCancelled').map(e => e.changeId));
	// Check for duplicate entryId among non-cancelled entries
	const exists = events.some(e => e.entryId === entryId && e.changeId && !cancelled.has(e.changeId));
	if (exists) throw new Error('Entry with this ID already exists (active change)');
	if (!startMonth || !endMonth) throw new Error('Start and end month are required');
	if (!isMonthBeforeOrEqual(startMonth, endMonth)) throw new Error('Start month must be before or equal to end month');
	// Remove entryId and changeId from payload
	const { entryId: _eid, changeId: _cid, ...payloadRest } = command.payload;
	return [{
		ts: new Date().toISOString(),
		event: 'EntryAdded',
		entryId,
		changeId,
		payload: { ...payloadRest }
	}];
}