/* Potencia y Resistencia: el plan que ya existe, leído en tres partes.
   Si falta Calentamiento, Principal o Final, se completa moderado y sin subir el volumen. */
import { fmtDur, parseNota } from "./parseNota.js";

const NOTA_RES = "El lunes hice calentamiento de 7 min en 9km sin inclinación después ejercicios de calentamiento fuera de la banda y empezó el entrenamiento todo con inclinacion 1.5 hice 3 series de 3 min a 14 por 1 min de descanso 2 min a 15 por 1 min de descanso y 1 min a 16 por 2.5 min de descanso y cerré con 5 min a 7 de enfriamiento y estiramientos";
const NOTA_POT = "Ayer hice 7 min de calentamiento en 9km/h después calentamientos fuera de banda y después empezó el entrenamiento de 12 series a 12 km/h con inclinación 12 de 1 minuto por 1.5 min de descanso y al final un enfriamiento de 5 min a 6 sin inclinación y después estiramientos sin banda";

export const TIPOS = [
  { k: "pot", t: "Potencia", sub: "Tu sesión de cinta", preset: true },
  { k: "res", t: "Resistencia", sub: "Tu sesión de cinta", preset: true },
  { k: "lar", t: "Largo", sub: "Solo registrar", preset: false },
  { k: "lib", t: "Libre", sub: "Solo registrar", preset: false },
];

function preset(nota) {
  return parseNota(nota) || {};
}

export function presetResistencia() {
  return preset(NOTA_RES);
}

export function presetPotencia() {
  return preset(NOTA_POT);
}

export function volumenPrincipal(p) {
  if (!p) return 0;
  if (Array.isArray(p.blocks) && p.blocks.length) {
    return p.blocks.reduce((a, b) => a + (Number(b.n) > 0 ? Number(b.n) : 1) * (Number(b.t) || 0), 0);
  }
  if (Array.isArray(p.sets) && p.sets.length) {
    return p.sets.reduce((a, s) => a + (Number(s.t) || 0), 0);
  }
  if (p.n != null && p.t != null) return (Number(p.n) || 0) * (Number(p.t) || 0);
  return 0;
}

function velMin(p) {
  const vals = [];
  if (Array.isArray(p.blocks)) p.blocks.forEach((b) => { if (b && b.v != null) vals.push(Number(b.v)); });
  if (Array.isArray(p.sets)) p.sets.forEach((s) => { if (s && s.v != null) vals.push(Number(s.v)); });
  if (p.v != null) vals.push(Number(p.v));
  const ok = vals.filter((v) => Number.isFinite(v) && v > 0);
  return ok.length ? Math.min(...ok) : 9;
}

function calModerado(p) {
  const base = velMin(p);
  const cv = Math.min(8, Math.max(6, Math.round((base - 1) * 10) / 10));
  return { cal: 5, cv, cinc: 0 };
}

/* No toca series, tiempos ni velocidades que ya están. Solo rellena el hueco. */
export function completarPlan(p) {
  const base = { ...(p || {}) };
  const hadMain = volumenPrincipal(base) > 0;
  const hadCal = Number(base.cal) > 0;
  const hadCool = !!(base.cool && Number(base.cool.min) > 0);
  if (!hadCal) Object.assign(base, calModerado(hadMain ? base : { v: 9 }));
  if (!hadCool) base.cool = { min: 4, v: 6 };
  if (!hadMain) {
    base.n = 1;
    base.t = 8 * 60;
    base.v = 9;
    base.inc = 0;
    base.dt = 0;
    delete base.blocks;
    delete base.sets;
  }
  return {
    plan: base,
    relleno: { cal: !hadCal, principal: !hadMain, final: !hadCool },
  };
}

export function planDelSlot(weeks, slot) {
  const keys = Object.keys(weeks || {}).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    const slotObj = weeks[keys[i]] && weeks[keys[i]][slot];
    const p = slotObj && slotObj.p;
    if (p && (volumenPrincipal(p) > 0 || Number(p.cal) > 0 || (p.cool && Number(p.cool.min) > 0))) return p;
  }
  return slot === "pot" ? presetPotencia() : presetResistencia();
}

function textoCal(p) {
  let s = p.cal + " min";
  if (p.cv != null && p.cv !== "") s += " a " + p.cv + " km/h";
  if (p.cinc === 0) s += ", sin inclinación";
  else if (p.cinc) s += ", inclinación " + p.cinc;
  return s;
}

function textoBloque(b) {
  const n = b.n != null ? b.n : 1;
  let s = (n > 1 ? n + " × " : "") + (fmtDur(b.t) || "");
  if (b.v != null) s += " a " + b.v + " km/h";
  if (b.inc === 0) s += ", sin inclinación";
  else if (b.inc) s += ", inclinación " + b.inc;
  if (b.dt) s += ", descanso " + fmtDur(b.dt);
  return s.trim();
}

function textoPrin(p) {
  if (Array.isArray(p.blocks) && p.blocks.length) return p.blocks.map(textoBloque).join("\n");
  if (Array.isArray(p.sets) && p.sets.length) return p.sets.map((s) => textoBloque({ n: 1, ...s })).join("\n");
  if (p.n != null && p.t != null) return textoBloque({ n: p.n, t: p.t, v: p.v, inc: p.inc, dt: p.dt });
  return "";
}

function textoFin(p, suave) {
  const c = p.cool || {};
  let s = (c.min || 0) + " min";
  if (c.v != null && c.v !== "") s += " a " + c.v + " km/h";
  if (suave) s += ", suave";
  return s;
}

export function lectorDe(p) {
  const { plan, relleno } = completarPlan(p);
  return {
    plan,
    relleno,
    secciones: [
      { id: "cal", titulo: "Calentamiento", texto: textoCal(plan) },
      { id: "prin", titulo: "Principal", texto: textoPrin(plan) },
      { id: "fin", titulo: "Final", texto: textoFin(plan, relleno.final) },
    ],
  };
}

function descansoSeg(p) {
  if (Array.isArray(p.blocks) && p.blocks.length) {
    return p.blocks.reduce((a, b) => a + (Number(b.n) > 0 ? Number(b.n) : 1) * (Number(b.dt) || 0), 0);
  }
  if (Array.isArray(p.sets) && p.sets.length) {
    return p.sets.reduce((a, s) => a + (Number(s.dt) || 0), 0);
  }
  if (p.n != null && p.dt != null) return (Number(p.n) || 0) * (Number(p.dt) || 0);
  return 0;
}

/* Minutos del plan que se muestra, descanso incluido, como el registro de antes. */
export function minutosPlan(p) {
  if (!p) return 0;
  const cal = Number(p.cal) || 0;
  const cool = p.cool && Number(p.cool.min) ? Number(p.cool.min) : 0;
  const seg = volumenPrincipal(p) + descansoSeg(p);
  return Math.max(0, Math.round(cal + cool + seg / 60));
}

export function esRegistro(k) {
  return k === "lar" || k === "lib";
}
