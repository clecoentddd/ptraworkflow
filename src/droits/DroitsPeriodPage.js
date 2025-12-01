import React, { useState, useEffect } from 'react';
import { UpdateDroitsPeriod } from './updateDroits';
import './DroitsPeriodPage.css';
import ProcessFlowStatusBar from '../StandardProcessFlow/ProcessFlowStatusBar';
import EventStream from '../sharedComponents/EventStream/EventStream';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';
import getDatesDuDroit from '../ressources/projections/getAllDroitsPeriods';

export default function DroitsPeriodPage() {
    const [showProjection, setShowProjection] = useState(false);
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
    <div className="workflow-main-container">
      <section className="workflow-header">
        <ProcessFlowStatusBar />
      </section>
      <section className="workflow-content">
                <button
                  className="projection-btn"
                  style={{ marginBottom: 12 }}
                  onClick={() => setShowProjection(s => !s)}
                >
                  {showProjection ? 'Masquer Projection' : 'Afficher Projection'}
                </button>
                {showProjection && (
                  <div className="projection-popup" style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <strong>Projection (droits periods):</strong>
                    <pre style={{ fontSize: 13, margin: 0 }}>
                      {JSON.stringify(getDatesDuDroit(eventLog), null, 2)}
                    </pre>
                  </div>
                )}
        <h2>Période de droits</h2>
        <div className="event-stream-title">Gestion de la période de droits</div>
        <UpdateDroitsPeriod
          events={eventLog}
          processStep={canEdit ? 'Ouverte' : 'Verrouillée'}
          dispatchCommand={handleDispatch}
          eventLog={eventLog}
          changeId={changeId}
        />
        {error && <div className="error" style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
      </section>
      <section className="workflow-event-stream">
        <EventStream events={eventLog} filter={e => e.event === 'PeriodesDroitsModifiees'} maxHeight={10000} />
      </section>
    </div>
  );
}
