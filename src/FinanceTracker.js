import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './FinanceTracker.css';

const FIXED_INIT_CHANGE_ID = "a74ca9f1-4bc1-4422-81d7-567437709244";
const STORAGE_KEY_EVENTS = "eventSourcedProcessEvents";

const FinanceTracker = ({ currentChangeId: propChangeId }) => {
  const incomeOptions = [
    { code: '101', label: 'Salaire' },
    { code: '102', label: 'Loyers reçus' },
    { code: '103', label: 'Dividendes' },
    { code: '104', label: 'Bonus' },
    { code: '105', label: 'Ventes' },
    { code: '106', label: 'Remboursements' },
    { code: '107', label: 'Subventions' },
    { code: '108', label: 'Intérêts bancaires' },
    { code: '109', label: 'Aides sociales' },
    { code: '110', label: 'Autres revenus' },
  ];

  const expenseOptions = [
    { code: '201', label: 'Entretiens' },
    { code: '202', label: 'Loyers versés' },
    { code: '203', label: 'Assurances' },
    { code: '204', label: 'Transports' },
    { code: '205', label: 'Alimentation' },
    { code: '206', label: 'Énergie' },
    { code: '207', label: 'Téléphone/Internet' },
    { code: '208', label: 'Impôts' },
    { code: '209', label: 'Loisirs' },
    { code: '210', label: 'Autres dépenses' },
  ];

  const [globalEvents, setGlobalEvents] = useState([]);
  const [form, setForm] = useState({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });
  const [step4Status, setStep4Status] = useState(null);
  const [currentChangeId, setCurrentChangeId] = useState(propChangeId || null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (saved) {
      setGlobalEvents(JSON.parse(saved));
    } else {
      const defaultEvents = [
        {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'ResourceAdded',
          stepId: 4,
          changeId: FIXED_INIT_CHANGE_ID,
          data: { resourceId: uuidv4(), resourceType: 'income', code: '101', label: 'Salaire', amount: 1000, period: '2025-07 → 2025-12' },
          sequenceNumber: 1,
          aggregate: 'resources'
        },
        {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'ResourceAdded',
          stepId: 4,
          changeId: FIXED_INIT_CHANGE_ID,
          data: { resourceId: uuidv4(), resourceType: 'income', code: '102', label: 'Loyers reçus', amount: 500, period: '2025-07 → 2025-12' },
          sequenceNumber: 2,
          aggregate: 'resources'
        },
        {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'ResourceAdded',
          stepId: 4,
          changeId: FIXED_INIT_CHANGE_ID,
          data: { resourceId: uuidv4(), resourceType: 'expense', code: '201', label: 'Entretiens', amount: 200, period: '2025-07 → 2025-12' },
          sequenceNumber: 3,
          aggregate: 'resources'
        },
        {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'ResourceAdded',
          stepId: 4,
          changeId: FIXED_INIT_CHANGE_ID,
          data: { resourceId: uuidv4(), resourceType: 'expense', code: '202', label: 'Loyers versés', amount: 300, period: '2025-07 → 2025-12' },
          sequenceNumber: 4,
          aggregate: 'resources'
        }
      ];

      setGlobalEvents(defaultEvents);
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(defaultEvents));
    }

    readStep4Status();
  }, []);

  const readStep4Status = () => {
    const raw = localStorage.getItem('eventSourcedProcessState');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.step4) setStep4Status(parsed.step4);
      if (parsed.changeId && !propChangeId) setCurrentChangeId(parsed.changeId);
    }
  };

  const addGlobalEvent = (type, stepId, data = {}, changeId = null) => {
    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      stepId,
      changeId: changeId || currentChangeId || FIXED_INIT_CHANGE_ID,
      data,
      sequenceNumber: globalEvents.length + 1,
      aggregate: 'resources'
    };

    const updated = [...globalEvents, event]; // chronological order: oldest first
    setGlobalEvents(updated);
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
  };

  const handleAddEvent = () => {
    if (!form.code || !form.label || !form.start || !form.end || !form.amount) return;
    if (step4Status !== 'Ouverte' || !currentChangeId) return;

    const resourceId = uuidv4();
    addGlobalEvent('ResourceAdded', 4, {
      resourceId,
      resourceType: form.type,
      code: form.code,
      label: form.label,
      amount: form.amount,
      period: `${form.start} → ${form.end}`
    });

    setForm({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });
  };

  const handleDeleteEvent = (resourceId) => {
    if (step4Status !== 'Ouverte' || !currentChangeId) return;

    addGlobalEvent('ResourceRemoved', 4, { resourceId });
  };

  const cancelledChangeIds = globalEvents
    .filter(event => event.type === 'OperationMutationAnnulée')
    .map(event => event.changeId);

  const validResourceEvents = globalEvents
    .filter(event => event.aggregate === 'resources' && !cancelledChangeIds.includes(event.changeId))
    .slice()
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber); // oldest first

  const resourceMap = new Map();
  validResourceEvents.forEach(event => {
    if (event.type === 'ResourceAdded') {
      resourceMap.set(event.data.resourceId, event.data);
    } else if (event.type === 'ResourceRemoved') {
      resourceMap.delete(event.data.resourceId);
    }
  });

  const activeResources = Array.from(resourceMap.values());

  const generateMonths = (period) => {
    const [start, end] = period.split(' → ');
    const months = [];
    let [y, m] = start.split('-').map(Number);
    const [endY, endM] = end.split('-').map(Number);
    while (y < endY || (y === endY && m <= endM)) {
      months.push(`${m.toString().padStart(2, '0')}-${y.toString().slice(2)}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return months;
  };

  const allMonthsSet = new Set();
  activeResources.forEach(resource => {
    if (resource.period) {
      generateMonths(resource.period).forEach(month => allMonthsSet.add(month));
    }
  });
  const allMonths = Array.from(allMonthsSet).sort();

  const projection = activeResources.map(resource => {
    const months = resource.period ? generateMonths(resource.period) : [];
    const row = { ...resource };
    allMonths.forEach(month => {
      row[month] = months.includes(month) ? resource.amount : 0;
    });
    return row;
  });

  const totals = {};
  allMonths.forEach(month => {
    totals[month] = projection.reduce((sum, row) => sum + row[month], 0);
  });

  const isEditable = step4Status === 'Ouverte' && !!currentChangeId;

  return (
    <div className="finance-tracker">
      <div style={{
        backgroundColor: isEditable ? '#d4edda' : '#f8d7da',
        color: isEditable ? '#155724' : '#721c24',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '6px',
        fontWeight: 'bold'
      }}>
        Step 4 Status: {step4Status === 'Ouverte' ? 'Ouverte ✅' : (step4Status ? `${step4Status} ❌` : 'Non ouverte ❌')}
        {' '}
        <span style={{ fontWeight: 'normal', marginLeft: 12 }}>
          (currentChangeId: {currentChangeId || 'None'})
        </span>
        <button style={{ marginLeft: 12 }} onClick={readStep4Status}>Refresh status</button>
      </div>

      <h2>Ressources - Revenus / Dépenses</h2>

      <div className="form-row">
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} disabled={!isEditable}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={form.code} onChange={e => {
          const code = e.target.value;
          const option = [...incomeOptions, ...expenseOptions].find(o => o.code === code);
          setForm({ ...form, code, label: option?.label || '' });
        }} disabled={!isEditable}>
          <option value="">Code</option>
          {[...incomeOptions, ...expenseOptions].map(o => (
            <option key={o.code} value={o.code}>{o.code} - {o.label}</option>
          ))}
        </select>
        <input placeholder="Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} disabled={!isEditable} />
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} disabled={!isEditable} />
        <input type="month" placeholder="Start" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} disabled={!isEditable} />
        <input type="month" placeholder="End" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} disabled={!isEditable} />
        <button onClick={handleAddEvent} disabled={!isEditable}>Add</button>
      </div>

      <table className="projection-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Label</th>
            {allMonths.map(month => <th key={month}>{month}</th>)}
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {projection.map((row, idx) => {
            const total = allMonths.reduce((sum, month) => sum + row[month], 0);
            return (
              <tr key={`${row.code}-${idx}`} className={row.resourceType === 'income' ? 'income-row' : 'expense-row'}>
                <td>{row.code}</td>
                <td>{row.label}</td>
                {allMonths.map(month => <td key={month}>{row[month]}</td>)}
                <td>{total}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDeleteEvent(row.resourceId)} disabled={!isEditable}>Delete</button>
                </td>
              </tr>
            );
          })}
          <tr className="totals-row">
            <td colSpan={2}>Totals</td>
            {allMonths.map(month => <td key={month}>{totals[month]}</td>)}
            <td>{Object.values(totals).reduce((a, b) => a + b, 0)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="event-stream-bottom">
        <h3>Resource Event Stream</h3>
        {globalEvents.length === 0 ? (
  <div className="no-events">No events yet...</div>
) : (
  globalEvents
    .filter(event => event.type === "ResourceAdded" || event.type === "ResourceRemoved")
    .map(event => (
      <div key={event.id} className="event-item">
        <div className="event-header">
          #{event.sequenceNumber} {event.type}
        </div>
        <div className="event-meta">
          Step {event.stepId} | ChangeId {event.changeId} |{" "}
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
        <div className="event-data">{JSON.stringify(event.data)}</div>
      </div>
    ))
)}
      </div>
    </div>
  );
};

export default FinanceTracker;
