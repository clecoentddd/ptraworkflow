import { readWorkflowEventLog } from '../../workflowEventLog';
import getDatesDuDroit from './getAllDroitsPeriods';
// Query: get resource entries grouped by month for a given period from canonical event log
// Usage: queryRessourceEntries(startMonth, endMonth) => { [month]: [entries] }
export function queryRessourceEntries(startMonth, endMonth) {
	// Always use the canonical workflow event log for both params
	const eventLog = readWorkflowEventLog();
	console.log('[queryRessourceEntries] eventLog:', eventLog);
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
			const versionId = openedVersions[e.changeId];
			const isCancelled = cancelledChangeIds.has(e.changeId) || (versionId && cancelledVersions.has(versionId)) || legacyCancelled.has(e.changeId);
			console.log('[computeEntries] EntryAdded:', {
				entryId: e.entryId,
				changeId: e.changeId,
				versionId,
				isCancelled,
				entryStart: e.payload?.startMonth,
				entryEnd: e.payload?.endMonth
			});
			if (isCancelled) {
				console.log('[computeEntries] Skipping cancelled entry:', e.entryId);
				continue;
			}
			const entryStart = e.payload?.startMonth;
			const entryEnd = e.payload?.endMonth;
			if (!entryStart || !entryEnd) {
				console.log('[computeEntries] Skipping entry with missing start/end:', e.entryId);
				continue;
			}
			for (const month of monthRange(entryStart, entryEnd)) {
				if (startMonth && endMonth && !isMonthInRange(month, startMonth, endMonth)) {
					console.log('[computeEntries] Skipping month out of range:', month, 'for entry:', e.entryId);
					continue;
				}
				if (!byMonth[month]) byMonth[month] = [];
				byMonth[month].push({ ...e.payload, entryId: e.entryId, changeId: e.changeId, ressourceVersionId: versionId });
				console.log('[computeEntries] Added entry to month:', month, 'entryId:', e.entryId);
			}
		}
		if (e.event === 'EntryDeleted') {
			console.log('[computeEntries] EntryDeleted:', e.entryId);
			for (const month in byMonth) {
				const before = byMonth[month].length;
				byMonth[month] = byMonth[month].filter(ent => ent.entryId !== e.entryId);
				const after = byMonth[month].length;
				if (before !== after) {
					console.log('[computeEntries] Removed entry from month:', month, 'entryId:', e.entryId);
				}
			}
		}
		if (e.event === 'EntryUpdated') {
			console.log('[computeEntries] EntryUpdated:', e.entryId);
			// Remove entry from all months
			for (const month in byMonth) {
				byMonth[month] = byMonth[month].filter(ent => ent.entryId !== e.entryId);
			}
			// Find the original entry data from the last EntryAdded event
			const originalEntry = [...eventLog].reverse().find(ev => ev.event === 'EntryAdded' && ev.entryId === e.entryId);
			if (!originalEntry) {
				console.log('[computeEntries] No original EntryAdded found for EntryUpdated:', e.entryId);
				return;
			}
			const entryStart = e.payload?.startMonth;
			const entryEnd = e.payload?.endMonth;
			if (!entryStart || !entryEnd) {
				console.log('[computeEntries] Skipping EntryUpdated with missing startMonth/endMonth:', e.entryId);
				return;
			}
			// Merge all fields: original payload + updated payload
			const mergedEntry = {
				...originalEntry.payload,
				...e.payload,
				entryId: e.entryId,
				changeId: e.changeId,
				ressourceVersionId: e.ressourceVersionId
			};
			for (const month of monthRange(entryStart, entryEnd)) {
				if (startMonth && endMonth && !isMonthInRange(month, startMonth, endMonth)) {
					console.log('[computeEntries] Skipping month out of range for EntryUpdated:', month, 'entryId:', e.entryId);
					continue;
				}
				if (!byMonth[month]) byMonth[month] = [];
				byMonth[month].push(mergedEntry);
				console.log('[computeEntries] Added updated entry to month:', month, 'entryId:', e.entryId);
			}
		}
	}
	console.log('[computeEntries] Final byMonth:', byMonth);
	return byMonth;
}

export default computeEntries;