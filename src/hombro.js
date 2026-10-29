import { DAYS } from "./dias.js";
import { estimateMin } from "./modo.js";
import { stampVariante } from "./variantes.js";
/* Modo rehab de hombro derecho (posterior, detrás del pliegue axilar).
   Pincha al separar el brazo del torso con carga. 3 semanas de adaptación en Push (A) y Pull (B).
   Piernas (C) y core no cambian. Restricción lumbar intacta: todo en máquina, polea o apoyado.

   Registro en estado.datos, clave gymu_hombro_v1:
   { respuestas: [{ fecha, dia: "A"|"B", sesion: "Push"|"Pull", dolor: bool, intensidad: 0-10|null, modo }],
     cerrado: fecha|null }
   Además cada sesión guardada en gymu_history_v1 lleva session.hombro = { dolor, intensidad, semana }
   y cada ejercicio rehab guarda log.dolor (0-10, control rápido por ejercicio). */

export const HOMBRO_KEY = "gymu_hombro_v1";
export const HOMBRO_DIAS = { A: "Push", B: "Pull" };
export const DOLOR_MAX = 3;

/* Pesos de trabajo registrados (última sesión real en gymu_history_v1) y ajuste.
   Redondeo hacia abajo al incremento real de cada máquina. */
const floorStep = (x, s) => Math.max(0, Math.floor(x / s + 1e-9) * s);
export const BASE = {
  a1: { antes: 155, pct: 0.7, step: 5 },   /* Chest Press TRUE 14 oct: 155 lb → -30% */
  a6: { antes: 110, pct: 0.7, step: 5 },   /* Press inclinado 14 oct: 110 lb → -30% */
  a3: { antes: 135, pct: 0.5, step: 5 },   /* Shoulder Press 14 oct: 135 lb × lado → 50% (solo semana 3) */
  b1: { antes: 135, pct: 0.8, step: 15 },  /* Jalón 5 sep: 135 lb → -20% */
  b2: { antes: 135, pct: 0.8, step: 5 },   /* Low Row 5 sep: 135 lb → -20% */
  b3: { antes: 80, pct: 0.8, step: 5 },    /* Remo mancuerna 5 sep: 80 lb → -20% */
  b4: { antes: 40, pct: 0.8, step: 5 },    /* Remo pecho apoyado 5 sep: 40 lb → -20% */
};
export const adjW = (id, bump = 1) => { const b = BASE[id]; return floorStep(b.antes * b.pct * bump, b.step); };

const rep = (n, w, r) => Array.from({ length: n }, () => [w, r]);

/* Ejercicios rehab. rehabFixed: el peso lo dicta la regla (no la progresión normal).
   fresh: peso no registrado; se prueba la primera vez y luego progresa con su historial. */
