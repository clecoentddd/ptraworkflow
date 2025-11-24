// Projection: get all droits periods from event stream
// Usage: getAllDroitsPeriods(events) => [{ startMonth, endMonth, ts, changeId }]

function getDatesDuDroit(events) {
  return events
    .filter(e => e.event === 'PeriodesDroitsModifiees')
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
