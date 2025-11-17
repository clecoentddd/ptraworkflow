// Shared horizontal ProcessFlow component for both Droits and Finance
import React from 'react';
import './ProcessFlowShared.css';

export default function ProcessFlowShared({ steps }) {
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
    <div className="process-flow-shared">
      <div className="process-flow-title">Processus</div>
      <div className="process-flow-steps-horizontal">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="process-flow-step-horizontal">
              <div className={`process-flow-step-indicator ${getStatusClass(step.status)}`}>{step.id}</div>
              <div className="process-flow-step-label">{step.name}</div>
            </div>
            {idx < steps.length - 1 && <div className="process-flow-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