export function rehabEx(bump = 1) {
  const esc = (w) => Math.round(w * bump * 2) / 2;
  const out = {
    h1: { id: "h1", n: "Rotación externa con banda", lbl: "reps / lado", u: "lb", type: "body", rng: [15, 15], rehab: true, warm: true, yt: "https://www.youtube.com/watch?v=FM1B4lIgk8g", cues: ["Las reps son por lado: 15 de un lado y luego del otro", "Codo pegado al torso (toalla bajo el brazo)", "Gira hacia afuera lento, 2 seg de regreso", "Sin bandas: ⇄ polea, 10 lb por lado", "Sin dolor arriba de 3/10"], prev: rep(3, 0, 15), alt: { n: "Rotación externa en polea", lbl: "lb / lado", factor: 0, w: 10, type: "weight", yt: "https://www.youtube.com/watch?v=FM1B4lIgk8g" } },
    h2: { id: "h2", n: "Rotación interna con banda", lbl: "reps / lado", u: "lb", type: "body", rng: [15, 15], rehab: true, warm: true, cues: ["Las reps son por lado", "Codo pegado al torso, gira hacia el abdomen", "No hay clip de banda hacia adentro: el más cercano es una rotación de hombro; tú gira hacia adentro", "Hombro abajo, sin encoger"], prev: rep(2, 0, 15), alt: { n: "Rotación interna en polea", lbl: "lb / lado", factor: 0, w: 10, type: "weight" } },
    h3: { id: "h3", n: "Escapción con mancuerna hasta 60°", lbl: "× mano", u: "kg", step: 0.5, rng: [12, 12], rehab: true, warm: true, rehabFixed: true, abd: true, yt: "https://www.youtube.com/watch?v=XOAIGRH90RY", cues: ["Brazos 30° al frente del plano lateral", "Pulgar arriba, sube solo hasta 60°", "Sentado con respaldo, lumbar apoyada", "Si el video está de pie, tú hazlo sentado"], prev: rep(2, esc(1), 12), alt: { n: "Escapción en polea hasta 60°", lbl: "× lado", factor: 1 } },
    h4: { id: "h4", n: "Isométrico de abducción en pared", lbl: "segundos", u: "lb", type: "time", rng: [10, 10], rehab: true, warm: true, abd: true, cues: ["Dorso de la mano o el codo contra la pared", "Empuja suave hacia afuera, sin subir el brazo", "Intensidad baja: sin pinchazo"], prev: rep(5, 0, 10), alt: { n: "Abducción isométrica en polea", lbl: "segundos", factor: 1 } },
    h5: { id: "h5", n: "Face pull en polea (ligero)", lbl: "stack", u: "lb", step: 5, rng: [15, 15], rehab: true, warm: true, fresh: true, yt: "https://www.youtube.com/watch?v=rep-qVOkqgk", cues: ["Cuerda a la altura de la cara", "Codos altos, separa la cuerda al final", "Ligero: es calentamiento"], prev: rep(2, 0, 15), alt: { n: "Face pull con banda", lbl: "banda", factor: 1 } },
    a1r: { id: "a1r", n: "Chest Press · rango parcial", lbl: "stack total", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "a1", cues: ["No pases del nivel del pecho al bajar", "Escápulas atrás y abajo", "Control: 2 seg de bajada"], prev: rep(4, adjW("a1", bump), 10), alt: { n: "Press mancuernas · rango parcial", lbl: "× mano", factor: 0.4 } },
    a6r: { id: "a6r", n: "Press inclinado · rango parcial", lbl: "total con barra", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "a6", cues: ["La barra no baja más que el nivel del pecho", "Banco a 30°, espalda apoyada", "Sin rebote"], prev: rep(3, adjW("a6", bump), 10), alt: { n: "Press máquina inclinado · rango parcial", lbl: "stack", factor: 2.2 } },
    a3r: { id: "a3r", n: "Shoulder Press · agarre neutro", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "a3", cues: ["Palmas enfrentadas", "Lumbar apoyada siempre", "Para si pincha arriba de 3/10"], prev: rep(3, adjW("a3", bump), 10), alt: { n: "Shoulder press en máquina", lbl: "× lado", factor: 1 } },
    a5r: { id: "a5r", n: "Escapción 2-3 kg hasta 60°", lbl: "× mano", u: "kg", step: 0.5, rng: [12, 15], rehab: true, rehabFixed: true, abd: true, of: "a5", yt: "https://www.youtube.com/watch?v=XOAIGRH90RY", cues: ["Reemplaza a laterales estas 3 semanas", "Pulgar arriba, hasta 60°, plano escapular", "Sentado con respaldo"], prev: rep(3, esc(2), 12), alt: { n: "Escapción en polea hasta 60°", lbl: "× lado", factor: 1 } },
    /* Trabajo de hombro en semana 1 con molestia. No es la escapción de h3. */
    a13r: { id: "a13r", n: "Abducción en máquina (ligero)", lbl: "× lado", u: "lb", step: 5, rng: [12, 15], rehab: true, rehabFixed: true, abd: true, of: "a5", cues: ["Sentado, lumbar contra el respaldo", "Poco peso: sube solo hasta la altura del hombro", "Codos suaves, sin encoger el trapecio", "Si pincha más de 3/10, baja la carga"], prev: rep(3, 5, 12), alt: { n: "Abducción en polea, ligera", lbl: "× lado", factor: 1 } },
    a12r: { id: "a12r", n: "Face pull en polea", lbl: "stack", u: "lb", step: 5, rng: [15, 15], rehab: true, fresh: true, yt: "https://www.youtube.com/watch?v=rep-qVOkqgk", cues: ["Codos altos, separa la cuerda", "Aprieta atrás 1 seg", "Sin arquear la lumbar"], prev: rep(3, 0, 15), alt: { n: "Face pull con banda", lbl: "banda", factor: 1 } },
    b1r: { id: "b1r", n: "Jalón · agarre neutro", lbl: "stack", u: "lb", step: 15, rng: [8, 12], rehab: true, rehabFixed: true, of: "b1", cues: ["Agarre neutro (palmas enfrentadas)", "Arriba no dejes que el hombro se vaya al frente/arriba", "Codos al bolsillo"], prev: rep(4, adjW("b1", bump), 10), alt: { n: "Jalón un brazo", lbl: "× lado", factor: 0.5 } },
    b2r: { id: "b2r", n: "Low Row · agarre neutro", lbl: "stack", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "b2", cues: ["Agarre neutro", "Al regresar no protraigas el hombro", "Escápulas atrás al final"], prev: rep(4, adjW("b2", bump), 10), alt: { n: "Remo en máquina", lbl: "stack", factor: 1 } },
    b3r: { id: "b3r", n: "Remo mancuerna · neutro", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "b3", cues: ["Rodilla y mano al banco", "Abajo no dejes caer el hombro", "Codo pegado"], prev: rep(3, adjW("b3", bump), 10), alt: { n: "Remo en polea un brazo", lbl: "× lado", factor: 0.6 } },
    b4r: { id: "b4r", n: "Remo pecho apoyado · neutro", lbl: "× mano", u: "lb", step: 5, rng: [8, 12], rehab: true, rehabFixed: true, of: "b4", cues: ["Pecho pegado al pad", "Agarre neutro", "Sin estirar el hombro al frente abajo"], prev: rep(3, adjW("b4", bump), 10), alt: { n: "Remo pecho un brazo", lbl: "× lado", factor: 1 } },
    /* Mismo hueco que b10/b5. El ⇄ no puede ser el jalón neutro: ese ya es b1r en la misma sesión. */
    b10r: { id: "b10r", n: "Pull-up asistido · agarre neutro", lbl: "asistencia", u: "lb", step: 5, rng: [8, 12], type: "assist", rehab: true, rehabFixed: true, of: "b10", yt: "https://www.youtube.com/watch?v=AC_InwiYLeo", cues: ["Agarre neutro: palmas enfrentadas", "No te cuelgues del todo. Para antes de estirar el hombro arriba", "Si pincha más de 3/10, cambia con ⇄ al pull-up con banda", "Menos asistencia = más difícil"], prev: rep(3, 90, 10), alt: { n: "Pull-up con banda · agarre neutro", lbl: "reps", factor: 0, type: "body" } },
    b12r: { id: "b12r", n: "Rotación externa en polea 90°", lbl: "stack", u: "lb", step: 5, rng: [12, 12], rehab: true, fresh: true, cues: ["Codo a la altura del hombro, apoyado si se puede", "Gira hacia arriba lento", "Ligero: sin pinchazo"], prev: rep(3, 0, 12), alt: { n: "Rotación externa con banda a 90°", lbl: "banda", factor: 1 } },
  };
  Object.values(out).forEach(stampVariante);
  return out;
}
export const REHAB_IDS = { A: ["h1", "h2", "h3", "h4", "h5", "a1r", "a6r", "a3r", "a5r", "a13r", "a12r"], B: ["h1", "h2", "h3", "h4", "h5", "b1r", "b2r", "b3r", "b4r", "b10r", "b12r"] };
export function rehabCatalog(dayId) { const all = rehabEx(); return (REHAB_IDS[dayId] || []).map((id) => all[id]); }

