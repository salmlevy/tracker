/* Escala de Simón: 6 modos contra el mejor momento (100%).
   Volumen = series × reps medias de la sesión pico × kg del mejor peso.
   El calentamiento (h1–h5, a12r, b12r) no entra. Asistidos y corporales suman 0.
   Base: A 11 ago, B 15 ago, C 13 ago, con el mejor peso registrado de cada ejercicio.
   c7 y c10 no se programan (pendientes de revisión médica). a3r solo desde la semana 3. */

import { DAYS } from "./dias.js";
import { rehabEx } from "./hombro.js";

const LB = 0.45359237;
const kgLb = (lb) => lb * LB;

/* Mejor peso completado en el historial, en la unidad del ejercicio.
   Rehab sin registro: peso de regla. a6r 75 lb, a3r 65 lb, b3r 60 lb. */
const MEJOR = {
  a1: kgLb(165), a2: kgLb(140), a3: kgLb(135), a4: kgLb(35), a5: kgLb(30),
  a6: kgLb(120), a7: kgLb(30), a8: kgLb(70), a9: kgLb(46),
  a1r: kgLb(105), a6r: kgLb(75), a3r: kgLb(65), a5r: 2, a13r: kgLb(5),
  b1: kgLb(135), b2: kgLb(135), b3: kgLb(80), b4: kgLb(90),
  b6: kgLb(70), b7: kgLb(35), b8: kgLb(15),
  b1r: kgLb(100), b2r: kgLb(100), b3r: kgLb(60), b4r: kgLb(30),
  c1: kgLb(305), c2: kgLb(95), c3: kgLb(130), c4: kgLb(190),
  c5: kgLb(125), c6: kgLb(100), c7: kgLb(200), c8: kgLb(140),
  c11: kgLb(65), c12: kgLb(42),
};

/* Reps de la sesión pico. Rehab sin serie larga: reps de la regla (8) o las registradas. */
const REPS = {
  a1: [12, 12, 12, 12], a2: [8, 8, 8, 8], a3: [8, 8, 8], a4: [15, 15, 15],
  a5: [12, 12, 12], a6: [12, 8, 7], a7: [15, 15, 15], a8: [12, 12, 12], a9: [15, 15, 15],
  a1r: [10], a6r: [8], a3r: [8], a5r: [12], a13r: [12],
  b1: [12, 12, 12, 7], b2: [12, 12, 12, 10], b3: [12, 12, 12], b4: [12, 12, 12],
  b6: [12, 12, 9], b7: [9, 9, 9], b8: [15, 15],
  b1r: [10], b2r: [10], b3r: [8], b4r: [10],
  c1: [12, 12, 12, 12], c2: [15, 15, 15, 15], c3: [12, 12, 12, 12],
  c4: [14, 14, 14], c5: [15, 15, 15], c6: [15, 15, 15], c7: [22, 17, 11],
  c8: [14, 14, 14], c11: [13, 13, 13], c12: [15, 15, 15],
};

const CERO = new Set(["a10", "a11", "b5", "b9", "b10", "b10r", "c9", "c10", "h1", "h2", "h3", "h4", "h5", "a12r", "b12r"]);
const CALENT = new Set(["h1", "h2", "h3", "h4", "h5", "a12r", "b12r"]);

export const BASE_EJ = { A: 11, B: 9, C: 12 };
const PICO = {
  A: [["a1", 4], ["a2", 4], ["a3", 3], ["a4", 3], ["a5", 3], ["a6", 3], ["a7", 3], ["a8", 3], ["a9", 3]],
  B: [["b1", 4], ["b2", 4], ["b3", 3], ["b4", 3], ["b6", 3], ["b7", 3], ["b8", 2]],
  C: [["c1", 4], ["c2", 4], ["c3", 4], ["c4", 3], ["c5", 3], ["c6", 3], ["c7", 3], ["c8", 3], ["c11", 3], ["c12", 3]],
};

