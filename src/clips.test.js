import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { CIERRE_CLIPS, CLIPS, CLIPS_CDN, cierrePreviewEx, previewSrc } from "./clips.js";
import { CIERRE } from "./cierre.js";
import { rehabEx } from "./hombro.js";
import { youtubeHref } from "./exTools.js";

const YT = /^https:\/\/(?:www\.youtube\.com\/|youtu\.be\/)/;
const axial = /sentadilla con barra|peso muerto|deadlift|barbell squat|good morning/i;

function checkEx(ex) {
  assert.ok(ex.alt && ex.alt.n, ex.id + " sin sustituto");
  assert.ok(CLIPS[ex.id], ex.id + " sin gif");
  assert.ok(CLIPS[ex.id + "~alt"], ex.id + " variante sin gif");
  const main = previewSrc(ex, "main");
  const alt = previewSrc(ex, "alt");
  assert.ok(main && (main.startsWith("http") || main.startsWith("/")), ex.id + " gif");
  assert.ok(alt && (alt.startsWith("http") || alt.startsWith("/")), ex.id + " gif variante");
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

assert.ok(CLIPS.h1);
assert.ok(CLIPS["h1~alt"]);
assert.ok(CLIPS.h3);
assert.ok(CLIPS["h3~alt"]);
assert.ok(CLIPS.h4.includes("dumbbell-side-lying-one-hand-raise"), CLIPS.h4);
assert.equal(CLIPS.h4.includes("cable-one-arm-lateral-raise"), false);
assert.ok(CLIPS["h4~alt"].includes("cable-one-arm-lateral-raise"));
assert.notEqual(CLIPS.h4, CLIPS.h3);
assert.notEqual(CLIPS.h4, CLIPS["h3~alt"]);
assert.ok(CLIPS.b10r.includes("assisted-parallel-close-grip-pull-up"));
assert.ok(CLIPS["b10r~alt"].includes("pulldown"));

assert.equal(CIERRE.length, 10);
for (const ex of CIERRE) {
  const src = previewSrc(cierrePreviewEx(ex.id), "main");
  assert.equal(src, CLIPS_CDN + CIERRE_CLIPS[ex.id], ex.id);
  assert.match(src, /\.gif$/);
  assert.equal(src.includes("twist"), false, ex.id);
}

console.log("clips ok");
