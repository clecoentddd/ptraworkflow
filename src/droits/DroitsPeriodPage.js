// Dedicated page for droits period management

import React, { useState, useEffect } from 'react';

import { UpdateDroitsPeriod } from './updateDroits';
import './DroitsPeriodPage.css';
import computeDroitsPeriod from './projections/computeDroitsPeriod';
import ProcessFlowShared from '../sharedProjections/ProcessFlowShared';
import EventStream from '../components/EventStream';
import processFlowProjection from '../sharedProjections/processFlowProjection';
import eventStreamProjection from '../sharedProjections/eventStreamProjection';

const STORAGE_KEY_EVENTS = 'eventSourcedProcessEvents';
const STORAGE_KEY_STATE = 'eventSourcedProcessState';

function loadEvents() {
  const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
  return saved ? JSON.parse(saved) : [];
}

function loadProcessState() {
  const saved = localStorage.getItem(STORAGE_KEY_STATE);
  return saved ? JSON.parse(saved) : {
    step1: 'ToDo', step2: 'ToDo', step3: 'ToDo', step4: 'ToDo', step5: 'ToDo', step6: 'ToDo', changeId: null
  };
}


export default function DroitsPeriodPage() {
  const [eventLog, setEventLog] = useState(loadEvents());
  const [processState, setProcessState] = useState(loadProcessState());
  const [error, setError] = useState('');


  // Projected process steps
  const processSteps = processFlowProjection(processState);
  // Projected event stream (droits only)
  const droitsEvents = eventStreamProjection(eventLog, e => e.event === 'PeriodesDroitsModifiees');

  // Only allow edit if changeId exists and step3 is 'Ouverte'
  const canEdit = processState.changeId && processState.step3 === 'Ouverte';

  // Command dispatcher: update local eventLog and localStorage
  function handleDispatch(cmd) {
    setError('');
    if (!canEdit) {
      setError('Modification désactivée : il faut une mutation en cours et l’étape 3 doit être "Ouverte".');
      return;
    }
    // Attach current changeId if missing
    if (!cmd.payload.changeId) {
      cmd.payload.changeId = processState.changeId;
    }
    import('./updateDroits/handleUpdateDroitsPeriod').then(mod => {
      try {
        const handler = mod.default;
        const newEvents = handler(eventLog, cmd);
        const updated = [...eventLog, ...newEvents.map((ev, i) => ({
          id: Date.now() + Math.random() + i,
            ts: ev.ts,
          event: ev.event,
          stepId: 3,
          changeId: ev.changeId,
          data: ev.payload,
        }))];
        setEventLog(updated);
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
      } catch (err) {
        setError(err.message);
      }
    });
  }


  function getStatusClass(status) {
    switch (status) {
      case 'ToDo': return 'status-todo';
      case 'Done': return 'status-done';
      case 'Skipped': return 'status-skipped';
      case 'Ouverte': return 'status-ouverte';
      case 'Ignored': return 'status-ignored';
      default: return '';
    }
  }

  // CSS for this page
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .droits-page-container { max-width: 1000px; margin: 40px auto; display: flex; gap: 40px; }
      .droits-panel { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px #0002; padding: 32px 28px; flex: 1; min-width: 340px; }
      .droits-title { font-size: 1.7rem; font-weight: 700; margin-bottom: 22px; letter-spacing: 0.5px; color: #1a237e; }
      .droits-steps { margin-bottom: 36px; }
      .droits-step-row { display: flex; align-items: center; margin-bottom: 12px; }
      .droits-step-indicator { width: 32px; height: 32px; border-radius: 50%; background: #e3e6f3; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px; font-size: 1.1rem; }
      .status-todo { background: #e3e6f3; color: #3949ab; }
      .status-done { background: #43a047; color: #fff; }
      .status-skipped { background: #ffb300; color: #fff; }
      .status-ouverte { background: #1976d2; color: #fff; }
      .status-ignored { background: #bdbdbd; color: #fff; }
      .droits-event-stream { margin-top: 28px; }
      .droits-event-item { background: #f4f6fa; border-radius: 6px; padding: 14px 18px; margin-bottom: 10px; font-size: 1rem; border-left: 4px solid #1976d2; }
      .droits-event-header { font-weight: 700; color: #1976d2; }
      .droits-event-meta { color: #888; font-size: 0.95em; margin-bottom: 2px; }
      /* UpdateDroitsPeriod form overrides */
      .update-droits-period { background: #f8fafc; border-radius: 8px; padding: 24px 20px 18px 20px; box-shadow: 0 2px 8px #0001; margin-bottom: 18px; }
      .update-droits-period h3 { font-size: 1.2rem; font-weight: 600; color: #1976d2; margin-bottom: 18px; }
      .update-droits-period form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 10px; }
      .update-droits-period label { font-weight: 500; color: #333; display: flex; flex-direction: column; gap: 4px; }
      .update-droits-period input[type="month"] { padding: 7px 10px; border: 1px solid #bdbdbd; border-radius: 4px; font-size: 1rem; background: #fff; }
      .update-droits-period button[type="submit"] { margin-top: 8px; background: #1976d2; color: #fff; border: none; border-radius: 4px; padding: 8px 18px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
      .update-droits-period button[type="submit"]:hover:not(:disabled) { background: #1565c0; }
      .update-droits-period button[disabled] { opacity: 0.6; cursor: not-allowed; }
      .update-droits-period .error { color: #d32f2f; font-size: 0.98em; margin-top: 4px; }
      .update-droits-period .current-period { margin-top: 10px; font-size: 1.05em; color: #3949ab; }
      .update-droits-period .event-log { margin-top: 18px; }
      .update-droits-period .event-log h4 { font-size: 1.05em; color: #1976d2; margin-bottom: 6px; }
      .update-droits-period .event-log ul { padding-left: 18px; margin: 0; }
      .update-droits-period .event-log li { font-size: 0.98em; color: #333; margin-bottom: 2px; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="droits-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Process Flow (now on top, no card) */}
      <ProcessFlowShared steps={processSteps} />
      {/* Modification Form Card */}
      <div className="event-stream-section" style={{marginBottom: 0}}>
        <div className="event-stream-title">Gestion de la période de droits</div>
        <UpdateDroitsPeriod
          events={eventLog}
          processStep={canEdit ? 'Ouverte' : 'Verrouillée'}
          dispatchCommand={handleDispatch}
          eventLog={eventLog}
          changeId={processState.changeId}
        />
        {error && <div className="error" style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
      </div>
      {/* Event Stream Card */}
      <div className="event-stream-section">
        <EventStream events={eventLog} filter={e => e.event === 'PeriodesDroitsModifiees'} maxHeight={10000} />
      </div>
    </div>
  );
}
