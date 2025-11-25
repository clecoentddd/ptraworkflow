import { readWorkflowEventLog } from '../../workflowEventLog';
import getDatesDuDroit from './getAllDroitsPeriods';
// Query: get resource entries grouped by month for a given period from canonical event log
// Usage: QueryRessourceEntries(startMonth, endMonth) => { [month]: [entries] }
export function QueryRessourceEntries(startMonth, endMonth) {
	// Always use the canonical workflow event log for both params
	const eventLog = readWorkflowEventLog();
	console.log('[QueryRessourceEntries] eventLog:', eventLog);
	// If a period is specified, filter to that period, else use the latest
	let period = null;
	if (startMonth && endMonth) {
		const allDroitsPeriods = getDatesDuDroit(eventLog);
		period = allDroitsPeriods.find(
			p => p.startMonth === startMonth && p.endMonth === endMonth
		);
	}
	// If no period found, use the latest droits period
	if (!period) {
		const allDroitsPeriods = getDatesDuDroit(eventLog);
		period = allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;
	}
	if (!period) {
		return {};
	}
	// Return only entries for the selected period
	return computeEntries(startMonth, endMonth);
}
// Projection: compute entries grouped by month from event stream
// Usage: computeEntries(startMonth, endMonth) => { [month]: [entries] }

function monthRange(start, end) {
	// start, end: 'YYYY-MM'
	if (typeof start !== 'string' || typeof end !== 'string' || !/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) {
		return [];
	}
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

function isMonthInRange(month, start, end) {
	// All must be strings in 'YYYY-MM' format
	if (typeof month !== 'string' || typeof start !== 'string' || typeof end !== 'string') return false;
	if (!/^\d{4}-\d{2}$/.test(month) || !/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) return false;
	const [my, mm] = month.split('-').map(Number);
	const [sy, sm] = start.split('-').map(Number);
	const [ey, em] = end.split('-').map(Number);
	if (my < sy || (my === sy && mm < sm)) return false;
	if (my > ey || (my === ey && mm > em)) return false;
	return true;
}

function computeEntries(startMonth, endMonth) {
	// Always use the canonical workflow event log
	const eventLog = readWorkflowEventLog();
	// Find all cancelled changeIds (eventz compliant)
	const cancelledChangeIds = new Set(eventLog.filter(e => e.event === 'MutationAnnulée' && e.changeId).map(e => e.changeId));

	// Track resource versioning events
	const openedVersions = {};
	const closedVersions = new Set();
	const cancelledVersions = new Set();

	for (const e of eventLog) {
		if (e.event === 'RessourcesOpenedForChange') {
			openedVersions[e.changeId] = e.ressourceVersionId;
		}
		if (e.event === 'RessourcesClosedForChange') {
			closedVersions.add(e.ressourceVersionId);
		}
		if (e.event === 'RessourcesCancelled') {
			cancelledVersions.add(e.ressourceVersionId);
		}
	}

	// Find all cancelled changeIds (legacy)
	const legacyCancelled = new Set(eventLog.filter(e => e.event === 'ChangeCancelled').map(e => e.changeId));

	const byMonth = {};
	// Pre-populate all months in the requested period with empty arrays
	if (startMonth && endMonth) {
		for (const month of monthRange(startMonth, endMonth)) {
			byMonth[month] = [];
		}
	}
	for (const e of eventLog) {
		if (e.event === 'EntryAdded') {
			// Determine version id for this entry
			const versionId = openedVersions[e.changeId];
			// Ignore if cancelled (eventz, new or legacy)
			if (cancelledChangeIds.has(e.changeId) || (versionId && cancelledVersions.has(versionId)) || legacyCancelled.has(e.changeId)) continue;
			const entryStart = e.payload?.startMonth;
			const entryEnd = e.payload?.endMonth;
			if (!entryStart || !entryEnd) continue;
			for (const month of monthRange(entryStart, entryEnd)) {
				// Only include months within the requested droits period
				if (startMonth && endMonth && !isMonthInRange(month, startMonth, endMonth)) continue;
				if (!byMonth[month]) byMonth[month] = [];
				byMonth[month].push({ ...e.payload, entryId: e.entryId, changeId: e.changeId, ressourceVersionId: versionId });
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