const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function kgPorSerie(id) {
  if (CERO.has(id) || CALENT.has(id)) return 0;
  const reps = REPS[id];
  if (!reps || !MEJOR[id]) return 0;
  return MEJOR[id] * media(reps);
}

export function volumenDe(pares, factor) {
  const f = factor == null ? 1 : factor;
  return (pares || []).reduce((t, [id, n]) => t + (Number(n) || 0) * kgPorSerie(id) * f, 0);
}

export const BASE_KG = {
  A: volumenDe(PICO.A),
  B: volumenDe(PICO.B),
  C: volumenDe(PICO.C),
};

/* Objetivo de la escala. El tope reemplaza al objetivo cuando el peso de rehab no llega. */
export const OBJETIVO = {
  relajado: { 1: 60, 0: 70 },
  normal: { 1: 80, 0: 90 },
  espartano: { 1: 100, 0: 105 },
};
export const TOPE = {
  A: { espartano: { 1: 85 }, normal: { 1: 70 } },
  B: { espartano: { 1: 85 } },
};

export function metaVol(dayId, modo, molestia, semana) {
  const k = molestia ? 1 : 0;
  if (semana >= 3 && dayId === "A" && modo === "espartano" && molestia) return 92;
  const tope = TOPE[dayId] && TOPE[dayId][modo] && TOPE[dayId][modo][k];
  if (typeof tope === "number") return tope;
  return OBJETIVO[modo][k];
}

/* Series de trabajo. c7 y c10 no están. a3r entra solo en espartano con molestia, semana 3.
   a13r sustituye a la escapción de trabajo (a5r), que repetía h3.
   El último de cada lista es peso corporal, sin carga axial. */
const TRABAJO = {
  A: {
    "relajado:1": [["a1r", 4], ["a2", 4], ["a6r", 3], ["a13r", 2], ["a9", 4], ["a8", 3], ["a7", 3], ["a10", 3]],
    "relajado:0": [["a1", 3], ["a3", 3], ["a2", 3], ["a5", 2], ["a9", 2], ["a4", 2], ["a7", 2], ["a6", 2], ["a10", 2]],
    "normal:1": [["a1r", 4], ["a2", 4], ["a6r", 3], ["a8", 4], ["a9", 3], ["a7", 3], ["a4", 3], ["a13r", 2], ["a10", 2]],
    "normal:0": [["a1", 3], ["a2", 3], ["a3", 3], ["a5", 3], ["a6", 3], ["a7", 3], ["a8", 3], ["a9", 4], ["a4", 3], ["a10", 2]],
    "espartano:1": [["a1r", 4], ["a2", 4], ["a6r", 5], ["a8", 5], ["a9", 5], ["a7", 4], ["a4", 4], ["a13r", 3], ["a10", 3], ["a11", 3]],
    "espartano:0": [["a1", 4], ["a2", 4], ["a3", 4], ["a4", 3], ["a5", 3], ["a6", 3], ["a7", 3], ["a8", 3], ["a9", 3], ["a10", 3], ["a11", 3]],
  },
  B: {
    "relajado:1": [["b1r", 4], ["b2r", 4], ["b4r", 3], ["b3r", 3], ["b6", 3], ["b7", 3], ["b10r", 2]],
    "relajado:0": [["b1", 3], ["b2", 3], ["b4", 3], ["b6", 3], ["b7", 2], ["b8", 2], ["b10", 2], ["b9", 2]],
    "normal:1": [["b1r", 5], ["b2r", 5], ["b3r", 4], ["b4r", 4], ["b6", 4], ["b7", 3], ["b8", 3], ["b10r", 3]],
    "normal:0": [["b1", 3], ["b2", 3], ["b3", 4], ["b4", 3], ["b10", 3], ["b6", 3], ["b7", 3], ["b8", 3], ["b9", 3]],
    "espartano:1": [["b1r", 5], ["b2r", 5], ["b3r", 4], ["b4r", 4], ["b6", 4], ["b7", 4], ["b8", 4], ["b10r", 3], ["b11", 3], ["b9", 3]],
    "espartano:0": [["b1", 4], ["b2", 4], ["b3", 4], ["b4", 3], ["b5", 3], ["b6", 3], ["b7", 3], ["b8", 3], ["b10", 3], ["b11", 3], ["b9", 3]],
  },
  C: {
    "relajado:1": [["c1", 3], ["c2", 3], ["c3", 3], ["c4", 4], ["c5", 3], ["c6", 3], ["c8", 4], ["c12", 3], ["c9", 2]],
    "relajado:0": [["c1", 3], ["c2", 3], ["c3", 3], ["c4", 3], ["c5", 3], ["c6", 2], ["c8", 3], ["c12", 2], ["c11", 2], ["c9", 2]],
    "normal:1": [["c1", 4], ["c2", 5], ["c3", 5], ["c4", 4], ["c5", 4], ["c6", 5], ["c8", 4], ["c12", 4], ["c9", 2]],
    "normal:0": [["c1", 4], ["c2", 4], ["c3", 4], ["c4", 4], ["c5", 3], ["c6", 3], ["c8", 4], ["c11", 3], ["c12", 3], ["c9", 2]],
    "espartano:1": [["c1", 5], ["c2", 5], ["c3", 5], ["c4", 5], ["c5", 5], ["c6", 5], ["c8", 5], ["c11", 5], ["c12", 4], ["c9", 3]],
    "espartano:0": [["c1", 4], ["c2", 5], ["c3", 5], ["c4", 4], ["c5", 4], ["c6", 4], ["c8", 4], ["c11", 4], ["c12", 4], ["c9", 3]],
  },
};

