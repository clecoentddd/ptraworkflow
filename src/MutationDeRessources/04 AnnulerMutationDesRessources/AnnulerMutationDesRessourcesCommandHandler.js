// CommandHandler: AnnulerMutationDesRessources
// Appends MutationDesRessourcesAnnulée if MutationDeRessourcesCréée exists for changeId
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import MutationDesRessourcesAnnuleeEvent from './MutationDesRessourcesAnnuleeEvent';
import { getMutationProjection } from '../02 ProjectionMutationDeRessources/projectionMutationDeRessources';

export default function AnnulerMutationDesRessourcesCommandHandler(command) {
  const { changeId, userEmail } = command;
  const eventLog = readWorkflowEventLog();
  // Check for MutationDeRessourcesCréée event
  const { statusByChangeId } = getMutationProjection(eventLog);
  if (!statusByChangeId[changeId]) throw new Error(`No MutationDeRessourcesCréée event for changeId: ${changeId}`);
  // Check if already cancelled
  const alreadyCancelled = eventLog.some(e => e.event === 'MutationDesRessourcesAnnulée' && e.changeId === changeId);
  if (alreadyCancelled) throw new Error('Mutation already cancelled for this changeId');
  // Create event
  const event = MutationDesRessourcesAnnuleeEvent({ changeId, userEmail });
  appendWorkflowEvents([event]);
  return event;
}