/* ---------- Registro ---------- */
export function blankReg(r) { return { respuestas: Array.isArray(r && r.respuestas) ? r.respuestas : [], cerrado: (r && r.cerrado) || null }; }

/* La pregunta desaparece cuando hay "no" en los 2 últimos Push y en los 2 últimos Pull. */
export function salidaCumplida(reg) {
  const rs = blankReg(reg).respuestas;
  const ok = (d) => { const xs = rs.filter((x) => x.dia === d).slice(-2); return xs.length === 2 && xs.every((x) => !x.dolor); };
  return ok("A") && ok("B");
}
export function preguntaActiva(reg, dayId) {
  if (!HOMBRO_DIAS[dayId]) return false;
  const r = blankReg(reg);
  return !r.cerrado && !salidaCumplida(r);
}
export function registrar(reg, { fecha, dia, dolor, intensidad, modo }) {
  const r = blankReg(reg);
  const respuestas = [...r.respuestas, { fecha, dia, sesion: HOMBRO_DIAS[dia], dolor: !!dolor, intensidad: dolor ? Math.max(0, Math.min(10, Number(intensidad) || 0)) : 0, modo: modo || null }];
  const next = { respuestas, cerrado: r.cerrado };
  if (salidaCumplida(next)) next.cerrado = fecha;
  return next;
}

