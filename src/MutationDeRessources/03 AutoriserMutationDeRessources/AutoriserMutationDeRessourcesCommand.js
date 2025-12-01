// Command: AutoriserMutationDeRessources
export default function AutoriserMutationDeRessourcesCommand({ changeId, userEmail }) {
  if (!changeId) throw new Error('changeId is required');
  return {
    command: 'AutoriserMutationDeRessources',
    changeId,
    userEmail: userEmail || 'automation',
    timestamp: new Date().toISOString(),
  };
}
