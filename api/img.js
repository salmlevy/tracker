// Busca una foto de referencia libre para un ejercicio. Sin llaves ni cuentas.
// Corre en el servidor para evitar bloqueos de CORS del navegador.
const CACHE = new Map();

async function openverse(q) {
  const u = "https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) +
            "&license_type=all-cc&size=medium&mature=false&page_size=6";
  const r = await fetch(u, { headers: { "User-Agent": "tracker-entrenamiento/1.0" } });
  if (!r.ok) return null;
  const d = await r.json();
  const hit = (d.results || []).find((x) => x.url);
  return hit ? { url: hit.url, autor: hit.creator || "", fuente: "Openverse", licencia: hit.license || "" } : null;
}

async function wikimedia(q) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
            "&gsrsearch=" + encodeURIComponent(q + " exercise") +
            "&gsrlimit=6&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*";
  const r = await fetch(u);
  if (!r.ok) return null;
  const d = await r.json();
  const pages = (d.query && d.query.pages) || {};
  for (const k in pages) {
    const ii = pages[k].imageinfo && pages[k].imageinfo[0];
    if (ii && ii.thumburl) return { url: ii.thumburl, autor: "", fuente: "Wikimedia Commons", licencia: "CC" };
  }
  return null;
}

export default async function handler(req, res) {
  const q = (req.query && req.query.q) || "";
  if (!q) return res.status(400).json({ error: "falta q" });
  const key = q.toLowerCase();
  if (CACHE.has(key)) return res.status(200).json(CACHE.get(key));
  try {
    const out = (await openverse(q)) || (await wikimedia(q));
    if (!out) return res.status(200).json({ url: null });
    CACHE.set(key, out);
    res.setHeader("Cache-Control", "public, max-age=604800");
    return res.status(200).json(out);
  } catch (e) {
    return res.status(200).json({ url: null, error: String(e) });
  }
}
