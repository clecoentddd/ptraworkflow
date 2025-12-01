import { readWorkflowEventLog } from '../../../workflowEventLog';
import {getLatestDroitsValidéesPeriod} from '../../../sharedProjections/projectionPériodesDeDroitsValidées';
// Query: get resource entries grouped by month for a given period from canonical event log
// Usage: QueryRessourceEntries(startMonth, endMonth) => { [month]: [entries] }

// Query: get resource entries grouped by month for the latest validated droits period
export function queryRessourceEntries() {
  const eventLog = readWorkflowEventLog();
  const droitsPeriod = getLatestDroitsValidéesPeriod(eventLog);
  console.log('queryRessourceEntries: Latest validated droits period:', droitsPeriod);
  if (!droitsPeriod || !droitsPeriod.startMonth || !droitsPeriod.endMonth) {
    return { entriesByMonth: {}, droitsPeriod };
  }
  const entriesByMonth = computeEntries(droitsPeriod.startMonth, droitsPeriod.endMonth);
  return { entriesByMonth, droitsPeriod };
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
  // Find all cancelled changeIds
  const cancelledChangeIds = new Set(eventLog.filter(e =>
    (e.event === 'MutationAnnulée' || e.event === 'MutationDeRessourcesAnnulée') && e.changeId
  ).map(e => e.changeId));

  const byMonth = {};
  // Pre-populate all months in the requested period with empty arrays
  if (startMonth && endMonth) {
    for (const month of monthRange(startMonth, endMonth)) {
      byMonth[month] = [];
    }
  }
  for (const e of eventLog) {
    if (e.event === 'EntryAdded') {
      if (cancelledChangeIds.has(e.changeId)) continue;
      const entryStart = e.payload?.startMonth;
      const entryEnd = e.payload?.endMonth;
      if (!entryStart || !entryEnd) continue;
      for (const month of monthRange(entryStart, entryEnd)) {
        // Only include months within the validated droits period
        if (startMonth && endMonth && !isMonthInRange(month, startMonth, endMonth)) continue;
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push({ ...e.payload, entryId: e.entryId, changeId: e.changeId });
      }
    }
    if (e.event === 'EntryDeleted') {
      for (const month in byMonth) {
        byMonth[month] = byMonth[month].filter(ent => ent.entryId !== e.entryId);
      }
    }
  }
  return byMonth;
}

export default computeEntries;
