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

/* La app usa window.storage; aqui lo conectamos a local + nube */
export function installStorage() {
  window.__AI_PROXY__ = true;
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
