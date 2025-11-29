import React from 'react';
import EventzFinanceTracker from '../../ressourcesDelta/EventzFinanceTracker';
import TodoMutationRessourcesList from '../../todoMutationRessources/TodoMutationRessourcesList';
import { getWorkflowStepsCached } from '../../workflowProjections';
import { créerMutationDeRessourcesCommand } from '../commands';
import { getMutationProjection, getOverallStatus } from '../../sharedProjections/mutationHistoryProjection';
import MutationStatusSummary from '../../components/MutationStatusSummary';
import '../MutationDeRessources.css';
import { readWorkflowEventLog } from '../../workflowEventLog';

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
      if (result && result[0] && result[0].event === 'MutationDeRessourcesCréé') {
        setMutationStarted(true);
        // TODO: Append event to event log here
      }
    } catch (e) {
      setMutationError(e.message);
    }
  }

  // Get overall status for display
  const overallStatus = getOverallStatus(eventLog);

  return (
    <div className="mutation-ressources-page">
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '16px', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Mutation de Ressources</h1>
      </div>
      <MutationStatusSummary overallStatus={overallStatus} eventLog={eventLog} />
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn-start-mutation"
          style={{
            padding: '10px 22px',
            background: '#43a047',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(67, 160, 71, 0.15)'
          }}
          onClick={handleStartMutation}
          disabled={mutationStarted}
        >
          {mutationStarted ? 'Mutation démarrée' : 'Créer une Mutation de Ressources'}
        </button>
        {mutationError && (
          <span style={{ color: 'red', marginLeft: 12 }}>{mutationError}</span>
        )}
      </div>
      {/* Show todo list for mutation de ressources */}
      <TodoMutationRessourcesList events={eventLog} />
      <EventzFinanceTracker showChangeHistory={showChangeHistory} setShowChangeHistory={setShowChangeHistory} />
    </div>
  );
}
