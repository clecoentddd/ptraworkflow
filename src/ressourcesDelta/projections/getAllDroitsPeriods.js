// Projection: get all droits periods from event stream
// Usage: getAllDroitsPeriods(events) => [{ startMonth, endMonth, ts, changeId }]

function getDatesDuDroit(events) {
  // Find all cancelled changeIds
  const cancelledChangeIds = new Set();
  for (const e of events) {
    if (e.event === 'MutationAnnulée' && e.changeId) {
      cancelledChangeIds.add(e.changeId);
    }
  }
  return events
    .filter(e => e.event === 'PeriodesDroitsModifiees' && !cancelledChangeIds.has(e.changeId))
    .map(e => {
      const payload = e.payload || e.data || {};
      return {
        startMonth: payload.startMonth || '',
        endMonth: payload.endMonth || '',
        timestamp: e.timestamp || '',
        changeId: e.changeId || '',
      };
    });
}

export default getDatesDuDroit;
