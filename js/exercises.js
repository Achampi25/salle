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

// Exercices ayant des images (img/<id>-0.jpg et -1.jpg : position de départ et d'arrivée).
// Source : free-exercise-db (github.com/yuhonas/free-exercise-db), domaine public.
const WITH_IMG = new Set(`abduction-machine adduction-machine arrache-snatch barre-au-front bucheron-poulie corde-a-sauter crunch crunch-machine crunch-poulie-haute curl-alterne-halteres curl-araignee curl-barre curl-barre-ez curl-concentre curl-halteres curl-incline-halteres curl-inverse curl-marteau curl-poignets curl-poignets-inverse curl-poulie-basse curl-poulie-haute curl-pupitre-larry-scott curl-pupitre-machine developpe-arnold developpe-assis-machine-chest-press developpe-couche-barre developpe-couche-halteres developpe-couche-prise-serree developpe-couche-smith developpe-decline-barre developpe-decline-halteres developpe-epaules-halteres-assis developpe-epaules-machine developpe-incline-barre developpe-incline-halteres developpe-incline-machine developpe-incline-smith developpe-militaire-barre dips-machine dips-pectoraux dips-triceps ecarte-couche-halteres ecarte-incline-halteres ecarte-poulie-basse ecarte-poulie-vis-a-vis elevations-frontales-disque elevations-frontales-halteres elevations-laterales-halteres elevations-laterales-poulie epaule-power-clean extension-nuque-haltere extension-triceps-machine extension-triceps-poulie-au-dessus-de-la-tete extension-triceps-poulie-barre extension-triceps-poulie-corde extensions-lombaires face-pull farmer-walk fentes-avant-halteres fentes-barre fentes-bulgares fentes-marchees gainage-lateral gainage-planche glute-ham-raise good-morning hack-squat hip-thrust-barre kettlebell-swing kickback-fessier-machine kickback-fessier-poulie kickback-haltere landmine-press leg-curl-allonge leg-curl-assis leg-curl-debout leg-extension mollets-a-la-presse mollets-assis-machine mollets-debout-haltere mollets-debout-machine mollets-smith mountain-climbers nordic-curl oiseau-halteres pallof-press pec-deck-butterfly pompes pompes-declinees pompes-diamant pont-fessier presse-a-cuisses pull-over-haltere pull-over-poulie-bras-tendus push-press rack-pull rameur releve-de-jambes-chaise-romaine releve-de-jambes-suspendu reverse-pec-deck roue-abdominale rowing-assis-poulie rowing-barre rowing-haltere-unilateral rowing-inverse rowing-machine rowing-menton rowing-pendlay rowing-t-bar russian-twist shrug-barre shrug-halteres sissy-squat sit-up-decline souleve-de-terre souleve-de-terre-jambes-tendues souleve-de-terre-roumain-barre souleve-de-terre-roumain-halteres souleve-de-terre-sumo squat-avant-front-squat squat-barre squat-gobelet squat-smith step-up stepper-escalier tapis-de-course thruster tirage-vertical-poitrine tirage-vertical-prise-serree tirage-vertical-supination tractions-assistees-machine tractions-pronation tractions-supination turkish-get-up velo velo-elliptique`.split(' '));

export const hasImg = id => WITH_IMG.has(id);
export const imgUrl = (id, k = 0) => `img/${id}-${k}.jpg`;

/** Petite vignette (ou pastille avec l'initiale du muscle si pas d'image). */
export function thumb(ex, cls = '') {
  if (hasImg(ex.id)) return `<img class="thumb ${cls}" src="${imgUrl(ex.id)}" alt="" loading="lazy" decoding="async">`;
  return `<span class="thumb ph ${cls}">${(MUSCLES[ex.muscle] || '?').slice(0, 2)}</span>`;
}

/** Grande image animée (alterne départ / arrivée du mouvement). */
export function demo(ex) {
  if (!hasImg(ex.id)) return '';
  return `<div class="demo"><img src="${imgUrl(ex.id, 0)}" alt="Position de départ"><img class="end" src="${imgUrl(ex.id, 1)}" alt="Position d'arrivée"></div>`;
}

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
