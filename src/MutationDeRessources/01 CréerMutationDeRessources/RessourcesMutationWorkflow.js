import React, { useState } from 'react';
import { créerMutationDeRessourcesCommand } from './commands';
import { handleStartRessourceMutation } from './RessourcesMutationSlice';
import { getLatestDroitsPeriod, hasOpenMutation } from '../../sharedProjections/mutationHistoryProjection';
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import { getMutationProjection } from '../../sharedProjections/mutationHistoryProjection';
import UpdateEntryForm from '../../ressources/updateEntry/UpdateEntryForm';
// Removed: import TodoMutationRessources from '../todoMutationRessources/TodoMutationRessources';

export default function RessourcesMutationWorkflow() {
  const [mutationStarted, setMutationStarted] = useState(false);
  const [error, setError] = useState(null);
  const [showProjection, setShowProjection] = useState(false);
  const eventLog = readWorkflowEventLog();
  const droitsPeriod = getLatestDroitsPeriod(eventLog);
  const openMutation = hasOpenMutation(eventLog);
  const mutationProjection = getMutationProjection(eventLog);
  // Log the projection for debugging
  console.log('[RessourcesMutationWorkflow] Projection:', mutationProjection);
  const openMutationChangeId = mutationProjection.openMutationChangeId;

  function handleStartMutation() {
    setError(null);
    try {
      // Use eventz-compliant command logic
      const events = créerMutationDeRessourcesCommand(eventLog, droitsPeriod);
      events.forEach(e => appendWorkflowEvents(e));
      // If mutation was blocked, show error
      const blocked = events.find(e => e.event === 'MutationCreationBlocked');
      if (blocked) {
        setError(blocked.reason);
        return;
      }
      setMutationStarted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mutation-workflow-container">
      <h2>Workflow: Mutation de Ressources</h2>
      {!mutationStarted ? (
        <button
          onClick={handleStartMutation}
          className="btn btn-primary"
          disabled={openMutation || !droitsPeriod}
        >
          Démarrer une mutation de ressources
        </button>
      ) : null}
      {/* Removed: <TodoMutationRessources changeId={openMutationChangeId} /> */}
      <UpdateEntryForm changeId={openMutationChangeId} />
      <button
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => setShowProjection(!showProjection)}
      >
        {showProjection ? 'Masquer Projection' : 'Afficher Projection'}
      </button>
      {showProjection && (
        <pre style={{ background: '#f6f8fa', padding: 12, marginTop: 8, borderRadius: 4 }}>
          {JSON.stringify(mutationProjection, null, 2)}
        </pre>
      )}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {!droitsPeriod && <div style={{ color: '#888', marginTop: 8 }}>Aucune période de droits active.</div>}
      {openMutation && <div style={{ color: '#888', marginTop: 8 }}>Une mutation est déjà ouverte.</div>}
    </div>
  );
}
