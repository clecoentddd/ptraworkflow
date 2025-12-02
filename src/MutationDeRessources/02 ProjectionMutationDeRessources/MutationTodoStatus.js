import React from 'react';
import { getMutationProjection } from './projectionMutationDeRessources';
import { readWorkflowEventLog } from '../../workflowEventLog';
import './MutationTodoStatus.css';

/**
 * Displays all mutation statuses from the projection.
 */
export default function MutationRessourcesTodoStatus() {
  const eventLog = readWorkflowEventLog();
  const { statusByChangeId } = getMutationProjection(eventLog);
  console.log('[MutationRessourcesTodoStatus] statusByChangeId:', statusByChangeId);
  return (
    <div className="mutation-todo-status">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Mutations en cours</div>
      {Object.keys(statusByChangeId).length === 0 ? (
        <span>Aucune mutation courante.</span>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {Object.entries(statusByChangeId).map(([changeId, status]) => (
            <li key={changeId}>
              Mutation <b>{changeId}</b> : <span>{status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
