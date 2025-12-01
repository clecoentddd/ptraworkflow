// Command: AnnulerMutationDesRessources
export default function AnnulerMutationDesRessourcesCommand({ changeId, userEmail }) {
  if (!changeId) throw new Error('changeId is required');
  return {
    command: 'AnnulerMutationDesRessources',
    changeId,
    userEmail: userEmail || 'automation',
    timestamp: new Date().toISOString(),
  };
}
