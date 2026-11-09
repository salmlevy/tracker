import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { parseNota, applyParsedProtocol, hydrateTroteFromNotas, formatPlanLines, planIsEmpty } from "./parseNota.js";
import { HOMBRO_KEY, HOMBRO_DIAS, DOLOR_MAX, preguntaActiva, registrar, semanaRehab, bumpRehab, rehabCatalog, curvaDolor } from "./hombro.js";
import { MODOS, MODO_INFO, isModo, preselectModo, capSets, estimateMin, modoSeries } from "./modo.js";
import { diaDeSesion } from "./escala.js";
import { activeType, afterCompleteOpenIds, altPrevSets, applyVuelta, cuesFor, firstPendingExId, fmtClock, isKeyboardChromeOpen, keyboardInsetPx, lastOptFor, nextSessionExId, noteFixedBox, optLabel, padPlan, referenciaHref, resolveOpt, sessionExIds, shouldDockNote, stopVuelta, viewEx, vueltaHeldSec, youtubeHref } from "./exTools.js";
import { DAYS, ORDER } from "./dias.js";
import { cierrePreviewEx, previewSrc } from "./clips.js";
import { C, THEME_KEY, applyTheme, loadThemeMode, nextThemeMode, saveThemeMode, themeActionLabel } from "./theme.js";
import { lineaSinCulpa, regresoStats, analyzeReturn, bannerModel, buildReturnPlan, collapseBanner, dateKey, dismissEpisode, episodeId, gapSinceLastGym, hideRunHint, levelAt, manualBaseline, manualChoices, manualProgram, metReturnPlan, planningHist, reactivateEpisode, resolveReturn, runEpisodeId, runHintText, runHintVisible, showRunHint, skipEpisode, startManualReturn, suggestRunReturn, unskipEpisode, useCalculatedReturn } from "./regreso.js";
import { deviceTimeZone, track } from "./track.js";
import { CAMBIOS, cambioForEx, cambiosDeGym, cambiosDeHome, cambiosDeRunning, cambiosDeSesion, dismissCambio, feedbackEventProps, pendingCambios, recordFeedback, saveCambioTexto } from "./cambios.js";
import { chipDoneMap, fechaCorta, fraterHoy, lineaHoy, pickHoy } from "./logros.js";
import { marcaReciente, sessionWins, winMarca } from "./wins.js";
import { ANIMO_EXTREMOS, ANIMO_PREGUNTA, ANIMO_VALORES, animoEnRun, animoEnSesion, animoEventProps, isAnimo, runParaAnimo } from "./animo.js";
import { clampLocal, daysSince, editarFecha, hechaEtiqueta, localInputValue, selloDe, textoDias, textoHaceCorto } from "./calendario.js";
import { abiertoInicial, cierreDe, cierreExport, cierreImport, cierreParaGuardar, cuentaCierre, debeCorrer, faseLado, horaGuardada, leerBorrador, minutosCierre, pasoCierre, planCierre, RUN_DRAFT_KEY, textoCierre, textoReloj } from "./cierre.js";
import { lineaMeta, metaSemanal, textoRacha, textoSemana } from "./meta.js";
import { metasHoy, partesMotivacion } from "./motivacion.js";
import { TIPOS, esRegistro, lectorDe, minutosPlan, planDelSlot } from "./correr.js";
const hoyLocal = () => dateKey(new Date(), deviceTimeZone()) || new Date().toISOString().slice(0, 10);
import { HINT_DICTADO, adjuntoEventProps, aplicarDictado, dictadoErrorText, esDictadoNativo, filesFromClipboard, modoDictado, prepareUpload, runExtra, runFacts, runHasMark, runTypeWord, signAdjunto, transcripcion, uploadAdjunto, uploadErrorText } from "./adjuntos.js";
import { GYM_KEY, GYM_SEL_KEY, HABITUAL_ID, armarSugerencia, asegurarGyms, claveVariante, crearGym, esCargaAxial, etiquetaGym, gymDeSesion, incrementoDefault, leerUbicacion, marcaDeTexto, normalizarGym, pasoNativo, permisoUbicacion, proponerGym, sellarSesion, tieneHistorialEjercicio, usarHistorialPropio } from "./gyms.js";
import { MAQ_KEY, claveMaquina, lineaComparacion, lineaMaquina, maquinaDeGym, maquinaEnNota, maquinasDeSesion, mediaMaquina, musculoDe, registrarMaquina } from "./sustitutos.js";
/* Variante para comparar con la tarjeta sin miniatura. Esta rama la muestra; la otra no. */
const GIF_MINI = true;

/* ============ TOKENS: C vive en theme.js (claro / oscuro) ============ */
const GRAD = "linear-gradient(135deg,#E8102E 0%,#FF6A00 100%)";
const F = { num: "'SF Mono','Roboto Mono',monospace", disp: "'Anton','Arial Black','Avenir Next Condensed',sans-serif" };
const LOGO_SRC = "/entreno-logo.png";
const FLECHA_SRC = "/entreno-flecha.png";
const BrandHome = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 44 }}>
    <img src={LOGO_SRC} alt="ENTRENO" style={{ height: 28, width: "auto", maxWidth: "100%", display: "block", objectFit: "contain" }} />
  </div>
);
const ThemeIcon = ({ mode }) => {
  if (mode === "light") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3.2v1.7M12 19.1v1.7M3.2 12h1.7M19.1 12h1.7M6.15 6.15l1.2 1.2M16.65 16.65l1.2 1.2M6.15 17.85l1.2-1.2M16.65 7.35l1.2-1.2" />
      </svg>
    );
  }
  if (mode === "dark") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.35 4.7A8 8 0 1 0 19.3 15.4 6.35 6.35 0 0 1 15.35 4.7z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4.9a7.1 7.1 0 0 0 0 14.2V4.9z" fill="currentColor" />
    </svg>
  );
};
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.2 13.1 5.4a7.2 7.2 0 0 1 1.8.7l2.2-1 1.8 1.8-1 2.2c.3.6.5 1.2.7 1.8L21 12l-2.2 1.1a7.2 7.2 0 0 1-.7 1.8l1 2.2-1.8 1.8-2.2-1a7.2 7.2 0 0 1-1.8.7L12 20.8l-1.1-2.2a7.2 7.2 0 0 1-1.8-.7l-2.2 1-1.8-1.8 1-2.2a7.2 7.2 0 0 1-.7-1.8L3 12l2.2-1.1c.2-.6.4-1.2.7-1.8l-1-2.2 1.8-1.8 2.2 1c.6-.3 1.2-.5 1.8-.7L12 3.2z" />
  </svg>
);
const ThemeToggle = ({ mode, onChange }) => (
  <button type="button" className="theme-btn" aria-label={themeActionLabel(mode)} onClick={() => onChange(nextThemeMode(mode))} style={{ color: C.dim }}>
    <ThemeIcon mode={mode} />
  </button>
);
const ThemeCtlCtx = React.createContext(null);
const useThemeCtl = () => React.useContext(ThemeCtlCtx);
const BrandFlecha = () => (
  <img src={FLECHA_SRC} alt="" style={{ height: 24, width: "auto", display: "block", pointerEvents: "none" }} />
);
/* Flecha centered in the existing header row; sides keep title/actions so it does not overlay or add a block above. */
const BrandHeader = ({ left, right, style, className }) => {
  const theme = useThemeCtl();
  return (
    <div className={className} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "center", columnGap: 8, ...style }}>
      <div style={{ minWidth: 0 }}>{left}</div>
      <BrandFlecha />
      <div style={{ minWidth: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", columnGap: 4 }}>
        {right || null}
        {theme && <ThemeToggle mode={theme.mode} onChange={theme.setMode} />}
      </div>
    </div>
  );
};
const LB2KG = 0.45359237;

const HKEY = "gymu_history_v1", DKEY = "gymu_draft_v4", UKEY = "gymu_units_v1", RKEY = "gymu_regreso_v1", FKEY = "gymu_cambio_fb_v1";

/* ============ HELPERS ============ */
const score = (w, r) => (w > 0 ? w * (1 + r / 30) : r);
const lastOfDay = (hist, d) => { for (let i = hist.length - 1; i >= 0; i--) if (hist[i].day === d) return hist[i]; return null; };
/* fechas semilla: última sesión real registrada vía chat (se actualizan en cada iteración) */
const SEED_LAST = { A: "2026-08-05T20:00:00", B: "2026-08-02T17:38:00", C: "2026-08-01T12:00:00" };
const lastDateOf = (hist, d) => { const l = lastOfDay(hist, d); return l ? l.date : SEED_LAST[d]; };
const roundStep = (x, s) => Math.max(0, Math.round(x / s) * s);
const norm = (l) => (Array.isArray(l) ? { v: "main", sets: l, note: "" } : l || { v: "main", sets: [], note: "" });
function trackNote(ambito, ex, prev, next) {
  const a = String(next || "").trim();
  const b = String(prev || "").trim();
  if (!a || a === b) return;
  const props = { ambito };
  if (ex) props.ex = ex;
  track("nota_guardada", props);
}
const toView = (w, nu, vu) => (nu === vu ? w : Math.round((nu === "lb" ? w * LB2KG : w / LB2KG) * 2) / 2);
const dispV = (w, nu, vu) => (nu === vu ? String(w) : "≈" + toView(w, nu, vu));
const fromView = (x, nu, vu, st) => (nu === vu ? x : Math.round((nu === "lb" ? x / LB2KG : x * LB2KG) * 10) / 10);
/* First unfinished set of THIS exercise (not session-wide). -1 if all done. */
function dueSetIndex(sets, n) {
  for (let i = 0; i < n; i++) if (!(sets[i] && sets[i].done)) return i;
  return -1;
}

/* últimas DOS sesiones reales de esa variante */
function lastTwo(hist, dayId, ex, v) {
  const vid = claveVariante(ex.id, v);
  const out = [];
  for (let i = hist.length - 1; i >= 0 && out.length < 2; i--) {
    if (hist[i].day !== dayId) continue;
    const l = hist[i].logs && hist[i].logs[ex.id] ? norm(hist[i].logs[ex.id]) : null;
    const lv = l && claveVariante(ex.id, l.v);
    if (l && lv === vid) {
      const d = l.sets.filter((s) => s && s.done).map((s) => [s.w, s.r]);
      if (d.length) out.push(d);
    }
  }
  return out;
}
function prevFor(hist, dayId, ex, v) {
  if (ex.rehabFixed && v !== "alt") return { sets: ex.prev, real: false };
  const two = lastTwo(hist, dayId, ex, v);
  if (two.length) return { sets: two[0], real: true };
  if (v === "alt") return { sets: altPrevSets(ex.prev, ex.alt, ex.step), real: false };
  /* fresh: first log starts empty so he can probar fuerza; later sessions use lastTwo */
  if (ex.fresh) return { sets: [], real: false, probe: true };
  return { sets: ex.prev, real: true };
}
function bestPrev(hist, dayId, ex, v) {
  const p = prevFor(hist, dayId, ex, v);
  let b = 0;
  p.sets.forEach(([w, r]) => { b = Math.max(b, score(w, r)); });
  const vid = claveVariante(ex.id, v);
  hist.forEach((s) => {
    if (s.day !== dayId || !s.logs || !s.logs[ex.id]) return;
    const l = norm(s.logs[ex.id]); const lv = claveVariante(ex.id, l.v);
    if (lv === vid) l.sets.forEach((x) => { if (x && x.done) b = Math.max(b, score(x.w, x.r)); });
  });
  return b;
}
/* Plan estratégico: doble progresión + consolidación si la semana pasada hubo retroceso */
/* Little win de marca: compara las series hechas hoy con la mejor serie de la última sesión. */
function winForEx(hist, dayId, ex, v, sets, viewU) {
  if (ex.warm) return null;
  const two = lastTwo(hist, dayId, ex, v);
  if (!two.length) return null;
  const vu = viewU || ex.u;
  const name = v === "alt" && ex.alt ? ex.alt.n : ex.n;
  const type = activeType(ex, v) || "weight";
  return winMarca({ name, type, unit: vu, sets, mark: marcaReciente(two[0], type), toView: (w) => toView(w, ex.u, vu) });
}
/* Toque 1 a 5 de energía y ánimo. Opcional, un toque y listo. */
const AnimoAsk = ({ value, onPick, onSkip, bare }) => (
  <div data-animo className={bare ? "flex flex-col gap-2" : "rounded-2xl p-3 flex flex-col gap-2"} style={bare ? { borderTop: `1px dashed ${C.line}`, paddingTop: 8, marginTop: 4 } : { background: C.card, border: `1px solid ${C.line}` }}>
    <div className="flex items-center justify-between gap-2">
      <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{ANIMO_PREGUNTA}</span>
      {!isAnimo(value) && <button type="button" onClick={onSkip} style={{ fontSize: 12, color: C.dim, background: "transparent", minHeight: 32, flexShrink: 0 }}>Omitir</button>}
    </div>
    <div className="flex gap-1" role="group" aria-label={ANIMO_PREGUNTA}>
      {ANIMO_VALORES.map((v) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onPick(v)} className="rounded-xl font-bold" style={{ flex: 1, minHeight: 44, fontFamily: F.num, fontSize: 16, background: value === v ? C.acc : C.card2, color: value === v ? C.accText : C.txt, border: `1px solid ${value === v ? C.acc : C.line}` }}>{v}</button>
      ))}
    </div>
    <div className="flex justify-between" style={{ fontSize: 11, color: C.dim }}>
      <span>{ANIMO_EXTREMOS[1]}</span>
      <span>{isAnimo(value) ? "Anotado" : ""}</span>
      <span>{ANIMO_EXTREMOS[5]}</span>
    </div>
  </div>
);

const WinLine = ({ children }) => (
  <div data-win style={{ fontSize: 13, color: C.good, lineHeight: 1.35, borderLeft: `2px solid ${C.good}`, paddingLeft: 8 }}>{children}</div>
);
function planFor(hist, dayId, ex, v, mode) {
  const shown = viewEx(ex, v) || ex;
  const type = shown.type || "";
  const [lo, hi] = ex.rng; const st = shown.step || 5;
  const two = lastTwo(hist, dayId, ex, v);
  const prev = prevFor(hist, dayId, ex, v);
  if (prev.probe) {
    const n = ex.nSets || (ex.prev && ex.prev.length) || 3;
    return Array.from({ length: n }, () => ({ w: 0, r: lo }));
  }
  const before = two.length > 1 ? two[1] : null;
  /* bloque maduro: todas al tope de reps con forma → subir peso de TODAS (incl. las primeras que iban suaves) */
  const allTop = prev.real && prev.sets.length > 1 && prev.sets.every(([w, r]) => r >= hi);
  /* series rectas (estándar): mismo peso en todas → meta de reps uniforme, sin desorden */
  const sameW = type !== "assist" && type !== "body" && type !== "time" && prev.sets.length > 1 && prev.sets.every(([w]) => w === prev.sets[0][0]);
  let planned;
  if (sameW && prev.real && mode === "grow") {
    const minR = Math.min(...prev.sets.map(([, r]) => r));
    const W = prev.sets[0][0];
    planned = prev.sets.map(() => (minR >= hi ? { w: W + st, r: lo } : { w: W, r: Math.min(hi, minR + 1) }));
  } else {
    planned = prev.sets.map(([w, r], k) => {
      if (mode === "hold" || !prev.real) return { w, r };
      if (type === "time") return { w: 0, r: r >= hi ? r : r + 5 };
      if (type === "body") return { w: 0, r: Math.min(hi, r + 1) };
      if (mode === "recal") return { w: roundStep(w * 0.87, st), r };
      if (before && before[k] && r < before[k][1] && w >= before[k][0]) return { w, r };
      if (type === "assist") return r >= hi ? { w: Math.max(st, w - st), r: lo } : { w, r: Math.min(hi, r + 1) };
      if (allTop) return { w: w + st, r: lo };   /* sube cada serie a su siguiente escalón, reinicia reps */
      if (r >= hi) return { w: w + st, r: lo };
      return { w, r: Math.min(hi, r + 1) };
    });
  }
  return aplicarCarga(capSets(padPlan(planned, ex.nSets, planned[planned.length - 1] || { w: 0, r: lo }), ex), ex);
}
/* Día C con molestia: el peso de la serie es el 80% del plan, al salto de la máquina. */
function aplicarCarga(plan, ex) {
  const p = Number(ex && ex.loadPct);
  if (!plan || !(p > 0) || Math.abs(p - 1) < 1e-9) return plan;
  const st = ex.step || 1;
  return plan.map((s) => ({ ...s, w: Math.max(0, Math.round(((Number(s.w) || 0) * p) / st) * st) }));
}
/* Plan de regreso con el tope de series del modo (nunca agrega series). */
function retPlanFor(hist, ex, v, ret) {
  const b = buildReturnPlan(hist, ex, v, ret);
  if (!b) return b;
  let sets = b.sets;
  const n = ex && ex.nSets;
  if (n) {
    const fill = sets[sets.length - 1] || { w: 0, r: (ex.rng && ex.rng[0]) || 8 };
    sets = capSets(padPlan(sets, n, fill), ex);
  }
  return { ...b, sets: aplicarCarga(sets, ex) };
}
/* En un gym nuevo, 60–70% del último peso de EW. Con historial propio, ese historial. */
function resolverPlan(hist, dayId, ex, v, mode, gym, gyms, ret) {
  const gymId = (gym && gym.id) || HABITUAL_ID;
  const esSub = String(v || "").startsWith("sub:");
  const propio = !esSub && usarHistorialPropio(hist, dayId, ex.id, v, gymId, gyms);
  const shown = viewEx(ex, v) || ex;
  const tipo = shown.type || ex.type || "";
  if (esSub && !tieneHistorialEjercicio(hist, dayId, ex.id, v, gymId, gyms)) {
    const fuente = (hist || []).filter((s) => gymDeSesion(s, gyms) === gymId);
    const base = fuente.length ? fuente : (hist || []).filter((s) => gymDeSesion(s, gyms) === HABITUAL_ID);
    const prev = prevFor(base.length ? base : (hist || []), dayId, ex, "main");
    const sug = armarSugerencia({
      prevSets: prev.sets,
      tipo,
      unidad: ex.u,
      gym: gym && gym.id !== HABITUAL_ID ? gym : { id: "sub", unidad: ex.u === "kg" ? "kg" : "lb", incremento: ex.step || 5 },
      nombreOrigen: "EW",
      nSets: ex.nSets || (prev.sets && prev.sets.length) || 3,
    });
    if (sug) return { sets: sug.sets, sugerencia: sug, propio: false, hist: base };
  }
  if (!propio) {
    const hab = (hist || []).filter((s) => gymDeSesion(s, gyms) === HABITUAL_ID);
    const prev = prevFor(hab, dayId, ex, v);
    const sug = armarSugerencia({
      prevSets: prev.sets,
      tipo,
      unidad: ex.u,
      gym,
      nombreOrigen: "EW",
      nSets: ex.nSets || (prev.sets && prev.sets.length) || 3,
    });
    if (sug) return { sets: sug.sets, sugerencia: sug, propio: false, hist: hab };
  }
  const filtrado = (hist || []).filter((s) => gymDeSesion(s, gyms) === gymId);
  if (ret && ret.active) {
    const built = retPlanFor(filtrado, ex, v, ret);
    if (built) return { sets: built.sets, sugerencia: null, propio: true, hist: filtrado, retBuilt: built };
  }
  return { sets: planFor(filtrado, dayId, ex, v, mode), sugerencia: null, propio: true, hist: filtrado };
}
/* Día de la sesión: 6 modos (versión × molestia) contra el mejor momento. */
function sessionDay(dayId, energy, hist, hombro) {
  const d = DAYS[dayId];
  if (!d) return d;
  if (!isModo(energy)) return d;
  const molestia = !!(hombro && (hombro.dolor || hombro.molestia));
  return diaDeSesion(dayId, energy, { molestia, semana: (hombro && hombro.semana) || 1 });
}

/* ============ STORAGE ============ */
async function stGet(k) { try { const r = await window.storage.get(k); return r && r.value ? JSON.parse(r.value) : null; } catch { return null; } }
async function stSet(k, v) {
  try {
    const s = JSON.stringify(v);
    const r = await window.storage.set(k, s);
    if (!r) return false;
    const back = await window.storage.get(k);
    return !!(back && back.value && back.value.length === s.length);
  } catch { return false; }
}
async function stDel(k) { try { await window.storage.delete(k); } catch {} }

/* Notas que enseñan: la última nota de cada ejercicio reaparece la siguiente sesión */
const DEF_NOTES = {
  b1: "Esta máquina solo sube de 15 en 15 (ya configurado así)",
  b2: "Low row de cable: tiro horizontal. La máquina queda en ⇄.",
  b4: "Dos mancuernas a la vez (× mano). La ⇄ es un brazo (× lado).",
  b5: "OJO: quedaron 45/40 registrados. Confirma en el chat si la maquina marca kg o lbs antes de la proxima.",
  b10: "Nuevo: pull-up asistido, agarre prono (palmas adelante).",
  b11: "Nuevo: hiperextensión para espalda baja. Sube solo hasta la línea del cuerpo.",
  b6: "La técnica decae con las series: hay balanceo, mantener bajada lenta",
  c5: "ABductor = ABre (externo, glúteo medio). Si te equivocas de peso en una serie, corrígela tocándola de nuevo tras marcarla.",
  c6: "Respuesta a tu nota: ADuctor = junta hacia aDentro (muslo interno)",
  c9: "S1 de 90 seg: excelente. Revisa que la cadera no caiga al final",
  c7: "Maquina al tope (200). Ya no subimos carga: progresamos con tempo 3-1-1 y reps. Si se agota, pasamos a la variante en polea.",
  c11: "Nuevo: gluteo era tu grupo con menos volumen semanal. Ojo honesto: el ejercicio construye musculo, pero la grasa de una zona no se elimina localmente.",
  a6: "El peso es el total de la barra, discos incluidos. No es por mano.",
  a7: "Se hizo crossover con mancuernas (peso por lado). Ahora es el ejercicio principal; \"Aperturas DB Planas\" quedó como variante ⇄.",
  a2: "Estandarizado a series rectas (mismo peso, misma meta) por tu nota. Respaldado: rectas y pirámides dan hipertrofia similar, pero rectas eliminan el desorden.",
  a8: "Al final de cada serie: press explosivo con la misma barra, MISMAS reps que la serie (finisher, no cuenta para progresión)",
  a11: "S1 de la última sesión fue push-up normal sin rodillas: la progresión avanza. Intenta S1 normal cada vez.",
  c1: "Cuando ya no entran discos: usa la variante ⇄ Prensa 1 Pierna (~50% del peso por pierna, misma hipertrofia, menos carga axial). Respaldado por investigación.",
  c3: "Si S1 sale con menos reps que las últimas, sube el peso de S1: todas deberían ir cerca del fallo, no arrancar suave.",
  c4: "Regla: si tocas peso máx de la máquina con reps máx en todas las series, recalibra subiendo peso (o cambia a variante más difícil).",
};
function lastNoteFor(hist, dayId, ex, v) {
  const vid = v === "alt" ? ex.id + "~alt" : ex.id;
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].day !== dayId) continue;
    const l = hist[i].logs && hist[i].logs[ex.id] ? norm(hist[i].logs[ex.id]) : null;
    const lv = l && claveVariante(ex.id, l.v);
    if (l && lv === vid && l.note) return l.note;
  }
  return DEF_NOTES[ex.id] || null;
}
/* Export a prueba de iOS: share sheet primero, portapapeles después, texto crudo al final */
async function shareOrCopy(txt) {
  try { if (navigator.share) { await navigator.share({ title: "Historial de entrenamiento", text: txt }); return "shared"; } } catch (e) { if (e && e.name === "AbortError") return "aborted"; }
  try { await navigator.clipboard.writeText(txt); return "copied"; } catch {}
  return null;
}

/* ============ ATOMS ============ */
const Chip = ({ on, children, onClick }) => (
  <button onClick={onClick} className="rounded-full font-semibold" style={{
    minHeight: 46, padding: "0 18px", fontSize: 15,
    background: on ? C.accDark : C.card2, color: on ? C.acc : C.mut,
    border: `1px solid ${on ? C.acc : C.line}`,
  }}>{children}</button>
);
const Banner = ({ tone, children }) => (
  <div className="rounded-xl px-3 py-2 text-sm" style={{
    background: tone === "err" ? C.errDark : tone === "good" ? C.goodDark : C.accDark,
    color: tone === "err" ? C.err : tone === "good" ? C.good : C.acc,
    border: `1px solid ${(tone === "err" ? C.err : tone === "good" ? C.good : C.acc)}44`,
  }}>{children}</div>
);
const Step = ({ onClick, children, accent }) => (
  <button type="button" onClick={onClick} className="font-bold" style={{
    width: 36, height: 44, fontSize: 18, flexShrink: 0,
    background: accent ? C.accDark : "transparent", color: accent ? C.acc : C.txt,
  }}>{children}</button>
);
const YtLink = ({ name, ex, yt }) => (
  <a href={youtubeHref(name, yt)}
    target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); track("video_abierto", { ex }); }}
    title="Ver técnica en YouTube" aria-label={"YouTube: " + name}
    className="rounded-lg flex items-center justify-center"
    style={{ width: 44, height: 44, flexShrink: 0, background: "#FF0000", textDecoration: "none", boxSizing: "border-box" }}>
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFFFFF" d="M8 5.2v13.6L19 12z" /></svg>
  </a>
);
const RefLink = ({ name, ex, href }) => (
  <a href={href} data-demo-ref
    target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); track("video_abierto", { ex }); }}
    title="Ver la referencia" aria-label={"Referencia: " + name}
    className="rounded-lg flex items-center justify-center font-bold"
    style={{ minWidth: 44, height: 44, padding: "0 8px", flexShrink: 0, background: "transparent", color: C.acc, border: `1px solid ${C.acc}`, textDecoration: "none", boxSizing: "border-box", fontSize: 11, lineHeight: "13px", textAlign: "center" }}>
    Referencia
  </a>
);
/* El mapa de clips vive en clips.js */
function useNow(on) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [on]);
  return now;
}
/* Reloj de la serie. Corre en trabajo/descanso y se detiene al completar todas. */
const VueltaTimer = ({ clock, onVuelta, refSec }) => {
  const stopped = !!(clock && clock.stopped);
  const running = !!(clock && clock.startedAt && !stopped);
  const now = useNow(running);
  const end = stopped ? clock.stoppedAt : now;
  const total = clock && clock.startedAt ? end - clock.startedAt : 0;
  const phaseMs = clock && clock.startedAt ? end - clock.phaseAt : 0;
  const rest = running && clock.phase === "rest";
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" data-vuelta-timer data-reloj-corriendo={running ? "1" : "0"} style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
      <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: rest || stopped ? C.mut : C.acc }}>
        {stopped ? "FIN" : !running ? "LISTO" : rest ? "DESCANSO" : "TRABAJO"}
      </div>
      <div data-phase-clock style={{ textAlign: "center", fontFamily: F.num, fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: rest || stopped ? C.mut : C.txt }}>{fmtClock((running || stopped) ? phaseMs : 0)}</div>
      <div data-total-clock style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: C.dim }}>
        total {fmtClock(total)}
      </div>
      {typeof refSec === "number" && <div style={{ textAlign: "center", fontSize: 12, color: C.dim }}>referencia {refSec} seg</div>}
      <button type="button" onClick={onVuelta} disabled={stopped} className="w-full rounded-xl font-bold" style={{ minHeight: 52, fontSize: 18, background: stopped ? C.card2 : GRAD, color: stopped ? C.mut : C.accText }}>
        {stopped ? "Listo" : running ? "Vuelta" : "Empezar"}
      </button>
    </div>
  );
};
const PreviewClip = ({ ex, v, opt }) => {
  const src = previewSrc(ex, v, v === "alt" ? null : opt);
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(true); }, [src]);
  if (!src || !ok) return null;
  const mp4 = /\.mp4(\?|$)/i.test(src);
  const mediaStyle = { width: "100%", display: "block", maxHeight: 220, objectFit: "contain", background: "#111318" };
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: C.card2, border: `1px solid ${C.line}` }}>
      {mp4 ? (
        <video src={src} muted loop autoPlay playsInline preload="none" onError={() => setOk(false)} style={mediaStyle} />
      ) : (
        <img src={src} alt="" decoding="async" onError={() => setOk(false)} style={mediaStyle} />
      )}
    </div>
  );
};
/* Cluster: − valor + in one capsule; unit under the control on the active set */
function isNoteField(el) {
  return !!(el && el.classList && el.classList.contains("note-field"));
}
/* iOS Safari shrinks visualViewport. A standalone PWA usually does not: innerHeight
   and visualViewport stay at 100lvh and the keyboard paints on top. position:fixed
   inside .app-scroll is also wrong there — -webkit-overflow-scrolling makes fixed
   stick to the scroller, so scrolling the note lands it under the keys. */
