// Projection: get last calculation for a changeId
// Usage: getLastCalculation(events, changeId) => { calculationId, monthly, ... }

export function getLastCalculation(events, changeId) {
  // Find all CalculationCreated events for this changeId
  const calcs = events.filter(e => e.event === 'CalculationCreated' && e.changeId === changeId);
  if (calcs.length === 0) return null;
  // Return the most recent (by ts)
  return calcs.reduce((latest, curr) => {
    return (!latest || new Date(curr.ts) > new Date(latest.ts)) ? curr : latest;
  }, null);
}
