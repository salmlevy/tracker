import assert from "node:assert/strict";
import {
  abiertoInicial, CIERRE, cierreDe, cierreExport, cierreImport, cierreParaGuardar, cuentaCierre, debeCorrer, faseLado, horaGuardada,
  leerBorrador, minutosCierre, pasoCierre, planCierre, segundosDe, textoCierre, textoReloj, vecesHecho,
} from "./cierre.js";

const mal = /[—–]/;
const blob = CIERRE.map((ex) => [ex.n, ex.dosis || "", ex.texto].join(" ")).join("\n") + "\n" + textoCierre(13);
assert.equal(mal.test(blob), false);
assert.equal(/\b(usted|vosotros|ustedes)\b/i.test(blob), false);
assert.equal(/\bvos\b/.test(blob), false);
assert.equal(/sentadilla|peso muerto|crunch|twist|woodchop/i.test(blob), false);

assert.equal(CIERRE.length, 10);
assert.equal(new Set(CIERRE.map((ex) => ex.id)).size, 10);

const base = planCierre([]);
assert.equal(base.find((x) => x.id === "plancha").dosis, "30 s");
assert.equal(base.find((x) => x.id === "lateral").dosis, "20 s por lado");
assert.equal(base.find((x) => x.id === "deadbug").dosis, "8 por lado");
assert.equal(base.find((x) => x.id === "gato").dosis, "6 reps suaves");
const minBase = minutosCierre(base);
assert.ok(minBase >= 10 && minBase <= 15, "base " + minBase);
assert.match(textoCierre(minBase), /Sin peso sobre la columna/);
assert.match(textoCierre(minBase), /paras/);

const una = [{ cierre: cierreParaGuardar(base, { plancha: true, lateral: true }) }];
assert.equal(vecesHecho(una, "plancha"), 1);
assert.equal(vecesHecho(una, "deadbug"), 0);
const sube = planCierre(una);
assert.equal(sube.find((x) => x.id === "plancha").dosis, "35 s");
assert.equal(sube.find((x) => x.id === "lateral").dosis, "25 s por lado");

const muchas = [];
for (let i = 0; i < 8; i++) muchas.push({ cierre: { min: 13, items: [{ id: "plancha", n: "Plancha frontal", dosis: "30 s", hecho: true }, { id: "lateral", n: "Plancha lateral", dosis: "20 s por lado", hecho: true }] } });
const tope = planCierre(muchas);
assert.equal(tope.find((x) => x.id === "plancha").dosis, "45 s");
assert.equal(tope.find((x) => x.id === "lateral").dosis, "30 s por lado");
const minTope = minutosCierre(tope);
assert.ok(minTope >= 10 && minTope <= 15, "tope " + minTope);
assert.equal(segundosDe(CIERRE.find((ex) => ex.id === "plancha"), 99), 45);

const guardado = cierreParaGuardar(sube, { plancha: true, puente: true });
assert.equal(guardado.min, minutosCierre(sube));
assert.equal(guardado.items.length, 10);
assert.equal(guardado.items.find((x) => x.id === "plancha").hecho, true);
assert.equal(guardado.items.find((x) => x.id === "plancha").dosis, "35 s");
assert.equal(guardado.items.find((x) => x.id === "birddog").hecho, false);
assert.equal("texto" in guardado.items[0], false);

const run = { date: "2026-10-28", savedAt: "2026-10-28T18:05:00.000Z", cierre: guardado };
assert.equal(cuentaCierre(run).hechos, 2);
assert.equal(cuentaCierre(run).total, 10);
assert.equal(cierreDe({}), null);
assert.equal(cierreDe(null), null);
assert.equal(cuentaCierre({ min: 40 }), null);

const exp = cierreExport(guardado);
assert.equal(exp.estiramiento_min, guardado.min);
assert.equal(exp.estiramiento_final[0].nombre, "Dead bug");
assert.equal(exp.estiramiento_final.find((x) => x.id === "puente").hecho, true);
const back = cierreImport(exp);
assert.equal(back.min, guardado.min);
assert.equal(back.items.find((x) => x.id === "puente").n, "Puente de glúteo");
assert.equal(cierreImport({}), null);
assert.equal(cierreImport({ estiramiento_final: [{ id: "", nombre: "x" }] }), null);

assert.equal(horaGuardada("2026-10-28T18:05:00.000Z", "UTC"), "18:05");
assert.equal(horaGuardada("", "UTC"), "");
assert.equal(horaGuardada("no-es-fecha", "UTC"), "");

assert.equal(base.find((x) => x.id === "deadbug").reloj, 40);
assert.equal(base.find((x) => x.id === "plancha").reloj, 30);
assert.equal(base.find((x) => x.id === "lateral").reloj, 40);
assert.equal(base.find((x) => x.id === "cadera").reloj, 80);
assert.equal(sube.find((x) => x.id === "plancha").reloj, 35);
assert.equal(sube.find((x) => x.id === "lateral").reloj, 50);
assert.equal(textoReloj(80), "1:20");
assert.equal(textoReloj(5), "0:05");
assert.equal(faseLado(base.find((x) => x.id === "deadbug"), 40), "Primer lado");
assert.equal(faseLado(base.find((x) => x.id === "deadbug"), 10), "Ahora el otro lado");
assert.equal(faseLado(base.find((x) => x.id === "plancha"), 10), "");
assert.equal(abiertoInicial(base, {}), "deadbug");
assert.equal(abiertoInicial(base, { deadbug: true }), "birddog");
const paso = pasoCierre(base, {}, "deadbug");
assert.equal(paso.hechos.deadbug, true);
assert.equal(paso.abierto, "birddog");
assert.equal(pasoCierre(base, {}, "gato").abierto, null);
const salta = pasoCierre(base, { birddog: true }, "deadbug");
assert.equal(salta.abierto, "plancha");

assert.equal(debeCorrer("lista", true), false);
assert.equal(debeCorrer("carrera", true), false);
assert.equal(debeCorrer("despues", true), false);
assert.equal(debeCorrer("estirando", false), false);
assert.equal(debeCorrer("estirando", true), true);
assert.equal(leerBorrador(null, base, "pot"), null);
assert.equal(leerBorrador({ tipo: "res", fase: "carrera" }, base, "pot"), null);
assert.equal(leerBorrador({ tipo: "pot", fase: "lista" }, base, "pot"), null);
const carrera = leerBorrador({ tipo: "pot", fase: "carrera", corriendo: true }, base, "pot");
assert.equal(carrera.fase, "carrera");
assert.equal(carrera.corriendo, false);
assert.equal(carrera.abierto, null);
const medio = leerBorrador({
  tipo: "pot", fase: "estirando", corriendo: true,
  abierto: "plancha", resta: 12, hechos: { deadbug: true, birddog: 1, raro: true },
}, base, "pot");
assert.equal(medio.corriendo, false);
assert.equal(medio.abierto, "plancha");
assert.equal(medio.resta, 12);
assert.equal(medio.hechos.deadbug, true);
assert.equal(medio.hechos.birddog, true);
assert.equal(medio.hechos.raro, undefined);
const topeReloj = leerBorrador({ tipo: "pot", fase: "estirando", abierto: "deadbug", resta: 999 }, base, "pot");
assert.equal(topeReloj.resta, 40);
const roto = leerBorrador({ tipo: "pot", fase: "estirando", abierto: "no-esta", resta: 5 }, base, "pot");
assert.equal(roto.abierto, "deadbug");

console.log("cierre.test.js ok");
