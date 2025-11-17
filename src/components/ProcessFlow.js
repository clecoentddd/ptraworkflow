// Shared ProcessFlow component
import React from 'react';
import './ProcessFlow.css';

export default function ProcessFlow({ steps }) {
  function getStatusClass(status) {
    switch (status) {
      case 'ToDo': return 'status-todo';
      case 'Done': return 'status-done';
      case 'Skipped': return 'status-skipped';
      case 'Ouverte': return 'status-ouverte';
      case 'Ignored': return 'status-ignored';
      default: return '';
    }
  }
  return (
    <div className="process-flow">
      <div className="process-flow-title">Processus</div>
      <div className="process-flow-steps">
        {steps.map(step => (
          <div key={step.id} className="process-flow-step-row">
            <div className={`process-flow-step-indicator ${getStatusClass(step.status)}`}>{step.id}</div>
            <div>{step.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
