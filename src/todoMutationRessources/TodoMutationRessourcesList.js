
import React from 'react';
import { projectTodoMutationRessources } from './todoMutationRessourcesProjection';

// Pure eventz projection: get todo list state for latest MutationChangeCreated
// The projectTodoMutationRessources function is now imported from a dedicated file.

export default function TodoMutationRessourcesList({ events }) {
  const { changeId, todoState } = projectTodoMutationRessources(events);
  const [showProjection, setShowProjection] = React.useState(false);

  return (
    <div className="todo-mutation-ressources-list">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>À faire pour la mutation de ressources</h2>
        <button
          className="todo-projection-btn"
          style={{
            padding: '8px 18px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)'
          }}
          onClick={() => setShowProjection(v => !v)}
        >
          Afficher ToDo Projection
        </button>
      </div>
      {showProjection && (
        <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 4, marginBottom: 12 }}>
          {JSON.stringify(projectTodoMutationRessources(events), null, 2)}
        </pre>
      )}
      {changeId && (
        <div style={{ marginBottom: 8 }}>
          <b>Mutation ChangeId:</b> {changeId}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 8 }}>
        {todoState.map(step => (
          <div
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f4f6fa',
              borderRadius: 6,
              padding: '10px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            <span style={{ flex: 1 }}>{step.label}</span>
            <span
              style={{
                minWidth: 100,
                textAlign: 'center',
                color:
                  step.state === 'active'
                    ? '#1976d2'
                    : step.state === 'todo'
                    ? '#ff9800'
                    : step.state === 'completed'
                    ? '#43a047'
                    : '#bdbdbd',
                fontWeight: 700,
                letterSpacing: 1
              }}
            >
              {step.state === 'active'
                ? 'En cours'
                : step.state === 'todo'
                ? 'À faire'
                : step.state === 'completed'
                ? 'Fait'
                : 'En attente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
