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
	// Filter eventLog to only include events up to the end of the selected period (optional, for strictness)
	// For now, just use the canonical event log in computeEntries
	return computeEntries();
}
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

function isMonthInRange(month, start, end) {
	if (!month || !start || !end) return false;
	const [my, mm] = month.split('-').map(Number);
	const [sy, sm] = start.split('-').map(Number);
	const [ey, em] = end.split('-').map(Number);
	if (my < sy || (my === sy && mm < sm)) return false;
	if (my > ey || (my === ey && mm > em)) return false;
	return true;
}

function computeEntries() {
	// Always use the canonical workflow event log
	const eventLog = readWorkflowEventLog();
	const allDroitsPeriods = getDatesDuDroit(eventLog || []);
	const latestDroitsPeriod = allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;

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
	for (const e of eventLog) {
		if (e.event === 'EntryAdded') {
			// Determine version id for this entry
			const versionId = openedVersions[e.changeId];
			// Ignore if cancelled (new or legacy)
			if ((versionId && cancelledVersions.has(versionId)) || legacyCancelled.has(e.changeId)) continue;
			const { startMonth, endMonth } = e.payload || {};
			if (!startMonth || !endMonth) continue;
			for (const month of monthRange(startMonth, endMonth)) {
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