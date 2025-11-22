// valideDecisionProjection.js
// Pure projection to get the latest validated decision from the event log

/**
 * Returns the latest validated decision (DecisionValidee event) from the event log.
 * Useful for payment plan automation and projections.
 */
export function getLatestValidatedDecision(eventLog) {
  const validated = eventLog.filter(e => e.event === 'DecisionValidee');
  return validated.length > 0 ? validated[validated.length - 1] : null;
}

/**
 * Returns all validated decisions (DecisionValidee events) from the event log.
 */
export function getAllValidatedDecisions(eventLog) {
  return eventLog.filter(e => e.event === 'DecisionValidee');
}