function isiOSDevice() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const platform = (typeof navigator !== "undefined" && navigator.platform) || "";
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}
function readKbMetrics(noteFocused) {
  const hook = typeof window !== "undefined" ? window.__entrenoKb : null;
  if (hook && typeof hook === "object") {
    const inner = hook.innerHeight || 0;
    return {
      innerHeight: inner,
      layoutHeight: hook.layoutHeight || inner,
      vv: hook.vv || { height: inner, offsetTop: 0 },
      focused: hook.focused != null ? !!hook.focused : !!noteFocused,
      useFallback: !!hook.useFallback,
      fallbackPx: hook.fallbackPx,
      headH: hook.headH,
    };
  }
  const inner = window.innerHeight || 0;
  if (!noteFocused) window.__entrenoLayoutH = Math.max(window.__entrenoLayoutH || 0, inner);
  const layout = Math.max(window.__entrenoLayoutH || 0, inner);
  const vv = window.visualViewport;
  let standalone = false;
  try {
    standalone = !!(navigator.standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches));
  } catch { standalone = false; }
  return {
    innerHeight: inner,
    layoutHeight: layout,
    vv: vv ? { height: vv.height, offsetTop: vv.offsetTop || 0 } : { height: inner, offsetTop: 0 },
    focused: !!noteFocused,
    useFallback: isiOSDevice() || standalone,
  };
}
function installedApp() {
  try {
    return !!(navigator.standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches));
  } catch { return false; }
}
/* WebKit bug 254868: en la app instalada, con viewport-fit=cover, 100dvh y
   visualViewport.height quedan cortos (el fondo asoma bajo la barra).
   screen.height sigue siendo el alto físico. Solo se compensa ese faltante,
   y solo si es pequeño: un Safari con barra grande no debe empujar la navegación. */
function syncViewportBox(keyboardOpen) {
  const vv = window.visualViewport;
  const root = document.documentElement;
  const top = vv ? vv.offsetTop || 0 : 0;
  const vvH = vv && vv.height ? vv.height : window.innerHeight;
  const note = keyboardOpen != null ? !!keyboardOpen : root.classList.contains("kb-open");
  root.classList.toggle("pwa", installedApp());
  let y = top;
  let h = vvH;
  if (installedApp() && !note) {
    const screenH = window.__entrenoScreenH > 0 ? window.__entrenoScreenH : (window.screen && window.screen.height) || 0;
    const short = screenH - (top + vvH);
    if (short > 1 && short <= 80) {
      y = 0;
      h = screenH;
    }
  }
  const nextTop = Math.round(y) + "px";
  const nextH = Math.round(h) + "px";
  if (root.style.getPropertyValue("--vv-top") !== nextTop) root.style.setProperty("--vv-top", nextTop);
  if (root.style.getPropertyValue("--vv-h") !== nextH) root.style.setProperty("--vv-h", nextH);
  if (root.style.getPropertyValue("--vv-off") !== nextTop) root.style.setProperty("--vv-off", nextTop);
}
function paintKbChrome(metrics, focused) {
  const kb = keyboardInsetPx(metrics);
  const root = document.documentElement;
  const note = isKeyboardChromeOpen(kb, focused);
  /* El hueco del teclado solo empuja el scroll mientras la nota está abierta.
     Si no, la diferencia del visualViewport (barra de Safari) deja una franja vacía. */
  root.classList.toggle("kb-open", note);
  root.style.setProperty("--kb", (note ? kb : 0) + "px");
  syncViewportBox(note);
  const head = document.querySelector(".sess-head");
  if (head) root.style.setProperty("--sess-head-h", head.offsetHeight + "px");
  return kb;
}
/* The field always lives on document.body (a React portal). iOS would otherwise
   treat position:fixed inside .app-scroll as stuck to that scroller. */
function noteOwnsFocus(el) {
  const active = document.activeElement;
  if (!active || !el) return false;
  if (active === el) return true;
  const panel = el.__notePanel;
  return !!(panel && panel.contains(active));
}
function noteTextWrap(el) {
  const wrap = el && el.parentElement;
  return wrap && wrap.classList && wrap.classList.contains("note-text") ? wrap : null;
}
function releaseNote(el) {
  if (!el) return;
  const panel = el.__notePanel || el;
  delete el.dataset.docked;
  panel.classList.remove("note-docked");
  el.classList.remove("note-docked");
  const text = noteTextWrap(el);
  if (text) ["flex", "minHeight", "display"].forEach((k) => { text.style[k] = ""; });
  ["height", "flex", "minHeight", "maxHeight", "width", "margin", "position", "overflowY"].forEach((k) => { el.style[k] = ""; });
  ["top", "left", "right", "width", "height", "maxHeight", "position", "zIndex", "margin", "overflow"].forEach((k) => { panel.style[k] = ""; });
}
function placeNote(el) {
  if (!el || !isNoteField(el)) return;
  const wrap = el.__noteWrap;
  const panel = el.__notePanel || el;
  const owns = noteOwnsFocus(el);
  const metrics = readKbMetrics(owns);
  const kb = keyboardInsetPx(metrics);
  if (!shouldDockNote(owns, kb)) {
    releaseNote(el);
    return;
  }
  const natural = Math.min(Math.max(el.scrollHeight || 48, 48), 180);
  const extra = (el.__attachExtra || 0) + 56;
  panel.style.position = "fixed";
  panel.style.margin = "0";
  panel.style.right = "auto";
  panel.style.boxSizing = "border-box";
  panel.style.overflow = "hidden";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  if (!el.dataset.docked) {
    el.dataset.docked = "1";
    if (window.scrollY) window.scrollTo(0, 0);
    const bounds = wrap ? wrap.getBoundingClientRect() : null;
    el.__dockWidth = Math.max(120, (bounds && bounds.width) || 0);
    el.__dockLeft = bounds ? bounds.left : 16;
    if (wrap) wrap.style.minHeight = Math.max(72 + extra, wrap.offsetHeight || 72) + "px";
  }
  const head = document.querySelector(".sess-head");
  const headH = metrics.headH != null ? metrics.headH : (head ? head.getBoundingClientRect().height : 0);
  const box = noteFixedBox({ ...metrics, focused: true, fieldHeight: natural + extra, headH, maxH: 280 + extra });
  panel.classList.add("note-docked");
  el.classList.add("note-docked");
  panel.style.top = box.top + "px";
  panel.style.left = (el.__dockLeft != null ? el.__dockLeft : 16) + "px";
  panel.style.width = (el.__dockWidth || Math.max(120, (window.innerWidth || 320) - 32)) + "px";
  panel.style.height = box.height + "px";
  panel.style.maxHeight = box.maxHeight + "px";
  panel.style.zIndex = "80";
  const text = noteTextWrap(el);
  if (text) {
    text.style.display = "flex";
    text.style.flex = "1 1 auto";
    text.style.minHeight = "0";
  }
  el.style.flex = "1 1 auto";
  el.style.height = "100%";
  el.style.minHeight = "0";
  el.style.width = "100%";
  el.style.overflowY = "auto";
}
function syncNoteChrome() {
  const notes = [...document.querySelectorAll("textarea.note-field")];
  const any = notes.some(noteOwnsFocus);
  paintKbChrome(readKbMetrics(any), any);
  notes.forEach((el) => {
    const owns = noteOwnsFocus(el);
    if (shouldDockNote(owns, keyboardInsetPx(readKbMetrics(owns)))) placeNote(el);
    else releaseNote(el);
  });
}
function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => { syncViewportBox(); syncNoteChrome(); };
    window.__entrenoSyncKb = apply;
    apply();
    const onFocus = () => apply();
    const onBlur = () => { setTimeout(apply, 0); };
    window.addEventListener("resize", apply);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    if (vv) {
      vv.addEventListener("resize", apply);
      vv.addEventListener("scroll", apply);
    }
    return () => {
      window.removeEventListener("resize", apply);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
      if (vv) {
        vv.removeEventListener("resize", apply);
        vv.removeEventListener("scroll", apply);
      }
      if (window.__entrenoSyncKb === apply) delete window.__entrenoSyncKb;
    };
  }, []);
}
const Cluster = ({ v, commit, onMinus, onPlus, unit, flex, kind }) => (
  <div style={{ flex: flex || "1 1 128px", minWidth: 128, maxWidth: "100%" }}>
    <div className="flex items-stretch rounded-xl" style={{ border: `1.5px solid ${C.line}`, background: C.card, minWidth: 0 }}>
      <Step onClick={onMinus}>−</Step>
      <input key={v} defaultValue={v} inputMode="decimal" enterKeyHint="done" data-set-input={kind || "num"}
        onFocus={(e) => scrollFieldIntoView(e.target)}
        onBlur={(e) => { const x = parseFloat(String(e.target.value).replace(",", ".")); if (!isNaN(x) && x >= 0) commit(x); }}
        className="set-num text-center font-bold" style={{ flex: "1 0 48px", minWidth: 48, width: 48, padding: "0 4px", height: 44, fontSize: 16, letterSpacing: 0, fontFamily: F.num, background: "transparent", color: "var(--c-txt)", WebkitTextFillColor: "var(--c-txt)", border: "none", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, outline: "none", boxSizing: "border-box" }} />
      <Step accent onClick={onPlus}>+</Step>
    </div>
    <div style={{ textAlign: "center", fontSize: 10, color: C.dim, marginTop: 3, letterSpacing: 1, fontWeight: 700 }}>{unit.toUpperCase()}</div>
  </div>
);
function useAdjuntoUpload(files) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const lock = useRef(false);
  const items = files && Array.isArray(files.items) ? files.items : [];
  const onChange = files && files.onChange;
  const ambito = files && files.ambito;
  const ex = files && files.ex;
  const addFiles = async (list) => {
    const picked = [...(list || [])].filter(Boolean);
    if (!picked.length || !onChange || lock.current) return;
    lock.current = true;
    setErr("");
    const next = items.slice();
    let failed = "";
    for (let i = 0; i < picked.length; i++) {
      setBusy(picked.length > 1 ? "Subiendo " + (i + 1) + " de " + picked.length + "…" : "Subiendo…");
      try {
        const ready = await prepareUpload(picked[i]);
        const ref = await uploadAdjunto(ready, picked[i].name);
        next.push(ref);
        track("adjunto_subido", adjuntoEventProps(ambito, ref.mime, ex));
      } catch (e) {
        failed = uploadErrorText(e);
        break;
      }
    }
    const added = next.length - items.length;
    if (added) onChange(next);
    setBusy("");
    lock.current = false;
    if (failed) setErr(added > 1 ? "Se subieron " + added + ". " + failed : added === 1 ? "Se subió una. " + failed : failed);
  };
  return { err, busy, addFiles, items };
}
/* El input va encima del control, casi invisible. opacity:0 lo ignora iOS y no abre Fotos.
   color transparent: WebKit igual pinta "Seleccionar archivo" si solo bajas la opacidad. */
const fileInputStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", margin: 0, padding: 0, opacity: 0.02, fontSize: 0, lineHeight: 0, zIndex: 2, cursor: "pointer", color: "transparent", WebkitTextFillColor: "transparent", background: "transparent", border: 0, overflow: "hidden" };
const AttachButton = ({ busy, onFiles }) => (
  <label style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, width: "100%", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${C.acc}`, background: C.card, color: C.acc, fontSize: 15, fontWeight: 700 }}>
    {busy || "Adjuntar foto"}
    <input type="file" accept="image/*,application/pdf" multiple className="clip-file"
      onChange={(e) => { const picked = [...(e.target.files || [])]; e.target.value = ""; if (picked.length) onFiles(picked); }}
      style={fileInputStyle} />
  </label>
);
const CamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M6 11a6 6 0 0012 0M12 17v4M8 21h8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const noteIconStyle = () => ({
  position: "relative", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
  overflow: "hidden", color: "var(--c-icon)", background: "var(--c-icon-bg)", border: "1px solid var(--c-icon-border)",
  borderRadius: 12, flexShrink: 0, boxSizing: "border-box",
});
const esIos = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};
function dictarEn(el, { onValue, onHint, ambito }) {
  if (!el) return;
  const ambitoTrack = ambito === "running" ? "running" : "gym";
  const escribir = (said) => {
    const next = aplicarDictado(el.value, said);
    if (next === el.value) return;
    el.value = next;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    if (onValue) onValue(next);
  };
  const teclado = () => {
    el.focus();
    if (onHint) onHint(HINT_DICTADO);
    track("dictado_nota", { ambito: ambitoTrack, modo: "teclado" });
  };
  const Ctor = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (modoDictado({ hasRecognition: !!Ctor, ios: esIos() }) === "teclado") { teclado(); return; }
  if (window.__entrenoRec) {
    try { window.__entrenoRec.abort(); } catch { /* ya cerrado */ }
    window.__entrenoRec = null;
  }
  let rec;
  try { rec = new Ctor(); } catch { teclado(); return; }
  window.__entrenoRec = rec;
  rec.lang = "es-MX";
  rec.interimResults = true;
  rec.continuous = false;
  let latest = "";
  let applied = "";
  const publicar = () => {
    if (!latest || latest === applied) return;
    applied = latest;
    escribir(latest);
    if (onHint) onHint("");
  };
  rec.onstart = () => {
    if (onHint) onHint("Escuchando…");
    track("dictado_nota", { ambito: ambitoTrack, modo: "voz" });
  };
  rec.onresult = (ev) => {
    latest = transcripcion(ev && ev.results);
  };
  rec.onerror = (ev) => {
    const msg = dictadoErrorText(ev && ev.error);
    if (onHint) onHint(msg);
  };
  rec.onend = () => {
    publicar();
    if (window.__entrenoRec === rec) window.__entrenoRec = null;
  };
  try {
    el.focus();
    rec.start();
  } catch {
    window.__entrenoRec = null;
    if (onHint) onHint(dictadoErrorText("start"));
  }
}
const NotaIcono = ({ label, accept, busy, onFiles, children }) => (
  <label aria-label={busy || label} title={label} data-note-icon style={noteIconStyle()}>
    {busy ? <span style={{ fontSize: 12, fontWeight: 700, color: C.mut }}>…</span> : children}
    <input type="file" accept={accept} multiple className="clip-file"
      onChange={(e) => { const picked = [...(e.target.files || [])]; e.target.value = ""; if (picked.length) onFiles(picked); }}
      style={fileInputStyle} />
  </label>
);
const NotaBar = ({ textareaRef, files, busy, onFiles, ambito, onValue, hint, setHint }) => (
  <div className="note-icons flex items-center" data-note-icons style={{ gap: 8, padding: "0 8px 8px", flex: "0 0 auto" }}>
    {files ? <NotaIcono label="Adjuntar" accept="image/*,application/pdf,.pdf" busy={busy} onFiles={onFiles}><CamIcon /></NotaIcono> : null}
    <button type="button" aria-label="Dictar nota" title="Dictar nota" data-note-icon data-dictar
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => dictarEn(textareaRef.current, { onValue, onHint: setHint, ambito })} style={noteIconStyle()}>
      <MicIcon />
    </button>
    {hint ? <span style={{ fontSize: 13, color: C.mut, lineHeight: 1.3 }}>{hint}</span> : null}
  </div>
);
const AdjuntoThumb = ({ item, onOpen }) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let on = true;
    signAdjunto(item.path).then((u) => { if (on && u) setUrl(u); }).catch(() => {});
    return () => { on = false; };
  }, [item.path]);
  const pdf = item.mime === "application/pdf";
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); if (url) onOpen({ url, mime: item.mime, name: item.name }); }}
      aria-label={pdf ? "Ver PDF" : "Ver imagen"}
      style={{ width: 56, height: 56, padding: 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, background: C.card2, flexShrink: 0 }}>
      {pdf ? <span style={{ fontSize: 11, fontWeight: 800, color: C.mut }}>PDF</span> : (url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null)}
    </button>
  );
};
const AdjuntoStrip = ({ items }) => {
  const [full, setFull] = useState(null);
  const list = Array.isArray(items) ? items : [];
  if (!list.length && !full) return null;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {list.length > 0 && (
        <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
          {list.map((a) => <AdjuntoThumb key={a.path} item={a} onOpen={setFull} />)}
        </div>
      )}
      {full && typeof document !== "undefined" ? createPortal(
        <div onClick={() => setFull(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          {full.mime === "application/pdf" ? (
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col" style={{ width: "100%", maxWidth: 480, height: "80%", gap: 8 }}>
              <iframe title={full.name || "PDF"} src={full.url} style={{ flex: 1, width: "100%", border: 0, borderRadius: 12, background: "#fff" }} />
              <a href={full.url} target="_blank" rel="noreferrer" style={{ color: "#fff", fontSize: 14, textAlign: "center" }}>abrir</a>
            </div>
          ) : (
            <img src={full.url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          )}
        </div>,
        document.body,
      ) : null}
    </div>
  );
};
const AdjuntoBox = ({ items, onChange, ambito, ex }) => {
  const upload = useAdjuntoUpload({ items, onChange, ambito, ex });
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col" style={{ gap: 8 }}>
      <AdjuntoStrip items={upload.items} />
      <AttachButton busy={upload.busy} onFiles={upload.addFiles} />
      {upload.err ? <div style={{ fontSize: 14, fontWeight: 700, color: C.warn }}>{upload.err}</div> : null}
    </div>
  );
};
const NoteField = ({ initial, onCommit, ph, rows, files, ambito }) => {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const timers = useRef([]);
  const lecturas = useRef([]);
  const draft = useRef(initial || "");
  const committed = useRef(initial || "");
  const commitRef = useRef(onCommit);
  const seeded = useRef(false);
  const componiendo = useRef(false);
  commitRef.current = onCommit;
  const [hint, setHint] = useState("");
  const [live, setLive] = useState(false);
  const upload = useAdjuntoUpload(files);
  const items = upload.items;
  const bind = (el) => {
    if (!el) return;
    el.__noteWrap = wrapRef.current;
    el.__notePanel = panelRef.current;
    el.__portaled = !!(panelRef.current && panelRef.current.parentElement === document.body);
    el.__attachExtra = (items.length ? 64 : 0) + (upload.err ? 36 : 0);
  };
  const setArea = (el) => {
    ref.current = el;
    if (!el) return;
    /* Sin defaultValue: React reescribiría el valor en cada render y el dictado
       de iOS, que aún no ensució el control, desaparece. Se siembra una vez. */
    if (!seeded.current) {
      seeded.current = true;
      const start = draft.current || "";
      if (el.value !== start) el.value = start;
    }
    bind(el);
  };
  const persist = (value) => {
    const text = value == null ? "" : String(value);
    draft.current = text;
    if (text === committed.current) return;
    committed.current = text;
    if (commitRef.current) commitRef.current(text);
  };
  const reveal = () => {
    bind(ref.current);
    const run = () => syncNoteChrome();
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    run();
    requestAnimationFrame(run);
    /* iOS keyboard animation is ~250–500ms and a PWA often never fires visualViewport. */
    timers.current.push(setTimeout(run, 50), setTimeout(run, 180), setTimeout(run, 360), setTimeout(run, 560), setTimeout(run, 840));
  };
  /* Lee el DOM cuando iOS ya insertó la frase. No mueve el panel en ese momento:
     un reflow cancela el dictado. Si a los 90 ms el texto sigue fuera, se usa data. */
  const programarLectura = (el, extra) => {
    const leer = (ultimo) => {
      if (!el || ref.current !== el) return;
      let val = el.value;
      if (ultimo && extra && extra.data && val === extra.before) {
        val = aplicarDictado(extra.before, extra.data);
        if (el.value !== val) el.value = val;
      }
      persist(val);
    };
    lecturas.current.push(setTimeout(() => leer(false), 0));
    lecturas.current.push(setTimeout(() => leer(true), 90));
  };
  const antesRef = useRef(null);
  antesRef.current = (ev) => {
    if (!ev || !esDictadoNativo(ev.inputType)) return;
    const node = ev.target;
    if (!node) return;
    programarLectura(node, { before: node.value, data: ev.data || "" });
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* React 18 no escucha el beforeinput del DOM: su onBeforeInput es composición y paste. */
    const onBefore = (ev) => { if (antesRef.current) antesRef.current(ev); };
    el.addEventListener("beforeinput", onBefore);
    return () => el.removeEventListener("beforeinput", onBefore);
  }, []);
  useEffect(() => () => {
    timers.current.forEach((id) => clearTimeout(id));
    lecturas.current.forEach((id) => clearTimeout(id));
  }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    const wrap = wrapRef.current;
    if (!el) return;
    bind(el);
    if (live && document.activeElement !== el) el.focus({ preventScroll: true });
    if (live) placeNote(el);
    else releaseNote(el);
    if (wrap && live && panelRef.current) wrap.style.minHeight = Math.max(96, panelRef.current.offsetHeight || 0) + "px";
    else if (wrap) wrap.style.minHeight = "";
  }, [live, upload.err, upload.busy, items.length]); // eslint-disable-line
  const leave = () => {
    const el = ref.current;
    if (el) persist(el.value);
    setTimeout(() => {
      const node = ref.current;
      const panel = node && node.__notePanel;
      const active = document.activeElement;
      if (node && (active === node || (panel && panel.contains(active)))) return;
      if (node) persist(node.value);
      setLive(false);
      syncNoteChrome();
    }, 120);
  };
  const onPaste = (e) => {
    if (!files) return;
    const picked = filesFromClipboard(e.clipboardData);
    if (!picked.length) return;
    e.preventDefault();
    upload.addFiles(picked);
  };
  const alTeclear = (e) => {
    const type = e.nativeEvent && e.nativeEvent.inputType;
    draft.current = e.currentTarget.value;
    if (componiendo.current) return;
    if (esDictadoNativo(type)) {
      programarLectura(e.currentTarget, null);
      return;
    }
    reveal();
  };
  const compact = (rows || 2) <= 1;
  const bar = <NotaBar textareaRef={ref} files={files} busy={upload.busy} onFiles={upload.addFiles} ambito={ambito || (files && files.ambito)} onValue={persist} hint={compact ? "" : hint} setHint={setHint} />;
  const field = (
    <div ref={panelRef} className="note-panel" data-note-panel onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : 6, boxSizing: "border-box", background: C.card2, border: `1px solid ${C.line}`, borderRadius: 12, width: "100%" }}>
      <div className="note-text" style={{ position: "relative", width: "100%", flex: "1 1 auto", minHeight: 0, display: "flex", flexWrap: "nowrap", gap: 8, alignItems: "center", padding: compact ? 6 : 0 }}>
        <textarea ref={setArea} lang="es" placeholder={ph} rows={rows || 2}
          onBlur={leave}
          onFocus={(e) => { draft.current = e.currentTarget.value; setLive(true); reveal(); }}
          onInput={alTeclear}
          onCompositionStart={() => { componiendo.current = true; }}
          onCompositionEnd={(e) => { componiendo.current = false; persist(e.currentTarget.value); }}
          onPaste={onPaste}
          className="rounded-xl text-sm note-field" style={{ background: "transparent", color: "var(--c-txt)", border: "none", resize: "none", outline: "none", minHeight: compact ? 44 : 72, maxHeight: 220, width: compact ? "auto" : "100%", flex: compact ? "1 1 auto" : undefined, minWidth: 0, padding: "10px 12px", boxSizing: "border-box" }} />
        {compact ? bar : null}
      </div>
      {compact && hint ? <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.3, padding: "0 8px 6px" }}>{hint}</div> : null}
      {compact ? null : bar}
      {files && items.length ? <div style={{ padding: "0 8px 8px", flex: "0 0 auto" }}><AdjuntoStrip items={items} /></div> : null}
      {files && upload.err ? <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, lineHeight: 1.3, padding: "0 10px 8px" }}>{upload.err}</div> : null}
    </div>
  );
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div ref={wrapRef} className="note-dock">
        {field}
      </div>
    </div>
  );
};
const CambioAsk = ({ writing, onYes, onNo, onDismiss, onText, nombre }) => {
  const [adj, setAdj] = useState([]);
  const quiet = { minHeight: 32, padding: "0 10px", fontSize: 13, fontWeight: 700, borderRadius: 999, border: `1px solid ${C.line}`, background: "transparent", color: C.mut };
  const label = nombre || "el cambio";
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ padding: "6px 12px 10px" }}>
      {!writing && (
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{ flex: 1, fontSize: 13, color: C.dim, lineHeight: 1.3 }}>¿Te sirvió <span style={{ color: C.txt, fontWeight: 700 }}>{label}</span>?</span>
          <button type="button" aria-label="Sí, me sirvió" onClick={onYes} style={quiet}>sí</button>
          <button type="button" aria-label="No me sirvió" onClick={onNo} style={quiet}>no</button>
          <button type="button" aria-label="Ahora no" onClick={onDismiss} style={{ ...quiet, padding: "0 8px", color: C.dim }}>×</button>
        </div>
      )}
      {writing && (
        <div className="flex flex-col" style={{ gap: 6 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: C.dim }}>{nombre ? nombre + " · " : ""}Qué mejorarías o quitarías</span>
            <button type="button" aria-label="Cerrar" onClick={onDismiss} style={{ ...quiet, minHeight: 28 }}>×</button>
          </div>
          <NoteField ambito="gym" initial="" onCommit={onText} ph="Opcional" rows={2} files={{ items: adj, onChange: setAdj, ambito: "gym" }} />
        </div>
      )}
    </div>
  );
};

/* Fila de serie: pasada vive bajo el título del ejercicio, no aquí.
   locked = later set of THIS exercise; only the due set is editable with orange ✓. */
const SetRow = ({ idx, ghost, cur, update, ex, viewU, onCheck, planT, locked, step }) => {
  const isW = ex.type !== "body" && ex.type !== "time";
  const st = step || ex.step || 5;
  const nowTxt = cur.w > 0 ? `${dispV(cur.w, ex.u, viewU)}×${cur.r}` : String(cur.r);
  if (cur.done) {
    const beat = ghost && score(cur.w, cur.r) >= score(ghost[0], ghost[1]);
    const fail = ex.type !== "time" && planT && cur.w >= planT.w && cur.r < planT.r;
    return (
      <button onClick={onCheck} className="w-full rounded-xl px-3 flex items-center justify-between" style={{ minHeight: 52, background: C.card, border: `1px solid ${beat ? C.good + "66" : C.line}` }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.dim }}>S{idx + 1}</span>
        <span style={{ fontFamily: F.num, fontSize: 19, fontWeight: 800, color: beat ? C.good : C.txt }}>
          {nowTxt}{beat ? " ▲" : ""}
        </span>
        <span style={{ fontSize: 11, color: C.warn, minWidth: 26, textAlign: "center" }}>{cur.f === false ? "⚠" : fail ? "fallo" : ""}</span>
        <span className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: C.good, color: "#FFFFFF", fontWeight: 900, fontSize: 16 }}>✓</span>
      </button>
    );
  }
  if (locked) {
    return (
      <div className="rounded-xl px-3 flex items-center justify-between" style={{ minHeight: 44, background: C.card, border: `1px solid ${C.line}`, opacity: 0.48 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.dim }}>S{idx + 1}</span>
        <span style={{ fontFamily: F.num, fontSize: 15, fontWeight: 700, color: C.past }}>{nowTxt}</span>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-2 flex flex-col gap-2" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
      <div className="flex items-start" style={{ gap: 6, minWidth: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.acc, alignSelf: "center" }}>S{idx + 1}</span>
        {isW && (
          <Cluster kind="peso" flex="1 1 128px" v={dispV(cur.w, ex.u, viewU).replace("≈", "")}
            unit={(viewU === "kg" ? "kg" : "lbs") + (ex.type === "assist" ? " asist" : "")}
            onMinus={() => update({ w: Math.max(0, cur.w - st) })}
            onPlus={() => update({ w: cur.w + st })}
            commit={(x) => update({ w: fromView(x, ex.u, viewU, st) })} />
        )}
        <Cluster kind="reps" flex="1 1 128px" v={cur.r}
          unit={ex.type === "time" ? "seg" : "reps"}
          onMinus={() => update({ r: Math.max(0, cur.r - (ex.type === "time" ? 5 : 1)) })}
          onPlus={() => update({ r: cur.r + (ex.type === "time" ? 5 : 1) })}
          commit={(x) => update({ r: Math.round(x) })} />
        <button onClick={onCheck} className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, flexShrink: 0, background: GRAD, color: C.accText, fontSize: 18, fontWeight: 900, boxShadow: "0 2px 4px rgba(232,16,46,0.35)" }}>✓</button>
      </div>
    </div>
  );
};

const linkBtn = (color) => ({ fontSize: 12, lineHeight: "18px", fontWeight: 700, color, background: "none", border: "none", padding: "0 2px", minHeight: 28 });

const ReturnNotice = ({ ret, regresoUi, gap, onDismiss, onSkip, onUnskip, onCollapse, onReactivate, onManual, onCalculated }) => {
  const [pick, setPick] = useState(false);
  const layoff = ret && (ret.active || ret.dismissed) && ret.gapDays != null ? ret.gapDays : (gap ? gap.gapDays : null);
  const choices = manualChoices(layoff);
  const [weeks, setWeeks] = useState(3);
  const [week, setWeek] = useState(1);
  const openPick = () => {
    const c = manualChoices(layoff);
    setWeeks((c.calculated && c.calculated.weeks) || 3);
    setWeek(1);
    setPick(true);
  };
  const banner = bannerModel(ret, regresoUi);
  const level = levelAt(manualProgram(weeks), week);
  const picker = pick && ((ret && ret.baselineDate) || (gap && gap.lastDate)) ? (
    <div className="rounded-xl px-3 py-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 12, color: C.txt, fontWeight: 700 }}>
        {ret && (ret.active || ret.dismissed) ? `Parón de ${layoff} días.` : `Último Gym hace ${gap && gap.gapDays} día${gap && gap.gapDays === 1 ? "" : "s"}.`}
      </div>
      {choices.calculated ? (
        <div className="flex items-center" style={{ gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.mut }}>Calculado: semana 1 de {choices.calculated.weeks} · {choices.calculated.pct}%</span>
          <button type="button" onClick={() => { onCalculated(); setPick(false); }} style={linkBtn(C.acc)}>Usar calculado</button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>Aún no entra solo. Elige el nivel.</div>
      )}
      <div className="flex items-center" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
        {[2, 3, 4].map((n) => (
          <button key={n} type="button" onClick={() => { setWeeks(n); setWeek((w) => Math.min(w, n)); }} className="rounded-full px-2" style={{ minHeight: 28, fontSize: 12, fontWeight: 800, color: weeks === n ? C.accText : C.txt, background: weeks === n ? C.acc : C.card2, border: `1px solid ${weeks === n ? C.acc : C.line}` }}>{n} sem</button>
        ))}
        {Array.from({ length: weeks }, (_, i) => i + 1).map((n) => (
          <button key={"w" + n} type="button" onClick={() => setWeek(n)} className="rounded-full px-2" style={{ minHeight: 28, fontSize: 12, fontWeight: 700, color: week === n ? C.acc : C.mut, background: "transparent", border: `1px solid ${week === n ? C.acc : C.line}` }}>sem {n} · {levelAt(manualProgram(weeks), n).pct}%</button>
        ))}
      </div>
      <button type="button" onClick={() => { onManual(weeks, week); setPick(false); }} className="rounded-lg font-bold" style={{ marginTop: 8, minHeight: 36, padding: "0 12px", background: GRAD, color: C.accText, fontSize: 13 }}>Empezar en {level ? level.pct : ""}%</button>
    </div>
  ) : null;
  if (ret && ret.active && banner && !banner.collapsed) {
    return (
      <div className="flex flex-col gap-1">
        <div className="rounded-xl px-3 py-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.txt }}>{banner.title}</div>
          <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>{banner.body}</div>
          <div className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
            <button type="button" onClick={onCollapse} style={linkBtn(C.acc)}>Entendido</button>
            {banner.canSkip && <button type="button" onClick={onSkip} style={linkBtn(C.acc)}>saltar</button>}
            {banner.canUndo && <button type="button" onClick={onUnskip} style={linkBtn(C.acc)}>deshacer</button>}
            <button type="button" onClick={openPick} style={linkBtn(C.mut)}>nivel</button>
            <button type="button" onClick={onDismiss} aria-label="Desactivar regreso esta vez" style={{ ...linkBtn(C.dim), marginLeft: "auto", fontSize: 16 }}>×</button>
          </div>
        </div>
        {picker}
      </div>
    );
  }
  if (ret && ret.active && banner) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center" style={{ gap: 8, minHeight: 22 }}>
          <span style={{ fontSize: 11, lineHeight: "16px", color: C.mut, fontFamily: F.num }}>{banner.label}</span>
          {banner.canSkip && <button type="button" onClick={onSkip} style={linkBtn(C.acc)}>saltar</button>}
          {banner.canUndo && <button type="button" onClick={onUnskip} style={linkBtn(C.acc)}>deshacer</button>}
          <button type="button" onClick={openPick} style={linkBtn(C.mut)}>nivel</button>
          <button type="button" onClick={onDismiss} aria-label="Desactivar regreso esta vez" style={{ ...linkBtn(C.dim), marginLeft: "auto", fontSize: 16 }}>×</button>
        </div>
        {picker}
      </div>
    );
  }
  if (ret && ret.dismissed) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center" style={{ gap: 8, minHeight: 22 }}>
          <button type="button" onClick={onReactivate} style={linkBtn(C.acc)}>Reactivar regreso</button>
          <button type="button" onClick={openPick} style={linkBtn(C.mut)}>elegir nivel</button>
        </div>
        {picker}
      </div>
    );
  }
  if (!gap || !gap.lastDate) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col" style={{ gap: 4 }}>
        <button type="button" onClick={() => (pick ? setPick(false) : openPick())} style={{ ...linkBtn(C.acc), textAlign: "left" }}>Empezar regreso</button>
        <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35 }}>Baja solo la carga, de 70 a 100%, sin quitar series.</div>
      </div>
      {picker}
    </div>
  );
};

const RunHint = ({ sug, ui, onHide, onShow }) => {
  if (!sug) return null;
  if (!runHintVisible(sug, ui)) {
    return <button type="button" onClick={onShow} style={linkBtn(C.acc)}>Mostrar sugerencia de regreso</button>;
  }
  return (
    <div className="flex items-center" style={{ gap: 8, minHeight: 22 }}>
      <span style={{ fontSize: 11, lineHeight: "16px", color: C.mut, fontFamily: F.num }}>{runHintText(sug)}</span>
      <button type="button" onClick={onHide} aria-label="Ocultar sugerencia de regreso" style={{ ...linkBtn(C.dim), marginLeft: "auto", fontSize: 16 }}>×</button>
    </div>
  );
};

/* Curva de dolor del hombro derecho por sesión (0-10). */
const CurvaHombro = ({ curva }) => {
  const pts = curva.slice(-12);
  return (
    <div data-curva-hombro className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>HOMBRO DERECHO · DOLOR POR SESIÓN</div>
      <div className="flex items-end" style={{ gap: 6, height: 74, marginTop: 8 }}>
        {pts.map((p, i) => (
          <div key={i} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: F.num, color: p.v > DOLOR_MAX ? C.warn : C.txt }}>{p.v}</div>
            <div style={{ width: "100%", maxWidth: 22, height: Math.max(3, p.v * 5), background: p.v > DOLOR_MAX ? C.warn : p.v === 0 ? C.good : C.acc, borderRadius: 4 }} />
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{p.sesion === "Push" ? "Pu" : "Pl"}</div>
            <div style={{ fontSize: 9, color: C.dim }}>{new Date(p.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HechaLine = ({ value, onChange, tz }) => {
  const ahora = new Date();
  const max = localInputValue(ahora, tz);
  return (
    <label data-hecha style={{ position: "relative", display: "flex", alignItems: "center", minHeight: 48, width: "100%" }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>{hechaEtiqueta(value, ahora, tz)} <span aria-hidden="true">✎</span></span>
      <input
        type="datetime-local"
        aria-label="Fecha y hora de la sesión"
        value={value}
        max={max}
        onChange={(e) => onChange(clampLocal(e.target.value, new Date(), tz))}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
    </label>
  );
};

const FechaEdit = ({ fecha, onPick }) => {
  const tz = deviceTimeZone();
  const hoy = dateKey(new Date(), tz);
  return (
    <label style={{ position: "relative", display: "inline-flex", alignItems: "center", minHeight: 38, flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.acc }}>editar fecha</span>
      <input
        key={dateKey(fecha, tz)}
        type="date"
        aria-label="Editar fecha"
        max={hoy}
        defaultValue={dateKey(fecha, tz)}
        onChange={(e) => { if (e.target.value) onPick(e.target.value); }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
    </label>
  );
};

const MetaSemanalCard = ({ hist, runs, assign, volver, target, decidido }) => {
  const tz = deviceTimeZone();
  const [ahora] = useState(() => new Date());
  const meta = useMemo(() => metaSemanal(hist, runs, ahora, tz), [hist, runs, ahora, tz]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    track("meta_semanal_vista", { hechas: meta.hechas, cumplida: meta.cumplida, semana: meta.semana, racha: meta.racha });
  }, []); // eslint-disable-line
  useEffect(() => {
    if (meta.faltoAyer) return undefined;
    const id = setInterval(() => setIdx((n) => n + 1), 4500);
    return () => clearInterval(id);
  }, [meta.faltoAyer]);
  const logro = meta.cumplida;
  const motivo = useMemo(() => partesMotivacion(hist, runs, volver), [hist, runs, volver]);
  const ejercicios = target && target.kind === "gym" && DAYS[target.id] ? DAYS[target.id].ex : [];
  const metas = useMemo(() => metasHoy({
    decidido: !!decidido,
    kind: target && target.kind,
    id: target && target.id,
    ejercicios,
    hist,
    runs,
    assign,
    hechas: meta.hechas,
    meta: meta.meta,
  }), [decidido, target, ejercicios, hist, runs, assign, meta]);
  const tocar = () => {
    track("meta_semanal_toque", { hechas: meta.hechas, cumplida: meta.cumplida, semana: meta.semana, racha: meta.racha });
    if (!meta.faltoAyer) setIdx((n) => n + 1);
  };
  return (
    <div
      data-meta-semanal
      role="button"
      tabIndex={0}
      onClick={tocar}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tocar(); } }}
      className="rounded-2xl text-left"
      style={{ display: "block", width: "100%", flexShrink: 0, position: "relative", zIndex: 1, padding: "10px 12px", background: logro ? C.goodDark : C.card, border: `1.5px solid ${logro ? C.good : C.line}` }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: F.disp, lineHeight: 0.9, color: logro ? C.good : C.txt }}>{meta.mostradas}/{meta.meta}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: logro ? C.good : C.acc, fontFamily: F.disp }}>META SEMANAL</div>
          <div style={{ fontSize: 13, color: C.txt, fontWeight: 700, lineHeight: 1.2 }}>{textoSemana(meta)}</div>
          <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.2 }}>{textoRacha(meta.racha)}</div>
        </div>
      </div>
      <div data-porque style={{ fontSize: 13, color: C.mut, marginTop: 6, lineHeight: 1.3 }}>{lineaMeta(meta, idx)}</div>
      {metas[0] ? <div data-little-wins style={{ fontSize: 13, color: C.txt, marginTop: 4, lineHeight: 1.3 }}>{metas[0]}</div> : null}
      {motivo.regreso ? <div data-regreso style={{ fontSize: 13, color: C.txt, marginTop: 2, lineHeight: 1.3 }}>{motivo.regreso}</div> : null}
    </div>
  );
};

const FilaCierre = ({ item, done, onReabrir }) => (
  <button
    type="button"
    data-cierre-id={item.id}
    data-cierre-estado={done ? "hecho" : "espera"}
    disabled={!done}
    aria-pressed={done}
    onClick={done ? () => onReabrir(item.id) : undefined}
    className="rounded-xl text-left"
    style={{ minHeight: 44, padding: "8px 10px", width: "100%", background: done ? C.goodDark : "transparent", border: `1px solid ${done ? C.good : C.line}`, color: C.txt, opacity: done ? 1 : 0.55 }}
  >
    <span className="flex items-center" style={{ gap: 8, minWidth: 0, flexWrap: "wrap" }}>
      <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? C.good : "transparent", color: "#FFFFFF", border: done ? "none" : `1.5px solid ${C.line}`, fontSize: 14, fontWeight: 800 }}>{done ? "✓" : ""}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: done ? C.mut : C.txt, minWidth: 0, overflowWrap: "break-word" }}>{item.n}</span>
      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: C.acc, fontFamily: F.num, flexShrink: 0 }}>{item.dosis}</span>
    </span>
  </button>
);

const CierreCard = ({ plan, hechos, modo, corriendo, abierto, resta, onTerminar, onReabrir, onEmpezar, onSeguir, onSaltar }) => {
  const total = plan.length;
  const n = plan.filter((x) => hechos[x.id]).length;
  const min = minutosCierre(plan);
  const primero = plan.find((x) => !hechos[x.id]) || null;
  if (modo === "siguiente") {
    return (
      <div data-cierre data-cierre-fase="siguiente" data-reloj-corriendo="0" className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}`, maxWidth: "100%" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: C.dim, fontFamily: F.disp }}>SIGUIENTE</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, marginTop: 4 }}>Estiramiento final</div>
        <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35, marginTop: 4 }}>Unos {min} min, cuando termines de correr. El reloj no parte solo.</div>
      </div>
    );
  }
  const activo = modo === "activo";
  const item = activo ? (plan.find((x) => x.id === abierto) || null) : primero;
  const marca = activo ? resta : (item ? item.reloj : 0);
  return (
    <div data-cierre data-cierre-fase={activo ? "activo" : "listo"} data-reloj-corriendo={corriendo ? "1" : "0"} className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}`, maxWidth: "100%" }}>
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: C.acc, fontFamily: F.disp }}>ESTIRAMIENTO FINAL</div>
        <div style={{ fontSize: 12, color: C.mut, fontFamily: F.num, flexShrink: 0 }}>{n}/{total}</div>
      </div>
      <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35 }}>{textoCierre(min)}</div>
      {plan.map((row) => {
        const done = !!hechos[row.id];
        const open = item && row.id === item.id && !done;
        if (!open) return <FilaCierre key={row.id} item={row} done={done} onReabrir={onReabrir} />;
        const faseL = faseLado(row, marca);
        return (
          <div key={row.id} data-cierre-id={row.id} data-cierre-estado="abierto" className="rounded-xl flex flex-col gap-2" style={{ padding: 10, width: "100%", background: C.card2, border: `1px solid ${C.acc}`, minWidth: 0 }}>
            <div className="flex items-baseline" style={{ gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>{row.n}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.acc, fontFamily: F.num }}>{row.dosis}</span>
            </div>
            <div data-cierre-figura={row.id}><PreviewClip ex={cierrePreviewEx(row.id)} /></div>
            <div className="flex items-baseline justify-between" style={{ gap: 8, flexWrap: "wrap" }}>
              <div aria-label="Tiempo restante" style={{ fontSize: 40, fontWeight: 800, fontFamily: F.num, color: C.txt, lineHeight: 1 }}>{textoReloj(marca)}</div>
              {faseL ? <div style={{ fontSize: 13, fontWeight: 700, color: C.acc }}>{faseL}</div> : null}
            </div>
            <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35, overflowWrap: "break-word" }}>{row.texto}</div>
            {!activo ? (
              <button type="button" data-run-accion="empezar-estiramiento" onClick={onEmpezar} className="rounded-xl font-bold" style={{ minHeight: 52, width: "100%", background: GRAD, color: C.accText, fontSize: 17 }}>Empezar estiramiento</button>
            ) : (
              <>
                {!corriendo ? (
                  <button type="button" data-run-accion="seguir" onClick={onSeguir} className="rounded-xl font-bold" style={{ minHeight: 52, width: "100%", background: GRAD, color: C.accText, fontSize: 17 }}>Seguir</button>
                ) : null}
                <button type="button" onClick={() => onTerminar(row.id)} className="rounded-xl font-bold" style={{ minHeight: 48, width: "100%", background: corriendo ? GRAD : C.card, color: corriendo ? C.accText : C.txt, border: corriendo ? "none" : `1px solid ${C.line}`, fontSize: 16 }}>Hecho</button>
              </>
            )}
          </div>
        );
      })}
      {activo && !item ? <div style={{ fontSize: 13, color: C.good, fontWeight: 700 }}>Terminaste el estiramiento.</div> : null}
      <button type="button" data-run-accion="saltar" onClick={onSaltar} className="rounded-xl font-bold" style={{ minHeight: 44, width: "100%", background: "transparent", color: C.mut, border: `1px solid ${C.line}`, fontSize: 15 }}>Saltar estiramiento</button>
    </div>
  );
};

const RegistroCorrida = ({ tipo, plan, runs, onSave }) => {
  const tz = deviceTimeZone();
  const libre = esRegistro(tipo);
  const lector = !libre ? lectorDe(plan) : null;
  const estimado = lector ? minutosPlan(lector.plan) : 0;
  const bloque = useMemo(() => planCierre(runs), [runs]);
  const bloqueRef = useRef(bloque);
  bloqueRef.current = bloque;
  const [fase, setFase] = useState("lista");
  const [hechos, setHechos] = useState({});
  const [abierto, setAbierto] = useState(null);
  const [resta, setResta] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const [salto, setSalto] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cuando, setCuando] = useState(() => localInputValue(new Date(), tz));
  const [tocado, setTocado] = useState(false);
  const [min, setMin] = useState("");
  const [km, setKm] = useState("");
  const [nota, setNota] = useState("");
  const [adjuntos, setAdjuntos] = useState([]);
  const [animo, setAnimo] = useState(null);
  const [animoOff, setAnimoOff] = useState(false);
  const tracked = useRef(false);
  const interactuo = useRef(false);
  const hechosRef = useRef(hechos);
  const restaRef = useRef(resta);
  const abiertoRef = useRef(abierto);
  hechosRef.current = hechos;
  restaRef.current = resta;
  abiertoRef.current = abierto;
  const tocar = () => { interactuo.current = true; };

  useEffect(() => {
    let cancel = false;
    (async () => {
      const raw = await stGet(RUN_DRAFT_KEY);
      if (cancel) return;
      if (!interactuo.current) {
        const d = leerBorrador(raw, bloqueRef.current, tipo);
        if (d) {
          setFase(d.fase);
          setHechos(d.hechos);
          hechosRef.current = d.hechos;
          setAbierto(d.abierto);
          abiertoRef.current = d.abierto;
          const r = d.resta || 0;
          setResta(r);
          restaRef.current = r;
          setSalto(d.salto);
          setMin(d.min);
          setKm(d.km);
          setNota(d.nota);
          if (d.cuando) setCuando(d.cuando);
          setTocado(d.tocado);
          if (d.animo) setAnimo(d.animo);
          setAnimoOff(d.animoOff);
          setAdjuntos(d.adjuntos);
          setCorriendo(false);
        }
      }
      setHydrated(true);
    })();
    return () => { cancel = true; };
  }, [tipo]);

  useEffect(() => {
    if (!hydrated || fase === "lista") return undefined;
    const t = setTimeout(() => {
      stSet(RUN_DRAFT_KEY, {
        tipo, fase, hechos, abierto, resta, salto,
        min, km, nota, cuando, tocado, animo, animoOff, adjuntos,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [hydrated, tipo, fase, hechos, abierto, resta, salto, min, km, nota, cuando, tocado, animo, animoOff, adjuntos]);

  useEffect(() => {
    if (!debeCorrer(fase, corriendo) || !abierto) return undefined;
    let left = restaRef.current;
    const item = (bloqueRef.current || []).find((x) => x.id === abierto);
    if (!item || !(left > 0)) return undefined;
    const t = setInterval(() => {
      left -= 1;
      restaRef.current = left;
      setResta(left);
      if (left <= 0) {
        clearInterval(t);
        const next = pasoCierre(bloqueRef.current, hechosRef.current, abiertoRef.current);
        hechosRef.current = next.hechos;
        setHechos(next.hechos);
        const sig = (bloqueRef.current || []).find((x) => x.id === next.abierto);
        restaRef.current = sig ? sig.reloj : 0;
        setResta(restaRef.current);
        abiertoRef.current = next.abierto;
        setAbierto(next.abierto);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [fase, corriendo, abierto]);

  useEffect(() => {
    if (tocado) return undefined;
    const id = setInterval(() => setCuando(localInputValue(new Date(), tz)), 20000);
    return () => clearInterval(id);
  }, [tocado, tz]);

  const guardarBorrador = (patch) => {
    stSet(RUN_DRAFT_KEY, {
      tipo, fase, hechos, abierto, resta, salto,
      min, km, nota, cuando, tocado, animo, animoOff, adjuntos,
      ...patch,
    });
  };
  const empezarCarrera = () => {
    tocar();
    setFase("carrera");
    setCorriendo(false);
    guardarBorrador({ fase: "carrera" });
  };
  const termineCarrera = () => {
    tocar();
    setFase("despues");
    setCorriendo(false);
    guardarBorrador({ fase: "despues" });
  };
  const empezarEstiramiento = () => {
    tocar();
    const id = abiertoInicial(bloqueRef.current, hechosRef.current);
    const it = (bloqueRef.current || []).find((x) => x.id === id);
    restaRef.current = it ? it.reloj : 0;
    setResta(restaRef.current);
    abiertoRef.current = id;
    setAbierto(id);
    setFase("estirando");
    setCorriendo(!!id);
    guardarBorrador({ fase: "estirando", abierto: id, resta: restaRef.current, hechos: hechosRef.current });
  };
  const seguir = () => {
    tocar();
    if (!(restaRef.current > 0) && abiertoRef.current) {
      const next = pasoCierre(bloqueRef.current, hechosRef.current, abiertoRef.current);
      hechosRef.current = next.hechos;
      setHechos(next.hechos);
      const sig = (bloqueRef.current || []).find((x) => x.id === next.abierto);
      restaRef.current = sig ? sig.reloj : 0;
      setResta(restaRef.current);
      abiertoRef.current = next.abierto;
      setAbierto(next.abierto);
    }
    setFase("estirando");
    setCorriendo(!!abiertoRef.current && restaRef.current > 0);
  };
  const terminarEj = (id) => {
    tocar();
    const next = pasoCierre(bloqueRef.current, hechosRef.current, id);
    hechosRef.current = next.hechos;
    setHechos(next.hechos);
    const sig = (bloqueRef.current || []).find((x) => x.id === next.abierto);
    restaRef.current = sig ? sig.reloj : 0;
    setResta(restaRef.current);
    abiertoRef.current = next.abierto;
    setAbierto(next.abierto);
    setCorriendo(!!next.abierto && corriendo);
  };
  const reabrir = (id) => {
    tocar();
    const it = (bloqueRef.current || []).find((x) => x.id === id);
    const hechos2 = { ...hechosRef.current, [id]: false };
    hechosRef.current = hechos2;
    setHechos(hechos2);
    restaRef.current = it ? it.reloj : 0;
    setResta(restaRef.current);
    abiertoRef.current = id;
    setAbierto(id);
    setFase("estirando");
    setCorriendo(false);
  };
  const saltar = () => {
    tocar();
    setSalto(true);
    setCorriendo(false);
    const el = document.querySelector("[data-run-guardar]");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  };
  const guardar = () => {
    tocar();
    const sello = selloDe(cuando, new Date(), tz);
    let minutos = estimado;
    if (libre) {
      const n = parseFloat(String(min).replace(",", "."));
      if (!(n > 0)) return;
      minutos = Math.round(n);
    }
    if (!(minutos > 0)) return;
    const kmN = parseFloat(String(km).replace(",", "."));
    stDel(RUN_DRAFT_KEY);
    onSave({
      date: sello.date,
      savedAt: sello.savedAt,
      min: minutos,
      km: kmN > 0 ? Math.round(kmN * 100) / 100 : 0,
      nota: nota.trim(),
      adjuntos,
      animo: isAnimo(animo) ? animo : null,
      indoor: tipo === "pot" || tipo === "res",
      cierre: cierreParaGuardar(bloqueRef.current, hechosRef.current),
    });
  };
  if (!hydrated) return <div data-run-fase="carga" style={{ minHeight: 44 }} />;
  const modo = fase === "estirando" ? "activo" : (fase === "despues" ? "listo" : "siguiente");
  const puedeGuardar = fase === "despues" || fase === "estirando";
  const btn = { minHeight: 52, width: "100%", background: GRAD, color: C.accText, fontSize: 17 };
  return (
    <div className="flex flex-col gap-3" data-run-fase={fase}>
      {lector && (
        <div data-lector className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {lector.secciones.map((s) => (
            <div key={s.id}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: C.acc, fontFamily: F.disp }}>{s.titulo.toUpperCase()}</div>
              <div style={{ fontSize: 16, color: C.txt, whiteSpace: "pre-wrap", lineHeight: 1.4, marginTop: 2 }}>{s.texto}</div>
            </div>
          ))}
          {estimado > 0 && <div style={{ fontSize: 13, color: C.mut, fontFamily: F.num }}>Cerca de {estimado} min de carrera</div>}
        </div>
      )}
      {!lector && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Sal a correr</div>
          <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35, marginTop: 4 }}>A tu ritmo. Los minutos los anotas al terminar.</div>
        </div>
      )}
      {fase === "lista" && (
        <button type="button" data-run-accion="empezar" onClick={empezarCarrera} className="rounded-2xl font-bold" style={btn}>Empezar carrera</button>
      )}
      {fase === "carrera" && (
        <div className="flex flex-col gap-2">
          <div style={{ fontSize: 13, fontWeight: 700, color: C.acc }}>En carrera</div>
          <button type="button" data-run-accion="termine" onClick={termineCarrera} className="rounded-2xl font-bold" style={btn}>Terminé la carrera</button>
        </div>
      )}
      <CierreCard
        plan={bloque}
        hechos={hechos}
        modo={modo}
        corriendo={corriendo}
        abierto={abierto}
        resta={resta}
        onTerminar={terminarEj}
        onReabrir={reabrir}
        onEmpezar={empezarEstiramiento}
        onSeguir={seguir}
        onSaltar={saltar}
      />
      {puedeGuardar && (
        <div data-run-guardar className="rounded-2xl p-3 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {salto ? <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.35 }}>Estiramiento saltado. Puedes registrar la carrera igual.</div> : null}
          <HechaLine tz={tz} value={cuando} onChange={(v) => {
            tocar();
            setTocado(true);
            setCuando(v);
            if (!tracked.current) { tracked.current = true; track("fecha_elegida", { ambito: "running" }); }
          }} />
          {libre && (
            <div className="flex gap-2">
              <label style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: 0.6 }}>MINUTOS</div>
                <input inputMode="decimal" value={min} onChange={(e) => { tocar(); setMin(e.target.value); }} aria-label="Minutos" className="w-full rounded-xl" style={{ height: 56, fontSize: 24, fontFamily: F.num, fontWeight: 800, textAlign: "center", background: C.card2, color: C.txt, border: `1px solid ${C.line}` }} />
              </label>
              <label style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: 0.6 }}>KM, OPCIONAL</div>
                <input inputMode="decimal" value={km} onChange={(e) => { tocar(); setKm(e.target.value); }} aria-label="Kilómetros" className="w-full rounded-xl" style={{ height: 56, fontSize: 24, fontFamily: F.num, fontWeight: 800, textAlign: "center", background: C.card2, color: C.txt, border: `1px solid ${C.line}` }} />
              </label>
            </div>
          )}
          <NoteField ambito="running" initial={nota} onCommit={setNota} ph="Cómo se sintió" rows={3} files={{ items: adjuntos, onChange: setAdjuntos, ambito: "running" }} />
          {!animoOff && <AnimoAsk bare value={animo} onSkip={() => setAnimoOff(true)} onPick={(v) => { setAnimo(v); track("animo_respuesta", animoEventProps(v, "run")); }} />}
          <button type="button" onClick={guardar} className="rounded-2xl font-bold" style={{ minHeight: 56, background: GRAD, color: C.accText, fontSize: 18, fontFamily: F.disp, letterSpacing: 1 }}>REGISTRAR</button>
        </div>
      )}
    </div>
  );
};

const chipGym = (on) => ({
  minHeight: 44, padding: "8px 12px", fontSize: 14, fontWeight: 700, lineHeight: 1.2,
  background: on ? C.card2 : C.card, color: on ? C.acc : C.txt,
  border: `1.5px solid ${on ? C.acc : C.line}`, borderRadius: 12, textAlign: "left",
});

function marcaDeFotos(logs) {
  const nombres = [];
  Object.values(logs || {}).forEach((l) => {
    if (!l || typeof l !== "object") return;
    (l.adjuntos || []).forEach((a) => {
      if (a && String(a.mime || "").startsWith("image/") && a.name) nombres.push(a.name);
    });
  });
  return marcaDeTexto(nombres.join(" "));
}

const GymForm = ({ inicial, onSave, onClose, onUbicacion }) => {
  const edit = !!(inicial && inicial.id);
  const [nombre, setNombre] = useState(!edit || inicial.id === HABITUAL_ID ? "" : (inicial.nombre || ""));
  const [unidad, setUnidad] = useState(inicial && inicial.unidad === "kg" ? "kg" : "lb");
  const listo = nombre.trim().length > 0;
  return (
    <div data-gym-form className="flex flex-col gap-2" style={{ marginTop: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.dim }}>
        Nombre
        <input data-gym-nombre aria-label="Nombre del gym" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-xl" style={{ display: "block", marginTop: 4, height: 44, padding: "0 12px", background: C.card2, color: C.txt, border: `1px solid ${C.line}` }} />
      </label>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dim }}>Unidad</div>
      <div className="flex gap-2">
        {["kg", "lb"].map((u) => (
          <button key={u} type="button" onClick={() => setUnidad(u)} style={{ ...chipGym(unidad === u), flex: 1 }}>{u}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" data-gym-ubicacion onClick={onUbicacion} className="rounded-xl" style={{ minHeight: 44, padding: "0 12px", color: C.txt, border: `1px solid ${C.line}`, background: "transparent" }}>Ubicación</button>
        <button type="button" data-gym-guardar disabled={!listo} onClick={() => {
          if (!listo) return;
          const previo = Number(inicial && inicial.incremento);
          const marcaGuardada = String((inicial && inicial.marca) || "");
          const incremento = previo > 0 ? previo : incrementoDefault(marcaGuardada, unidad);
          onSave({ ...(inicial || {}), nombre: nombre.trim(), marca: marcaGuardada, unidad, incremento });
        }} className="rounded-xl font-bold" style={{ flex: 1, minHeight: 44, background: GRAD, color: C.accText, opacity: listo ? 1 : 0.4 }}>Guardar</button>
      </div>
    </div>
  );
};

const GymPicker = ({ gyms, gymId, propuesta, aviso, onElegir, onCrear, onEditar, onConfirmar, onDetectar, onUbicacion }) => {
  const [form, setForm] = useState("");
  const actual = (gyms || []).find((g) => g.id === gymId) || (gyms || [])[0];
  return (
    <div data-gym-picker className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: C.acc, fontFamily: F.disp }}>GYM</div>
      <div className="flex gap-2" role="radiogroup" aria-label="Gym" style={{ flexWrap: "wrap" }}>
        {(gyms || []).map((g) => {
          const on = g.id === gymId;
          return (
            <button key={g.id} type="button" role="radio" aria-checked={on} data-gym-id={g.id} onClick={() => { if (on && g.id !== HABITUAL_ID) setForm(form === "editar" ? "" : "editar"); else { onElegir(g.id); setForm(""); } }} style={chipGym(on)}>{etiquetaGym(g)}</button>
          );
        })}
        <button type="button" data-gym-nuevo onClick={() => setForm(form === "nuevo" ? "" : "nuevo")} style={chipGym(form === "nuevo")}>+ Gym</button>
      </div>
      {propuesta && (
        <div data-gym-propuesta className="flex flex-col gap-2" style={{ background: C.accDark, borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, lineHeight: 1.35 }}>Parece que estás en {propuesta.nombre}</div>
          <button type="button" data-gym-confirmar onClick={onConfirmar} className="rounded-xl font-bold" style={{ minHeight: 44, background: GRAD, color: C.accText }}>Usar este</button>
        </div>
      )}
      {!propuesta ? <button type="button" data-gym-detectar onClick={onDetectar} style={{ alignSelf: "flex-start", minHeight: 32, padding: 0, background: "transparent", color: C.dim, fontSize: 13, fontWeight: 700 }}>Detectar gym</button> : null}
      {aviso ? <div data-gym-aviso style={{ fontSize: 13, color: C.mut, lineHeight: 1.35 }}>{aviso}</div> : null}
      {form === "nuevo" && <GymForm inicial={{ unidad: "lb" }} onUbicacion={onUbicacion} onClose={() => setForm("")} onSave={(g) => { onCrear(crearGym(g)); setForm(""); }} />}
      {form === "editar" && actual && <GymForm inicial={actual} onUbicacion={onUbicacion} onClose={() => setForm("")} onSave={(g) => { onEditar(normalizarGym({ ...actual, ...g, id: actual.id })); setForm(""); }} />}
    </div>
  );
};

/* ============ HOME ============ */
const Home = ({ hombroReg, hist, gyms, gymId, propuesta, avisoGym, onElegirGym, onCrearGym, onEditarGym, onConfirmarGym, onDetectarGym, onUbicacionGym, onStart, onDelete, onEditDate, onImport, msg, troteRef, ongoing, onResume, prefDay, notice, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const [pick, setPick] = useState(null);
  const [energy, setEnergyRaw] = useState(() => preselectModo(hist));
  const modoTouched = useRef(false);
  const setEnergy = (m) => { modoTouched.current = true; setEnergyRaw(m); };
  useEffect(() => { if (!modoTouched.current) setEnergyRaw(preselectModo(hist)); }, [hist.length]); // eslint-disable-line
  const [hDolor, setHDolor] = useState(null);
  const [hInt, setHInt] = useState(null);
  const [molestia, setMolestia] = useState(null);
  useEffect(() => { setHDolor(null); setHInt(null); setMolestia(null); }, [pick]);
  const askHombro = pick && preguntaActiva(hombroReg, pick);
  const hombroOk = !askHombro || hDolor === false || (hDolor === true && hInt != null);
  const molestiaOk = pick !== "C" || molestia !== null;
  const listo = hombroOk && molestiaOk;
  const curva = curvaDolor(hombroReg);
  const [delIdx, setDelIdx] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const [hMsg, setHMsg] = useState(null);
  const [showImp, setShowImp] = useState(false);
  const [writingId, setWritingId] = useState("");
  useEffect(() => { if (prefDay && prefDay.d) setPick(prefDay.d); }, [prefDay]);
  const impRef = useRef(null);
  /* te toca = el día que llevas más tiempo sin hacer */
  const suggested = ORDER.reduce((a, d) => (daysSince(lastDateOf(hist, d)) > daysSince(lastDateOf(hist, a)) ? d : a), ORDER[0]);
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto", paddingTop: "calc(16px + var(--sat))" }}>
      <BrandHeader
        style={{ marginTop: 8 }}
        left={<div>
          <div style={{ fontSize: 13, letterSpacing: 3, color: C.acc, fontWeight: 700, fontFamily: F.disp }}>GYM</div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.1 }}>¿Qué toca hoy?</div>
        </div>}
      />
      {notice && <ReturnNotice {...notice} />}
      <GymPicker gyms={gyms} gymId={gymId} propuesta={propuesta} aviso={avisoGym} onElegir={onElegirGym} onCrear={onCrearGym} onEditar={onEditarGym} onConfirmar={onConfirmarGym} onDetectar={onDetectarGym} onUbicacion={onUbicacionGym} />
      {ongoing && (
        <button onClick={onResume} className="rounded-2xl p-4 text-left" style={{ background: C.goodDark, border: `2px solid ${C.good}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.disp, color: C.good }}>SESIÓN EN CURSO · {DAYS[ongoing.dayId].name.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>{ongoing.count} series capturadas · toca para continuar</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Empezar otro día borra este avance.</div>
        </button>
      )}
      {ORDER.filter((d) => !pick || pick === d).map((d) => {
        const day = DAYS[d];
        const ds = daysSince(lastDateOf(hist, d)); const on = pick === d;
        return (
          <button key={d} onClick={() => setPick(pick === d ? null : d)} className="rounded-2xl p-4 text-left" style={{ background: on ? C.card2 : C.card, border: `1.5px solid ${on ? C.acc : C.line}` }}>
            <div className="flex items-center justify-between">
              <div style={{ fontSize: 21, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>{day.name}</div>
              {suggested === d && <span style={{ fontSize: 11, fontWeight: 700, color: C.good, background: C.goodDark, padding: "3px 8px", borderRadius: 99 }}>TE TOCA</span>}
            </div>
            <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>{day.mus}</div>
            <div style={{ fontSize: 13, color: ds === 0 || ds === 1 ? C.warn : C.mut, marginTop: 6, fontFamily: F.num }}>
              {textoDias(ds)}
            </div>
          </button>
        );
      })}
      {pick && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: F.disp }}>¿Cómo llegas hoy?</div>
          <div className="flex gap-2" role="radiogroup" aria-label="Modo de hoy" style={{ marginTop: 10 }}>
            {MODOS.map((m) => {
              const on = energy === m;
              const conMolestia = askHombro ? hDolor === true : pick === "C" ? molestia === true : false;
              const dm = diaDeSesion(pick, m, { molestia: conMolestia, semana: askHombro && hDolor != null ? semanaRehab(hombroReg) : 1 });
              return (
                <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setEnergy(m)} className="rounded-xl" style={{ flex: 1, minWidth: 0, height: 52, padding: "6px 2px", background: on ? C.card2 : "transparent", border: `1.5px solid ${on ? C.acc : C.line}`, color: on ? C.txt : C.mut }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.disp, lineHeight: "16px", height: 16, whiteSpace: "nowrap", color: on ? C.acc : C.txt }}>{MODO_INFO[m].n}</div>
                  <div style={{ fontSize: 9, fontFamily: F.num, lineHeight: "12px", height: 12, whiteSpace: "nowrap", marginTop: 2 }}>{estimateMin(dm)}m · {modoSeries(dm)}s</div>
                </button>
              );
            })}
          </div>
          {askHombro && (
            <div data-hombro-ask style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: F.disp }}>¿Te sigue doliendo el hombro derecho?</div>
              <div className="flex gap-2" role="radiogroup" aria-label="Dolor de hombro" style={{ marginTop: 8 }}>
                {[[true, "Sí"], [false, "No"]].map(([val, t]) => (
                  <button key={t} type="button" role="radio" aria-checked={hDolor === val} onClick={() => setHDolor(val)} className="rounded-xl font-bold" style={{ flex: 1, minHeight: 44, background: hDolor === val ? C.card2 : "transparent", border: `1.5px solid ${hDolor === val ? C.acc : C.line}`, color: hDolor === val ? C.acc : C.txt }}>{t}</button>
                ))}
              </div>
              {hDolor === true && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: C.mut }}>¿Qué tanto? 0 nada, 10 máximo</div>
                  <div style={{ marginTop: 6 }}><DolorGrid value={hInt} onPick={setHInt} /></div>
                </div>
              )}
              <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
                {hDolor === true ? "Hoy va la versión rehab: calentamiento de hombro, pesos ajustados y control de dolor por ejercicio." : hDolor === false ? "Versión normal, con rotación externa y face pull al calentar." : "Elige para ajustar el día."}
              </div>
            </div>
          )}
          {pick === "C" && (
            <div data-molestia-ask style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: F.disp }}>¿Con molestia hoy?</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Menos peso (80%), más series. Sin carga en la columna.</div>
              <div className="flex gap-2" role="radiogroup" aria-label="Molestia de hoy" style={{ marginTop: 8 }}>
                {[[true, "Sí"], [false, "No"]].map(([val, t]) => (
                  <button key={t} type="button" role="radio" aria-checked={molestia === val} onClick={() => setMolestia(val)} className="rounded-xl font-bold" style={{ flex: 1, minHeight: 44, background: molestia === val ? C.card2 : "transparent", border: `1.5px solid ${molestia === val ? C.acc : C.line}`, color: molestia === val ? C.acc : C.txt }}>{t}</button>
                ))}
              </div>
            </div>
          )}
          <button disabled={!listo} onClick={() => { track("gym_modo_elegido", { modo: energy, molestia: askHombro ? !!hDolor : !!molestia }); onStart(pick, energy, askHombro ? { dolor: hDolor, intensidad: hInt, molestia: !!hDolor } : pick === "C" ? { molestia: !!molestia, dolor: false } : null); }} className="w-full rounded-xl mt-3 font-bold" style={{ minHeight: 52, background: GRAD, color: C.accText, fontSize: 17, opacity: listo ? 1 : 0.4 }}>
            Empezar {DAYS[pick].name}
          </button>
        </div>
      )}
      {msg && <Banner tone={msg.tone}>{msg.t}</Banner>}
      {curva.length > 0 && <CurvaHombro curva={curva} />}
      {hist.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <button onClick={() => setShowHist(!showHist)} className="w-full flex items-center justify-between" style={{ minHeight: 40 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>SESIONES GUARDADAS ({hist.length})</span>
            <span style={{ color: C.dim, fontSize: 16 }}>{showHist ? "−" : "+"}</span>
          </button>
          {showHist && hist.map((s, i) => ({ s, i })).reverse().slice(0, 12).map(({ s, i }) => (
            <div key={i} className="flex flex-col" style={{ gap: 2, borderTop: `1px solid ${C.line}`, padding: "6px 0" }}>
              <div className="flex items-center justify-between gap-2" style={{ minHeight: 36 }}>
                <span style={{ fontSize: 13, color: C.txt, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{DAYS[s.day] ? DAYS[s.day].name : s.day} · {etiquetaGym((gyms || []).find((g) => g.id === gymDeSesion(s, gyms)))}</span>
                <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num }}>{fechaCorta(s.date, deviceTimeZone())}</span>
                <button onClick={() => { if (delIdx === i) { onDelete(i); setDelIdx(null); } else setDelIdx(i); }} className="rounded-lg px-3" style={{ minHeight: 38, fontSize: 12, fontWeight: 700, color: delIdx === i ? C.err : C.dim, background: delIdx === i ? C.errDark : "transparent", border: `1px solid ${delIdx === i ? C.err : C.line}` }}>
                  {delIdx === i ? "¿borrar?" : "✕"}
                </button>
              </div>
              <FechaEdit fecha={s.date} onPick={(d) => onEditDate(i, d)} />
            </div>
          ))}
          {showHist && (
            <button onClick={async () => { const r = await shareOrCopy(JSON.stringify(buildExport(hist, troteRef, gyms), null, 2)); setHMsg(r === "shared" ? { tone: "good", t: "Historial compartido ✓" } : r === "copied" ? { tone: "good", t: "Historial copiado al portapapeles ✓" } : r === "aborted" ? null : { tone: "err", t: "No pude compartir ni copiar en este navegador." }); }} className="w-full rounded-xl font-semibold mt-2" style={{ minHeight: 44, fontSize: 13, background: C.card2, color: C.txt, border: `1px solid ${C.line}` }}>Compartir / Copiar historial (JSON)</button>
          )}
          {hMsg && <div style={{ marginTop: 8 }}><Banner tone={hMsg.tone}>{hMsg.t}</Banner></div>}
        </div>
      )}
      <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <button onClick={() => setShowImp(!showImp)} className="w-full flex items-center justify-between" style={{ minHeight: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>IMPORTAR HISTORIAL (JSON)</span>
          <span style={{ color: C.dim, fontSize: 16 }}>{showImp ? "−" : "+"}</span>
        </button>
        {showImp && (
          <div className="flex flex-col gap-2 mt-2">
            <textarea ref={impRef} rows={4} placeholder="Pega aquí el JSON que exportaste…" className="w-full rounded-xl p-2" style={{ background: C.card2, color: C.txt, border: `1px solid ${C.line}`, fontSize: 12, fontFamily: F.num }} />
            <button onClick={() => {
              try {
                const parsed = importParse(JSON.parse(impRef.current.value));
                if (!Array.isArray(parsed.history)) throw new Error("formato");
                onImport(parsed.history, parsed.trote);
                setHMsg({ tone: "good", t: `Importadas ${parsed.history.length} sesión(es) ✓` });
              } catch { setHMsg({ tone: "err", t: "JSON inválido: revisa lo pegado." }); }
            }} className="rounded-xl font-bold" style={{ minHeight: 46, background: GRAD, color: C.accText, fontSize: 15 }}>Importar</button>
            {!hist.length && hMsg && <Banner tone={hMsg.tone}>{hMsg.t}</Banner>}
          </div>
        )}
      </div>
      {(() => {
        const pending = cambiosDeGym(fb);
        const ask = writingId ? CAMBIOS.find((c) => c.id === writingId) : pending[0];
        if (!ask) return null;
        return (
          <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <CambioAsk
              nombre={ask.nombre}
              writing={!!writingId}
              onYes={() => onCambio(ask, true)}
              onNo={() => { setWritingId(ask.id); onCambio(ask, false); }}
              onDismiss={() => { if (writingId) setWritingId(""); else onCambioDismiss(ask.id); }}
              onText={(t) => onCambioText(writingId, t)}
            />
          </div>
        );
      })()}
    </div>
  );
};

/* ============ TARJETA DE EJERCICIO ============ */
const ExCard = ({ ex, dayId, hist, mode, open, onToggle, onCollapse, log, setLog, viewU, setUnit, gym, gyms, catalogo, ret, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const v = log.v || "main";
  const recMaq = maquinaDeGym(gym, ex.id);
  const maqGuardada = recMaq.confirmada ? recMaq.nombre : "";
  const histUso = useMemo(() => {
    if (!maqGuardada) return hist;
    const k = claveMaquina(maqGuardada);
    return (hist || []).map((s) => {
      const l = s && s.logs && s.logs[ex.id];
      if (l && claveMaquina(l.maquina || "") === k) return s;
      if (!s || !s.logs) return s;
      const logs = { ...s.logs };
      delete logs[ex.id];
      return { ...s, logs };
    });
  }, [hist, maqGuardada, ex.id]);
  const shown = viewEx(ex, v);
  const name = (v === "alt" && ex.alt ? ex.alt.n : ex.n);
  const maqMostrada = String(log.maquina != null ? log.maquina : (recMaq.nombre || "")).trim();
  const subMaq = lineaMaquina(maqMostrada);
  const otroGym = !!(gym && gym.id !== HABITUAL_ID);
  const compMaq = otroGym && log.maquina ? lineaComparacion(catalogo, log.maquina, gym && gym.id) : "";
  const lbl = v === "alt" && ex.alt ? ex.alt.lbl : ex.lbl;
  const resuelto = useMemo(() => resolverPlan(histUso, dayId, ex, v, mode, gym, gyms, ret), [histUso, dayId, ex, v, mode, gym, gyms, ret]); // eslint-disable-line
  const plan = resuelto.sets;
  const sugerencia = resuelto.sugerencia;
  const retPlan = resuelto.retBuilt || null;
  const prev = useMemo(() => (sugerencia ? { sets: [], real: false, probe: false } : prevFor(resuelto.hist, dayId, ex, v)), [sugerencia, resuelto.hist, dayId, ex, v]); // eslint-disable-line
  const best = sugerencia ? Infinity : bestPrev(resuelto.hist, dayId, ex, v);
  const chipWeek = ret && ret.active && ret.program ? Math.min(ret.program.weeks, (ret.week || 1) + (ret.skip || 0)) : 0;
  const sets = log.sets || [];
  const total = plan.length;
  const doneN = sets.filter((s) => s && s.done).length;
  const [flash, setFlash] = useState(null);
  const [mas, setMas] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [clock, setClock] = useState(null);
  const [writingFb, setWritingFb] = useState(false);
  const writingId = useRef("");
  const opt = resolveOpt(log.opt, lastOptFor(hist, dayId, ex, v), ex);
  useEffect(() => { setFlash(null); setShowInfo(false); }, [v]);
  useEffect(() => { setFlash(null); if (!open) setMas(false); }, [open]);
  useEffect(() => {
    if (!ex.opts || !opt || log.opt === opt) return;
    setLog({ ...log, v, opt });
  }, [opt]); // eslint-disable-line

  const curAt = (k) => (sets[k] ? sets[k] : { w: plan[k].w, r: plan[k].r, f: true, done: false });
  const dueIdx = dueSetIndex(sets, total);
  const allSetsDone = (arr) => total > 0 && Array.from({ length: total }, (_, i) => arr[i]).every((s) => s && s.done);
  const painReady = (lg) => typeof lg.dolor === "number" || lg.dolorSkip === true;
  const finishIfReady = (nextLog) => {
    if (!allSetsDone(nextLog.sets || [])) return;
    if (painReady(nextLog)) { if (onCollapse) onCollapse(); return; }
    setMas(true);
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-ex-id="' + ex.id + '"] [data-dolor-ex]');
      if (el) scrollFieldIntoView(el);
    });
  };
  const updateAt = (k, patch) => {
    if (k !== dueIdx) return;
    const arr = [...sets]; arr[k] = { ...curAt(k), ...patch };
    setLog({ ...log, v, sets: arr });
  };
  const checkAt = (k) => {
    const c = curAt(k);
    if (!c.done && k !== dueIdx) return;
    const nowDone = !c.done;
    const arr = [...sets]; arr[k] = { ...c, done: nowDone };
    const next = { ...log, v, sets: arr };
    setLog(next);
    if (!nowDone) { setFlash(null); track("serie_deshecha", { ex: ex.id, dia: dayId }); return; }
    const msgs = [];
    if (best !== Infinity && c.f !== false && score(c.w, c.r) > best) msgs.push({ tone: "good", t: "Récord personal en este ejercicio" });
    const first = arr.find((x) => x && x.done);
    if (first && arr.indexOf(first) < k && c.w === first.w && first.r - c.r >= 2 && k < total - 1)
      msgs.push({ tone: "acc", t: `Fatiga: −${first.r - c.r} reps. Sugerido ${roundStep(c.w * 0.9, ex.step || 5)} en lo que queda` });
    if (c.f === false) msgs.push({ tone: "acc", t: "Serie con técnica rota: no cuenta para subir" });
    setFlash(msgs.length ? msgs : null);
    if (allSetsDone(arr)) {
      setClock((cl) => stopVuelta(cl, Date.now()));
      finishIfReady(next);
    }
    track("serie_completada", { ex: ex.id, dia: dayId });
  };
  const onVuelta = () => {
    if (clock && clock.stopped) return;
    const now = Date.now();
    const held = shown.type === "time" ? vueltaHeldSec(clock, now) : null;
    if (held != null && dueIdx >= 0) {
      const c = curAt(dueIdx);
      if (!c.done) {
        const arr = [...sets];
        arr[dueIdx] = { ...c, w: 0, r: held, f: true, done: true };
        const next = { ...log, v, sets: arr };
        setLog(next);
        track("serie_completada", { ex: ex.id, dia: dayId });
        if (allSetsDone(arr)) {
          setClock((cl) => stopVuelta(cl, now));
          finishIfReady(next);
          return;
        }
        setClock((cl) => applyVuelta(cl, now));
        return;
      }
    }
    setClock((cl) => applyVuelta(cl, now));
  };
  const cambio = cambioForEx(fb, ex.id, gym);
  const answerCambio = (util) => {
    if (!cambio) return;
    writingId.current = cambio.id;
    onCambio(cambio, util);
    setWritingFb(!util);
  };
  const expandIfCollapsed = (e) => { if (e) e.stopPropagation(); if (!open) onToggle(); };
  const toggleOpen = (e) => { if (e) e.stopPropagation(); onToggle(); };
  const toggleMas = (e) => {
    e.stopPropagation();
    setMas((s) => !s);
  };
  const toggleInfo = (e) => {
    e.stopPropagation();
    const willOpen = !open || !showInfo;
    if (!open) onToggle();
    setShowInfo((s) => (open ? !s : true));
    if (willOpen) track("info_abierta", { ex: ex.id, dia: dayId });
  };
  const guardarNota = (t) => {
    trackNote("gym", ex.id, log.note, t);
    const dicha = maquinaEnNota(t);
    const next = { ...log, v, note: t };
    if (dicha && !esCargaAxial(dicha) && claveMaquina(dicha) !== claveMaquina(maqMostrada)) next.maquina = dicha;
    setLog(next);
  };
  const isW = shown.type !== "body" && shown.type !== "time";
  const etiquetaUnidad = viewU === "kg" ? "kg" : "lbs";
  const cambiarUnidad = (e) => {
    e.stopPropagation();
    const next = viewU === "lb" ? "kg" : "lb";
    setUnit(next);
    track("unidad_cambiada", { ex: ex.id, unidad: next });
  };
  const win = winForEx(sugerencia ? [] : resuelto.hist, dayId, ex, v, sets, viewU);
  const lastNote = lastNoteFor(resuelto.hist, dayId, ex, v);
  const paso = pasoNativo(gym, shown);
  const hdrBtn = { width: 40, height: 40, flexShrink: 0, padding: 0, boxSizing: "border-box" };
  const mediaMaq = maqMostrada ? mediaMaquina(maqMostrada, ex) : null;
  const gifV = mediaMaq && mediaMaq.gif ? mediaMaq.v : (v === "alt" ? "alt" : "main");
  const gifSrc = GIF_MINI ? previewSrc(ex, gifV, gifV === "alt" ? null : opt) : null;
  const refHref = v === "alt" ? "" : referenciaHref(ex.ref);
  const ytDeFicha = v === "alt" && ex.alt && ex.alt.yt ? ex.alt.yt : ex.yt;
  const notaDemo = !gifSrc
    ? (refHref ? "Sin gif. La demostración está en " + ex.refNombre + "." : (ytDeFicha ? "Sin gif. La demostración está en el video." : "Sin gif de esta variante."))
    : "";
  const [gifOk, setGifOk] = useState(true);
  const [gifGrande, setGifGrande] = useState(false);
  useEffect(() => { setGifOk(true); setGifGrande(false); }, [gifSrc]);

  return (
    <div data-ex-id={ex.id} data-abierto={open ? "1" : "0"} className="rounded-2xl w-full" onClick={!open ? expandIfCollapsed : undefined} style={{ background: C.card, border: `1.5px solid ${doneN >= total ? C.good + "44" : open ? C.acc : C.line}`, overflow: "hidden", cursor: !open ? "pointer" : undefined }}>
      <div style={{ padding: "10px 10px 10px 12px" }}>
        <div className="flex items-center" style={{ gap: 6, minHeight: 40 }}>
          {gifSrc && gifOk && (
            <button type="button" data-gif-mini aria-expanded={gifGrande} aria-label={gifGrande ? "Cerrar gif" : "Ampliar gif"} onClick={(e) => { e.stopPropagation(); setGifGrande((g) => !g); }}
              style={{ width: 72, height: 72, flexShrink: 0, padding: 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, background: "#111318" }}>
              <img src={gifSrc} alt="" onError={() => setGifOk(false)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center" style={{ gap: 4, minHeight: 40 }}>
          <button type="button" onClick={toggleOpen} className="text-left" aria-label={open ? "Cerrar ejercicio" : "Abrir ejercicio"} style={{ flex: 1, minWidth: 0, background: "transparent", padding: 0, overflow: "hidden" }}>
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 18, fontWeight: 600, fontFamily: F.disp, color: doneN >= total ? C.mut : C.txt }}>{name}</span>
          </button>
          {isW && (
            <button type="button" data-unidad onClick={cambiarUnidad} aria-label={"Unidad " + etiquetaUnidad} className="rounded-lg font-bold"
              style={{ height: 32, minWidth: 36, padding: "0 6px", flexShrink: 0, fontSize: 12, fontFamily: F.num, lineHeight: "30px", color: C.txt, background: C.card2, border: `1px solid ${C.line}` }}>{etiquetaUnidad}</button>
          )}
          <button type="button" onClick={toggleInfo} className="rounded-lg flex items-center justify-center" title="Técnica y notas" aria-label="Técnica y notas" aria-expanded={showInfo}
            style={{ width: 32, height: 32, flexShrink: 0, fontSize: 16, fontWeight: 700, color: showInfo ? C.acc : C.mut, background: showInfo ? C.accDark : "transparent" }}>ⓘ</button>
          {open && (
            <button type="button" onClick={toggleMas} aria-label="Más" aria-expanded={mas} className="rounded-lg" style={{ ...hdrBtn, fontSize: 22, fontWeight: 800, letterSpacing: 1, color: mas ? C.acc : C.mut, background: "transparent" }}>⋯</button>
          )}
        </div>
        {subMaq ? <div data-maquina-linea style={{ fontSize: 13, fontWeight: 600, color: C.mut, lineHeight: "18px", marginTop: 2 }}>{subMaq}</div> : null}
        {compMaq ? <div style={{ fontSize: 13, color: C.mut }}>{compMaq}</div> : null}
          </div>
        </div>
        {gifGrande && gifSrc && gifOk && typeof document !== "undefined" && createPortal(
          <div data-gif-grande onClick={() => setGifGrande(false)} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(11,13,16,0.82)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={gifSrc} alt="" style={{ width: "90vw", maxHeight: "90vh", height: "auto", objectFit: "contain", display: "block", borderRadius: 12 }} />
          </div>,
          document.body
        )}
      </div>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {showInfo && (
            <div data-tips className="flex flex-col gap-2" style={{ padding: "2px 0 6px" }}>
              <div className="flex items-start" style={{ gap: 8 }}>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {cuesFor(ex, v, opt).map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: C.dim, fontSize: 12, lineHeight: "18px" }}>•</span>
                      <span style={{ fontSize: 13, color: C.mut }}>{c}</span>
                    </div>
                  ))}
                </div>
                {refHref
                  ? <RefLink name={name} ex={ex.id} href={refHref} />
                  : <YtLink name={maqMostrada ? name + " " + maqMostrada : name} ex={ex.id} yt={ytDeFicha} />}
              </div>
              {notaDemo ? <div data-demo-nota style={{ fontSize: 13, lineHeight: "18px", color: C.txt }}>{notaDemo}</div> : null}
              <PreviewClip ex={ex} v={v === "alt" ? "alt" : "main"} opt={opt} />
              {lastNote ? <div style={{ fontSize: 12, color: C.past, fontStyle: "italic" }}>nota pasada: “{lastNote}”</div> : null}
            </div>
          )}
          {shown.type === "time" && <VueltaTimer clock={clock} refSec={(plan[dueIdx >= 0 ? dueIdx : plan.length - 1] || {}).r} onVuelta={onVuelta} />}
          {plan.map((p, k) => (
            <SetRow key={k} idx={k} ex={shown} viewU={viewU} step={paso} ghost={sugerencia ? null : (prev.sets[k] || null)} planT={plan[k]}
              cur={curAt(k)} locked={k !== dueIdx} update={(patch) => updateAt(k, patch)} onCheck={() => checkAt(k)} />
          ))}
          {win && <WinLine>{win.texto}</WinLine>}
          {flash && flash.map((m, k) => <Banner key={k} tone={m.tone}>{m.t}</Banner>)}
          {mas && (
            <div data-mas className="flex flex-col gap-2" style={{ paddingTop: 4 }}>
              {sugerencia && (
                <div data-sugerencia style={{ fontSize: 14, lineHeight: 1.35, color: C.txt, background: C.card, borderRadius: 12 }}>
                  <div style={{ fontWeight: 700 }}>{musculoDe(ex.id)} · {plan.length} × {ex.rng[0]}-{ex.rng[1]}{plan[0] && plan[0].w ? " · " + String(dispV(plan[0].w, ex.u, viewU)).replace("≈", "") + " " + (viewU === "kg" ? "kg" : "lb") : ""}</div>
                  <div style={{ fontWeight: 500, color: C.mut, marginTop: 2 }}>{(sugerencia.texto.match(/de tu último peso en [^.,)]+/) || [sugerencia.texto])[0]}</div>
                </div>
              )}
              <div style={{ fontSize: 12, color: C.dim, letterSpacing: 1, fontWeight: 700 }}>{lbl.toUpperCase()} · META {ex.rng[0]}-{ex.rng[1]} {shown.type === "time" ? "SEG" : "REPS"}{retPlan && retPlan.week > chipWeek ? " · " + retPlan.level.pct + "%" : ""}</div>
              {ex.opts && (
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {ex.opts.map((o) => (
                    <Chip key={o.id} on={opt === o.id} onClick={() => { if (o.id !== opt) track("ejercicio_cambiado", { ex: ex.id, dia: dayId, opcion: o.id }); setLog({ ...log, v, opt: o.id }); }}>{o.n}</Chip>
                  ))}
                </div>
              )}
              {ex.alt && (
                <button type="button" onClick={() => setLog({ ...log, v: v === "alt" ? "main" : "alt", sets: [] })} style={{ alignSelf: "flex-start", minHeight: 32, padding: 0, background: "transparent", color: C.acc, fontSize: 13, fontWeight: 700 }}>{v === "alt" ? "Volver a " + ex.n : "Variante: " + ex.alt.n}</button>
              )}
              {dueIdx >= 0 && (
                <button type="button" onClick={() => updateAt(dueIdx, { f: curAt(dueIdx).f === false ? true : false })} style={{ alignSelf: "flex-start", minHeight: 32, padding: 0, background: "transparent", color: curAt(dueIdx).f === false ? C.warn : C.mut, fontSize: 13, fontWeight: 700 }}>{curAt(dueIdx).f === false ? "Técnica rota" : "Técnica ok"}</button>
              )}
              {prev.probe && <div style={{ fontSize: 12, color: C.mut }}>Probar fuerza: pon la carga de este lado. No hay serie anterior.</div>}
              {!sugerencia && v === "alt" && !prev.real && !prev.probe && <div style={{ fontSize: 12, color: C.warn }}>Pesos estimados para la variante: calibra y quedan guardados aparte.</div>}
              <div data-dolor-ex>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <div style={{ fontSize: 12, color: C.dim, letterSpacing: 1, fontWeight: 700, flex: 1 }}>DOLOR (MÁX {DOLOR_MAX}/10)</div>
                  <button type="button" data-dolor-saltar onClick={() => { const next = { ...log, v, dolorSkip: true }; setLog(next); finishIfReady(next); }} style={{ flexShrink: 0, minHeight: 30, padding: "0 8px", fontSize: 12, fontWeight: 700, color: C.mut, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8 }}>Saltar</button>
                </div>
                <div style={{ marginTop: 4 }}>
                  <DolorGrid value={log.dolor} onPick={(i) => { const next = { ...log, v, dolor: i }; setLog(next); track("hombro_dolor_ejercicio", { ex: ex.id, dia: dayId, dolor: i }); finishIfReady(next); }} />
                </div>
                {typeof log.dolor === "number" && log.dolor > DOLOR_MAX && <Banner tone="err">Pasa de {DOLOR_MAX}/10: baja la carga o acorta el rango. No lo quites.</Banner>}
                {allSetsDone(sets) && !painReady(log) && <div style={{ fontSize: 12, color: C.acc, marginTop: 4 }}>Marca el dolor (o Saltar) para seguir.</div>}
              </div>
            </div>
          )}
          <NoteField ambito="gym" rows={1} initial={log.note || ""} onCommit={guardarNota} ph="Nota" files={{ items: log.adjuntos, onChange: (adjuntos) => setLog({ ...log, v, adjuntos }), ambito: "gym", ex: ex.id }} />
        </div>
      )}
      {((cambio && total > 0 && doneN >= total) || writingFb) && (
        <CambioAsk
          nombre={(cambio && cambio.nombre) || ((CAMBIOS.find((c) => c.id === writingId.current) || {}).nombre)}
          writing={writingFb}
          onYes={() => answerCambio(true)}
          onNo={() => answerCambio(false)}
          onDismiss={() => { if (writingFb) setWritingFb(false); else if (cambio) onCambioDismiss(cambio.id); }}
          onText={(t) => onCambioText(writingId.current, t)}
        />
      )}
    </div>
  );
};



