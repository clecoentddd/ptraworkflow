// Event: RessourcesOpenedForChange
export default function RessourcesOpenedForChangeEvent({ changeId, ressourceVersionId, userEmail }) {
  return {
    event: 'RessourcesOpenedForChange',
    changeId,
    ressourceVersionId,
    userEmail: userEmail || 'automation',
    timestamp: new Date().toISOString(),
  };
}
