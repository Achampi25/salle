// Liste d'exercices par défaut + exercices perso.
import { state } from './store.js';
import { norm } from './ui.js';

export const MUSCLES = {
  pecs: 'Pectoraux',
  dos: 'Dos',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quadri: 'Quadriceps',
  ischios: 'Ischio-jambiers',
  fessiers: 'Fessiers',
  mollets: 'Mollets',
  abdos: 'Abdos',
  avantbras: 'Avant-bras',
  complet: 'Corps entier',
  cardio: 'Cardio',
};

export const EQUIP = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  pdc: 'Poids du corps',
  kettlebell: 'Kettlebell',
  cardio: 'Cardio',
  autre: 'Autre',
};

// kind : w = poids × reps (défaut), t = durée, c = cardio (distance + minutes)
export const KINDS = { w: 'Poids × répétitions', t: 'Durée (secondes)', c: 'Cardio (km + minutes)' };

// Format : Nom|équipement|type(optionnel)
const RAW = {
  pecs: `Développé couché (barre)|barre
Développé couché haltères|halteres
Développé incliné (barre)|barre
Développé incliné haltères|halteres
Développé décliné (barre)|barre
Développé décliné haltères|halteres
Développé couché Smith|machine
Développé incliné Smith|machine
Développé assis machine (chest press)|machine
Développé incliné machine|machine
Écarté couché haltères|halteres
Écarté incliné haltères|halteres
Pec deck (butterfly)|machine
Écarté poulie vis-à-vis|poulie
Écarté poulie basse|poulie
Pompes|pdc
Pompes déclinées|pdc
Dips (pectoraux)|pdc
Pull-over haltère|halteres`,
  dos: `Tractions pronation|pdc
Tractions supination|pdc
Tractions prise neutre|pdc
Tractions assistées (machine)|machine
Tirage vertical poitrine|poulie
Tirage vertical prise serrée|poulie
Tirage vertical supination|poulie
Rowing barre|barre
Rowing Pendlay|barre
Rowing haltère unilatéral|halteres
Rowing T-bar|barre
Rowing assis poulie|poulie
Rowing machine|machine
Rowing inversé|pdc
Soulevé de terre|barre
Soulevé de terre sumo|barre
Rack pull|barre
Pull-over poulie bras tendus|poulie
Extensions lombaires|pdc
Good morning|barre
Shrug barre|barre
Shrug haltères|halteres`,
  epaules: `Développé militaire (barre)|barre
Développé épaules haltères assis|halteres
Développé Arnold|halteres
Développé épaules machine|machine
Élévations latérales haltères|halteres
Élévations latérales poulie|poulie
Élévations latérales machine|machine
Élévations frontales haltères|halteres
Élévations frontales disque|autre
Oiseau haltères|halteres
Reverse pec deck|machine
Face pull|poulie
Rowing menton|barre
Push press|barre
Landmine press|barre`,
  biceps: `Curl barre|barre
Curl barre EZ|barre
Curl haltères|halteres
Curl alterné haltères|halteres
Curl marteau|halteres
Curl incliné haltères|halteres
Curl pupitre (Larry Scott)|barre
Curl pupitre machine|machine
Curl concentré|halteres
Curl poulie basse|poulie
Curl poulie haute|poulie
Curl araignée|halteres`,
  triceps: `Dips (triceps)|pdc
Dips machine|machine
Barre au front|barre
Extension nuque haltère|halteres
Extension triceps poulie (corde)|poulie
Extension triceps poulie (barre)|poulie
Extension triceps poulie au-dessus de la tête|poulie
Développé couché prise serrée|barre
Kickback haltère|halteres
Kickback poulie|poulie
Pompes diamant|pdc
Extension triceps machine|machine`,
  quadri: `Squat (barre)|barre
Squat avant (front squat)|barre
Squat gobelet|halteres
Squat Smith|machine
Hack squat|machine
Presse à cuisses|machine
Leg extension|machine
Fentes avant haltères|halteres
Fentes marchées|halteres
Fentes bulgares|halteres
Fentes barre|barre
Step-up|halteres
Pendulum squat|machine
Belt squat|machine
Sissy squat|pdc`,
  ischios: `Soulevé de terre jambes tendues|barre
Soulevé de terre roumain (barre)|barre
Soulevé de terre roumain haltères|halteres
Leg curl allongé|machine
Leg curl assis|machine
Leg curl debout|machine
Nordic curl|pdc
Glute ham raise|machine`,
  fessiers: `Hip thrust (barre)|barre
Hip thrust machine|machine
Pont fessier|pdc
Abduction machine|machine
Adduction machine|machine
Kickback fessier poulie|poulie
Kickback fessier machine|machine
Abduction poulie|poulie`,
  mollets: `Mollets debout machine|machine
Mollets assis machine|machine
Mollets à la presse|machine
Mollets debout haltère|halteres
Mollets Smith|machine`,
  abdos: `Crunch|pdc
Crunch poulie haute|poulie
Crunch machine|machine
Relevé de jambes suspendu|pdc
Relevé de genoux suspendu|pdc
Relevé de jambes chaise romaine|pdc
Gainage (planche)|pdc|t
Gainage latéral|pdc|t
Russian twist|autre
Roue abdominale|autre
Sit-up décliné|pdc
Pallof press|poulie
Bûcheron poulie|poulie
Dragon flag|pdc
Mountain climbers|pdc`,
  avantbras: `Curl poignets|barre
Curl poignets inversé|barre
Curl inversé|barre
Farmer walk|halteres|t
Suspension à la barre|pdc|t`,
  complet: `Kettlebell swing|kettlebell
Épaulé (power clean)|barre
Arraché (snatch)|barre
Thruster|barre
Burpees|pdc
Turkish get-up|kettlebell`,
  cardio: `Tapis de course|cardio|c
Vélo|cardio|c
Vélo elliptique|cardio|c
Rameur|cardio|c
Stepper / escalier|cardio|c
Air bike|cardio|c
SkiErg|cardio|c
Corde à sauter|cardio|c`,
};

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const DEFAULT_EXERCISES = Object.entries(RAW).flatMap(([muscle, txt]) =>
  txt.split('\n').map(line => {
    const [name, equip, kind = 'w'] = line.split('|').map(s => s.trim());
    return { id: slug(name), name, muscle, equip, kind };
  }));

const byId = new Map(DEFAULT_EXERCISES.map(e => [e.id, e]));

export function allExercises() {
  return [...DEFAULT_EXERCISES, ...state.custom];
}

export function getEx(id) {
  return byId.get(id) || state.custom.find(e => e.id === id)
    || { id, name: 'Exercice supprimé', muscle: 'complet', equip: 'autre', kind: 'w' };
}

/** Profil de saisie : w (charge × reps), pdc (lest × reps), t (durée), c (cardio). */
export function profile(ex) {
  if (ex.kind === 't') return 't';
  if (ex.kind === 'c') return 'c';
  return ex.equip === 'pdc' ? 'pdc' : 'w';
}

export function fieldLabels(ex) {
  return { w: ['kg', 'reps'], pdc: ['+kg', 'reps'], t: ['+kg', 'sec'], c: ['km', 'min'] }[profile(ex)];
}
