/* De dónde sale el peso de la sesión pasada.
   Un set sin gymId hereda el gym de su sesión (el 3 nov, si las notas lo dicen).
   No reescribe el historial. */

import { LB2KG, claveVariante, gymDeSerie, gymDeSesion } from "./gyms.js";

function comoLog(raw) {
  if (Array.isArray(raw)) return { v: "main", sets: raw, note: "" };
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

/* El set cuenta para este gym. Sin gymId, se usa el de la sesión. */
export function setDelGym(set, sesion, gymId, gyms) {
  if (!set || !set.done) return false;
  if (!gymId) return true;
  return gymDeSerie(set, sesion, gyms) === gymId;
}

/* Series hechas de ese ejercicio, variante y gym. Null si no hay. */
export function setsHechos(sesion, exId, v, gymId, gyms) {
  if (!sesion || !sesion.logs) return null;
  const l = comoLog(sesion.logs[exId]);
  if (!l) return null;
  if (claveVariante(exId, l.v) !== claveVariante(exId, v)) return null;
  const rows = (l.sets || []).filter((s) => setDelGym(s, sesion, gymId, gyms));
  if (!rows.length) return null;
  return rows.map((s) => [Number(s.w) || 0, Number(s.r) || 0]);
}

/* Las dos últimas del mismo día, misma variante y mismo gym. */
export function lastTwoGym(hist, dayId, ex, v, gymId, gyms) {
  const out = [];
  const rows = hist || [];
  const id = ex && ex.id;
  for (let i = rows.length - 1; i >= 0 && out.length < 2; i--) {
    const s = rows[i];
    if (!s || s.day !== dayId) continue;
    const d = setsHechos(s, id, v, gymId, gyms);
    if (d) out.push(d);
  }
  return out;
}

/* La sesión toca el gym si ella es de ese gym o algún set (heredando) lo es. */
export function sesionTocaGym(sesion, gymId, gyms) {
  if (!sesion || !gymId) return false;
  if (gymDeSesion(sesion, gyms) === gymId) return true;
  const logs = sesion.logs || {};
  const keys = Object.keys(logs);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === "_extras") continue;
    const l = comoLog(logs[keys[i]]);
    const sets = (l && l.sets) || [];
    if (sets.some((x) => x && gymDeSerie(x, sesion, gyms) === gymId)) return true;
  }
  return false;
}

/* Variante con la que cerró ese ejercicio la última vez en este gym y este día. */
export function varianteDeUltima(hist, dayId, exId, gymId, gyms) {
  const rows = hist || [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const s = rows[i];
    if (!s || s.day !== dayId || !s.logs || !s.logs[exId]) continue;
    const l = comoLog(s.logs[exId]);
    if (!l) continue;
    const v = l.v === "alt" ? "alt" : (l.v || "main");
    if (setsHechos(s, exId, v, gymId, gyms)) return v;
  }
  return "main";
}

export function pesoEnVista(w, desde, hacia) {
  const n = Number(w) || 0;
  if (desde === hacia) return n;
  const convertido = desde === "lb" ? n * LB2KG : n / LB2KG;
  return Math.round(convertido * 2) / 2;
}

function num(n) {
  const x = Math.round(Number(n) * 10) / 10;
  if (!Number.isFinite(x)) return "0";
  return Number.isInteger(x) ? String(x) : String(x);
}

/* Línea bajo el ejercicio: la sesión pasada, en la unidad que se está viendo. */
export function textoSesionPasada(sets, desde, hacia, tipo) {
  if (!sets || !sets.length) return "";
  const u = hacia === "kg" ? "kg" : "lb";
  const partes = sets.map(([w, r]) => {
    if (tipo === "time") return r + " s";
    if (tipo === "body" || !(Number(w) > 0)) return String(r);
    return num(pesoEnVista(w, desde, hacia)) + "×" + r;
  });
  if (tipo === "time" || tipo === "body") return "sesión pasada: " + partes.join(" · ");
  return "sesión pasada: " + partes.join(" · ") + " " + u;
}
