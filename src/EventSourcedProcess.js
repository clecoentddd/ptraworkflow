
import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './EventSourcedProcess.css';
import EventStream from './components/EventStream';
import { appendWorkflowEvents, readWorkflowEventLog, clearWorkflowEventLog } from './workflowEventLog';
import { getWorkflowStepsCached } from './workflowProjections';


const WORKFLOW_ID = 'main-workflow';
const processSteps = [
  { id: 1, name: 'Créer la mutation', optional: false },
  { id: 2, name: 'Suspendre les paiements', optional: false },
  { id: 3, name: 'Mettre à jour la fin de droit (si changements début/fin)', optional: true },
  { id: 4, name: 'Mettre à jour les ressources', optional: true },
  { id: 5, name: 'Faire un plan de calcul (si changements ressources)', optional: false },
  { id: 6, name: 'Reconcilier comptable: prestations, paiements', optional: false },
  { id: 7, name: 'Valider la décision de fin de droit', optional: false },
];

function getChangeId(events) {
  // Find the latest event with a changeId
  const last = [...events].reverse().find(e => e.changeId);
  return last ? last.changeId : null;
}

export default function EventSourcedProcess() {
  const [, setRerender] = useState(0);
  const events = readWorkflowEventLog();
  const steps = getWorkflowStepsCached(WORKFLOW_ID);

  // Reset the workflow event log and UI
  function resetProcess() {
    clearWorkflowEventLog();
    setRerender(x => x + 1);
  }

  // Start a new workflow after completion
  function startNewMutation() {
    resetProcess();
    startProcess();
  }
  const changeId = getChangeId(events);
  const processCompleted = steps[6]?.state === 'Done';
  const [errorMessage] = useState(null);




  // EventZ: append event and trigger rerender
  function addEventZ(event, step) {
    // Prevent resource changes after step 4 is Done
    if (event === 'ResourceChanged' && steps[4]?.state === 'Done') {
      alert('Vous ne pouvez plus modifier les ressources après validation du plan de calcul (étape 4).');
      return;
    }
    appendWorkflowEvents({
      event,
      workflowId: WORKFLOW_ID,
      step,
      changeId,
    });
    setRerender(x => x + 1);
  }

  /* --------------------------
     Normal mutation flow
     -------------------------- */

    function startProcess() {
      if (changeId && !processCompleted) return;
      // Generate a new changeId for the new workflow
      const newChangeId = uuidv4();
      appendWorkflowEvents({
        event: 'StepOpened',
        workflowId: WORKFLOW_ID,
        step: 1,
        changeId: newChangeId
      });
      setRerender(x => x + 1);
    }


  function runStep(stepId) {
    if (steps[stepId].state !== 'ToDo') return;
    addEventZ('StepOpened', stepId);
  }


  function validateStep(stepId) {
    if (steps[stepId].state !== 'Ouverte') return;
    addEventZ('StepDone', stepId);
  }


    function runNextStep() {
      if (!changeId || processCompleted) return;
      for (let i = 1; i <= processSteps.length; i++) {
        if (
          steps[i].state === 'ToDo' &&
          (i === 1 || ['Done', 'Skipped'].includes(steps[i - 1]?.state))
        ) {
          runStep(i);
          break;
        }
      }
    }


  function skipStep(stepId) {
    if (steps[stepId].state !== 'ToDo') return;
    addEventZ('StepSkipped', stepId);
    // For step 3, auto-open step 4 if business rule requires
    if (stepId === 3) {
      addEventZ('StepOpened', 4);
    }
  }


  function cancelStep(stepId) {
    if (steps[stepId].state !== 'Done' && steps[stepId].state !== 'Skipped') return;
    if (steps[6].state === 'Done') {
      alert('Cannot cancel after step 6 is completed.');
      return;
    }
    addEventZ('StepCancelled', stepId);
  }


  // Fin d'Année: start a new workflow, skip steps 1-4, open step 5
  // runFinDAnnee is unused



  function getStatusClass(status) {
    switch (status) {
      case 'ToDo': return 'status-todo';
      case 'Done': return 'status-done';
      case 'Skipped': return 'status-skipped';
      case 'Ouverte': return 'status-ouverte';
      case 'Ignored': return 'status-ignored';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }


  return (
    <div className="process-container">
      <h1 className="main-title">EventZ Workflow Checklist (Event Sourced)</h1>
      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Process Flow</h2>
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="state-info">
            <div>Current ChangeId: {changeId || 'None'}</div>
          </div>
          <div className="steps-container">
            {processSteps.map(step => {
              const stepState = steps[step.id]?.state || 'ToDo';
              const prevStepState = steps[step.id - 1]?.state;
              return (
                <div key={step.id} className="step-row">
                  <div className={`step-indicator ${getStatusClass(stepState)}`}>{step.id}</div>
                  <div className="step-details">
                    <div className="step-name">
                      {step.name} {step.optional && <span className="optional-tag">(Optional)</span>}
                    </div>
                    <div className="step-status">Status: {stepState}</div>
                  </div>
                  {/* Only allow skip if ToDo and previous step is Done/Skipped */}
                  {stepState === 'ToDo' && step.optional &&
                    (step.id === 1 || ['Done', 'Skipped'].includes(prevStepState)) && (
                      <button onClick={() => skipStep(step.id)} className="btn btn-warning">Skip</button>
                    )}
                  {/* Only allow validate if Ouverte */}
                  {['Ouverte'].includes(stepState) && (
                    <button onClick={() => validateStep(step.id)} className="btn btn-primary">Valider</button>
                  )}
                  {/* Only allow cancel if Done/Skipped and not completed */}
                  {(stepState === 'Done' || stepState === 'Skipped') && !processCompleted && (
                    <button onClick={() => cancelStep(step.id)} className="btn btn-danger">Cancel</button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="controls">
            <button onClick={startProcess} disabled={changeId && !processCompleted} className="btn btn-success">Start</button>
            <button onClick={runNextStep} disabled={processCompleted || !changeId} className="btn btn-primary">
              <Play size={16} /> <span>Run Next Step</span>
            </button>
            <button onClick={resetProcess} className="btn btn-secondary">
              <RotateCcw size={16} /> <span>Reset</span>
            </button>
            {/* show this only when a flow has ended */}
            {processCompleted && !changeId && (
              <button onClick={startNewMutation} className="btn btn-success">Start New Mutation</button>
            )}
          </div>
          {processCompleted && (
            <div className="success-message">✅ Mutation Terminée avec Succès</div>
          )}
        </div>
        <div className="event-stream-section">
          <div className="event-stream-title">Event Stream</div>
          <EventStream events={events} maxHeight={10000} />
        </div>
      </div>
    </div>
  );
};

