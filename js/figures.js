// Illustrations des exercices : silhouettes dessinées en SVG, animées entre deux positions.
// Repère : viewBox 300×200, sol à y = 188. Angles en degrés, sens mathématique (0 = droite, 90 = haut).

// Longueurs des segments du corps.
const S = { torso: 52, neck: 15, head: 9.5, upper: 28, fore: 32, thigh: 37, shin: 36 };
const GROUND = 188;

const rad = d => (d * Math.PI) / 180;
const dir = (a, len) => [Math.cos(rad(a)) * len, -Math.sin(rad(a)) * len];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
const r1 = n => Math.round(n * 10) / 10;

/**
 * Cinématique inverse à 2 segments : renvoie [départ, articulation, extrémité].
 * bend : +1 / -1 (sens de rotation), ou un vecteur [x, y] écran = direction préférée de l'articulation.
 */
function ik(a, t, l1, l2, bend) {
  const dx = t[0] - a[0], dy = -(t[1] - a[1]);
  let d = Math.hypot(dx, dy);
  const base = (Math.atan2(dy, dx) * 180) / Math.PI;
  const max = (l1 + l2) * 0.999, min = Math.abs(l1 - l2) + 0.5;
  if (d >= max) {
    const m = add(a, dir(base, l1));
    return [a, m, add(m, dir(base, l2))];
  }
  d = Math.max(d, min);
  const off = (Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180) / Math.PI;
  let s = bend;
  if (Array.isArray(bend)) {
    const m1 = dir(base + off, l1), m2 = dir(base - off, l1);
    s = m1[0] * bend[0] + m1[1] * bend[1] >= m2[0] * bend[0] + m2[1] * bend[1] ? 1 : -1;
  }
  const m = add(a, dir(base + s * off, l1));
  return [a, m, t];
}

// Directions préférées par défaut : coude vers le bas et l'arrière, genou vers l'avant.
const ELBOW = [-0.35, 1], KNEE = [1, -0.25];
const flipX = b => (Array.isArray(b) ? [-b[0], b[1]] : -b);

/**
 * Calcule les articulations d'une pose.
 * p = { hip:[x,y], torso:angle, tl?:facteur longueur tronc, head?:[x,y],
 *       arms:[{to, bend?, fs?}, …], legs:[…], wide?:bool (vue de face), sym?:bool (vue de face en miroir) }
 * fs : raccourcissement apparent du membre (membre orienté vers le spectateur), 1 = normal.
 * Le premier bras / la première jambe est « derrière » (gris), le second « devant ».
 */
function solve(p) {
  // Vue de face symétrique : le côté droit est le miroir exact du côté gauche.
  if (p.sym) {
    const mx = q => [2 * p.hip[0] - q[0], q[1]];
    const m = l => ({ ...l, to: mx(l.to), bend: l.bend === undefined ? undefined : flipX(l.bend) });
    p = { ...p, wide: true, arms: [p.arms[0], m(p.arms[0])], legs: [p.legs[0], m(p.legs[0])] };
  }
  const hip = p.hip;
  const neck = add(hip, dir(p.torso, S.torso * (p.tl || 1)));
  const head = p.head || add(neck, dir(p.torso + (p.tilt || 0), S.neck));
  const sw = p.wide ? 11 : 0, hw = p.wide ? 6 : 0;
  const shoulders = [add(neck, [-sw, 4]), add(neck, [sw, 4])];
  const hips = [add(hip, [-hw, 0]), add(hip, [hw, 0])];
  if (!p.wide) { shoulders[0] = shoulders[1] = neck; hips[0] = hips[1] = hip; }
  // En vue de face, les membres gauches plient vers l'extérieur par défaut (et les droits en miroir).
  const defArm = i => (p.wide ? (i ? [1, 0.6] : [-1, 0.6]) : ELBOW);
  const defLeg = i => (p.wide ? (i ? [1, 0] : [-1, 0]) : KNEE);
  const arms = p.arms.map((a, i) => ik(shoulders[i], a.to, S.upper * (a.fs || 1), S.fore * (a.fs || 1), a.bend ?? defArm(i)));
  const legs = p.legs.map((l, i) => ik(hips[i], l.to, S.thigh * (l.fs || 1), S.shin * (l.fs || 1), l.bend ?? defLeg(i)));
  return { hip, neck, head, arms, legs, shoulders, hips, wide: !!p.wide, x: p.x || {}, hands: arms.map(a => a[2]), feet: legs.map(l => l[2]), elbows: arms.map(a => a[1]), knees: legs.map(l => l[1]) };
}

