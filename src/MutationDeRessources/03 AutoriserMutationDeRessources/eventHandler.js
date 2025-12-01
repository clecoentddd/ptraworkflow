// Automation: subscribe to MutationDeRessourcesCréée and trigger AutoriserMutationDeRessourcesCommandHandler
import { subscribe, publish } from '../../eventBus';
import AutoriserMutationDeRessourcesCommandHandler from './AutoriserMutationDeRessourcesCommandHandler';
import AutoriserMutationDeRessourcesCommand from './AutoriserMutationDeRessourcesCommand';

subscribe('MutationDeRessourcesCréée', (event) => {
  console.log('[Automation] Subscription triggered for MutationDeRessourcesCréée:', event);
  try {
    const { changeId, userEmail } = event;
    const command = AutoriserMutationDeRessourcesCommand({ changeId, userEmail });
    console.log('[Automation] AutoriserMutationDeRessourcesCommand created:', command);
    AutoriserMutationDeRessourcesCommandHandler(command);
  } catch (err) {
    console.error('[Automation] AutoriserMutationDeRessources error:', err);
  }
});
