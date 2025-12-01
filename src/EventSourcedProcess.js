import { getReconciliationRows, getLatestPaymentPlanId } from './reconciliation/reconciliationQueries';
import { createDecisionValideeEvent } from './reconciliation/reconciliationEvents';
import { createRessourcesOpenedForChange } from './ressources/ressourceVersionEvents';
import { canCancelMutation } from './mutation/AnnulerMutation/AnnulerMutationSlice';
import { createMutationAnnuleeEvent } from './mutation/AnnulerMutation/events/MutationAnnuleeEvent';

import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './EventSourcedProcess.css';
import EventStream from './sharedComponents/EventStream/EventStream';
import { appendWorkflowEvents, readWorkflowEventLog, clearWorkflowEventLog } from './workflowEventLog';
import { getOverallStatus } from './sharedProjections/mutationHistoryProjection';
import { canCreateMutation } from './mutation/CreerMutation/CreerMutationSlice';
import { getWorkflowStepsCached } from './workflowProjections';


const WORKFLOW_ID = 'main-workflow';
const processSteps = [
  { id: 1, name: 'Créer la mutation', optional: false },
  { id: 2, name: 'Suspendre les paiements', optional: false },
  { id: 3, name: 'Mettre à jour la fin de droit (si changements début/fin)', optional: true },
  { id: 4, name: 'Mettre à jour les ressources', optional: true },
  { id: 5, name: 'Faire un plan de calcul (si changements ressources)', optional: false },
  { id: 6, name: 'Reconcilier prestations, paiements & Décision', optional: false },
  { id: 7, name: 'Plan de paiement', optional: false },
];

function getChangeId(events) {
  // Find the latest event with a changeId
  const last = [...events].reverse().find(e => e.changeId);
  return last ? last.changeId : null;
}

export default function EventSourcedProcess() {
  // ...existing code...
  // Remove Redux dispatch; use direct event log for cancellation

  // Initialize state and event log
  const [rerender, setRerender] = useState(0);
  const events = readWorkflowEventLog();
  const overallStatus = getOverallStatus(events);
  // Always use the latest projection, not the cached version
  const { projectWorkflowSteps } = require('./workflowProjections');
  const steps = projectWorkflowSteps(events, WORKFLOW_ID);
  // Debug: log step 7 status and all step 7 events
  console.log('Workflow steps:', steps);
  console.log('Step 7 status:', steps[7]);
  const step7Events = events.filter(e => e.step === 7);
  console.log('Step 7 events:', step7Events);
  console.log('Event log:', events);
  console.log('Overall Status:', overallStatus);
  // Step 6: Validate reconciliation and append DecisionValidee event
  function validateReconciliation() {
    // Only allow if step 6 is Ouverte
    if (steps[6].state !== 'Ouverte') return;
    // Gather required data
    const reconciliationRows = getReconciliationRows(events);
    if (!reconciliationRows.length) {
      alert('Aucune donnée de Reconciliation à valider.');
      return;
    }
    // Assume all rows have the same planDeCalculId and changeId (from projection)
    const planDeCalculId = reconciliationRows[0].calculationId;
    const paymentPlanId = getLatestPaymentPlanId(events);
    const deltaPerMonth = {};
    reconciliationRows.forEach(row => {
      deltaPerMonth[row.month] = row.delta;
    });
    const event = createDecisionValideeEvent({
      changeId,
      planDeCalculId,
      paymentPlanId,
      deltaPerMonth
    });
    appendWorkflowEvents(event);
    setRerender(x => x + 1);
  }

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
  const processCompleted = steps[7]?.state === 'Done';
  const [errorMessage] = useState(null);
  // Use overallStatus for mutation status
  const hasOpenMutation = overallStatus.hasOpenMutation;
  const latestDroitsPeriod = overallStatus.latestDroitsPeriod;
  const canCreate = canCreateMutation(events);




  // EventZ: append event and trigger rerender
  function addEventZ(event, step) {
    // Prevent resource changes after step 4 is Done
    if (event === 'ResourceChanged' && steps[4]?.state === 'Done') {
      alert('Vous ne pouvez plus modifier les ressources après validation du plan de calcul (étape 4).');
      return;
    }
    // When opening step 4, also emit RessourcesOpenedForChange
    if (event === 'StepOpened' && step === 4) {
      // Emit StepOpened as usual
      appendWorkflowEvents({
        event,
        workflowId: WORKFLOW_ID,
        step,
        changeId,
      });
      // Emit RessourcesOpenedForChange with new ressourceVersionId
      const userEmail = (window?.authUser?.email) || 'anonymous';
      const resEvent = createRessourcesOpenedForChange({ changeId, userEmail });
      appendWorkflowEvents(resEvent);
      setRerender(x => x + 1);
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
      // Start a new workflow: create mutation with a new changeId
      const newChangeId = uuidv4();
      const userEmail = (window?.authUser?.email) || 'anonymous';
      appendWorkflowEvents({
        event: 'MutationChangeCreated',
        workflowId: WORKFLOW_ID,
        changeId: newChangeId,
        timestamp: new Date().toISOString(),
        userEmail
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


  function handleCancelMutation() {
    if (!changeId || processCompleted) {
      return;
    }
    const userEmail = (window?.authUser?.email) || 'anonymous';
    // Use event creator for MutationAnnulée
    appendWorkflowEvents(
      createMutationAnnuleeEvent({ changeId, workflowId: WORKFLOW_ID, userEmail })
    );
    setRerender(x => x + 1);
  }

  return (
    <div className="process-container">
      <h1 className="main-title">EventZ - Processus Prestations</h1>
      <div className="content-grid">
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="panel-title">Process Flow</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={startProcess}
                disabled={!canCreate}
                className={`btn ${!canCreate ? 'btn-success' : 'btn-primary'}`}
              >
                Créer Mutation
              </button>
              <button
                onClick={handleCancelMutation}
                disabled={!changeId || processCompleted || !canCancelMutation(events, changeId)}
                className="btn btn-danger"
              >
                Annuler Mutation
              </button>
            </div>
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="state-info">
            <div>Current ChangeId: {changeId || 'None'}</div>
            <div>Dernière période de droits: {latestDroitsPeriod ? `${latestDroitsPeriod.startMonth} à ${latestDroitsPeriod.endMonth}` : 'Aucune'}</div>
            <div>Statut mutation: {hasOpenMutation ? 'Ouverte' : 'Aucune mutation ouverte'}</div>
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
            <button onClick={runNextStep} disabled={processCompleted || !changeId} className="btn btn-primary">
              <Play size={16} /> <span>Run Next Step</span>
            </button>
            <button onClick={resetProcess} className="btn btn-secondary">
              <RotateCcw size={16} /> <span>Reset</span>
            </button>
            {/* show this only when a flow has ended */}
            {processCompleted && !changeId && (
              <button onClick={startNewMutation} className="btn btn-success">Créer Mutation</button>
            )}
          </div>
          {processCompleted && (
            <div className="success-message">✅ Mutation Terminée avec Succès</div>
          )}
        </div>
        {/* Use EventStream directly, which already includes its own container */}
        <EventStream events={events} maxHeight={10000} />
      </div>
    </div>
  );
};

