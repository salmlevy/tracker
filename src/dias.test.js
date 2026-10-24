import assert from "node:assert/strict";
import {
  clampLocal, daysSince, diaCorto, editarFecha, hechaEtiqueta, instanteLocal, localInputValue,
  selloDe, textoDias, textoHaceCorto,
} from "./dias.js";

const MX = "America/Mexico_City";
/* vie 23 oct 2026 18:05 CDMX = sáb 24 00:05 UTC. sáb 24 10:00 CDMX = 16:00 UTC. */
const VIE_1805 = "2026-10-24T00:05:00.000Z";
const SAB_1000 = new Date("2026-10-24T16:00:00.000Z");

assert.equal(daysSince(VIE_1805, SAB_1000, MX), 1);
assert.equal(Math.floor((SAB_1000.getTime() - new Date(VIE_1805).getTime()) / 86400000), 0);
assert.equal(daysSince("2026-10-23T18:05:00", SAB_1000, MX), 1);
assert.equal(textoDias(daysSince(VIE_1805, SAB_1000, MX)), "última vez hace 1 día");

const vieNoche = new Date("2026-10-24T02:30:00.000Z");
assert.equal(daysSince("2026-10-23T18:05:00", vieNoche, MX), 0);
assert.equal(textoDias(0), "entrenado hoy");
assert.equal(textoHaceCorto(0), "hoy");
assert.equal(textoHaceCorto(3), "hace 3 d");
assert.equal(daysSince("", SAB_1000, MX), null);

assert.equal(diaCorto("2026-10-23"), "vie");
assert.equal(diaCorto("2026-10-24"), "sáb");

assert.equal(instanteLocal("2026-10-23T18:05", MX), "2026-10-24T00:05:00.000Z");
assert.equal(localInputValue(SAB_1000, MX), "2026-10-24T10:00");
assert.equal(clampLocal("2026-10-25T09:00", SAB_1000, MX), "2026-10-24T10:00");
assert.equal(clampLocal("2026-10-23T18:05", SAB_1000, MX), "2026-10-23T18:05");

const sello = selloDe("2026-10-23T18:05", SAB_1000, MX);
assert.equal(sello.date, "2026-10-23");
assert.equal(sello.savedAt, "2026-10-24T00:05:00.000Z");
assert.equal(hechaEtiqueta("2026-10-24T10:00", SAB_1000, MX), "Hecha: hoy 10:00");
assert.equal(hechaEtiqueta("2026-10-23T18:05", SAB_1000, MX), "Hecha: vie 23 18:05");
assert.equal(hechaEtiqueta("2026-12-01T08:00", SAB_1000, MX), "Hecha: hoy 10:00");

const sesion = {
  date: "2026-10-24T00:05:00.000Z",
  savedAt: "2026-10-24T00:05:00.000Z",
  day: "A",
  logs: { a1: { sets: [{ done: true }] } },
  note: "bien",
};
const editada = editarFecha(sesion, "2026-10-22", SAB_1000, MX);
assert.equal(editada.date, "2026-10-22");
assert.equal(editada.savedAt, sesion.savedAt);
assert.equal(editada.note, "bien");
assert.equal(editada.day, "A");
assert.deepEqual(editada.logs, sesion.logs);
assert.equal(editada.fechaEditada.antes, sesion.date);
assert.equal(editada.fechaEditada.cuando, SAB_1000.toISOString());
assert.equal(editarFecha(sesion, "2026-10-23", SAB_1000, MX), sesion);
assert.equal(editarFecha(sesion, "2026-10-25", SAB_1000, MX), sesion);
assert.equal(daysSince(editada.date, SAB_1000, MX), 2);

console.log("dias.test.js ok");
