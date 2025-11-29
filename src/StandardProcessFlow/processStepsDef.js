// Actual process steps definition
const processStepsDef = [
	{ id: 1, name: 'Créer la mutation', optional: false },
	{ id: 2, name: 'Suspendre les paiements', optional: false },
	{ id: 3, name: 'Mettre à jour les droits', optional: true },
	{ id: 4, name: 'Mettre à jour les ressources', optional: true },
	{ id: 5, name: 'Faire un plan de calcul', optional: false },
	{ id: 6, name: 'Décision: prestations, paiements', optional: false },
	{ id: 7, name: 'Plan de paiement', optional: false },
];

export default processStepsDef;
