import assert from "node:assert/strict";
import { adjuntoEventProps, adjuntoPath, runExtra, signedObjectUrl } from "./adjuntos.js";

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

assert.equal(
  signedObjectUrl("https://x.supabase.co", "/object/sign/notas-adjuntos/simon/a.jpg?token=t"),
  "https://x.supabase.co/storage/v1/object/sign/notas-adjuntos/simon/a.jpg?token=t",
);
assert.equal(signedObjectUrl("https://x.supabase.co", "https://cdn.example/a"), "https://cdn.example/a");

console.log("adjuntos.test.js ok");
