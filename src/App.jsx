import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { parseNota, applyParsedProtocol, hydrateTroteFromNotas, formatPlanLines, planIsEmpty } from "./parseNota.js";
import { afterCompleteOpenIds, applyVuelta, firstPendingExId, fmtClock, isKeyboardChromeOpen, keyboardInsetPx, lastOptFor, nextSessionExId, noteFixedBox, optLabel, padPlan, resolveOpt, sessionExIds, shouldDockNote, vueltaHeldSec } from "./exTools.js";
import { C, THEME_KEY, applyTheme, loadThemeMode, nextThemeMode, saveThemeMode, themeActionLabel } from "./theme.js";
import { analyzeReturn, bannerModel, buildReturnPlan, collapseBanner, dateKey, dismissEpisode, episodeId, gapSinceLastGym, hideRunHint, levelAt, manualBaseline, manualChoices, manualProgram, metReturnPlan, planningHist, reactivateEpisode, resolveReturn, runEpisodeId, runHintText, runHintVisible, showRunHint, skipEpisode, startManualReturn, suggestRunReturn, unskipEpisode, useCalculatedReturn } from "./regreso.js";
import { deviceTimeZone, track } from "./track.js";
import { CAMBIOS, cambioForEx, cambiosDeHome, cambiosDeSesion, dismissCambio, feedbackEventProps, pendingCambios, recordFeedback, saveCambioTexto } from "./cambios.js";
import { REACCIONES, chipDoneMap, constanciaStats, flattenCatalog, hitosState, lineaHoy, markReaccion, pickHoy, pickVariante, reaccionVisible, recentRecords } from "./logros.js";
import { adjuntoEventProps, filesFromClipboard, prepareUpload, runExtra, runFacts, runHasMark, runTypeWord, signAdjunto, uploadAdjunto, uploadErrorText } from "./adjuntos.js";

/* ============ TOKENS: C vive en theme.js (claro / oscuro) ============ */
const GRAD = "linear-gradient(135deg,#E8102E 0%,#FF6A00 100%)";
const F = { num: "'SF Mono','Roboto Mono',monospace", disp: "'Anton','Arial Black','Avenir Next Condensed',sans-serif" };
const LOGO_SRC = "/entreno-logo.png";
const FLECHA_SRC = "/entreno-flecha.png";
const BrandHome = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 0 10px" }}>
    <img src={LOGO_SRC} alt="ENTRENO" style={{ height: 32, width: "auto", display: "block", borderRadius: 6 }} />
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

