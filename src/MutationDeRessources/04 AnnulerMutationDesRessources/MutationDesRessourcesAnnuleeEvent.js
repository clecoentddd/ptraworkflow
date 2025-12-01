// Event: MutationDesRessourcesAnnulée
export default function MutationDesRessourcesAnnuleeEvent({ changeId, userEmail }) {
  return {
    event: 'MutationDesRessourcesAnnulée',
    changeId,
    userEmail: userEmail || 'automation',
    timestamp: new Date().toISOString(),
  };
}
