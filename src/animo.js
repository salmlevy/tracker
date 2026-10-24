/* Toque 1 a 5 de energía y ánimo al cerrar una sesión de Gym o al anotar una corrida.
   Opcional: un toque y listo, se puede omitir. Se guarda como `animo` (1-5) en la sesión
   de gymu_history_v1 o en la corrida de gymu_trote_v1.runs. Las entradas viejas sin
   `animo` siguen igual. */
import { dateKey } from "./regreso.js";

export const ANIMO_PREGUNTA = "¿Cómo terminaste de energía y ánimo?";
export const ANIMO_VALORES = [1, 2, 3, 4, 5];
export const ANIMO_EXTREMOS = { 1: "sin pila", 5: "poderoso" };

export const isAnimo = (v) => Number.isInteger(v) && v >= 1 && v <= 5;

/* Copia con `animo` puesto; con un valor inválido devuelve el mismo objeto. */
export function conAnimo(obj, valor) {
  if (!obj || !isAnimo(valor)) return obj;
  return { ...obj, animo: valor };
}

/* Pone `animo` solo en la sesión con esa fecha. No toca otras sesiones ni otros campos. */
export function animoEnSesion(hist, date, valor) {
  if (!Array.isArray(hist) || !isAnimo(valor)) return hist;
  let idx = -1;
  hist.forEach((s, i) => { if (s && s.date === date) idx = i; });
  if (idx < 0) return hist;
  const out = hist.slice();
  out[idx] = { ...hist[idx], animo: valor };
  return out;
}

/* Pone `animo` solo en esa corrida de trote.runs. El resto del objeto queda igual. */
export function animoEnRun(trote, runId, valor) {
  if (!trote || !Array.isArray(trote.runs) || !isAnimo(valor)) return trote;
  let hit = false;
  const runs = trote.runs.map((r) => {
    if (!r || String(r.id) !== String(runId)) return r;
    hit = true;
    return { ...r, animo: valor };
  });
  return hit ? { ...trote, runs } : trote;
}

/* Corrida de hoy a la que todavía se le pregunta: la última anotada hoy sin `animo`
   (o la que se acaba de responder en esta vista). Las corridas viejas nunca se preguntan. */
export function runParaAnimo(runs, today, timeZone, { slot = null, assign = {}, respondidas = {}, omitidas = {} } = {}) {
  const hoy = dateKey(today, timeZone);
  const deHoy = (runs || []).filter((r) => r && r.id != null
    && String(r.id).startsWith("m")
    && dateKey(r.date, timeZone) === hoy
    && (!slot || assign[r.id] === slot)
    && !omitidas[r.id]
    && (!isAnimo(r.animo) || respondidas[r.id]));
  return deHoy.length ? deHoy[deHoy.length - 1] : null;
}

/* Props del evento animo_respuesta. */
export function animoEventProps(valor, tipo) {
  return { valor, tipo: tipo === "run" ? "run" : "gym" };
}