/* Semana del programa rehab (1-3), contada desde el primer "sí". */
export function semanaRehab(reg, now = new Date()) {
  const first = blankReg(reg).respuestas.find((x) => x.dolor);
  if (!first) return 1;
  const d = Math.floor((now.getTime() - new Date(first.fecha).getTime()) / (7 * 86400000));
  return Math.max(1, Math.min(3, d + 1));
}

/* Progresión: por cada semana completa (desde el primer sí) en la que la abducción no pinchó
   (todos los controles de dolor de escapción/isométrico = 0, al menos uno), +10% en press y escapción. */
export function bumpRehab(reg, hist, now = new Date()) {
  const first = blankReg(reg).respuestas.find((x) => x.dolor);
  if (!first) return 1;
  const t0 = new Date(first.fecha).getTime();
  const weeks = Math.floor((now.getTime() - t0) / (7 * 86400000));
  let f = 1;
  for (let w = 0; w < weeks; w++) {
    const a = t0 + w * 7 * 86400000; const b = a + 7 * 86400000;
    const vals = [];
    (hist || []).forEach((s) => {
      const t = new Date(s.date).getTime();
      if (t < a || t >= b || !s.logs) return;
      ["h3", "h4", "a5r", "a13r"].forEach((id) => { const l = s.logs[id]; if (l && typeof l.dolor === "number") vals.push(l.dolor); });
    });
    if (vals.length && vals.every((v) => v === 0)) f *= 1.1;
  }
  return f;
}

/* ---------- Día ajustado ---------- */
/* Mismo gesto: en Relajado no puede salir dos veces (calentamiento y trabajo). */
const MISMO_GESTO = { h3: "escapcion", a5r: "escapcion", h5: "facepull", a12r: "facepull", a13r: "abduccion-maquina", h4: "abduccion-iso" };
export function idsRepetidos(ids) {
  const seen = Object.create(null);
  const dups = [];
  (ids || []).forEach((id) => {
    if (seen[id]) dups.push(id);
    seen[id] = true;
    const g = MISMO_GESTO[id];
    if (!g) return;
    if (seen["@" + g]) dups.push(id);
    seen["@" + g] = id;
  });
  return dups;
}

const cap2 = (ex) => (ex ? { ...ex, maxSets: 2 } : ex);

/* Relajado + dolor en Día A: los principales se quedan, con 2 series.
   a5r es la misma escapción que h3 y a12r es el mismo face pull que h5:
   no se copian al trabajo. En esos huecos van el press sentado (lumbar
   apoyada, sin carga axial) y los fondos que ya tiene el día.
   No se agregan sentadilla, peso muerto ni nada con carga en la columna. */
export function relajadoPushRehab(hombro) {
  const R = rehabEx((hombro && hombro.bump) || 1);
  const base = Object.fromEntries(DAYS.A.ex.map((e) => [e.id, e]));
  const warmIds = ["h1", "h2", "h3", "h4", "h5"];
  const work = [
    ["a1r", R.a1r],
    ["a2", base.a2],
    ["a6r", R.a6r],
    ["a3r", R.a3r],
    ["a9", base.a9],
    ["a10", base.a10],
  ];
  const secs = [
    { t: "Calentamiento hombro", note: "Una vez. No se repite después.", ids: warmIds },
    { t: "Pecho", note: "Alterna una serie de cada uno, sin prisa: ~1 min entre series", ids: ["a1r", "a2"] },
    { t: "Pecho · ángulo superior", ids: ["a6r"] },
    { t: "Hombro", note: "Press sentado, lumbar apoyada. Sin repetir la escapción.", ids: ["a3r"] },
    { t: "Tríceps", ids: ["a9"] },
    { t: "Cierre · peso corporal", ids: ["a10"] },
  ];
  const byId = {
    ...Object.fromEntries(warmIds.map((id) => [id, cap2(R[id])])),
    ...Object.fromEntries(work.map(([id, ex]) => [id, cap2(ex)])),
  };
  const ex = secs.flatMap((s) => s.ids).map((id) => byId[id]).filter(Boolean);
  return { secs, ex };
}

