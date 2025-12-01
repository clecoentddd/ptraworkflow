// Incremental reducer: runs on each new event
export function reducePériodesModifiées(state, e) {
  if (!state) state = {};

  if (e.event === 'EntryAdded' || e.event === 'EntryDeleted') {
    const changeId = e.changeId;
    if (!changeId) return state;

    const start = e.startMonth;
    const end = e.endMonth;
    const prev = state[changeId] || { startMonth: null, endMonth: null };

    return {
      ...state,
      [changeId]: {
        startMonth: (prev.startMonth === null || start < prev.startMonth) ? start : prev.startMonth,
        endMonth: (prev.endMonth === null || end > prev.endMonth) ? end : prev.endMonth
      }
    };
  }

  return state;
}