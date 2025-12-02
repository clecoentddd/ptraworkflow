// Event: RessourcesClosedForChange
// Usage: emitted when resources are validated/closed for a mutation

export function createRessourcesClosedForChangeEvent({ ressourceVersionId, changeId, startMonth, endMonth, userEmail }) {
  return {
    event: "RessourcesClosedForChange",
    ressourceVersionId,
    changeId,
    userEmail,
    timestamp: new Date().toISOString(),
    payload: {
      startMonth,
      endMonth
    }
  };
}
