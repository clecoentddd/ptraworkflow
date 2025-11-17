import React, { useState, useEffect } from 'react';

import { Play, RotateCcw, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import './EventSourcedProcess.css';
import { UpdateDroitsPeriod } from './droits/updateDroits';
import EventStream from './components/EventStream';

const STORAGE_KEY_STATE = "eventSourcedProcessState";
const STORAGE_KEY_EVENTS = "eventSourcedProcessEvents";
const STORAGE_KEY_PAIEMENT = "eventSourcedProcessPaiement";

const EventSourcedProcess = () => {
  // Load from localStorage on init
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentState, setCurrentState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    return saved
      ? JSON.parse(saved)
      : {
          step1: 'ToDo',
          step2: 'ToDo',
          step3: 'ToDo',
          step4: 'ToDo',
          step5: 'ToDo',
          step6: 'ToDo',
          changeId: null,
        };
  });

  const [paiementStatus, setPaiementStatus] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PAIEMENT);
    return saved
      ? JSON.parse(saved)
      : {
          color: 'green',
          label: 'En cours',
          id: uuidv4(),
        };
  });

  const [isRunning, setIsRunning] = useState(false);
  const [processCompleted, setProcessCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const processSteps = [
    { id: 1, name: 'Créer la mutation', duration: 1000, optional: false },
    { id: 2, name: 'Suspendre les paiements', duration: 1200, optional: false },
    { id: 3, name: 'Mettre à jour la fin de droit (si changements début/fin)', duration: 1500, optional: true },
    { id: 4, name: 'Mettre à jour le plan de calcul (si changements ressources)', duration: 1500, optional: true },
    { id: 5, name: 'Reconcilier droit, prestations, paiements effectués (livre comptable)', duration: 800, optional: false },
    { id: 6, name: 'Valider la décision de fin de droit', duration: 800, optional: false },
  ];

  // Persist to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(currentState));
  }, [currentState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PAIEMENT, JSON.stringify(paiementStatus));
  }, [paiementStatus]);

  // Robust addEvent: append to events (chronological) and compute sequenceNumber from prev
  const addEvent = (type, stepId = null, data = {}, overrideChangeId = null) => {
    let createdEvent = null;
    setEvents(prev => {
      const event = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type,
        stepId,
        changeId: overrideChangeId ?? currentState.changeId,
        data,
        sequenceNumber: prev.length + 1,
      };
      createdEvent = event;
      return [...prev, event];
    });
    return createdEvent;
  };

  /* --------------------------
     Normal mutation flow
     -------------------------- */
  const startProcess = () => {
    if (currentState.changeId && !processCompleted) return;

    const newChangeId = uuidv4();
    setCurrentState({
      step1: 'ToDo',
      step2: 'ToDo',
      step3: 'ToDo',
      step4: 'ToDo',
      step5: 'ToDo',
      step6: 'ToDo',
      changeId: newChangeId,
    });
    setProcessCompleted(false);

    addEvent('OperationMutationDémarrée', 1, { message: 'Process started' }, newChangeId);
    // start first step
    runStep(1, newChangeId);
  };

  const runStep = (stepId, forcedChangeId = null) => {
    const key = `step${stepId}`;
    // preserve existing guard for normal flows
    if (isRunning || currentState[key] !== 'ToDo') return;

    setIsRunning(true);
    const eventChangeId = forcedChangeId || currentState.changeId;

    addEvent('StepStarted', stepId, {}, eventChangeId);

    // Special case for Step 3 and 4 → Ouverte (pauses actual completion until validation)
    if (stepId === 3) {
      setCurrentState(prev => ({
        ...prev,
        step3: 'Ouverte',
        changeId: eventChangeId,
      }));
      setIsRunning(false);
      return;
    }
    if (stepId === 4) {
      setCurrentState(prev => ({
        ...prev,
        step4: 'Ouverte',
        changeId: eventChangeId,
      }));
      setIsRunning(false);
      return;
    }

    const step = processSteps[stepId - 1];
    setTimeout(() => {
      // mark done
      setCurrentState(prev => ({
        ...prev,
        [key]: 'Done',
        changeId: eventChangeId,
      }));

      addEvent('StepCompleted', stepId, {}, eventChangeId);

      // special effects
      if (stepId === 2) {
        setPaiementStatus(prev => ({ ...prev, color: 'red', label: 'En attente' }));
        addEvent('PaiementStatutEnAttente', stepId, { status: 'En attente' }, eventChangeId);
      }

      if (stepId === 6) {
        const newPaiementId = uuidv4();
        setPaiementStatus({ color: 'green', label: 'En cours', id: newPaiementId });
        addEvent('PaiementStatutAjusté', stepId, { status: 'En cours', paiementId: newPaiementId }, eventChangeId);
        addEvent('MutationConfirmée', stepId, { message: 'Mutation confirmée' }, eventChangeId);

        // mark process completed and clear active changeId (existing behavior)
        setProcessCompleted(true);
        setCurrentState(prev => ({ ...prev, changeId: null, step6: 'Done' }));
      }

      setIsRunning(false);
    }, step.duration);
  };

  const validateStep4 = () => {
    if (currentState.step4 !== 'Ouverte') return;
    setCurrentState(prev => ({ ...prev, step4: 'Done' }));
    // ensure we attach current changeId explicitly to the event
    addEvent('StepCompleted', 4, {}, currentState.changeId);
  };

  const runNextStep = () => {
    if (!currentState.changeId || isRunning) return;
    for (let i = 1; i <= processSteps.length; i++) {
      const key = `step${i}`;
      if (currentState[key] === 'ToDo') {
        runStep(i);
        break;
      }
    }
  };

  const skipStep = stepId => {
    const key = `step${stepId}`;
    if (currentState[key] !== 'ToDo') return;

    // Special handling for step 3: when skipped, set step3 to Skipped and step4 to Ouverte
    if (stepId === 3) {
      setCurrentState(prev => ({ ...prev, step3: 'Skipped', step4: 'Ouverte' }));
      addEvent('StepSkipped', 3);
      return;
    }
    setCurrentState(prev => ({ ...prev, [key]: 'Skipped' }));
    addEvent('StepSkipped', stepId);
  };

  const cancelStep = stepId => {
    const updates = {};
    const stepKey = `step${stepId}`;

    if (currentState[stepKey] !== 'Done' && currentState[stepKey] !== 'Skipped') return;
    if (currentState.step6 === 'Done') {
      alert('Cannot cancel after step 6 is completed.');
      return;
    }

    if (stepId === 1) {
      addEvent('OperationMutationAnnulée', stepId, { message: 'Operation Mutation Annulée' }, currentState.changeId);
      setCurrentState({
        step1: 'ToDo',
        step2: 'ToDo',
        step3: 'ToDo',
        step4: 'ToDo',
        step5: 'ToDo',
        step6: 'ToDo',
        changeId: null,
      });
      setPaiementStatus(prev => ({ ...prev, color: 'green', label: 'En cours' }));
      addEvent('PaiementStatusEnCours', stepId, { status: 'En cours' });
      setProcessCompleted(false);
      return;
    }

    for (let i = stepId; i <= processSteps.length; i++) {
      const key = `step${i}`;
      if (currentState[key] === 'Done' || currentState[key] === 'Skipped') {
        updates[key] = 'ToDo';
        addEvent('StepCancelled', i, {}, currentState.changeId);
      }
    }

    setCurrentState(prev => ({ ...prev, ...updates }));
  };

  const resetProcess = () => {
    setCurrentState({
      step1: 'ToDo',
      step2: 'ToDo',
      step3: 'ToDo',
      step4: 'ToDo',
      step5: 'ToDo',
      step6: 'ToDo',
      changeId: null,
    });
    setEvents([]);
    setIsRunning(false);
    setProcessCompleted(false);
    setPaiementStatus(prev => ({ ...prev, color: 'green', label: 'En cours' }));
  // clear local storage
  localStorage.removeItem(STORAGE_KEY_STATE);
  localStorage.removeItem(STORAGE_KEY_EVENTS);
  localStorage.removeItem(STORAGE_KEY_PAIEMENT);
  // also clear EventZ event stream
  localStorage.removeItem('eventzEvents');
  };

  // start new mutation after completion (unchanged)
  const startNewMutation = () => {
    const newChangeId = uuidv4();
    setCurrentState({
      step1: 'ToDo',
      step2: 'ToDo',
      step3: 'ToDo',
      step4: 'ToDo',
      step5: 'ToDo',
      step6: 'ToDo',
      changeId: newChangeId,
    });
    setProcessCompleted(false);
    addEvent('OperationMutationDémarrée', 1, { message: 'New mutation started' }, newChangeId);
    runStep(1, newChangeId);
  };

  /* --------------------------
     Passage de Fin d'Année (manual from step 5 onwards)
     - Does NOT auto-run step 5. It marks steps 1-4 as Ignored/Skipped and
       creates proper events attached to a new changeId. The user then
       continues manually from step 5 (Run Next Step).
     -------------------------- */
  const runFinDAnnee = () => {
    // if a normal mutation is currently active, block it
    if (currentState.changeId && !processCompleted) {
      alert("Mutation en cours... Essayez plus tard");
      return;
    }
    setErrorMessage(null);

    const newChangeId = uuidv4();

    // set UI state: steps 1-4 Ignored, step5/6 ToDo, set changeId to fin d'année change
    setCurrentState({
      step1: 'Ignored',
      step2: 'Ignored',
      step3: 'Ignored',
      step4: 'Ignored',
      step5: 'ToDo',
      step6: 'ToDo',
      changeId: newChangeId,
    });
    setProcessCompleted(false);

    // publish events for the Fin d'Année run — all attached to the new changeId
    addEvent('FinDAnneeStarted', null, { message: "Passage de fin d'année déclenché" }, newChangeId);

    // record that steps 1..4 are ignored/skipped
    [1, 2, 3, 4].forEach(s => {
      addEvent('StepIgnored', s, { reason: 'FinDAnnee' }, newChangeId);
    });

    // no automatic run of step 5 — user will invoke Run Next Step manually
    addEvent('FinDAnneePrepared', null, { nextStep: 5 }, newChangeId);
  };

  const getStatusClass = status => {
    switch (status) {
      case 'ToDo':
        return 'status-todo';
      case 'Done':
        return 'status-done';
      case 'Skipped':
        return 'status-skipped';
      case 'Ouverte':
        return 'status-ouverte';
      case 'Ignored':
        return 'status-ignored';
      default:
        return '';
    }
  };

  return (
    <div className="process-container">
      <h1 className="main-title">Event Sourced Process Simulation (ChangeId Tracking)</h1>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              Process Flow
              <span className="paiements-status-inline">
                <span className={`status-dot ${paiementStatus.color}`}></span>
                Paiements: {paiementStatus.label} {paiementStatus.id && `(Id: ${paiementStatus.id})`}
              </span>
            </h2>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="state-info">
            <div>Current ChangeId: {currentState.changeId || 'None'}</div>
          </div>

          <div className="steps-container">
            {processSteps.map(step => (
              <div key={step.id} className="step-row">
                <div className={`step-indicator ${getStatusClass(currentState[`step${step.id}`])}`}>
                  {step.id}
                </div>
                <div className="step-details">
                  <div className="step-name">
                    {step.name} {step.optional && <span className="optional-tag">(Optional)</span>}
                  </div>
                  <div className="step-status">Status: {currentState[`step${step.id}`]}</div>
                </div>

                {currentState[`step${step.id}`] === 'ToDo' && step.optional &&
                  (step.id === 1 || ['Done', 'Skipped'].includes(currentState[`step${step.id - 1}`])) && (
                    <button onClick={() => skipStep(step.id)} className="btn btn-warning">Skip</button>
                  )}



                {step.id === 3 && currentState.step3 === 'Ouverte' ? (
                  <button onClick={() => {
                    setCurrentState(prev => ({ ...prev, step3: 'Done', step4: 'Ouverte' }));
                    addEvent('StepCompleted', 3, {}, currentState.changeId);
                  }} className="btn btn-primary">Valider</button>
                ) : step.id === 4 && currentState.step4 === 'Ouverte' ? (
                  <button onClick={validateStep4} className="btn btn-primary">Valider</button>
                ) : (currentState[`step${step.id}`] === 'Done' || currentState[`step${step.id}`] === 'Skipped') &&
                    currentState.step6 !== 'Done' ? (
                  <button onClick={() => cancelStep(step.id)} className="btn btn-danger">Cancel</button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="controls">
            <button onClick={startProcess} disabled={currentState.changeId && !processCompleted} className="btn btn-success">Start</button>
            <button onClick={runNextStep} disabled={isRunning || processCompleted || !currentState.changeId} className="btn btn-primary">
              <Play size={16} /> <span>{isRunning ? 'Running...' : 'Run Next Step'}</span>
            </button>
            <button onClick={resetProcess} className="btn btn-secondary">
              <RotateCcw size={16} /> <span>Reset</span>
            </button>

            <button onClick={runFinDAnnee} className="btn btn-warning">
              <Calendar size={16} /> <span>Passage de Fin d’Année</span>
            </button>

            {/* show this only when a flow has ended */}
            {processCompleted && !currentState.changeId && (
              <button onClick={startNewMutation} className="btn btn-success">
                Start New Mutation
              </button>
            )}
          </div>

          {processCompleted && (
            <div className="success-message">
              ✅ Mutation Terminée avec Succès
            </div>
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

export default EventSourcedProcess;
