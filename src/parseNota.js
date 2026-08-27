/**
 * Parser local de notas de cinta (TROTE).
 *
 * En Vercel no corre la IA (IA_OK se evalúa al cargar el módulo, antes de
 * window.__AI_PROXY__), así que este parser es el que llena el protocolo.
 *
 * Entiende dictado típico en español, no solo "velocidad N" / "1 min 15 secs":
 *   "7 min en 9km", "9km/h", "3 min a 14 por 1 min de descanso",
 *   "de 1 minuto por 1.5 min de descanso", "12 series a 12 km/h",
 *   "todo con inclinacion 1.5", compacto del coach ("15x1'15\" @15").
 *
 * Velocidades en las notas son km/h.
 */

const UNIT = "(?:min(?:uto)?s?|seg(?:undo)?s?|secs?)";
const U = "(min(?:uto)?s?|seg(?:undo)?s?|secs?)";
const NUM = "(\\d+(?:[.,]\\d+)?)";

function n(x) {
  if (x == null || x === "") return null;
  const v = parseFloat(String(x).replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

function toSec(raw, unit) {
  const v = n(raw);
  if (v == null) return null;
  const u = (unit || "min").toLowerCase();
  if (/^seg|^sec/.test(u)) return Math.round(v);
  return Math.round(v * 60);
}

function norm(txt) {
  return String(txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/km\s*\/\s*h|kmh|kph/g, "kmh")
    .replace(/kilometros?\s*por\s*hora/g, "kmh")
    .replace(/['’′]/g, "'")
    .replace(/["”″]/g, '"');
}

function idxOf(t, re, from) {
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  r.lastIndex = from || 0;
  const m = r.exec(t);
  return m ? m.index : -1;
}

function slicePhases(t) {
  const coolAt = (() => {
    const cands = [
      /cerre?\s+con\b/,
      /\bal\s+final\b/,
      /\bpor\s+ultimo\b/,
      /\benfriamiento\b/,
    ];
    let at = -1;
    cands.forEach((re) => {
      const i = idxOf(t, re);
      if (i >= 0 && (at < 0 || i < at)) at = i;
    });
    return at;
  })();
  const body = coolAt >= 0 ? t.slice(0, coolAt) : t;
  const cool = coolAt >= 0 ? t.slice(coolAt) : "";

  const workAt = (() => {
    const cands = [
      /empezo\s+el\s+entrenamiento/,
      /despues\s+empezo/,
      /entrenamiento\s+de\s+\d+\s*series/,
      /entrenamiento\s+de\s+\d+\s*repeticiones/,
      /hice\s+\d+\s*series/,
      /hice\s+un[a]?\s+ronda/,
      /hice\s+una\s+ronda/,
      /\d+\s*(?:series|repeticiones|veces|reps?)\s+(?:de|a)\b/,
    ];
    let at = -1;
    cands.forEach((re) => {
      const i = idxOf(body, re);
      if (i >= 0 && (at < 0 || i < at)) at = i;
    });
    return at;
  })();

  const warm = workAt >= 0 ? body.slice(0, workAt) : body;
  const work = workAt >= 0 ? body.slice(workAt) : body;
  return { warm, work, cool, body };
}

function parseWarmup(warm, whole) {
  const src = warm || whole;
  const out = {};
  const calCv =
    src.match(new RegExp("calent\\w*\\s+de\\s+" + NUM + "\\s*" + UNIT + "\\s*(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?calent\\w*\\s*(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    src.match(new RegExp("calent\\w*\\s+(?:de\\s+)?" + NUM + "\\s*" + UNIT + "[^.]{0,40}?(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?"));
  /* groups: [1]=min, [2]=vel  (unit is non-capturing) */
  if (calCv) {
    out.cal = n(calCv[1]);
    out.cv = n(calCv[2]);
  } else {
    const calOnly =
      src.match(new RegExp("calent\\w*\\s+de\\s+" + NUM + "\\s*" + UNIT)) ||
      src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?calent"));
    if (calOnly) out.cal = n(calOnly[1]);
    const cvOnly =
      src.match(new RegExp("calent\\w*[^.]{0,60}?(?:en|a|@|por)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
      src.match(new RegExp("en\\s*" + NUM + "\\s*kmh")) ||
      src.match(new RegExp("en\\s*" + NUM + "\\s*km\\b"));
    if (cvOnly) out.cv = n(cvOnly[1]);
  }
  return out;
}

function parseCool(cool, whole) {
  const src = cool || whole;
  const out = {};
  const pair =
    src.match(new RegExp("enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT + "\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM)) ||
    src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM + "\\s*(?:de\\s+)?enfriam")) ||
    src.match(new RegExp("cerre?\\s+con\\s+" + NUM + "\\s*" + UNIT + "\\s*(?:a|@)\\s*" + NUM)) ||
    src.match(new RegExp("al\\s+final(?:\\s+un)?\\s+enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT + "\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM)) ||
    src.match(new RegExp("por\\s+ultimo\\s+enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT + "\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM));
  if (pair) {
    out.cool = { min: n(pair[1]), v: n(pair[2]) };
    return out;
  }
  const minOnly =
    src.match(new RegExp("enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT)) ||
    src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?enfriam"));
  const velOnly =
    src.match(new RegExp("enfriam\\w*[^.]{0,50}?velocidad\\s*" + NUM)) ||
    src.match(new RegExp("enfriam\\w*[^.]{0,50}?(?:a|@)\\s*" + NUM));
  if (minOnly) out.cool = { min: n(minOnly[1]), v: velOnly ? n(velOnly[1]) : 6.5 };
  return out;
}

function defaultInc(work) {
  const todo = work.match(new RegExp("todo\\s+con\\s+inclinaci\\w*\\s*" + NUM));
  if (todo) return n(todo[1]);
  const con = work.match(new RegExp("con\\s+inclinaci\\w*\\s*" + NUM));
  if (con) return n(con[1]);
  const inc = work.match(new RegExp("inclinaci\\w*\\s*" + NUM));
  return inc ? n(inc[1]) : null;
}

function restDv(t) {
  if (/\b(fuera de(?: la)? banda|fuera de (?:la )?cinta|sin banda|descanso fuera|desc 0|dv 0)\b/.test(t)) return 0;
  return 0;
}

/* Marca duraciones que son descanso para no tomarlas como trabajo. */
function restRanges(text) {
  const ranges = [];
  const re = new RegExp("por\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan\\w*", "g");
  let m;
  while ((m = re.exec(text))) ranges.push({ start: m.index, end: m.index + m[0].length, t: toSec(m[1], m[2]), raw: m[0] });
  const re2 = new RegExp("(?:con|y)\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan\\w*", "g");
  while ((m = re2.exec(text))) ranges.push({ start: m.index, end: m.index + m[0].length, t: toSec(m[1], m[2]), raw: m[0] });
  return ranges;
}

function covered(ranges, i) {
  return ranges.some((r) => i >= r.start && i < r.end);
}

function lookAhead(text, from, to) {
  return text.slice(from, Math.min(text.length, to));
}

function parseIntervalList(work) {
  const rests = restRanges(work);
  const re = /(\d+(?:\.\d+)?)\s*(min(?:uto)?s?|seg(?:undo)?s?|secs?)/g;
  const bouts = [];
  const skipUntil = [];
  let m;
  while ((m = re.exec(work))) {
    if (covered(rests, m.index) || skipUntil.some((e) => m.index < e)) continue;
    if (/^\s*(?:de\s*)?descan/.test(work.slice(m.index + m[0].length))) continue;
    if (/\bcalent/.test(lookAhead(work, m.index + m[0].length, m.index + m[0].length + 24))) continue;
    const mmss = work.slice(m.index).match(/^(\d+)\s*min\w*\s+(\d+)\s*(?:secs?|seg\w*)/);
    let tSec = toSec(m[1], m[2]);
    let consumed = m[0].length;
    if (mmss && /min/.test(m[2])) {
      tSec = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
      consumed = mmss[0].length;
      skipUntil.push(m.index + consumed);
    }
    if (tSec == null || tSec <= 0) continue;
    /* Solo mira el tramo inmediato: si no, "a velocidad 13" de la siguiente serie se cuela. */
    const afterRaw = lookAhead(work, m.index + consumed, m.index + consumed + 72);
    const cut = afterRaw.search(/\b(?:despues|otra|una de|hice|cerre|enfriam)\b/);
    const after = cut >= 0 ? afterRaw.slice(0, cut) : afterRaw;
    const vel = after.match(new RegExp("^\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?"));
    const incM = after.match(new RegExp("inclinaci\\w*\\s*" + NUM));
    const restAfter = rests.find((r) => r.start >= m.index + consumed && r.start < m.index + consumed + 56);
    if (!vel && !incM && !/^\s*(?:a|@|en|de)\b/.test(after) && tSec < 30) continue;
    bouts.push({
      t: tSec,
      v: vel ? n(vel[1]) : null,
      inc: incM ? n(incM[1]) : null,
      dt: restAfter ? restAfter.t : null,
      at: m.index,
    });
  }
  return bouts;
}

function parseUniform(work, whole) {
  const src = work || whole;
  const out = {};
  const series = src.match(/(\d+)\s*(?:series|repeticiones|veces|reps?)\b/);
  if (series) out.n = Math.round(n(series[1]));
  const seriesVel =
    src.match(new RegExp("(?:series|repeticiones|veces|reps?)\\s+a\\s*" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    src.match(new RegExp("\\ba\\s*" + NUM + "\\s*kmh")) ||
    src.match(new RegExp("\\ba\\s*" + NUM + "\\s*km\\b")) ||
    src.match(new RegExp("velocidad\\s*" + NUM));
  if (seriesVel) out.v = n(seriesVel[1]);
  const inc = defaultInc(src);
  if (inc != null) out.inc = inc;
  const mmss = src.match(/(\d+)\s*min\w*\s+(\d+)\s*(?:secs?|seg\w*)/);
  if (mmss) out.t = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  const compactT = src.match(/(\d+)'(\d+)/);
  if (compactT && out.t == null) out.t = parseInt(compactT[1], 10) * 60 + parseInt(compactT[2], 10);
  const oneDur =
    src.match(new RegExp("(?:de\\s+)?" + NUM + "\\s*" + U + "\\s+por\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan")) ||
    src.match(new RegExp("de\\s+" + NUM + "\\s*" + U + "\\s+por\\s+"));
  if (oneDur && out.t == null) out.t = toSec(oneDur[1], oneDur[2]);
  const rest =
    src.match(new RegExp("por\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan")) ||
    src.match(new RegExp(NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan")) ||
    src.match(new RegExp("descan\\w*\\s*" + NUM + "\\s*" + U));
  if (rest) out.dt = toSec(rest[1], rest[2]);
  return out;
}

function parseCompact(t) {
  const out = {};
  const nx = t.match(/(\d+)\s*x\s*(\d+)'(\d+)/) || t.match(/(\d+)\s*x\s*(\d+)\s*min\w*\s*(\d+)/);
  if (nx) {
    out.n = Math.round(n(nx[1]));
    out.t = parseInt(nx[2], 10) * 60 + parseInt(nx[3], 10);
  }
  const at = t.match(/@\s*(\d+(?:\.\d+)?)\s*(?:kmh|km)?/);
  if (at) out.v = n(at[1]);
  const incl = t.match(/\bincl(?:inaci\w*)?\s*(\d+(?:\.\d+)?)/);
  if (incl) out.inc = n(incl[1]);
  const desc = t.match(/\bdesc(?:anso)?\s*(\d+(?:\.\d+)?)(\s*(?:secs?|seg\w*|min(?:uto)?s?|"|'))?/);
  if (desc) {
    const unit = (desc[2] || '"').trim() || '"';
    out.dt = /min/.test(unit) ? toSec(desc[1], "min") : Math.round(n(desc[1]));
  }
  const cal = t.match(/cal\s*(\d+(?:\.\d+)?)'\s*@\s*(\d+(?:\.\d+)?)/);
  if (cal) {
    out.cal = n(cal[1]);
    out.cv = n(cal[2]);
  }
  const enf = t.match(/enf\s*(\d+(?:\.\d+)?)'\s*@\s*(\d+(?:\.\d+)?)/);
  if (enf) out.cool = { min: n(enf[1]), v: n(enf[2]) };
  return out;
}

function setsDiffer(sets) {
  if (!sets || sets.length < 2) return false;
  const key = (s) => [s.t, s.v, s.inc, s.dt].join("|");
  const first = key(sets[0]);
  return sets.some((s) => key(s) !== first);
}

function fillCarry(bouts, gInc) {
  let lastV = null;
  let lastInc = gInc;
  return bouts.map((b) => {
    const v = b.v != null ? b.v : lastV;
    const inc = b.inc != null ? b.inc : lastInc;
    if (v != null) lastV = v;
    if (inc != null) lastInc = inc;
    return { t: b.t, v, inc, dt: b.dt };
  });
}

/**
 * Extrae el protocolo numérico de una nota dictada o compacta.
 * Devuelve null si no hay suficiente señal (menos de 3 campos).
 */
export function parseNota(txt) {
  const t = norm(txt);
  if (!t.trim()) return null;
  const { warm, work, cool, body } = slicePhases(t);
  const out = {};

  Object.assign(out, parseWarmup(warm, t));
  Object.assign(out, parseCool(cool, t));

  const gInc = defaultInc(work) != null ? defaultInc(work) : defaultInc(body);
  const bouts = fillCarry(parseIntervalList(work), gInc);
  const usable = bouts.filter((b) => b.t != null && b.t >= 20 && b.v != null);
  const uni = parseUniform(work, t);
  const compact = parseCompact(t);

  if (usable.length >= 2 && (setsDiffer(usable) || usable.length !== (uni.n || 0))) {
    /* Series que no son idénticas → shape sets[] (series variables). */
    out.sets = usable.map((b) => ({
      t: b.t,
      v: b.v,
      inc: b.inc != null ? b.inc : (gInc != null ? gInc : 0),
      dt: b.dt != null ? b.dt : (uni.dt != null ? uni.dt : 0),
    }));
    out.n = out.sets.length;
    out.t = out.sets[0].t;
    out.v = out.sets[0].v;
    out.inc = gInc != null ? gInc : out.sets[0].inc;
    const dts = out.sets.map((s) => s.dt).filter((x) => x != null);
    if (dts.length) out.dt = dts[0];
  } else {
    const u = { ...compact, ...uni };
    if (usable.length === 1) {
      if (u.t == null) u.t = usable[0].t;
      if (u.v == null) u.v = usable[0].v;
      if (u.inc == null && usable[0].inc != null) u.inc = usable[0].inc;
      if (u.dt == null && usable[0].dt != null) u.dt = usable[0].dt;
    }
    if (u.n != null) out.n = u.n;
    if (u.t != null) out.t = u.t;
    if (u.v != null) out.v = u.v;
    if (u.inc != null) out.inc = u.inc;
    else if (gInc != null) out.inc = gInc;
    if (u.dt != null) out.dt = u.dt;
    if (u.cal != null && out.cal == null) out.cal = u.cal;
    if (u.cv != null && out.cv == null) out.cv = u.cv;
    if (u.cool && !out.cool) out.cool = u.cool;
  }

  if (out.dv == null) out.dv = restDv(t);

  const keys = Object.keys(out).filter((k) => k !== "dv" || out.dv != null);
  return keys.length >= 3 ? out : null;
}

/**
 * Aplica lo parseado sobre el protocolo guardado.
 * - Si el parse es uniforme, BORRA leftover sets[] (si no, la UI esconde VEL y queda @undefined).
 * - Si el parse es variable, escribe sets[] y espeja v/t/inc del primer set.
 * - Nunca deja v undefined en modo uniforme.
 * - Conserva la nota y campos que el parse no tocó, salvo sets contradictorios.
 */
export function applyParsedProtocol(p, r) {
  const prev = p || {};
  if (!r) return prev;
  const nota = prev.nota;
  const firstOld = Array.isArray(prev.sets) && prev.sets[0] ? prev.sets[0] : {};
  if (Array.isArray(r.sets) && r.sets.length) {
    const sets = r.sets.map((s) => ({
      t: s.t != null ? s.t : r.t,
      v: s.v != null ? s.v : r.v,
      inc: s.inc != null ? s.inc : r.inc,
      dt: s.dt != null ? s.dt : r.dt,
    }));
    return {
      cal: r.cal != null ? r.cal : prev.cal,
      cv: r.cv != null ? r.cv : prev.cv,
      n: sets.length,
      t: sets[0].t,
      v: sets[0].v,
      inc: r.inc != null ? r.inc : sets[0].inc,
      dt: r.dt != null ? r.dt : sets[0].dt,
      dv: r.dv != null ? r.dv : (prev.dv != null ? prev.dv : 0),
      cool: r.cool || prev.cool,
      sets,
      nota,
    };
  }
  const v = r.v != null ? r.v : (prev.v != null ? prev.v : firstOld.v);
  const next = {
    cal: r.cal != null ? r.cal : prev.cal,
    cv: r.cv != null ? r.cv : prev.cv,
    n: r.n != null ? r.n : prev.n,
    t: r.t != null ? r.t : prev.t,
    v,
    inc: r.inc != null ? r.inc : (prev.inc != null ? prev.inc : firstOld.inc),
    dt: r.dt != null ? r.dt : prev.dt,
    dv: r.dv != null ? r.dv : (prev.dv != null ? prev.dv : 0),
    cool: r.cool || prev.cool,
    nota,
  };
  /* leftover sets[] de potencia (seed) no deben sobrevivir a un parse uniforme */
  return next;
}

function sameP(a, b) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

/**
 * Al cargar gymu_trote_v1: si un slot tiene nota, reparsea y corrige los números
 * para que coincidan con la nota. No borra notas ni otras semanas.
 */
export function hydrateTroteFromNotas(trote) {
  if (!trote || !trote.weeks || typeof trote.weeks !== "object") return trote;
  let changed = false;
  const weeks = {};
  Object.entries(trote.weeks).forEach(([wk, w]) => {
    if (!w || typeof w !== "object") { weeks[wk] = w; return; }
    const nw = { ...w };
    Object.entries(w).forEach(([slot, val]) => {
      if (slot === "lar" || !val || !val.p || !val.p.nota) { nw[slot] = val; return; }
      const r = parseNota(val.p.nota);
      if (!r) { nw[slot] = val; return; }
      const np = applyParsedProtocol(val.p, r);
      if (!sameP(np, val.p)) {
        changed = true;
        nw[slot] = { ...val, p: np };
      } else nw[slot] = val;
    });
    weeks[wk] = nw;
  });
  return changed ? { ...trote, weeks } : trote;
}