// ---------- Formes ----------
// Chaque forme : { t: 'path'|'circle'|'line'|'rect', c: classe, ...attributs }
export const sh = {
  line: (a, b, c = 'eq', w) => ({ t: 'line', c, x1: a[0], y1: a[1], x2: b[0], y2: b[1], w }),
  circle: (p, r, c = 'eq') => ({ t: 'circle', c, cx: p[0], cy: p[1], r }),
  rect: (x, y, w, h, c = 'st') => ({ t: 'rect', c, x, y, width: w, height: h }),
  path: (pts, c = 'st', w) => ({ t: 'path', c, d: pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])},${r1(p[1])}`).join(''), w }),
};

// Matériel courant.
export const eq = {
  barbell: (p, r = 11) => [sh.circle(p, r, 'plate'), sh.circle(p, 3, 'hub')],
  dumbbell: p => [sh.circle(p, 6.5, 'plate')],
  kettlebell: p => [sh.circle(add(p, [0, 8]), 8, 'plate'), sh.line(p, add(p, [0, 4]), 'eq', 3)],
  handle: p => [sh.circle(p, 3.5, 'plate')],
  cable: (from, to) => [sh.line(from, to, 'cable', 1.6)],
  pulley: p => [sh.circle(p, 5, 'st'), sh.circle(p, 2, 'hub')],
  // Banc : du point a au point b (dessus), avec pieds jusqu'au sol.
  bench: (a, b, legs = true) => [
    sh.line(a, b, 'st', 9),
    ...(legs ? [sh.line([a[0] + 8, a[1] + 4], [a[0] + 8, GROUND], 'st', 4), sh.line([b[0] - 8, b[1] + 4], [b[0] - 8, GROUND], 'st', 4)] : []),
  ],
  ground: () => [sh.line([10, GROUND + 4], [290, GROUND + 4], 'floor', 2)],
};

// ---------- Rendu ----------
function limbD(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])},${r1(p[1])}`).join('');
}

/** Formes du corps pour une pose résolue (ordre stable pour l'animation). */
function bodyShapes(j, wide) {
  const back = wide ? 'limb' : 'limb back';
  return [
    { t: 'path', c: back, d: limbD(j.legs[0]) },
    { t: 'path', c: back, d: limbD(j.arms[0]) },
    { t: 'path', c: 'torso', d: limbD([j.hip, j.neck]) },
    // Épaules et bassin (vue de face) : relient les membres au tronc.
    { t: 'path', c: 'torso', d: limbD(j.shoulders) },
    { t: 'path', c: 'torso', d: limbD(j.hips) },
    // Cou : relie toujours la tête au tronc.
    { t: 'path', c: 'neckl', d: limbD([j.neck, j.head]) },
    { t: 'circle', c: 'headc', cx: j.head[0], cy: j.head[1], r: S.head },
    { t: 'path', c: 'limb', d: limbD(j.legs[1]) },
  ];
}
const frontArm = j => ({ t: 'path', c: 'limb', d: limbD(j.arms[1]) });

const ATTRS = { path: ['d'], circle: ['cx', 'cy', 'r'], line: ['x1', 'y1', 'x2', 'y2'], rect: ['x', 'y', 'width', 'height'] };
const SPLINE = '.45 0 .55 1;.45 0 .55 1';

function shapeSVG(a, b, animate, dur) {
  const attrs = ATTRS[a.t];
  const fmt = v => (typeof v === 'number' ? r1(v) : v);
  const base = attrs.map(k => `${k}="${fmt(a[k])}"`).join(' ');
  const w = a.w ? ` style="stroke-width:${a.w}"` : '';
  let anim = '';
  if (animate && b) {
    anim = attrs.filter(k => fmt(a[k]) !== fmt(b[k])).map(k =>
      `<animate attributeName="${k}" values="${fmt(a[k])};${fmt(b[k])};${fmt(a[k])}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines="${SPLINE}"/>`).join('');
  }
  return anim ? `<${a.t} class="${a.c}" ${base}${w}>${anim}</${a.t}>` : `<${a.t} class="${a.c}" ${base}${w}/>`;
}

/**
 * def = { f: [pose0, pose1], bg?: formes fixes (derrière), eq?: (j) => formes liées au corps,
 *         over?: (j) => formes devant le bras avant, ground?: bool }
 */
export function render(def, { animate = true, frame = 1, cls = '', crop = false } = {}) {
  const frames = def.f.map(solve);
  const wide = def.f[0].wide || def.f[0].sym;
  const build = j => [
    ...(def.ground === false ? [] : eq.ground()),
    ...(def.bg || []),
    ...(def.under ? def.under(j) : []),
    ...bodyShapes(j, wide),
    ...(def.eq ? def.eq(j) : []),
    frontArm(j),
    ...(def.over ? def.over(j) : []),
  ];
  const A = build(frames[animate ? 0 : frame]);
  const B = animate ? build(frames[1]) : null;
  const dur = def.dur || 2.6;
  const body = A.map((s, i) => shapeSVG(s, B && B[i] && B[i].t === s.t ? B[i] : null, animate, dur)).join('');
  let vb = '0 0 300 200';
  if (crop) {
    // Cadrage serré sur le corps (vignettes) : boîte englobante + marge, au format 3:2.
    const pts = frames.flatMap(j => [j.head, j.neck, j.hip, ...j.arms.flat(), ...j.legs.flat()]);
    let x0 = Math.min(...pts.map(p => p[0])) - 18, x1 = Math.max(...pts.map(p => p[0])) + 18;
    let y0 = Math.min(...pts.map(p => p[1])) - 16, y1 = Math.max(...pts.map(p => p[1])) + 14;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < 1.5) { const nw = h * 1.5; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / 1.5; y0 -= (nh - h) / 2; h = nh; }
    vb = [x0, y0, w, h].map(r1).join(' ');
  }
  return `<svg class="fig ${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
}

export { solve, add, dir, GROUND, S };