/* ============ CATÁLOGO ============ */
const DAYS = {
  A: {
    name: "Push", mus: "Pecho · Hombros · Tríceps",
    secs: [
      { t: "Pecho · fuerza base", ids: ["a1", "a2"] },
      { t: "Hombros", note: "Entran frescos a propósito: el orden importa", ids: ["a3", "a4", "a5"] },
      { t: "Pecho · ángulo superior", ids: ["a6", "a7"] },
      { t: "Tríceps", ids: ["a8", "a9"] },
      { t: "Cierre · peso corporal", ids: ["a10", "a11"] },
    ],
    ex: [
      { id: "a1", n: "Chest Press TRUE", lbl: "stack total", u: "lb", step: 5, rng: [8, 12], cues: ["Escápulas retraídas y pegadas", "Codos a 45°, no abiertos", "Espalda completa al respaldo"], prev: [[115,11],[115,11],[115,11],[115,11]], alt: { n: "Press Mancuernas Plano", lbl: "× mano", factor: 0.4 } },
      { id: "a2", n: "Pec Deck", lbl: "stack", u: "lb", step: 5, rng: [8, 12], cues: ["ROM completo", "1 seg de squeeze al centro", "No bloquees en la apertura"], prev: [[120,11],[120,11],[120,11],[120,11]], alt: { n: "Aperturas en Cable", lbl: "× lado", factor: 0.3 } },
      { id: "a3", n: "Shoulder Press TRUE", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Lumbar apoyada siempre", "Sube sin bloquear codos", "Hombro fresco: aprovéchalo"], prev: [[80,11],[80,11],[80,11]], alt: { n: "Press Arnold Mancuerna", lbl: "× mano", factor: 0.5 } },
      { id: "a4", n: "Elev. Frontales", lbl: "lbs", u: "lb", step: 5, rng: [12, 15], cues: ["Sin inercia, sube controlado", "Hasta altura de hombro", "Técnica sobre peso"], prev: [[30,13],[30,13],[30,13]], alt: { n: "Cable Frontal Un Brazo", lbl: "× lado", factor: 0.5 } },
      { id: "a5", n: "Elev. Laterales", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], cues: ["Codo suave, no rígido", "Cero trapecio: no encojas", "Bajada lenta"], prev: [[20,15],[20,15],[20,15]], alt: { n: "Cable Lateral Un Brazo", lbl: "× lado", factor: 0.5 } },
      { id: "a6", n: "Press Inclinado Barra", lbl: "total con barra", u: "lb", step: 5, rng: [8, 12], cues: ["Banco a 30°", "Agarre un poco más ancho que los hombros", "Baja la barra al pecho alto, sin rebotar"], prev: [[65,11],[70,11],[70,8]], alt: { n: "Press Máquina Inclinado", lbl: "stack", factor: 2.2 } },
      { id: "a7", n: "Crossover mancuernas", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], cues: ["Mancuernas de abajo hacia arriba", "Codos semiflexionados fijos", "Aprieta 1 seg al cruzar arriba"], prev: [[25,13],[25,13],[25,13]], alt: { n: "Aperturas DB Planas", lbl: "× mano", factor: 1 } },
      { id: "a8", n: "Rompecocos", lbl: "barra EZ", u: "lb", step: 5, rng: [8, 12], cues: ["Codos fijos al techo", "Baja a la frente controlado", "Cierra con press explosivo, misma barra"], prev: [[60,9],[60,9],[60,9]], alt: { n: "Extensión Sobre Cabeza DB", lbl: "mancuerna", factor: 0.8 } },
      { id: "a9", n: "Extensión Polea", lbl: "stack", u: "lb", step: 4, rng: [12, 15], cues: ["Codos pegados al torso", "Abre la cuerda al final", "Salto de +4 lbs"], prev: [[42,13],[42,13],[42,13]], alt: { n: "Patada de Tríceps DB", lbl: "× mano", factor: 0.4 } },
      { id: "a10", n: "Fondos Asistidos", lbl: "asistencia", u: "kg", step: 5, rng: [6, 10], type: "assist", cues: ["Torso ligeramente al frente", "Codos hacia atrás", "Menos asistencia = progreso"], prev: [[31.8,7],[27.2,7],[22.7,7]], alt: { n: "Fondos en banco", lbl: "reps", factor: 0 } },
      { id: "a11", n: "Push-ups (rodillas)", lbl: "reps", u: "lb", type: "body", rng: [6, 12], cues: ["Rodillas apoyadas, cadera en línea", "Manos elevadas", "Core apretado"], prev: [[0,8],[0,8],[0,8]], alt: { n: "Push-ups", lbl: "reps", factor: 1 } },
    ],
  },
  B: {
    name: "Pull", mus: "Espalda · Bíceps",
    secs: [
      { t: "Espalda · anchura", ids: ["b1"] },
      { t: "Espalda · densidad", ids: ["b2", "b3", "b4"] },
      { t: "Progresión pull-up", note: "Fase 3: rumbo al pull-up estricto", ids: ["b10", "b5"] },
      { t: "Bíceps", ids: ["b6", "b7", "b8"] },
      { t: "Core lumbar seguro", ids: ["b9", "b11"] },
    ],
    ex: [
      { id: "b1", n: "Jalón", lbl: "stack", u: "lb", step: 15, rng: [8, 12], cues: ["Pecho arriba", "Codos al bolsillo", "Sin balanceo del torso"], prev: [[132.3,11],[132.3,11],[132.3,11],[132.3,11]], alt: { n: "Pull-over en Polea", lbl: "stack", factor: 0.6 } },
      { id: "b2", n: "Low Row", lbl: "stack", u: "lb", step: 5, rng: [8, 12], cues: ["Tiro horizontal de cable", "Escápulas atrás al final", "Sin impulso lumbar"], prev: [[132.3,11],[132.3,11],[132.3,11],[132.3,11]], alt: { n: "Remo Máquina", lbl: "stack", factor: 1 } },
      { id: "b3", n: "Remo Mancuerna", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Rodilla y mano al banco", "Espalda neutra siempre", "Codo pegado al cuerpo"], prev: [[80,11],[80,11],[80,11]], alt: { n: "Remo Cable Un Brazo", lbl: "× lado", factor: 0.6 } },
      { id: "b4", n: "Remo pecho apoyado", lbl: "× mano", u: "lb", step: 5, rng: [8, 12], cues: ["Pecho pegado al pad inclinado", "Dos mancuernas a la vez", "Jala con la espalda, no el brazo"], prev: [[55,12],[55,12],[55,12]], alt: { n: "Remo pecho 1 brazo", lbl: "× lado", factor: 1 } },
      /* b5 stays chin-up so past logs keep the same key. New primary in this block is b10. */
      { id: "b5", n: "Chin-up asistido", lbl: "asistencia", u: "kg", step: 5, rng: [5, 8], type: "assist", cues: ["Agarre supino (palmas a ti)", "Pecho a la barra", "Baja lento: ahí está el progreso"], prev: [[45,8],[40,6],[40,6]], alt: { n: "Chin-up con banda", lbl: "reps", factor: 0 } },
      { id: "b10", n: "Pull-up asistido", lbl: "asistencia", u: "kg", step: 5, rng: [5, 8], type: "assist", cues: ["Agarre prono (palmas adelante)", "Hombros abajo, pecho a la barra", "Baja lento: ahí está el progreso"], prev: [[45,8],[40,6],[40,6]], fresh: true, alt: { n: "Pull-up con banda", lbl: "reps", factor: 0 } },
      { id: "b6", n: "Curl EZ", lbl: "barra", u: "lb", step: 5, rng: [8, 12], cues: ["Codos fijos a los costados", "Si aparece balanceo: baja peso, no calidad", "Aprieta 1 seg arriba"], prev: [[70,11],[70,10],[70,8]], alt: { n: "Curl Barra en Polea", lbl: "stack", factor: 0.8 } },
      { id: "b7", n: "Curl Martillo", lbl: "× mano", u: "lb", step: 5, rng: [8, 12], cues: ["Muñeca neutra", "Control total en bajada", "Sin impulso de hombro"], prev: [[35,8],[35,8],[35,8]], alt: { n: "Curl Cuerda en Polea", lbl: "stack", factor: 1.2 } },
      { id: "b8", n: "Curl Inclinado", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], nSets: 3, cues: ["Banco a 45°", "Estiramiento completo abajo", "Sube sin mover el codo"], prev: [[20,10],[15,9],[15,9]], alt: { n: "Curl concentrado", lbl: "× mano", factor: 1 } },
      { id: "b9", n: "Bird-dog", lbl: "reps / lado", u: "lb", type: "body", rng: [10, 15], cues: ["Manos y rodillas, lumbar quieta", "Brazo y pierna opuestos a la vez", "Lento: no gires la cadera"], prev: [[0,15],[0,15],[0,15]], alt: { n: "Dead-bug", lbl: "reps / lado", factor: 1 } },
      { id: "b11", n: "Hiperextensión", lbl: "disco", u: "lb", step: 5, rng: [10, 15], cues: ["Cadera en el pad, lumbar neutra", "Sube hasta la línea del cuerpo, no más", "Baja controlado, sin rebote"], prev: [[0,12],[0,12],[0,12]], fresh: true, alt: { n: "Hiperextensión máquina", lbl: "stack", factor: 1 } },
    ],
  },
  C: {
    name: "Legs + Core", mus: "Piernas · Core",
    secs: [
      { t: "Base pesada", note: "Lo más demandante primero, con energía completa", ids: ["c1", "c2"] },
      { t: "Cuádriceps", ids: ["c3"] },
      { t: "Glúteo y cadera", note: "Bloque reforzado: glúteo era tu grupo con menos volumen semanal", ids: ["c4", "c11", "c5", "c6"] },
      { t: "Pantorrilla", ids: ["c8"] },
      { t: "Core · cierre", ids: ["c7", "c12", "c9", "c10"] },
    ],
    ex: [
      { id: "c1", n: "Prensa de Pierna", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Lumbar pegada al respaldo", "No bloquees rodillas", "Baja hasta 90° controlado"], prev: [[170,12],[215,12],[260,12],[285,12]], alt: { n: "Prensa 1 Pierna", lbl: "× pierna", factor: 0.5 } },
      { id: "c2", n: "Curl Femoral", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Cadera pegada al banco", "No la despegues al subir", "Control en la bajada"], prev: [[90,14],[90,14],[90,14],[90,14]], alt: { n: "Curl Femoral de Pie", lbl: "× pierna", factor: 0.5 } },
      { id: "c3", n: "Ext. Cuádriceps", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Pausa 1 seg arriba", "Baja controlado", "Sin latigazo de rodilla"], prev: [[120,15],[120,15],[120,15],[120,15]], alt: { n: "Ext. 1 pierna", lbl: "× pierna", factor: 0.5 } },
      { id: "c4", n: "Hip Thrust Máquina", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Barbilla al pecho", "Aprieta glúteo 1 seg arriba", "Sin arquear la lumbar"], prev: [[180,13],[180,13],[180,13]], alt: { n: "Puente Glúteo DB", lbl: "mancuerna", factor: 0.6 } },
      { id: "c5", n: "Abductor (abre)", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["ABductor = ABre hacia afuera", "Trabaja glúteo medio (externo)", "Torso quieto, sin rebotes"], prev: [[120,14],[120,14],[120,14]], alt: { n: "Elev. lateral de pierna", lbl: "× pierna", factor: 0.3 } },
      { id: "c6", n: "Aductor (cierra)", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["ADuctor = junta hacia aDentro", "Trabaja cara interna del muslo", "Rango completo antes que carga"], prev: [[95,14],[95,14],[95,14]], alt: { n: "Aducción en polea", lbl: "× pierna", factor: 0.4 } },
      { id: "c7", n: "Ab Crunch (tempo)", lbl: "stack · máquina al tope", u: "lb", step: 10, rng: [12, 20], cues: ["Piernas suben y tronco baja; codos libres", "Baja en 3 seg, pausa 1 seg abajo", "Máquina en su tope: el tempo sustituye al peso"], prev: [[200,21],[200,16],[200,16]], alt: { n: "Crunch en Polea Alta", lbl: "stack", factor: 0.5 } },
      { id: "c8", n: "Talones Sentado", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Pausa abajo en estiramiento", "Sube al máximo", "Sin rebote"], prev: [[130,13],[130,13],[130,13]], alt: { n: "Talones de pie", lbl: "stack", factor: 1 } },
      { id: "c11", n: "Extensión de Cadera en Máquina", lbl: "× lado", u: "lb", step: 5, rng: [12, 15], cues: ["De pie: la otra pierna solo apoya en el piso", "Empuja el rodillo atrás y aprieta glúteo 1 seg", "Tronco quieto, sin arquear la lumbar"], prev: [[45,12],[45,12],[40,12]], fresh: true, alt: { n: "Patada de Glúteo en Polea", lbl: "× pierna", factor: 0.5 } },
      { id: "c12", n: "Press Pallof (oblicuos)", lbl: "× lado", u: "lb", step: 4, rng: [10, 15], cues: ["Anti-rotación: resiste el giro, no gires", "Brazos extendidos al frente, core firme", "Cero flexión lumbar: ideal para tu columna", "Salto de +4 lbs"], prev: [[20,12],[20,12],[20,12]], alt: { n: "Pallof vertical", lbl: "× lado", factor: 0.8 } },
      { id: "c9", n: "Plancha", lbl: "segundos", u: "lb", type: "time", rng: [40, 60], cues: ["Glúteo apretado", "Cadera arriba, lumbar neutra", "Respira"], prev: [[0,95],[0,60],[0,45]], alt: { n: "Plancha sobre rodillas", lbl: "segundos", factor: 1 } },
      { id: "c10", n: "Reverse Crunch", lbl: "reps", u: "lb", type: "body", rng: [8, 15], cues: ["Banca inclinada ~10°: en plana ya tocaste el tope de reps", "Lumbar pegada al banco", "Sube pelvis con control", "Lento cuenta doble"], prev: [[0,12],[0,12],[0,12]], opts: [{ id: "flat", n: "Plana" }, { id: "dec10", n: "Declive ~10°" }], optDefault: "dec10", alt: { n: "Knee tucks", lbl: "reps", factor: 1 } },
    ],
  },
};
const ORDER = ["A", "B", "C"];
const HKEY = "gymu_history_v1", DKEY = "gymu_draft_v4", UKEY = "gymu_units_v1", RKEY = "gymu_regreso_v1", FKEY = "gymu_cambio_fb_v1";

/* ============ HELPERS ============ */
const score = (w, r) => (w > 0 ? w * (1 + r / 30) : r);
const daysSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
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
  const vid = v === "alt" ? ex.id + "~alt" : ex.id;
  const out = [];
  for (let i = hist.length - 1; i >= 0 && out.length < 2; i--) {
    if (hist[i].day !== dayId) continue;
    const l = hist[i].logs && hist[i].logs[ex.id] ? norm(hist[i].logs[ex.id]) : null;
    const lv = l && (l.v === "alt" ? ex.id + "~alt" : ex.id);
    if (l && lv === vid) {
      const d = l.sets.filter((s) => s && s.done).map((s) => [s.w, s.r]);
      if (d.length) out.push(d);
    }
  }
  return out;
}
function prevFor(hist, dayId, ex, v) {
  const two = lastTwo(hist, dayId, ex, v);
  if (two.length) return { sets: two[0], real: true };
  if (v === "alt") return { sets: ex.prev.map(([w, r]) => [roundStep(w * ex.alt.factor, ex.step || 5), r]), real: false };
  /* fresh: first log starts empty so he can probar fuerza; later sessions use lastTwo */
  if (ex.fresh) return { sets: [], real: false, probe: true };
  return { sets: ex.prev, real: true };
}
function bestPrev(hist, dayId, ex, v) {
  const p = prevFor(hist, dayId, ex, v);
  let b = 0;
  p.sets.forEach(([w, r]) => { b = Math.max(b, score(w, r)); });
  const vid = v === "alt" ? ex.id + "~alt" : ex.id;
  hist.forEach((s) => {
    if (s.day !== dayId || !s.logs || !s.logs[ex.id]) return;
    const l = norm(s.logs[ex.id]); const lv = l.v === "alt" ? ex.id + "~alt" : ex.id;
    if (lv === vid) l.sets.forEach((x) => { if (x && x.done) b = Math.max(b, score(x.w, x.r)); });
  });
  return b;
}
/* Plan estratégico: doble progresión + consolidación si la semana pasada hubo retroceso */
function planFor(hist, dayId, ex, v, mode) {
  const [lo, hi] = ex.rng; const st = ex.step || 5;
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
  const sameW = ex.type !== "assist" && ex.type !== "body" && ex.type !== "time" && prev.sets.length > 1 && prev.sets.every(([w]) => w === prev.sets[0][0]);
  let planned;
  if (sameW && prev.real && mode === "grow") {
    const minR = Math.min(...prev.sets.map(([, r]) => r));
    const W = prev.sets[0][0];
    planned = prev.sets.map(() => (minR >= hi ? { w: W + st, r: lo } : { w: W, r: Math.min(hi, minR + 1) }));
  } else {
    planned = prev.sets.map(([w, r], k) => {
      if (mode === "hold" || !prev.real) return { w, r };
      if (ex.type === "time") return { w: 0, r: r >= hi ? r : r + 5 };
      if (ex.type === "body") return { w: 0, r: Math.min(hi, r + 1) };
      if (mode === "recal") return { w: roundStep(w * 0.87, st), r };
      if (before && before[k] && r < before[k][1] && w >= before[k][0]) return { w, r };
      if (ex.type === "assist") return r >= hi ? { w: Math.max(st, w - st), r: lo } : { w, r: Math.min(hi, r + 1) };
      if (allTop) return { w: w + st, r: lo };   /* sube cada serie a su siguiente escalón, reinicia reps */
      if (r >= hi) return { w: w + st, r: lo };
      return { w, r: Math.min(hi, r + 1) };
    });
  }
  return padPlan(planned, ex.nSets, planned[planned.length - 1] || { w: 0, r: lo });
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
    const lv = l && (l.v === "alt" ? ex.id + "~alt" : ex.id);
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
    width: 40, height: 44, fontSize: 18, flexShrink: 0,
    background: accent ? C.accDark : "transparent", color: accent ? C.acc : C.txt,
  }}>{children}</button>
);
const YtLink = ({ name, ex }) => (
  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(name + " técnica")}`}
    target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); track("video_abierto", { ex }); }}
    title="Ver técnica en YouTube" aria-label={"YouTube: " + name + " técnica"}
    className="rounded-lg flex items-center justify-center"
    style={{ width: 44, height: 44, flexShrink: 0, background: "#FF0000", textDecoration: "none", boxSizing: "border-box" }}>
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFFFFF" d="M8 5.2v13.6L19 12z" /></svg>
  </a>
);
/* Silent looping movement clip (Hevy-style). Prefer /previews/{id}.gif|mp4, else jsDelivr GIF. */
const PREVIEW_CDN = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/";
const PREVIEW = {
  a1: "pectorals/lever-chest-press.gif",
  "a1~alt": "pectorals/dumbbell-bench-press.gif",
  a2: "pectorals/lever-seated-fly.gif",
  "a2~alt": "pectorals/cable-middle-fly.gif",
  a3: "delts/lever-military-press.gif", // seated plate-loaded machine (TRUE), not standing landmine
  "a3~alt": "delts/dumbbell-arnold-press.gif",
  a4: "delts/dumbbell-front-raise.gif",
  "a4~alt": "delts/cable-front-raise.gif",
  a5: "delts/dumbbell-lateral-raise.gif",
  "a5~alt": "delts/cable-one-arm-lateral-raise.gif",
  a6: "pectorals/barbell-incline-bench-press.gif",
  "a6~alt": "pectorals/lever-incline-chest-press.gif",
  a7: "/previews/a7.gif",
  "a7~alt": "pectorals/dumbbell-fly.gif",
  a8: "triceps/barbell-lying-triceps-extension-skull-crusher.gif",
  "a8~alt": "triceps/dumbbell-standing-triceps-extension.gif",
  a9: "triceps/cable-pushdown-with-rope-attachment.gif",
  "a9~alt": "triceps/dumbbell-kickback.gif",
  a10: "pectorals/assisted-chest-dip-kneeling.gif",
  "a10~alt": "triceps/bench-dip-knees-bent.gif",
  a11: "pectorals/kneeling-push-up-male.gif",
  "a11~alt": "pectorals/push-up.gif",
  b1: "lats/cable-pulldown.gif",
  "b1~alt": "lats/cable-straight-arm-pulldown-with-rope.gif",
  b2: "upper-back/cable-seated-row.gif",
  "b2~alt": "upper-back/lever-seated-row.gif",
  b3: "upper-back/dumbbell-one-arm-bent-over-row.gif",
  "b3~alt": "upper-back/cable-one-arm-bent-over-row.gif",
  b4: "upper-back/dumbbell-incline-row.gif",
  "b4~alt": "upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif",
  b5: "lats/lever-assisted-chin-up.gif",
  "b5~alt": "lats/assisted-standing-chin-up.gif",
  b10: "lats/assisted-pull-up.gif",
  "b10~alt": "lats/band-assisted-pull-up.gif",
  b6: "biceps/ez-barbell-curl.gif",
  "b6~alt": "biceps/cable-curl.gif",
  b7: "biceps/dumbbell-hammer-curl.gif",
  "b7~alt": "biceps/cable-hammer-curl-with-rope.gif",
  b8: "biceps/dumbbell-incline-curl.gif",
  "b8~alt": "biceps/dumbbell-concentration-curl.gif",
  b9: "/previews/b9.gif",
  "b9~alt": "abs/dead-bug.gif",
  b11: "spine/hyperextension.gif",
  "b11~alt": "spine/lever-back-extension.gif",
  c1: "glutes/sled-45-leg-press.gif",
  "c1~alt": "glutes/sled-45-degrees-one-leg-press.gif",
  c2: "hamstrings/lever-lying-leg-curl.gif",
  "c2~alt": "hamstrings/standing-single-leg-curl.gif",
  c3: "quads/lever-leg-extension.gif",
  "c3~alt": "quads/resistance-band-leg-extension.gif",
  c4: "/previews/c4.gif",
  "c4~alt": "glutes/low-glute-bridge-on-floor.gif",
  c5: "abductors/lever-seated-hip-abduction.gif",
  "c5~alt": "abductors/side-hip-abduction.gif",
  c6: "adductors/lever-seated-hip-adduction.gif",
  "c6~alt": "adductors/cable-hip-adduction.gif",
  c7: "/previews/c7.gif",
  "c7~alt": "abs/cable-kneeling-crunch.gif",
  c8: "calves/lever-seated-calf-raise.gif",
  "c8~alt": "calves/lever-standing-calf-raise.gif",
  c11: "/previews/c11.mp4",
  "c11~alt": "glutes/cable-standing-hip-extension.gif",
  c12: "abs/band-horizontal-pallof-press.gif",
  "c12~alt": "abs/band-vertical-pallof-press.gif",
  c9: "abs/weighted-front-plank.gif",
  "c9~alt": "abs/kneeling-plank-tap-shoulder-male.gif",
  c10: "abs/reverse-crunch.gif",
  "c10~alt": "abs/tuck-crunch.gif",
};
function previewSrc(ex, v) {
  const key = v === "alt" && ex.alt ? ex.id + "~alt" : ex.id;
  const file = PREVIEW[key] || PREVIEW[ex.id];
  if (!file) return null;
  if (/^https?:/i.test(file) || file.startsWith("/")) return file;
  return PREVIEW_CDN + file;
}
function useNow(on) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [on]);
  return now;
}
/* Plancha: one running clock. Vuelta flips trabajo ↔ descanso without stopping. */
const VueltaTimer = ({ clock, onVuelta, refSec }) => {
  const running = !!(clock && clock.startedAt);
  const now = useNow(running);
  const total = running ? now - clock.startedAt : 0;
  const phaseMs = running ? now - clock.phaseAt : 0;
  const rest = running && clock.phase === "rest";
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
      <div style={{ textAlign: "center", fontFamily: F.num, fontSize: 42, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: C.txt }}>{fmtClock(total)}</div>
      <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: rest ? C.mut : C.acc }}>
        {!running ? "LISTO" : rest ? "DESCANSO" : "TRABAJO"}
        {running ? <span style={{ color: C.dim, fontWeight: 700, letterSpacing: 0, marginLeft: 8 }}>{fmtClock(phaseMs)}</span> : null}
      </div>
      {typeof refSec === "number" && <div style={{ textAlign: "center", fontSize: 12, color: C.dim }}>referencia {refSec} seg</div>}
      <button type="button" onClick={onVuelta} className="w-full rounded-xl font-bold" style={{ minHeight: 52, fontSize: 18, background: GRAD, color: C.accText }}>
        {running ? "Vuelta" : "Empezar"}
      </button>
    </div>
  );
};
const PreviewClip = ({ ex, v }) => {
  const src = previewSrc(ex, v);
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(true); }, [src]);
  if (!src || !ok) return null;
  const mp4 = /\.mp4(\?|$)/i.test(src);
  const mediaStyle = { width: "100%", display: "block", maxHeight: 220, objectFit: "contain", background: "#111318" };
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: C.card2, border: `1px solid ${C.line}` }}>
      {mp4 ? (
        <video src={src} muted loop autoPlay playsInline preload="metadata" onError={() => setOk(false)} style={mediaStyle} />
      ) : (
        <img src={src} alt="" onError={() => setOk(false)} style={mediaStyle} />
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
function paintKbChrome(metrics, focused) {
  const kb = keyboardInsetPx(metrics);
  const root = document.documentElement;
  root.style.setProperty("--kb", kb + "px");
  const vv = metrics.vv || {};
  root.style.setProperty("--vv-off", ((vv && vv.offsetTop) || 0) + "px");
  root.classList.toggle("kb-open", isKeyboardChromeOpen(kb, focused));
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
function parkNote(el) {
  if (!el) return;
  const panel = el.__notePanel || el;
  const wrap = el.__noteWrap;
  delete el.dataset.docked;
  panel.classList.remove("note-docked");
  el.classList.remove("note-docked");
  const text = noteTextWrap(el);
  if (text) ["flex", "minHeight", "display"].forEach((k) => { text.style[k] = ""; });
  ["height", "flex", "minHeight", "maxHeight", "width", "margin", "position"].forEach((k) => { el.style[k] = ""; });
  panel.style.position = "absolute";
  panel.style.margin = "0";
  panel.style.right = "auto";
  panel.style.boxSizing = "border-box";
  panel.style.overflow = "visible";
  panel.style.height = "auto";
  panel.style.maxHeight = "none";
  panel.style.zIndex = "5";
  if (!wrap) return;
  const r = wrap.getBoundingClientRect();
  panel.style.top = (r.top + (window.scrollY || 0)) + "px";
  panel.style.left = (r.left + (window.scrollX || 0)) + "px";
  panel.style.width = Math.max(120, r.width) + "px";
  wrap.style.minHeight = Math.max(panel.offsetHeight || 0, 72) + "px";
}
function placeNote(el) {
  if (!el || !isNoteField(el)) return;
  const wrap = el.__noteWrap;
  const panel = el.__notePanel || el;
  const owns = noteOwnsFocus(el);
  const metrics = readKbMetrics(owns);
  const kb = keyboardInsetPx(metrics);
  if (!shouldDockNote(owns, kb) || !el.__portaled) {
    parkNote(el);
    return;
  }
  const natural = Math.min(Math.max(el.scrollHeight || 72, 72), 220);
  const extra = el.__attachExtra || 0;
  panel.style.position = "fixed";
  panel.style.margin = "0";
  panel.style.right = "auto";
  panel.style.boxSizing = "border-box";
  panel.style.overflow = "visible";
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
  el.style.height = "auto";
  el.style.minHeight = "64px";
  el.style.width = "100%";
}
function syncNoteChrome() {
  const notes = [...document.querySelectorAll("textarea.note-field")];
  const any = notes.some(noteOwnsFocus);
  paintKbChrome(readKbMetrics(any), any);
  notes.forEach((el) => placeNote(el));
}
function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => syncNoteChrome();
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
const Cluster = ({ v, commit, onMinus, onPlus, unit, flex }) => (
  <div style={{ flex: flex || 1, minWidth: 0 }}>
    <div className="flex items-stretch rounded-xl" style={{ border: `1.5px solid ${C.line}`, background: C.card, minWidth: 0, overflow: "hidden" }}>
      <Step onClick={onMinus}>−</Step>
      <input key={v} defaultValue={v} inputMode="decimal"
        onBlur={(e) => { const x = parseFloat(String(e.target.value).replace(",", ".")); if (!isNaN(x) && x >= 0) commit(x); }}
        className="text-center font-bold" style={{ flex: 1, minWidth: 0, width: 0, padding: 0, height: 44, fontSize: 18, letterSpacing: -0.5, fontFamily: F.num, background: "transparent", color: C.txt, border: "none", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, outline: "none" }} />
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
const fileInputStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", margin: 0, padding: 0, opacity: 0.02, fontSize: 16, zIndex: 2, cursor: "pointer", color: "transparent", WebkitTextFillColor: "transparent", background: "transparent", border: 0 };
const AttachButton = ({ busy, onFiles }) => (
  <label style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, width: "100%", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${C.acc}`, background: C.card, color: C.acc, fontSize: 15, fontWeight: 700 }}>
    {busy || "Adjuntar foto"}
    <input type="file" accept="image/*,application/pdf" multiple className="clip-file"
      onChange={(e) => { const picked = [...(e.target.files || [])]; e.target.value = ""; if (picked.length) onFiles(picked); }}
      style={fileInputStyle} />
  </label>
);
const ClipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const NoteClip = ({ busy, onFiles }) => (
  <label aria-label={busy || "Adjuntar foto"} title={busy || "Adjuntar foto"}
    style={{ position: "absolute", right: 2, bottom: 2, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", color: C.dim, zIndex: 3 }}>
    {busy ? <span style={{ fontSize: 12, fontWeight: 700, color: C.mut }}>…</span> : <ClipIcon />}
    <input type="file" accept="image/*,application/pdf" multiple className="clip-file"
      onChange={(e) => { const picked = [...(e.target.files || [])]; e.target.value = ""; if (picked.length) onFiles(picked); }}
      style={fileInputStyle} />
  </label>
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
const NoteField = ({ initial, onCommit, ph, rows, files }) => {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const timers = useRef([]);
  const upload = useAdjuntoUpload(files);
  const items = upload.items;
  const bind = (el) => {
    if (!el) return;
    el.__noteWrap = wrapRef.current;
    el.__notePanel = panelRef.current;
    el.__portaled = !!(panelRef.current && panelRef.current.parentElement === document.body);
    el.__attachExtra = (items.length ? 64 : 0) + (upload.err ? 36 : 0);
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
  useEffect(() => () => { timers.current.forEach((id) => clearTimeout(id)); }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    bind(el);
    placeNote(el);
    const scroller = document.querySelector(".app-scroll");
    const onScroll = () => {
      const node = ref.current;
      if (!node || node.dataset.docked) return;
      placeNote(node);
    };
    if (scroller) scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => { if (scroller) scroller.removeEventListener("scroll", onScroll); };
  }, [upload.err, upload.busy, items.length]); // eslint-disable-line
  const onPaste = (e) => {
    if (!files) return;
    const picked = filesFromClipboard(e.clipboardData);
    if (!picked.length) return;
    e.preventDefault();
    upload.addFiles(picked);
  };
  const field = (
    <div ref={panelRef} className="note-panel" onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexDirection: "column", gap: 6, boxSizing: "border-box", background: C.card2, border: `1px solid ${C.line}`, borderRadius: 12, width: "100%" }}>
      <div className="note-text" style={{ position: "relative", width: "100%" }}>
        <textarea ref={ref} defaultValue={initial} placeholder={ph} rows={rows || 2}
          onBlur={(e) => { onCommit(e.target.value); setTimeout(() => syncNoteChrome(), 0); }}
          onFocus={reveal}
          onInput={() => { reveal(); }}
          onPaste={onPaste}
          className="w-full rounded-xl text-sm note-field" style={{ background: "transparent", color: C.txt, border: "none", resize: "none", outline: "none", minHeight: files ? 88 : 64, maxHeight: 220, overflowY: "auto", width: "100%", padding: files ? "12px 12px 44px" : 12 }} />
        {files ? <NoteClip busy={upload.busy} onFiles={upload.addFiles} /> : null}
      </div>
      {files && items.length ? <div style={{ padding: "0 8px 8px" }}><AdjuntoStrip items={items} /></div> : null}
      {files && upload.err ? <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, lineHeight: 1.3, padding: "0 10px 8px" }}>{upload.err}</div> : null}
    </div>
  );
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div ref={wrapRef} className="note-dock" style={{ minHeight: files ? 96 : 72 }} />
      {typeof document !== "undefined" ? createPortal(field, document.body) : field}
    </div>
  );
};
const CambioAsk = ({ writing, onYes, onNo, onDismiss, onText, nombre }) => {
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
          <NoteField initial="" onCommit={onText} ph="Opcional" rows={2} />
        </div>
      )}
    </div>
  );
};

