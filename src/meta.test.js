import assert from "node:assert/strict";
import {
  LINEA_DOS, PORQUES, inicioBloque, lineaMeta, metaSemanal, semanaBloque, textoRacha, textoSemana,
} from "./meta.js";

const MX = "America/Mexico_City";
const g = (date, day) => ({ date, day, logs: { a1: { v: "main", sets: [{ w: 100, r: 8, done: true }] } } });

assert.equal(inicioBloque("2026-11-14"), "2026-10-19");
assert.equal(semanaBloque("2026-10-24", MX), 1);
assert.equal(semanaBloque("2026-10-26", MX), 2);
assert.equal(semanaBloque("2026-11-14", MX), 4);
assert.equal(semanaBloque("2026-11-20", MX), 4);
assert.equal(semanaBloque("2026-10-01", MX), 1);

const hist = [g("2026-10-20", "A"), g("2026-10-22", "B")];
const runs = [{ id: "r1", date: "2026-10-19", min: 40 }];
const sab = metaSemanal(hist, runs, "2026-10-24T16:00:00.000Z", MX);
assert.equal(sab.hechas, 3);
assert.equal(sab.cumplida, false);
assert.equal(sab.faltoAyer, true);
assert.deepEqual(sab.circulos.map((c) => c.dia), ["Lun", "Mar", "Jue", ""]);
assert.equal(sab.circulos.filter((c) => c.lleno).length, 3);
assert.equal(lineaMeta(sab, 0), LINEA_DOS);
assert.equal(textoSemana(sab), "Semana 1 de 4 rumbo al 14 nov");

const conHoy = metaSemanal(hist, runs.concat([{ id: "r2", date: "2026-10-24", min: 30 }]), "2026-10-24", MX);
assert.equal(conHoy.hechas, 4);
assert.equal(conHoy.cumplida, true);
assert.equal(conHoy.faltoAyer, false);
assert.equal(conHoy.mostradas, 4);
assert.equal(lineaMeta(conHoy, 0), PORQUES[0]);
assert.equal(lineaMeta(conHoy, 1), PORQUES[1]);
assert.equal(lineaMeta(conHoy, 3), PORQUES[0]);

const extra = metaSemanal(hist.concat([g("2026-10-21", "C")]), runs.concat([{ id: "r2", date: "2026-10-24", min: 20 }, { id: "r3", date: "2026-10-24", min: 15 }]), "2026-10-24", MX);
assert.equal(extra.hechas, 6);
assert.equal(extra.extra, true);
assert.equal(extra.circulos.length, 4);
assert.equal(extra.circulos.every((c) => c.lleno), true);

const prev = [
  g("2026-10-12", "A"), g("2026-10-13", "B"), g("2026-10-15", "C"),
];
const prevRuns = [{ id: "p", date: "2026-10-14", min: 30 }, { id: "q", date: "2026-10-16", min: 20 }];
const racha = metaSemanal(prev.concat(hist), prevRuns.concat(runs), "2026-10-24", MX);
assert.equal(racha.racha, 1);
assert.equal(textoRacha(1), "Racha de 1 semana");
assert.equal(textoRacha(0), "Racha de 0 semanas");

const vacio = metaSemanal([], [], "2026-10-24", MX);
assert.equal(vacio.faltoAyer, false);
assert.equal(lineaMeta(vacio, 2), PORQUES[2]);

console.log("meta.test.js ok");