/* ================================================================
   FORMATO 100% AUTOEXPLICATIVO: se guarda y comparte en espanol literal
   ================================================================ */
function loadMeta(e) {
  let medida = "peso total movido (maquina/barra)";
  if (/lado/.test(e.lbl)) medida = "por lado, no total";
  else if (/mano/.test(e.lbl)) medida = "por mancuerna/mano, no total";
  else if (/pierna/.test(e.lbl)) medida = "por pierna, no total";
  if (e.type === "assist") medida = "peso de ASISTENCIA: menos peso = mas dificil";
  if (e.type === "body") medida = "peso corporal, solo repeticiones";
  if (e.type === "time") medida = "segundos sostenidos, no repeticiones";
  return medida;
}
const SLOTN = { res: "R1 - Resistencia (cinta)", pot: "R2 - Potencia/colinas (cinta)", lar: "Largo (exterior)", lib: "Libre" };
function buildExport(hist, trote, gyms) {
  const sesiones = (hist || []).map((s) => {
    const dayDef = DAYS[s.day];
    const ejercicios = [];
    (dayDef ? [...dayDef.ex, ...rehabCatalog(s.day)] : []).forEach((e) => {
      const l = s.logs && s.logs[e.id] ? norm(s.logs[e.id]) : null;
      const sets = l ? l.sets.filter((x) => x && x.done) : [];
      if (!sets.length) return;
      const isAlt = l.v === "alt" && e.alt;
      ejercicios.push({
        id: e.id,
        nombre: isAlt ? e.alt.n : e.n,
        variante: isAlt ? "si" : "no",
        unidad_peso: e.u === "kg" ? "kg" : "lbs",
        el_peso_es: loadMeta(e),
        series: sets.map((x, i) => {
          const row = { numero: i + 1, peso: x.w };
          row[e.type === "time" ? "segundos" : "repeticiones"] = x.r;
          row.tecnica_correcta = x.f !== false;
          row.completada = true;
          return row;
        }),
        nota: l.note || "",
        ...(typeof l.dolor === "number" ? { dolor_hombro: l.dolor } : {}),
        ...(Array.isArray(l.adjuntos) && l.adjuntos.length ? { adjuntos: l.adjuntos } : {}),
        ...(e.opts ? { opcion: optLabel(e, l.opt || e.optDefault) } : {}),
      });
    });
    const extras = ((s.logs && s.logs._extras) || []).map((it) => ({
      nombre: it.n,
      recomendacion_del_dia: (it.rec || "") + (it.por ? ": " + it.por : ""),
      series: (it.sets || []).filter((x) => x && x.done).map((x, i) => ({ numero: i + 1, peso: x.w, repeticiones: x.r, completada: true })),
      ...(Array.isArray(it.adjuntos) && it.adjuntos.length ? { adjuntos: it.adjuntos } : {}),
    })).filter((x) => x.series.length || (Array.isArray(x.adjuntos) && x.adjuntos.length));
    return { fecha: s.date, ...(s.savedAt ? { hora_real: s.savedAt } : {}), ...(s.fechaEditada ? { fecha_editada: s.fechaEditada } : {}), dia_id: s.day, dia: dayDef ? dayDef.name : s.day, energia: s.energy || "normal", gym: gymDeSesion(s, gyms), ...(s.hombro ? { hombro_derecho: s.hombro } : {}), ejercicios, ejercicios_adicionales: extras, nota_sesion: s.note || "", ...(Array.isArray(s.adjuntos) && s.adjuntos.length ? { adjuntos: s.adjuntos } : {}) };
  });
  const weeks = (trote && trote.weeks) || {};
  const recetas = Object.entries(weeks).map(([wk, w]) => {
    const out = { semana_del_lunes: wk };
    Object.entries(w).forEach(([slot, val]) => {
      if (!val || !val.p) return;
      const pr = fixP(val.p);
      if (slot === "lar") {
        const lar = { slot_id: "lar", objetivo_min: pr.min || 60, objetivo_km: pr.km || 0, nota: pr.nota || "" };
        if (Array.isArray(val.adjuntos) && val.adjuntos.length) lar.adjuntos = val.adjuntos;
        if (Array.isArray(val.nxAdjuntos) && val.nxAdjuntos.length) lar.adjuntos_sensacion = val.nxAdjuntos;
        out[SLOTN.lar] = lar;
        return;
      }
      const base = { slot_id: slot, calentamiento_min: pr.cal, calentamiento_vel_kmh: pr.cv, tiempo_por_serie_seg: pr.t, descanso_seg: pr.dt, descanso_vel_kmh_0_es_fuera_de_cinta: pr.dv || 0, nota: pr.nota || "" };
      if (Array.isArray(pr.blocks) && pr.blocks.length) {
        base.bloques = pr.blocks.map((x, i) => ({ numero: i + 1, veces: x.n, segundos: x.t, vel_kmh: x.v, inclinacion_pct: x.inc, descanso_seg: x.dt }));
      } else if (Array.isArray(pr.sets)) base.series_variables = pr.sets.map((x, i) => ({ numero: i + 1, vel_kmh: x.v, inclinacion_pct: x.inc, segundos: x.t, descanso_seg: x.dt }));
      else { base.series = pr.n; base.vel_kmh = pr.v; base.inclinacion_pct = pr.inc; }
      if (pr.cool && pr.cool.min > 0) base.enfriamiento = { min: pr.cool.min, vel_kmh: pr.cool.v };
      if (Array.isArray(val.adjuntos) && val.adjuntos.length) base.adjuntos = val.adjuntos;
      if (Array.isArray(val.nxAdjuntos) && val.nxAdjuntos.length) base.adjuntos_sensacion = val.nxAdjuntos;
      out[SLOTN[slot]] = base;
    });
    return out;
  });
  const assign = { ...SEED_ASSIGN, ...((trote && trote.assign) || {}) };
  const corridas = mergeById(SEED_RUNS, trote && trote.runs, "id").map((r) => {
    const row = {
      id: r.id, fecha: r.date, ...(r.savedAt ? { hora_real: r.savedAt } : {}), ...(r.fechaEditada ? { fecha_editada: r.fechaEditada } : {}), tipo: SLOTN[assign[r.id]] || "sin etiquetar",
      minutos: r.min, km: r.km || 0, ritmo_min_por_km: r.pace || null,
      esfuerzo_relativo_strava: r.re || null, en_cinta: !!r.indoor,
    };
    if (r.nota) row.nota = r.nota;
    if (r.tipo) row.estilo = r.tipo;
    if (Array.isArray(r.adjuntos) && r.adjuntos.length) row.adjuntos = r.adjuntos;
    const estiramiento = cierreExport(r.cierre);
    if (estiramiento) Object.assign(row, estiramiento);
    return row;
  });
  return {
    app: "Tracker de entrenamiento personal",
    exportado: new Date().toISOString(),
    como_leer: "Todo es literal y en espanol. Las claves id, dia_id y slot_id son tecnicas, para reimportar al tracker; el resto se explica solo.",
    sesiones_pesas: sesiones,
    trote: {
      recetas_del_coach: recetas,
      corridas,
      caminatas: ((trote && trote.walks) || SEED_WALKS).map((w) => ({ fecha: w.date, minutos: w.min })),
      otras_actividades: ((trote && trote.otros) || SEED_OTROS).map((o) => ({ fecha: o.date, nombre: o.name, minutos: o.min, esfuerzo_relativo: o.re || null })),
    },
  };
}
function optIdFromLabel(dayId, exId, label) {
  const day = DAYS[dayId];
  const ex = day && day.ex.find((x) => x.id === exId);
  if (!ex || !ex.opts || !label) return null;
  const hit = ex.opts.find((o) => o.n === label);
  return hit ? hit.id : null;
}
/* Importa tanto el formato autoexplicativo nuevo como el legado */
function importParse(p) {
  if (p && Array.isArray(p.sesiones_pesas)) {
    const history = p.sesiones_pesas.map((s) => ({
      date: s.fecha, ...(s.hora_real ? { savedAt: s.hora_real } : {}), ...(s.fecha_editada ? { fechaEditada: s.fecha_editada } : {}), day: s.dia_id, energy: s.energia || "normal", note: s.nota_sesion || "",
      ...(s.gym && s.gym !== HABITUAL_ID ? { gymId: s.gym } : {}),
      ...(Array.isArray(s.adjuntos) && s.adjuntos.length ? { adjuntos: s.adjuntos } : {}),
      logs: Object.fromEntries((s.ejercicios || []).map((e) => {
        const opt = optIdFromLabel(s.dia_id, e.id, e.opcion);
        const row = { v: e.variante === "si" ? "alt" : "main", note: e.nota || "",
          sets: (e.series || []).map((x) => ({ w: x.peso || 0, r: x.repeticiones != null ? x.repeticiones : x.segundos, f: x.tecnica_correcta !== false, done: true })) };
        if (opt) row.opt = opt;
        if (Array.isArray(e.adjuntos) && e.adjuntos.length) row.adjuntos = e.adjuntos;
        return [e.id, row];
      })),
    }));
    const t = p.trote || {};
    const inv = {}; Object.entries(SLOTN).forEach(([k, v]) => { inv[v] = k; });
    const trote = {
      runs: (t.corridas || []).map((r) => {
        const run = { id: r.id, date: r.fecha, ...(r.hora_real ? { savedAt: r.hora_real } : {}), ...(r.fecha_editada ? { fechaEditada: r.fecha_editada } : {}), km: r.km || 0, min: r.minutos || 0, pace: r.ritmo_min_por_km || null, re: r.esfuerzo_relativo_strava || 0, indoor: !!r.en_cinta };
        if (r.nota) run.nota = r.nota;
        if (r.estilo) run.tipo = r.estilo;
        if (Array.isArray(r.adjuntos) && r.adjuntos.length) run.adjuntos = r.adjuntos;
        const cierre = cierreImport(r);
        if (cierre) run.cierre = cierre;
        return run;
      }),
      assign: {}, walks: (t.caminatas || []).map((w) => ({ date: w.fecha, min: w.minutos })),
      otros: (t.otras_actividades || []).map((o) => ({ date: o.fecha, name: o.nombre, min: o.minutos, re: o.esfuerzo_relativo || 0 })),
      weeks: {},
    };
    (t.corridas || []).forEach((r) => { if (inv[r.tipo]) trote.assign[r.id] = inv[r.tipo]; });
    (t.recetas_del_coach || []).forEach((wkObj) => {
      const wk = wkObj.semana_del_lunes; const wref = {};
      Object.values(wkObj).forEach((v) => {
        if (!v || typeof v !== "object" || !v.slot_id) return;
        if (v.slot_id === "lar") {
          const slot = { p: { min: v.objetivo_min || 60, km: v.objetivo_km || 0, nota: v.nota || "" } };
          if (Array.isArray(v.adjuntos) && v.adjuntos.length) slot.adjuntos = v.adjuntos;
          if (Array.isArray(v.adjuntos_sensacion) && v.adjuntos_sensacion.length) slot.nxAdjuntos = v.adjuntos_sensacion;
          wref.lar = slot;
          return;
        }
        const base = { cal: v.calentamiento_min, cv: v.calentamiento_vel_kmh, t: v.tiempo_por_serie_seg, dt: v.descanso_seg, dv: v.descanso_vel_kmh_0_es_fuera_de_cinta || 0, nota: v.nota || "" };
        if (v.bloques) base.blocks = v.bloques.map((x) => ({ n: x.veces, t: x.segundos, v: x.vel_kmh, inc: x.inclinacion_pct, dt: x.descanso_seg }));
        else if (v.series_variables) base.sets = v.series_variables.map((x) => ({ v: x.vel_kmh, inc: x.inclinacion_pct, t: x.segundos, dt: x.descanso_seg }));
        else { base.n = v.series; base.v = v.vel_kmh; base.inc = v.inclinacion_pct; }
        if (v.enfriamiento) base.cool = { min: v.enfriamiento.min, v: v.enfriamiento.vel_kmh };
        const slot = { p: base };
        if (Array.isArray(v.adjuntos) && v.adjuntos.length) slot.adjuntos = v.adjuntos;
        if (Array.isArray(v.adjuntos_sensacion) && v.adjuntos_sensacion.length) slot.nxAdjuntos = v.adjuntos_sensacion;
        wref[v.slot_id] = slot;
      });
      if (Object.keys(wref).length) trote.weeks[wk] = wref;
    });
    return { history, trote };
  }
  return { history: Array.isArray(p) ? p : p.history, trote: p ? p.trote : null };
}