/* hombro: { dolor: bool, intensidad, semana, bump } o null (pregunta inactiva). */
export function dayForHombro(day, dayId, hombro) {
  if (!day || !hombro || !HOMBRO_DIAS[dayId]) return day;
  const R = rehabEx(hombro.bump || 1);
  const capOf = (id) => { const e = day.ex.find((x) => x.id === id); return e && e.maxSets; };
  if (!hombro.dolor) {
    const warm = { t: "Calentamiento hombro", note: "Sin dolor hoy: mantén rotación externa y face pull", ids: ["h1", "h5"] };
    const d0 = { ...day, secs: [warm, ...day.secs], ex: [R.h1, R.h5, ...day.ex], hombro: { dolor: false } };
    return day.modo === "normal" ? recortarRehab(d0, dayId, 49) : d0;
  }
  if (day.modo === "relajado" && dayId === "A") {
    const built = relajadoPushRehab(hombro);
    return {
      ...day,
      secs: built.secs,
      ex: built.ex,
      hombro: { dolor: true, intensidad: hombro.intensidad, semana: hombro.semana },
      recortados: [],
    };
  }
  const swap = dayId === "A" ? { a1: "a1r", a6: "a6r", a5: "a13r", a3: hombro.semana >= 3 ? "a3r" : null } : { b1: "b1r", b2: "b2r", b3: "b3r", b4: "b4r", b10: "b10r", b5: "b10r" };
  const mapId = (id) => (id in swap ? swap[id] : id);
  let secs = day.secs.map((s) => ({ ...s, ids: [...new Set(s.ids.map(mapId).filter(Boolean))] })).filter((s) => s.ids.length);
  const byId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
  const exOf = (id) => {
    if (R[id]) { const orig = Object.keys(swap).find((k) => swap[k] === id); const cap = orig ? capOf(orig) : null; return cap ? { ...R[id], maxSets: cap } : R[id]; }
    return byId[id];
  };
  const warm = { t: "Calentamiento hombro", note: "Rehab: series completas, registra peso y dolor", ids: ["h1", "h2", "h3", "h4", "h5"] };
  const cierre = dayId === "A" ? { t: "Hombro · cierre", ids: ["a12r"] } : { t: "Hombro · cierre", ids: ["b12r"] };
  secs = [warm, ...secs, cierre];
  const ex = secs.flatMap((s) => s.ids).map(exOf).filter(Boolean);
  const out = { ...day, secs, ex, hombro: { dolor: true, intensidad: hombro.intensidad, semana: hombro.semana } };
  return recortarRehab(out, dayId);
}

/* Relajado y Normal en días rehab: recorta accesorios (nunca rehab, calentamiento, face pull ni rotación externa)
   hasta quedar en la meta del modo, sin bajar de 40 min. Espartano no se recorta. */
export const RECORTE = { A: ["a4", "a11", "a10", "a7", "a9", "a2", "a8"], B: ["b11", "b9", "b8", "b7", "b6"] };
export const META_MIN = { relajado: 42, normal: 50 };
export function recortarRehab(day, dayId, metaFija) {
  const meta = metaFija || META_MIN[day.modo];
  if (!meta) return day;
  let d = day; const fuera = [];
  for (const id of RECORTE[dayId] || []) {
    if (estimateMin(d) <= meta) break;
    if (!d.ex.some((e) => e.id === id)) continue;
    const secs = d.secs.map((s) => ({ ...s, ids: s.ids.filter((x) => x !== id) })).filter((s) => s.ids.length);
    const next = { ...d, secs, ex: d.ex.filter((e) => e.id !== id) };
    if (estimateMin(next) < 40) break;
    d = next; fuera.push(id);
  }
  return { ...d, recortados: fuera };
}

/* Curva de dolor: puntos por sesión. */
export function curvaDolor(reg) {
  return blankReg(reg).respuestas.map((x) => ({ fecha: x.fecha, sesion: x.sesion, v: x.dolor ? x.intensidad : 0 }));
}
