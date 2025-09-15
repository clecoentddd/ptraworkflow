import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './EventSourcedProcess.css';

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

  const addEvent = (type, stepId, data = {}, overrideChangeId = null) => {
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type,
    stepId,
    changeId: overrideChangeId ?? currentState.changeId,
    data,
    sequenceNumber: events.length + 1,
  };
  setEvents(prev => [...prev, event]);
  return event;
};


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
    runStep(1, newChangeId);
  };

  const runStep = (stepId, forcedChangeId = null) => {
    const key = `step${stepId}`;
    if (isRunning || currentState[key] !== 'ToDo') return;

    setIsRunning(true);
    const eventChangeId = forcedChangeId || currentState.changeId;
    addEvent('StepStarted', stepId, {}, eventChangeId);

    // Special case for Step 4 → Ouverte
    if (stepId === 4) {
      setCurrentState(prev => ({
        ...prev,
        step4: 'Ouverte',
        changeId: forcedChangeId || prev.changeId,
      }));
      setIsRunning(false);
      return;
    }

    const step = processSteps[stepId - 1];
    setTimeout(() => {
      setCurrentState(prev => ({
        ...prev,
        [key]: 'Done',
        changeId: forcedChangeId || prev.changeId,
      }));
      addEvent('StepCompleted', stepId, {}, eventChangeId);

      if (stepId === 2) {
        setPaiementStatus(prev => ({ ...prev, color: 'red', label: 'En attente' }));
        addEvent('PaiementStatutEnAttente', stepId, { status: 'En attente' }, eventChangeId);
      }

      if (stepId === 6) {
        const newPaiementId = uuidv4();
        setPaiementStatus({ color: 'green', label: 'En cours', id: newPaiementId });
        addEvent('PaiementStatutAjusté', stepId, { status: 'En cours', paiementId: newPaiementId }, eventChangeId);
        addEvent('MutationConfirmée', stepId, { message: 'Mutation confirmée' }, eventChangeId);

        // 🔹 mark process completed and clear changeId
        setProcessCompleted(true);
        setCurrentState(prev => ({
          ...prev,
          changeId: null,   // clear active mutation
          step6: 'Done'
        }));
      }

      setIsRunning(false);
    }, step.duration);
  };

  const validateStep4 = () => {
    if (currentState.step4 !== 'Ouverte') return;
    setCurrentState(prev => ({ ...prev, step4: 'Done' }));
    addEvent('StepCompleted', 4);
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
      addEvent('OperationMutationAnnulée', stepId, { message: 'Operation Mutation Annulée' });
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
        addEvent('StepCancelled', i);
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
  };

  // 🔹 NEW: start new mutation after one completes
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
    addEvent('OperationMutationDémarrée', 1, { message: 'New mutation started' });
    runStep(1, newChangeId);
  };

  const getStatusClass = status => {
    switch (status) {
      case 'ToDo': return 'status-todo';
      case 'Done': return 'status-done';
      case 'Skipped': return 'status-skipped';
      case 'Ouverte': return 'status-ouverte';
      default: return '';
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

                {step.id === 4 && currentState.step4 === 'Ouverte' ? (
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

            {/* 🔹 show this only when a flow has ended */}
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

        <div className="panel">
          <h2 className="panel-title">Event Stream</h2>
          <div className="event-stream">
            {events.length === 0 ? (
              <div className="no-events">No events yet...</div>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-header">#{event.sequenceNumber} {event.type}</div>
                  <div className="event-meta">
                    Step {event.stepId} | ChangeId {event.changeId} | {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  {event.data && Object.keys(event.data).length > 0 && (
                    <div className="event-data">{JSON.stringify(event.data)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSourcedProcess;
