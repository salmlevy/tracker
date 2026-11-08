/* Perfiles de gym. El historial viejo no se reescribe: sin gymId es EW.
   El 3 nov 2026 pasa a Navy (Technogym, kg) solo si las notas lo dicen sin contradicción. */

export const GYM_KEY = "gymu_gyms_v1";
export const GYM_SEL_KEY = "gymu_gym_sel_v1";
export const HABITUAL_ID = "habitual";
export const TECHNOGYM_ID = "gym-technogym";
export const LB2KG = 0.45359237;
const CERCA_M = 200;

export const NOMBRE_EW = "EW";
export const NOMBRE_NAVY = "Navy";

/* Nota del 6 nov 2026, día A, a1: en Navy el chest press es en poleas.
   Semilla, no una sesión reescrita. El título del ejercicio no cambia. */
export const MAQUINA_NAVY_A1 = "poleas";

export function gymHabitual() {
  return { id: HABITUAL_ID, nombre: NOMBRE_EW, marca: "", unidad: "lb", incremento: 5, lat: null, lng: null };
}

export function formatoNum(n) {
  const x = Math.round(Number(n) * 1000) / 1000;
  if (!Number.isFinite(x)) return "0";
  if (Object.is(x, -0)) return "0";
  return String(x);
}

function copiarMaquinas(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out = {};
  Object.keys(raw).forEach((id) => {
    if (!/^[a-z][a-z0-9]*$/i.test(id)) return;
    const m = raw[id];
    if (!m || typeof m !== "object") return;
    const nombre = String(m.nombre || "").trim().slice(0, 40);
    if (!nombre || esCargaAxial(nombre)) return;
    const item = { nombre };
    if (m.patron) item.patron = String(m.patron).trim().slice(0, 40);
    if (m.semilla === true) item.semilla = true;
    if (Number(m.incremento) > 0) item.incremento = Number(m.incremento);
    out[id] = item;
  });
  return Object.keys(out).length ? out : undefined;
}

/* Technogym en kg sube de 5. En libras, de 10. Lo demás en kg, de 5. */
export function incrementoDefault(marca, unidad) {
  if (unidad !== "kg") return 10;
  return 5;
}

/* El escalón más grande que parte todos los pesos. Null si no hay ninguno. */
export function inferirIncremento(pesos, unidad) {
  const vals = (pesos || []).map(Number).filter((w) => w > 0);
  if (!vals.length) return null;
  const pasos = unidad === "kg" ? [10, 5, 2.5, 1] : [20, 10, 5];
  for (let i = 0; i < pasos.length; i++) {
    const p = pasos[i];
    const cabe = vals.every((w) => {
      const cercano = Math.round(w / p) * p;
      return Math.abs(w - cercano) <= Math.max(0.2, p * 0.04);
    });
    if (cabe) return p;
  }
  return null;
}

export function normalizarGym(g) {
  const unidad = g && g.unidad === "kg" ? "kg" : "lb";
  const inc = Number(g && g.incremento);
  const lat = g && typeof g.lat === "number" && Number.isFinite(g.lat) ? g.lat : null;
  const lng = g && typeof g.lng === "number" && Number.isFinite(g.lng) ? g.lng : null;
  const nombre = String((g && g.nombre) || "").trim().slice(0, 40);
  const maquinas = copiarMaquinas(g && g.maquinas);
  const base = {
    id: g && g.id ? String(g.id) : HABITUAL_ID,
    nombre: nombre || "Gym",
    marca: String((g && g.marca) || "").trim().slice(0, 40),
    unidad,
    incremento: inc > 0 ? inc : incrementoDefault(g && g.marca, unidad),
    lat,
    lng,
  };
  if (maquinas) base.maquinas = maquinas;
  return base;
}

export function crearGym(input) {
  const base = normalizarGym(input || {});
  const id = "gym-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return { ...base, id };
}