/* Peso corporal o asistencia. Cierran la sesión y no cargan la columna. */
export const CORPORAL = new Set(["a10", "a11", "b5", "b9", "b10", "b10r", "c9"]);

/* Mismo gesto no puede estar en el calentamiento y otra vez en el trabajo. */
export const GESTO = {
  h1: "rotacion-externa",
  h2: "rotacion-interna",
  h3: "escapcion",
  a5r: "escapcion",
  h4: "abduccion-isometrica",
  h5: "face-pull",
  a12r: "face-pull",
  a13r: "abduccion-maquina",
  b12r: "rotacion-externa-90",
};

export function repiteCalentamiento(warmIds, workIds) {
  const ids = new Set(warmIds || []);
  const gestos = new Set((warmIds || []).map((id) => GESTO[id] || id));
  return (workIds || []).filter((id) => ids.has(id) || gestos.has(GESTO[id] || id));
}

const TIT = {
  a1: ["Pecho", "pecho"], a1r: ["Pecho", "pecho"], a2: ["Pecho", "pecho"],
  a6: ["Pecho · ángulo superior", "pecho"], a6r: ["Pecho · ángulo superior", "pecho"], a7: ["Pecho", "pecho"],
  a3: ["Hombro", "hombros"], a3r: ["Hombro", "hombros"], a4: ["Hombro", "hombros"], a5: ["Hombro", "hombros"], a5r: ["Hombro", "hombros"], a13r: ["Hombro", "hombros"],
  a8: ["Tríceps", "triceps"], a9: ["Tríceps", "triceps"],
  a10: ["Cierre · peso corporal", "pecho"], a11: ["Cierre · peso corporal", "pecho"],
  b1: ["Espalda", "espalda"], b1r: ["Espalda", "espalda"], b2: ["Espalda", "espalda"], b2r: ["Espalda", "espalda"],
  b3: ["Espalda", "espalda"], b3r: ["Espalda", "espalda"], b4: ["Espalda", "espalda"], b4r: ["Espalda", "espalda"],
  b5: ["Progresión pull-up", "espalda"], b10: ["Progresión pull-up", "espalda"], b10r: ["Progresión pull-up", "espalda"],
  b6: ["Bíceps", "biceps"], b7: ["Bíceps", "biceps"], b8: ["Bíceps", "biceps"],
  b9: ["Core", "core"], b11: ["Core", "core"],
  c1: ["Base pesada", "piernas"], c2: ["Base pesada", "piernas"], c3: ["Cuádriceps", "piernas"],
  c4: ["Glúteo y cadera", "gluteo"], c5: ["Glúteo y cadera", "gluteo"], c6: ["Glúteo y cadera", "gluteo"], c11: ["Glúteo y cadera", "gluteo"],
  c8: ["Pantorrilla", "pantorrilla"], c9: ["Core · cierre", "core"], c12: ["Core · cierre", "core"],
};

