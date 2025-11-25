import React, { useState } from 'react';
import { useAuthUser } from '../auth/AuthUserContext';
import EventStream from '../components/EventStream';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import { readWorkflowEventLog } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';
import computeEntries, { QueryRessourceEntries } from './projections/computeEntries';
import getDatesDuDroit from './projections/getAllDroitsPeriods';
import AddEntryCommand from './addEntry/AddEntryCommand';
import handleAddEntry from './addEntry/handleAddEntry';
import DeleteEntryCommand from './deleteEntry/DeleteEntryCommand';
import handleDeleteEntry from './deleteEntry/handleDeleteEntry';
import { v4 as uuidv4 } from 'uuid';
import './FinanceTracker.css';
import { incomeOptions, expenseOptions } from '../ressourceConfig';

const EventzFinanceTracker = () => {
  const { user } = useAuthUser();
  // Use only the canonical event log for all projections and UI
  const [, setEvents] = useState(readWorkflowEventLog());
  const [form, setForm] = useState({ type: 'income', code: '', amount: 0, startMonth: '', endMonth: '' });
  // Canonical event-sourced workflow state
  const eventLog = readWorkflowEventLog();
  // Get workflow steps for gating
  const steps = getWorkflowStepsCached('main-workflow');
  // Define isStep4Ouverte for form controls
  const isStep4Ouverte = steps[4]?.state === 'Ouverte';
  // Get the latest non-cancelled droits period from event stream
  const allDroitsPeriods = getDatesDuDroit(eventLog);
  const latestDroitsPeriod = allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;
  // Use the canonical projection for the latest droits period
  let entriesByMonth = {};
  if (latestDroitsPeriod) {
    entriesByMonth = QueryRessourceEntries(latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
  }
  const allMonths = Object.keys(entriesByMonth).sort();

  // State for raw query result
  const [queryResult, setQueryResult] = useState(null);

  function handleQuery() {
    if (queryResult) {
      setQueryResult(null);
      return;
    }
    if (!latestDroitsPeriod) {
      setQueryResult('No droits period');
      return;
    }
    const byMonth = QueryRessourceEntries(latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
    setQueryResult(byMonth);
  }
  // Build a map of entryId to entry (unique entries)
  // Use all entries from the projection for the table
  const entryMap = new Map();
  for (const month of allMonths) {
    for (const entry of entriesByMonth[month]) {
      if (!entryMap.has(entry.entryId)) {
        entryMap.set(entry.entryId, { ...entry });
      }
    }
  }
  const filteredEntries = Array.from(entryMap.values());

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

  function handleAdd() {
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
    // Restrict entry addition to the current droits period
    if (!latestDroitsPeriod || !latestDroitsPeriod.startMonth || !latestDroitsPeriod.endMonth) {
      alert('No droits period defined.');
      return;
    }
    const [pSy, pSm] = latestDroitsPeriod.startMonth.split('-').map(Number);
    const [pEy, pEm] = latestDroitsPeriod.endMonth.split('-').map(Number);
    const startOk = (sy > pSy) || (sy === pSy && sm >= pSm);
    const endOk = (ey < pEy) || (ey === pEy && em <= pEm);
    if (!(startOk && endOk)) {
      alert('You can only add entries within the current droits period.');
      return;
    }
    const entryId = uuidv4();
    // Use canonical changeId from event-sourced workflow state
    const changeId = (() => {
      const eventLog = readWorkflowEventLog();
      const last = [...eventLog].reverse().find(e => e.changeId);
      return last ? last.changeId : null;
    })();
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
      const userEmail = user?.email || user?.name || 'anonymous';
      const newEvents = handleAddEntry(eventLog, command, userEmail);
      const updated = [...eventLog, ...newEvents];
      setEvents(updated);
      // Write to canonical event log
      localStorage.setItem('eventz_workflow_event_log', JSON.stringify(updated));
      setForm({ type: 'income', code: '', amount: 0, startMonth: '', endMonth: '' });
    } catch (e) {
      alert(e.message);
    }
  }
  function handleDelete(entryId) {
    const command = DeleteEntryCommand(entryId);
    try {
      const userEmail = user?.email || user?.name || 'anonymous';
      const newEvents = handleDeleteEntry(eventLog, command, userEmail);
      const updated = [...eventLog, ...newEvents];
      setEvents(updated);
      // Write to canonical event log
      localStorage.setItem('eventz_workflow_event_log', JSON.stringify(updated));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="workflow-main-container">
      <section className="workflow-header">
        <ProcessFlowStatusBar />
      </section>
      <section className="workflow-content">
        <div className="event-stream-section" style={{ position: 'relative' }}>
          <h2>Finance Tracker</h2>
          <div style={{ margin: '8px 0 24px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
            <b>Période de droits courante (depuis l&apos;event stream):</b>
            {latestDroitsPeriod ? (
              <span style={{ marginLeft: 8 }}>
                {latestDroitsPeriod.startMonth} &rarr; {latestDroitsPeriod.endMonth} {latestDroitsPeriod.ts ? <span style={{ color: '#888', fontSize: 12 }}>({latestDroitsPeriod.ts.slice(0, 10)})</span> : null}
              </span>
            ) : (
              <span style={{ marginLeft: 8 }}>Aucune période définie.</span>
            )}
          </div>
          <div className="event-stream-title">Ressources - Revenus / Dépenses (EventZ)</div>
          <button
            className="projection-btn"
            onClick={handleQuery}
          >
            {queryResult ? 'Fermer Projection' : 'Afficher Projection'}
          </button>
          {queryResult && (
            <div className="projection-popup">
              <button className="projection-close-btn" onClick={handleQuery}>
                Fermer
              </button>
              <strong>Projection (raw):</strong>
              <pre style={{ fontSize: 13, margin: 0, background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
                {typeof queryResult === 'string' ? queryResult : JSON.stringify(queryResult, null, 2)}
              </pre>
            </div>
          )}
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
      </section>
      <section className="workflow-event-stream">
        <EventStream
          events={eventLog}
          filter={e => e.event === 'EntryAdded' || e.event === 'EntryDeleted'}
          maxHeight={400}
          showTitle={true}
        />
      </section>
    </div>
  );
};

export default EventzFinanceTracker;
