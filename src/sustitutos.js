/* Equivalentes por patrón. Ninguno carga la columna. */
import { esCargaAxial, claveVariante } from "./gyms.js";
import { normNombre } from "./escala.js";

export const TIPOS_SUSTITUTO = [
  { id: "maquina", n: "Máquina" },
  { id: "polea", n: "Polea" },
  { id: "mancuernas", n: "Mancuernas" },
  { id: "corporal", n: "Corporal" },
];

const POR_PATRON = {
  "press horizontal": [
    { n: "Press en poleas", tipo: "polea" },
    { n: "Press con mancuernas", tipo: "mancuernas" },
    { n: "Chest press de otra marca", tipo: "maquina" },
  ],
  apertura: [
    { n: "Apertura en poleas", tipo: "polea" },
    { n: "Apertura con mancuernas", tipo: "mancuernas" },
    { n: "Pec deck de otra marca", tipo: "maquina" },
  ],
  "press vertical": [
    { n: "Press de hombros en máquina", tipo: "maquina" },
    { n: "Press Arnold sentado", tipo: "mancuernas" },
    { n: "Press de hombros en polea", tipo: "polea" },
  ],
  "elevacion lateral": [
    { n: "Elevación lateral en polea", tipo: "polea" },
    { n: "Elevación lateral con mancuernas", tipo: "mancuernas" },
    { n: "Elevación lateral en máquina", tipo: "maquina" },
  ],
  "extension triceps": [
    { n: "Extensión en polea", tipo: "polea" },
    { n: "Extensión con mancuerna", tipo: "mancuernas" },
    { n: "Extensión en máquina", tipo: "maquina" },
  ],
  "jalon vertical": [
    { n: "Jalón en polea", tipo: "polea" },
    { n: "Jalón agarre neutro", tipo: "polea" },
    { n: "Jalón de otra marca", tipo: "maquina" },
  ],
  remo: [
    { n: "Remo en polea", tipo: "polea" },
    { n: "Remo con mancuerna", tipo: "mancuernas" },
    { n: "Remo en máquina", tipo: "maquina" },
  ],
  curl: [
    { n: "Curl en polea", tipo: "polea" },
    { n: "Curl con mancuernas", tipo: "mancuernas" },
    { n: "Curl en máquina", tipo: "maquina" },
  ],
  prensa: [
    { n: "Prensa de otra marca", tipo: "maquina" },
    { n: "Prensa a una pierna", tipo: "maquina" },
    { n: "Sentadilla en máquina", tipo: "maquina" },
  ],
  "curl femoral": [
    { n: "Curl femoral sentado", tipo: "maquina" },
    { n: "Curl femoral de pie", tipo: "maquina" },
    { n: "Curl femoral en polea", tipo: "polea" },
  ],
  "extension cuadriceps": [
    { n: "Extensión a una pierna", tipo: "maquina" },
    { n: "Extensión de otra marca", tipo: "maquina" },
  ],
  abduccion: [
    { n: "Abducción en máquina", tipo: "maquina" },
    { n: "Abducción en polea", tipo: "polea" },
    { n: "Elevación de pierna acostado", tipo: "corporal" },
  ],
  gemelos: [
    { n: "Gemelos sentado", tipo: "maquina" },
    { n: "Gemelos en prensa", tipo: "maquina" },
    { n: "Gemelos a una pierna", tipo: "corporal" },
  ],
  core: [
    { n: "Plancha", tipo: "corporal" },
    { n: "Dead bug", tipo: "corporal" },
    { n: "Pallof en polea", tipo: "polea" },
  ],
};

const PATRON_DE = {
  a1: "press horizontal", a1r: "press horizontal", a6: "press horizontal", a6r: "press horizontal",
  a2: "apertura", a7: "apertura",
  a3: "press vertical", a3r: "press vertical",
  a4: "elevacion lateral", a5: "elevacion lateral", a5r: "elevacion lateral", a13r: "elevacion lateral",
  a8: "extension triceps", a9: "extension triceps",
  b1: "jalon vertical", b1r: "jalon vertical", b5: "jalon vertical", b10: "jalon vertical", b10r: "jalon vertical",
  b2: "remo", b2r: "remo", b3: "remo", b3r: "remo", b4: "remo", b4r: "remo",
  b6: "curl", b7: "curl", b8: "curl",
  c1: "prensa",
  c2: "curl femoral",
  c3: "extension cuadriceps",
  c4: "core", c5: "abduccion", c6: "abduccion", c11: "abduccion",
  c8: "gemelos",
  c12: "core", b9: "core", b11: "core", a10: "core", a11: "core", c9: "core",
};

export function patronDe(exId) {
  return PATRON_DE[exId] || "core";
}

export function equivalentesDe(exId) {
  const patron = patronDe(exId);
  const lista = (POR_PATRON[patron] || POR_PATRON.core).filter((e) => e && !esCargaAxial(e.n));
  return lista.slice(0, 4).map((e, i) => ({
    id: exId + "-s" + (i + 1),
    n: e.n,
    tipo: e.tipo,
    patron,
  }));
}

export function validarSustituto(nombre, usados) {
  const n = String(nombre || "").trim();
  if (!n) return "Pon un nombre.";
  if (esCargaAxial(n)) return "Ese nombre carga la columna. Elige máquina, polea o peso corporal.";
  const k = normNombre(n);
  if ((usados || []).some((x) => normNombre(x) === k)) return "Ese nombre ya está en la sesión.";
  return "";
}

export function crearSustituto({ exId, nombre, tipo, patron, usados }) {
  const error = validarSustituto(nombre, usados);
  if (error) return { error };
  const t = TIPOS_SUSTITUTO.some((x) => x.id === tipo) ? tipo : "maquina";
  const p = POR_PATRON[patron] ? patron : patronDe(exId);
  return {
    id: exId + "-c" + Math.random().toString(36).slice(2, 7),
    n: String(nombre).trim().slice(0, 40),
    tipo: t,
    patron: p,
  };
}

export function claveSub(exId, sub) {
  return claveVariante(exId, sub && sub.id ? "sub:" + sub.id : "main");
}
