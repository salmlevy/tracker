/* Uso de ENTRENO. Inserta en public.events (anon solo INSERT, return=minimal).
   Nunca lanza: si la red o el almacenamiento fallan, la cola queda en localStorage. */

export const QUEUE_KEY = "entreno_events_q_v1";
export const MAX_QUEUE = 40;
export const MAX_BYTES = 48 * 1024;
export const APP_VERSION = "1.0.0";

const SID_KEY = "entreno_sid_v1";
const NAME_RE = /^[a-z0-9_]{2,64}$/;
const KEY_RE = /^[a-z0-9_]{1,32}$/;
const SENSITIVE = new Set([
  "nota", "note", "texto", "text", "email", "password", "token", "peso", "reps",
  "nombre", "usuario", "message", "error", "query", "url", "secret", "key",
  "apikey", "authorization", "body", "prompt", "desc", "stack",
]);

export function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/* Día civil del dispositivo, no el día UTC. */
export function localDateParts(date, timeZone) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const tz = timeZone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const pick = (type) => {
      const p = parts.find((x) => x.type === type);
      return p ? p.value : "";
    };
    const local_date = pick("year") + "-" + pick("month") + "-" + pick("day");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(local_date)) throw new Error("bad date");
    return { local_date, tz };
  } catch {
    return { local_date: d.toISOString().slice(0, 10), tz: "UTC" };
  }
}

export function sanitizeProps(props) {
  const out = {};
  if (!props || typeof props !== "object" || Array.isArray(props)) return out;
  for (const [k, v] of Object.entries(props)) {
    if (!KEY_RE.test(k) || SENSITIVE.has(k)) continue;
    if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") {
      const s = v.replace(/[\r\n]/g, " ").trim();
      if (s && s.length <= 64) out[k] = s;
    }
  }
  return out;
}

export function trimQueue(items, max = MAX_QUEUE, maxBytes = MAX_BYTES) {
  let next = Array.isArray(items) ? items.slice(-Math.max(1, max)) : [];
  let raw = "";
  try { raw = JSON.stringify(next); } catch { return []; }
  while (next.length > 1 && raw.length > maxBytes) {
    next = next.slice(1);
    raw = JSON.stringify(next);
  }
  if (raw.length > maxBytes) return [];
  return next;
}

function readQueue(storage) {
  try {
    const raw = storage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const q = JSON.parse(raw);
    return Array.isArray(q) ? q : [];
  } catch {
    return [];
  }
}

function writeQueue(storage, items, max, maxBytes) {
  try {
    storage.setItem(QUEUE_KEY, JSON.stringify(trimQueue(items, max, maxBytes)));
  } catch { /* quota o almacenamiento bloqueado */ }
}

function sameHead(a, b) {
  return !!(a && b && a.client_ts === b.client_ts && a.event_name === b.event_name);
}

export function createTracker(opts = {}) {
  const storage = opts.storage;
  const post = typeof opts.post === "function" ? opts.post : async () => false;
  const now = opts.now || (() => new Date());
  const timeZone = opts.timeZone || deviceTimeZone;
  const sessionId = opts.sessionId || "";
  const version = opts.version || APP_VERSION;
  const schedule = opts.schedule || ((fn) => { setTimeout(fn, 0); });
  const max = opts.maxQueue || MAX_QUEUE;
  const maxBytes = opts.maxBytes == null ? MAX_BYTES : opts.maxBytes;
  let running = null;

  function flush() {
    if (running) return running;
    running = (async () => {
      try {
        while (true) {
          const q = readQueue(storage);
          if (!q.length) return;
          const head = q[0];
          let ok = false;
          try { ok = (await post(head)) === true; } catch { ok = false; }
          if (!ok) return;
          const cur = readQueue(storage);
          if (sameHead(cur[0], head)) writeQueue(storage, cur.slice(1), max, maxBytes);
        }
      } catch { /* no romper la app */ }
      finally { running = null; }
    })();
    return running;
  }

  function track(eventName, props) {
    try {
      if (typeof eventName !== "string" || !NAME_RE.test(eventName)) return;
      const date = now();
      const when = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
      const tz = typeof timeZone === "function" ? timeZone() : timeZone;
      const parts = localDateParts(when, tz || "UTC");
      const row = {
        event_name: eventName,
        props: sanitizeProps(props),
        client_ts: when.toISOString(),
        local_date: parts.local_date,
        tz: parts.tz,
        session_id: sessionId || "",
        app_version: version || "",
      };
      writeQueue(storage, readQueue(storage).concat([row]), max, maxBytes);
      schedule(() => { Promise.resolve(flush()).catch(() => {}); });
    } catch { /* no romper la app */ }
  }

  return { track, flush };
}

/* true = aceptado o sin configurar (no reintentar en local). false = reintentar.
   Acceso estático a import.meta.env para que Vite incruste las claves en el build. */
export async function postEvent(row) {
  let url = "";
  let key = "";
  try {
    url = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    key = import.meta.env.VITE_SUPABASE_KEY || "";
  } catch {
    return true;
  }
  if (!url || !key || typeof fetch !== "function") return true;
  const res = await fetch(url + "/rest/v1/events", {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_name: row.event_name,
      props: row.props && typeof row.props === "object" ? row.props : {},
      client_ts: row.client_ts,
      local_date: row.local_date,
      tz: row.tz,
      session_id: row.session_id || null,
      app_version: row.app_version || null,
    }),
  });
  return !!res.ok;
}

function memStore() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
  };
}

function safeStorage(kind) {
  try {
    if (typeof window === "undefined") return memStore();
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    s.setItem("entreno_probe", "1");
    s.removeItem("entreno_probe");
    return s;
  } catch {
    return memStore();
  }
}

function loadSessionId() {
  const s = safeStorage("session");
  try {
    let id = s.getItem(SID_KEY);
    if (!id) {
      id = "s" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      s.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return "s" + Date.now().toString(36);
  }
}

const appTracker = createTracker({
  storage: safeStorage("local"),
  post: postEvent,
  sessionId: typeof window === "undefined" ? "node" : loadSessionId(),
  version: APP_VERSION,
});

export function track(name, props) {
  appTracker.track(name, props);
}

export function flushEvents() {
  return appTracker.flush();
}

if (typeof window !== "undefined") {
  try {
    window.addEventListener("online", () => { appTracker.flush(); });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") appTracker.flush();
    });
    setTimeout(() => { appTracker.flush(); }, 0);
  } catch { /* seguimiento opcional */ }
}
