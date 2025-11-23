// ErrorLog.js
// EventZ error log projection and UI
import React from 'react';

export function getErrorLog(eventLog) {
  // Only keep unique errors by errorId
  const errors = [];
  const seen = new Set();
  for (const e of eventLog) {
    if (e.event === 'ErrorLog' && !seen.has(e.errorId)) {
      errors.push(e);
      seen.add(e.errorId);
    }
  }
  return errors;
}

export function ErrorLogIcon({ hasError }) {
  return (
    <span style={{ color: hasError ? '#e11d48' : '#888', marginLeft: 8 }} title={hasError ? 'Error(s) in workflow' : 'No errors'}>
      {hasError ? '❓' : '✔️'}
    </span>
  );
}

export function ErrorLogList({ errors }) {
  return (
    <div className="error-log-list">
      <h3>Workflow Errors</h3>
      {errors.length === 0 ? <div>No errors.</div> : (
        <ul>
          {errors.map(e => (
            <li key={e.errorId} style={{ color: '#e11d48' }}>
              {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
