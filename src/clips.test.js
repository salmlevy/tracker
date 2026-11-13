import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { CIERRE_CLIPS, CLIPS, CLIPS_CDN, CLIP_POLEA, cierrePreviewEx, esMaquinaPolea, previewSrc } from "./clips.js";
import { CIERRE } from "./cierre.js";
import { rehabEx } from "./hombro.js";
import { youtubeHref } from "./exTools.js";

const YT = /^https:\/\/(?:www\.youtube\.com\/|youtu\.be\/)/;
const axial = /sentadilla con barra|peso muerto|deadlift|barbell squat|good morning/i;

function propio(texto) {
  return (texto || []).join("\n");
}

const SIN_GIF = new Set(["h4", "h5", "a12r"]);
const SIN_GIF_ALT = new Set(["h4"]);

function checkEx(ex) {
  assert.ok(ex.alt && ex.alt.n, ex.id + " sin sustituto");
  if (SIN_GIF.has(ex.id)) {
    assert.equal(CLIPS[ex.id], undefined, ex.id + " sigue con un gif que no es el gesto");
    assert.ok(ex.yt || ex.ref, ex.id + " sin gif y sin referencia");
  } else {
    assert.ok(CLIPS[ex.id], ex.id + " sin gif");
  }
  if (SIN_GIF_ALT.has(ex.id)) {
    assert.equal(CLIPS[ex.id + "~alt"], undefined, ex.id + " la variante muestra otro gesto");
  } else {
    assert.ok(CLIPS[ex.id + "~alt"], ex.id + " variante sin gif");
    if (CLIPS[ex.id]) assert.notEqual(CLIPS[ex.id + "~alt"], CLIPS[ex.id], ex.id + " el gif del ⇄ es el del original");
  }
  assert.ok(ex.alt.cues && ex.alt.cues.length >= 2, ex.id + " sin instrucciones del ⇄");
  assert.notEqual(propio(ex.alt.cues), propio(ex.cues), ex.id + " las instrucciones del ⇄ son las del original");
  const optGifs = [];
  for (const o of ex.opts || []) {
    const key = ex.id + "~" + o.id;
    assert.ok(CLIPS[key], ex.id + " variante " + o.id + " sin gif");
    assert.ok(o.cues && o.cues.length >= 2, ex.id + " variante " + o.id + " sin instrucciones");
    assert.notEqual(propio(o.cues), propio(ex.cues), ex.id + " " + o.id + " copia las instrucciones del original");
    const src = previewSrc(ex, "main", o.id);
    assert.ok(src && src.includes(CLIPS[key].replace(/^\//, "")), ex.id + " " + o.id + " no muestra su gif");
    optGifs.push(CLIPS[key]);
  }
  assert.equal(new Set(optGifs).size, optGifs.length, ex.id + " dos variantes comparten gif");
  const main = previewSrc(ex, "main");
  const alt = previewSrc(ex, "alt");
  if (CLIPS[ex.id]) assert.ok(main && (main.startsWith("http") || main.startsWith("/")), ex.id + " gif");
  else assert.equal(main, null, ex.id + " no debía mostrar gif");
  if (CLIPS[ex.id + "~alt"]) assert.ok(alt && (alt.startsWith("http") || alt.startsWith("/")), ex.id + " gif variante");
  else assert.equal(alt, null, ex.id + " la variante no debía mostrar gif");
  if (main && alt) assert.notEqual(alt, main, ex.id + " preview del ⇄ igual al original");
  const href = youtubeHref(ex.n, ex.yt);
  const altHref = youtubeHref(ex.alt.n, ex.alt.yt);
  assert.match(href, YT, ex.id);
  assert.match(altHref, YT, ex.id + " alt");
  if (ex.yt) assert.equal(href, ex.yt.trim());
  else assert.equal(href, "https://www.youtube.com/results?search_query=" + encodeURIComponent(ex.n));
  if (ex.alt.yt) assert.equal(altHref, ex.alt.yt.trim());
  else assert.equal(altHref, "https://www.youtube.com/results?search_query=" + encodeURIComponent(ex.alt.n));
  assert.equal(axial.test(ex.n + " " + ex.alt.n), false, ex.id);
}

for (const day of Object.values(DAYS)) {
  for (const ex of day.ex) checkEx(ex);
}
for (const ex of Object.values(rehabEx())) checkEx(ex);

assert.ok(CLIPS.h1.includes("dumbbell-lying-external-shoulder-rotation"));
assert.ok(CLIPS["h1~alt"].includes("cable-standing-shoulder-external-rotation"));
assert.ok(CLIPS["h2~alt"].includes("cable-seated-shoulder-internal-rotation"));
assert.notEqual(CLIPS.h2, CLIPS["h2~alt"]);
assert.ok(CLIPS.a13r.includes("lever-lateral-raise"));
assert.ok(CLIPS["a13r~alt"].includes("cable-lateral-raise"));
assert.notEqual(CLIPS.a13r, CLIPS.h3);
assert.notEqual(CLIPS.a13r, CLIPS.h4);
assert.ok(CLIPS.h3);
assert.ok(CLIPS["h3~alt"]);
assert.equal(CLIPS.h4, undefined);
assert.equal(CLIPS.h5, undefined);
assert.equal(CLIPS.a12r, undefined);
assert.equal(previewSrc({ id: "h4" }, "main"), null);
assert.equal(previewSrc({ id: "h4", alt: { n: "polea" } }, "alt"), null);
assert.equal(previewSrc({ id: "h5" }, "main"), null);
assert.ok(CLIPS["h5~alt"].includes("band-standing-rear-delt-row"));
assert.ok(CLIPS["a12r~alt"].includes("band-standing-rear-delt-row"));
assert.equal(String(CLIPS.h4 || "").includes("dumbbell-side-lying-one-hand-raise"), false);
assert.equal(String(CLIPS.h5 || "").includes("cable-rear-delt-row-with-rope"), false);
assert.notEqual(CLIPS.h3, undefined);
assert.equal(esMaquinaPolea("poleas"), true);
assert.equal(esMaquinaPolea("Press en poleas"), true);
assert.equal(esMaquinaPolea("Chest Press TRUE"), false);
const a1 = DAYS.A.ex.find((e) => e.id === "a1");
assert.ok(previewSrc(a1, "main").includes("lever-chest-press"));
assert.ok(previewSrc(a1, "main", null, "poleas").includes(CLIP_POLEA.a1));
assert.ok(previewSrc(a1, "main", null, "Press en poleas").includes("cable-seated-chest-press"));
assert.ok(previewSrc(a1, "alt", null, "poleas").includes("dumbbell-bench-press"));
const a8 = DAYS.A.ex.find((e) => e.id === "a8");
assert.equal(a8.lbl, "total, 2 mancuernas");
assert.equal(/mano/.test(a8.lbl), false);
assert.equal(a8.prev[0][0], 60);
assert.ok(a8.cues[0].includes("total de las dos mancuernas"));
assert.ok(CLIPS.b10r.includes("assisted-parallel-close-grip-pull-up"));
assert.ok(CLIPS["b10r~alt"].includes("band-assisted-pull-up"));

assert.equal(CIERRE.length, 10);
for (const ex of CIERRE) {
  const src = previewSrc(cierrePreviewEx(ex.id), "main");
  assert.equal(src, CLIPS_CDN + CIERRE_CLIPS[ex.id], ex.id);
  assert.match(src, /\.gif$/);
  assert.equal(src.includes("twist"), false, ex.id);
}

console.log("clips ok");