export function etiquetaGym(g) {
  if (!g || g.id === HABITUAL_ID) return NOMBRE_EW;
  const u = g.unidad === "kg" ? "kg" : "lb";
  return (g.nombre || "Gym") + " · " + u;
}

function plano(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function textoNotas(sesion) {
  if (!sesion) return "";
  const parts = [];
  if (sesion.note) parts.push(sesion.note);
  const logs = sesion.logs || {};
  Object.keys(logs).forEach((k) => {
    const l = logs[k];
    if (l && typeof l === "object" && !Array.isArray(l) && l.note) parts.push(l.note);
  });
  return parts.join("\n");
}

export function es3Nov2026(sesion) {
  return String(sesion && sesion.date || "").startsWith("2026-11-03");
}

/* Technogym y kg, sin libras ni otra marca en la misma sesión. */
const MARCAS_CONOCIDAS = [
  ["technogym", "Technogym"],
  ["life fitness", "Life Fitness"],
  ["matrix", "Matrix"],
  ["hammer strength", "Hammer Strength"],
  ["hammer", "Hammer"],
  ["panatta", "Panatta"],
  ["precor", "Precor"],
  ["cybex", "Cybex"],
  ["nautilus", "Nautilus"],
];

/* Si el nombre de una foto dice la marca, se puede guardar. Nunca se pregunta. */
export function marcaDeTexto(texto) {
  const t = plano(String(texto || ""));
  for (let i = 0; i < MARCAS_CONOCIDAS.length; i++) {
    if (t.includes(MARCAS_CONOCIDAS[i][0])) return MARCAS_CONOCIDAS[i][1];
  }
  return "";
}

export function notasTechnogymKg(texto) {
  const t = plano(texto);
  const marca = /technogym/.test(t);
  const kg = /\bkg\b|\bkilos?\b/.test(t);
  const lb = /\blbs?\b|\blibras?\b/.test(t);
  const otra = /\b(matrix|life fitness|hammer|panatta|precor|cybex|nautilus)\b/.test(t);
  return marca && kg && !lb && !otra;
}

export function sesionTechnogymInequivoca(sesion) {
  if (!sesion || sesion.gymId) return false;
  if (!es3Nov2026(sesion)) return false;
  return notasTechnogymKg(textoNotas(sesion));
}

export function idTechnogymDe(gyms) {
  const lista = gyms || [];
  const fijo = lista.find((g) => g && g.id === TECHNOGYM_ID);
  if (fijo) return fijo.id;
  const marca = lista.find((g) => g && /technogym/i.test(g.marca || "") && g.unidad === "kg");
  if (marca) return marca.id;
  const nombre = lista.find((g) => g && /technogym/i.test(g.nombre || "") && g.unidad === "kg");
  if (nombre) return nombre.id;
  return TECHNOGYM_ID;
}

export function gymDeSesion(sesion, gyms) {
  if (!sesion) return HABITUAL_ID;
  if (sesion.gymId) return String(sesion.gymId);
  if (sesionTechnogymInequivoca(sesion)) return idTechnogymDe(gyms);
  return HABITUAL_ID;
}

export function gymDeSerie(set, sesion, gyms) {
  if (set && set.gymId) return String(set.gymId);
  return gymDeSesion(sesion, gyms);
}

export function asegurarGyms(gyms, hist) {
  const lista = (Array.isArray(gyms) ? gyms : []).map(normalizarGym);
  const iHab = lista.findIndex((g) => g.id === HABITUAL_ID);
  if (iHab < 0) lista.unshift(gymHabitual());
  else lista[iHab] = { ...gymHabitual(), ...lista[iHab], id: HABITUAL_ID, nombre: NOMBRE_EW };
  const hay = (hist || []).some(sesionTechnogymInequivoca);
  const idxNavy = lista.findIndex((g) => g.id === TECHNOGYM_ID);
  if (idxNavy >= 0 && (lista[idxNavy].nombre === "Technogym" || lista[idxNavy].nombre === "Gym")) {
    lista[idxNavy] = { ...lista[idxNavy], nombre: NOMBRE_NAVY, marca: lista[idxNavy].marca || "Technogym", unidad: "kg" };
  }
  if (hay && !lista.some((g) => g.id === idTechnogymDe(lista) && g.unidad === "kg" && /technogym/i.test((g.marca || "") + (g.nombre || "")))) {
    lista.push({ id: TECHNOGYM_ID, nombre: NOMBRE_NAVY, marca: "Technogym", unidad: "kg", incremento: 5, lat: null, lng: null });
  }
  return lista.map(sembrarMaquinaNavy);
}

function esGymNavy(g) {
  if (!g || g.id === HABITUAL_ID) return false;
  if (g.id === TECHNOGYM_ID) return true;
  return g.nombre === NOMBRE_NAVY;
}

/* Solo rellena a1 si Navy aún no tiene un nombre confirmado por él. */
function sembrarMaquinaNavy(g) {
  if (!esGymNavy(g) || esCargaAxial(MAQUINA_NAVY_A1)) return g;
  const prev = (g.maquinas && typeof g.maquinas === "object") ? g.maquinas : {};
  const cur = prev.a1;
  const nombre = cur && String(cur.nombre || "").trim();
  if (nombre && cur.semilla !== true) return g;
  if (cur && cur.semilla === true && nombre === MAQUINA_NAVY_A1 && cur.patron === "press horizontal") return g;
  return {
    ...g,
    maquinas: {
      ...prev,
      a1: { nombre: MAQUINA_NAVY_A1, patron: "press horizontal", semilla: true },
    },
  };
}

export function claveVariante(exId, v) {
  if (v === "alt") return exId + "~alt";
  if (String(v || "").startsWith("sub:")) return exId + "~" + v;
  return exId;
}

export function tieneHistorialEjercicio(hist, dayId, exId, v, gymId, gyms) {
  const vid = claveVariante(exId, v);
  const rows = hist || [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const s = rows[i];
    if (!s || s.day !== dayId) continue;
    if (gymDeSesion(s, gyms) !== gymId) continue;
    const l = s.logs && s.logs[exId];
    if (!l || Array.isArray(l)) continue;
    const lv = claveVariante(exId, l.v);
    if (lv !== vid) continue;
    const sets = l.sets || [];
    if (sets.some((x) => x && x.done && ((Number(x.w) || 0) > 0 || (Number(x.r) || 0) > 0))) return true;
  }
  return false;
}

export function usarHistorialPropio(hist, dayId, exId, v, gymId, gyms) {
  if (!gymId || gymId === HABITUAL_ID) return true;
  return tieneHistorialEjercicio(hist, dayId, exId, v, gymId, gyms);
}

export function aUnidad(w, desde, hacia) {
  const n = Number(w) || 0;
  if (desde === hacia) return n;
  if (desde === "lb" && hacia === "kg") return n * LB2KG;
  if (desde === "kg" && hacia === "lb") return n / LB2KG;
  return n;
}

function limpio(n) {
  return Math.round(n * 1000) / 1000;
}

/* El escalón de la pila que cae entre 60% y 70%, el más cercano al 65%.
   Si ninguno cabe, el mayor que no pasa de 70%. Nunca por encima. */
export function pasoEnBanda(valor, incremento, lo, hi) {
  const inc = incremento > 0 ? incremento : 1;
  const min = valor * lo;
  const max = valor * hi;
  const centro = valor * ((lo + hi) / 2);
  let mejor = null;
  let mejorDist = Infinity;
  const tope = Math.floor((max + 1e-6) / inc);
  for (let n = 0; n <= tope; n++) {
    const p = limpio(n * inc);
    if (p + 1e-6 < min) continue;
    if (p - 1e-6 > max) continue;
    const d = Math.abs(p - centro);
    if (d < mejorDist - 1e-6 || (Math.abs(d - mejorDist) <= 1e-6 && (mejor == null || p < mejor))) {
      mejor = p;
      mejorDist = d;
    }
  }
  if (mejor != null) return mejor;
  const n = Math.floor((max + 1e-6) / inc);
  return limpio(Math.max(0, n * inc));
}

export function redondearArriba(valor, incremento) {
  const inc = incremento > 0 ? incremento : 1;
  return limpio(Math.ceil((Number(valor) - 1e-6) / inc) * inc);
}

export function pesoSugerido(ref, unidadRef, gym, tipo) {
  const base = Number(ref);
  if (!(base > 0) || !gym) return null;
  const desde = unidadRef === "kg" ? "kg" : "lb";
  const hacia = gym.unidad === "kg" ? "kg" : "lb";
  const inc = Number(gym.incremento) > 0 ? Number(gym.incremento) : 5;
  const refGym = aUnidad(base, desde, hacia);
  const assist = tipo === "assist";
  const pesoGym = assist ? redondearArriba(refGym, inc) : pasoEnBanda(refGym, inc, 0.6, 0.7);
  const pct = !assist && refGym > 0 ? pesoGym / refGym : null;
  return {
    peso: aUnidad(pesoGym, hacia, desde),
    pesoGym,
    unidad: hacia,
    pct,
    ref: base,
    unidadRef: desde,
    incremento: inc,
    tipo: tipo || "weight",
  };
}

export function textoSugerencia(s, nombreOrigen) {
  if (!s) return "";
  const peso = formatoNum(s.pesoGym);
  const u = s.unidad === "kg" ? "kg" : "lb";
  const ref = formatoNum(s.ref);
  const ru = s.unidadRef === "kg" ? "kg" : "lb";
  const donde = nombreOrigen || NOMBRE_EW;
  if (s.tipo === "assist" || s.pct == null) {
    return "Sugerencia: " + peso + " " + u + " de ayuda (de tu último peso en " + donde + ": " + ref + " " + ru + "). Ajústalo.";
  }
  const pct = Math.round(s.pct * 100);
  return "Sugerencia: empieza en " + peso + " " + u + " (≈ " + pct + "% de tu último peso en " + donde + ", " + ref + " " + ru + "). Ajústalo.";
}

export function textoSugerenciaCorto(s) {
  if (!s) return "";
  const u = s.unidad === "kg" ? "kg" : "lb";
  if (s.tipo === "assist" || s.pct == null) return "Sugerencia " + formatoNum(s.pesoGym) + " " + u + " de ayuda";
  return "Sugerencia " + formatoNum(s.pesoGym) + " " + u;
}

export function seriesSugeridas(prevSets, nSets, peso, repsFallback) {
  const base = prevSets && prevSets.length ? prevSets : [[peso, repsFallback || 8]];
  const n = nSets || base.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const src = base[Math.min(i, base.length - 1)];
    const r = Array.isArray(src) ? src[1] : src.r;
    out.push({ w: peso, r: Number(r) || repsFallback || 8 });
  }
  return out;
}

