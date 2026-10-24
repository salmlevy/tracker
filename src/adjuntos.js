/* Fotos y PDF de las notas. El archivo vive en el bucket privado notas-adjuntos.
   En estado.datos solo queda la referencia { path, mime, name }. */

const BUCKET = "notas-adjuntos";

export function localDayKey(date) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function adjuntoPath(date, id, ext) {
  const d = String(date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error("fecha");
  const clean = String(id || "").replace(/[^a-zA-Z0-9-]/g, "");
  if (clean.length < 8) throw new Error("id");
  const e = String(ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return "simon/" + d + "/" + clean + "." + e;
}

export function adjuntoEventProps(ambito, mime, ex) {
  const props = {
    ambito: ambito === "running" ? "running" : "gym",
    clase: mime === "application/pdf" ? "pdf" : "imagen",
  };
  if (ex) props.ex = String(ex);
  return props;
}

export function attachKind(file) {
  if (!file) return "";
  const type = String(file.type || "");
  const name = String(file.name || "");
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name)) return "image";
  /* El pegado del iPhone a veces deja el archivo como "image" sin tipo. */
  if (!type && /^image$/i.test(name)) return "image";
  return "";
}

export function filesFromClipboard(data) {
  if (!data) return [];
  const found = [];
  const keyOf = (file) => [file.name, file.size, file.type, file.lastModified].join("|");
  const push = (file) => {
    if (!file || !attachKind(file)) return;
    const key = keyOf(file);
    if (found.some((f) => keyOf(f) === key)) return;
    found.push(file);
  };
  const items = data.items ? Array.from(data.items) : [];
  items.forEach((item) => {
    if (item && item.kind === "file" && typeof item.getAsFile === "function") push(item.getAsFile());
  });
  const files = data.files ? Array.from(data.files) : [];
  files.forEach(push);
  return found;
}

export function imageMeta(type, name) {
  const t = String(type || "");
  const n = String(name || "");
  if (t === "image/png" || /\.png$/i.test(n)) return { mime: "image/png", ext: "png" };
  if (t === "image/webp" || /\.webp$/i.test(n)) return { mime: "image/webp", ext: "webp" };
  if (t === "image/gif" || /\.gif$/i.test(n)) return { mime: "image/gif", ext: "gif" };
  if (t === "image/heic" || /\.heic$/i.test(n)) return { mime: "image/heic", ext: "heic" };
  if (t === "image/heif" || /\.heif$/i.test(n)) return { mime: "image/heif", ext: "heif" };
  return { mime: t.startsWith("image/") ? t : "image/jpeg", ext: "jpg" };
}

const MAX_IMAGE = 14 * 1024 * 1024;

/* Si el canvas no puede leer la foto (HEIC en algunos navegadores), se sube el archivo. */
export function originalImage(file) {
  if (!file || file.size > MAX_IMAGE) throw new Error("grande");
  const meta = imageMeta(file.type, file.name);
  return { blob: file, mime: meta.mime, ext: meta.ext };
}

export function uploadErrorText(err) {
  const code = err && err.message;
  if (code === "grande") return "Esa foto pesa demasiado.";
  if (code === "tipo") return "Solo fotos o PDF.";
  if (code === "sin nube") return "No hay conexión con la nube.";
  if (code === "subida") return "No se pudo subir. Intenta de nuevo.";
  return "No se pudo subir.";
}

export function runExtra(r) {
  if (!r || typeof r !== "object") return { tipo: "", nota: "" };
  return {
    tipo: typeof r.tipo === "string" ? r.tipo.trim() : "",
    nota: typeof r.nota === "string" ? r.nota.trim() : "",
  };
}

/* Tipo de la corrida en palabras. El slot de la semana gana; si no hay, vale tipo (suave). */
export function runTypeWord(run, slot) {
  if (slot === "res") return "Resistencia";
  if (slot === "pot") return "Potencia";
  if (slot === "lar") return "Largo";
  if (slot === "lib") return "Libre";
  const tipo = run && typeof run.tipo === "string" ? run.tipo.trim().toLowerCase() : "";
  if (tipo === "suave") return "Suave";
  if (tipo === "res" || tipo === "resistencia") return "Resistencia";
  if (tipo === "pot" || tipo === "potencia") return "Potencia";
  if (tipo === "lar" || tipo === "largo") return "Largo";
  if (tipo === "lib" || tipo === "libre") return "Libre";
  if (!tipo) return "";
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

export function runFacts(run) {
  if (!run) return "";
  const km = Number(run.km);
  const min = Number(run.min);
  const pace = typeof run.pace === "string" ? run.pace.trim() : "";
  const parts = [];
  if (km > 0) parts.push((Math.round(km * 100) / 100) + " km");
  if (min > 0) parts.push(Math.round(min) + " min");
  if (pace && pace !== "–" && pace.toLowerCase() !== "null") parts.push(pace + "/km");
  return parts.join(" · ");
}

export function runHasMark(run) {
  if (!run) return false;
  if (typeof run.nota === "string" && run.nota.trim()) return true;
  return Array.isArray(run.adjuntos) && run.adjuntos.length > 0;
}

export function signedObjectUrl(base, signedPath) {
  if (!signedPath) return "";
  if (/^https?:/i.test(signedPath)) return signedPath;
  const root = String(base || "").replace(/\/$/, "");
  const path = signedPath.startsWith("/") ? signedPath : "/" + signedPath;
  return root + "/storage/v1" + path;
}

function storageEnv() {
  let url = "";
  let key = "";
  try {
    url = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    key = import.meta.env.VITE_SUPABASE_KEY || "";
  } catch {
    url = "";
    key = "";
  }
  return { url, key };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagen"));
    };
    img.src = url;
  });
}

/* JPEG máx. 1600 px. Un PDF se sube tal cual. HEIC que el canvas no lee se sube igual. */
export async function prepareUpload(file) {
  if (!file) throw new Error("vacio");
  const kind = attachKind(file);
  if (kind === "pdf") {
    if (file.size > 12 * 1024 * 1024) throw new Error("grande");
    return { blob: file, mime: "application/pdf", ext: "pdf" };
  }
  if (kind !== "image") throw new Error("tipo");
  try {
    const img = await loadImage(file);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    if (!w0 || !h0) throw new Error("imagen");
    const scale = Math.min(1, 1600 / Math.max(w0, h0, 1));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
    if (!blob) throw new Error("canvas");
    return { blob, mime: "image/jpeg", ext: "jpg" };
  } catch {
    return originalImage(file);
  }
}

export async function uploadAdjunto(prepared, name) {
  const { url, key } = storageEnv();
  if (!url || !key) throw new Error("sin nube");
  const id = globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(16) + Math.random().toString(16).slice(2);
  const path = adjuntoPath(localDayKey(new Date()), id, prepared.ext);
  const res = await fetch(url + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": prepared.mime,
      "x-upsert": "false",
    },
    body: prepared.blob,
    signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined,
  });
  if (!res.ok) throw new Error("subida");
  return {
    path,
    mime: prepared.mime,
    name: String(name || "").replace(/[\r\n]/g, " ").trim().slice(0, 80),
  };
}

export async function signAdjunto(path) {
  const { url, key } = storageEnv();
  if (!url || !key || !path || String(path).indexOf("simon/") !== 0) throw new Error("ruta");
  const res = await fetch(url + "/storage/v1/object/sign/" + BUCKET + "/" + path, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 21600 }),
  });
  if (!res.ok) throw new Error("firma");
  const data = await res.json();
  return signedObjectUrl(url, data.signedURL || data.signedUrl || "");
}
