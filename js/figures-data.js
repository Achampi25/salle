// Illustrations des 150 exercices : poses de départ / d'arrivée + matériel.
// Vue de profil (tournée vers la droite) sauf mention « face » (sym = miroir exact gauche/droite).
// Positions inspirées des consignes d'exécution usuelles (amplitude, flexions, inclinaison du buste).
import { eq, sh, add, dir, GROUND as G, S } from './figures.js';

// ---------- Outils ----------
const A = (to, bend, fs) => ({ to, bend, fs });                 // un membre
const both = (to, bend, fs) => [A([to[0] - 2, to[1]], bend, fs), A(to, bend, fs)]; // les deux bras (profil)
const UP = [0, -1], DOWN = [0, 1], FWD = [1, 0], BACK = [-1, 0];
// Presse inclinée (allongé sur le dos, jambes vers le haut) : genoux vers la poitrine.
const KNEE_UP = [-0.6, -1];
const v = (x, y) => [x, y];
const unit = a => dir(a, 1);
const mul = (p, k) => [p[0] * k, p[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = p => Math.hypot(p[0], p[1]);
const angOf = (from, to) => (Math.atan2(-(to[1] - from[1]), to[0] - from[0]) * 180) / Math.PI;
const standLegs = (x = 150) => [A([x - 2, G]), A([x + 2, G])];
const STAND = { hip: [150, 116], torso: 90 };
const neckOf = p => add(p.hip, dir(p.torso, S.torso * (p.tl || 1)));
const hipFromNeck = (neck, torso) => add(neck, dir(torso + 180, S.torso));

/** Corps gainé en ligne droite des pieds au cou (pompes, planche…). */
function lineBody(feet, neck) {
  const d = sub(neck, feet), u = mul(d, 1 / len(d));
  const hip = add(feet, mul(u, 73.5)); // jambes tendues (au-delà de la portée = droites)
  return { hip, torso: angOf(hip, neck), tl: len(sub(neck, hip)) / S.torso, legs: [A([feet[0] - 2, feet[1]]), A(feet)] };
}

/** Matériel tenu en main. kind : barre, ez, halteres, kb, disque, poulie, corde, machine, aucun. */
function held(kind, opt = {}) {
  return j => {
    const hs = j.wide ? j.hands : [j.hands[1]];
    const out = [];
    if (opt.anchor) {
      const anchors = Array.isArray(opt.anchor[0]) ? opt.anchor : [opt.anchor];
      hs.forEach((h, i) => out.push(...eq.cable(anchors[i % anchors.length], h)));
    }
    if (opt.bar && j.wide) out.push(sh.line(j.hands[0], j.hands[1], 'eq', 4));
    const off = j.x.bo || [0, 0];
    for (const h0 of hs) {
      const h = add(h0, off);
      if (kind === 'barre') out.push(...eq.barbell(h, opt.r || 11));
      else if (kind === 'ez') out.push(...eq.barbell(h, 9));
      else if (kind === 'halteres') out.push(...eq.dumbbell(h));
      else if (kind === 'kb') out.push(...eq.kettlebell(h));
      else if (kind === 'disque') out.push(sh.circle(h, 13, 'plate'), sh.circle(h, 3, 'hub'));
      else if (kind !== 'aucun') out.push(...eq.handle(h));
    }
    return out;
  };
}
const SMITH = x => [sh.line([x - 5, 8], [x - 5, G], 'st', 3), sh.line([x + 5, 8], [x + 5, G], 'st', 3)];

/** Banc posé le long du tronc (côté « dos »). side = +90 (allongé sur le dos) ou -90 (sur le ventre). */
function benchAlong(hip, torso, { side = 90, a = 22, b = 18, off = 9, legs = true } = {}) {
  const u = unit(torso), n = unit(torso + side);
  const p1 = add(add(hip, mul(u, -a)), mul(n, off));
  const p2 = add(add(hip, mul(u, S.torso + b)), mul(n, off));
  const out = [sh.line(p1, p2, 'st', 8)];
  if (legs) for (const p of [p1, p2]) if (p[1] < G - 6) out.push(sh.line([p[0], p[1] + 4], [p[0], G], 'st', 4));
  return out;
}
const seat = (x1, x2, y) => [sh.line([x1, y], [x2, y], 'st', 8), sh.line([(x1 + x2) / 2, y + 4], [(x1 + x2) / 2, G], 'st', 5)];
const post = (x, y1 = 10, y2 = G) => [sh.line([x, y1], [x, y2], 'st', 6)];
const bar = (x, y) => [sh.line([x - 40, y - 2], [x + 40, y - 2], 'st', 4), sh.circle([x, y], 4, 'eq')];

// ---------- Familles de mouvements ----------

/** Développé / écarté allongé. incline en degrés (+ incliné, - décliné). */
function bench({ incline = 0, impl = 'barre', fly = false, smith = false, skull = false }) {
  const a = 180 - incline;
  const hip = incline > 0 ? [154, 140] : incline < 0 ? [150, 126] : [150, 134];
  const u = unit(a), n = unit(a + 90);
  const neck = add(hip, mul(u, S.torso));
  const top = add(add(neck, mul(n, -57)), mul(u, skull ? 6 : -2));
  const low = skull ? add(add(neck, mul(u, 14)), mul(n, -20))
    : fly ? add(add(neck, mul(n, -4)), mul(u, -6))
      : add(add(neck, mul(n, -14)), mul(u, -9));
  const bendLow = skull ? add(mul(n, -1), mul(u, -0.4)) : add(n, mul(u, -0.6));
  const legs = [A([hip[0] + 30, G], [0.3, -1]), A([hip[0] + 34, G], [0.3, -1])];
  return {
    bg: [...benchAlong(hip, a, { a: 24, b: 20 }), ...(smith ? SMITH(top[0]) : [])],
    f: [{ hip, torso: a, arms: both(top, bendLow), legs }, { hip, torso: a, arms: both(low, bendLow), legs }],
    eq: held(impl),
  };
}

/** Développé assis à la machine (poussée horizontale). */
function chestPress({ incline = false } = {}) {
  const hip = [128, 142], torso = 98, neck = neckOf({ hip, torso });
  const out = add(neck, incline ? [52, -26] : [58, 4]);
  const inn = add(neck, incline ? [14, -2] : [16, 8]);
  const legs = [A([170, G]), A([174, G])];
  return {
    bg: [...seat(100, 150, 146), sh.line([118, 146], [112, 80], 'st', 7), ...post(232, 30)],
    f: [{ hip, torso, arms: both(inn, [-0.5, 1]), legs }, { hip, torso, arms: both(out, [-0.5, 1]), legs }],
    eq: held('machine'),
  };
}

/** Pompes. */
function pushup({ decline = false } = {}) {
  const feet = decline ? [74, 148] : [79, 186];
  const hands = [190, G];
  const p0 = lineBody(feet, [190, 128]), p1 = lineBody(feet, decline ? [196, 162] : [200, 166]);
  return {
    bg: decline ? [sh.line([40, 152], [100, 152], 'st', 8), sh.line([70, 156], [70, G], 'st', 5)] : [],
    f: [{ ...p0, arms: both(hands, [-1, -0.6]) }, { ...p1, arms: both(hands, [-1, -0.6]) }],
  };
}

/** Dips aux barres parallèles. */
function dips({ lean = false, machine = false } = {}) {
  const hands = [150, 96];
  const t0 = lean ? 80 : 88, t1 = lean ? 66 : 84;
  const n0 = [150, 38], n1 = lean ? [156, 68] : [150, 68];
  const h0 = hipFromNeck(n0, t0), h1 = hipFromNeck(n1, t1);
  if (machine) {
    const hip = [140, 142], torso = 92, neck = neckOf({ hip, torso });
    const legs = [A([182, G]), A([186, G])];
    return {
      bg: [...seat(110, 165, 146), sh.line([126, 146], [122, 84], 'st', 7)],
      f: [{ hip, torso, arms: both(add(neck, [10, 30]), [-1, -0.3]), legs }, { hip, torso, arms: both(add(neck, [6, 56]), [-1, -0.3]), legs }],
      eq: held('machine'),
    };
  }
  const legsOf = h => [A(add(h, [-30, 48])), A(add(h, [-26, 50]))];
  return {
    ground: false,
    bg: [sh.line([110, 100], [200, 100], 'st', 5), sh.line([190, 100], [190, 200], 'st', 4)],
    f: [{ hip: h0, torso: t0, arms: both(hands, [-1, -0.3]), legs: legsOf(h0) }, { hip: h1, torso: t1, arms: both(hands, [-1, -0.3]), legs: legsOf(h1) }],
  };
}

/** Tractions à la barre fixe (profil). */
function pullup({ assisted = false } = {}) {
  const hands = [150, 27];
  const legsOf = h => [A(add(h, [-22, 52]), FWD), A(add(h, [-18, 54]), FWD)];
  const h0 = [150, 137], h1 = [150, 88];
  return {
    ground: false,
    bg: [sh.line([95, 22], [205, 22], 'st', 5), sh.circle([150, 24], 4, 'eq')],
    f: [{ hip: h0, torso: 90, arms: both(hands, [0.3, 1]), legs: legsOf(h0) }, { hip: h1, torso: 90, arms: both(hands, [0.3, 1]), legs: legsOf(h1) }],
    eq: assisted ? j => [sh.line(add(j.knees[1], [-14, 6]), add(j.knees[1], [14, 6]), 'st', 7)] : null,
  };
}

/** Tirage vertical (face). */
function pulldown({ close = false } = {}) {
  const hip = [150, 138];
  const up = close ? [134, 30] : [106, 38], down = close ? [138, 102] : [106, 94];
  const legs = [A([140, 188], undefined, 0.72)];
  return {
    bg: [...seat(118, 182, 142), sh.line([112, 126], [188, 126], 'st', 6), ...eq.pulley([150, 6])],
    f: [{ hip, torso: 90, sym: true, arms: [A(up, [-0.6, 1])], legs }, { hip, torso: 90, sym: true, arms: [A(down, [-0.6, 1])], legs }],
    eq: j => [...eq.cable([150, 6], [150, j.hands[0][1]]), sh.line(add(j.hands[0], [-10, 0]), add(j.hands[1], [10, 0]), 'eq', 4)],
  };
}

/** Rowing buste penché. */
function rowBent({ torso = 22, impl = 'barre', tbar = false, onearm = false } = {}) {
  const hip = torso < 12 ? [120, 122] : [124, 120];
  const neck = neckOf({ hip, torso });
  const hang = add(neck, [3, 57]);
  const pull = add(add(hip, mul(unit(torso), 20)), [2, 12]);
  const legs = [A([146, G]), A([150, G])];
  const support = onearm ? [A([neck[0] + 28, 140], DOWN)] : null;
  const arms = h => (onearm ? [support[0], A(h, [-0.6, -1])] : both(h, [-0.6, -1]));
  return {
    bg: onearm ? [sh.line([180, 146], [250, 146], 'st', 8), sh.line([215, 150], [215, G], 'st', 5)] : [],
    f: [{ hip, torso, arms: arms(hang), legs }, { hip, torso, arms: arms(pull), legs }],
    eq: j => [...(tbar ? [sh.line([40, G - 2], j.hands[1], 'eq', 4)] : []), ...held(impl)(j)],
  };
}

/** Rowing assis (poulie ou machine). */
function rowSeated({ machine = false } = {}) {
  const hip = [118, 146];
  const legs = [A([186, 152]), A([188, 150])];
  return {
    bg: [...seat(88, 150, 150), ...(machine ? [sh.line([196, 150], [196, 70], 'st', 7)] : [sh.line([193, 140], [193, G], 'st', 6), ...eq.pulley([262, 150])])],
    f: [{ hip, torso: 74, arms: both([184, 122], [-0.5, 1]), legs }, { hip, torso: 98, arms: both([138, 122], [-1, 0.2]), legs }],
    eq: machine ? held('machine') : held('poulie', { anchor: [262, 150] }),
  };
}

/** Rowing inversé (corps sous la barre). */
function invRow() {
  const feet = [62, 184];
  const p0 = lineBody(feet, [186, 156]), p1 = lineBody(feet, [176, 122]);
  return {
    bg: [sh.circle([190, 100], 4, 'eq'), sh.line([190, 100], [190, G], 'st', 4)],
    f: [{ ...p0, arms: both([190, 100], [-0.5, 1]) }, { ...p1, arms: both([190, 100], [-0.5, 1]) }],
  };
}

/** Charnière de hanche (soulevé de terre et dérivés). */
function hinge({ kind = 'deadlift', impl = 'barre' } = {}) {
  const top = { ...STAND, legs: standLegs(), arms: both([153, 124]) };
  const P = {
    deadlift: { hip: [126, 142], torso: 32, legs: [A([158, G]), A([162, G])], arms: both([176, 176]) },
    sumo: { hip: [132, 156], torso: 45, legs: [A([170, G]), A([176, G])], arms: both([166, 176]) },
    rack: { hip: [136, 130], torso: 52, legs: [A([156, G]), A([160, G])], arms: both([170, 150]) },
    stiff: { hip: [122, 120], torso: 14, legs: [A([145, G]), A([148, G])], arms: both([172, 166]) },
    rdl: { hip: [122, 118], torso: 24, legs: [A([150, G]), A([154, G])], arms: both([172, 156]) },
  }[kind];
  const bg = kind === 'rack' ? [sh.line([150, 162], [196, 162], 'st', 5), sh.line([190, 162], [190, G], 'st', 4)] : [];
  return { bg, f: [P, top], eq: held(impl) };
}

function goodMorning() {
  const legs = standLegs();
  const hip1 = [124, 118];
  return {
    f: [{ ...STAND, legs, arms: both([143, 68], [-0.3, 1]) },
      { hip: hip1, torso: 12, legs: [A([148, G]), A([152, G])], arms: both(add(neckOf({ hip: hip1, torso: 12 }), [-6, 4]), [-0.3, 1]) }],
    eq: j => eq.barbell(add(j.neck, [-4, -6]), 11),
  };
}

/** Extensions lombaires (banc à 45°). */
function backExt() {
  const hip = [150, 120];
  const legs = [A([96, 170]), A([98, 168])];
  const chest = t => add(add(hip, dir(t, 34)), dir(t - 90, 9));
  return {
    bg: [sh.line([134, 136], [160, 118], 'st', 8), sh.line([147, 128], [147, G], 'st', 5), sh.line([90, 178], [104, 172], 'st', 6), sh.line([97, 176], [97, G], 'st', 4)],
    f: [{ hip, torso: -58, legs, arms: both(chest(-58)) }, { hip, torso: 36, legs, arms: both(chest(36)) }],
  };
}

function shrug(impl = 'barre') {
  return {
    f: [{ ...STAND, legs: standLegs(), arms: both([153, 124]) }, { ...STAND, tl: 1.12, legs: standLegs(), arms: both([153, 118]) }],
    eq: held(impl),
  };
}

/** Développé au-dessus de la tête. */
function ohp({ seated = false, impl = 'barre', push = false, machine = false } = {}) {
  if (seated || machine) {
    const hip = [140, 140], torso = 90, neck = neckOf({ hip, torso });
    const legs = [A([182, G]), A([186, G])];
    return {
      bg: [...seat(110, 168, 144), sh.line([131, 144], [131, 78], 'st', 7), ...(machine ? post(108, 20) : [])],
      f: [{ hip, torso, arms: both(add(neck, [10, 2]), [0.4, 1]), legs }, { hip, torso, arms: both(add(neck, [3, -58])), legs }],
      eq: held(machine ? 'machine' : impl),
    };
  }
  const p0 = push ? { hip: [146, 128], torso: 88, legs: [A([150, G]), A([154, G])] } : { ...STAND, legs: standLegs() };
  return {
    f: [{ ...p0, arms: both(add(neckOf(p0), [10, 2]), [0.4, 1]) }, { ...STAND, legs: standLegs(), arms: both([153, 12]) }],
    eq: held(impl),
  };
}

function landmine() {
  return {
    f: [{ ...STAND, torso: 82, legs: [A([140, G]), A([166, G])], arms: both([170, 72], [0.2, 1]) },
      { ...STAND, torso: 76, legs: [A([140, G]), A([166, G])], arms: both([206, 32]) }],
    eq: j => [sh.line([28, G - 2], j.hands[1], 'eq', 4), ...eq.barbell(add(j.hands[1], [6, -4]), 7)],
  };
}

/** Élévations latérales (face). */
function lateral({ impl = 'halteres', seated = false } = {}) {
  const hip = seated ? [150, 138] : [150, 116];
  const dy = hip[1] - 116;
  const legs = seated ? [A([140, 188], undefined, 0.72)] : [A([139, 191])];
  const opt = impl === 'poulie' ? { anchor: [[262, 184], [38, 184]] } : {};
  return {
    bg: seated ? [...seat(118, 182, 142)] : impl === 'poulie' ? [...eq.pulley([262, 184]), ...eq.pulley([38, 184])] : [],
    f: [{ hip, torso: 90, sym: true, arms: [A([126, 126 + dy], [-1, 0.2])], legs }, { hip, torso: 90, sym: true, arms: [A([80, 78 + dy], [-1, -0.2])], legs }],
    eq: impl === 'machine' ? j => j.elbows.map(e => sh.circle(e, 7, 'plate')) : held(impl, opt),
  };
}

function frontRaise(impl = 'halteres') {
  return { f: [{ ...STAND, legs: standLegs(), arms: both([154, 122]) }, { ...STAND, legs: standLegs(), arms: both([210, 66]) }], eq: held(impl) };
}

/** Oiseau / reverse pec deck (face). */
function rearDelt({ machine = false } = {}) {
  if (machine) {
    const hip = [150, 138], legs = [A([140, 188], undefined, 0.72)];
    return {
      bg: [...seat(118, 182, 142), sh.line([150, 142], [150, 80], 'st', 7)],
      f: [{ hip, torso: 90, sym: true, arms: [A([146, 84], [-1, 0], 0.45)], legs }, { hip, torso: 90, sym: true, arms: [A([84, 82], [-1, -0.2])], legs }],
      eq: held('machine'),
    };
  }
  const hip = [150, 116], legs = [A([139, 190])];
  return {
    f: [{ hip, torso: 90, tl: 0.55, sym: true, arms: [A([134, 146], [-1, 0])], legs }, { hip, torso: 90, tl: 0.55, sym: true, arms: [A([84, 106], [-1, -0.3])], legs }],
    eq: held('halteres'),
  };
}

function facePull() {
  const p = { hip: [140, 116], torso: 86, legs: [A([128, G]), A([158, G])] };
  return {
    bg: [...post(268, 20), ...eq.pulley([268, 56])],
    f: [{ ...p, arms: both([200, 58]) }, { ...p, arms: both([156, 54], [-0.5, -1]) }],
    eq: held('corde', { anchor: [268, 56] }),
  };
}

function uprightRow() {
  return { f: [{ ...STAND, legs: standLegs(), arms: both([154, 122]) }, { ...STAND, legs: standLegs(), arms: both([160, 80], [-0.4, -1]) }], eq: held('barre') };
}

/** Curl debout. */
function curl({ impl = 'halteres', cable = false, alt = false } = {}) {
  const down = [153, 123], upp = [170, 74];
  const opt = cable ? { anchor: [206, 184] } : {};
  return {
    bg: cable ? eq.pulley([206, 184]) : [],
    f: [{ ...STAND, legs: standLegs(), arms: both(down, [-0.2, 1]) },
      { ...STAND, legs: standLegs(), arms: alt ? [A([151, 123], [-0.2, 1]), A(upp, [-0.2, 1])] : both(upp, [-0.2, 1]) }],
    eq: held(impl === 'barre' && !cable ? 'ez' : impl, opt),
  };
}

function curlIncline() {
  const hip = [150, 140], torso = 116, neck = neckOf({ hip, torso });
  const legs = [A([190, G]), A([194, G])];
  return {
    bg: benchAlong(hip, torso, { side: 90, a: 14, b: 14 }),
    f: [{ hip, torso, legs, arms: both(add(neck, [-4, 58]), [-0.2, 1]) }, { hip, torso, legs, arms: both(add(neck, [14, 20]), [-0.2, 1]) }],
    eq: held('halteres'),
  };
}

function preacher({ machine = false } = {}) {
  const hip = [122, 146], torso = 84, neck = neckOf({ hip, torso });
  const legs = [A([166, G]), A([170, G])];
  return {
    bg: [...seat(96, 146, 150), sh.line([140, 102], [176, 134], 'st', 7), sh.line([170, 134], [170, G], 'st', 5)],
    f: [{ hip, torso, legs, arms: both(add(neck, [50, 40]), [1, 0.6]) }, { hip, torso, legs, arms: both(add(neck, [22, -10]), [1, 0.6]) }],
    eq: held(machine ? 'machine' : 'ez'),
  };
}

function concentration() {
  const hip = [126, 150], torso = 56, neck = neckOf({ hip, torso });
  const legs = [A([172, G]), A([182, G])];
  return {
    bg: seat(96, 150, 154),
    f: [{ hip, torso, legs, arms: [A(add(neck, [6, 30])), A(add(neck, [8, 58]), [0.2, 1])] }, { hip, torso, legs, arms: [A(add(neck, [6, 30])), A(add(neck, [16, 8]), [0.2, 1])] }],
    eq: held('halteres'),
  };
}

function curlHigh() {
  const legs = [A([139, 191])];
  return {
    bg: [...eq.pulley([30, 66]), ...eq.pulley([270, 66])],
    f: [{ ...STAND, sym: true, arms: [A([84, 70], [0, 1])], legs }, { ...STAND, sym: true, arms: [A([124, 46], [0, 1])], legs }],
    eq: held('poulie', { anchor: [[30, 66], [270, 66]] }),
  };
}

function spider() {
  const hip = [112, 150], torso = 46, neck = neckOf({ hip, torso });
  const legs = [A([96, G]), A([100, G])];
  return {
    bg: benchAlong(hip, torso, { side: -90, a: 10, b: 0, off: 8 }),
    f: [{ hip, torso, legs, arms: both(add(neck, [3, 58]), [0.2, 1]) }, { hip, torso, legs, arms: both(add(neck, [18, 10]), [0.2, 1]) }],
    eq: held('ez'),
  };
}

function overheadExt() {
  return { f: [{ ...STAND, legs: standLegs(), arms: both([140, 50], [0.2, -1]) }, { ...STAND, legs: standLegs(), arms: both([152, 6]) }], eq: held('halteres') };
}

function pushdown({ rope = false, machine = false } = {}) {
  if (machine) {
    const hip = [130, 142], torso = 92, neck = neckOf({ hip, torso });
    const legs = [A([174, G]), A([178, G])];
    return {
      bg: [...seat(100, 152, 146), sh.line([150, 118], [178, 118], 'st', 7)],
      f: [{ hip, torso, legs, arms: both(add(neck, [30, 4]), [0.3, 1]) }, { hip, torso, legs, arms: both(add(neck, [28, 52]), [0.3, 1]) }],
      eq: held('machine'),
    };
  }
  const p = { hip: [146, 116], torso: 84, legs: [A([140, G]), A([152, G])] };
  return {
    bg: [...post(196, 4), ...eq.pulley([192, 10])],
    f: [{ ...p, arms: both([172, 92], [-0.3, 1]) }, { ...p, arms: both([166, 122], [-0.3, 1]) }],
    eq: held(rope ? 'corde' : 'machine', { anchor: [192, 10] }),
  };
}

function cableOverhead() {
  const p = { hip: [140, 124], torso: 66, legs: [A([112, G]), A([172, G])] };
  return {
    bg: [...post(40, 20), ...eq.pulley([40, 40])],
    f: [{ ...p, arms: both([150, 52], [0.6, -1]) }, { ...p, arms: both([210, 40]) }],
    eq: held('corde', { anchor: [40, 40] }),
  };
}

function kickback({ cable = false } = {}) {
  const hip = [124, 124], torso = 24, neck = neckOf({ hip, torso });
  const legs = [A([136, G]), A([158, G])];
  const support = A([neck[0] + 30, 146], DOWN);
  return {
    bg: cable ? [...eq.pulley([272, 180])] : [sh.line([170, 150], [240, 150], 'st', 8), sh.line([205, 154], [205, G], 'st', 5)],
    f: [{ hip, torso, legs, arms: [cable ? A(add(neck, [20, 40])) : support, A(add(neck, [-6, 46]), [-1, -0.4])] },
      { hip, torso, legs, arms: [cable ? A(add(neck, [20, 40])) : support, A(add(neck, [-58, 8]))] }],
    eq: held(cable ? 'poulie' : 'halteres', cable ? { anchor: [272, 180] } : {}),
  };
}

/** Squat et dérivés. */
function squat({ kind = 'barre' } = {}) {
  const p0 = { ...STAND, legs: standLegs() };
  let p1 = { hip: [126, 150], torso: 60, legs: [A([152, G]), A([156, G])] };
  let bg = [], eqf;
  const back = p => both(add(neckOf(p), [-8, 4]), [-0.3, 1]);
  const front = p => both(add(neckOf(p), [12, 2]), FWD);
  if (kind === 'avant') p1 = { ...p1, torso: 72, hip: [130, 152] };
  if (kind === 'gobelet') p1 = { ...p1, torso: 70, hip: [130, 154] };
  if (kind === 'hack' || kind === 'pendulum') {
    const q0 = { hip: [140, 118], torso: 104, legs: [A([164, G]), A([168, G])] };
    const q1 = { hip: [118, 150], torso: 76, legs: [A([164, G]), A([168, G])] };
    bg = kind === 'pendulum' ? [sh.circle([80, 30], 5, 'st')] : [sh.line([150, 186], [70, 40], 'rail', 3)];
    return {
      bg,
      f: [{ ...q0, arms: both(add(neckOf(q0), [6, 8]), [0.3, 1]) }, { ...q1, arms: both(add(neckOf(q1), [6, 8]), [0.3, 1]) }],
      eq: j => [sh.line(add(j.hip, dir(j.hip[0] < 130 ? 256 : 284, 6)), add(j.neck, [-7, -4]), 'eq', 7),
        ...(kind === 'pendulum' ? [sh.line([80, 30], add(j.neck, [-8, -2]), 'eq', 4)] : [])],
    };
  }
  if (kind === 'belt') {
    return {
      bg: [sh.line([120, 172], [190, 172], 'st', 8), sh.line([128, 176], [128, G], 'st', 5), sh.line([182, 176], [182, G], 'st', 5), ...post(198, 70)],
      f: [{ hip: [150, 100], torso: 92, legs: [A([142, 168]), A([158, 168])], arms: both([194, 82]) },
        { hip: [128, 136], torso: 74, legs: [A([142, 168]), A([158, 168])], arms: both([194, 104]) }],
      eq: j => [sh.line(j.hip, [150, 180], 'cable', 2), sh.rect(136, 178, 28, 10, 'plate')],
    };
  }
  if (kind === 'sissy') {
    return {
      bg: post(104, 60),
      f: [{ ...STAND, legs: standLegs(), arms: [A([108, 100]), A([108, 100])] },
        { hip: [168, 148], torso: 112, legs: [A([150, G], FWD), A([154, G], FWD)], arms: [A([108, 112]), A([108, 112])] }],
    };
  }
  if (kind === 'avant') eqf = j => eq.barbell(j.hands[1], 11);
  else if (kind === 'gobelet') eqf = j => eq.dumbbell(j.hands[1]);
  else eqf = j => eq.barbell(add(j.neck, [-7, 5]), 11);
  if (kind === 'smith') bg = SMITH(144);
  const arms = kind === 'avant' ? front : kind === 'gobelet' ? (p => both(add(neckOf(p), [14, 18]), [0.2, 1])) : back;
  return { bg, f: [{ ...p0, arms: arms(p0) }, { ...p1, arms: arms(p1) }], eq: eqf };
}

function legPress() {
  return {
    bg: [sh.line([60, 176], [112, 128], 'st', 9), sh.line([92, 150], [96, G], 'st', 5), sh.line([150, 160], [250, 60], 'rail', 3)],
    f: [
      { hip: [118, 152], torso: 140, arms: both([118, 160]), legs: [A([168, 100], KNEE_UP), A([171, 103], KNEE_UP)] },
      { hip: [118, 152], torso: 140, arms: both([118, 160]), legs: [A([152, 122], KNEE_UP), A([156, 124], KNEE_UP)] },
    ],
    eq: j => [sh.line(add(j.feet[1], [-15, -15]), add(j.feet[1], [15, 15]), 'eq', 6)],
  };
}

function legExt() {
  const hip = [126, 140], torso = 96;
  return {
    bg: [...seat(104, 162, 146), sh.line([112, 146], [106, 90], 'st', 7)],
    f: [{ hip, torso, arms: both([146, 140]), legs: [A([166, 180], [1, -0.4]), A([168, 182], [1, -0.4])] },
      { hip, torso, arms: both([146, 140]), legs: [A([196, 126]), A([198, 128])] }],
    eq: j => [sh.circle(add(j.feet[1], [2, -4]), 6, 'plate')],
  };
}

/** Fentes. */
function lunge({ impl = 'halteres', bulgarian = false, step = false } = {}) {
  const hold = impl === 'barre' ? (p => both(add(neckOf(p), [-8, 4]), [-0.3, 1])) : (p => both(add(neckOf(p), [3, 57])));
  const eqf = impl === 'barre' ? (j => eq.barbell(add(j.neck, [-7, 5]), 11)) : held(impl);
  if (step) {
    const p0 = { hip: [150, 124], torso: 86, legs: [A([132, G]), A([188, 160])] };
    const p1 = { hip: [184, 90], torso: 88, legs: [A([180, 160]), A([188, 160])] };
    return { bg: [sh.rect(166, 160, 64, 28, 'stf')], f: [{ ...p0, arms: hold(p0) }, { ...p1, arms: hold(p1) }], eq: eqf };
  }
  if (bulgarian) {
    const p0 = { hip: [150, 118], torso: 88, legs: [A([96, 148], DOWN), A([174, G])] };
    const p1 = { hip: [146, 146], torso: 84, legs: [A([96, 148], DOWN), A([176, G])] };
    return { bg: [sh.line([70, 152], [112, 152], 'st', 8), sh.line([90, 156], [90, G], 'st', 5)], f: [{ ...p0, arms: hold(p0) }, { ...p1, arms: hold(p1) }], eq: eqf };
  }
  const p0 = { ...STAND, legs: standLegs() };
  const p1 = { hip: [148, 142], torso: 88, legs: [A([104, G], DOWN), A([190, G])] };
  return { f: [{ ...p0, arms: hold(p0) }, { ...p1, arms: hold(p1) }], eq: eqf };
}

function legCurl({ kind = 'allonge' } = {}) {
  if (kind === 'allonge') {
    const hip = [148, 132];
    return {
      bg: [sh.line([60, 141], [200, 141], 'st', 8), sh.line([74, 145], [74, G], 'st', 5), sh.line([186, 145], [186, G], 'st', 5)],
      f: [{ hip, torso: 180, arms: both([86, 156], DOWN), legs: [A([224, 134]), A([226, 132])] },
        { hip, torso: 180, arms: both([86, 156], DOWN), legs: [A([178, 80], [1, 0.4]), A([180, 82], [1, 0.4])] }],
      eq: j => [sh.circle(add(j.feet[1], [0, -6]), 6, 'plate')],
    };
  }
  if (kind === 'assis') {
    const hip = [126, 140], torso = 100;
    return {
      bg: [...seat(104, 162, 146), sh.line([110, 146], [100, 90], 'st', 7)],
      f: [{ hip, torso, arms: both([146, 140]), legs: [A([197, 132]), A([199, 134])] },
        { hip, torso, arms: both([146, 140]), legs: [A([158, 178], [1, -0.4]), A([160, 180], [1, -0.4])] }],
      eq: j => [sh.circle(add(j.feet[1], [2, 6]), 6, 'plate')],
    };
  }
  const p = { hip: [150, 116], torso: 82 };
  return {
    bg: [sh.line([168, 100], [168, G], 'st', 6)],
    f: [{ ...p, arms: both([170, 104]), legs: [A([150, G]), A([152, G])] }, { ...p, arms: both([170, 104]), legs: [A([150, G]), A([118, 140], [0.4, 1])] }],
    eq: j => [sh.circle(add(j.feet[1], [-5, 0]), 6, 'plate')],
  };
}

/** Nordic / glute-ham : pivot autour des genoux. */
function nordic({ ghd = false } = {}) {
  const knee = ghd ? [140, 132] : [150, 178], foot = ghd ? [104, 136] : [112, 180];
  const hipAt = a => add(knee, dir(a, S.thigh));
  const t0 = ghd ? 2 : 90, t1 = ghd ? 88 : 28;
  const h0 = hipAt(t0), h1 = hipAt(t1);
  const arms = (h, t) => both(add(add(h, dir(t, 34)), dir(t - 90, -8)));
  return {
    bg: ghd
      ? [sh.line([112, 142], [156, 142], 'st', 8), sh.line([134, 146], [134, G], 'st', 5), sh.line([98, 130], [110, 130], 'st', 6), sh.line([104, 132], [104, G], 'st', 4)]
      : [sh.line([100, 186], [160, 186], 'st', 6), sh.line([104, 176], [116, 176], 'st', 6)],
    f: [{ hip: h0, torso: t0, legs: [A(foot, DOWN), A(foot, DOWN)], arms: arms(h0, t0) },
      { hip: h1, torso: t1, legs: [A(foot, DOWN), A(foot, DOWN)], arms: ghd ? arms(h1, t1) : both(add(h1, [70, 6])) }],
  };
}

function hipThrust({ kind = 'barre' } = {}) {
  if (kind === 'pont') {
    const n = [96, 180];
    const h0 = [146, 182], h1 = [146, 150];
    return {
      f: [{ hip: h0, torso: angOf(h0, n), tl: len(sub(n, h0)) / S.torso, head: [80, 180], arms: both([154, 186], UP), legs: [A([182, G]), A([186, G])] },
        { hip: h1, torso: angOf(h1, n), tl: len(sub(n, h1)) / S.torso, head: [80, 180], arms: both([154, 186], UP), legs: [A([182, G]), A([186, G])] }],
    };
  }
  const n = [112, 140];
  const h0 = [150, 176], h1 = [160, 138];
  const pose = h => ({ hip: h, torso: angOf(h, n), tl: len(sub(n, h)) / S.torso, head: [96, 134], arms: both(add(h, [-6, -8])), legs: [A([196, G]), A([200, G])] });
  return {
    bg: [sh.line([66, 146], [116, 146], 'st', 8), sh.line([90, 150], [90, G], 'st', 5)],
    f: [pose(h0), pose(h1)],
    eq: kind === 'machine' ? j => [sh.line(add(j.hip, [-12, -8]), add(j.hip, [12, -8]), 'eq', 7)] : j => eq.barbell(add(j.hip, [0, -12]), 11),
  };
}

/** Abduction / adduction machine (face, assis). */
function abduct({ out = true } = {}) {
  const hip = [150, 138];
  const closed = [A([142, 186], [-1, 0], 0.75)], open = [A([106, 182], [-1, 0], 0.75)];
  return {
    bg: [...seat(118, 182, 142), sh.line([150, 142], [150, 82], 'st', 7)],
    f: [{ hip, torso: 90, sym: true, arms: [A([128, 140])], legs: out ? closed : open }, { hip, torso: 90, sym: true, arms: [A([128, 140])], legs: out ? open : closed }],
    eq: j => j.knees.map(k => sh.circle(k, 6, 'plate')),
  };
}

function gluteKick({ cable = true } = {}) {
  const p = { hip: [150, 116], torso: 76 };
  return {
    bg: cable ? [...post(212, 60), ...eq.pulley([212, 182])] : [sh.line([192, 96], [192, G], 'st', 6)],
    f: [{ ...p, arms: both([206, 96]), legs: [A([148, G]), A([156, G])] }, { ...p, arms: both([206, 96]), legs: [A([148, G]), A([90, 154])] }],
    eq: cable ? j => eq.cable([212, 182], j.feet[1]) : j => [sh.circle(add(j.feet[1], [0, -6]), 6, 'plate')],
  };
}

function abductCable() {
  const hip = [150, 116];
  const p = to => ({ hip, torso: 90, wide: true, arms: [A([96, 104], [0, 1]), A([166, 112], [1, 0])], legs: [A([142, G]), A(to)] });
  return {
    bg: [...post(96, 40), ...eq.pulley([96, 182])],
    f: [p([158, G]), p([200, 172])],
    eq: j => eq.cable([96, 182], j.feet[1]),
  };
}

/** Mollets. */
function calf({ kind = 'debout' } = {}) {
  if (kind === 'assis') {
    const hip = [126, 142], torso = 90;
    return {
      bg: [...seat(100, 150, 146), sh.rect(150, 182, 30, 6, 'stf')],
      f: [{ hip, torso, arms: both([160, 144]), legs: [A([166, 182], [1, -0.6]), A([168, 182], [1, -0.6])] },
        { hip, torso, arms: both([160, 136]), legs: [A([166, 174], [1, -0.6]), A([168, 174], [1, -0.6])] }],
      eq: j => [sh.line(add(j.knees[1], [-10, -6]), add(j.knees[1], [12, -6]), 'eq', 6)],
    };
  }
  if (kind === 'presse') {
    const lp = legPress();
    lp.f = [
      { hip: [118, 152], torso: 140, arms: both([118, 160]), legs: [A([162, 106], KNEE_UP), A([165, 108], KNEE_UP)] },
      { hip: [118, 152], torso: 140, arms: both([118, 160]), legs: [A([167, 101], KNEE_UP), A([170, 104], KNEE_UP)] },
    ];
    return lp;
  }
  const p0 = { ...STAND, hip: [150, 110], legs: [A([148, 182]), A([152, 182])] };
  const p1 = { ...STAND, hip: [150, 101], legs: [A([148, 173]), A([152, 173])] };
  const hold = kind === 'haltere' ? both([153, 117]) : both(add(neckOf(p0), [-8, 4]), [-0.3, 1]);
  const hold1 = kind === 'haltere' ? both([153, 108]) : both(add(neckOf(p1), [-8, 4]), [-0.3, 1]);
  return {
    bg: [sh.rect(132, 182, 40, 6, 'stf'), ...(kind === 'smith' ? SMITH(144) : [])],
    f: [{ ...p0, arms: hold }, { ...p1, arms: hold1 }],
    eq: kind === 'haltere' ? held('halteres') : kind === 'smith' ? (j => eq.barbell(add(j.neck, [-7, 5]), 11)) : (j => [sh.line(add(j.neck, [-14, -2]), add(j.neck, [12, -2]), 'eq', 7)]),
  };
}

/** Abdos. */
function crunch({ kind = 'sol' } = {}) {
  if (kind === 'poulie') {
    const knee = [150, 180], foot = [110, 182];
    const h = add(knee, dir(90, S.thigh));
    return {
      bg: [...post(208, 4), ...eq.pulley([204, 10])],
      f: [{ hip: h, torso: 82, legs: both(foot, [1, 0.4]), arms: both(add(neckOf({ hip: h, torso: 82 }), [6, 2]), [0.6, 0.2]) },
        { hip: h, torso: 22, legs: both(foot, [1, 0.4]), arms: both(add(neckOf({ hip: h, torso: 22 }), [4, -6]), [0.6, 0.2]) }],
      eq: j => eq.cable([204, 10], j.hands[1]),
    };
  }
  if (kind === 'machine') {
    const hip = [130, 142];
    const legs = [A([176, G]), A([180, G])];
    return {
      bg: [...seat(100, 152, 146)],
      f: [{ hip, torso: 96, legs, arms: both(add(neckOf({ hip, torso: 96 }), [10, 0]), [0.6, 1]) },
        { hip, torso: 54, legs, arms: both(add(neckOf({ hip, torso: 54 }), [10, 2]), [0.6, 1]) }],
      eq: held('machine'),
    };
  }
  if (kind === 'situp') {
    const hip = [160, 128];
    const legs = [A([210, 140], [0.3, -1]), A([212, 142], [0.3, -1])];
    const hands = t => both(add(neckOf({ hip, torso: t }), dir(t - 90, -10)));
    return {
      bg: benchAlong(hip, 198, { a: 44, b: 6 }),
      f: [{ hip, torso: 198, legs, arms: hands(198) }, { hip, torso: 84, legs, arms: hands(84) }],
    };
  }
  const hip = [150, 180];
  const legs = [A([184, G], [0.3, -1]), A([188, G], [0.3, -1])];
  const hands = t => both(add(neckOf({ hip, torso: t }), dir(t, 14)), UP);
  return { f: [{ hip, torso: 178, legs, arms: hands(178) }, { hip, torso: 148, legs, arms: hands(148) }] };
}

function hangRaise({ kind = 'jambes' } = {}) {
  const hip = [150, 128], neck = neckOf({ hip, torso: 90 });
  const chair = kind === 'chaise';
  const arms = chair ? both(add(neck, [26, 2]), [0.3, 1]) : both([150, 18], [0.3, 1]);
  const up = kind === 'genoux' || chair ? [A([180, 132], [1, -1]), A([182, 134], [1, -1])] : [A([222, 126]), A([223, 128])];
  return {
    ground: false,
    bg: chair ? [sh.line([140, 60], [140, 150], 'st', 7), sh.line([152, 104], [190, 104], 'st', 6), sh.line([180, 104], [180, 200], 'st', 4)] : [sh.line([95, 14], [205, 14], 'st', 5), sh.circle([150, 16], 4, 'eq')],
    f: [{ hip, torso: 90, arms, legs: [A([150, 198]), A([152, 198])] }, { hip, torso: 90, arms, legs: up }],
  };
}

function plank({ side = false } = {}) {
  const p = lineBody([70, 184], [190, 160]);
  const arms0 = [A([216, 184], DOWN), A([216, 184], DOWN)];
  if (!side) return { f: [{ ...p, arms: arms0 }, { ...p, arms: arms0 }] };
  return { f: [{ ...p, arms: [A([216, 184], DOWN), A(add(p.hip, [10, -8]))] }, { ...p, arms: [A([216, 184], DOWN), A([196, 102])] }] };
}

function russianTwist() {
  const hip = [150, 176], torso = 124;
  const legs = [A([206, 150], [0.4, -1]), A([208, 152], [0.4, -1])];
  return { f: [{ hip, torso, legs, arms: both([140, 150], [0, 1]) }, { hip, torso, legs, arms: both([170, 146], [0, 1]) }], eq: held('disque') };
}

function abWheel() {
  const knee = [140, 180], foot = [102, 182];
  const h0 = [140, 150], h1 = [168, 166];
  return {
    f: [{ hip: h0, torso: 40, legs: both(foot, [1, 0.4]), arms: both([184, 176], DOWN) }, { hip: h1, torso: 8, legs: both(foot, [1, 0.4]), arms: both([270, 176]) }],
    eq: j => [sh.circle(j.hands[1], 8, 'plate'), sh.circle(j.hands[1], 3, 'hub')],
    knee,
  };
}

function pallof() {
  const p = { hip: [150, 122], torso: 90, legs: [A([140, G]), A([162, G])] };
  return {
    bg: [...post(40, 60), ...eq.pulley([40, 92])],
    f: [{ ...p, arms: both([164, 92], [-0.3, 1]) }, { ...p, arms: both([212, 86]) }],
    eq: held('machine', { anchor: [40, 92] }),
  };
}

function woodchop() {
  const p = { hip: [150, 118], torso: 90, wide: true, legs: [A([132, G]), A([168, G])] };
  return {
    bg: [...post(270, 10), ...eq.pulley([266, 22])],
    f: [{ ...p, arms: [A([196, 46]), A([200, 44])] }, { ...p, arms: [A([126, 118]), A([130, 116])] }],
    eq: j => [...eq.cable([266, 22], j.hands[1]), ...eq.handle(j.hands[1])],
  };
}

function dragonFlag() {
  const neck = [110, 176];
  const pose = a => {
    const hip = add(neck, dir(a, S.torso));
    return { hip, torso: a + 180, head: [94, 176], legs: [A(add(hip, dir(a, 74))), A(add(hip, dir(a, 74)))], arms: both([74, 178], UP) };
  };
  return { bg: [sh.line([60, 184], [200, 184], 'st', 7), sh.line([80, 186], [80, G], 'st', 4), sh.line([180, 186], [180, G], 'st', 4)], f: [pose(48), pose(14)] };
}

function mountain() {
  const p = lineBody([79, 186], [190, 128]);
  return {
    f: [{ ...p, arms: both([190, G]), legs: [A([168, 176], [1, -1]), A([79, 186])] }, { ...p, arms: both([190, G]), legs: [A([79, 186]), A([168, 176], [1, -1])] }],
  };
}

/** Avant-bras. */
function wristCurl() {
  const hip = [110, 150], torso = 66, neck = neckOf({ hip, torso });
  const legs = [A([160, G]), A([164, G])];
  const p = bo => ({ hip, torso, legs, arms: both([176, 140], [0.2, 1]), x: { bo } });
  return { bg: [sh.line([140, 148], [178, 148], 'st', 8), sh.line([160, 152], [160, G], 'st', 5)], f: [p([10, 8]), p([10, -8])], eq: held('barre', { r: 8 }) };
}

function farmer() {
  const hip = [150, 120];
  return {
    f: [{ hip, torso: 88, arms: both([152, 126]), legs: [A([124, G]), A([178, G])] }, { hip, torso: 88, arms: both([152, 126]), legs: [A([178, G]), A([124, G])] }],
    eq: held('halteres'),
  };
}

function deadHang() {
  const hip = [150, 128];
  return {
    ground: false,
    bg: [sh.line([95, 14], [205, 14], 'st', 5), sh.circle([150, 16], 4, 'eq')],
    f: [{ hip, torso: 90, arms: both([150, 18]), legs: [A([144, 198]), A([148, 198])] }, { hip: [151, 128], torso: 91, arms: both([150, 18]), legs: [A([152, 198]), A([156, 198])] }],
  };
}

/** Corps entier. */
function kbSwing() {
  return {
    f: [{ hip: [124, 130], torso: 30, legs: [A([148, G]), A([156, G])], arms: both([156, 162]) }, { ...STAND, legs: standLegs(), arms: both([206, 70]) }],
    eq: held('kb'),
  };
}

function clean({ snatch = false, thruster = false } = {}) {
  const low = { hip: [126, 142], torso: 32, legs: [A([158, G]), A([162, G])], arms: both([176, 176]) };
  const rack = p => both(add(neckOf(p), [12, 2]), FWD);
  if (thruster) {
    const sq = { hip: [130, 152], torso: 72, legs: [A([152, G]), A([156, G])] };
    return { f: [{ ...sq, arms: rack(sq) }, { ...STAND, legs: standLegs(), arms: both([153, 12]) }], eq: held('barre') };
  }
  const top = snatch ? { ...STAND, legs: standLegs(), arms: both([150, 12]) } : { ...STAND, legs: standLegs(), arms: rack(STAND) };
  return { f: [low, top], eq: held('barre') };
}

function burpee() {
  const p = lineBody([96, 186], [196, 132]);
  return {
    f: [{ ...p, arms: both([196, G]) }, { hip: [150, 108], torso: 90, legs: [A([146, 180]), A([150, 180])], arms: both([142, 0]) }],
  };
}

function turkish() {
  return {
    f: [{ hip: [150, 180], torso: 178, legs: [A([200, 184]), A([184, G], [0.3, -1])], arms: [A([66, 184], UP), A([98, 120])] },
      { hip: [148, 140], torso: 90, legs: [A([110, 184], DOWN), A([186, G])], arms: [A([150, 150]), A([150, 28])] }],
    eq: j => eq.kettlebell(add(j.hands[1], [0, -14])),
  };
}

/** Cardio. */
function run() {
  const hip = [150, 114], torso = 82;
  return {
    bg: [sh.line([60, 186], [240, 186], 'st', 6), sh.line([232, 186], [252, 84], 'st', 5)],
    f: [{ hip, torso, arms: [A([178, 96], [-1, 0.6]), A([130, 116], [-0.2, 1])], legs: [A([112, 160], [0.3, 1]), A([180, 182])] },
      { hip, torso, arms: [A([130, 116], [-0.2, 1]), A([178, 96], [-1, 0.6])], legs: [A([180, 182]), A([112, 160], [0.3, 1])] }],
  };
}

function bike({ air = false, elliptical = false } = {}) {
  if (elliptical) {
    const p = (f0, f1, h0, h1) => ({ hip: [150, 98], torso: 86, legs: [A(f0), A(f1)], arms: [A(h0), A(h1)] });
    return {
      bg: [sh.line([90, 184], [230, 184], 'st', 6), sh.line([210, 184], [200, 60], 'st', 5)],
      f: [p([122, 166], [176, 160], [196, 70], [184, 86]), p([176, 160], [122, 166], [184, 86], [196, 70])],
    };
  }
  const hip = [132, 116], torso = 66;
  const hands = air ? [[184, 94], [206, 84]] : [[202, 94], [202, 94]];
  const p = (f0, f1, h0, h1) => ({ hip, torso, legs: [A(f0), A(f1)], arms: [A(h0), A(h1)] });
  return {
    bg: [sh.line([118, 122], [146, 122], 'st', 6), sh.line([132, 124], [160, 170], 'st', 5), sh.line([160, 170], [208, 100], 'st', 5),
      sh.line([110, 186], [230, 186], 'st', 6), sh.circle([164, 168], 4, 'st'), ...(air ? [sh.circle([236, 150], 32, 'rail')] : [])],
    f: [p([150, 184], [180, 152], hands[0], hands[1]), p([180, 152], [150, 184], hands[1], hands[0])],
  };
}

function rower() {
  const legs = [A([176, 172], [1, -0.6]), A([178, 172], [1, -0.6])];
  return {
    bg: [sh.line([40, 178], [250, 178], 'st', 5), sh.circle([246, 162], 14, 'rail'), sh.line([176, 166], [176, 178], 'st', 5)],
    f: [{ hip: [122, 170], torso: 66, legs, arms: both([186, 150]) }, { hip: [104, 170], torso: 112, legs: [A([176, 172]), A([178, 172])], arms: both([120, 136], [-1, 0.3]) }],
    eq: j => [...eq.cable([246, 162], j.hands[1]), ...eq.handle(j.hands[1])],
  };
}

function stepper() {
  const p = (f0, f1) => ({ hip: [150, 100], torso: 84, legs: [A(f0), A(f1)], arms: both([190, 96]) });
  return {
    bg: [sh.path([[110, 188], [110, 172], [150, 172], [150, 156], [190, 156], [190, 140], [230, 140]], 'st', 5), sh.line([194, 96], [214, 188], 'st', 5)],
    f: [p([136, 172], [176, 156]), p([176, 156], [136, 172])],
  };
}

function skierg() {
  return {
    bg: [...post(262, 30), sh.circle([262, 40], 5, 'st')],
    f: [{ hip: [150, 114], torso: 92, legs: standLegs(), arms: both([194, 26]) },
      { hip: [130, 132], torso: 38, legs: [A([150, G]), A([154, G])], arms: both([172, 156]) }],
    eq: held('poulie', { anchor: [262, 40] }),
  };
}

function jumpRope() {
  const rope = up => j => [sh.path(up
    ? [j.hands[0], [112, 60], [130, 18], [170, 18], [188, 60], j.hands[1]]
    : [j.hands[0], [112, 196], [130, 199], [170, 199], [188, 196], j.hands[1]], 'cable', 2)];
  return {
    f: [{ hip: [150, 116], torso: 90, sym: true, arms: [A([124, 120])], legs: [A([139, 191])] },
      { hip: [150, 108], torso: 90, sym: true, arms: [A([124, 112])], legs: [A([140, 182])] }],
    eq: j => rope(j.hip[1] > 112)(j),
  };
}

// ---------- Correspondance exercice → dessin ----------
export const FIGS = {
  // Pectoraux
  'developpe-couche-barre': bench({}),
  'developpe-couche-halteres': bench({ impl: 'halteres' }),
  'developpe-incline-barre': bench({ incline: 32 }),
  'developpe-incline-halteres': bench({ incline: 32, impl: 'halteres' }),
  'developpe-decline-barre': bench({ incline: -16 }),
  'developpe-decline-halteres': bench({ incline: -16, impl: 'halteres' }),
  'developpe-couche-smith': bench({ smith: true }),
  'developpe-incline-smith': bench({ incline: 32, smith: true }),
  'developpe-assis-machine-chest-press': chestPress(),
  'developpe-incline-machine': chestPress({ incline: true }),
  'ecarte-couche-halteres': bench({ impl: 'halteres', fly: true }),
  'ecarte-incline-halteres': bench({ incline: 32, impl: 'halteres', fly: true }),
  'pec-deck-butterfly': flyFront({ seated: true }),
  'ecarte-poulie-vis-a-vis': flyFront({ high: true }),
  'ecarte-poulie-basse': flyFront({ low: true }),
  'pompes': pushup(),
  'pompes-declinees': pushup({ decline: true }),
  'dips-pectoraux': dips({ lean: true }),
  'pull-over-haltere': pullover(),
  // Dos
  'tractions-pronation': pullup(),
  'tractions-supination': pullup(),
  'tractions-prise-neutre': pullup(),
  'tractions-assistees-machine': pullup({ assisted: true }),
  'tirage-vertical-poitrine': pulldown(),
  'tirage-vertical-prise-serree': pulldown({ close: true }),
  'tirage-vertical-supination': pulldown({ close: true }),
  'rowing-barre': rowBent({}),
  'rowing-pendlay': rowBent({ torso: 6 }),
  'rowing-haltere-unilateral': rowBent({ impl: 'halteres', onearm: true, torso: 14 }),
  'rowing-t-bar': rowBent({ tbar: true, torso: 30 }),
  'rowing-assis-poulie': rowSeated(),
  'rowing-machine': rowSeated({ machine: true }),
  'rowing-inverse': invRow(),
  'souleve-de-terre': hinge({}),
  'souleve-de-terre-sumo': hinge({ kind: 'sumo' }),
  'rack-pull': hinge({ kind: 'rack' }),
  'pull-over-poulie-bras-tendus': straightArmPulldown(),
  'extensions-lombaires': backExt(),
  'good-morning': goodMorning(),
  'shrug-barre': shrug('barre'),
  'shrug-halteres': shrug('halteres'),
  // Épaules
  'developpe-militaire-barre': ohp({}),
  'developpe-epaules-halteres-assis': ohp({ seated: true, impl: 'halteres' }),
  'developpe-arnold': ohp({ seated: true, impl: 'halteres' }),
  'developpe-epaules-machine': ohp({ machine: true }),
  'elevations-laterales-halteres': lateral({}),
  'elevations-laterales-poulie': lateral({ impl: 'poulie' }),
  'elevations-laterales-machine': lateral({ impl: 'machine', seated: true }),
  'elevations-frontales-halteres': frontRaise('halteres'),
  'elevations-frontales-disque': frontRaise('disque'),
  'oiseau-halteres': rearDelt({}),
  'reverse-pec-deck': rearDelt({ machine: true }),
  'face-pull': facePull(),
  'rowing-menton': uprightRow(),
  'push-press': ohp({ push: true }),
  'landmine-press': landmine(),
  // Biceps
  'curl-barre': curl({ impl: 'barre' }),
  'curl-barre-ez': curl({ impl: 'ez' }),
  'curl-halteres': curl({}),
  'curl-alterne-halteres': curl({ alt: true }),
  'curl-marteau': curl({}),
  'curl-incline-halteres': curlIncline(),
  'curl-pupitre-larry-scott': preacher(),
  'curl-pupitre-machine': preacher({ machine: true }),
  'curl-concentre': concentration(),
  'curl-poulie-basse': curl({ impl: 'machine', cable: true }),
  'curl-poulie-haute': curlHigh(),
  'curl-araignee': spider(),
  // Triceps
  'dips-triceps': dips({}),
  'dips-machine': dips({ machine: true }),
  'barre-au-front': bench({ impl: 'ez', skull: true }),
  'extension-nuque-haltere': overheadExt(),
  'extension-triceps-poulie-corde': pushdown({ rope: true }),
  'extension-triceps-poulie-barre': pushdown({}),
  'extension-triceps-poulie-au-dessus-de-la-tete': cableOverhead(),
  'developpe-couche-prise-serree': bench({}),
  'kickback-haltere': kickback({}),
  'kickback-poulie': kickback({ cable: true }),
  'pompes-diamant': pushup(),
  'extension-triceps-machine': pushdown({ machine: true }),
  // Quadriceps
  'squat-barre': squat({}),
  'squat-avant-front-squat': squat({ kind: 'avant' }),
  'squat-gobelet': squat({ kind: 'gobelet' }),
  'squat-smith': squat({ kind: 'smith' }),
  'hack-squat': squat({ kind: 'hack' }),
  'presse-a-cuisses': legPress(),
  'leg-extension': legExt(),
  'fentes-avant-halteres': lunge({}),
  'fentes-marchees': lunge({}),
  'fentes-bulgares': lunge({ bulgarian: true }),
  'fentes-barre': lunge({ impl: 'barre' }),
  'step-up': lunge({ step: true }),
  'pendulum-squat': squat({ kind: 'pendulum' }),
  'belt-squat': squat({ kind: 'belt' }),
  'sissy-squat': squat({ kind: 'sissy' }),
  // Ischio-jambiers
  'souleve-de-terre-jambes-tendues': hinge({ kind: 'stiff' }),
  'souleve-de-terre-roumain-barre': hinge({ kind: 'rdl' }),
  'souleve-de-terre-roumain-halteres': hinge({ kind: 'rdl', impl: 'halteres' }),
  'leg-curl-allonge': legCurl({}),
  'leg-curl-assis': legCurl({ kind: 'assis' }),
  'leg-curl-debout': legCurl({ kind: 'debout' }),
  'nordic-curl': nordic(),
  'glute-ham-raise': nordic({ ghd: true }),
  // Fessiers
  'hip-thrust-barre': hipThrust({}),
  'hip-thrust-machine': hipThrust({ kind: 'machine' }),
  'pont-fessier': hipThrust({ kind: 'pont' }),
  'abduction-machine': abduct({ out: true }),
  'adduction-machine': abduct({ out: false }),
  'kickback-fessier-poulie': gluteKick({}),
  'kickback-fessier-machine': gluteKick({ cable: false }),
  'abduction-poulie': abductCable(),
  // Mollets
  'mollets-debout-machine': calf({}),
  'mollets-assis-machine': calf({ kind: 'assis' }),
  'mollets-a-la-presse': calf({ kind: 'presse' }),
  'mollets-debout-haltere': calf({ kind: 'haltere' }),
  'mollets-smith': calf({ kind: 'smith' }),
  // Abdos
  'crunch': crunch({}),
  'crunch-poulie-haute': crunch({ kind: 'poulie' }),
  'crunch-machine': crunch({ kind: 'machine' }),
  'releve-de-jambes-suspendu': hangRaise({}),
  'releve-de-genoux-suspendu': hangRaise({ kind: 'genoux' }),
  'releve-de-jambes-chaise-romaine': hangRaise({ kind: 'chaise' }),
  'gainage-planche': plank(),
  'gainage-lateral': plank({ side: true }),
  'russian-twist': russianTwist(),
  'roue-abdominale': abWheel(),
  'sit-up-decline': crunch({ kind: 'situp' }),
  'pallof-press': pallof(),
  'bucheron-poulie': woodchop(),
  'dragon-flag': dragonFlag(),
  'mountain-climbers': mountain(),
  // Avant-bras
  'curl-poignets': wristCurl(),
  'curl-poignets-inverse': wristCurl(),
  'curl-inverse': curl({ impl: 'barre' }),
  'farmer-walk': farmer(),
  'suspension-a-la-barre': deadHang(),
  // Corps entier
  'kettlebell-swing': kbSwing(),
  'epaule-power-clean': clean(),
  'arrache-snatch': clean({ snatch: true }),
  'thruster': clean({ thruster: true }),
  'burpees': burpee(),
  'turkish-get-up': turkish(),
  // Cardio
  'tapis-de-course': run(),
  'velo': bike(),
  'velo-elliptique': bike({ elliptical: true }),
  'rameur': rower(),
  'stepper-escalier': stepper(),
  'air-bike': bike({ air: true }),
  'skierg': skierg(),
  'corde-a-sauter': jumpRope(),
};

// Déclarées après usage (function hoisting) : écartés vus de face, pull-over.
function flyFront({ seated = false, high = false, low = false }) {
  if (seated) {
    const hip = [150, 138], legs = [A([140, 188], undefined, 0.72)];
    return {
      bg: [...seat(118, 182, 142), sh.line([150, 142], [150, 80], 'st', 7)],
      f: [{ hip, torso: 90, sym: true, arms: [A([86, 80], [-1, -0.2])], legs }, { hip, torso: 90, sym: true, arms: [A([144, 86], [-1, 0], 0.45)], legs }],
      eq: held('machine'),
    };
  }
  const legs = [A([137, 191])];
  const anchor = high ? [[34, 30], [266, 30]] : [[34, 182], [266, 182]];
  const a0 = high ? [92, 56] : [110, 118], a1 = high ? [144, 112] : [146, 64];
  return {
    bg: [...eq.pulley(anchor[0]), ...eq.pulley(anchor[1]), ...post(34, 20), ...post(266, 20)],
    f: [{ ...STAND, sym: true, arms: [A(a0, [-1, 0.2])], legs }, { ...STAND, sym: true, arms: [A(a1, [-1, 0.2], 0.8)], legs }],
    eq: held('poulie', { anchor }),
  };
}

function pullover() {
  const hip = [150, 134], torso = 180, neck = neckOf({ hip, torso });
  const legs = [A([180, G], [0.3, -1]), A([184, G], [0.3, -1])];
  return {
    bg: benchAlong(hip, torso, { a: 24, b: 20 }),
    f: [{ hip, torso, legs, arms: both(add(neck, [-56, -12]), UP) }, { hip, torso, legs, arms: both(add(neck, [-4, -58]), UP) }],
    eq: held('halteres'),
  };
}

function straightArmPulldown() {
  const p = { hip: [140, 118], torso: 72, legs: [A([134, G]), A([150, G])] };
  return {
    bg: [...post(232, 4), ...eq.pulley([228, 14])],
    f: [{ ...p, arms: both([206, 40]) }, { ...p, arms: both([168, 124]) }],
    eq: held('machine', { anchor: [228, 14] }),
  };
}
