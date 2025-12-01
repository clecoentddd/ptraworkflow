import React, { useState, useEffect } from 'react';
import UpdateEntryCommand from './UpdateEntryCommand';
import UpdateEntryCommandHandler from './UpdateEntryCommandHandler';
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import { useAuthUser } from '../../auth/AuthUserContext';
import './updateEntryForm.css';

export default function UpdateEntryForm({ changeId, entryId: initialEntryId = '', startMonth = '', endMonth = '' }) {
  const { user } = useAuthUser();
  const [entryId, setEntryId] = useState(initialEntryId);
  const [newStartMonth, setNewStartMonth] = useState(startMonth);
  const [newEndMonth, setNewEndMonth] = useState(endMonth);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEntryId(initialEntryId);
    setNewStartMonth(startMonth);
    setNewEndMonth(endMonth);
  }, [initialEntryId, startMonth, endMonth]);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const command = UpdateEntryCommand({ entryId, changeId, newStartMonth, newEndMonth });
      const events = UpdateEntryCommandHandler(readWorkflowEventLog(), command, user?.email || 'anonymous');
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
      <div className="finance-form-row" style={{ display: 'flex', alignItems: 'center' }}>
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
        <button className="update-entry-btn" type="submit">update</button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
