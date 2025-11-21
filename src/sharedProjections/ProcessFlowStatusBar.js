import React from 'react';
import processStepsDef from './processStepsDef';
import { getWorkflowStepsCached } from '../workflowProjections';
import './ProcessFlowShared.css';

// Self-contained process flow status bar
const ProcessFlowStatusBar = ({ workflowId = 'main-workflow' }) => {
  // Canonical event-sourced workflow state
  // eventLog is not needed here
  const steps = getWorkflowStepsCached(workflowId);
  // Compose process steps with status for UI
  const processSteps = processStepsDef.map(step => ({
    ...step,
    status: steps[step.id]?.state
  }));

  function getStatusClass(status) {
    switch (status) {
      case 'ToDo': return 'status-todo';
      case 'Done': return 'status-done';
      case 'Skipped': return 'status-skipped';
      case 'Ouverte': return 'status-ouverte';
      case 'Ignored': return 'status-ignored';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  return (
    <div className="process-flow-shared-bar-horizontal">
      {processSteps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className={`process-step-bar ${getStatusClass(step.status)}`}>
            <span className="step-id-bar">{step.id}</span>
            <span className="step-name-bar">{step.name}</span>
            <span className="step-status-bar">{step.status}</span>
          </div>
          {idx < processSteps.length - 1 && (
            <span className="process-flow-arrow-bar">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProcessFlowStatusBar;
