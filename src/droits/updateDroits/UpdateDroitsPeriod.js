// UI component for updating droits period (step 3)
// Only enabled if processStep === 'Ouverte'

import React, { useState } from 'react';
import computeDroitsPeriod from '../projections/computeDroitsPeriod';
import UpdateDroitsPeriodCommand from './UpdateDroitsPeriodCommand';
import EventStream from '../../components/EventStream';


export default function UpdateDroitsPeriod({
  events,
  processStep,
  dispatchCommand,
  eventLog,
  changeId
}) {
  const current = computeDroitsPeriod(events);
  const [startMonth, setStartMonth] = useState(current.startMonth || '');
  const [endMonth, setEndMonth] = useState(current.endMonth || '');
  const [error, setError] = useState('');

  const canEdit = processStep === 'Ouverte';

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (!changeId) throw new Error('changeId is required');
      const cmd = UpdateDroitsPeriodCommand({ startMonth, endMonth, changeId });
      dispatchCommand(cmd);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="update-droits-period">
      <h3>Mettre à jour la période de droits</h3>
  <form onSubmit={handleSubmit}>
        <label>
          Début (AAAA-MM):
          <input
            type="month"
            value={startMonth}
            onChange={e => setStartMonth(e.target.value)}
            disabled={!canEdit}
            required
          />
        </label>
        <label>
          Fin (AAAA-MM):
          <input
            type="month"
            value={endMonth}
            onChange={e => setEndMonth(e.target.value)}
            disabled={!canEdit}
            required
          />
        </label>
        <button type="submit" disabled={!canEdit}>
          Enregistrer
        </button>
  {error && <div className="error">{error}</div>}
      </form>
  <div className="current-period">
        <strong>Période actuelle:</strong>{' '}
        {current.startMonth && current.endMonth
          ? `${current.startMonth} → ${current.endMonth}`
          : 'Non définie'}
      </div>
    </div>
  );
}