/* Fila de serie: pasada vive bajo el título del ejercicio, no aquí.
   locked = later set of THIS exercise; only the due set is editable with orange ✓. */
const SetRow = ({ idx, ghost, cur, update, ex, viewU, onCheck, planT, locked }) => {
  const isW = ex.type !== "body" && ex.type !== "time";
  const st = ex.step || 5;
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
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 800, color: C.acc }}>S{idx + 1}</span>
        <button onClick={() => update({ f: cur.f === false ? true : false })} className="rounded-lg px-2" style={{ minHeight: 34, fontSize: 12, fontWeight: 700, color: cur.f === false ? C.warn : C.dim, background: cur.f === false ? C.warnDark : "transparent", border: cur.f === false ? `1px solid ${C.warn}55` : "1px solid transparent" }}>
          {cur.f === false ? "⚠ técnica" : "técnica ok"}
        </button>
      </div>
      <div className="flex items-start" style={{ gap: 6, minWidth: 0 }}>
        {isW && (
          <Cluster flex={1.15} v={dispV(cur.w, ex.u, viewU).replace("≈", "")}
            unit={(viewU === "kg" ? "kg" : "lbs") + (ex.type === "assist" ? " asist" : "")}
            onMinus={() => update({ w: Math.max(0, cur.w - st) })}
            onPlus={() => update({ w: cur.w + st })}
            commit={(x) => update({ w: fromView(x, ex.u, viewU, st) })} />
        )}
        <Cluster flex={1} v={cur.r}
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
      <div className="flex items-center" style={{ minHeight: 22 }}>
        <button type="button" onClick={() => (pick ? setPick(false) : openPick())} style={linkBtn(C.acc)}>Empezar regreso</button>
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

