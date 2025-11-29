import React, { useState } from 'react';
// This workflow is for MutationDeRessourcesUniquement
import './MutationDeRessourcesUniquementWorkflow.css';

const steps = [
  { step: 1, key: 'step1', label: 'Démarrer la mutation de ressources' },
  // step 2 and 3 are skipped
  { step: 4, key: 'step4b', label: 'Vérifier les ressources modifiées' },
  { step: 5, key: 'step5', label: 'Effectuer le plan de calcul' },
  { step: 6, key: 'step6b', label: 'Valider la décision' },
  { step: 7, key: 'step7b', label: 'Générer le plan de paiement' }
];

function statusLabel(status) {
  if (status === 'active') return 'Ouverte';
  if (status === 'completed') return 'Done';
  if (status === 'deleted') return 'Supprimée';
  return status;
}

export default function MutationDeRessourcesUniquementWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsState, setStepsState] = useState(
    steps.map(s => ({ ...s, state: s.step === 1 ? 'active' : 'pending' }))
  );

  function handleComplete(stepKey) {
    setStepsState(prev =>
      prev.map(s =>
        s.key === stepKey ? { ...s, state: 'completed' } : s
      )
    );
    // Move to next step
    const idx = steps.findIndex(s => s.key === stepKey);
    if (idx < steps.length - 1) {
      setStepsState(prev =>
        prev.map((s, i) =>
          i === idx + 1 ? { ...s, state: 'active' } : s
        )
      );
      setCurrentStep(steps[idx + 1].step);
    }
  }

  return (
    <div className="todo-container">
      <h2 className="todo-header">MutationDeRessourcesUniquement</h2>
      <ul className="todo-list">
        {stepsState.map(step => (
          <li key={step.key} className={`todo-item${step.state === 'active' ? ' selected' : ''}`}>
            <span className={`todo-text${step.state === 'completed' ? ' todo-completed' : ''}`}>{step.label}</span>
            <span className="todo-status">{statusLabel(step.state)}</span>
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
