import { v4 as uuidv4 } from 'uuid';
// Event creators for resource versioning
// Aliases for slices
export const createCreerRessourceVersion = createRessourcesOpenedForChange;
export const createValiderRessourcesVersion = createRessourcesClosedForChange;
export const createAnnulerRessourcesVersion = createRessourcesCancelled;

export function createRessourcesOpenedForChange({ changeId, userEmail }) {
  return {
    event: 'RessourcesOpenedForChange',
    ressourceVersionId: uuidv4(),
    changeId,
    userEmail,
    timestamp: new Date().toISOString()
  };
}

export function createRessourcesClosedForChange({ changeId, ressourceVersionId, userEmail }) {
  return {
    event: 'RessourcesClosedForChange',
    ressourceVersionId,
    changeId,
    userEmail,
    timestamp: new Date().toISOString()
  };
}

export function createRessourcesCancelled({ changeId, ressourceVersionId, userEmail }) {
  return {
    event: 'RessourcesCancelled',
    ressourceVersionId,
    changeId,
    userEmail,
    timestamp: new Date().toISOString()
  };
}
