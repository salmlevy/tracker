/* Capa de datos: nube (Supabase) con cache local. Si no hay config, funciona 100% local. */
const URL_SB = import.meta.env.VITE_SUPABASE_URL || "";
const KEY_SB = import.meta.env.VITE_SUPABASE_KEY || "";
export const CLOUD = !!(URL_SB && KEY_SB);

const _fetch = window.fetch.bind(window);

export const sb = (path, opts = {}) =>
  _fetch(URL_SB + "/rest/v1/" + path, {
    ...opts,
    headers: {
      apikey: KEY_SB,
      Authorization: "Bearer " + KEY_SB,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
      ...(opts.headers || {}),
    },
  });

let USER = localStorage.getItem("trk_usuario") || "";
let CACHE = {};
let timer = null;

export const getUser = () => USER;

export function setUser(u) {
  USER = u;
  localStorage.setItem("trk_usuario", u);
}

export async function pullUser(u) {
  if (!CLOUD) return;
  const r = await sb("estado?usuario=eq." + encodeURIComponent(u) + "&select=datos");
  const rows = await r.json();
  CACHE = (rows && rows[0] && rows[0].datos) || {};
  Object.entries(CACHE).forEach(([k, v]) => localStorage.setItem("trk_" + k, v));
}

function push() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!CLOUD || !USER) return;
    sb("estado", {
      method: "POST",
      body: JSON.stringify({ usuario: USER, datos: CACHE, actualizado: new Date().toISOString() }),
    }).catch(() => {});
  }, 900);
}

/* Escritura doble: ademas del blob, guarda filas normalizadas para analisis */
export async function pushSesion(sesion, catalogo) {
  if (!CLOUD || !USER || !sesion) return;
  const id = USER + "|" + sesion.date;
  const dia = catalogo && catalogo[sesion.day];
  try {
    await sb("sesiones", {
      method: "POST",
      body: JSON.stringify({
        id, usuario: USER, fecha: sesion.date, tipo: "pesas",
        dia_id: sesion.day, dia: dia ? dia.name : sesion.day,
        energia: sesion.energy || "normal", nota: sesion.note || "",
      }),
    });
    const filas = [];
    if (dia) {
      dia.secs.forEach((sec) => sec.ids.forEach((exId) => {
        const ex = dia.ex.find((e) => e.id === exId);
        const log = sesion.logs && sesion.logs[exId];
        if (!ex || !log) return;
        const v = log.v === "alt" && ex.alt;
        const lbl = v ? ex.alt.lbl : ex.lbl;
        let pesoEs = "total";
        if (/lado/.test(lbl)) pesoEs = "por lado";
        else if (/mano/.test(lbl)) pesoEs = "por mano";
        else if (/pierna/.test(lbl)) pesoEs = "por pierna";
        if (ex.type === "assist") pesoEs = "asistencia";
        (log.sets || []).filter((x) => x && x.done).forEach((x, i) => {
          filas.push({
            sesion_id: id, usuario: USER, fecha: sesion.date,
            ejercicio_id: ex.id, ejercicio: v ? ex.alt.n : ex.n, grupo: sec.t,
            es_variante: !!v, numero: i + 1,
            peso: ex.type === "time" || ex.type === "body" ? 0 : x.w,
            unidad: ex.u === "kg" ? "kg" : "lbs", peso_es: pesoEs,
            repeticiones: ex.type === "time" ? null : x.r,
            segundos: ex.type === "time" ? x.r : null,
            tecnica_ok: x.f !== false, completada: true,
          });
        });
      }));
    }
    ((sesion.logs && sesion.logs._extras) || []).forEach((it) => {
      (it.sets || []).filter((x) => x && x.done).forEach((x, i) => {
        filas.push({ sesion_id: id, usuario: USER, fecha: sesion.date, ejercicio_id: it.id || "adhoc",
          ejercicio: it.n, grupo: "adicional", es_variante: false, numero: i + 1,
          peso: x.w, unidad: "lbs", peso_es: "total", repeticiones: x.r, tecnica_ok: true, completada: true });
      });
    });
    if (filas.length) await sb("series", { method: "POST", body: JSON.stringify(filas) });
  } catch (e) { /* el blob ya quedo guardado; esto es la capa de analisis */ }
}

export async function pushCorridas(runs, assign) {
  if (!CLOUD || !USER || !runs || !runs.length) return;
  try {
    await sb("corridas", {
      method: "POST",
      body: JSON.stringify(runs.map((r) => ({
        id: String(r.id), usuario: USER, fecha: r.date, slot: (assign || {})[r.id] || null,
        minutos: r.min || 0, km: r.km || 0, ritmo: r.pace || null,
        esfuerzo_relativo: r.re || null, en_cinta: !!r.indoor,
      }))),
    });
  } catch (e) {}
}

/* La app usa window.storage; aqui lo conectamos a local + nube */
export function installStorage() {
  window.__AI_PROXY__ = true;
  window.pushSesion = pushSesion;
  window.pushCorridas = pushCorridas;
  window.fetch = (url, opts) => {
    if (typeof url === "string" && url.indexOf("api.anthropic.com") >= 0) {
      return _fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: opts.body });
    }
    return _fetch(url, opts);
  };
  window.storage = {
    get: async (k) => {
      if (CLOUD && USER && CACHE[k] !== undefined) return { key: k, value: CACHE[k] };
      const v = localStorage.getItem("trk_" + k);
      return v == null ? null : { key: k, value: v };
    },
    set: async (k, v) => {
      localStorage.setItem("trk_" + k, v);
      CACHE[k] = v;
      push();
      return localStorage.getItem("trk_" + k) === v ? { key: k, value: v } : null;
    },
    delete: async (k) => { localStorage.removeItem("trk_" + k); delete CACHE[k]; push(); return { key: k, deleted: true }; },
    list: async () => ({ keys: Object.keys(CACHE) }),
  };
}