function trabajoDe(dayId, modo, molestia, semana) {
  const key = modo + ":" + (molestia ? "1" : "0");
  const list = (TRABAJO[dayId] && TRABAJO[dayId][key] ? TRABAJO[dayId][key] : []).map((p) => p.slice());
  if (molestia && dayId === "A" && modo === "espartano" && (semana || 1) >= 3) {
    const fin = list.length && CORPORAL.has(list[list.length - 1][0]) ? list.pop() : null;
    list.push(["a3r", 4]);
    if (fin) list.push(fin);
  }
  return list.filter(([id]) => id !== "c7" && id !== "c10");
}

function calentamiento(dayId, modo, molestia) {
  if (dayId === "C" || !molestia && dayId !== "A" && dayId !== "B") return [];
  if (!molestia) return [["h1", 3], ["h5", 2]];
  if (modo === "relajado") return [["h1", 2], ["h2", 2], ["h3", 2], ["h4", 2], ["h5", 2]];
  return [["h1", 3], ["h2", 2], ["h3", 2], ["h4", 5], ["h5", 2]];
}

export function factorCarga(dayId, molestia) {
  return dayId === "C" && molestia ? 0.8 : 1;
}

export function resumenEscala(dayId, modo, molestia, semana) {
  const trabajo = trabajoDe(dayId, modo, molestia, semana || 1);
  const factor = factorCarga(dayId, molestia);
  const vol = volumenDe(trabajo, factor);
  const base = BASE_KG[dayId] || 1;
  const ej = trabajo.length;
  const ejPct = (ej / BASE_EJ[dayId]) * 100;
  const volPct = (vol / base) * 100;
  return { trabajo, ej, ejPct, volPct, meta: metaVol(dayId, modo, molestia, semana || 1), factor };
}

function exDe(id, sets, loadPct) {
  const rehab = rehabEx();
  let src = rehab[id];
  if (!src) {
    for (const d of Object.values(DAYS)) {
      const hit = d.ex.find((e) => e.id === id);
      if (hit) { src = hit; break; }
    }
  }
  if (!src) return null;
  const out = { ...src, maxSets: sets, nSets: sets };
  if (loadPct && loadPct !== 1) out.loadPct = loadPct;
  if (CALENT.has(id)) out.warm = true;
  return out;
}

/* Día que muestra la sesión. El orden es el de la escala; el calentamiento va primero. */
export function diaDeSesion(dayId, modo, opts) {
  const o = opts || {};
  const molestia = !!o.molestia;
  const semana = o.semana || 1;
  const base = DAYS[dayId];
  if (!base) return base;
  const factor = factorCarga(dayId, molestia);
  const warm = calentamiento(dayId, modo, molestia);
  const work = trabajoDe(dayId, modo, molestia, semana);
  const pares = [...warm.map(([id, n]) => [id, n, true]), ...work.map(([id, n]) => [id, n, false])];
  const secs = [];
  if (warm.length) secs.push({ t: "Calentamiento hombro", note: molestia ? "Con molestia: más calentamiento. No cuenta en el volumen." : "Sin molestia: rotación externa y face pull.", ids: warm.map(([id]) => id), g: ["hombro"] });
  work.forEach(([id]) => {
    const tit = TIT[id] || ["Trabajo", "core"];
    const last = secs[secs.length - 1];
    if (last && last.t === tit[0]) last.ids.push(id);
    else secs.push({ t: tit[0], ids: [id], g: [tit[1]] });
  });
  const ex = pares.map(([id, n]) => exDe(id, n, factor)).filter(Boolean);
  return {
    ...base,
    secs,
    ex,
    modo,
    molestia,
    semana,
  };
}
