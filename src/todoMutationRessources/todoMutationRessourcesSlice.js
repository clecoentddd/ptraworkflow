// slice for todoMutationRessources vertical slice
// Handles workflow steps as todos for MutationDeRessourcesUniquement

const initialState = [
  { key: 'step4b', label: 'Vérifier les ressources modifiées', state: 'active' },
  { key: 'step5', label: 'Effectuer le plan de calcul', state: 'pending' },
  { key: 'step6b', label: 'Valider la décision', state: 'pending' }
];

export function getTodoMutationRessourcesState(state = initialState) {
  return state;
}

export function completeStep(state, stepKey) {
  const idx = state.findIndex(s => s.key === stepKey);
  if (idx === -1) return state;
  // Mark current step as completed
  const newState = state.map((s, i) =>
    i === idx ? { ...s, state: 'completed' } : s
  );
  // Activate next step if exists
  if (idx < state.length - 1) {
    newState[idx + 1] = { ...newState[idx + 1], state: 'active' };
  }
  return newState;
}
