
import React, { useState, useEffect } from 'react';
import UpdateEntryCommand from './UpdateEntryCommand';
import UpdateEntryCommandHandler from './UpdateEntryCommandHandler';
import { readWorkflowEventLog, appendWorkflowEvents } from '../../workflowEventLog';
import { useAuthUser } from '../../auth/AuthUserContext';
import './updateEntryForm.css';

export default function UpdateEntryForm({ changeId, entryId: initialEntryId = '', startMonth = '', endMonth = '', onClose, onEventLogUpdate }) {
  // Find ressourceVersionId for this changeId
  const eventLog = readWorkflowEventLog();
  const ressourceVersionId = (() => {
    const opened = eventLog.find(e => e.event === 'RessourcesOpenedForChange' && e.changeId === changeId);
    return opened ? opened.ressourceVersionId : '';
  })();
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
    if (!changeId) {
      setError('changeId is required');
      return;
    }
    if (!ressourceVersionId) {
      setError('ressourceVersionId is required');
      return;
    }
    try {
      const command = UpdateEntryCommand({ entryId, changeId, ressourceVersionId, startMonth: newStartMonth, endMonth: newEndMonth });
      const events = UpdateEntryCommandHandler(eventLog, command, user?.email || 'anonymous');
      events.forEach(ev => appendWorkflowEvents(ev));
      setEntryId('');
      setNewStartMonth('');
      setNewEndMonth('');
      if (typeof onEventLogUpdate === 'function') {
        onEventLogUpdate();
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="finance-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h3>Update Entry</h3>
      <div className="finance-form-row" style={{ display: 'flex', alignItems: 'center' }}>
        <input
          className="entryid-input"
          value={entryId}
          onChange={e => setEntryId(e.target.value)}
          placeholder="Entry ID"
        />
        <input
          type="month"
          className="month-picker"
          value={newStartMonth}
          onChange={e => setNewStartMonth(e.target.value)}
          placeholder="New Start Month"
        />
        <input
          type="month"
          className="month-picker"
          value={newEndMonth}
          onChange={e => setNewEndMonth(e.target.value)}
          placeholder="New End Month"
        />
        <button className="update-entry-btn" type="submit">update</button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
