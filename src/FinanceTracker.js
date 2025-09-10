import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './FinanceTracker.css';

const FinanceTracker = () => {
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

  // Event Stream
  const [events, setEvents] = useState([
    { id: uuidv4(), type: 'income', code: '101', label: 'Salaire', amount: 1000, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), type: 'income', code: '102', label: 'Loyers reçus', amount: 500, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), type: 'expense', code: '201', label: 'Entretiens', amount: 200, start: '2025-07', end: '2025-12' },
    { id: uuidv4(), type: 'expense', code: '202', label: 'Loyers versés', amount: 300, start: '2025-07', end: '2025-12' },
  ]);

  const [form, setForm] = useState({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });

  const handleAddEvent = () => {
    if (!form.code || !form.label || !form.start || !form.end || !form.amount) return;
    const newEvent = { id: uuidv4(), ...form };
    setEvents(prev => [...prev, newEvent]);
    setForm({ type: 'income', code: '', label: '', amount: 0, start: '', end: '' });
  };

 const handleDeleteEvent = (entityId) => {
  const entity = events.find(ev => ev.id === entityId && ev.type !== 'cancelled');
  if (!entity) return;

  const cancelEvent = {
    ...entity,               // keep the same UUID
    type: 'cancelled',       // mark as cancelled
    timestamp: new Date().toISOString()
  };

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

  // Event Sourcing Projection
  // Get all cancelled UUIDs
const cancelledIds = events.filter(ev => ev.type === 'cancelled').map(ev => ev.id);

// Only include active entities (not cancelled)
const activeEntities = events.filter(ev => ev.type !== 'cancelled' && !cancelledIds.includes(ev.id));

  const allMonthsSet = new Set();
  activeEntities.forEach(ev => generateMonths(ev.start, ev.end).forEach(month => allMonthsSet.add(month)));
  const allMonths = Array.from(allMonthsSet).sort();

  const projection = activeEntities.map(ev => {
    const months = generateMonths(ev.start, ev.end);
    const row = {};
    allMonths.forEach(month => { row[month] = months.includes(month) ? ev.amount : 0; });
    return { ...ev, ...row };
  });

  const totals = {};
  allMonths.forEach(month => totals[month] = projection.reduce((sum, ev) => sum + ev[month], 0));

  return (
    <div className="finance-tracker">
      <h2>Ressources - Revenus / Dépenses</h2>

      <div className="form-row">
        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={form.code} onChange={e => {
          const code = e.target.value;
          const option = [...incomeOptions, ...expenseOptions].find(o => o.code === code);
          setForm({...form, code, label: option?.label || ''});
        }}>
          <option value="">Code</option>
          {[...incomeOptions, ...expenseOptions].map(o => (
            <option key={o.code} value={o.code}>{o.code} - {o.label}</option>
          ))}
        </select>
        <input placeholder="Label" value={form.label} onChange={e => setForm({...form, label: e.target.value})}/>
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})}/>
        <input type="month" placeholder="Start" value={form.start} onChange={e => setForm({...form, start: e.target.value})}/>
        <input type="month" placeholder="End" value={form.end} onChange={e => setForm({...form, end: e.target.value})}/>
        <button onClick={handleAddEvent}>Add</button>
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
                  <button className="btn-delete" onClick={() => handleDeleteEvent(ev.id)}>Delete</button>
                </td>
              </tr>
            )
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
            #{idx+1} {ev.type.toUpperCase()} {ev.code} {ev.label} {ev.amount || ''} ({ev.start || ''} → {ev.end || ''})  
            <div>UUID: {ev.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FinanceTracker;