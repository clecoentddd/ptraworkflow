// Incremental reducer: runs on each new event
export function reducePériodesModifiées(state, e) {
  if (!state) state = {};

  if (!state) state = {};
  if (e.event === 'EntryAdded') {
    const changeId = e.changeId;
    if (!changeId) return state;
    const entryId = e.entryId;
    const start = e.payload?.startMonth || e.startMonth;
    const end = e.payload?.endMonth || e.endMonth;
    const prev = state[changeId] || { entries: {}, startMonth: null, endMonth: null };
    // Add entry
    const newEntries = { ...prev.entries, [entryId]: { startMonth: start, endMonth: end } };
    // Recompute min/max
    const allStarts = Object.values(newEntries).map(x => x.startMonth).filter(Boolean);
    const allEnds = Object.values(newEntries).map(x => x.endMonth).filter(Boolean);
    return {
      ...state,
      [changeId]: {
        entries: newEntries,
        startMonth: allStarts.length ? allStarts.reduce((a, b) => a < b ? a : b) : null,
        endMonth: allEnds.length ? allEnds.reduce((a, b) => a > b ? a : b) : null
      }
    };
  }
  if (e.event === 'EntryDeleted') {
    const changeId = e.changeId;
    if (!changeId) return state;
    const entryId = e.entryId;
    const prev = state[changeId] || { entries: {}, startMonth: null, endMonth: null };
    // Remove entry
    const newEntries = { ...prev.entries };
    delete newEntries[entryId];
    // Recompute min/max
    const allStarts = Object.values(newEntries).map(x => x.startMonth).filter(Boolean);
    const allEnds = Object.values(newEntries).map(x => x.endMonth).filter(Boolean);
    return {
      ...state,
      [changeId]: {
        entries: newEntries,
        startMonth: allStarts.length ? allStarts.reduce((a, b) => a < b ? a : b) : null,
        endMonth: allEnds.length ? allEnds.reduce((a, b) => a > b ? a : b) : null
      }
    };
  }

  return state;
}