// Query: get min/max period for a given changeId from the event log
import { reducePériodesModifiées } from './projectionPériodesModifiées';

export function queryPériodesModifiées(eventLog, changeId) {
  if (!Array.isArray(eventLog) || !changeId) return null;
  const state = eventLog.reduce(reducePériodesModifiées, {});
  return state[changeId] || null;
}