/* ============ HOME ============ */
const Home = ({ hist, onStart, onDelete, onImport, msg, troteRef, ongoing, onResume, prefDay, notice }) => {
  const [pick, setPick] = useState(null);
  const [energy, setEnergy] = useState("normal");
  const [delIdx, setDelIdx] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const [hMsg, setHMsg] = useState(null);
  const [showImp, setShowImp] = useState(false);
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
            <div style={{ fontSize: 13, color: ds != null && ds < 2 ? C.warn : C.mut, marginTop: 6, fontFamily: F.num }}>
              {ds === 0 ? "entrenado hoy" : `última vez hace ${ds} día${ds === 1 ? "" : "s"}`}
            </div>
          </button>
        );
      })}
      {pick && (
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <button onClick={() => onStart(pick, energy)} className="w-full rounded-xl mt-3 font-bold" style={{ minHeight: 52, background: GRAD, color: C.accText, fontSize: 17 }}>
            Empezar {DAYS[pick].name}
          </button>
        </div>
      )}
      {msg && <Banner tone={msg.tone}>{msg.t}</Banner>}
      {hist.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <button onClick={() => setShowHist(!showHist)} className="w-full flex items-center justify-between" style={{ minHeight: 40 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>SESIONES GUARDADAS ({hist.length})</span>
            <span style={{ color: C.dim, fontSize: 16 }}>{showHist ? "−" : "+"}</span>
          </button>
          {showHist && hist.map((s, i) => ({ s, i })).reverse().slice(0, 12).map(({ s, i }) => (
            <div key={i} className="flex items-center justify-between gap-2" style={{ minHeight: 46, borderTop: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13, color: C.txt, flex: 1 }}>{DAYS[s.day] ? DAYS[s.day].name : s.day}</span>
              <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num }}>{new Date(s.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
              <button onClick={() => { if (delIdx === i) { onDelete(i); setDelIdx(null); } else setDelIdx(i); }} className="rounded-lg px-3" style={{ minHeight: 38, fontSize: 12, fontWeight: 700, color: delIdx === i ? C.err : C.dim, background: delIdx === i ? C.errDark : "transparent", border: `1px solid ${delIdx === i ? C.err : C.line}` }}>
                {delIdx === i ? "¿borrar?" : "✕"}
              </button>
            </div>
          ))}
          {showHist && (
            <button onClick={async () => { const r = await shareOrCopy(JSON.stringify(buildExport(hist, troteRef), null, 2)); setHMsg(r === "shared" ? { tone: "good", t: "Historial compartido ✓" } : r === "copied" ? { tone: "good", t: "Historial copiado al portapapeles ✓" } : r === "aborted" ? null : { tone: "err", t: "No pude compartir ni copiar en este navegador." }); }} className="w-full rounded-xl font-semibold mt-2" style={{ minHeight: 44, fontSize: 13, background: C.card2, color: C.txt, border: `1px solid ${C.line}` }}>Compartir / Copiar historial (JSON)</button>
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
    </div>
  );
};

/* ============ TARJETA DE EJERCICIO ============ */
const ExCard = ({ ex, dayId, hist, mode, open, onToggle, onCollapse, log, setLog, viewU, setUnit, best, ret, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const v = log.v || "main";
  const name = v === "alt" && ex.alt ? ex.alt.n : ex.n;
  const lbl = v === "alt" && ex.alt ? ex.alt.lbl : ex.lbl;
  const prev = prevFor(hist, dayId, ex, v);
  const retPlan = useMemo(() => (ret && ret.active ? buildReturnPlan(hist, ex, v, ret) : null), [ex, v, hist, ret]); // eslint-disable-line
  const plan = useMemo(() => (retPlan ? retPlan.sets : planFor(hist, dayId, ex, v, mode)), [retPlan, ex.id, v, mode, hist, dayId]); // eslint-disable-line
  const chipWeek = ret && ret.active && ret.program ? Math.min(ret.program.weeks, (ret.week || 1) + (ret.skip || 0)) : 0;
  const sets = log.sets || [];
  const total = plan.length;
  const doneN = sets.filter((s) => s && s.done).length;
  const [flash, setFlash] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [clock, setClock] = useState(null);
  const [writingFb, setWritingFb] = useState(false);
  const writingId = useRef("");
  const opt = resolveOpt(log.opt, lastOptFor(hist, dayId, ex, v), ex);
  useEffect(() => { setFlash(null); setShowInfo(false); }, [v]);
  useEffect(() => { setFlash(null); }, [open]);
  useEffect(() => {
    if (!ex.opts || !opt || log.opt === opt) return;
    setLog({ ...log, v, opt });
  }, [opt]); // eslint-disable-line

  const curAt = (k) => (sets[k] ? sets[k] : { w: plan[k].w, r: plan[k].r, f: true, done: false });
  const dueIdx = dueSetIndex(sets, total);
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
    setLog({ ...log, v, sets: arr });
    if (!nowDone) { setFlash(null); track("serie_deshecha", { ex: ex.id, dia: dayId }); return; }
    const msgs = [];
    if (c.f !== false && score(c.w, c.r) > best) msgs.push({ tone: "good", t: "💥 PR" });
    const first = arr.find((x) => x && x.done);
    if (first && arr.indexOf(first) < k && c.w === first.w && first.r - c.r >= 2 && k < total - 1)
      msgs.push({ tone: "acc", t: `Fatiga: −${first.r - c.r} reps. Sugerido ${roundStep(c.w * 0.9, ex.step || 5)} en lo que queda` });
    if (c.f === false) msgs.push({ tone: "acc", t: "Serie con técnica rota: no cuenta para subir" });
    setFlash(msgs.length ? msgs : null);
    const allDone = total > 0 && Array.from({ length: total }, (_, i) => arr[i]).every((s) => s && s.done);
    if (nowDone && allDone && onCollapse) onCollapse();
    track("serie_completada", { ex: ex.id, dia: dayId });
  };
  const onVuelta = () => {
    const now = Date.now();
    const held = ex.type === "time" ? vueltaHeldSec(clock, now) : null;
    setClock((c) => applyVuelta(c, now));
    if (held == null || dueIdx < 0) return;
    const c = curAt(dueIdx);
    if (c.done) return;
    const arr = [...sets];
    arr[dueIdx] = { ...c, w: 0, r: held, f: true, done: true };
    setLog({ ...log, v, sets: arr });
    track("serie_completada", { ex: ex.id, dia: dayId });
    const allDone = total > 0 && Array.from({ length: total }, (_, i) => arr[i]).every((s) => s && s.done);
    if (allDone && onCollapse) onCollapse();
  };
  const cambio = cambioForEx(fb, ex.id);
  const answerCambio = (util) => {
    if (!cambio) return;
    writingId.current = cambio.id;
    onCambio(cambio, util);
    setWritingFb(!util);
  };
  const swap = (e) => {
    e.stopPropagation();
    if (!ex.alt) return;
    const next = v === "alt" ? "main" : "alt";
    setLog({ ...log, v: next, sets: [] });
    track("ejercicio_cambiado", { ex: ex.id, dia: dayId, opcion: next });
  };
  const expandIfCollapsed = (e) => { if (e) e.stopPropagation(); if (!open) onToggle(); };
  const toggleOpen = (e) => { if (e) e.stopPropagation(); onToggle(); };
  const toggleInfo = (e) => {
    e.stopPropagation();
    const willOpen = !open || !showInfo;
    if (!open) onToggle();
    setShowInfo((s) => (open ? !s : true));
    if (willOpen) track("info_abierta", { ex: ex.id, dia: dayId });
  };
  const isW = ex.type !== "body" && ex.type !== "time";
  const lastNote = lastNoteFor(hist, dayId, ex, v);
  const hdrBtn = { width: 40, height: 40, flexShrink: 0, padding: 0, boxSizing: "border-box" };

  return (
    <div data-ex-id={ex.id} className="rounded-2xl w-full" onClick={!open ? expandIfCollapsed : undefined} style={{ background: C.card, border: `1.5px solid ${doneN >= total ? C.good + "44" : open ? C.acc : C.line}`, overflow: "visible", cursor: !open ? "pointer" : undefined }}>
      <div style={{ padding: "10px 10px 10px 12px" }}>
        <div className="flex items-center" style={{ gap: 4, minHeight: 40 }}>
          <div className="flex items-center" style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <button type="button" onClick={toggleOpen} className="text-left" style={{ minWidth: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 600, fontFamily: F.disp, color: doneN >= total ? C.mut : C.txt }}>{name}</span>
              {v === "alt" && <span style={{ color: C.acc, fontSize: 11, marginLeft: 6 }}>variante</span>}
            </button>
            <button type="button" onClick={toggleInfo} className="rounded-lg flex items-center justify-center" title="Técnica y notas" aria-label="Técnica y notas" aria-expanded={showInfo}
              style={{ width: 32, height: 32, flexShrink: 0, fontSize: 16, fontWeight: 700, color: showInfo ? C.acc : C.mut, background: showInfo ? C.accDark : "transparent" }}>ⓘ</button>
          </div>
          {ex.alt && (
            <button type="button" onClick={swap} className="rounded-lg flex items-center justify-center" title="Cambiar variante" aria-label="Cambiar variante"
              style={{ ...hdrBtn, background: v === "alt" ? C.accDark : "transparent", color: v === "alt" ? C.acc : C.mut, fontSize: 18 }}>⇄</button>
          )}
          <button type="button" onClick={toggleOpen} className="rounded-lg flex items-center justify-center" title={open ? "Cerrar" : "Abrir"} aria-label={open ? "Cerrar ejercicio" : "Abrir ejercicio"}
            style={{ ...hdrBtn, fontSize: 18, fontWeight: 800, color: doneN >= total ? C.good : C.acc, fontFamily: F.num, background: "transparent" }}>
            {doneN >= total ? "✓" : doneN > 0 ? `${doneN}/${total}` : open ? "−" : "+"}
          </button>
        </div>
        <button type="button" onClick={toggleOpen} className="text-left w-full" style={{ fontSize: 13, color: C.past, fontFamily: F.num, paddingTop: 4, lineHeight: "18px" }}>
          {prev.probe ? "probar fuerza" : prev.sets.map(([pw, pr]) => (pw > 0 ? `${dispV(pw, ex.u, viewU)}×${pr}` : pr)).join(" · ")}{!prev.probe && !prev.real && " ~"}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {showInfo && (
            <div className="flex flex-col gap-2" style={{ padding: "2px 0 6px" }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {ex.cues.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: C.dim, fontSize: 12, lineHeight: "18px" }}>•</span>
                      <span style={{ fontSize: 13, color: C.mut }}>{c}</span>
                    </div>
                  ))}
                </div>
                <YtLink name={name} ex={ex.id} />
              </div>
              <PreviewClip ex={ex} v={v} />
              {lastNote ? <div style={{ fontSize: 12, color: C.past, fontStyle: "italic" }}>nota pasada: “{lastNote}”</div> : null}
              {isW && <button onClick={() => { const next = viewU === "lb" ? "kg" : "lb"; setUnit(next); track("unidad_cambiada", { ex: ex.id, unidad: next }); }} className="rounded-xl font-semibold" style={{ minHeight: 40, fontSize: 13, background: C.card2, color: C.txt, border: `1px solid ${C.line}` }}>{viewU === "lb" ? "lbs → kg" : "kg → lbs"}</button>}
            </div>
          )}
          <div style={{ fontSize: 12, color: C.dim, letterSpacing: 1, fontWeight: 700, marginTop: 2 }}>{lbl.toUpperCase()} · META {ex.rng[0]}-{ex.rng[1]} {ex.type === "time" ? "SEG" : "REPS"}{retPlan && retPlan.week > chipWeek ? " · " + retPlan.level.pct + "%" : ""}</div>
          {ex.opts && (
            <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
              {ex.opts.map((o) => (
                <Chip key={o.id} on={opt === o.id} onClick={() => { if (o.id !== opt) track("ejercicio_cambiado", { ex: ex.id, dia: dayId, opcion: o.id }); setLog({ ...log, v, opt: o.id }); }}>{o.n}</Chip>
              ))}
            </div>
          )}
          {ex.type === "time" && <VueltaTimer clock={clock} refSec={(plan[dueIdx >= 0 ? dueIdx : plan.length - 1] || {}).r} onVuelta={onVuelta} />}
          {prev.probe && <div style={{ fontSize: 12, color: C.mut }}>Probar fuerza: pon la carga de este lado. No hay serie anterior.</div>}
          {v === "alt" && !prev.real && !prev.probe && <div style={{ fontSize: 12, color: C.warn }}>Pesos estimados para la variante: calibra y quedan guardados aparte.</div>}
          {plan.map((p, k) => (
            <SetRow key={k} idx={k} ex={ex} viewU={viewU} ghost={prev.sets[k] || null} planT={plan[k]}
              cur={curAt(k)} locked={k !== dueIdx} update={(patch) => updateAt(k, patch)} onCheck={() => checkAt(k)} />
          ))}
          {flash && flash.map((m, k) => <Banner key={k} tone={m.tone}>{m.t}</Banner>)}
          <NoteField initial={log.note || ""} onCommit={(t) => { trackNote("gym", ex.id, log.note, t); setLog({ ...log, v, note: t }); }} ph="Nota del ejercicio (dicta con el mic del teclado)…" files={{ items: log.adjuntos, onChange: (adjuntos) => setLog({ ...log, v, adjuntos }), ambito: "gym", ex: ex.id }} />
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
const SLOTN = { res: "R1 - Resistencia (cinta)", pot: "R2 - Potencia/colinas (cinta)", lar: "Largo (exterior)" };
function buildExport(hist, trote) {
  const sesiones = (hist || []).map((s) => {
    const dayDef = DAYS[s.day];
    const ejercicios = [];
    (dayDef ? dayDef.ex : []).forEach((e) => {
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
        ...(Array.isArray(l.adjuntos) && l.adjuntos.length ? { adjuntos: l.adjuntos } : {}),
        ...(e.opts ? { opcion: optLabel(e, l.opt || e.optDefault) } : {}),
      });
    });
    const extras = ((s.logs && s.logs._extras) || []).map((it) => ({
      nombre: it.n,
      recomendacion_del_dia: (it.rec || "") + (it.por ? ": " + it.por : ""),
      series: (it.sets || []).filter((x) => x && x.done).map((x, i) => ({ numero: i + 1, peso: x.w, repeticiones: x.r, completada: true })),
    })).filter((x) => x.series.length);
    return { fecha: s.date, dia_id: s.day, dia: dayDef ? dayDef.name : s.day, energia: s.energy || "normal", ejercicios, ejercicios_adicionales: extras, nota_sesion: s.note || "", ...(Array.isArray(s.adjuntos) && s.adjuntos.length ? { adjuntos: s.adjuntos } : {}) };
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
      id: r.id, fecha: r.date, tipo: SLOTN[assign[r.id]] || "sin etiquetar",
      minutos: r.min, km: r.km || 0, ritmo_min_por_km: r.pace || null,
      esfuerzo_relativo_strava: r.re || null, en_cinta: !!r.indoor,
    };
    if (r.nota) row.nota = r.nota;
    if (r.tipo) row.estilo = r.tipo;
    if (Array.isArray(r.adjuntos) && r.adjuntos.length) row.adjuntos = r.adjuntos;
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
      date: s.fecha, day: s.dia_id, energy: s.energia || "normal", note: s.nota_sesion || "",
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
        const run = { id: r.id, date: r.fecha, km: r.km || 0, min: r.minutos || 0, pace: r.ritmo_min_por_km || null, re: r.esfuerzo_relativo_strava || 0, indoor: !!r.en_cinta };
        if (r.nota) run.nota = r.nota;
        if (r.estilo) run.tipo = r.estilo;
        if (Array.isArray(r.adjuntos) && r.adjuntos.length) run.adjuntos = r.adjuntos;
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
  const ref = useRef(null);
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
      const item = { id: "adhoc" + Date.now(), n: ex.n || "Ejercicio", lbl: ex.lbl || "lbs", cues: ex.cues || [], rng: ex.rng || [8, 12], rec: ex.rec || "precaucion", por: ex.por || "", sets: [] };
      setLogs({ ...logs, _extras: [...extras, item] });
      if (ref.current) ref.current.value = "";
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
          <textarea ref={ref} rows={2} placeholder="Describe el ejercicio (o dicta con el mic): máquina, movimiento, qué sientes trabajar…" className="w-full rounded-xl p-3 text-sm" style={{ background: C.card2, color: C.txt, border: `1px solid ${C.line}`, resize: "none", outline: "none", minHeight: 64 }} />
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
function scrollExIntoView(exId) {
  const el = document.querySelector('[data-ex-id="' + exId + '"]');
  const scroller = (el && el.closest(".app-scroll")) || document.querySelector(".app-scroll");
  if (!el || !scroller) return;
  const head = document.querySelector(".sess-head");
  const headH = head ? head.getBoundingClientRect().height : 0;
  const sc = scroller.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const top = r.top - sc.top + scroller.scrollTop - headH - 8;
  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

const Session = ({ dayId, hist, planHist, energy, logs, setLogs, onFinish, onBack, pauseMode, units, setUnits, sessionNote, setSessionNote, sessionAdj, setSessionAdj, ret, notice, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const day = DAYS[dayId];
  const mode = pauseMode === "long" ? "recal" : energy === "mala" || energy === "baja" || pauseMode === "short" ? "hold" : "grow";
  const viewHist = ret && ret.active ? hist : (planHist || hist);
  const sessionIds = sessionExIds(day);
  const byId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
  const exerciseFinished = (id) => {
    const ex = byId[id];
    if (!ex) return true;
    const l = norm(logs[id]);
    const built = ret && ret.active ? buildReturnPlan(hist, ex, l.v || "main", ret) : null;
    const plan = built ? built.sets : planFor(viewHist, dayId, ex, l.v || "main", mode);
    return plan.length > 0 && l.sets.filter((s) => s && s.done).length >= plan.length;
  };
  const [openIds, setOpenIds] = useState(() => {
    const id = firstPendingExId(sessionIds, exerciseFinished) || sessionIds[0];
    return id ? { [id]: true } : {};
  });
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
    const built = ret && ret.active ? buildReturnPlan(hist, e, l.v || "main", ret) : null;
    const plan = built ? built.sets : planFor(viewHist, dayId, e, l.v || "main", mode);
    return plan.length > 0 && l.sets.filter((s) => s && s.done).length >= plan.length;
  }).length;
  return (
    <div className="px-4 pb-4 flex flex-col gap-2" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="sess-head" style={{ background: C.bg, paddingTop: "var(--sat)", paddingBottom: 2, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}>
        <BrandHeader
          left={<div className="flex items-center gap-2">
            <button onClick={onBack} className="rounded-xl font-bold" style={{ minHeight: 40, minWidth: 44, fontSize: 16, background: C.card, color: C.txt, border: `1.5px solid ${C.line}` }}>←</button>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 1.1 }}>{day.name}</div>
          </div>}
          right={<div style={{ fontSize: 13, color: C.mut, fontFamily: F.num, whiteSpace: "nowrap" }}>{doneCount}/{day.ex.length}</div>}
        />
        <div style={{ height: 4, background: C.card2, borderRadius: 99, marginTop: 6 }}>
          <div style={{ height: 4, width: `${(doneCount / day.ex.length) * 100}%`, background: doneCount === day.ex.length ? C.good : C.acc, borderRadius: 99, transition: "width .3s" }} />
        </div>
        {notice && <div style={{ marginTop: 4 }}><ReturnNotice {...notice} /></div>}
        <div className="flex gap-2" style={{ overflowX: "auto", paddingTop: 4, paddingBottom: 0, WebkitOverflowScrolling: "touch" }}>
          {day.secs.map((sec, si) => {
            const base = sec.t.split(" \u00b7 ")[0].split(" ")[0];
            const dup = day.secs.slice(0, si).filter((x) => x.t.split(" ")[0] === sec.t.split(" ")[0]).length;
            return (
              <button key={si} onClick={() => { const el = document.getElementById("sec-" + dayId + "-" + si); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="rounded-full" style={{ flexShrink: 0, minHeight: 32, padding: "0 12px", fontSize: 12, fontWeight: 700, fontFamily: F.disp, letterSpacing: 1.5, color: C.acc, background: C.card, border: `1.5px solid ${C.acc}55`, textTransform: "uppercase" }}>
                {base}{dup > 0 ? " " + (dup + 1) : ""}
              </button>
            );
          })}
        </div>
      </div>
      <div className="sess-head-spacer" aria-hidden="true" />
      {day.secs.map((sec, si) => (
        <React.Fragment key={sec.t}>
          <div id={"sec-" + dayId + "-" + si} style={{ marginTop: 10, scrollMarginTop: 132 }}>
            <div style={{ fontSize: 15, letterSpacing: 2, fontWeight: 700, color: C.acc, fontFamily: F.disp }}>{sec.t.toUpperCase()}</div>
            {sec.note && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{sec.note}</div>}
          </div>
          {sec.ids.map((id) => {
            const ex = byId[id];
            return (
              <ExCard key={id} ex={ex} dayId={dayId} hist={viewHist} mode={mode} ret={ret}
                viewU={units[id] || ex.u} setUnit={(u) => setUnits({ ...units, [id]: u })}
                open={!!openIds[id]}
                onToggle={() => setOpenIds((o) => ({ ...o, [id]: !o[id] }))}
                onCollapse={() => collapseAndAdvance(id)}
                log={norm(logs[id])} setLog={(l) => setLogs({ ...logs, [id]: l })}
                best={bestPrev(hist, dayId, ex, norm(logs[id]).v || "main")}
                fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />
            );
          })}
        </React.Fragment>
      ))}
      <AdHoc dayId={dayId} logs={logs} setLogs={setLogs} units={units} />
      <NoteField initial={sessionNote} onCommit={setSessionNote} ph="Nota final de la sesión: cómo te sentiste, dolores, contexto…" files={{ items: sessionAdj, onChange: setSessionAdj, ambito: "gym" }} />
      <button onClick={onFinish} className="rounded-xl font-bold mt-1" style={{ minHeight: 52, background: GRAD, color: C.accText, fontSize: 17 }} >Terminar sesión</button>
    </div>
  );
};

/* ============ CIERRE ============ */
const Done = ({ dayId, hist, planHist, energy, logs, pauseMode, sessionNote, setSessionNote, sessionAdj, setSessionAdj, units, onSaved, onHome, onBack, ret, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const day = DAYS[dayId];
  const [status, setStatus] = useState("idle");
  const [writingId, setWritingId] = useState("");
  const rows = day.ex.map((ex) => {
    const l = norm(logs[ex.id]); const v = l.v || "main";
    const sets = l.sets.filter((s) => s && s.done);
    const onReturn = !!(ret && ret.active);
    const prev = prevFor(onReturn ? hist : (planHist || hist), dayId, ex, v);
    const tPrev = prev.sets.reduce((a, [pw, pr]) => a + score(pw, pr), 0);
    const tNow = sets.filter((s) => s.f !== false).reduce((a, s) => a + score(s.w, s.r), 0);
    const hi = ex.rng[1]; const st = ex.step || 5; const vu = units[ex.id] || ex.u;
    let plan;
    const built = ret && ret.active && sets.length ? buildReturnPlan(hist, ex, v, ret) : null;
    if (!sets.length) plan = null;
    else if (built) {
      const topped = sets.every((s) => s.r >= hi && s.f !== false);
      const nextWeek = Math.min(ret.program.weeks, built.week + (topped ? 1 : 0));
      const nextPct = ret.program.levels[nextWeek - 1].pct;
      plan = topped && nextWeek > built.week ? "regreso · siguiente nivel " + nextPct + "%" : "regreso · " + built.level.pct + "%";
    }
    else if (pauseMode) plan = "post-pausa: recalibrar";
    else if (energy === "mala" || energy === "baja") plan = "energía baja: contexto, no regresión";
    else if (sets.some((s) => s.f === false)) plan = "técnica rota: consolidar forma";
    else if (sets.every((s) => s.r >= hi)) {
      if (ex.type === "body") plan = "⬆ sube meta +1-2 reps";
      else if (ex.type === "time") plan = "⬆ sube +5 seg";
      else if (ex.type === "assist") plan = `⬆ baja asistencia a ${dispV(Math.max(st, Math.max(...sets.map((s) => s.w)) - st), ex.u, vu)}`;
      else plan = `⬆ sube a ${dispV(Math.max(...sets.map((s) => s.w)) + st, ex.u, vu)}, vuelve a ${ex.rng[0]} reps`;
    } else plan = `gana reps hasta ${hi} antes de subir`;
    const beat = onReturn && built
      ? metReturnPlan(sets, built.sets)
      : sets.length > 0 && prev.real && tNow >= tPrev * 0.98;
    return { ex, v, sets, beat, pr: sets.some((s) => s.f !== false && score(s.w, s.r) > bestPrev(hist, dayId, ex, v)), plan };
  });
  const doneRows = rows.filter((r) => r.sets.length);
  const beats = doneRows.filter((r) => r.beat).length;
  const prs = doneRows.filter((r) => r.pr);
  const buildSession = () => ({ date: new Date().toISOString(), day: dayId, energy, logs, note: sessionNote, ...(Array.isArray(sessionAdj) && sessionAdj.length ? { adjuntos: sessionAdj } : {}) });
  const save = async () => {
    setStatus("saving");
    const h2 = [...hist, buildSession()];
    const ok = await stSet(HKEY, h2);
    try { if (window.pushSesion) window.pushSesion(buildSession(), DAYS); } catch (e) {}
    if (ok) { await stDel(DKEY); setStatus("ok"); onSaved(h2); } else { setStatus("fail"); track("error_guardado", { dia: dayId }); }
  };
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto", paddingTop: "calc(16px + var(--sat))" }}>
      <BrandHeader style={{ marginTop: 8 }} left={<div style={{ fontSize: 28, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>Sesión terminada</div>} />
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 15, color: C.good, fontWeight: 700 }}>{beats} de {doneRows.length} ejercicios {ret && ret.active ? "cumplieron el plan de regreso" : "igualaron o superaron la pasada"}</div>
        {prs.length > 0 && <div style={{ fontSize: 14, color: C.acc, marginTop: 6 }}>💥 PR: {prs.map((r) => (r.v === "alt" ? r.ex.alt.n : r.ex.n)).join(", ")}</div>}
        {(energy === "mala" || energy === "baja") && <div style={{ fontSize: 13, color: C.mut, marginTop: 6 }}>Día de energía baja: toda caída de hoy es contexto, no regresión.</div>}
        {pauseMode && !(ret && ret.active) && <div style={{ fontSize: 13, color: C.mut, marginTop: 6 }}>Sesión post-pausa: la progresión se congela una sesión.</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.mut, letterSpacing: 1 }}>PRÓXIMA SESIÓN</div>
      {doneRows.map(({ ex, v, plan }) => (
        <div key={ex.id} className="flex items-center justify-between rounded-xl px-3 py-3 gap-2" style={{ background: C.card, border: `1px solid ${plan && plan.startsWith("⬆") ? C.good + "55" : C.line}` }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{v === "alt" && ex.alt ? ex.alt.n : ex.n}</span>
          <span style={{ fontSize: 13, color: plan && plan.startsWith("⬆") ? C.good : C.mut, textAlign: "right" }}>{plan}</span>
        </div>
      ))}
      <NoteField initial={sessionNote} onCommit={setSessionNote} ph="Nota de la sesión: cómo te sentiste, dolores, contexto (dicta con el mic)…" files={{ items: sessionAdj, onChange: setSessionAdj, ambito: "gym" }} />
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
  return (
    <div className="flex items-center" style={{ minHeight: 44, gap: 8, width: "100%", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num, flexShrink: 0 }}>{r.date.slice(5)}</span>
      {type ? <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{type}</span> : null}
      <span style={{ flex: 1 }} />
      {runHasMark(r) ? <span aria-label="Tiene nota" title="Tiene nota" style={{ color: C.mut, display: "flex" }}><NoteMark /></span> : null}
      {facts ? <span style={{ fontSize: 13, color: C.mut, fontFamily: F.num }}>{facts}</span> : null}
    </div>
  );
};
const RunDetail = ({ r, onBack, onAdjuntos }) => {
  const extra = runExtra(r);
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <BrandHeader
        style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 6, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}
        left={<div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-xl font-bold" style={{ minHeight: 44, padding: "0 14px", fontSize: 15, background: C.card, color: C.txt, border: `1.5px solid ${C.line}` }}>←</button>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>{r.date}</div>
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
        <AdjuntoBox items={r.adjuntos} ambito="running" onChange={onAdjuntos} />
      </div>
    </div>
  );
};

const TroteTab = ({ trote, setTrote, hist, prefSel, regresoUi, onHideRun, onShowRun, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const wk = mondayOf(new Date());
  const [sel, setSel] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [moreRuns, setMoreRuns] = useState(false);
  const [writingAdj, setWritingAdj] = useState(false);
  const [sync, setSync] = useState("idle");
  const [syncErr, setSyncErr] = useState("");
  const [editP, setEditP] = useState(false);
  const [mMin, setMMin] = useState(""); const [mRe, setMRe] = useState("");
  const [adj, setAdj] = useState(false);
  const [shMsg, setShMsg] = useState(null);
  const [shRaw, setShRaw] = useState("");
  useEffect(() => { setEditP(false); setAdj(false); setShMsg(null); setSync("idle"); setShRaw(""); }, [sel]);
  useEffect(() => { if (prefSel && prefSel.k) setSel(prefSel.k); }, [prefSel]);
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

  if (openRun) return <RunDetail r={openRun} onBack={() => setOpenId(null)} onAdjuntos={saveRunAdj} />;

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
      {SLOTS.map(({ k, t, sub }) => {
        const done = wkRuns.some((r) => assign[r.id] === k);
        const ld = lastOf(k);
        const ds = ld ? daysSince(ld + "T12:00:00") : null;
        const slotP = slotPlan(week, k);
        return (
          <button key={k} onClick={() => { setSel(k); setEditP(false); }} className="rounded-2xl p-4 text-left" style={{ background: C.card, border: `1.5px solid ${done ? C.good : C.line}` }}>
            <div className="flex items-center justify-between">
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: F.disp, color: done ? C.good : C.txt }}>{t} {done ? "✓" : ""}</div>
              <span style={{ fontSize: 12, color: C.dim, fontFamily: F.num }}>{ds == null ? "sin registro" : ds === 0 ? "hoy" : `hace ${ds} d`}</span>
            </div>
            <div style={{ fontSize: 12, color: C.dim }}>{sub}</div>
            <div style={{ fontSize: 12, color: C.mut, fontFamily: F.num, marginTop: 4 }}>{pSummary(k, slotP)}</div>
          </button>
        );
      })}
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
      {askAdj}
    </div>
  );

  const k = sel;
  const meta = SLOTS.find((x) => x.k === k);
  const slotP = slotPlan(week, k);
  const exec = wkRuns.filter((r) => assign[r.id] === k);
  const prevP = weeks[prevWk] && weeks[prevWk][k] && weeks[prevWk][k].p;
  const prevExec = runs.filter((r) => mondayOf(r.date) === prevWk && assign[r.id] === k);
  const addPlanDone = () => {
    const work = Array.isArray(slotP.blocks) && slotP.blocks.length
      ? slotP.blocks.reduce((a, x) => a + (x.n || 1) * ((x.t || 0) + (x.dt || 0)), 0)
      : Array.isArray(slotP.sets)
      ? slotP.sets.reduce((a, x) => a + (x.t != null ? x.t : slotP.t) + (x.dt != null ? x.dt : slotP.dt), 0)
      : (slotP.n || 0) * ((slotP.t || 0) + (slotP.dt || 0));
    const est = k === "lar" ? (slotP.min || 0) : Math.round(((slotP.cal || 0) * 60 + work) / 60 + ((slotP.cool && slotP.cool.min) || 0));
    const r = { id: "m" + Date.now(), date: new Date().toISOString().slice(0, 10), km: 0, min: est, pace: null, re: 0, indoor: k !== "lar" };
    setTrote({ ...trote, runs: [...(trote.runs || []), r], assign: { ...(trote.assign || {}), [r.id]: k } });
    track("trote_registrado", { min: est });
  };
  const addManual = () => {
    const mn = parseFloat(mMin); if (isNaN(mn) || mn <= 0) return;
    const min = Math.round(mn);
    const r = { id: "m" + Date.now(), date: new Date().toISOString().slice(0, 10), km: 0, min, pace: null, re: parseInt(mRe) || 0, indoor: k !== "lar" };
    setTrote({ ...trote, runs: [...(trote.runs || []), r], assign: { ...(trote.assign || {}), [r.id]: k } });
    setMMin(""); setMRe("");
    track("trote_registrado", { min });
  };
  return (
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto" }}>
      <BrandHeader
        style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingTop: "var(--sat)", paddingBottom: 6, borderBottom: `3px solid ${C.acc}`, boxShadow: `0 -80px 0 ${C.bg}` }}
        left={<div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="rounded-xl font-bold" style={{ minHeight: 44, padding: "0 14px", fontSize: 15, background: C.card, color: C.txt, border: `1.5px solid ${C.line}` }}>←</button>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase" }}>{meta.t}</div>
        </div>}
      />
      <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.acc, letterSpacing: 1, fontFamily: F.disp }}>NOTA</span>
        <NoteField
          key={k + ":" + wk}
          rows={4}
          initial={slotP.nota || ""}
          ph="Escribe lo que hiciste. El plan se arma de acá."
          onCommit={(t) => {
            trackNote("running", k, slotP.nota, t);
            const r = parseNota(t);
            setWeekSlot(k, { p: r ? applyParsedProtocol({ ...slotP, nota: t }, r) : { nota: t } });
          }}
          files={{ items: week[k] && week[k].adjuntos, onChange: (adjuntos) => setWeekSlot(k, { adjuntos }), ambito: "running" }}
        />
      </div>
      <RunHint sug={runSug} ui={regresoUi} onHide={onHideRun} onShow={onShowRun} />
      <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 800, color: C.acc, letterSpacing: 1, fontFamily: F.disp }}>PLAN</span>
          <button onClick={() => setEditP(!editP)} className="rounded-lg px-3" style={{ minHeight: 38, fontSize: 12, fontWeight: 700, color: C.acc, background: editP ? C.accDark : "transparent", border: `1px dashed ${C.acc}88` }}>{editP ? "cerrar" : "editar"}</button>
        </div>
        {editP ? <PrescEditor slot={k} p={slotP} setP={(np) => setWeekSlot(k, { p: np })} /> : <PlanLines p={slotP} />}
        {(prevP || prevExec.length > 0) && (
          <div style={{ fontSize: 11, color: C.past, fontStyle: "italic", borderTop: `1px dashed ${C.line}`, paddingTop: 6 }}>
            sem. pasada: {prevP ? pSummary(k, prevP) : "sin plan"}{prevExec.length ? ` · RE ${prevExec[0].re || "–"}` : ""}
          </div>
        )}
      </div>
      {exec.length > 0 ? (
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: C.goodDark, border: `1.5px solid ${C.good}` }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.good, letterSpacing: 1, fontFamily: F.disp }}>✓ HECHA ESTA SEMANA</span>
          {exec.map((r) => (
            <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="text-left w-full" style={{ background: "transparent", border: 0, padding: 0 }}>
              <RunLine r={r} big />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button onClick={addPlanDone} className="rounded-2xl font-bold" style={{ minHeight: 56, background: GRAD, color: C.accText, fontSize: 17, fontFamily: F.disp, letterSpacing: 1 }}>✓ LA HICE COMO EL PLAN</button>
          <button onClick={() => setAdj(!adj)} style={{ color: C.dim, fontSize: 13 }}>{adj ? "cerrar ajuste" : "hice algo distinto / ajustar"}</button>
          {adj && (
            <div className="flex gap-2 items-end">
              <MiniIn label="MIN" v={mMin || 0} commit={(x) => setMMin(String(x))} />
              <MiniIn label="RE" v={mRe || 0} commit={(x) => setMRe(String(x))} />
              <button onClick={addManual} className="rounded-xl font-bold px-4" style={{ minHeight: 42, background: GRAD, color: C.accText, fontSize: 14 }}>+</button>
            </div>
          )}
          <div style={{ fontSize: 11, color: C.dim }}>Strava se suma solo cuando el sync funcione; tu confirmación vale como registro.</div>
        </div>
      )}
      <button onClick={async () => { const r = await shareOrCopy(JSON.stringify(buildExport(hist || [], trote), null, 2)); setShMsg(r === "shared" ? { tone: "good", t: "JSON del día compartido (gym + running) ✓" } : r === "copied" ? { tone: "good", t: "JSON copiado al portapapeles ✓" } : r === "aborted" ? null : { tone: "err", t: "No pude compartir ni copiar. Copia el texto de abajo a mano." }); if (r !== "shared" && r !== "copied" && r !== "aborted") setShRaw(JSON.stringify(buildExport(hist || [], trote), null, 2)); }} className="rounded-xl font-bold" style={{ minHeight: 48, background: C.card, color: C.txt, border: `1.5px solid ${C.line}`, fontSize: 14 }}>Compartir JSON del día (gym + running)</button>
      {shMsg && <Banner tone={shMsg.tone}>{shMsg.t}</Banner>}
      {shRaw && <textarea readOnly value={shRaw} rows={7} onFocus={(e) => e.target.select()} className="w-full rounded-xl p-2" style={{ background: C.card2, color: C.txt, border: `1px solid ${C.line}`, fontSize: 11, fontFamily: F.num }} />}
      <NoteField initial={(week[k] && week[k].nx) || ""} onCommit={(t) => { trackNote("running", k, (week[k] && week[k].nx) || "", t); setWeekSlot(k, { nx: t }); }} ph="Cómo se sintió la corrida…" files={{ items: week[k] && week[k].nxAdjuntos, onChange: (nxAdjuntos) => setWeekSlot(k, { nxAdjuntos }), ambito: "running" }} />
    </div>
  );
};
/* ================================================================
   HOME: hoy toca, y los logros reales.
   ================================================================ */
