// Command: UpdateDroitsPeriodCommand
// Usage: { type: 'UpdateDroitsPeriodCommand', payload: { startMonth, endMonth, changeId } }

export default function UpdateDroitsPeriodCommand(payload) {
  if (!payload.changeId) throw new Error('changeId is required');
  if (!payload.startMonth || !payload.endMonth) throw new Error('startMonth and endMonth are required');
  return { type: 'UpdateDroitsPeriodCommand', payload };
}
