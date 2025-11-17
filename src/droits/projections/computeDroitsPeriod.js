// Projection: compute current droits period from event stream
// Usage: computeDroitsPeriod(events) => { startMonth, endMonth }


function computeDroitsPeriod(events) {
  // Find the latest PeriodesDroitsModifiees event
  const last = [...events].reverse().find(e => e.event === 'PeriodesDroitsModifiees');
  if (!last) return { startMonth: null, endMonth: null };
  // Support both .payload and .data for backwards compatibility
  const payload = last.payload || last.data || {};
  return {
    startMonth: payload.startMonth || '',
    endMonth: payload.endMonth || ''
  };
}

export default computeDroitsPeriod;
