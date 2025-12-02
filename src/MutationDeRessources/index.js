import React from 'react';
import EventzFinanceTracker from '../ressources/EventzFinanceTracker';
// Removed: import TodoMutationRessourcesList from './todoMutationRessources/TodoMutationRessourcesList';
import { getWorkflowStepsCached } from '../workflowProjections';
import { créerMutationDeRessourcesCommand } from './01 CréerMutationDeRessources/commands';
import { getMutationProjection, getOverallStatus } from '../sharedProjections/mutationHistoryProjection';
import MutationStatusSummary from '../sharedComponents/MutationStatusSummary/MutationStatusSummary';
import '../MutationDeRessources.css';
import { readWorkflowEventLog } from '../workflowEventLog';
import MutationRessourcesTodoStatus from './02 ProjectionMutationDeRessources/MutationTodoStatus';
import styles from './index.module.css';

export default function MutationDeRessources() {
  const WORKFLOW_ID = 'ressource-mutation-workflow';
  // Always use the canonical event log
  const eventLog = readWorkflowEventLog();
  // getWorkflowStepsCached returns an object, convert to array for .map
  const stepsObj = getWorkflowStepsCached(WORKFLOW_ID);
  const steps = Object.entries(stepsObj).map(([id, step]) => ({ id: Number(id), ...step }));
  const [showChangeHistory, setShowChangeHistory] = React.useState(false);
  const [mutationStarted, setMutationStarted] = React.useState(false);
  const [mutationError, setMutationError] = React.useState(null);

  function handleStartMutation() {
    setMutationError(null);
    try {
      const { latestDroitsPeriod } = getOverallStatus(eventLog);
      console.log('eventLog:', eventLog);
      console.log('latestDroitsPeriod:', latestDroitsPeriod);
      if (!latestDroitsPeriod || !latestDroitsPeriod.startMonth || !latestDroitsPeriod.endMonth) {
        setMutationError('Aucune période de droits trouvée.');
        return;
      }
      // Call the command handler with both eventLog and latestDroitsPeriod
      const result = créerMutationDeRessourcesCommand(eventLog, latestDroitsPeriod);
      console.log('[MutationDeRessources] Command result:', result);
      if (result && result[0] && result[0].event === 'MutationCreationBlocked') {
        setMutationError(result[0].reason);
        return;
      }
      if (result && result[0] && result[0].event === 'MutationDeRessourcesCréée') {
        setMutationStarted(true);
        // TODO: Append event to event log here
      }
    } catch (e) {
      setMutationError(e.message);
    }
  }

  // Get overall status for display
  const overallStatus = getOverallStatus(eventLog);
  const { openMutationChangeId } = getMutationProjection(eventLog);

  return (
    <div className={styles['mutation-ressources-page']}>
      <div className={styles['mutation-header']}>
        <h1 className={styles['mutation-title']}>Mutation de Ressources</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <MutationStatusSummary overallStatus={overallStatus} eventLog={eventLog} className={styles['mutation-status-summary']} />
          <div className={styles['mutation-status-summary']}>
            <button
              className={styles['btn-start-mutation']}
              onClick={handleStartMutation}
              disabled={mutationStarted}
            >
              {mutationStarted ? 'Mutation démarrée' : 'Créer une Mutation de Ressources'}
            </button>
            {mutationError && (
              <span className={styles['mutation-error']}>{mutationError}</span>
            )}
          </div>
        </div>
        <div style={{ minWidth: 320, marginLeft: 32 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Statut de la mutation courante</div>
          <MutationRessourcesTodoStatus changeId={openMutationChangeId} />
        </div>
      </div>
      {/* Show todo list for mutation de ressources */}
      {/* Removed: <TodoMutationRessourcesList events={eventLog} /> */}
      <EventzFinanceTracker showChangeHistory={showChangeHistory} setShowChangeHistory={setShowChangeHistory} />
    </div>
  );
}
