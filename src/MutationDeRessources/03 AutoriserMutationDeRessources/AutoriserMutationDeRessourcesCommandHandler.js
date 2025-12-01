// CommandHandler: AutoriserMutationDeRessources
// Emits RessourcesOpenedForChange event if MutationDeRessourcesCréée exists
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import { v4 as uuidv4 } from 'uuid';

export default function AutoriserMutationDeRessourcesCommandHandler(command) {
  const { changeId, userEmail } = command;
  const eventLog = readWorkflowEventLog();
  // Check for MutationDeRessourcesCréée event
  const mutation = eventLog.find(e => e.event === 'MutationDeRessourcesCréée' && e.changeId === changeId);
  if (!mutation) throw new Error('No MutationDeRessourcesCréée event for this changeId');
  // Check if already opened
  const alreadyOpened = eventLog.some(e => e.event === 'RessourcesOpenedForChange' && e.changeId === changeId);
  if (alreadyOpened) throw new Error('Ressources already opened for this changeId');
  // Create event
  const event = {
    event: 'RessourcesOpenedForChange',
    changeId,
    ressourceVersionId: uuidv4(),
    userEmail: userEmail || 'automation',
    timestamp: new Date().toISOString(),
  };
  appendWorkflowEvents([event]);
  return event;
}
