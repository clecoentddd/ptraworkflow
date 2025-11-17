// Projection: compute entries grouped by month from event stream
// Usage: computeEntries(events) => { [month]: [entries] }

function monthRange(start, end) {
	// start, end: 'YYYY-MM'
	const result = [];
	let [sy, sm] = start.split('-').map(Number);
	const [ey, em] = end.split('-').map(Number);
	while (sy < ey || (sy === ey && sm <= em)) {
		result.push(`${sy.toString().padStart(4, '0')}-${sm.toString().padStart(2, '0')}`);
		sm++;
		if (sm > 12) { sm = 1; sy++; }
	}
	return result;
}

function computeEntries(events) {
	const byMonth = {};
	// Find all cancelled changeIds
	const cancelled = new Set(events.filter(e => e.event === 'ChangeCancelled').map(e => e.changeId));
	for (const e of events) {
		if (e.event === 'EntryAdded') {
			if (cancelled.has(e.changeId)) continue;
			const { startMonth, endMonth } = e.payload || {};
			if (!startMonth || !endMonth) continue;
			for (const month of monthRange(startMonth, endMonth)) {
				if (!byMonth[month]) byMonth[month] = [];
				byMonth[month].push({ ...e.payload, entryId: e.entryId, changeId: e.changeId });
			}
		}
		if (e.event === 'EntryDeleted') {
			for (const month in byMonth) {
				byMonth[month] = byMonth[month].filter(ent => ent.entryId !== e.entryId);
			}
		}
		if (e.event === 'EntryUpdated') {
			for (const month in byMonth) {
				byMonth[month] = byMonth[month].map(ent =>
					ent.entryId === e.entryId ? { ...ent, ...e.payload } : ent
				);
			}
		}
	}
	return byMonth;
}

export default computeEntries;