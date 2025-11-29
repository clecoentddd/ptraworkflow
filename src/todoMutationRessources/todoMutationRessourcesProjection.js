// Pure eventz projection for todo mutation ressources
import { getTodoMutationRessourcesState } from './todoMutationRessourcesSlice';

export function projectTodoMutationRessources(events) {
  // Find the latest MutationChangeCreated event
  const latest = [...events]
    .filter(e => e.type === 'MutationChangeCreated' || e.event === 'MutationChangeCreated')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  if (latest) {
    return {
      changeId: latest.changeId,
      todoState: [
        { key: 'step4b', label: 'Vérifier les ressources modifiées', state: 'todo' },
        { key: 'step5', label: 'Effectuer le plan de calcul', state: 'pending' },
        { key: 'step6b', label: 'Valider la décision', state: 'pending' }
      ]
    };
  }
  return {
    changeId: null,
    todoState: getTodoMutationRessourcesState()
  };
}
