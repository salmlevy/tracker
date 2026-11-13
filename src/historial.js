/* De dónde sale el peso de la sesión pasada.
   Un set sin gymId hereda el gym de su sesión (el 3 nov, si las notas lo dicen).
   No reescribe el historial. */

import { LB2KG, claseHistorial, claseSet, claveVariante } from "./gyms.js";

function comoLog(raw) {
  if (Array.isArray(raw)) return { v: "main", sets: raw, note: "" };
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

/* El set cuenta para este gym. Sin gymId, se usa el de la sesión. */
export function setDelGym(set, sesion, gymId, gyms) {
  const clase = claseSet(set, sesion, gymId, gyms);
  return clase === "estricto" || clase === "respaldo";
}

function paqueteSets(sesion, exId, v, gymId, gyms) {
  if (!sesion || !sesion.logs) return null;
  const l = comoLog(sesion.logs[exId]);
  if (!l) return null;
  if (claveVariante(exId, l.v) !== claveVariante(exId, v)) return null;
  const rows = [];
  let nivel = claseHistorial(sesion, gymId, gyms);
  if (nivel === "no") nivel = "estricto";
  (l.sets || []).forEach((s) => {
    const clase = claseSet(s, sesion, gymId, gyms);
    if (clase === "no") return;
    rows.push([Number(s.w) || 0, Number(s.r) || 0]);
    if (clase === "estricto") nivel = "estricto";
  });
  if (!rows.length) return null;
  return { rows, nivel };
}

/* Series hechas de ese ejercicio, variante y gym. Null si no hay. */
export function setsHechos(sesion, exId, v, gymId, gyms) {
  const pack = paqueteSets(sesion, exId, v, gymId, gyms);
  return pack ? pack.rows : null;
}

/* Las dos últimas del mismo día y variante.
   Primero el mismo gym (id o nota). Si no hay ninguna, la última del día
   que no trae gymId. Una sesión con otro gymId no entra. */
export function lastTwoGym(hist, dayId, ex, v, gymId, gyms) {
  const estricto = [];
  const respaldo = [];
  const rows = hist || [];
  const id = ex && ex.id;
  for (let i = rows.length - 1; i >= 0; i--) {
    const s = rows[i];
    if (!s || s.day !== dayId) continue;
    const pack = paqueteSets(s, id, v, gymId, gyms);
    if (!pack) continue;
    if (pack.nivel === "respaldo") respaldo.push(pack.rows);
    else estricto.push(pack.rows);
  }
  const src = estricto.length ? estricto : respaldo;
  return src.slice(0, 2);
}

/* Solo el gym de esta sesión. El respaldo sin gymId lo resuelve lastTwoGym
   sobre el historial completo, para no meter un EW en el plan de regreso. */
export function sesionTocaGym(sesion, gymId, gyms) {
  if (!sesion || !gymId) return false;
  if (claseHistorial(sesion, gymId, gyms) === "estricto") return true;
  const logs = sesion.logs || {};
  const keys = Object.keys(logs);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === "_extras") continue;
    const l = comoLog(logs[keys[i]]);
    const sets = (l && l.sets) || [];
    if (sets.some((x) => claseSet(x, sesion, gymId, gyms) === "estricto")) return true;
  }
  return false;
}

/* Variante con la que cerró ese ejercicio la última vez en este gym y este día. */
export function varianteDeUltima(hist, dayId, exId, gymId, gyms) {
  const rows = hist || [];
  let respaldo = "";
  for (let i = rows.length - 1; i >= 0; i--) {
    const s = rows[i];
    if (!s || s.day !== dayId || !s.logs || !s.logs[exId]) continue;
    const l = comoLog(s.logs[exId]);
    if (!l) continue;
    const v = l.v === "alt" ? "alt" : (l.v || "main");
    const pack = paqueteSets(s, exId, v, gymId, gyms);
    if (!pack) continue;
    if (pack.nivel === "respaldo") { if (!respaldo) respaldo = v; continue; }
    return v;
  }
  return respaldo || "main";
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