/* Ejercicio adicional por descripcion: la IA lo identifica y evalua si conviene hoy */
const AdHoc = ({ dayId, logs, setLogs, units }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("");
  const [adjuntos, setAdjuntos] = useState([]);
  const ref = useRef(null);
  const upload = useAdjuntoUpload({ items: adjuntos, onChange: setAdjuntos, ambito: "gym" });
  const extras = logs._extras || [];
  const search = async () => {
    const desc = ref.current ? ref.current.value : "";
    if (!desc.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const prompt = "Eres coach de hipertrofia. Usuario: hernia L5-S1, cero carga axial (nada de sentadilla libre, peso muerto, ni cargas de pie sobre hombros). Hoy entrena: " + DAYS[dayId].name + ". El usuario describe un ejercicio asi: \"" + desc + "\". Identifica el ejercicio y responde SOLO un objeto JSON valido, sin markdown: {\"n\":\"nombre corto\",\"lbl\":\"unidad (stack, x mano, x lado o reps)\",\"cues\":[\"tip1\",\"tip2\",\"tip3\"],\"rng\":[8,12],\"rec\":\"si|precaucion|no\",\"por\":\"una frase de por que conviene o no HOY dado el dia entrenado y su columna\"}";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "error de API");
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("sin respuesta clara, intenta describirlo distinto");
      const ex = JSON.parse(m[0]);
      if (esCargaAxial(ex.n)) {
        setErr("Ese ejercicio carga la columna. Usa una máquina, una polea o tu peso corporal.");
        setBusy(false);
        return;
      }
      const item = { id: "adhoc" + Date.now(), n: ex.n || "Ejercicio", lbl: ex.lbl || "lbs", cues: ex.cues || [], rng: ex.rng || [8, 12], rec: ex.rec || "precaucion", por: ex.por || "", sets: [], ...(adjuntos.length ? { adjuntos } : {}) };
      setLogs({ ...logs, _extras: [...extras, item] });
      if (ref.current) ref.current.value = "";
      setAdjuntos([]);
      setOpen(false);
    } catch (e) { setErr(String((e && e.message) || e).slice(0, 120)); }
    setBusy(false);
  };
  const updExtra = (id, patch) => setLogs({ ...logs, _extras: extras.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  return (
    <div className="flex flex-col gap-2">
      {extras.map((item) => {
        const exObj = { id: item.id, n: item.n, lbl: item.lbl, u: "lb", step: 5, rng: item.rng, cues: item.cues, prev: [] };
        const rows = [0, 1, 2].map((k) => (item.sets && item.sets[k]) || { w: 0, r: item.rng[0], f: true, done: false });
        const due = dueSetIndex(rows, rows.length);
        const tone = item.rec === "si" ? "good" : item.rec === "no" ? "err" : "acc";
        return (
          <div key={item.id} className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
            <div style={{ fontSize: 17, fontWeight: 600, fontFamily: F.disp }}>{item.n} <span style={{ fontSize: 11, color: C.dim }}>adicional de hoy</span></div>
            <Banner tone={tone}>{item.rec === "si" ? "Recomendado hoy: " : item.rec === "no" ? "Mejor no hoy: " : "Con precaución: "}{item.por}</Banner>
            {item.cues.length > 0 && <div style={{ fontSize: 12, color: C.mut }}>{item.cues.join(" · ")}</div>}
            {rows.map((cur, k) => (
              <SetRow key={k} idx={k} ex={exObj} viewU={"lb"} ghost={null} planT={null}
                cur={cur} locked={k !== due}
                update={(patch) => { if (k !== due) return; const ns = [0, 1, 2].map((i) => (item.sets && item.sets[i]) || { w: 0, r: item.rng[0], f: true, done: false }); ns[k] = { ...ns[k], ...patch }; updExtra(item.id, { sets: ns }); }}
                onCheck={() => { if (!cur.done && k !== due) return; const ns = [0, 1, 2].map((i) => (item.sets && item.sets[i]) || { w: 0, r: item.rng[0], f: true, done: false }); const nowDone = !ns[k].done; ns[k] = { ...ns[k], done: nowDone }; updExtra(item.id, { sets: ns }); track(nowDone ? "serie_completada" : "serie_deshecha", { ex: item.id, dia: dayId }); }} />
            ))}
          </div>
        );
      })}
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ minHeight: 40, fontSize: 13, color: C.dim, border: `1px dashed ${C.line}`, borderRadius: 12 }}>+ ejercicio adicional (descríbelo y la IA lo identifica)</button>
      ) : (
        <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px dashed ${C.acc}66` }}>
          <div className="rounded-xl" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
            <textarea ref={ref} lang="es" rows={2} placeholder="Describe el ejercicio: máquina, movimiento, qué sientes trabajar" className="w-full rounded-xl p-3 text-sm" style={{ background: "transparent", color: C.txt, border: "none", resize: "none", outline: "none", minHeight: 64 }} />
            <NotaBar textareaRef={ref} files ambito="gym" busy={upload.busy} onFiles={upload.addFiles} onValue={() => {}} hint={hint} setHint={setHint} />
            {upload.items.length ? <div style={{ padding: "0 8px 8px" }}><AdjuntoStrip items={upload.items} /></div> : null}
            {upload.err ? <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, padding: "0 10px 8px" }}>{upload.err}</div> : null}
          </div>
          <div className="flex gap-2">
            <button onClick={search} className="rounded-xl font-bold flex-1" style={{ minHeight: 46, background: busy ? C.card2 : GRAD, color: busy ? C.dim : C.accText, fontSize: 14 }}>{busy ? "Identificando…" : "Identificar con IA"}</button>
            <button onClick={() => { setOpen(false); setErr(""); }} className="rounded-xl px-4" style={{ minHeight: 46, fontSize: 14, color: C.dim, border: `1px solid ${C.line}` }}>cerrar</button>
          </div>
          {err && <Banner tone="err">{err}</Banner>}
        </div>
      )}
    </div>
  );
};

/* ============ SESIÓN ============ */
function scrollExIntoView(exId, domId) {
  const el = domId ? document.getElementById(domId) : document.querySelector('[data-ex-id="' + exId + '"]');
  const scroller = (el && el.closest(".app-scroll")) || document.querySelector(".app-scroll");
  if (!el || !scroller) return;
  if (window.scrollY) window.scrollTo(0, 0);
  const head = document.querySelector(".sess-head");
  const headH = head ? head.getBoundingClientRect().height : 0;
  const sc = scroller.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const top = r.top - sc.top + scroller.scrollTop - headH - 8;
  scroller.scrollTo({ top: Math.max(0, top), behavior: "auto" });
}
function scrollFieldIntoView(el) {
  const scroller = (el && el.closest && el.closest(".app-scroll")) || document.querySelector(".app-scroll");
  if (!el || !scroller) return;
  const run = () => {
    const head = document.querySelector(".sess-head");
    const headH = head ? head.getBoundingClientRect().height : 0;
    const vv = window.visualViewport;
    const sc = scroller.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const tab = document.querySelector(".app-tabs");
    const tabHidden = tab && getComputedStyle(tab).visibility === "hidden";
    const tabH = tab && !tabHidden ? tab.getBoundingClientRect().height : 0;
    const vvBottom = vv ? (vv.offsetTop || 0) + vv.height : window.innerHeight;
    const visibleTop = sc.top + headH + 8;
    const visibleBottom = Math.min(sc.bottom, vvBottom) - tabH - 12;
    if (r.top >= visibleTop && r.bottom <= visibleBottom && r.width >= 40) return;
    const top = r.top - sc.top + scroller.scrollTop - headH - 12;
    scroller.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  };
  run();
  requestAnimationFrame(run);
}

const DolorGrid = ({ value, onPick }) => {
  const ref = useRef(null);
  const [seis, setSeis] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const apply = () => setSeis(el.clientWidth < 11 * 28 + 10 * 4);
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  const btn = (i) => (
    <button key={i} type="button" onClick={() => onPick(i)} className="rounded-lg" style={{ minHeight: 36, fontFamily: F.num, fontWeight: 700, fontSize: 14, background: value === i ? C.acc : C.card2, color: value === i ? C.accText : i > DOLOR_MAX ? C.warn : C.txt }}>{i}</button>
  );
  const nums = Array.from({ length: 11 }, (_, i) => i);
  if (seis) {
    return (
      <div ref={ref} data-dolor-grid="6" className="flex flex-col" style={{ gap: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 4 }}>{nums.slice(0, 6).map(btn)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4 }}>{nums.slice(6).map(btn)}</div>
      </div>
    );
  }
  return (
    <div ref={ref} data-dolor-grid="11" style={{ display: "grid", gridTemplateColumns: "repeat(11, minmax(0, 1fr))", gap: 4 }}>{nums.map(btn)}</div>
  );
};

const AjustesHoja = ({ open, anchor, onClose, dayId, energy, onEnergy, hombro, onHombro, gym, gyms, onGym, notice }) => {
  if (!open || typeof document === "undefined") return null;
  const esHombro = !!HOMBRO_DIAS[dayId];
  const molestiaOn = !!(hombro && (hombro.dolor || hombro.molestia));
  const elegirMolestia = (val) => {
    if (!onHombro) return;
    if (esHombro) onHombro({ dolor: val, molestia: val, intensidad: val ? ((hombro && hombro.intensidad) || 2) : 0, semana: (hombro && hombro.semana) || 1 });
    else onHombro(val ? { dolor: false, molestia: true, semana: 1 } : null);
  };
  const top = anchor && anchor.bottom ? anchor.bottom + 6 : 52;
  const hoja = (
    <div data-ajustes-fondo onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(11,13,16,.28)" }}>
      <div data-ajustes role="dialog" aria-modal="true" aria-label="Ajustes de la sesión" onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top, left: "50%", transform: "translateX(-50%)", width: "min(360px, calc(100vw - 16px))", maxHeight: "min(70dvh, calc(100dvh - " + top + "px - 12px))", overflow: "auto", background: C.card, color: C.txt, borderRadius: 16, padding: "8px 16px 16px", boxSizing: "border-box", border: `1px solid ${C.line}`, boxShadow: "0 12px 32px rgba(11,13,16,.28)" }}>
        <div style={{ position: "sticky", top: 0, background: C.card, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
          <div style={{ fontFamily: F.disp, fontSize: 20, letterSpacing: 0.4 }}>AJUSTES</div>
          <button type="button" data-ajustes-cerrar aria-label="Cerrar ajustes" onClick={onClose} className="gear-btn" style={{ color: C.txt }}>×</button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.dim, marginTop: 8 }}>GYM</div>
        <div className="flex gap-2" role="radiogroup" aria-label="Gym" style={{ flexWrap: "wrap", marginTop: 6 }}>
          {(gyms || []).map((g) => {
            const on = gym && g.id === gym.id;
            return <button key={g.id} type="button" role="radio" aria-checked={on} data-gym-id={g.id} onClick={() => onGym && onGym(g.id)} style={chipGym(on)}>{etiquetaGym(g)}</button>;
          })}
        </div>
        <div data-modo-head style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.dim, marginTop: 14 }}>{energy && MODO_INFO[energy] ? MODO_INFO[energy].n : "Modo"}</div>
        <div className="flex gap-2" role="radiogroup" aria-label="Modo de hoy" style={{ marginTop: 6 }}>
          {MODOS.map((m) => {
            const on = energy === m;
            return <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onEnergy && onEnergy(m)} style={{ ...chipGym(on), flex: 1 }}>{MODO_INFO[m].n}</button>;
          })}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, lineHeight: 1.35, marginTop: 14 }}>{esHombro ? "¿Te sigue doliendo el hombro derecho?" : "¿Con molestia hoy?"}</div>
        <div data-molestia-panel className="flex gap-2" role="radiogroup" aria-label={esHombro ? "Dolor de hombro" : "Molestia de hoy"} style={{ marginTop: 6 }}>
          {[[true, "Sí"], [false, "No"]].map(([val, t]) => (
            <button key={t} type="button" role="radio" aria-checked={molestiaOn === val} onClick={() => elegirMolestia(val)} style={{ ...chipGym(molestiaOn === val), flex: 1 }}>{t}</button>
          ))}
        </div>
        {notice ? <div style={{ marginTop: 12 }}><ReturnNotice {...notice} /></div> : null}
      </div>
    </div>
  );
  return createPortal(hoja, document.body);
};

const Session = ({ hombro, dayId, hist, planHist, energy, logs, setLogs, onFinish, onBack, pauseMode, units, setUnits, gym, gyms, catalogo, onEnergy, onHombro, onGym, sessionNote, setSessionNote, sessionAdj, setSessionAdj, ret, notice, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const day = useMemo(() => sessionDay(dayId, energy, hist, hombro), [dayId, energy, hombro]); // eslint-disable-line
  const mode = pauseMode === "long" ? "recal" : energy === "mala" || energy === "baja" || energy === "relajado" || pauseMode === "short" ? "hold" : "grow";
  const viewHist = ret && ret.active ? hist : (planHist || hist);
  const enOtro = !!(gym && gym.id && gym.id !== HABITUAL_ID);
  const [sobre, setSobre] = useState({});
  const [ajustes, setAjustes] = useState(false);
  const [masSesion, setMasSesion] = useState(false);
  const [ancla, setAncla] = useState(null);
  const gearRef = useRef(null);
  const sumRef = useRef(null);
  const titleRef = useRef(null);
  const theme = useThemeCtl();
  const resumen = [energy && MODO_INFO[energy] ? MODO_INFO[energy].n : "", etiquetaGym(gym)].filter(Boolean).join(" · ");
  const sessionIds = sessionExIds(day);
  const byId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
  const exerciseFinished = (id) => {
    const ex = byId[id];
    if (!ex) return true;
    const l = norm(logs[id]);
    const plan = resolverPlan(viewHist, dayId, ex, l.v || "main", mode, gym, gyms, ret).sets;
    return plan.length > 0 && l.sets.filter((s) => s && s.done).length >= plan.length;
  };
  const [openIds, setOpenIds] = useState(() => {
    const id = firstPendingExId(sessionIds, exerciseFinished) || sessionIds[0];
    return id ? { [id]: true } : {};
  });
  const headRef = useRef(null);
  const spacerRef = useRef(null);
  useLayoutEffect(() => {
    const head = headRef.current;
    const spacer = spacerRef.current;
    if (!head || !spacer) return;
    const apply = () => {
      const h = head.offsetHeight || 0;
      spacer.style.height = h + "px";
      document.documentElement.style.setProperty("--sess-head-h", h + "px");
    };
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(head);
    return () => {
      if (ro) ro.disconnect();
      document.documentElement.style.setProperty("--sess-head-h", "0px");
    };
  }, [day.modo, day.name, resumen, ajustes]);
  useLayoutEffect(() => {
    const el = sumRef.current;
    const title = titleRef.current;
    if (!el || !title) return undefined;
    const apply = () => {
      el.hidden = false;
      const sumClipped = el.scrollWidth > el.clientWidth + 1;
      const titleClipped = title.scrollWidth > title.clientWidth + 1;
      el.hidden = sumClipped || titleClipped;
    };
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    if (ro && el.parentElement) ro.observe(el.parentElement);
    return () => { if (ro) ro.disconnect(); };
  }, [resumen, day.name]);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let raf = 0;
    const pin = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--vv-off", (vv.offsetTop || 0) + "px");
      });
    };
    vv.addEventListener("scroll", pin);
    vv.addEventListener("resize", pin);
    pin();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      vv.removeEventListener("scroll", pin);
      vv.removeEventListener("resize", pin);
    };
  }, []);
  useEffect(() => {
    const id = firstPendingExId(sessionIds, exerciseFinished);
    if (!id) return;
    const t = requestAnimationFrame(() => scrollExIntoView(id));
    return () => cancelAnimationFrame(t);
  }, []); // eslint-disable-line
  const collapseAndAdvance = (id) => {
    const nextId = nextSessionExId(sessionIds, id);
    setOpenIds((o) => afterCompleteOpenIds(o, id, sessionIds));
    if (!nextId) return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollExIntoView(nextId)));
  };
  const doneCount = day.ex.filter((e) => {
    const l = norm(logs[e.id]);
    const plan = resolverPlan(viewHist, dayId, e, l.v || "main", mode, gym, gyms, ret).sets;
    return plan.length > 0 && l.sets.filter((s) => s && s.done).length >= plan.length;
  }).length;
  const shell = typeof document !== "undefined" ? document.querySelector(".app-shell") : null;
  const head = (
    <div ref={headRef} className="sess-head" data-dia={dayId} data-modo={day.modo || ""} data-molestia={day.molestia ? "1" : "0"} style={{ background: C.bg, borderBottom: `3px solid ${C.acc}` }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 8px 0 12px", paddingTop: "var(--sat)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(88px,auto)", alignItems: "center", columnGap: 4, minHeight: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <button type="button" onClick={onBack} aria-label="Volver" className="rounded-xl font-bold" style={{ minHeight: 40, minWidth: 40, fontSize: 16, background: C.card, color: C.txt, border: `1.5px solid ${C.line}`, flexShrink: 0 }}>←</button>
            <div ref={titleRef} style={{ minWidth: 0, flex: "1 1 auto", overflow: "hidden", fontSize: 18, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 1.1, whiteSpace: "nowrap" }}>{day.name}</div>
            <div ref={sumRef} data-sel-resumen style={{ flex: "0 1 auto", minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: C.mut, lineHeight: "16px" }}>{resumen}</div>
          </div>
          <BrandFlecha />
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexShrink: 0 }}>
            <button type="button" ref={gearRef} data-ajustes-abrir className="gear-btn" aria-label="Ajustes de la sesión" onClick={() => { const r = gearRef.current && gearRef.current.getBoundingClientRect(); setAncla(r ? { bottom: r.bottom, right: r.right } : null); setAjustes(true); }} style={{ color: C.dim }}><GearIcon /></button>
            {theme && <ThemeToggle mode={theme.mode} onChange={theme.setMode} />}
          </div>
        </div>
        </div>
    </div>
  );
  return (
    <div className="px-4 pb-4 flex flex-col gap-2" style={{ maxWidth: 480, margin: "0 auto" }}>
      {shell ? createPortal(head, shell) : head}
      <AjustesHoja open={ajustes} anchor={ancla} onClose={() => setAjustes(false)} dayId={dayId} energy={energy} onEnergy={onEnergy} hombro={hombro} onHombro={onHombro} gym={gym} gyms={gyms} onGym={onGym} notice={notice} />
      <div ref={spacerRef} className="sess-head-spacer" aria-hidden="true" />
      {day.secs.map((sec, si) => (
        <React.Fragment key={sec.t}>
          <div id={"sec-" + dayId + "-" + si} style={{ marginTop: 10, scrollMarginTop: "calc(var(--sess-head-h, 96px) + 8px)" }}>
            <div style={{ fontSize: 15, letterSpacing: 2, fontWeight: 700, color: C.acc, fontFamily: F.disp }}>{sec.t.toUpperCase()}</div>
            {sec.note && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{sec.note}</div>}
          </div>
          {sec.ids.map((id) => {
            const ex = byId[id];
            return (
              <ExCard key={id} ex={ex} dayId={dayId} hist={viewHist} mode={mode} ret={ret} gym={gym} gyms={gyms} catalogo={catalogo}
                viewU={sobre[id] || (enOtro ? (gym.unidad === "kg" ? "kg" : "lb") : (units[id] || ex.u))}
                setUnit={(u) => { if (enOtro) setSobre((s) => ({ ...s, [id]: u })); else setUnits({ ...units, [id]: u }); }}
                open={!!openIds[id]}
                onToggle={() => setOpenIds((o) => ({ ...o, [id]: !o[id] }))}
                onCollapse={() => collapseAndAdvance(id)}
                log={norm(logs[id])} setLog={(l) => setLogs({ ...logs, [id]: l })}
                fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />
            );
          })}
        </React.Fragment>
      ))}
      {masSesion && (
        <div className="flex flex-col gap-2">
          <AdHoc dayId={dayId} logs={logs} setLogs={setLogs} units={units} />
          <NoteField ambito="gym" initial={sessionNote} onCommit={setSessionNote} ph="Nota final de la sesión: cómo te sentiste, dolores, contexto…" files={{ items: sessionAdj, onChange: setSessionAdj, ambito: "gym" }} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Más de la sesión" aria-expanded={masSesion} onClick={() => setMasSesion((s) => !s)} className="rounded-xl" style={{ width: 52, height: 52, flexShrink: 0, fontSize: 22, fontWeight: 800, color: C.mut, background: C.card, border: `1px solid ${C.line}` }}>⋯</button>
        <button onClick={onFinish} className="rounded-xl font-bold" style={{ minHeight: 52, flex: 1, background: GRAD, color: C.accText, fontSize: 17 }}>Terminar sesión</button>
      </div>
    </div>
  );
};

/* ============ CIERRE ============ */
const Done = ({ volver, hombro, dayId, hist, planHist, energy, logs, pauseMode, sessionNote, setSessionNote, sessionAdj, setSessionAdj, units, gym, gyms, onMaquinas, onSaved, onHome, onBack, ret, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const day = useMemo(() => sessionDay(dayId, energy, hist, hombro), [dayId, energy, hombro]); // eslint-disable-line
  const [status, setStatus] = useState("idle");
  const [writingId, setWritingId] = useState("");
  const doneMode = pauseMode === "long" ? "recal" : energy === "mala" || energy === "baja" || energy === "relajado" || pauseMode === "short" ? "hold" : "grow";
  const viewHistD = ret && ret.active ? hist : (planHist || hist);
  const enOtro = !!(gym && gym.id && gym.id !== HABITUAL_ID);
  const vuDe = (ex) => (enOtro ? (gym.unidad === "kg" ? "kg" : "lb") : (units[ex.id] || ex.u));
  const rows = day.ex.map((ex) => {
    const l = norm(logs[ex.id]); const v = l.v || "main";
    const sets = l.sets.filter((s) => s && s.done);
    const onReturn = !!(ret && ret.active);
    const res = resolverPlan(viewHistD, dayId, ex, v, doneMode, gym, gyms, ret);
    const prev = res.propio ? prevFor(res.hist, dayId, ex, v) : { sets: [], real: false };
    const tPrev = prev.sets.reduce((a, [pw, pr]) => a + score(pw, pr), 0);
    const tNow = sets.filter((s) => s.f !== false).reduce((a, s) => a + score(s.w, s.r), 0);
    const hi = ex.rng[1]; const shown = viewEx(ex, v) || ex; const st = pasoNativo(gym, shown); const vu = vuDe(ex);
    let plan;
    const built = res.retBuilt && sets.length ? res.retBuilt : null;
    if (!sets.length) plan = null;
    else if (built) {
      const topped = sets.every((s) => s.r >= hi && s.f !== false);
      const nextWeek = Math.min(ret.program.weeks, built.week + (topped ? 1 : 0));
      const nextPct = ret.program.levels[nextWeek - 1].pct;
      plan = topped && nextWeek > built.week ? "regreso · siguiente nivel " + nextPct + "%" : "regreso · " + built.level.pct + "%";
    }
    else if (pauseMode) plan = "post-pausa: recalibrar";
    else if (energy === "mala" || energy === "baja" || energy === "relajado") plan = "día suave: contexto, no regresión";
    else if (sets.some((s) => s.f === false)) plan = "técnica rota: consolidar forma";
    else if (sets.every((s) => s.r >= hi)) {
      const typeNow = activeType(ex, v);
      if (typeNow === "body") plan = "⬆ sube meta +1-2 reps";
      else if (typeNow === "time") plan = "⬆ sube +5 seg";
      else if (typeNow === "assist") plan = `⬆ baja asistencia a ${dispV(Math.max(st, Math.max(...sets.map((s) => s.w)) - st), ex.u, vu)}`;
      else plan = `⬆ sube a ${dispV(Math.max(...sets.map((s) => s.w)) + st, ex.u, vu)}, vuelve a ${ex.rng[0]} reps`;
    } else plan = `gana reps hasta ${hi} antes de subir`;
    const marca = res.propio ? bestPrev(res.hist, dayId, ex, v) : Infinity;
    const beat = !res.propio ? false : onReturn && built
      ? metReturnPlan(sets, built.sets)
      : sets.length > 0 && prev.real && tNow >= tPrev * 0.98;
    return { ex, v, sets, beat, pr: res.propio && sets.some((s) => s.f !== false && score(s.w, s.r) > marca), plan };
  });
  const doneRows = rows.filter((r) => r.sets.length);
  const hechos = day.ex.filter((ex) => {
    const l = norm(logs[ex.id]); const v = l.v || "main";
    const plan = resolverPlan(viewHistD, dayId, ex, v, doneMode, gym, gyms, ret).sets;
    return plan.length > 0 && l.sets.filter((s) => s && s.done).length >= plan.length;
  }).length;
  const [winsFijos, setWinsFijos] = useState(null);
  const [animo, setAnimo] = useState(null);
  const [animoOff, setAnimoOff] = useState(false);
  const savedRef = useRef(null);
  const tzDone = deviceTimeZone();
  const [cuando, setCuando] = useState(() => localInputValue(new Date(), tzDone));
  const [cuandoTocado, setCuandoTocado] = useState(false);
  const fechaTrack = useRef(false);
  useEffect(() => {
    if (cuandoTocado || status === "ok") return undefined;
    const id = setInterval(() => setCuando(localInputValue(new Date(), tzDone)), 20000);
    return () => clearInterval(id);
  }, [cuandoTocado, status, tzDone]);
  const winsVivos = sessionWins({
    energy,
    regresoNumero: volver ? (volver.hoyEsRegreso ? volver.numeroHoy : volver.pendiente && doneRows.length ? volver.siguienteNumero : 0) : 0,
    marcas: day.ex.map((ex) => {
      const l = norm(logs[ex.id]); const v = l.v || "main";
      const res = resolverPlan(viewHistD, dayId, ex, v, doneMode, gym, gyms, ret);
      if (!res.propio) return null;
      return winForEx(res.hist, dayId, ex, v, l.sets, vuDe(ex));
    }),
    hechos,
    total: day.ex.length,
  });
  const wins = winsFijos || winsVivos;
  const beats = doneRows.filter((r) => r.beat).length;
  const prs = doneRows.filter((r) => r.pr);
  const buildSession = () => {
    const sello = selloDe(cuando, new Date(), tzDone);
    return sellarSesion({ date: sello.date, savedAt: sello.savedAt, day: dayId, energy, ...(hombro ? { hombro } : {}), logs, note: sessionNote, wins, ...(Array.isArray(sessionAdj) && sessionAdj.length ? { adjuntos: sessionAdj } : {}), ...(isAnimo(animo) ? { animo } : {}) }, gym && gym.id);
  };
  const save = async () => {
    setStatus("saving");
    const sesion = buildSession();
    if (onMaquinas) onMaquinas(sesion.logs);
    const h2 = [...hist, sesion];
    const ok = await stSet(HKEY, h2);
    if (ok) savedRef.current = { date: h2[h2.length - 1].date, hist: h2 };
    try { if (window.pushSesion) window.pushSesion(buildSession(), { ...DAYS, [dayId]: day }); } catch (e) {}
    if (ok) { await stDel(DKEY); setWinsFijos(wins); setStatus("ok"); onSaved(h2); if (wins.length) track("wins_sesion", { dia: dayId, n: wins.length, tipos: wins.map((w) => w.tipo).join(",") }); } else { setStatus("fail"); track("error_guardado", { dia: dayId }); }
  };
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto", paddingTop: "calc(16px + var(--sat))" }}>
      <BrandHeader style={{ marginTop: 8 }} left={<div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 1 }}>Sesión terminada</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.mut, lineHeight: 1.3 }}>{etiquetaGym(gym)}</div>
      </div>} />
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 15, color: C.good, fontWeight: 700 }}>{beats} de {doneRows.length} ejercicios {ret && ret.active ? "cumplieron el plan de regreso" : "igualaron o superaron la pasada"}</div>
        {prs.length > 0 && <div style={{ fontSize: 14, color: C.acc, marginTop: 6 }}>Récord personal: {prs.map((r) => (r.v === "alt" ? r.ex.alt.n : r.ex.n)).join(", ")}</div>}
        {(energy === "mala" || energy === "baja" || energy === "relajado") && <div style={{ fontSize: 13, color: C.mut, marginTop: 6 }}>Día de energía baja: toda caída de hoy es contexto, no regresión.</div>}
        {pauseMode && !(ret && ret.active) && <div style={{ fontSize: 13, color: C.mut, marginTop: 6 }}>Sesión post-pausa: la progresión se congela una sesión.</div>}
      </div>
      {wins.length > 0 && (
        <div data-wins className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.good}55` }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.good, fontFamily: F.disp }}>LO QUE LOGRASTE HOY</div>
          {wins.map((w, i) => <WinLine key={i}>{w.texto}</WinLine>)}
        </div>
      )}
      {!animoOff && <AnimoAsk value={animo} onSkip={() => setAnimoOff(true)} onPick={async (v) => {
        setAnimo(v);
        track("animo_respuesta", animoEventProps(v, "gym"));
        const sv = savedRef.current;
        if (sv) { const h3 = animoEnSesion(sv.hist, sv.date, v); if (await stSet(HKEY, h3)) { savedRef.current = { ...sv, hist: h3 }; onSaved(h3); } }
      }} />}
      <div style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>PRÓXIMA SESIÓN</div>
      {doneRows.map(({ ex, v, plan }) => (
        <div key={ex.id} className="flex items-center justify-between rounded-xl px-3 py-3 gap-2" style={{ background: C.card, border: `1px solid ${plan && plan.startsWith("⬆") ? C.good + "55" : C.line}` }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{v === "alt" && ex.alt ? ex.alt.n : ex.n}</span>
          <span style={{ fontSize: 13, color: plan && plan.startsWith("⬆") ? C.good : C.mut, textAlign: "right" }}>{plan}</span>
        </div>
      ))}
      <NoteField ambito="gym" initial={sessionNote} onCommit={setSessionNote} ph="Nota de la sesión: cómo te sentiste, dolores, contexto" files={{ items: sessionAdj, onChange: setSessionAdj, ambito: "gym" }} />
      {(() => {
        const pending = cambiosDeSesion(fb);
        const ask = writingId ? CAMBIOS.find((c) => c.id === writingId) : pending[0];
        if (!ask) return null;
        return (
          <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <CambioAsk
              nombre={ask && ask.nombre}
              writing={!!writingId}
              onYes={() => onCambio(ask, true)}
              onNo={() => { setWritingId(ask.id); onCambio(ask, false); }}
              onDismiss={() => { if (writingId) setWritingId(""); else if (ask) onCambioDismiss(ask.id); }}
              onText={(t) => onCambioText(writingId, t)}
            />
          </div>
        );
      })()}
      {status !== "ok" && (
        <div className="rounded-2xl px-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <HechaLine tz={tzDone} value={cuando} onChange={(v) => {
            setCuandoTocado(true);
            setCuando(v);
            if (!fechaTrack.current) { fechaTrack.current = true; track("fecha_elegida", { ambito: "gym" }); }
          }} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {status !== "ok" && <button onClick={onBack} className="rounded-xl font-bold" style={{ minHeight: 48, background: C.card2, color: C.txt, border: `1px solid ${C.line}`, fontSize: 15 }}>← Volver a la sesión</button>}
        {status !== "ok" && <button onClick={save} className="rounded-xl font-bold" style={{ minHeight: 52, background: GRAD, color: C.accText, fontSize: 17 }}>{status === "saving" ? "Guardando…" : "Guardar sesión"}</button>}
        {status === "ok" && <div aria-label="Guardado" style={{ textAlign: "center", fontSize: 13, lineHeight: 1, color: C.dim }}>✓</div>}
        {status === "fail" && <Banner tone="err">No se pudo confirmar el guardado. La sesión sigue en este teléfono: vuelve a pulsar Guardar sesión.</Banner>}
        <button onClick={onHome} className="py-2" style={{ color: C.dim, fontSize: 14 }}>Volver al inicio</button>
      </div>
    </div>
  );
};


