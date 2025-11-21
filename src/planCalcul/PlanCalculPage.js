import EventStream from '../components/EventStream';
import { PLAN_DE_CALCUL_EFFECTUE_EVENT } from './event';
import React, { useState } from 'react';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';
import getDatesDuDroit from '../ressources/projections/getAllDroitsPeriods';
import computeEntries, { QueryRessourceEntries } from '../ressources/projections/computeEntries';
import { getLastCalculation } from './planCalculProjection';
import { createCalculation } from './planCalculSlice';
import { createPlanDeCalculEffectueEvent } from './event';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import './PlanCalculPage.css';

// Get validated finance entries for the current changeId, grouped by month
function getFinanceProjectionForChangeId(events, eventLog, changeId, startMonth, endMonth) {
  console.log('[getFinanceProjectionForChangeId] args:', { events, eventLog, changeId, startMonth, endMonth });
  const entriesByMonth = computeEntries(events, eventLog);
  // Get all months in the period
  const months = [];
  let [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  while (sy < ey || (sy === ey && sm <= em)) {
    months.push(`${sy.toString().padStart(4, '0')}-${sm.toString().padStart(2, '0')}`);
    sm++;
    if (sm > 12) { sm = 1; sy++; }
  }
  // For each entry, only keep those with the current changeId
  const filteredByChangeId = {};
  for (const month of months) {
    const entries = (entriesByMonth[month] || []).filter(e => e.changeId === changeId);
    if (entries.length > 0) {
      filteredByChangeId[month] = entries;
    }
  }
  console.log('[getFinanceProjectionForChangeId] months:', months);
  console.log('[getFinanceProjectionForChangeId] filteredByChangeId:', filteredByChangeId);
  return { months, filteredByChangeId };
}

export default function PlanCalculPage() {
  const [queryResult, setQueryResult] = useState(null);

  // Debug: log event log and droits periods
  const eventLog = readWorkflowEventLog();
  const allDroitsPeriods = getDatesDuDroit(eventLog);
  console.log('[PlanCalculPage] eventLog:', eventLog);
  console.log('[PlanCalculPage] allDroitsPeriods:', allDroitsPeriods);

  function handleQuery() {
    if (queryResult) {
      setQueryResult(null);
      return;
    }
    if (!latestDroitsPeriod) {
      setQueryResult('No droits period');
      return;
    }
    // Call the new query
    console.log('[PlanCalculPage] handleQuery: startMonth, endMonth', latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
    const byMonth = QueryRessourceEntries(latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
    console.log('[PlanCalculPage] QueryRessourceEntries result:', byMonth);
    setQueryResult(byMonth);
  }
  const steps = getWorkflowStepsCached('main-workflow');
  const changeId = (() => {
    const last = [...eventLog].reverse().find(e => e.changeId);
    return last ? last.changeId : null;
  })();
  // Only allow calculation if step 5 is Ouverte
  const canCalculate = changeId && steps[5]?.state === 'Ouverte';
  // Get latest droits period
  const latestDroitsPeriod = allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;
  console.log('[PlanCalculPage] changeId:', changeId);
  console.log('[PlanCalculPage] latestDroitsPeriod:', latestDroitsPeriod);
  // Get last calculation for this changeId
  const lastCalc = getLastCalculation(eventLog, changeId);
  const [message, setMessage] = useState('');
  // Get validated finance entries for this changeId and period
  const { months, filteredByChangeId } = latestDroitsPeriod && changeId
    ? getFinanceProjectionForChangeId(eventLog, eventLog, changeId, latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth)
    : { months: [], filteredByChangeId: {} };
  // For each entry (row), build a map of entryId to entry
  const entryMap = new Map();
  for (const month of months) {
    for (const entry of filteredByChangeId[month] || []) {
      if (!entryMap.has(entry.entryId)) {
        entryMap.set(entry.entryId, { ...entry });
      }
    }
  }
  const uniqueEntries = Array.from(entryMap.values());

  function handleCalculate() {
    if (!canCalculate || !latestDroitsPeriod) return;
    // For each month, sum all validated entries (income - expenses) for this changeId
    // Calculate raw amounts per month
    const rawRessources = months.map(month => {
      const entries = filteredByChangeId[month] || [];
      let totalIncome = 0;
      let totalExpense = 0;
      for (const e of entries) {
        if (e.type === 'income') totalIncome += Number(e.amount);
        if (e.type === 'expense') totalExpense += Number(e.amount);
      }
      return { month, amount: totalIncome - totalExpense };
    });
    // Calculate 10% amounts per month
    const calcRessources = rawRessources.map(r => ({ month: r.month, amount: Math.round(r.amount * 0.1 * 100) / 100 }));
    const calcEvent = createCalculation({
      changeId,
      startMonth: latestDroitsPeriod.startMonth,
      endMonth: latestDroitsPeriod.endMonth,
      ressources: calcRessources
    });
    // PlanDeCalculEffectué event should use calculated (10%) amounts
    const planDeCalculEvent = createPlanDeCalculEffectueEvent({
      changeId,
      calculationId: calcEvent.calculationId,
      startMonth: latestDroitsPeriod.startMonth,
      endMonth: latestDroitsPeriod.endMonth,
      ressources: calcRessources
    });
    appendWorkflowEvents([calcEvent, planDeCalculEvent]);
    setMessage('Calculation done!');
  }

  return (
    <div className="plandecalcul-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Process Flow (now on top, no card) */}
      <ProcessFlowStatusBar />

      {/* Display latest calculation period */}
      <div style={{ margin: '8px 0 16px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
        <b>Période de calcul courante :</b>
        {latestDroitsPeriod ? (
          <span style={{ marginLeft: 8 }}>
            {latestDroitsPeriod.startMonth} &rarr; {latestDroitsPeriod.endMonth} {latestDroitsPeriod.ts ? <span style={{ color: '#888', fontSize: 12 }}>({latestDroitsPeriod.ts.slice(0, 10)})</span> : null}
          </span>
        ) : (
          <span style={{ marginLeft: 8 }}>Aucune période définie.</span>
        )}
      </div>

      {/* Main Table/Card */}
      <div className="plan-calcul-main-section">
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28, marginTop: 0 }}>
          <button onClick={handleCalculate} disabled={!canCalculate} style={{ padding: '10px 24px', fontWeight: 600, borderRadius: 6, background: canCalculate ? '#1976d2' : '#aaa', color: '#fff', border: 'none', cursor: canCalculate ? 'pointer' : 'not-allowed', fontSize: 16 }}>
            Lancer le calcul mensuel (10%)
          </button>
          <button onClick={handleQuery} style={{ padding: '10px 24px', fontWeight: 600, borderRadius: 6, background: '#43a047', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>
            {queryResult ? 'Fermer Projection' : 'Afficher Projection'}
          </button>
          {message && <span style={{ marginLeft: 16, color: '#388e3c', fontWeight: 500, fontSize: 16 }}>{message}</span>}
        </div>
        {queryResult && (
          <div style={{ margin: '20px 0', background: '#f6f6f6', padding: 16, borderRadius: 8, fontSize: 14, position: 'relative' }}>
            <button onClick={handleQuery} style={{ position: 'absolute', top: 8, right: 8, background: '#e11d48', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
            <strong>Projection (raw):</strong>
            <pre style={{ fontSize: 13, margin: 0 }}>
              {typeof queryResult === 'string' ? queryResult : JSON.stringify(queryResult, null, 2)}
            </pre>
          </div>
        )}
        {months.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Synthèse mensuelle</h3>
            <table className="plan-calcul-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 180, textAlign: 'left' }}> </th>
                  {months.map(month => {
                    const [yyyy, mm] = month.split('-');
                    return <th key={month}>{mm}-{yyyy.slice(2)}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                <tr style={{ fontWeight: 600 }}>
                  <td>Total Ressources/Dépenses</td>
                  {months.map(month => {
                    let total = 0;
                    const entries = filteredByChangeId[month] || [];
                    for (const e of entries) {
                      if (e.type === 'income') total += Number(e.amount);
                      if (e.type === 'expense') total -= Number(e.amount);
                    }
                    return <td key={month} style={{ fontWeight: 700 }}>{total} €</td>;
                  })}
                </tr>
                {uniqueEntries.map((row, idx) => {
                  const label = row.label || row.code;
                  return (
                    <tr key={row.entryId} className={row.type === 'income' ? 'income-row' : 'expense-row'}>
                      <td style={{fontWeight:'bold'}}>{label} <span style={{ color: '#888', fontWeight: 400 }}>({row.type})</span></td>
                      {months.map(month => {
                        const covers = month >= row.startMonth && month <= row.endMonth;
                        return <td key={month}>{covers ? row.amount : ''}</td>;
                      })}
                    </tr>
                  );
                })}
                {lastCalc && (
                  <tr style={{ background: '#f9fbe7', fontWeight: 600 }}>
                    <td style={{ color: '#888' }}>Dernier calcul enregistré<br /><span style={{ fontSize: 12 }}>calculationId: {lastCalc.calculationId}</span></td>
                    {months.map(month => {
                      // Use the calculated 10% value from PlanDeCalculEffectué event
                      const planDeCalculEvent = eventLog.filter(e => e.event === 'PlanDeCalculEffectué' && e.changeId === lastCalc.changeId).slice(-1)[0];
                      let value = '';
                      if (planDeCalculEvent && planDeCalculEvent.payload && planDeCalculEvent.payload.ressources) {
                        const found = planDeCalculEvent.payload.ressources.find(row => row.month === month);
                        value = found ? `${found.amount} €` : '';
                      }
                      return <td key={month}>{value}</td>;
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Event Stream Card for Plan de Calcul */}
      <div className="event-stream-section">
        <EventStream
          events={eventLog.filter(e => e.event === PLAN_DE_CALCUL_EFFECTUE_EVENT)}
          maxHeight={260}
        />
      </div>
    </div>
  );
}
