import React, { useState } from 'react';
import { getTodoMutationRessourcesState, completeStep } from './todoMutationRessourcesSlice';

export default function TodoMutationRessources({ changeId }) {
  // Initialize todo list for this mutation
  const [steps, setSteps] = useState(getTodoMutationRessourcesState());

  function handleComplete(stepKey) {
    setSteps(prev => completeStep(prev, stepKey));
  }

  return (
    <div className="todo-container">
      <h2 className="todo-header">Todo Mutation Ressources</h2>
      <div>Mutation ChangeId: <b>{changeId}</b></div>
      <ul className="todo-list">
        {steps.map(step => (
          <li key={step.key} className={`todo-item${step.state === 'active' ? ' selected' : ''}`}>
            <span className={`todo-text${step.state === 'completed' ? ' todo-completed' : ''}`}>{step.label}</span>
            <span className="todo-status">{step.state}</span>
            {step.state === 'active' && (
              <button className="todo-action" onClick={() => handleComplete(step.key)}>
                Terminer
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