/* ================================================================
   PESTAÑA TROTE · flujo tipo Pesas: eliges el día, dentro va el plan
   ================================================================ */
const mondayOf = (d) => {
  const dt = typeof d === "string" ? new Date(d.slice(0, 10) + "T12:00:00") : new Date(d);
  dt.setHours(12, 0, 0, 0);
  const wd = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - wd);
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
};
const SLOTS = [
  { k: "res", t: "R1 · RESISTENCIA", sub: "cinta · intervalos" },
  { k: "pot", t: "R2 · POTENCIA", sub: "cinta · intervalos" },
  { k: "lar", t: "LARGO", sub: "exterior · paso relajado" },
];
const EMPTY_P = { nota: "" };
const slotPlan = (week, k) => fixP((week[k] && week[k].p) || (k === "lar" ? { nota: "" } : EMPTY_P));
/* migra protocolos viejos guardados en minutos decimales (1.15 = 1'15\") */
const fixP = (p) => {
  if (!p || !p.t || p.t >= 10) return p;
  const mmss = (x) => { const i = Math.floor(x); const f = Math.round((x - i) * 100); return i * 60 + f; };
  return { ...p, t: mmss(p.t), dt: p.dt < 10 ? mmss(p.dt) : p.dt };
};

/* Semilla: datos reales de Strava jalados vía chat (se actualiza en cada iteración) */
const SEED_RUNS = [
  { id: "19690018998", date: "2026-08-10", km: 0, min: 100, pace: null, re: 119, indoor: true },
  { id: "19606883532", date: "2026-08-04", km: 0, min: 89, pace: null, re: 183, indoor: true },
  { id: "mpot20260729", date: "2026-07-29", km: 0, min: 51, pace: null, re: 0, indoor: true },
  { id: "m1785208706939", date: "2026-07-28", km: 0, min: 37, pace: null, re: 0, indoor: true },
  { id: "19378089939", date: "2026-07-19", km: 13.25, min: 91, pace: "6:53", re: 0, indoor: false },
  { id: "19330807133", date: "2026-07-15", km: 0, min: 80, pace: null, re: 88, indoor: true },
];
const SEED_WALKS = [
  { date: "2026-08-11", min: 20 }, { date: "2026-08-10", min: 19 }, { date: "2026-08-07", min: 17 },
  { date: "2026-08-04", min: 23 }, { date: "2026-08-03", min: 19 },
  { date: "2026-07-27", min: 18 },
  { date: "2026-07-22", min: 20 }, { date: "2026-07-20", min: 17 }, { date: "2026-07-19", min: 32 },
  { date: "2026-07-17", min: 17 }, { date: "2026-07-16", min: 25 }, { date: "2026-07-15", min: 21 },
  { date: "2026-07-13", min: 17 }, { date: "2026-07-11", min: 33 }, { date: "2026-07-10", min: 36 },
];
const SEED_OTROS = [
  { date: "2026-08-08", name: "Golf", min: 28, re: 5 },{ date: "2026-07-28", name: "HIIT nocturno", min: 85, re: 110 }, { date: "2026-07-21", name: "HIIT", min: 83, re: 107 }];
const SEED_ASSIGN = { "19378089939": "lar", "m1785208706939": "res", "mpot20260729": "pot", "19606883532": "res", "19690018998": "res" };
const SEED_DROP = { "m1786038354880": true };
const mergeById = (seed, extra, key) => { const m = {}; [...seed, ...(extra || [])].forEach((r) => { m[r[key]] = r; }); return Object.values(m).filter((r) => !SEED_DROP[r.id]).sort((a, b) => (a.date < b.date ? 1 : -1)); };

