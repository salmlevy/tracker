import assert from "node:assert/strict";
import { esRegreso, faltasEntre, lineaSinCulpa, regresoStats, sesionesReales, textoRegreso } from "./regreso.js";
import { fmtSet, marcaReciente, sessionWins, winMarca } from "./wins.js";

const TZ = "America/Mexico_City";
const g = (date, day) => ({ date, day, logs: { a1: { v: "main", sets: [{ w: 100, r: 8, done: true }] } } });

/* lun 19 corre, mar 20 gym; mié 21 y jue 22 sin nada */
const hist = [g("2026-10-20T14:10:20.392Z", "C"), { date: "2026-10-18T10:00:00Z", day: "A", logs: {} }];
const runs = [{ id: "r1", date: "2026-10-19", min: 45 }, { id: "r0", date: "2026-10-08", min: 0 }];

assert.deepEqual(faltasEntre("2026-10-20", "2026-10-23"), ["2026-10-21", "2026-10-22"]);
assert.deepEqual(faltasEntre("2026-10-23", "2026-10-26"), ["2026-10-25"]);
assert.deepEqual(faltasEntre("2026-10-24", "2026-10-26"), []);
assert.equal(esRegreso("2026-10-19", "2026-10-20", TZ), false);
assert.equal(esRegreso("2026-10-19", "2026-10-21", TZ), true);
assert.equal(esRegreso("2026-10-24", "2026-10-26", TZ), false);
assert.equal(esRegreso("2026-10-17", "2026-10-21", TZ), true);
assert.deepEqual(sesionesReales(hist, runs, TZ).map((s) => s.date), ["2026-10-19", "2026-10-20"]);

const vie = regresoStats(hist, runs, "2026-10-23", TZ);
assert.equal(vie.pendiente, true);
assert.equal(vie.faltoAyer, true);
assert.equal(vie.faltaAyerQue, "Gym");
assert.equal(vie.hoyEsRegreso, false);
assert.equal(vie.siguienteNumero, vie.total + 1);
assert.equal(vie.semana, 2);
assert.equal(lineaSinCulpa(vie, "Push", true), "Ayer no se pudo y está bien. Hoy toca Push, sin compensar nada. Si te cuesta, hazla en Relajado.");

const tras = regresoStats([...hist, g("2026-10-23T15:00:00Z", "A")], runs, "2026-10-23", TZ);
assert.equal(tras.hoyEsRegreso, true);
assert.equal(tras.numeroHoy, vie.siguienteNumero);
assert.equal(tras.pendiente, false);
assert.equal(lineaSinCulpa(tras, "Push", true), "");
assert.equal(textoRegreso(3), "Regreso número 3. Volviste después de faltar.");

const full = [g("2026-10-13T15:00:00Z", "A"), g("2026-10-13T15:00:30Z", "A"), g("2026-10-15T15:00:00Z", "B")];
const fr = [{ id: "a", date: "2026-10-12", min: 30 }, { id: "b", date: "2026-10-14", min: 30 }];
const s2 = regresoStats(full, fr, "2026-10-16", TZ);
assert.equal(s2.semana, 4);
assert.equal(s2.semanasCumplidas, 1);
assert.equal(s2.total, 0);

/* wins de marca */
const mark = marcaReciente([[105, 8], [105, 10], [100, 10]], "weight");
assert.deepEqual(mark, [105, 10]);
assert.equal(winMarca({ name: "Jalón", type: "weight", unit: "lb", sets: [{ w: 105, r: 10, done: true }], mark }).texto, "Igualaste tu marca de Jalón: 105 lb × 10");
assert.equal(winMarca({ name: "Jalón", type: "weight", unit: "lb", sets: [{ w: 105, r: 11, done: true }, { w: 105, r: 10, done: true }], mark }).texto, "Superaste tu marca de Jalón: 105 lb × 11 (antes 105 lb × 10)");
assert.equal(winMarca({ name: "Jalón", type: "weight", unit: "lb", sets: [{ w: 105, r: 9, done: true }], mark }), null);
assert.equal(winMarca({ name: "Jalón", type: "weight", unit: "lb", sets: [{ w: 105, r: 12, done: true, f: false }], mark }), null);
assert.equal(winMarca({ name: "Jalón", type: "weight", unit: "lb", sets: [{ w: 105, r: 12, done: false }], mark }), null);
assert.equal(winMarca({ name: "Dominadas", type: "assist", unit: "kg", sets: [{ w: 20, r: 8, done: true }], mark: [25, 8] }).texto, "Superaste tu marca de Dominadas: 20 kg de ayuda × 8 (antes 25 kg de ayuda × 8)");
assert.equal(fmtSet("time", "s", 0, 45), "45 s");

const ws = sessionWins({ energy: "relajado", regresoNumero: 14, marcas: [{ tipo: "marca", texto: "x" }], hechos: 8, total: 8 });
assert.deepEqual(ws.map((w) => w.tipo), ["ligera", "regreso", "marca", "completa"]);
assert.equal(ws[1].texto, "Regreso número 14. Volviste después de faltar.");
assert.deepEqual(sessionWins({ energy: "normal", regresoNumero: 0, marcas: [], hechos: 3, total: 8 }), []);
console.log("volver ok");
