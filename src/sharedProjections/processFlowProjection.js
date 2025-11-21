// Projection: returns process steps and their status from processState
import processStepsDef from './processStepsDef';

export default function processFlowProjection(processState) {
  return processStepsDef.map(step => {
    // For backward compatibility, if processState has only 6 steps, treat step6 as old step5, step7 as old step6
    let status = processState[`step${step.id}`];
    if (status === undefined && step.id === 6 && processState.step5) status = processState.step5;
    if (status === undefined && step.id === 7 && processState.step6) status = processState.step6;
    return {
      ...step,
      status
    };
  });
}
