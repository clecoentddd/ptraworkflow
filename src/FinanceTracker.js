import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './FinanceTracker.css';

const FIXED_INIT_CHANGE_ID = "a74ca9f1-4bc1-4422-81d7-567437709244"; // fixed uuid for defaults
const STORAGE_KEY = 'processState';

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

  // Default events with fixed changeId
  const defaultEvents = [
    { id: uuidv4(), changeId: FIXED_INIT_CHANGE_ID, type: 'income', code: '101', label: 'Salaire', amount: 1000, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), changeId: FIXED_INIT_CHANGE_ID, type: 'income', code: '102', label: 'Loyers reçus', amount: 500, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), changeId: FIXED_INIT_CHANGE_ID, type: 'expense', code: '201', label: 'Entretiens', amount: 200, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), changeId: FIXED_INIT_CHANGE_ID, type: 'expense', code: '202', label: 'Loyers versés', amount: 300, start: '2025-07', end: '2025-12' },
  ];

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });

  // Step 4 status + currentChangeId read from localStorage (unless prop passed)
  const [step4Status, setStep4Status] = useState(null);
  const [currentChangeId, setCurrentChangeId] = useState(propChangeId || null);

  // Debug logs for UI + console logs
  const [logs, setLogs] = useState([]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    loadSavedData();
    readStep4FromEventSourcedProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (propChangeId) {
      console.log('[FinanceTracker] Prop currentChangeId provided:', propChangeId);
      setCurrentChangeId(propChangeId);
    }
  }, [propChangeId]);

  // Load saved data from localStorage
  const loadSavedData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[FinanceTracker] Loaded saved data:', parsed);
        
        if (parsed.events && Array.isArray(parsed.events)) {
          setEvents(parsed.events);
        } else {
          // No saved events, use defaults
          setEvents(defaultEvents);
        }
        
        if (parsed.step4Status) {
          setStep4Status(parsed.step4Status);
        }
        
        if (parsed.changeId && !propChangeId) {
          setCurrentChangeId(parsed.changeId);
        }
      } else {
        // No saved data, use defaults
        console.log('[FinanceTracker] No saved data, using defaults');
        setEvents(defaultEvents);
      }
    } catch (err) {
      console.error('[FinanceTracker] Failed to load saved data:', err);
      setEvents(defaultEvents);
    }
  };

  // Save to localStorage whenever events, currentChangeId, or step4Status changes
  useEffect(() => {
    // Only save if we have events to save
    if (events.length > 0) {
      const stateToSave = { 
        events, 
        changeId: currentChangeId || FIXED_INIT_CHANGE_ID, 
        step4Status 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('[FinanceTracker] Auto-saved events to storage', stateToSave);
    }
  }, [events, currentChangeId, step4Status]);

  const readStep4FromEventSourcedProcess = () => {
    const EVENT_SOURCED_KEY = 'eventSourcedProcessState'; 
    try {
      const raw = localStorage.getItem(EVENT_SOURCED_KEY);
      if (!raw) {
        const msg = '[FinanceTracker] No EventSourcedProcess in localStorage';
        console.log(msg);
        setLogs(prev => [msg, ...prev].slice(0, 50));
        return;
      }
      const parsed = JSON.parse(raw);
      console.log('[FinanceTracker] readStep4FromEventSourcedProcess ->', parsed);
      setLogs(prev => [`${new Date().toISOString()} read EventSourcedProcess: ${JSON.stringify(parsed)}`, ...prev].slice(0, 50));
      
      // Update both step4Status and currentChangeId
      if (parsed.step4) setStep4Status(parsed.step4);
      if (parsed.changeId && !propChangeId) setCurrentChangeId(parsed.changeId);
    } catch (err) {
      console.error('[FinanceTracker] Failed to read EventSourcedProcess', err);
      setLogs(prev => [`${new Date().toISOString()} read error: ${String(err)}`, ...prev].slice(0, 50));
    }
  };

  const isEditable = step4Status === 'Ouverte' && !!currentChangeId;

  const handleAddEvent = () => {
    if (!form.code || !form.label || !form.start || !form.end || !form.amount) return;
    if (!isEditable) return;

    const newEvent = { id: uuidv4(), changeId: currentChangeId || FIXED_INIT_CHANGE_ID, ...form };
    
    setEvents(prev => [...prev, newEvent]);
    setForm({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });
  };

  const handleDeleteEvent = (entityId) => {
    const entity = events.find(ev => ev.id === entityId && ev.type !== 'cancelled');
    if (!entity || !isEditable) return;

    const cancelEvent = { ...entity, type: 'cancelled', timestamp: new Date().toISOString(), changeId: currentChangeId || FIXED_INIT_CHANGE_ID };
    setEvents(prev => [...prev, cancelEvent]);
  };

  const generateMonths = (start, end) => {
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

  // Event sourcing projection
  const cancelledIds = events.filter(ev => ev.type === 'cancelled').map(ev => ev.id);
  const activeEntities = events.filter(ev => ev.type !== 'cancelled' && !cancelledIds.includes(ev.id));

  const allMonthsSet = new Set();
  activeEntities.forEach(ev => {
    if (ev.start && ev.end) {
      generateMonths(ev.start, ev.end).forEach(month => allMonthsSet.add(month));
    }
  });
  const allMonths = Array.from(allMonthsSet).sort();

  const projection = activeEntities.map(ev => {
    const months = ev.start && ev.end ? generateMonths(ev.start, ev.end) : [];
    const row = {};
    allMonths.forEach(month => { row[month] = months.includes(month) ? ev.amount : 0; });
    return { ...ev, ...row };
  });

  const totals = {};
  allMonths.forEach(month => totals[month] = projection.reduce((sum, ev) => sum + ev[month], 0));

  return (
    <div className="finance-tracker">
      {/* Top banner for Step 4 status */}
      <div
        style={{
          backgroundColor: isEditable ? '#d4edda' : '#f8d7da',
          color: isEditable ? '#155724' : '#721c24',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '6px',
          fontWeight: 'bold'
        }}
      >
        Step 4 Status: {step4Status === 'Ouverte' ? 'Ouverte ✅' : (step4Status ? `${step4Status} ❌` : 'Non ouverte ❌')}
        {' '}
        <span style={{ fontWeight: 'normal', marginLeft: 12 }}>
          (currentChangeId: {currentChangeId || 'None'})
        </span>
        <button style={{ marginLeft: 12 }} onClick={readStep4FromEventSourcedProcess}>Refresh status</button>
      </div>

      <h2>Ressources - Revenus / Dépenses</h2>

      <div className="form-row">
        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} disabled={!isEditable}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={form.code} onChange={e => {
          const code = e.target.value;
          const option = [...incomeOptions, ...expenseOptions].find(o => o.code === code);
          setForm({...form, code, label: option?.label || ''});
        }} disabled={!isEditable}>
          <option value="">Code</option>
          {[...incomeOptions, ...expenseOptions].map(o => (
            <option key={o.code} value={o.code}>{o.code} - {o.label}</option>
          ))}
        </select>
        <input placeholder="Label" value={form.label} onChange={e => setForm({...form, label: e.target.value})} disabled={!isEditable}/>
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} disabled={!isEditable}/>
        <input type="month" placeholder="Start" value={form.start} onChange={e => setForm({...form, start: e.target.value})} disabled={!isEditable}/>
        <input type="month" placeholder="End" value={form.end} onChange={e => setForm({...form, end: e.target.value})} disabled={!isEditable}/>
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
          {projection.map(ev => {
            const total = allMonths.reduce((sum, month) => sum + ev[month], 0);
            return (
              <tr key={ev.id} className={ev.type === 'income' ? 'income-row' : 'expense-row'}>
                <td>{ev.code}</td>
                <td>{ev.label}</td>
                {allMonths.map(month => <td key={month}>{ev[month]}</td>)}
                <td>{total}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDeleteEvent(ev.id)} disabled={!isEditable}>Delete</button>
                </td>
              </tr>
            );
          })}
          <tr className="totals-row">
            <td colSpan={2}>Totals</td>
            {allMonths.map(month => <td key={month}>{totals[month]}</td>)}
            <td>{Object.values(totals).reduce((a,b)=>a+b,0)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="event-stream-bottom">
        <h3>Event Stream</h3>
        {events.map((ev, idx) => (
          <div key={ev.id} className="event-item">
            #{idx+1} [{ev.changeId}] {ev.type.toUpperCase()} {ev.code} {ev.label} {ev.amount || ''} ({ev.start || ''} → {ev.end || ''})  
            <div>UUID: {ev.id}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FinanceTracker;