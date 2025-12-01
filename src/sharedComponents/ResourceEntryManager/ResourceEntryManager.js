import React from 'react';
import './ResourceEntryManager.css';

const ResourceEntryManager = ({
  entries,
  allMonths,
  form,
  setForm,
  onAddEntry,
  onDeleteEntry,
  isStep4Ouverte,
  incomeOptions,
  expenseOptions,
  isMonthInRange,
  onUpdateClick
}) => (
  <div>
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
      <button onClick={onAddEntry} disabled={!isStep4Ouverte}>Add</button>
    </div>
    <table className="projection-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Code</th>
          <th>Label</th>
          {allMonths.map(month => {
            const [yyyy, mm] = month.split('-');
            return <th key={month}>{mm}-{yyyy.slice(2)}</th>;
          })}
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((row, idx) => {
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
              <td style={{ display: 'flex', gap: '8px' }}>
                <button className="update-entry-btn" onClick={() => onUpdateClick(row)} disabled={!isStep4Ouverte}>update</button>
                <button className="btn-delete" onClick={() => onDeleteEntry(row.entryId)} disabled={!isStep4Ouverte}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ResourceEntryManager;
