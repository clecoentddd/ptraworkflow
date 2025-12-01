
import AutoriserMutationDeRessourcesCommandHandler from './MutationDeRessources/03 AutoriserMutationDeRessources/AutoriserMutationDeRessourcesCommandHandler';
import AutoriserMutationDeRessourcesCommand from './MutationDeRessources/03 AutoriserMutationDeRessources/AutoriserMutationDeRessourcesCommand';

// Singleton detection: set a global property
if (!window.__EVENT_BUS_SINGLETON_ID) {
  window.__EVENT_BUS_SINGLETON_ID = Math.random().toString(36).slice(2);
}
console.log('[eventBus] Initialized, singleton id:', window.__EVENT_BUS_SINGLETON_ID);

const listeners = {};

export const subscribe = (eventType, callback) => {
  console.log(`[eventBus] Subscribing to event: ${eventType}`);
  if (!listeners[eventType]) listeners[eventType] = [];
  listeners[eventType].push(callback);
  return () => {
    listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
  };
};

export const publish = (eventType, payload) => {
  console.log(`[eventBus] Publishing event: ${eventType}`, payload);
  if (listeners[eventType]) {
    listeners[eventType].forEach(cb => cb(payload));
  }
};

// --- AUTOMATION: AutoriserMutationDeRessources ---
subscribe('MutationDeRessourcesCréée', ({ changeId, userEmail }) => {
  try {
    const command = AutoriserMutationDeRessourcesCommand({ changeId, userEmail });
    AutoriserMutationDeRessourcesCommandHandler(command);
    // Optionally publish a follow-up event
    publish('RessourcesOpenedForChange', { changeId });
  } catch (err) {
    // Optionally log or handle automation errors
    console.error('[Automation] AutoriserMutationDeRessources error:', err);
  }
});
