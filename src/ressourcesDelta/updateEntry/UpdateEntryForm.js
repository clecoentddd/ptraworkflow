import React, { useState } from 'react';
import UpdateEntryCommand from './UpdateEntryCommand';
import handleUpdateEntry from './handleUpdateEntry';
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import { useAuthUser } from '../../auth/AuthUserContext';
import '../../ressources/FinanceTracker.css';

export default function UpdateEntryForm({ changeId }) {
  const { user } = useAuthUser();
  const [entryId, setEntryId] = useState('');
  const [newStartMonth, setNewStartMonth] = useState('');
  const [newEndMonth, setNewEndMonth] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const command = UpdateEntryCommand({ entryId, changeId, newStartMonth, newEndMonth });
      const events = handleUpdateEntry(readWorkflowEventLog(), command, user?.email || 'anonymous');
      events.forEach(ev => appendWorkflowEvents(ev));
      setEntryId('');
      setNewStartMonth('');
      setNewEndMonth('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="finance-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h3>Update Entry</h3>
      <div className="finance-form-row">
        <input
          className="finance-input"
          value={entryId}
          onChange={e => setEntryId(e.target.value)}
          placeholder="Entry ID"
        />
        <input
          className="finance-input"
          value={newStartMonth}
          onChange={e => setNewStartMonth(e.target.value)}
          placeholder="New Start Month (YYYY-MM)"
        />
        <input
          className="finance-input"
          value={newEndMonth}
          onChange={e => setNewEndMonth(e.target.value)}
          placeholder="New End Month (YYYY-MM)"
        />
        <button className="finance-btn" type="submit">Update</button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