const RX_KEY = "entreno_logros_rx_v1";
const HOY_NOMBRE = { A: "Push", B: "Pull", C: "Legs + Core", res: "Resistencia", pot: "Potencia", lar: "Largo" };
const VARIANTE_LABEL = [
  ["records", "Récords"],
  ["constancia", "Constancia"],
  ["hitos", "Hitos"],
];

function readReacciones() {
  try {
    const raw = localStorage.getItem(RX_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}
function writeReacciones(v) {
  try { localStorage.setItem(RX_KEY, JSON.stringify(v)); } catch { /* seguir */ }
}

const HomeTab = ({ hist, trote, doneSetsCount, dayId, onBegin, ret, runSug, varianteInicial, onVariante, fb, onCambio, onCambioDismiss, onCambioText }) => {
  const theme = useThemeCtl();
  const tz = deviceTimeZone();
  const today = useMemo(() => new Date(), []);
  const runs = useMemo(() => mergeById(SEED_RUNS, trote && trote.runs, "id"), [trote]);
  const assign = useMemo(() => ({ ...SEED_ASSIGN, ...((trote && trote.assign) || {}) }), [trote]);
  const catalog = useMemo(() => flattenCatalog(DAYS), []);
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
  const linea = lineaHoy({ target, hist, runs, assign, ret, runSug, today, timeZone: tz });
  const records = useMemo(() => recentRecords(hist, catalog, runs, tz), [hist, catalog, runs, tz]);
  const consta = useMemo(() => constanciaStats(hist, runs, assign, today, ret, tz), [hist, runs, assign, today, ret, tz]);
  const hitos = useMemo(() => hitosState(hist, runs, ret, tz), [hist, runs, ret, tz]);
  const [variante, setVariante] = useState(varianteInicial || "records");
  const [rx, setRx] = useState(readReacciones);
  const [writingId, setWritingId] = useState("");
  const showRx = reaccionVisible(rx, variante, today, tz);
  const opinar = (reaccion) => {
    const next = markReaccion(rx, variante, today, reaccion, tz);
    setRx(next);
    writeReacciones(next);
    track("home_logros_reaccion", { variante, reaccion });
  };
  const cerrarRx = () => {
    const next = markReaccion(rx, variante, today, "x", tz);
    setRx(next);
    writeReacciones(next);
  };
  const elegir = (kind, id) => {
    setPicked({
      kind, id,
      continue: kind === "gym" && doneSetsCount > 0 && dayId === id,
      done: !!checks[id],
      weekComplete: false,
    });
  };
  const chips = [
    ...ORDER.map((d) => ({ kind: "gym", id: d, label: HOY_NOMBRE[d] })),
    ...SLOTS.map(({ k }) => ({ kind: "run", id: k, label: HOY_NOMBRE[k] })),
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
    <div className="px-4 pb-4 flex flex-col gap-3" style={{ maxWidth: 480, margin: "0 auto", paddingTop: "calc(16px + var(--sat))" }}>
      <div className="home-head">
        <div aria-hidden="true" />
        <BrandHome />
        {theme && <ThemeToggle mode={theme.mode} onChange={theme.setMode} />}
      </div>
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.acc, fontFamily: F.disp }}>HOY TOCA</div>
        <div style={{ fontSize: 34, fontWeight: 700, fontFamily: F.disp, textTransform: "uppercase", lineHeight: 0.95 }}>{nombre}</div>
        <div style={{ fontSize: 15, color: C.mut, lineHeight: 1.35 }}>{linea}</div>
        <button onClick={() => onBegin(target)} className="rounded-2xl font-bold" style={{ minHeight: 56, background: GRAD, color: C.accText, fontSize: 18, fontFamily: F.disp, letterSpacing: 1 }}>
          {target.continue ? "SEGUIR" : "EMPEZAR"} {nombre.toUpperCase()} →
        </button>
      </div>
      {[["GYM", chips.slice(0, 3)], ["RUNNING", chips.slice(3)]].map(([g, list]) => (
        <div key={g} className="flex items-center gap-2">
          <span style={{ width: 64, flexShrink: 0, fontSize: 10, fontWeight: 800, fontFamily: F.disp, letterSpacing: 1.2, color: C.dim }}>{g}</span>
          <div className="flex gap-1" style={{ flexWrap: "wrap", flex: 1 }}>{list.map(Chip)}</div>
        </div>
      ))}
      <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.dim, fontFamily: F.disp }}>LOGROS</div>
        <div role="tablist" aria-label="Tipo de logros" className="flex" style={{ background: C.card2, borderRadius: 999, padding: 3, gap: 2 }}>
          {VARIANTE_LABEL.map(([id, label]) => {
            const on = variante === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => { if (id === variante) return; setVariante(id); onVariante(id); }}
                style={{ flex: 1, minHeight: 34, borderRadius: 999, border: "none", background: on ? C.card : "transparent", color: on ? C.txt : C.dim, fontSize: 13, fontWeight: 700 }}>
                {label}
              </button>
            );
          })}
        </div>
        {variante === "records" && (
          records.empty ? (
            <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.4 }}>Cuando cierres una sesión, tus récords quedan aquí.</div>
          ) : (
            <div className="flex flex-col">
              {records.items.map((it) => (
                <div key={it.key} className="flex items-start justify-between gap-2" style={{ padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{it.title}</div>
                    <div style={{ fontSize: 13, color: C.txt, fontFamily: F.num }}>{it.detail}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: it.badge === "record" ? C.good : C.dim }}>{it.badge === "record" ? "récord" : "tu mejor"}</div>
                    {it.when ? <div style={{ fontSize: 11, color: C.dim }}>{it.when}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {variante === "constancia" && (
          consta.empty ? (
            <div style={{ fontSize: 14, color: C.mut, lineHeight: 1.4 }}>La primera sesión abre la cuenta. El regreso también suma.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {consta.streak > 0 && (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: F.disp, lineHeight: 1 }}>{consta.streak}</div>
                  <div style={{ fontSize: 13, color: C.mut }}>{consta.streak === 1 ? "semana seguida con el plan" : "semanas seguidas con el plan"}</div>
                </div>
              )}
              <div style={{ fontSize: 15, color: C.txt }}>Esta semana van {consta.weekDone} de {consta.weekTotal}.</div>
              {consta.monthCount > 0 && <div style={{ fontSize: 14, color: C.mut }}>{consta.monthCount} {consta.monthCount === 1 ? "sesión" : "sesiones"} en {consta.monthLabel}.</div>}
              {consta.regreso && (
                <div className="rounded-xl px-3 py-2" style={{ background: C.goodDark, border: `1px solid ${C.good}55` }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.good }}>{consta.regreso.title}</div>
                  <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>{consta.regreso.detail}</div>
                </div>
              )}
            </div>
          )
        )}
        {variante === "hitos" && (
          <div className="flex flex-col gap-2">
            {hitos.done.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{it.title}</div>
                  <div style={{ fontSize: 13, color: C.mut }}>{it.detail}{it.when ? " · " + it.when : ""}</div>
                </div>
                <span style={{ color: C.good, fontWeight: 800, flexShrink: 0 }}>✓</span>
              </div>
            ))}
            {hitos.next && (
              <div className="flex flex-col gap-1" style={{ paddingTop: hitos.done.length ? 6 : 0, borderTop: hitos.done.length ? `1px solid ${C.line}` : "none" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.dim }}>SIGUIENTE</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{hitos.next.title}</div>
                <div style={{ fontSize: 13, color: C.mut }}>{hitos.next.detail}</div>
                <div style={{ height: 6, borderRadius: 99, background: C.card2, overflow: "hidden" }}>
                  <div style={{ width: Math.max(0, Math.min(100, Math.round((hitos.next.progress || 0) * 100))) + "%", height: "100%", background: C.acc }} />
                </div>
              </div>
            )}
          </div>
        )}
        {showRx && (
          <div className="flex items-center" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {REACCIONES.map((r) => (
              <button key={r.id} type="button" onClick={() => opinar(r.id)} className="rounded-full" style={{ minHeight: 30, padding: "0 8px", fontSize: 12, fontWeight: 700, color: C.dim, background: "transparent", border: `1px solid ${C.line}` }}>{r.label}</button>
            ))}
            <button type="button" aria-label="Ahora no" onClick={cerrarRx} style={{ minHeight: 30, minWidth: 30, fontSize: 14, color: C.dim, background: "transparent", border: "none" }}>×</button>
          </div>
        )}
      </div>
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
  const [logs, setLogs] = useState({});
  const [pauseMode, setPauseMode] = useState(null);
  const [units, setUnitsRaw] = useState({});
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
  const openVariante = useRef("");
  const sawVariante = useRef(false);
  if (screen !== "loading" && !openVariante.current) openVariante.current = pickVariante(Math.random());
  const setUnits = (u) => { setUnitsRaw(u); stSet(UKEY, u); };
  const commitSessionNote = (t) => { trackNote("gym", "", sessionNote, t); setSessionNote(t); };
  const delSession = async (i) => {
    const dia = hist[i] && hist[i].day;
    const h2 = hist.filter((_, k) => k !== i);
    const ok = await stSet(HKEY, h2);
    if (ok) { setHist(h2); setHomeMsg({ tone: "good", t: "Sesión borrada ✓" }); track("sesion_borrada", { dia }); }
    else setHomeMsg({ tone: "err", t: "El caché no confirmó el borrado. Intenta de nuevo." });
  };

  useEffect(() => {
    (async () => {
      const h = (await stGet(HKEY)) || [];
      setHist(h);
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
      const d = await stGet(DKEY);
      if (d && d.dayId && d.logs && Object.keys(d.logs).length) {
        startedAtRef.current = d.startedAt || Date.now();
        setDayId(d.dayId); setEnergy(d.energy || "regular"); setLogs(d.logs);
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
    draftT.current = setTimeout(() => { stSet(DKEY, { dayId, energy, logs, pauseMode, sessionNote, sessionAdjuntos: sessionAdj, startedAt: startedAtRef.current || null }); }, 600);
    return () => clearTimeout(draftT.current);
  }, [logs, sessionNote, sessionAdj, screen]); // eslint-disable-line

  const doneSetsCount = Object.values(logs || {}).reduce((a, l) => { const n = norm(l); return a + (n.sets || []).filter((x) => x && x.done).length; }, 0);
  const start = (d, e) => {
    if (d === dayId && doneSetsCount > 0) { setScreen("session"); return; }
    if (dayId && doneSetsCount > 0 && d !== dayId) track("sesion_abandonada", { dia: dayId, series_hechas: doneSetsCount });
    const ds = daysSince(lastDateOf(hist, d));
    const rawRet = analyzeReturn(hist, todayK);
    const shown = resolveReturn(hist, todayK, regresoUi);
    setPauseMode(rawRet.active || shown.active ? null : (ds > 21 ? "long" : ds > 7 ? "short" : null));
    startedAtRef.current = Date.now();
    setDayId(d); setEnergy(e); setLogs({}); setSessionNote(""); setSessionAdj([]); setScreen("session");
    track("sesion_iniciada", { dia: d });
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
    start(target.id, "normal");
    setTab("pesas");
  };
  const seriesPlanCount = () => {
    const day = DAYS[dayId];
    if (!day) return 0;
    const mode = pauseMode === "long" ? "recal" : energy === "mala" || energy === "baja" || pauseMode === "short" ? "hold" : "grow";
    const viewHist = ret && ret.active ? hist : (planHist || hist);
    return day.ex.reduce((sum, ex) => {
      const l = norm(logs[ex.id]);
      const v = l.v || "main";
      const built = ret && ret.active ? buildReturnPlan(hist, ex, v, ret) : null;
      const plan = built ? built.sets : planFor(viewHist, dayId, ex, v, mode);
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
    if (screen === "loading" || !openVariante.current || sawVariante.current) return;
    sawVariante.current = true;
    track("home_logros_variante_mostrada", { variante: openVariante.current, origen: "auto" });
  }, [screen]);
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
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');"}</style>
        {screen === "loading" && <div className="p-8 text-center" style={{ color: C.dim, paddingTop: "calc(32px + var(--sat))" }}>Cargando…</div>}
        {tab === "home" && screen !== "loading" && <HomeTab hist={hist} trote={trote} doneSetsCount={doneSetsCount} dayId={dayId} onBegin={beginHoy} ret={ret} runSug={runHintVisible(runSug, regresoUi) ? runSug : null} varianteInicial={openVariante.current || "records"} onVariante={(v) => track("home_logros_variante_mostrada", { variante: v, origen: "manual" })} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "trote" && screen !== "loading" && <TroteTab trote={trote} setTrote={setTrote} hist={hist} prefSel={prefSlot} regresoUi={regresoUi} onHideRun={hideRun} onShowRun={showRun} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "pesas" && screen === "home" && <Home prefDay={prefDay} notice={notice} ongoing={dayId && doneSetsCount > 0 ? { dayId, count: doneSetsCount } : null} onResume={() => setScreen("session")} troteRef={trote} hist={hist} onStart={start} onDelete={delSession} onImport={(h, t) => { setHist(h); stSet(HKEY, h); if (t) { const ht = hydrateTroteFromNotas(t); setTroteRaw(ht); stSet("gymu_trote_v1", ht); } }} msg={homeMsg} />}
        {tab === "pesas" && screen === "session" && <Session dayId={dayId} hist={hist} planHist={planHist} energy={energy} logs={logs} setLogs={setLogs} pauseMode={pauseMode} units={units} setUnits={setUnits} sessionNote={sessionNote} setSessionNote={commitSessionNote} sessionAdj={sessionAdj} setSessionAdj={setSessionAdj} ret={ret} notice={notice} onFinish={finishSession} onBack={() => setScreen("home")} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
        {tab === "pesas" && screen === "done" && <Done dayId={dayId} hist={hist} planHist={planHist} energy={energy} logs={logs} pauseMode={pauseMode} sessionNote={sessionNote} setSessionNote={commitSessionNote} sessionAdj={sessionAdj} setSessionAdj={setSessionAdj} units={units} onSaved={(h) => setHist(h)} onHome={() => { setLogs({}); setScreen("home"); }} onBack={() => setScreen("session")} ret={ret} fb={fb} onCambio={onCambio} onCambioDismiss={onCambioDismiss} onCambioText={onCambioText} />}
      </div>
      <nav className="app-tabs" aria-label="Secciones" style={{ background: C.card, borderTop: `2px solid ${C.acc}` }}>
        {[["home", "HOME"], ["pesas", "GYM"], ["trote", "RUNNING"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ fontFamily: F.disp, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: tab === k ? C.acc : C.dim, background: "transparent", borderTop: tab === k ? `3px solid ${C.acc}` : "3px solid transparent" }}>{l}</button>
        ))}
      </nav>
    </div>
    </ThemeCtlCtx.Provider>
  );
}
