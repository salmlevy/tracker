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

function parseClockSec(raw) {
  const m = String(raw || "").trim().match(/^(\d+):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function toSec(raw, unit) {
  const clock = parseClockSec(raw);
  if (clock != null) return clock;
  const v = n(raw);
  if (v == null) return null;
  const u = (unit || "min").toLowerCase().trim();
  if (u === "s" || u === '"' || /^seg|^sec/.test(u)) return Math.round(v);
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
    .replace(/["”″]/g, '"')
    .replace(/×/g, "x")
    .replace(/\bluesgo\b/g, "luego");
}

function idxOf(t, re, from) {
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  r.lastIndex = from || 0;
  const m = r.exec(t);
  return m ? m.index : -1;
}

/* Notas con encabezados Calentamiento / Principal / Final (con :). */
function labeledSections(t) {
  const re = /\b(calentamiento|principal|final)\s*:/g;
  const marks = [];
  let m;
  while ((m = re.exec(t))) {
    const name = m[1] === "calentamiento" ? "warm" : m[1] === "principal" ? "work" : "cool";
    marks.push({ name, i: m.index });
  }
  if (marks.length < 2) return null;
  marks.sort((a, b) => a.i - b.i);
  const out = { warm: "", work: "", cool: "", body: t, labeled: true };
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].i : t.length;
    out[marks[i].name] = t.slice(marks[i].i, end);
  }
  return out;
}

function slicePhases(t) {
  const coolAt = (() => {
    const cands = [
      /cerre?\s+con\b/,
      /\bal\s+final\b/,
      /\bpor\s+ultimo\b/,
      /\benfriamiento\b/,
      /para\s+enfr(?:iar|iam)/,
      /\benfriar\b/,
      /\benf\s+\d/,
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
      /\d+\s*(?:series|repeticiones|veces|reps?)\s+(?:de|a|en|@)\b/,
      /\d+\s*x\s*\d+/,
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

function stripStridePhrases(src) {
  return String(src || "").replace(/\d+\s*(?:jalonc\w*|zancad\w*|strides?)\b[\s\S]{0,90}/g, " ");
}

function parseWarmup(warm, whole) {
  const raw = warm || whole;
  const src = stripStridePhrases(raw);
  const out = {};
  const colon = src.match(new RegExp("calent\\w*\\s*:\\s*" + NUM + "\\s*" + UNIT));
  const suave = src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?trote\\s+suave"));
  if (colon) out.cal = n(colon[1]);
  else if (suave) out.cal = n(suave[1]);
  const calCv =
    src.match(new RegExp("calent\\w*\\s+de\\s+" + NUM + "\\s*" + UNIT + "\\s*(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?calent\\w*\\s*(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    src.match(new RegExp("calent\\w*\\s+(?:de\\s+)?" + NUM + "\\s*" + UNIT + "[^.]{0,40}?(?:en|a|@)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?"));
  /* groups: [1]=min, [2]=vel  (unit is non-capturing) */
  if (calCv) {
    if (out.cal == null) out.cal = n(calCv[1]);
    out.cv = n(calCv[2]);
  } else {
    const calOnly =
      src.match(new RegExp("calent\\w*\\s+de\\s+" + NUM + "\\s*" + UNIT)) ||
      src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?calent"));
    if (calOnly && out.cal == null) out.cal = n(calOnly[1]);
    const cvOnly =
      src.match(new RegExp("calent\\w*[^.]{0,60}?(?:en|a|@|por)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
      src.match(new RegExp("en\\s*" + NUM + "\\s*kmh")) ||
      src.match(new RegExp("en\\s*" + NUM + "\\s*km\\b"));
    if (cvOnly) out.cv = n(cvOnly[1]);
  }
  if (out.cal != null && /\bsin\s+inclin/.test(src)) out.cinc = 0;
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
    src.match(new RegExp("por\\s+ultimo\\s+enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT + "\\s*(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM)) ||
    src.match(new RegExp("(?:para\\s+)?enfr(?:iar|iam)\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT + "\\s*(?:a|@|en|e)\\s*(?:velocidad\\s*)?" + NUM)) ||
    src.match(new RegExp("enf\\s*" + NUM + "'\\s*@\\s*" + NUM));
  if (pair) {
    out.cool = { min: n(pair[1]), v: n(pair[2]) };
    if (/\bsin\s+inclin/.test(src)) out.einc = 0;
    return out;
  }
  const minOnly =
    src.match(new RegExp("enfriam\\w*\\s*(?:de\\s*)?" + NUM + "\\s*" + UNIT)) ||
    src.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?enfriam"));
  const velOnly =
    src.match(new RegExp("enfriam\\w*[^.]{0,50}?velocidad\\s*" + NUM)) ||
    src.match(new RegExp("enfriam\\w*[^.]{0,50}?(?:a|@)\\s*" + NUM));
  if (minOnly) out.cool = { min: n(minOnly[1]), v: velOnly ? n(velOnly[1]) : 6.5 };
  if (!out.cool) {
    const easySrc = cool || (/\bfinal\s*:/.test(src) ? src : "");
    const easy =
      easySrc.match(new RegExp("(?:final|enfr\\w*)\\s*:?\\s*" + NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?trote\\s+suave")) ||
      easySrc.match(new RegExp(NUM + "\\s*" + UNIT + "\\s*(?:de\\s+)?trote\\s+suave")) ||
      easySrc.match(new RegExp("(?:final)\\s*:\\s*" + NUM + "\\s*" + UNIT));
    if (easy) {
      const vel =
        easySrc.match(new RegExp("(?:a|@|en)\\s*(?:velocidad\\s*)?" + NUM + "(?:\\s*kmh|\\s*km)")) ||
        easySrc.match(new RegExp("velocidad\\s*" + NUM));
      out.cool = vel ? { min: n(easy[1]), v: n(vel[1]) } : { min: n(easy[1]) };
    }
  }
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
  const push = (m, tSec) => ranges.push({ start: m.index, end: m.index + m[0].length, t: tSec, raw: m[0] });
  const re = new RegExp("por\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan\\w*", "g");
  let m;
  while ((m = re.exec(text))) push(m, toSec(m[1], m[2]));
  const re2 = new RegExp("(?:con|y)\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan\\w*", "g");
  while ((m = re2.exec(text))) push(m, toSec(m[1], m[2]));
  const reX = new RegExp("x\\s+" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan\\w*", "g");
  while ((m = reX.exec(text))) push(m, toSec(m[1], m[2]));
  const reClock = new RegExp("(?:x|por|con)?\\s*(\\d+:\\d+)\\s*(?:de\\s*)?descan\\w*", "g");
  while ((m = reClock.exec(text))) {
    const tSec = parseClockSec(m[1]);
    if (tSec != null) push(m, tSec);
  }
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

function descUnitToSec(raw, unit, workUnit) {
  const u = (unit || "").trim();
  if (/min/.test(u) || (u === "'" && !/"/.test(u))) return toSec(raw, "min");
  if (/^seg|^sec|^s$|^"/.test(u)) return toSec(raw, "seg");
  if (!u && workUnit) return toSec(raw, workUnit);
  if (!u) return Math.round(n(raw));
  return Math.round(n(raw));
}

function flagsAfter(after, workUnit) {
  const cut = after.search(/\d+\s*x\s*\d+|\benf\b|\bcalent|\bcal\s+\d/);
  const src = cut >= 0 ? after.slice(0, cut) : after;
  const incM = src.match(/\bincl(?:inaci\w*)?\s*(\d+(?:\.\d+)?)/);
  const descM = src.match(/\bdesc(?:anso)?\s*(\d+(?:\.\d+)?)(s\b|secs?|seg\w*|min(?:uto)?s?|"|'|\s+(?:secs?|seg\w*|min(?:uto)?s?|"|'))?/);
  const sinAt = src.search(/\bsin\s+incl/);
  const incAt = incM ? src.indexOf(incM[0]) : -1;
  let inc = null;
  if (incM && (sinAt < 0 || incAt < sinAt)) inc = n(incM[1]);
  else if (sinAt >= 0) inc = 0;
  return {
    inc,
    dt: descM ? descUnitToSec(descM[1], descM[2], workUnit) : null,
  };
}

/* Varios NxT @V en una misma nota, sin colapsar. */
function parseCompactBlocks(t) {
  const re = /(\d+)\s*x\s*(\d+)(?:\s*'\s*(\d+)\s*"|\s*'|\s*(s|seg(?:undo)?s?|secs?|")|\s*(min(?:uto)?s?))?\s*(?:@|a)\s*(\d+(?:\.\d+)?)/g;
  const blocks = [];
  let m;
  while ((m = re.exec(t))) {
    let tSec;
    let workUnit = "seg";
    if (m[3] != null) {
      tSec = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
      workUnit = "min";
    } else if (m[0].includes("'")) {
      tSec = toSec(m[2], "min");
      workUnit = "min";
    } else if (m[5]) {
      tSec = toSec(m[2], m[5]);
      workUnit = m[5];
    } else {
      tSec = toSec(m[2], m[4] || "seg");
      workUnit = m[4] || "seg";
    }
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 56);
    const fl = flagsAfter(after, workUnit);
    blocks.push({
      n: Math.round(n(m[1])),
      t: tSec,
      v: n(m[6]),
      inc: fl.inc,
      dt: fl.dt,
    });
  }
  return blocks;
}

function workDur(chunk) {
  const reDe = new RegExp("(?:^|\\s)de\\s+" + NUM + "\\s*" + U, "g");
  let m;
  while ((m = reDe.exec(chunk))) {
    const trail = chunk.slice(m.index + m[0].length, m.index + m[0].length + 18);
    if (/^\s*(?:de\s*)?descan/.test(trail)) continue;
    return { t: toSec(m[1], m[2]), unit: m[2] };
  }
  const re = new RegExp(NUM + "\\s*" + U, "g");
  while ((m = re.exec(chunk))) {
    if (covered(restRanges(chunk), m.index)) continue;
    if (/^\s*(?:de\s*)?descan/.test(chunk.slice(m.index + m[0].length, m.index + m[0].length + 16))) continue;
    if (/\bcalent/.test(chunk.slice(Math.max(0, m.index - 16), m.index + 24))) continue;
    if (/\benfr/.test(chunk.slice(Math.max(0, m.index - 16), m.index + 24))) continue;
    return { t: toSec(m[1], m[2]), unit: m[2] };
  }
  return { t: null, unit: null };
}

function restSec(chunk, workUnit) {
  const m =
    chunk.match(new RegExp("por\\s+" + NUM + "\\s*" + U + "\\s*\\.?\\s*(?:de\\s*)?descan")) ||
    chunk.match(new RegExp("por\\s+" + NUM + "\\s*(?:de\\s*)?descan")) ||
    chunk.match(new RegExp("por\\s+" + NUM + "\\s*" + U));
  if (!m) return null;
  return descUnitToSec(m[1], m[2], workUnit);
}

function chunkVel(chunk) {
  const m = chunk.match(new RegExp("(?:en|a|@)\\s*" + NUM + "(?:\\s*kmh|\\s*km)?(?!\\s*(?:de\\s+)?inclin)"));
  return m ? n(m[1]) : null;
}

function chunkInc(chunk) {
  if (/\bsin\s+inclin/.test(chunk)) return 0;
  const m =
    chunk.match(new RegExp("inclinaci\\w*\\s*" + NUM)) ||
    chunk.match(new RegExp(NUM + "\\s*(?:de\\s+)?inclinaci"));
  return m ? n(m[1]) : null;
}

function parseBoutPhrase(chunk) {
  const c = String(chunk || "").trim();
  if (!c) return null;
  let dt = null;
  const restClock = c.match(/\b(?:x|por|con)\s*(\d+:\d+)\s*(?:de\s*)?descan/);
  const restUnit = c.match(new RegExp("(?:x|por|con)\\s*" + NUM + "\\s*" + U + "\\s*(?:de\\s*)?descan"));
  const restBareClock = c.match(/(\d+:\d+)\s*(?:de\s*)?descan/);
  if (restClock) dt = parseClockSec(restClock[1]);
  else if (restUnit) dt = toSec(restUnit[1], restUnit[2]);
  else if (restBareClock) dt = parseClockSec(restBareClock[1]);
  const work =
    c.match(new RegExp("(?:de\\s+)?" + NUM + "\\s*" + U + "\\s*(?:a|@|en)\\s*" + NUM + "(?:\\s*kmh|\\s*km)?")) ||
    c.match(/(\d+)\s*'\s*(?:(\d+)\s*")?\s*(?:@|a)\s*(\d+(?:\.\d+)?)/);
  if (!work) return null;
  let tSec;
  let vel;
  if (work[0].includes("'")) {
    tSec = work[2] != null && work[2] !== ""
      ? parseInt(work[1], 10) * 60 + parseInt(work[2], 10)
      : toSec(work[1], "min");
    vel = n(work[3]);
  } else {
    tSec = toSec(work[1], work[2]);
    vel = n(work[3]);
  }
  if (tSec == null || vel == null) return null;
  return { t: tSec, v: vel, inc: chunkInc(c), dt };
}

function splitInnerBouts(inner) {
  const byComma = String(inner || "").split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  if (byComma.length >= 2) return byComma;
  const byY = String(inner || "").split(/\s+y\s+(?=\d)/).map((s) => s.trim()).filter(Boolean);
  if (byY.length >= 2) return byY;
  const t = String(inner || "").trim();
  return t ? [t] : [];
}

/* "5 veces (bloque A, bloque B)" → un bloque por cada parte, con n=5. */
function parseGroupedRepeats(work) {
  const re = /(\d+)\s*(?:veces|reps?|repeticiones|series)\s*\(([^)]+)\)/g;
  const blocks = [];
  let m;
  while ((m = re.exec(work))) {
    const times = Math.round(n(m[1]));
    const after = work.slice(m.index + m[0].length, m.index + m[0].length + 48);
    const gInc = chunkInc(m[0] + " " + after);
    splitInnerBouts(m[2]).forEach((part) => {
      const b = parseBoutPhrase(part);
      if (!b) return;
      blocks.push({
        n: times,
        t: b.t,
        v: b.v,
        inc: b.inc != null ? b.inc : gInc,
        dt: b.dt != null ? b.dt : 0,
      });
    });
  }
  return blocks;
}

function parseStrides(src) {
  const re = /(\d+)\s*(?:jalonc\w*|zancad\w*|strides?)\s*(?:de\s*)?(\d+(?:\.\d+)?)\s*(min(?:uto)?s?|seg(?:undo)?s?|secs?|s|"|')\s*(?:a|@|en)\s*(\d+(?:\.\d+)?)(?:\s*kmh|\s*km)?\s*(?:x|por)\s*(\d+(?:\.\d+)?|\d+:\d+)(?:\s*(min(?:uto)?s?|seg(?:undo)?s?|secs?|s|"|'))?\s*(?:de\s*)?descan\w*/g;
  const blocks = [];
  let m;
  while ((m = re.exec(src))) {
    const dt = parseClockSec(m[5]) != null ? parseClockSec(m[5]) : toSec(m[5], m[6] || m[3]);
    blocks.push({
      n: Math.round(n(m[1])),
      t: toSec(m[2], m[3]),
      v: n(m[4]),
      inc: chunkInc(m[0]),
      dt,
    });
  }
  return blocks;
}

function normBlock(b, gInc) {
  return {
    n: b.n || 1,
    t: b.t,
    v: b.v,
    inc: b.inc != null ? b.inc : (gInc != null ? gInc : 0),
    dt: b.dt != null ? b.dt : 0,
  };
}

function parseDictatedBlocks(work) {
  const re = /(\d+)\s*(?:reps?|repeticiones|series|veces)\b/g;
  const starts = [];
  let m;
  while ((m = re.exec(work))) starts.push({ n: Math.round(n(m[1])), at: m.index });
  if (!starts.length) return [];
  const blocks = [];
  for (let i = 0; i < starts.length; i++) {
    const end = i + 1 < starts.length ? starts[i + 1].at : work.length;
    const chunk = work.slice(starts[i].at, end);
    const bouts = parseIntervalList(chunk).filter((b) => b.t != null && b.t > 0 && b.v != null);
    if (bouts.length >= 2 && setsDiffer(bouts)) return [];
    const dur = workDur(chunk);
    const v = chunkVel(chunk);
    const inc = chunkInc(chunk);
    const dt = restSec(chunk, dur.unit);
    if (dur.t == null || v == null) continue;
    blocks.push({ n: starts[i].n, t: dur.t, v, inc, dt });
  }
  return blocks;
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

function finishProtocol(out) {
  if (out.dv == null) out.dv = 0;
  const keys = Object.keys(out).filter((k) => out[k] != null);
  return keys.length >= 3 ? out : null;
}

export function fmtDur(sec) {
  if (sec == null || !Number.isFinite(Number(sec))) return "";
  const s = Math.round(Number(sec));
  if (s < 60) return s + "s";
  if (s % 60 === 0) return s / 60 + "'";
  return Math.floor(s / 60) + "'" + (s % 60) + '"';
}

export function fmtInc(x) {
  if (x == null || x === "") return "";
  if (Number(x) === 0) return "sin incl";
  return "incl " + x;
}

export function formatBlockLine(b) {
  if (!b) return "";
  const nRep = b.n != null ? b.n : 1;
  const bits = [nRep + "×" + fmtDur(b.t) + " @" + b.v, fmtInc(b.inc)];
  if (b.dt != null) bits.push("desc " + fmtDur(b.dt));
  return bits.filter(Boolean).join(" · ");
}

export function formatPlanLines(p) {
  if (!p) return [];
  const lines = [];
  if (p.cal != null) {
    let cal = "cal " + p.cal + "'";
    if (p.cv != null && p.cv !== "") cal += " @" + p.cv;
    lines.push([cal, fmtInc(p.cinc)].filter(Boolean).join(" · "));
  }
  if (Array.isArray(p.blocks) && p.blocks.length) {
    p.blocks.forEach((b) => lines.push(formatBlockLine(b)));
  } else if (Array.isArray(p.sets) && p.sets.length) {
    p.sets.forEach((s) => lines.push(formatBlockLine({ n: 1, t: s.t, v: s.v, inc: s.inc, dt: s.dt })));
  } else if (p.n != null && p.t != null) {
    lines.push(formatBlockLine({ n: p.n, t: p.t, v: p.v, inc: p.inc, dt: p.dt }));
  }
  if (p.cool && p.cool.min) {
    let enf = "enf " + p.cool.min + "'";
    if (p.cool.v != null && p.cool.v !== "") enf += " @" + p.cool.v;
    lines.push([enf, fmtInc(p.einc)].filter(Boolean).join(" · "));
  }
  return lines;
}

export function planIsEmpty(p) {
  if (!p) return true;
  if (Array.isArray(p.blocks) && p.blocks.length) return false;
  if (Array.isArray(p.sets) && p.sets.length) return false;
  if (p.n != null && p.t != null && p.v != null) return false;
  if (p.cal != null || (p.cool && p.cool.min)) return false;
  if (p.min || p.km) return false;
  return true;
}

/**
 * Extrae el protocolo numérico de una nota dictada o compacta.
 * Devuelve null si no hay suficiente señal (menos de 3 campos).
 */
export function parseNota(txt) {
  const t = norm(txt);
  if (!t.trim()) return null;
  const labeled = labeledSections(t);
  const { warm, work, cool, body } = labeled || slicePhases(t);
  const out = {};

  Object.assign(out, parseWarmup(warm, labeled ? warm : t));
  Object.assign(out, parseCool(cool, labeled ? cool : t));

  const compact = parseCompact(t);
  if (out.cal == null && compact.cal != null) out.cal = compact.cal;
  if (out.cv == null && compact.cv != null && !parseStrides(warm || t).length) out.cv = compact.cv;
  if (!out.cool && compact.cool) out.cool = compact.cool;
  if (out.cinc == null && /\bcal\b.{0,40}sin\s+incl/.test(t)) out.cinc = 0;
  if (out.einc == null && /\benf\b.{0,40}sin\s+incl/.test(t)) out.einc = 0;

  const gInc = defaultInc(work) != null ? defaultInc(work) : (labeled ? null : defaultInc(body));
  const strides = parseStrides(warm || t);
  const grouped = parseGroupedRepeats(work);
  const compactBlocks = parseCompactBlocks(t);
  const dictBlocks = parseDictatedBlocks(work);
  const main = grouped.length >= 2
    ? grouped
    : (compactBlocks.length >= 2 ? compactBlocks : (dictBlocks.length >= 2 ? dictBlocks : null));

  const blocks = [];
  strides.forEach((b) => blocks.push(normBlock(b, 0)));
  if (main) main.forEach((b) => blocks.push(normBlock(b, gInc)));

  if (blocks.length >= 2) {
    out.blocks = blocks;
    const head = (main && main[0]) ? normBlock(main[0], gInc) : blocks[0];
    out.n = head.n;
    out.t = head.t;
    out.v = head.v;
    out.inc = head.inc;
    out.dt = head.dt;
    if (out.dv == null) out.dv = restDv(t);
    return finishProtocol(out);
  }

  const bouts = fillCarry(parseIntervalList(work), gInc);
  const usable = bouts.filter((b) => b.t != null && b.t > 0 && b.v != null);
  const uni = parseUniform(work, t);

  if (usable.length >= 2 && (setsDiffer(usable) || usable.length !== (uni.n || 0))) {
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
    const one = compactBlocks[0] || dictBlocks[0] || null;
    const u = { ...compact, ...uni };
    if (one) {
      if (u.n == null) u.n = one.n;
      if (u.t == null) u.t = one.t;
      if (u.v == null) u.v = one.v;
      if (u.inc == null && one.inc != null) u.inc = one.inc;
      if (u.dt == null && one.dt != null) u.dt = one.dt;
    }
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
  return finishProtocol(out);
}

/**
 * Aplica lo parseado sobre el protocolo guardado.
 * El parse de la nota es la fuente: no se conservan números de un plan semilla.
 * Conserva la nota.
 */
export function applyParsedProtocol(p, r) {
  const nota = p && p.nota;
  if (!r) return p || {};
  const next = { ...r, nota };
  if (Array.isArray(r.blocks) && r.blocks.length) delete next.sets;
  else if (Array.isArray(r.sets) && r.sets.length) delete next.blocks;
  else {
    delete next.sets;
    delete next.blocks;
  }
  if (next.dv == null) next.dv = 0;
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