const MiniIn = ({ label, v, commit, unit }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 9, color: C.dim, letterSpacing: 0.5, fontWeight: 700, textAlign: "center" }}>{label}</div>
    <input key={v} defaultValue={v} inputMode="decimal"
      onBlur={(e) => { const x = parseFloat(String(e.target.value).replace(",", ".")); if (!isNaN(x) && x >= 0) commit(x); }}
      className="w-full text-center font-bold rounded-lg" style={{ height: 42, fontSize: 16, fontFamily: F.num, background: C.card, color: C.txt, border: `1px solid ${C.line}`, outline: "none" }} />
    {unit && <div style={{ fontSize: 8, color: C.dim, textAlign: "center" }}>{unit}</div>}
  </div>
);

async function stravaSync() {
  const start = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 19);
  const prompt = `Llama la herramienta list_activities de Strava con range_start ${start} y first 40. NO llames ninguna otra herramienta. Con el resultado responde SOLO un objeto JSON valido en una linea, sin markdown, sin texto antes ni despues, formato: {"runs":[{"id":"...","date":"YYYY-MM-DD","km":0,"min":0,"pace":null,"re":0,"indoor":true}],"walks":[{"date":"YYYY-MM-DD","min":0}],"otros":[{"date":"YYYY-MM-DD","name":"...","min":0,"re":0}]}. runs = sport_type Run. km = distance/1000 con 2 decimales (0 si distance es 0). min = moving_time/60 redondeado. pace = "m:ss" min por km solo si km>0, si no null. re = relative_effort o 0. indoor = true si distance es 0. walks = sport_type Walk. otros = todo lo que NO sea Run, Walk ni WeightTraining.`;
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const hdrs = attempt === 0
        ? { "Content-Type": "application/json", "anthropic-beta": "mcp-client-2025-04-04" }
        : { "Content-Type": "application/json" };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }], mcp_servers: [{ type: "url", url: "https://mcp.strava.com/mcp", name: "strava" }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "error de API");
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("respuesta sin JSON");
      return JSON.parse(m[0]);
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const PrescEditor = ({ slot, p, setP }) => {
  if (slot === "lar") return (
    <div className="flex gap-1">
      <MiniIn label="OBJETIVO" unit="min" v={p.min || 0} commit={(x) => setP({ ...p, min: x })} />
      <MiniIn label="O BIEN" unit="km" v={p.km || 0} commit={(x) => setP({ ...p, km: x })} />
    </div>
  );
  const isBlocks = Array.isArray(p.blocks) && p.blocks.length;
  const isVar = !isBlocks && Array.isArray(p.sets);
  const cool = p.cool || { min: 0, v: 0 };
  const toVar = () => setP({ ...p, sets: Array.from({ length: p.n || 1 }, () => ({ v: p.v, inc: p.inc, t: p.t, dt: p.dt })), blocks: undefined });
  const toUni = () => { const { sets, blocks, ...rest } = p; const first = (blocks && blocks[0]) || (sets && sets[0]) || {}; setP({ ...rest, n: (blocks && blocks[0] && blocks[0].n) || (sets || []).length || rest.n, v: first.v, inc: first.inc, t: first.t, dt: first.dt }); };
  const setRow = (i, patch) => { const ns = p.sets.map((x, k) => (k === i ? { ...x, ...patch } : x)); setP({ ...p, sets: ns }); };
  const setBlock = (i, patch) => { const nb = p.blocks.map((x, k) => (k === i ? { ...x, ...patch } : x)); setP({ ...p, blocks: nb }); };
  return (
    <div className="flex flex-col gap-2">
      {!isBlocks && (
        <button onClick={isVar ? toUni : toVar} className="rounded-lg px-3 self-start" style={{ minHeight: 36, fontSize: 12, fontWeight: 700, color: C.acc, background: isVar ? C.accDark : "transparent", border: `1px dashed ${C.acc}88` }}>
          {isVar ? "→ un solo tipo de serie" : "→ series distintas"}
        </button>
      )}
      <div className="flex gap-1">
        <MiniIn label="CAL" unit="min" v={p.cal || 0} commit={(x) => setP({ ...p, cal: x })} />
        <MiniIn label="CAL VEL" unit="km/h" v={p.cv || 0} commit={(x) => setP({ ...p, cv: x })} />
        {!isVar && !isBlocks && <MiniIn label="VECES" v={p.n || 0} commit={(x) => setP({ ...p, n: Math.round(x) })} />}
        {!isBlocks && <MiniIn label="TIEMPO" unit="seg" v={p.t || 0} commit={(x) => setP({ ...p, t: x })} />}
      </div>
      {!isBlocks && (
        <div className="flex gap-1">
          {!isVar && <MiniIn label="VEL" unit="km/h" v={p.v || 0} commit={(x) => setP({ ...p, v: x })} />}
          {!isVar && <MiniIn label="INCL" unit="%" v={p.inc || 0} commit={(x) => setP({ ...p, inc: x })} />}
          <MiniIn label="DESC" unit="seg" v={p.dt || 0} commit={(x) => setP({ ...p, dt: x })} />
          <MiniIn label="DESC VEL" unit="0 = fuera" v={p.dv || 0} commit={(x) => setP({ ...p, dv: x })} />
        </div>
      )}
      {isBlocks && (
        <div className="flex flex-col gap-1">
          {p.blocks.map((row, i) => (
            <div key={i} className="flex items-end gap-1">
              <span style={{ width: 22, fontSize: 12, fontWeight: 800, color: C.acc, fontFamily: F.disp, paddingBottom: 12 }}>{i + 1}</span>
              <MiniIn label="VECES" v={row.n || 1} commit={(x) => setBlock(i, { n: Math.round(x) })} />
              <MiniIn label="SEG" v={row.t || 0} commit={(x) => setBlock(i, { t: x })} />
              <MiniIn label="VEL" v={row.v || 0} commit={(x) => setBlock(i, { v: x })} />
              <MiniIn label="INCL" v={row.inc || 0} commit={(x) => setBlock(i, { inc: x })} />
              <MiniIn label="DESC" v={row.dt || 0} commit={(x) => setBlock(i, { dt: x })} />
              <button onClick={() => setP({ ...p, blocks: p.blocks.filter((_, k) => k !== i) })} className="rounded-lg" style={{ width: 38, height: 42, fontSize: 16, color: C.err, background: C.errDark, marginBottom: 10 }}>×</button>
            </div>
          ))}
          <button onClick={() => setP({ ...p, blocks: [...p.blocks, { ...(p.blocks[p.blocks.length - 1] || { n: 1, t: 30, v: 10, inc: 0, dt: 30 }) }] })} className="rounded-lg" style={{ minHeight: 40, fontSize: 13, fontWeight: 700, color: C.acc, border: `1px dashed ${C.acc}88` }}>+ bloque</button>
        </div>
      )}
      {isVar && (
        <div className="flex flex-col gap-1">
          {p.sets.map((row, i) => (
            <div key={i} className="flex items-end gap-1">
              <span style={{ width: 22, fontSize: 12, fontWeight: 800, color: C.acc, fontFamily: F.disp, paddingBottom: 12 }}>{i + 1}</span>
              <MiniIn label="SEG" v={row.t != null ? row.t : p.t} commit={(x) => setRow(i, { t: x })} />
              <MiniIn label="VEL" v={row.v} commit={(x) => setRow(i, { v: x })} />
              <MiniIn label="INCL" v={row.inc} commit={(x) => setRow(i, { inc: x })} />
              <MiniIn label="DESC" v={row.dt != null ? row.dt : p.dt} commit={(x) => setRow(i, { dt: x })} />
              <button onClick={() => setP({ ...p, sets: p.sets.filter((_, k) => k !== i) })} className="rounded-lg" style={{ width: 38, height: 42, fontSize: 16, color: C.err, background: C.errDark, marginBottom: 10 }}>×</button>
            </div>
          ))}
          <button onClick={() => setP({ ...p, sets: [...p.sets, { ...(p.sets[p.sets.length - 1] || { v: 10, inc: 1 }) }] })} className="rounded-lg" style={{ minHeight: 40, fontSize: 13, fontWeight: 700, color: C.acc, border: `1px dashed ${C.acc}88` }}>+ serie</button>
        </div>
      )}
      <div className="flex gap-1">
        <MiniIn label="ENFRIAM." unit="min" v={cool.min || 0} commit={(x) => setP({ ...p, cool: { ...cool, min: x } })} />
        <MiniIn label="ENF VEL" unit="km/h" v={cool.v || 0} commit={(x) => setP({ ...p, cool: { ...cool, v: x } })} />
      </div>
      <IAParse p={p} setP={setP} />
    </div>
  );
};

/* IA_OK se evaluaba al importar App.jsx, ANTES de installStorage() → en Vercel siempre false.
   El parser local es la fuente de verdad; la IA queda como respaldo si el parse falla. */
function iaOk() {
  return (typeof window !== "undefined" && window.__AI_PROXY__) || (typeof location !== "undefined" && /claude|anthropic|localhost/i.test(location.hostname));
}
const IAParse = ({ p, setP }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const local = () => {
    const r = parseNota(p.nota);
    if (!r) { setMsg({ tone: "err", t: "No leí un plan en la nota. Escribe lo que corriste, por bloques." }); return false; }
    setP(applyParsedProtocol(p, r));
    setMsg({ tone: "good", t: "Plan armado desde tu nota." });
    return true;
  };
  const go = async () => {
    if (!p.nota || busy) { setMsg({ tone: "err", t: "Primero escribe la nota." }); return; }
    setBusy(true); setMsg(null);
    if (local()) { setBusy(false); return; }
    try {
      if (!iaOk()) { setBusy(false); return; }
      const prompt = "Extrae el plan de cinta. Responde SOLO JSON sin markdown: {\"cal\":min,\"cv\":vel_cal_kmh,\"cinc\":incl_cal,\"blocks\":[{\"n\":repeticiones_del_bloque,\"t\":seg_corriendo,\"v\":vel_kmh,\"inc\":incl,\"dt\":seg_descanso}],\"cool\":{\"min\":min_enf,\"v\":vel_enf},\"einc\":incl_enf}. Un bloque distinto = una fila. Si el mismo bloque se repite mas tarde, otra fila. Descripcion: \"" + p.nota.replace(/"/g, "'") + "\"";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "error de API");
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("no entendi el protocolo, reescribelo");
      const r = JSON.parse(m[0]);
      if (!((Array.isArray(r.blocks) && r.blocks.length) || (Array.isArray(r.sets) && r.sets.length))) throw new Error("sin bloques claros");
      setP(applyParsedProtocol(p, r));
      setMsg({ tone: "good", t: "Plan armado desde tu nota." });
    } catch (e) { local(); }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <button onClick={go} className="rounded-xl font-bold" style={{ minHeight: 46, background: busy ? C.card2 : GRAD, color: busy ? C.dim : C.accText, fontSize: 14 }}>{busy ? "Leyendo…" : "Armar el plan desde la nota"}</button>
      {msg && <Banner tone={msg.tone}>{msg.t}</Banner>}
    </div>
  );
};

const pSummary = (slot, p) => {
  if (planIsEmpty(p)) return "sin plan";
  if (slot === "lar") return `${p.km > 0 ? p.km + " km" : (p.min || 60) + " min"} relajado`;
  const lines = formatPlanLines(p);
  return lines.length ? lines.join(" · ") : "sin plan";
};

const PlanLines = ({ p }) => {
  const lines = formatPlanLines(p);
  if (!lines.length) return <div style={{ fontSize: 14, color: C.dim }}>Sin plan todavía.</div>;
  return (
    <div className="flex flex-col gap-1">
      {lines.map((ln, i) => (
        <div key={i} style={{ fontSize: 15, color: C.txt, fontFamily: F.num, lineHeight: 1.35 }}>{ln}</div>
      ))}
    </div>
  );
};

const RunLine = ({ r, big }) => {
  const extra = runExtra(r);
  const facts = runFacts(r);
  return (
    <div className="flex flex-col" style={{ gap: 2, width: "100%" }}>
      <div className="flex items-center justify-between gap-2" style={{ minHeight: 40 }}>
        <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num }}>{r.date.slice(5)}</span>
        {extra.tipo ? <span style={{ fontSize: 12, fontWeight: 700, color: C.mut }}>{extra.tipo}</span> : null}
        {r.re > 0 ? <span style={{ fontSize: big ? 22 : 15, fontWeight: 800, color: C.acc, fontFamily: F.num }}>RE {r.re}</span> : null}
        {facts ? <span style={{ fontSize: 14, color: C.txt, fontFamily: F.num }}>{facts}</span> : null}
      </div>
      {extra.nota ? <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{extra.nota}</div> : null}
    </div>
  );
};
const NoteMark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
    <path d="M3 2.4h5.1L11 5.2V11.6H3z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 2.5V5.2h2.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const RecentRow = ({ r, slot }) => {
  const type = runTypeWord(r, slot);
  const facts = runFacts(r);
  const cuenta = cuentaCierre(r);
  const hora = horaGuardada(r.savedAt, deviceTimeZone());
  return (
    <div className="flex items-center" style={{ minHeight: 44, gap: 8, width: "100%", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num, flexShrink: 0 }}>{r.date.slice(5)}{hora ? " " + hora : ""}</span>
      {type ? <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{type}</span> : null}
      <span style={{ flex: 1 }} />
      {runHasMark(r) ? <span aria-label="Tiene nota" title="Tiene nota" style={{ color: C.mut, display: "flex" }}><NoteMark /></span> : null}
      {cuenta ? <span style={{ fontSize: 12, color: C.mut, fontFamily: F.num }}>estiramiento {cuenta.hechos}/{cuenta.total}</span> : null}
      {facts ? <span style={{ fontSize: 13, color: C.mut, fontFamily: F.num }}>{facts}</span> : null}
    </div>
  );
};
const RunDetail = ({ r, onBack, onAdjuntos, onEditDate }) => {
  const extra = runExtra(r);
  const tz = deviceTimeZone();
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <BrandHeader
        style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 6, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}
        left={<div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-xl font-bold" style={{ minHeight: 44, padding: "0 14px", fontSize: 15, background: C.card, color: C.txt, border: `1.5px solid ${C.line}` }}>←</button>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>{fechaCorta(r.date, tz) || r.date}</div>
        </div>}
      />
      <div className="rounded-2xl p-3 flex flex-col" style={{ background: C.card, border: `1px solid ${C.line}`, gap: 8 }}>
        {extra.tipo ? <div style={{ fontSize: 13, fontWeight: 700, color: C.mut }}>{extra.tipo}</div> : null}
        {(runFacts(r) || r.re > 0) ? (
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: F.num, color: C.txt }}>
            {runFacts(r)}{r.re > 0 ? `${runFacts(r) ? " · " : ""}RE ${r.re}` : ""}
          </div>
        ) : null}
        {extra.nota ? <div style={{ fontSize: 14, color: C.txt, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{extra.nota}</div> : null}
        {(() => {
          const c = cierreDe(r);
          if (!c) return null;
          const hora = horaGuardada(r.savedAt, tz);
          return (
            <div data-cierre-hist className="flex flex-col" style={{ gap: 4, paddingTop: 4, borderTop: `1px solid ${C.line}` }}>
              {hora ? <div style={{ fontSize: 13, color: C.mut, fontFamily: F.num }}>Hora real {hora}</div> : null}
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: C.acc, fontFamily: F.disp }}>ESTIRAMIENTO FINAL{c.min > 0 ? " · " + c.min + " MIN" : ""}</div>
              {c.items.map((it) => (
                <div key={it.id} className="flex items-start" style={{ gap: 8, minHeight: 28 }}>
                  <span style={{ width: 18, flexShrink: 0, color: it.hecho ? C.good : C.dim, fontWeight: 800 }}>{it.hecho ? "✓" : "·"}</span>
                  <span style={{ fontSize: 14, color: it.hecho ? C.txt : C.mut, lineHeight: 1.35, overflowWrap: "break-word" }}>{it.n}{it.dosis ? " · " + it.dosis : ""}</span>
                </div>
              ))}
            </div>
          );
        })()}
        <FechaEdit fecha={r.date} onPick={(d) => onEditDate(r.id, d)} />
        <AdjuntoBox items={r.adjuntos} ambito="running" onChange={onAdjuntos} />
      </div>
    </div>
  );
};

const TroteTab = ({ trote, setTrote, hist, prefSel, onPrefUsed, regresoUi, onHideRun, onShowRun, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const wk = mondayOf(new Date());
  const [sel, setSel] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [moreRuns, setMoreRuns] = useState(false);
  const [writingAdj, setWritingAdj] = useState(false);
  const [sync, setSync] = useState("idle");
  const [syncErr, setSyncErr] = useState("");
  const [editP, setEditP] = useState(false);
  const [mMin, setMMin] = useState(""); const [mRe, setMRe] = useState("");
  const [animoResp, setAnimoResp] = useState({}); const [animoOmit, setAnimoOmit] = useState({});
  const [writingRun, setWritingRun] = useState("");
  const [runAviso, setRunAviso] = useState("");
  const [adj, setAdj] = useState(false);
  const [shMsg, setShMsg] = useState(null);
  const [shRaw, setShRaw] = useState("");
  useEffect(() => { setEditP(false); setAdj(false); setShMsg(null); setSync("idle"); setShRaw(""); }, [sel]);
  useEffect(() => {
    if (prefSel && prefSel.k) {
      setSel(prefSel.k);
      if (onPrefUsed) onPrefUsed();
    }
  }, [prefSel]); // eslint-disable-line
  const weeks = trote.weeks || {};
  const week = weeks[wk] || {};
  const runs = mergeById(SEED_RUNS, trote.runs, "id");
  const runSug = suggestRunReturn(runs, dateKey(new Date()));
  const assign = { ...SEED_ASSIGN, ...(trote.assign || {}) };
  const setWeekSlot = (slot, patch) => setTrote({ ...trote, weeks: { ...weeks, [wk]: { ...week, [slot]: { ...(week[slot] || {}), ...patch } } } });
  const doSync = async () => {
    setSync("loading");
    try {
      const d = await stravaSync();
      const oldIds = new Set((trote.runs || []).map((r) => r.id));
      const newRuns = [...(trote.runs || []), ...(d.runs || []).filter((r) => !oldIds.has(r.id))];
      const na = { ...(trote.assign || {}) };
      (d.runs || []).forEach((r) => { if (!na[r.id] && !SEED_ASSIGN[r.id] && !r.indoor) na[r.id] = "lar"; });
      setTrote({ ...trote, runs: newRuns, walks: d.walks || trote.walks, otros: d.otros || trote.otros, assign: na, lastSync: new Date().toISOString() });
      setSync("ok");
    } catch (e) { setSyncErr(String((e && e.message) || e).slice(0, 120)); setSync("err"); }
  };
  const lastOf = (k) => { const r = runs.find((x) => assign[x.id] === k); return r ? r.date : null; };
  const wkRuns = runs.filter((r) => mondayOf(r.date) === wk);
  const unassigned = wkRuns.filter((r) => r.indoor && !assign[r.id]);
  const prevWk = mondayOf(new Date(new Date(wk).getTime() - 7 * 86400000));
  const openRun = openId ? runs.find((r) => String(r.id) === String(openId)) : null;
  const saveRunAdj = (adjuntos) => {
    if (!openRun) return;
    const list = (trote.runs || []).filter((x) => String(x.id) !== String(openRun.id));
    setTrote({ ...trote, runs: list.concat([{ ...openRun, adjuntos }]) });
  };
  const adjCambio = CAMBIOS.find((c) => c.id === "notas_adjuntos");
  const adjPending = pendingCambios(fb).some((c) => c.id === "notas_adjuntos");
  const askAdj = (!writingAdj && adjPending) ? (
    <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <CambioAsk
        nombre={adjCambio.nombre}
        writing={false}
        onYes={() => onCambio(adjCambio, true)}
        onNo={() => { setWritingAdj(true); onCambio(adjCambio, false); }}
        onDismiss={() => onCambioDismiss(adjCambio.id)}
        onText={() => {}}
      />
    </div>
  ) : writingAdj ? (
    <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <CambioAsk
        nombre={adjCambio.nombre}
        writing
        onYes={() => {}}
        onNo={() => {}}
        onDismiss={() => setWritingAdj(false)}
        onText={(t) => onCambioText("notas_adjuntos", t)}
      />
    </div>
  ) : null;

  const editRunDate = (id, nueva) => {
    const all = mergeById(SEED_RUNS, trote.runs, "id");
    const cur = all.find((r) => String(r.id) === String(id));
    if (!cur) return;
    const next = editarFecha(cur, nueva, new Date(), deviceTimeZone());
    if (next === cur) return;
    const list = (trote.runs || []).filter((r) => String(r.id) !== String(id));
    setTrote({ ...trote, runs: list.concat([next]) });
    track("fecha_editada", { ambito: "running" });
  };
  const registrar = (k, body) => {
    const r = {
      id: "m" + Date.now(),
      date: body.date,
      savedAt: body.savedAt,
      km: body.km || 0,
      min: body.min,
      pace: null,
      re: 0,
      indoor: !!body.indoor,
      ...(body.nota ? { nota: body.nota } : {}),
      ...(Array.isArray(body.adjuntos) && body.adjuntos.length ? { adjuntos: body.adjuntos } : {}),
      ...(isAnimo(body.animo) ? { animo: body.animo } : {}),
      ...(body.cierre && Array.isArray(body.cierre.items) && body.cierre.items.length ? { cierre: body.cierre } : {}),
    };
    if (body.nota) trackNote("running", k, "", body.nota);
    setTrote({ ...trote, runs: [...(trote.runs || []), r], assign: { ...(trote.assign || {}), [r.id]: k } });
    const props = { min: body.min, tipo: k };
    if (r.cierre) props.cierre_hechos = r.cierre.items.filter((x) => x && x.hecho).length;
    track("trote_registrado", props);
    setRunAviso("Registrada");
    setSel(null);
  };
  const askRun = (() => {
    const pending = cambiosDeRunning(fb);
    return writingRun ? CAMBIOS.find((c) => c.id === writingRun) : pending[0];
  })();
  const cambioRun = askRun ? (
    <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <CambioAsk
        nombre={askRun.nombre}
        writing={!!writingRun}
        onYes={() => { onCambio(askRun, true); setWritingRun(""); }}
        onNo={() => { setWritingRun(askRun.id); onCambio(askRun, false); }}
        onDismiss={() => { if (writingRun) setWritingRun(""); else onCambioDismiss(askRun.id); }}
        onText={(t) => onCambioText(writingRun, t)}
      />
    </div>
  ) : null;

  if (openRun) return <RunDetail r={openRun} onBack={() => setOpenId(null)} onAdjuntos={saveRunAdj} onEditDate={editRunDate} />;

  if (!sel) return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <BrandHeader
        style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 6, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}
        left={<div>
          <div style={{ fontSize: 13, letterSpacing: 3, color: C.acc, fontWeight: 700, fontFamily: F.disp }}>RUNNING</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 1.1 }}>¿Qué corres hoy?</div>
        </div>}
        right={<button onClick={doSync} className="rounded-xl font-bold px-4" style={{ minHeight: 44, background: sync === "loading" ? C.card2 : C.acc, color: sync === "loading" ? C.dim : C.accText, fontSize: 14 }}>{sync === "loading" ? "…" : "⟳ Strava"}</button>}
      />
      {sync === "err" && <Banner tone="err">Sync directo falló ({syncErr}). El canal alterno vía chat sigue activo: tus datos están al día.</Banner>}
      {sync === "ok" && <Banner tone="good">Strava sincronizado ✓</Banner>}
      {runAviso && <Banner tone="good">{runAviso}</Banner>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {TIPOS.map(({ k, t, sub }) => {
          const done = wkRuns.some((r) => assign[r.id] === k);
          const ld = lastOf(k);
          const ds = ld ? daysSince(ld) : null;
          return (
            <button key={k} type="button" data-running-tipo={k} onClick={() => { setSel(k); setEditP(false); setRunAviso(""); track("running_tipo", { tipo: k }); }} className="rounded-2xl p-4 text-left" style={{ minHeight: 148, background: C.card, border: `1.5px solid ${done ? C.good : C.line}` }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 0.95, color: done ? C.good : C.txt }}>{t}</div>
              <div style={{ fontSize: 14, color: C.mut, marginTop: 8, lineHeight: 1.3 }}>{sub}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 12, fontFamily: F.num }}>{done ? "✓ esta semana" : textoHaceCorto(ds)}</div>
            </button>
          );
        })}
      </div>
      <RunHint sug={runSug} ui={regresoUi} onHide={onHideRun} onShow={onShowRun} />
      {unassigned.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: C.warnDark, border: `1px solid ${C.warn}55` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.warn, marginBottom: 4 }}>CINTA SIN ETIQUETAR</div>
          {unassigned.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2" style={{ minHeight: 44 }}>
              <span style={{ fontSize: 12, fontFamily: F.num }}>{r.date.slice(5)}{runFacts(r) ? " · " + runFacts(r) : ""}{r.re > 0 ? " · RE " + r.re : ""}</span>
              <div className="flex gap-1">
                {["res", "pot"].map((sl) => (
                  <button key={sl} onClick={() => {
                    const na = { ...(trote.assign || {}), [r.id]: sl };
                    const wkOf = mondayOf(r.date);
                    const keep = (trote.runs || []).filter((x) => !(String(x.id).startsWith("m") && (na[x.id] || (trote.assign || {})[x.id]) === sl && mondayOf(x.date) === wkOf));
                    setTrote({ ...trote, runs: keep, assign: na });
                  }} className="rounded-lg px-3 font-bold" style={{ minHeight: 38, fontSize: 12, background: C.card, color: C.acc, border: `1px solid ${C.acc}` }}>{sl.toUpperCase()}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {(() => {
        const seen = new Set();
        const recent = [];
        runs.forEach((r) => {
          const id = String(r.id);
          if (seen.has(id)) return;
          seen.add(id);
          recent.push(r);
        });
        if (!recent.length) return null;
        const shown = moreRuns ? recent : recent.slice(0, 5);
        return (
          <div className="flex flex-col" style={{ gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.dim, letterSpacing: 1 }}>RECIENTES</div>
            {shown.map((r) => (
              <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="rounded-xl px-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <RecentRow r={r} slot={assign[r.id]} />
              </button>
            ))}
            {recent.length > 5 ? (
              <button type="button" onClick={() => setMoreRuns(!moreRuns)} style={{ minHeight: 44, fontSize: 13, fontWeight: 700, color: C.mut, background: "transparent" }}>{moreRuns ? "ver menos" : "ver más"}</button>
            ) : null}
          </div>
        );
      })()}
      {cambioRun}
      {askAdj}
    </div>
  );

  const k = sel;
  const metaTipo = TIPOS.find((x) => x.k === k) || { k, t: k, preset: false };
  const slotP = metaTipo.preset ? planDelSlot(weeks, k) : null;
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <BrandHeader
        style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 6, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}
        left={<div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="rounded-xl font-bold" style={{ minHeight: 44, padding: "0 14px", fontSize: 15, background: C.card, color: C.txt, border: `1.5px solid ${C.line}` }}>←</button>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>{metaTipo.t}</div>
        </div>}
      />
      <RegistroCorrida key={k} tipo={k} plan={slotP} runs={runs} onSave={(body) => registrar(k, body)} />
      {metaTipo.preset && (
        <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <button type="button" onClick={() => setEditP(!editP)} className="text-left" style={{ minHeight: 40, fontSize: 13, fontWeight: 700, color: C.mut, background: "transparent" }}>{editP ? "Cerrar el plan" : "Editar plan"}</button>
          {editP && slotP && <PrescEditor slot={k} p={slotP} setP={(np) => setWeekSlot(k, { p: np })} />}
        </div>
      )}
    </div>
  );
};
/* ================================================================
   HOME: solo lo que toca hoy.
   ================================================================ */
