
import React, { useState, useEffect } from 'react';
import { UpdateDroitsPeriod } from './updateDroits';
import './DroitsPeriodPage.css';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import EventStream from '../components/EventStream';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';


export default function DroitsPeriodPage() {
  const [, setRerender] = useState(0);
  const eventLog = readWorkflowEventLog();
  const steps = getWorkflowStepsCached('main-workflow');
  const [error, setError] = useState('');

  // No need for processSteps, handled by ProcessFlowStatusBar

  // Only allow edit if changeId exists and step3 is 'Ouverte'
  const changeId = (() => {
    // Find the latest event with a changeId
    const last = [...eventLog].reverse().find(e => e.changeId);
    return last ? last.changeId : null;
  })();
  const canEdit = changeId && steps[3]?.state === 'Ouverte';

  // Command dispatcher: update event log via event-sourced workflow
  function handleDispatch(cmd) {
    setError('');
    if (!canEdit) {
      setError('Modification désactivée : il faut une mutation en cours et l’étape 3 doit être "Ouverte".');
      return;
    }
    // Attach current changeId if missing
    if (!cmd.payload.changeId) {
      cmd.payload.changeId = changeId;
    }
    import('./updateDroits/handleUpdateDroitsPeriod').then(mod => {
      try {
        const handler = mod.default;
        const newEvents = handler(eventLog, cmd);
        // Append new events to the main workflow event log
        appendWorkflowEvents(newEvents.map(ev => ({
          ...ev,
          workflowId: 'main-workflow',
          step: 3,
          changeId: cmd.payload.changeId,
        })));
        setRerender(x => x + 1);
      } catch (err) {
        setError(err.message);
      }
    });
  }


  // getStatusClass is unused

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
  <ProcessFlowStatusBar />
      {/* Modification Form Card */}
      <div className="event-stream-section" style={{marginBottom: 0}}>
        <div className="event-stream-title">Gestion de la période de droits</div>
        <UpdateDroitsPeriod
          events={eventLog}
          processStep={canEdit ? 'Ouverte' : 'Verrouillée'}
          dispatchCommand={handleDispatch}
          eventLog={eventLog}
          changeId={changeId}
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
