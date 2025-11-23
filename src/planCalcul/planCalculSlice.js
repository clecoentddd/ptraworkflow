
// Pure projection: returns latest CalculationCreated event per changeId
export function projectLatestCalculation(eventLog) {
  // Only consider CalculationCreated events
  const calculations = eventLog
    .filter(e => e.event === 'CalculationCreated')
    .reduce((acc, e) => {
      acc[e.changeId] = e; // Overwrite with latest for each changeId
      return acc;
    }, {});
  return calculations; // { [changeId]: latest CalculationCreated event }
}