const HOY_NOMBRE = { A: "Push", B: "Pull", C: "Legs + Core", res: "Resistencia", pot: "Potencia", lar: "Largo", lib: "Libre" };
const HomeTab = ({ volver, onCorto, onAnimoRun, hist, trote, doneSetsCount, dayId, onBegin, ret, runSug, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const theme = useThemeCtl();
  const tz = deviceTimeZone();
  const today = useMemo(() => new Date(), []);
  const runs = useMemo(() => mergeById(SEED_RUNS, trote && trote.runs, "id"), [trote]);
  const assign = useMemo(() => ({ ...SEED_ASSIGN, ...((trote && trote.assign) || {}) }), [trote]);
  const checks = useMemo(() => chipDoneMap(hist, runs, assign, today, tz), [hist, runs, assign, today, tz]);
  const auto = useMemo(() => pickHoy({
    hist, runs, assign, today,
    draftDay: doneSetsCount > 0 ? dayId : "",
    draftSets: doneSetsCount,
    timeZone: tz,
  }), [hist, runs, assign, today, dayId, doneSetsCount, tz]);
  const [picked, setPicked] = useState(null);
  const target = picked || auto;
  const nombre = HOY_NOMBRE[target.id] || target.id;
  const sinCulpa = !picked ? lineaSinCulpa(volver, nombre, target.kind === "gym") : "";
  const linea = sinCulpa || lineaHoy({ target, hist, runs, assign, ret, runSug, today, timeZone: tz });
  const [writingId, setWritingId] = useState("");
  const [cambiar, setCambiar] = useState(false);
  const [animoResp, setAnimoResp] = useState({}); const [animoOmit, setAnimoOmit] = useState({});
  const elegir = (kind, id) => {
    setPicked({
      kind, id,
      continue: kind === "gym" && doneSetsCount > 0 && dayId === id,
      done: !!checks[id],
      weekComplete: false,
    });
    track("hoy_elegido", { ambito: kind === "gym" ? "gym" : "running", cual: id });
  };
  const decidido = !!picked || !auto.weekComplete;
  const chips = [
    ...ORDER.map((d) => ({ kind: "gym", id: d, label: HOY_NOMBRE[d] })),
    ...["pot", "res", "lar", "lib"].map((k) => ({ kind: "run", id: k, label: HOY_NOMBRE[k] })),
  ];
  const Chip = (o) => {
    const on = target.kind === o.kind && target.id === o.id;
    const done = !!checks[o.id];
    return (
      <button key={o.kind + o.id} onClick={() => elegir(o.kind, o.id)} className="rounded-xl px-2 font-bold" style={{
        minHeight: 40, fontSize: 11, fontFamily: F.disp, letterSpacing: 0.6, textTransform: "uppercase",
        background: on ? GRAD : C.card,
        color: on ? C.accText : done ? C.dim : C.txt,
        border: on ? "none" : `1.5px solid ${done ? C.line : C.acc + "55"}`,
      }}>{done ? "✓ " : ""}{o.label}</button>
    );
  };
  const askHome = (() => {
    const pending = cambiosDeHome(fb);
    return writingId ? CAMBIOS.find((c) => c.id === writingId) : pending[0];
  })();
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div data-home-head className="home-head" style={{ marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 0 }}>
        <div aria-hidden="true" />
        <BrandHome />
        {theme && <ThemeToggle mode={theme.mode} onChange={theme.setMode} />}
      </div>
      <div data-hoy className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.acc, fontFamily: F.disp }}>HOY TOCA</div>
        <div style={{ fontSize: 34, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 0.95 }}>{nombre}</div>
        <div style={{ fontSize: 15, color: C.mut, lineHeight: 1.35 }}>{linea}</div>
        <button onClick={() => onBegin(target)} className="rounded-2xl font-bold" style={{ minHeight: 48, background: GRAD, color: C.accText, fontSize: 17, fontFamily: F.disp, letterSpacing: 1 }}>
          {target.continue ? "SEGUIR" : "EMPEZAR"} {nombre.toUpperCase()} →
        </button>
        <button type="button" aria-label="Cambiar día" aria-expanded={cambiar} onClick={() => setCambiar((c) => !c)} style={{ alignSelf: "flex-start", minHeight: 32, padding: 0, background: "transparent", color: C.dim, fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>⋯</button>
        {cambiar && [["GYM", chips.slice(0, 3)], ["RUNNING", chips.slice(3)]].map(([g, list]) => (
          <div key={g} className="flex items-center gap-2">
            <span style={{ width: 58, flexShrink: 0, fontSize: 10, fontWeight: 800, fontFamily: F.disp, letterSpacing: 1, color: C.dim }}>{g}</span>
            <div className="flex gap-1" style={{ flexWrap: "wrap", flex: 1 }}>{list.map(Chip)}</div>
          </div>
        ))}
      </div>
      {cambiar && fraterHoy(today, tz) && target.kind === "gym" && !target.continue && (() => {
        const hecho = runs.some((r) => assign[r.id] === "corto" && dateKey(r.date, tz) === dateKey(today, tz));
        return (
          <div data-frater className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1.5px dashed ${C.acc}88` }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.acc, fontFamily: F.disp }}>JUEVES DE FRATER · OPCIÓN</div>
            <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.35 }}>Si hoy no llegas al Gym: trote corto de 30 min, a tu ritmo. También cuenta como sesión.</div>
            {hecho
              ? <>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.good }}>✓ Trote corto anotado hoy</div>
                {(() => {
                  const ar = runParaAnimo(runs, today, tz, { slot: "corto", assign, respondidas: animoResp, omitidas: animoOmit });
                  if (!ar) return null;
                  return <AnimoAsk bare value={isAnimo(animoResp[ar.id]) ? animoResp[ar.id] : null} onSkip={() => setAnimoOmit({ ...animoOmit, [ar.id]: true })} onPick={(v) => { setAnimoResp({ ...animoResp, [ar.id]: v }); onAnimoRun(ar.id, v); }} />;
                })()}
              </>
              : <button onClick={onCorto} className="rounded-xl font-bold" style={{ minHeight: 48, background: C.card2, color: C.txt, border: `1.5px solid ${C.acc}`, fontSize: 15, fontFamily: F.disp, letterSpacing: 0.8 }}>✓ LO CORRÍ · ANOTAR 30 MIN</button>}
          </div>
        );
      })()}
      <MetaSemanalCard hist={hist} runs={runs} assign={assign} volver={volver} target={target} decidido={decidido} />
      {askHome && (
        <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <CambioAsk
            nombre={askHome.nombre}
            writing={!!writingId}
            onYes={() => onCambio(askHome, true)}
            onNo={() => { setWritingId(askHome.id); onCambio(askHome, false); }}
            onDismiss={() => { if (writingId) setWritingId(""); else onCambioDismiss(askHome.id); }}
            onText={(t) => onCambioText(writingId, t)}
          />
        </div>
      )}
    </div>
  );
};


/* ============ APP ============ */
export default function App() {
  useKeyboardInset();
  const [themeMode, setThemeMode] = useState(loadThemeMode);
  const [, setThemeTick] = useState(0);
  applyTheme(themeMode);
  const [screen, setScreen] = useState("loading");
  const [hist, setHist] = useState([]);
  const [dayId, setDayId] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [hombro, setHombro] = useState(null);
  const [hombroReg, setHombroReg] = useState(null);
  const [logs, setLogs] = useState({});
  const [pauseMode, setPauseMode] = useState(null);
  const [units, setUnitsRaw] = useState({});
  const [gyms, setGyms] = useState(() => [asegurarGyms([], [])[0]]);
  const [catalogo, setCatalogo] = useState({});
  const [gymSel, setGymSel] = useState(HABITUAL_ID);
  const [gymSesion, setGymSesion] = useState(HABITUAL_ID);
  const [propuesta, setPropuesta] = useState(null);
  const [avisoGym, setAvisoGym] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [sessionAdj, setSessionAdj] = useState([]);
  const [fb, setFb] = useState({ answered: {}, dismissed: {}, texto: {} });
  const fbRef = useRef(fb);
  fbRef.current = fb;
  const saveFb = (next) => { fbRef.current = next; setFb(next); stSet(FKEY, next); };
  const onCambio = (cambio, util) => {
    if (!cambio) return;
    saveFb(recordFeedback(fbRef.current, { id: cambio.id, util }));
    track("cambio_feedback", feedbackEventProps(cambio, util));
  };
  const onCambioDismiss = (id) => { if (id) saveFb(dismissCambio(fbRef.current, id)); };
  const onCambioText = (id, texto) => { if (id) saveFb(saveCambioTexto(fbRef.current, id, texto)); };
  const [homeMsg, setHomeMsg] = useState(null);
  const [tab, setTab] = useState("home");
  const [prefDay, setPrefDay] = useState(null);
  const [prefSlot, setPrefSlot] = useState(null);
  const [trote, setTroteRaw] = useState({});
  const [regresoUi, setRegresoUi] = useState({ dismissed: {}, skip: {}, manual: {}, bannerSeen: {}, runHidden: {}, prefer: "" });
  const setTrote = (t) => { setTroteRaw(t); stSet("gymu_trote_v1", t); };
  const volver = useMemo(() => regresoStats(hist, mergeById(SEED_RUNS, trote && trote.runs, "id"), new Date(), deviceTimeZone()), [hist, trote]);
  const todayK = dateKey(new Date());
  const ret = resolveReturn(hist, todayK, regresoUi);
  const gap = gapSinceLastGym(hist, todayK);
  const planHist = planningHist(hist, ret);
  const saveRegreso = (next) => { setRegresoUi(next); stSet(RKEY, next); };
  const episode = (ret && ret.episodeId) || "";
  const origenRegreso = ret && ret.source === "manual" ? "manual" : "auto";
  const dismissReturn = () => { if (episode) { saveRegreso(dismissEpisode(regresoUi, episode)); track("regreso_apagado", { origen: origenRegreso }); } };
  const skipReturn = () => { if (episode) { saveRegreso(skipEpisode(regresoUi, episode)); track("regreso_saltado", {}); } };
  const unskipReturn = () => { if (episode) { saveRegreso(unskipEpisode(regresoUi, episode)); track("regreso_deshecho", {}); } };
  const collapseReturn = () => { if (episode) { saveRegreso(collapseBanner(regresoUi, episode)); track("regreso_entendido", {}); } };
  const reactivateReturn = () => {
    if (!episode) return;
    const next = reactivateEpisode(regresoUi, episode);
    if (ret.source !== "manual") next.prefer = "";
    saveRegreso(next);
    track("regreso_reactivado", { origen: origenRegreso });
  };
  const beginManual = (weeks, week) => {
    const base = manualBaseline(ret, gap);
    if (!base.lastDate) return;
    saveRegreso(startManualReturn(regresoUi, { lastDate: base.lastDate, weeks, week, gapDays: base.gapDays, today: todayK }));
  };
  const useCalculated = () => {
    const raw = analyzeReturn(hist, todayK);
    if (!raw.active) return;
    saveRegreso(useCalculatedReturn(regresoUi, episodeId(raw)));
  };
  const notice = { ret, regresoUi, gap, onDismiss: dismissReturn, onSkip: skipReturn, onUnskip: unskipReturn, onCollapse: collapseReturn, onReactivate: reactivateReturn, onManual: beginManual, onCalculated: useCalculated };
  const runsForHint = mergeById(SEED_RUNS, trote.runs, "id");
  const runSug = suggestRunReturn(runsForHint, todayK);
  const runId = runEpisodeId(runSug);
  const hideRun = () => { if (runId) { saveRegreso(hideRunHint(regresoUi, runId)); track("running_sugerencia_oculta", {}); } };
  const showRun = () => { if (runId) { saveRegreso(showRunHint(regresoUi, runId)); track("running_sugerencia_mostrada", {}); } };
  const setTheme = (mode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
    stSet(THEME_KEY, mode);
    applyTheme(mode);
    setThemeTick((n) => n + 1);
    track("tema_cambiado", { modo: mode });
  };
  const draftT = useRef(null);
  const startedAtRef = useRef(null);
  const seenPantalla = useRef("");
  const regTracked = useRef("");
  const setUnits = (u) => { setUnitsRaw(u); stSet(UKEY, u); };
  const gymActivo = (gyms || []).find((g) => g.id === ((screen === "session" || screen === "done") ? gymSesion : gymSel)) || (gyms || [])[0];
  const elegirGym = (id) => {
    if (!id) return;
    setGymSel(id);
    stSet(GYM_SEL_KEY, id);
    setAvisoGym("");
  };
  const guardarListaGyms = (lista) => {
    const next = asegurarGyms(lista, hist);
    setGyms(next);
    stSet(GYM_KEY, next);
    return next;
  };
  const commitSessionNote = (t) => { trackNote("gym", "", sessionNote, t); setSessionNote(t); };
  const delSession = async (i) => {
    const dia = hist[i] && hist[i].day;
    const h2 = hist.filter((_, k) => k !== i);
    const ok = await stSet(HKEY, h2);
    if (ok) { setHist(h2); setHomeMsg({ tone: "good", t: "Sesión borrada ✓" }); track("sesion_borrada", { dia }); }
    else setHomeMsg({ tone: "err", t: "El caché no confirmó el borrado. Intenta de nuevo." });
  };
  const editGymDate = async (i, nueva) => {
    const cur = hist[i];
    if (!cur) return;
    const next = editarFecha(cur, nueva, new Date(), deviceTimeZone());
    if (next === cur) return;
    const h2 = hist.map((s, k) => (k === i ? next : s));
    const ok = await stSet(HKEY, h2);
    if (ok) { setHist(h2); track("fecha_editada", { ambito: "gym" }); }
  };

  useEffect(() => {
    (async () => {
      const h = (await stGet(HKEY)) || [];
      setHist(h);
      const gStored = (await stGet(GYM_KEY)) || [];
      const gNext = asegurarGyms(gStored, h);
      setGyms(gNext);
      if (JSON.stringify(gNext) !== JSON.stringify(gStored)) stSet(GYM_KEY, gNext);
      setCatalogo((await stGet(MAQ_KEY)) || {});
      const sel = await stGet(GYM_SEL_KEY);
      if (sel && gNext.some((g) => g.id === sel)) setGymSel(sel);
      setUnitsRaw((await stGet(UKEY)) || {});
      const rawTrote = (await stGet("gymu_trote_v1")) || {};
      const hydrated = hydrateTroteFromNotas(rawTrote);
      setTroteRaw(hydrated);
      if (hydrated !== rawTrote) stSet("gymu_trote_v1", hydrated);
      const rawReg = (await stGet(RKEY)) || {};
      setRegresoUi({
        dismissed: rawReg.dismissed || {},
        skip: rawReg.skip || {},
        manual: rawReg.manual || {},
        bannerSeen: rawReg.bannerSeen || {},
        runHidden: rawReg.runHidden || {},
        prefer: rawReg.prefer || "",
      });
      const th = await stGet(THEME_KEY);
      if (th === "light" || th === "dark" || th === "system") {
        setThemeMode(th);
        saveThemeMode(th);
        applyTheme(th);
      }
      const rawFb = (await stGet(FKEY)) || {};
      setFb({ answered: rawFb.answered || {}, dismissed: rawFb.dismissed || {}, texto: rawFb.texto || {} });
      setHombroReg(await stGet(HOMBRO_KEY));
      const d = await stGet(DKEY);
      if (d && d.dayId && d.logs && Object.keys(d.logs).length) {
        startedAtRef.current = d.startedAt || Date.now();
        setDayId(d.dayId); setEnergy(d.energy || "regular"); setHombro(d.hombro || null); setLogs(d.logs);
        setGymSesion(d.gymId || HABITUAL_ID);
        setPauseMode(d.pauseMode || null); setSessionNote(d.sessionNote || "");
        setSessionAdj(Array.isArray(d.sessionAdjuntos) ? d.sessionAdjuntos : []);
        setScreen("session");
      } else setScreen("home");
    })();
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onCh = () => { applyTheme("system"); setThemeTick((n) => n + 1); };
    if (mq.addEventListener) mq.addEventListener("change", onCh);
    else mq.addListener(onCh);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onCh);
      else mq.removeListener(onCh);
    };
  }, [themeMode]);

  useEffect(() => {
    if (screen !== "session" && screen !== "done") return;
    clearTimeout(draftT.current);
    draftT.current = setTimeout(() => { stSet(DKEY, { dayId, energy, hombro, logs, pauseMode, gymId: gymSesion, sessionNote, sessionAdjuntos: sessionAdj, startedAt: startedAtRef.current || null }); }, 600);
    return () => clearTimeout(draftT.current);
  }, [logs, sessionNote, sessionAdj, screen, gymSesion]); // eslint-disable-line

  useEffect(() => {
    if (tab !== "pesas" || screen !== "home") return undefined;
    let cancel = false;
    (async () => {
      const permiso = await permisoUbicacion();
      if (permiso !== "granted" || cancel) return;
      const punto = await leerUbicacion();
      if (!punto || cancel) return;
      setPropuesta(proponerGym(gyms, punto, gymSel));
    })();
    return () => { cancel = true; };
  }, [tab, screen, gyms, gymSel]);

  const detectarGym = async () => {
    const punto = await leerUbicacion();
    if (!punto) { setAvisoGym("Sin permiso de ubicación. Elige el gym a mano."); return; }
    const p = proponerGym(gyms, punto, gymSel);
    setPropuesta(p);
    setAvisoGym(p ? "" : "No hay un gym guardado cerca. Elige uno o guarda la ubicación.");
  };
  const guardarUbicacionGym = async () => {
    const punto = await leerUbicacion();
    if (!punto) { setAvisoGym("Sin permiso de ubicación. Elige el gym a mano."); return; }
    guardarListaGyms((gyms || []).map((g) => (g.id === gymSel ? { ...g, lat: punto.lat, lng: punto.lng } : g)));
    setAvisoGym("Ubicación guardada.");
  };
  const confirmarGym = () => {
    if (!propuesta) return;
    elegirGym(propuesta.gymId);
    setPropuesta(null);
  };

  const doneSetsCount = Object.values(logs || {}).reduce((a, l) => { const n = norm(l); return a + (n.sets || []).filter((x) => x && x.done).length; }, 0);
  const start = (d, e, h) => {
    if (d === dayId && doneSetsCount > 0) { setScreen("session"); return; }
    if (dayId && doneSetsCount > 0 && d !== dayId) track("sesion_abandonada", { dia: dayId, series_hechas: doneSetsCount });
    const ds = daysSince(lastDateOf(hist, d));
    const rawRet = analyzeReturn(hist, todayK);
    const shown = resolveReturn(hist, todayK, regresoUi);
    setPauseMode(rawRet.active || shown.active ? null : (ds > 21 ? "long" : ds > 7 ? "short" : null));
    startedAtRef.current = Date.now();
    let hb = null;
    if (h && HOMBRO_DIAS[d]) {
      const fecha = new Date().toISOString();
      const reg2 = registrar(hombroReg, { fecha, dia: d, dolor: h.dolor, intensidad: h.intensidad, modo: e });
      setHombroReg(reg2); stSet(HOMBRO_KEY, reg2);
      track("hombro_respuesta", { sesion: HOMBRO_DIAS[d], dolor: !!h.dolor, intensidad: h.dolor ? h.intensidad : 0 });
      hb = { dolor: !!h.dolor, molestia: !!h.dolor, intensidad: h.dolor ? h.intensidad : 0, semana: semanaRehab(reg2), bump: bumpRehab(reg2, hist) };
    } else if (h && h.molestia) {
      hb = { dolor: false, molestia: true, semana: 1 };
    }
    setHombro(hb);
    setGymSesion(gymSel);
    setDayId(d); setEnergy(e); setLogs({}); setSessionNote(""); setSessionAdj([]); setScreen("session");
    track("sesion_iniciada", { dia: d, gym: gymSel });
  };
  const beginHoy = (target) => {
    if (!target) return;
    if (target.kind === "run") {
      setPrefSlot({ k: target.id, ts: Date.now() });
      setTab("trote");
      return;
    }
    if (dayId && doneSetsCount > 0 && dayId === target.id) {
      setTab("pesas");
      setScreen("session");
      return;
    }
    if (dayId && doneSetsCount > 0) {
      setPrefDay({ d: target.id, ts: Date.now() });
      setTab("pesas");
      return;
    }
    setPrefDay({ d: target.id, ts: Date.now() });
    setTab("pesas");
  };
  const seriesPlanCount = () => {
    const day = sessionDay(dayId, energy, hist, hombro);
    if (!day) return 0;
    const mode = pauseMode === "long" ? "recal" : energy === "mala" || energy === "baja" || energy === "relajado" || pauseMode === "short" ? "hold" : "grow";
    const viewHist = ret && ret.active ? hist : (planHist || hist);
    return day.ex.reduce((sum, ex) => {
      const l = norm(logs[ex.id]);
      const v = l.v || "main";
      const built = ret && ret.active ? retPlanFor(hist, ex, v, ret) : null;
      const plan = resolverPlan(viewHist, dayId, ex, v, mode, gymActivo, gyms, ret).sets;
      return sum + (plan ? plan.length : 0);
    }, 0);
  };
  const finishSession = () => {
    const duracion_min = startedAtRef.current ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 60000)) : 0;
    track("sesion_terminada", {
      dia: dayId,
      duracion_min,
      series_hechas: doneSetsCount,
      series_plan: seriesPlanCount(),
      en_regreso: !!(ret && ret.active),
    });
    setScreen("done");
  };
  useEffect(() => {
    if (screen === "loading") return;
    const pantalla = tab === "pesas" ? "gym" : tab === "trote" ? "running" : "home";
    if (!seenPantalla.current) track("app_abierta", { pantalla });
    if (seenPantalla.current !== pantalla) {
      seenPantalla.current = pantalla;
      track("pantalla_vista", { pantalla });
    }
  }, [screen, tab]);
  useEffect(() => {
    if (screen === "loading" || !ret || !ret.active || !ret.episodeId) return;
    const id = String(ret.episodeId);
    if (regTracked.current === id) return;
    let prev = "";
    try { prev = localStorage.getItem("entreno_track_regreso") || ""; } catch { /* seguir */ }
    regTracked.current = id;
    if (prev === id) return;
    try { localStorage.setItem("entreno_track_regreso", id); } catch { /* seguir */ }
    track("regreso_activado", {
      origen: ret.source === "manual" ? "manual" : "auto",
      dias_hueco: Number(ret.gapDays) || 0,
      semanas: ret.program && ret.program.weeks ? ret.program.weeks : 0,
    });
  }, [screen, ret]);

  return (
    <ThemeCtlCtx.Provider value={{ mode: themeMode, setMode: setTheme }}>
    <div className="app-shell">
      <div className="app-scroll" style={{ background: C.bg, color: C.txt, fontFamily: "-apple-system,'Segoe UI',Roboto,sans-serif" }}>
        {screen === "loading" && <div className="p-8 text-center" style={{ color: C.dim, paddingTop: "calc(32px + var(--sat))" }}>Cargando…</div>}
        {tab === "home" && screen !== "loading" && <HomeTab volver={volver} onCorto={() => { const ahora = new Date(); const r = { id: "m" + Date.now(), date: hoyLocal(), savedAt: ahora.toISOString(), km: 0, min: 30, pace: null, re: 0, indoor: false, nota: "Trote corto (jueves de frater)" }; setTrote({ ...trote, runs: [...(trote.runs || []), r], assign: { ...(trote.assign || {}), [r.id]: "corto" } }); track("trote_registrado", { min: 30 }); }} onAnimoRun={(id, v) => { setTrote(animoEnRun(trote, id, v)); track("animo_respuesta", animoEventProps(v, "run")); }} hist={hist} trote={trote} doneSetsCount={doneSetsCount} dayId={dayId} onBegin={beginHoy} ret={ret} runSug={runHintVisible(runSug, regresoUi) ? runSug : null} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "trote" && screen !== "loading" && <TroteTab trote={trote} setTrote={setTrote} hist={hist} prefSel={prefSlot} onPrefUsed={() => setPrefSlot(null)} regresoUi={regresoUi} onHideRun={hideRun} onShowRun={showRun} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "pesas" && screen === "home" && <Home hombroReg={hombroReg} prefDay={prefDay} notice={notice} gyms={gyms} gymId={gymSel} propuesta={propuesta} avisoGym={avisoGym} onElegirGym={elegirGym} onCrearGym={(g) => { const next = guardarListaGyms([...(gyms || []), g]); if (next.some((x) => x.id === g.id)) elegirGym(g.id); }} onEditarGym={(g) => guardarListaGyms((gyms || []).map((x) => (x.id === g.id ? g : x)))} onConfirmarGym={confirmarGym} onDetectarGym={detectarGym} onUbicacionGym={guardarUbicacionGym} ongoing={dayId && doneSetsCount > 0 ? { dayId, count: doneSetsCount } : null} onResume={() => setScreen("session")} troteRef={trote} hist={hist} onStart={start} onDelete={delSession} onEditDate={editGymDate} onImport={(h, t) => { setHist(h); stSet(HKEY, h); const gNext = asegurarGyms(gyms, h); setGyms(gNext); stSet(GYM_KEY, gNext); if (t) { const ht = hydrateTroteFromNotas(t); setTroteRaw(ht); stSet("gymu_trote_v1", ht); } }} msg={homeMsg} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "pesas" && screen === "session" && <Session hombro={hombro} dayId={dayId} hist={hist} planHist={planHist} energy={energy} logs={logs} setLogs={setLogs} pauseMode={pauseMode} units={units} setUnits={setUnits} gym={gymActivo} gyms={gyms} catalogo={catalogo} onEnergy={setEnergy} onHombro={setHombro} onGym={(id) => { setGymSesion(id); elegirGym(id); }} sessionNote={sessionNote} setSessionNote={commitSessionNote} sessionAdj={sessionAdj} setSessionAdj={setSessionAdj} ret={ret} notice={notice} onFinish={finishSession} onBack={() => setScreen("home")} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "pesas" && screen === "done" && <Done volver={volver} hombro={hombro} dayId={dayId} hist={hist} planHist={planHist} energy={energy} logs={logs} pauseMode={pauseMode} sessionNote={sessionNote} setSessionNote={commitSessionNote} sessionAdj={sessionAdj} setSessionAdj={setSessionAdj} units={units} gym={gymActivo} gyms={gyms} onMaquinas={(ls) => {
          if (!gymActivo || gymActivo.id === HABITUAL_ID) return;
          const unidades = {};
          Object.keys(DAYS).forEach((d) => (DAYS[d].ex || []).forEach((e) => { unidades[e.id] = e.u === "kg" ? "kg" : "lb"; }));
          const maquinas = maquinasDeSesion(gymActivo, ls, unidades);
          const marcaFoto = gymActivo.marca ? "" : marcaDeFotos(ls);
          guardarListaGyms((gyms || []).map((g) => (g.id === gymActivo.id ? { ...g, maquinas, ...(marcaFoto ? { marca: marcaFoto } : {}) } : g)));
          let cat = catalogo || {};
          Object.entries(ls || {}).forEach(([id, l]) => {
            if (!l || !l.maquina) return;
            const hechos = (l.sets || []).filter((s) => s && s.done);
            const top = hechos.reduce((a, s) => ((Number(s.w) || 0) >= (Number(a.w) || 0) ? s : a), hechos[0] || {});
            cat = registrarMaquina(cat, { nombre: l.maquina, patron: (maquinas[id] && maquinas[id].patron) || "", gymId: gymActivo.id, gymNombre: gymActivo.nombre, exId: id, peso: top.w || 0, unidad: gymActivo.unidad, reps: top.r || 0 });
          });
          setCatalogo(cat);
          stSet(MAQ_KEY, cat);
        }} onSaved={(h) => setHist(h)} onHome={() => { setLogs({}); setScreen("home"); }} onBack={() => setScreen("session")} ret={ret} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
      </div>
      <nav className="app-tabs" aria-label="Secciones" style={{ background: C.card }}>
        {[["home", "HOME"], ["pesas", "GYM"], ["trote", "RUNNING"]].map(([k, l]) => (
          <button key={k} type="button" data-tab={k} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)} style={{ fontFamily: F.disp, fontSize: 15, fontWeight: 700, letterSpacing: 1.2, color: tab === k ? C.acc : C.dim, background: tab === k ? C.accDark : "transparent", borderTop: tab === k ? `3px solid ${C.acc}` : "3px solid transparent" }}>{l}</button>
        ))}
      </nav>
    </div>
    </ThemeCtlCtx.Provider>
  );
}
