// CommandHandler: handleUpdateDroitsPeriod
// Emits PeriodesDroitsModifiees event

export default function handleUpdateDroitsPeriod(events, command) {
  const { startMonth, endMonth, changeId } = command.payload;
  if (!changeId) throw new Error('changeId is required');
  if (!startMonth || !endMonth) throw new Error('startMonth and endMonth are required');
  // Optionally: validate startMonth <= endMonth
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  if (sy > ey || (sy === ey && sm > em)) throw new Error('Start month must be before or equal to end month');
  return [{
  timestamp: new Date().toISOString(),
    event: 'PeriodesDroitsModifiees',
    changeId,
    payload: { startMonth, endMonth }
  }];
}
