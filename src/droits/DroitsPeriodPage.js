import React, { useState, useEffect } from 'react';
import { UpdateDroitsPeriod } from './updateDroits';
import './DroitsPeriodPage.css';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import EventStream from '../components/EventStream';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';

export default function DroitsPeriodPage() {
  const [, setRerender] = useState(0);
  const eventLog = readWorkflowEventLog() || [];
  const steps = getWorkflowStepsCached('main-workflow');
  const [error, setError] = useState('');

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

  return (
    <div className="droits-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Process Flow (now on top, no card) */}
      <ProcessFlowStatusBar />
      {/* Modification Form Card */}
      <div className="event-stream-section" style={{ marginBottom: 0 }}>
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
      <EventStream events={eventLog} filter={e => e.event === 'PeriodesDroitsModifiees'} maxHeight={10000} />
    </div>
  );
}
