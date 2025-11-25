// droitsEntriesProjection.js
// Eventz-compliant projection: combines latest droits period and valid entries for that period

import getDatesDuDroit from '../ressources/projections/getAllDroitsPeriods';
import computeEntries from '../ressources/projections/computeEntries';

/**
 * Returns the latest droits period and valid entries for that period
 * @param {Array} events - canonical event log
 * @returns {Object} { period, entriesByMonth }
 */
export function projectDroitsPeriodWithEntries(events) {
  const periods = getDatesDuDroit(events);
  const latestPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
  if (!latestPeriod) return { period: null, entriesByMonth: {} };

  // Compute all entries, then filter by period
  const allEntriesByMonth = computeEntries();
  const { startMonth, endMonth } = latestPeriod;
  // Filter entries to only those within the period
  const filteredEntriesByMonth = {};
  for (const month in allEntriesByMonth) {
    if (isMonthInRange(month, startMonth, endMonth)) {
      filteredEntriesByMonth[month] = allEntriesByMonth[month];
    }
  }
  return { period: latestPeriod, entriesByMonth: filteredEntriesByMonth };
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
