import assert from "node:assert/strict";
import {
  adjuntoEventProps, adjuntoPath, attachKind, filesFromClipboard, imageMeta,
  originalImage, prepareUpload, runExtra, runFacts, runHasMark, runTypeWord,
  signedObjectUrl, uploadErrorText,
} from "./adjuntos.js";

const path = adjuntoPath("2026-10-13", "6f1e2d3c-4b5a-6789-abcd-ef0123456789", "jpg");
assert.equal(path, "simon/2026-10-13/6f1e2d3c-4b5a-6789-abcd-ef0123456789.jpg");
assert.equal(path.startsWith("simon/"), true);
assert.throws(() => adjuntoPath("13-10-2026", "6f1e2d3c-4b5a-6789-abcd-ef0123456789", "jpg"));
assert.throws(() => adjuntoPath("2026-10-13", "../secreto", "jpg"));

const img = adjuntoEventProps("gym", "image/jpeg", "c4");
assert.deepEqual(img, { ambito: "gym", clase: "imagen", ex: "c4" });
assert.equal("path" in img, false);
assert.equal("name" in img, false);
assert.equal("nota" in img, false);
const pdf = adjuntoEventProps("running", "application/pdf");
assert.deepEqual(pdf, { ambito: "running", clase: "pdf" });

const run = runExtra({ id: "m1", date: "2026-10-12", tipo: "suave", nota: "  salida corta  ", km: 3.2, min: 21 });
assert.deepEqual(run, { tipo: "suave", nota: "salida corta" });
assert.deepEqual(runExtra({}), { tipo: "", nota: "" });
assert.deepEqual(runExtra(null), { tipo: "", nota: "" });

assert.equal(runTypeWord({ tipo: "suave" }, "res"), "Resistencia");
assert.equal(runTypeWord({ tipo: "suave" }, ""), "Suave");
assert.equal(runTypeWord({}, "pot"), "Potencia");
assert.equal(runTypeWord({}, "lar"), "Largo");
assert.equal(runTypeWord({}, ""), "");
const today = { id: "m1791860011652", date: "2026-10-12", km: 3.2, min: 21, pace: "6:34", tipo: "suave", nota: "salida", re: 12 };
assert.equal(runFacts(today), "3.2 km · 21 min · 6:34/km");
assert.equal(runFacts({ km: 0, min: 0, pace: null }), "");
assert.equal(runFacts({ km: 0, min: null, pace: "null" }), "");
assert.equal(runFacts({ km: 0, min: 100, pace: null }), "100 min");
assert.equal(runHasMark(today), true);
assert.equal(runHasMark({ min: 30 }), false);
assert.equal(runHasMark({ adjuntos: [{ path: "simon/a.jpg" }] }), true);
const ids = ["m1", "m1", "m2"].filter((id, i, all) => all.indexOf(id) === i);
assert.deepEqual(ids, ["m1", "m2"]);

assert.equal(
  signedObjectUrl("https://x.supabase.co", "/object/sign/notas-adjuntos/simon/a.jpg?token=t"),
  "https://x.supabase.co/storage/v1/object/sign/notas-adjuntos/simon/a.jpg?token=t",
);
assert.equal(signedObjectUrl("https://x.supabase.co", "https://cdn.example/a"), "https://cdn.example/a");

assert.equal(attachKind({ type: "image/heic", name: "IMG_0001.HEIC", size: 10 }), "image");
assert.equal(attachKind({ type: "", name: "image", size: 10 }), "image");
assert.equal(attachKind({ type: "", name: "nota.PDF", size: 10 }), "pdf");
assert.equal(attachKind({ type: "text/plain", name: "a.txt", size: 10 }), "");
assert.deepEqual(imageMeta("image/heic", "IMG.HEIC"), { mime: "image/heic", ext: "heic" });
const heic = { type: "image/heic", name: "IMG_0001.HEIC", size: 1200 };
assert.deepEqual(
  { mime: originalImage(heic).mime, ext: originalImage(heic).ext },
  { mime: "image/heic", ext: "heic" },
);
assert.throws(() => originalImage({ type: "image/heic", name: "big.HEIC", size: 15 * 1024 * 1024 }));
const pasted = { name: "image", type: "", size: 40, lastModified: 1 };
assert.equal(filesFromClipboard({
  items: [{ kind: "file", getAsFile: () => pasted }],
  files: [pasted],
}).length, 1);
assert.equal(filesFromClipboard({ items: [], files: [{ name: "a.txt", type: "text/plain", size: 1, lastModified: 1 }] }).length, 0);
assert.equal(uploadErrorText(new Error("sin nube")), "No hay conexión con la nube.");
const heicFile = { type: "image/heic", name: "IMG_0001.HEIC", size: 80 };
const prepared = await prepareUpload(heicFile);
assert.equal(prepared.mime, "image/heic");
assert.equal(prepared.ext, "heic");
assert.equal(prepared.blob, heicFile);

console.log("adjuntos.test.js ok");
