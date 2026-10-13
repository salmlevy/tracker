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

export function runExtra(r) {
  if (!r || typeof r !== "object") return { tipo: "", nota: "" };
  return {
    tipo: typeof r.tipo === "string" ? r.tipo.trim() : "",
    nota: typeof r.nota === "string" ? r.nota.trim() : "",
  };
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

/* JPEG máx. 1600 px. Un PDF se sube tal cual. Si el iPhone no deja comprimir, se manda el archivo. */
export async function prepareUpload(file) {
  if (!file) throw new Error("vacio");
  const type = file.type || "";
  const pdf = type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (pdf) {
    if (file.size > 12 * 1024 * 1024) throw new Error("grande");
    return { blob: file, mime: "application/pdf", ext: "pdf" };
  }
  const image = type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name || "");
  if (!image) throw new Error("tipo");
  try {
    const img = await loadImage(file);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
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
  } catch (err) {
    if (type.startsWith("image/") && file.size <= 8 * 1024 * 1024) {
      const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "jpg";
      return { blob: file, mime: type, ext };
    }
    throw err;
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