export function armarSugerencia({ prevSets, tipo, unidad, gym, nombreOrigen, nSets }) {
  if (!gym || gym.id === HABITUAL_ID) return null;
  if (tipo === "body" || tipo === "time") return null;
  const pesos = (prevSets || []).map((s) => (Array.isArray(s) ? Number(s[0]) : Number(s.w))).filter((w) => w > 0);
  if (!pesos.length) return null;
  const ref = Math.max(...pesos);
  const calc = pesoSugerido(ref, unidad, gym, tipo);
  if (!calc) return null;
  const reps0 = prevSets && prevSets.length ? (Array.isArray(prevSets[0]) ? prevSets[0][1] : prevSets[0].r) : 8;
  const sets = seriesSugeridas(prevSets, nSets, calc.peso, reps0);
  return { ...calc, sets, texto: textoSugerencia(calc, nombreOrigen), corto: textoSugerenciaCorto(calc) };
}

export function pasoNativo(gym, ex) {
  const nativo = ex && ex.u === "kg" ? "kg" : "lb";
  const propio = ex && ex.step > 0 ? ex.step : 5;
  if (!gym || gym.id === HABITUAL_ID) return propio;
  const maq = gym.maquinas && ex && gym.maquinas[ex.id];
  const deMaquina = maq && Number(maq.incremento);
  const inc = deMaquina > 0 ? deMaquina : (Number(gym.incremento) > 0 ? Number(gym.incremento) : incrementoDefault(gym.marca, gym.unidad));
  const unidad = gym.unidad === "kg" ? "kg" : "lb";
  if (unidad === nativo) return inc;
  return unidad === "kg" ? inc / LB2KG : inc * LB2KG;
}

