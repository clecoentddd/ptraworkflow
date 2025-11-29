
import { createMutationF } from './mutationF.js';

export function créerMutationDeRessourcesCommand(eventLog, command) {
  const safeEventLog = Array.isArray(eventLog) ? eventLog : [];
    console.log('[créerMutationDeRessourcesCommand] eventLog:', safeEventLog);
    console.log('[créerMutationDeRessourcesCommand] command:', command);
    const result = createMutationF(safeEventLog, command);
    console.log('[créerMutationDeRessourcesCommand] result:', result);
    return result;
}

