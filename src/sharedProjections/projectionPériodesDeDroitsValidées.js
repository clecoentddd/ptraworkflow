// Projection: Get the latest validated droits period from the event log
// Usage: getLatestDroitsPeriod(eventLog) => { startMonth, endMonth } | { error }

export function getLatestDroitsValidéesPeriod(eventLog) {
  if (!Array.isArray(eventLog)) {
    return { error: 'eventLog must be an array' };
  }
  // Find the latest DecisionValidee event
  const latestDecision = eventLog.reduce((latest, e) => {
    if (e.event === 'DecisionValidee' && e.droitsPeriod && e.droitsPeriod.startMonth && e.droitsPeriod.endMonth) {
      if (!latest || new Date(e.timestamp) > new Date(latest.timestamp)) {
        return e;
      }
    }
    return latest;
  }, null);
  if (!latestDecision) {
    return { startMonth: '', endMonth: '' };
  }
  const { droitsPeriod } = latestDecision;
  if (!droitsPeriod || !droitsPeriod.startMonth || !droitsPeriod.endMonth) {
    return { error: 'droitsPeriod fields missing in latest DecisionValidee event' };
  }
  return { startMonth: droitsPeriod.startMonth, endMonth: droitsPeriod.endMonth };
}

export default getLatestDroitsValidéesPeriod;
