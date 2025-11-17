import React, { useState } from 'react';
import EventStream from '../components/EventStream';
import ProcessFlowShared from '../sharedProjections/ProcessFlowShared';
import computeEntries from './projections/computeEntries';
import eventLogProjection from './projections/eventLogProjection';
import AddEntryCommand from './addEntry/AddEntryCommand';
import handleAddEntry from './addEntry/handleAddEntry';
import DeleteEntryCommand from './deleteEntry/DeleteEntryCommand';
import handleDeleteEntry from './deleteEntry/handleDeleteEntry';
import { v4 as uuidv4 } from 'uuid';
import './FinanceTracker.css';
import { incomeOptions, expenseOptions } from '../ressourceConfig';

const STORAGE_KEY_EVENTS = 'eventzEvents';

function loadEvents() {
  const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
  return saved ? JSON.parse(saved) : [];
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
}

const EventzFinanceTracker = () => {
  const [events, setEvents] = useState(loadEvents());
  const [form, setForm] = useState({ type: 'income', code: '', amount: 0, startMonth: '', endMonth: '' });
  const [processState, setProcessState] = useState(null);

  // Helper: is write mode allowed?
  const isStep4Ouverte = processState && processState.step4 === 'Ouverte' && !!processState.changeId;

  // Load process state from localStorage (eventSourcedProcessState)
  React.useEffect(() => {
    const raw = localStorage.getItem('eventSourcedProcessState');
    if (raw) {
      try {
        setProcessState(JSON.parse(raw));
      } catch {
        setProcessState(null);
      }
    } else {
      setProcessState(null);
    }
  }, []);

  // Projection: entries grouped by month
  const entriesByMonth = computeEntries(events);
  const allMonths = Object.keys(entriesByMonth).sort();
  // Build a map of entryId to entry (unique entries)
  const entryMap = new Map();
  for (const month of allMonths) {
    for (const entry of entriesByMonth[month]) {
      if (!entryMap.has(entry.entryId)) {
        entryMap.set(entry.entryId, { ...entry });
      }
    }
  }
  const uniqueEntries = Array.from(entryMap.values());
  // Filter by selected type (income/expense)
  const filteredEntries = uniqueEntries.filter(e => e.type === form.type);

  // Helper: check if a month is in the entry's range
  function isMonthInRange(month, start, end) {
    if (!month || !start || !end) return false;
    const [my, mm] = month.split('-').map(Number);
    const [sy, sm] = start.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    if (my < sy || (my === sy && mm < sm)) return false;
    if (my > ey || (my === ey && mm > em)) return false;
    return true;
  }

  // Add entry handler
  const handleAdd = () => {
    if (!form.code || !form.startMonth || !form.endMonth || !form.amount) {
      alert('All fields are required.');
      return;
    }
    // UI validation: startMonth <= endMonth
    const [sy, sm] = form.startMonth.split('-').map(Number);
    const [ey, em] = form.endMonth.split('-').map(Number);
    if (sy > ey || (sy === ey && sm > em)) {
      alert('Start month must be before or equal to end month.');
      return;
    }
    const entryId = uuidv4();
    const changeId = processState && processState.changeId ? processState.changeId : null;
    // Find label from config for event log, but not for UI
    const option = [...incomeOptions, ...expenseOptions].find(o => o.code === form.code);
    const label = option ? option.label : '';
    const command = AddEntryCommand({
      entryId,
      code: form.code,
      label,
      amount: Number(form.amount),
      startMonth: form.startMonth,
      endMonth: form.endMonth,
      type: form.type,
      changeId
    });
    try {
      const newEvents = handleAddEntry(events, command);
      const updated = [...events, ...newEvents];
      setEvents(updated);
      saveEvents(updated);
      setForm({ type: 'income', code: '', amount: 0, startMonth: '', endMonth: '' });
    } catch (e) {
      alert(e.message);
    }
  };

  // Delete entry handler
  const handleDelete = (entryId) => {
    const command = DeleteEntryCommand(entryId);
    try {
      const newEvents = handleDeleteEntry(events, command);
      const updated = [...events, ...newEvents];
      setEvents(updated);
      saveEvents(updated);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="droits-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Process Flow (now on top, no card) */}
      <ProcessFlowShared steps={processState ? require('../sharedProjections/processFlowProjection').default(processState) : []} />

      {/* Main Table/Form Card */}
      <div className="event-stream-section" style={{marginBottom: 0}}>
        <div className="event-stream-title">Ressources - Revenus / Dépenses (EventZ)</div>
        <div className="form-row">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} disabled={!isStep4Ouverte}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!isStep4Ouverte}>
            <option value="">Code</option>
            {(form.type === 'income' ? incomeOptions : expenseOptions).map(o => (
              <option key={o.code} value={o.code}>{o.code} - {o.label}</option>
            ))}
          </select>
          <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} disabled={!isStep4Ouverte} />
          <input type="month" placeholder="Start Month" value={form.startMonth} onChange={e => setForm({ ...form, startMonth: e.target.value })} disabled={!isStep4Ouverte} />
          <input type="month" placeholder="End Month" value={form.endMonth} onChange={e => setForm({ ...form, endMonth: e.target.value })} disabled={!isStep4Ouverte} />
          <button onClick={handleAdd} disabled={!isStep4Ouverte}>Add</button>
        </div>
        <table className="projection-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Code</th>
              <th>Label</th>
              {allMonths.map(month => {
                // Display as mm-yy
                const [yyyy, mm] = month.split('-');
                return <th key={month}>{mm}-{yyyy.slice(2)}</th>;
              })}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((row, idx) => {
              // Find label from config for display
              const option = [...incomeOptions, ...expenseOptions].find(o => o.code === row.code);
              const label = option ? option.label : '';
              return (
                <tr key={row.entryId}>
                  <td style={{fontWeight:'bold'}}>{row.type}</td>
                  <td>{row.code}</td>
                  <td>{label}</td>
                  {allMonths.map(month => {
                    const covers = isMonthInRange(month, row.startMonth, row.endMonth);
                    return <td key={month}>{covers ? row.amount : ''}</td>;
                  })}
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(row.entryId)} disabled={!isStep4Ouverte}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Event Stream Card */}
      <div className="event-stream-section">
        <EventStream events={eventLogProjection(events)} maxHeight={260} />
      </div>
    </div>
  );
};

export default EventzFinanceTracker;