const AXIAL = /sentadilla|peso muerto|deadlift|good morning|press militar|military press|barbell squat|overhead press/i;

export function esCargaAxial(nombre) {
  return AXIAL.test(String(nombre || ""));
}

function comoLog(l) {
  if (Array.isArray(l)) return { v: "main", sets: l, note: "" };
  return l && typeof l === "object" ? l : { v: "main", sets: [], note: "" };
}

export function sellarLogs(logs, gymId) {
  const id = gymId || HABITUAL_ID;
  const out = {};
  Object.keys(logs || {}).forEach((k) => {
    if (k === "_extras") {
      out[k] = (logs[k] || []).map((it) => ({
        ...it,
        gymId: id,
        sets: (it.sets || []).map((s) => (s ? { ...s, gymId: id } : s)),
      }));
      return;
    }
    const n = comoLog(logs[k]);
    out[k] = { ...n, gymId: id, sets: (n.sets || []).map((s) => (s ? { ...s, gymId: id } : s)) };
  });
  return out;
}

export function sellarSesion(sesion, gymId) {
  const id = gymId || HABITUAL_ID;
  return { ...(sesion || {}), gymId: id, logs: sellarLogs(sesion && sesion.logs, id) };
}

export function distanciaMetros(a, b) {
  if (!a || !b || typeof a.lat !== "number" || typeof b.lat !== "number") return Infinity;
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function gymMasCercano(gyms, punto, maxMetros) {
  if (!punto || typeof punto.lat !== "number" || typeof punto.lng !== "number") return null;
  const tope = maxMetros > 0 ? maxMetros : CERCA_M;
  let mejor = null;
  (gyms || []).forEach((g) => {
    if (!g || typeof g.lat !== "number" || typeof g.lng !== "number") return;
    const metros = distanciaMetros(punto, g);
    if (metros > tope) return;
    if (!mejor || metros < mejor.metros) mejor = { gym: g, metros };
  });
  return mejor;
}

/* Propone. No selecciona. Si ya es el gym activo, no insiste. */
export function proponerGym(gyms, punto, seleccionadoId, maxMetros) {
  const cerca = gymMasCercano(gyms, punto, maxMetros);
  if (!cerca) return null;
  if (cerca.gym.id === seleccionadoId) return null;
  return { gymId: cerca.gym.id, nombre: cerca.gym.nombre, metros: Math.round(cerca.metros) };
}

export function permisoUbicacion(nav) {
  const n = nav || (typeof navigator !== "undefined" ? navigator : null);
  return new Promise((resolve) => {
    if (!n || !n.geolocation) { resolve("denied"); return; }
    const q = n.permissions && n.permissions.query;
    if (!q) { resolve("prompt"); return; }
    Promise.resolve(q.call(n.permissions, { name: "geolocation" }))
      .then((p) => resolve((p && p.state) || "prompt"))
      .catch(() => resolve("prompt"));
  });
}

export function leerUbicacion(nav) {
  const n = nav || (typeof navigator !== "undefined" ? navigator : null);
  return new Promise((resolve) => {
    const geo = n && n.geolocation;
    if (!geo || !geo.getCurrentPosition) { resolve(null); return; }
    geo.getCurrentPosition(
      (pos) => {
        const c = pos && pos.coords;
        if (!c || typeof c.latitude !== "number") { resolve(null); return; }
        resolve({ lat: c.latitude, lng: c.longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 },
    );
  });
}
