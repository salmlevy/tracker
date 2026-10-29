import assert from "node:assert/strict";
import { CLIPS } from "./clips.js";
import { BASE_EJ, BASE_KG, CORPORAL, diaDeSesion, duplicadosEnSesion, metaVol, resumenEscala } from "./escala.js";

const MODOS = ["relajado", "normal", "espartano"];
const DIAS = ["A", "B", "C"];
const AXIAL = /sentadilla|peso muerto|deadlift|good morning|barbell squat/i;

assert.ok(BASE_KG.A > 1000 && BASE_KG.B > 1000 && BASE_KG.C > 1000);

for (const dia of DIAS) {
  for (const modo of MODOS) {
    for (const molestia of [false, true]) {
      const r = resumenEscala(dia, modo, molestia, 1);
      const meta = metaVol(dia, modo, molestia, 1);
      const etiqueta = `${dia} ${modo} ${molestia ? "con" : "sin"} molestia`;
      assert.ok(r.ej / BASE_EJ[dia] >= 0.6, etiqueta + " baja de 60% de ejercicios: " + r.ejPct.toFixed(1));
      assert.ok(Math.abs(r.volPct - meta) <= 3, etiqueta + " volumen " + r.volPct.toFixed(1) + " contra " + meta);
      assert.ok(!r.trabajo.some(([id]) => id === "c7" || id === "c10"), etiqueta + " trae c7 o c10");
      assert.ok(!r.trabajo.some(([id]) => id === "a3r"), etiqueta + " trae a3r en semana 1");
      const day = diaDeSesion(dia, modo, { molestia, semana: 1 });
      assert.equal(day.ex.filter((e) => e.id === "c7" || e.id === "c10").length, 0);
      day.ex.forEach((e) => {
        assert.equal(AXIAL.test(e.n + " " + ((e.alt && e.alt.n) || "")), false, e.id);
        assert.equal(e.maxSets, e.nSets);
      });
      const workIds = r.trabajo.map(([id]) => id);
      assert.deepEqual(day.ex.filter((e) => !String(e.id).startsWith("h")).map((e) => e.id), workIds);
      assert.equal(workIds.includes("a5r"), false, etiqueta + " programa la escapción de trabajo");
      const cierre = workIds[workIds.length - 1];
      assert.equal(CORPORAL.has(cierre), true, etiqueta + " no cierra con peso corporal (" + cierre + ")");
      assert.ok(CLIPS[cierre], etiqueta + " el cierre no tiene gif");
    }
  }
}

const sem3 = resumenEscala("A", "espartano", true, 3);
assert.ok(sem3.trabajo.some(([id]) => id === "a3r"), "semana 3 mete a3r");
assert.ok(Math.abs(sem3.volPct - 92) <= 3, "semana 3 " + sem3.volPct.toFixed(1));
const sem3Ids = sem3.trabajo.map(([id]) => id);
assert.equal(CORPORAL.has(sem3Ids[sem3Ids.length - 1]), true, "semana 3 no cierra con peso corporal");

const SEMANAS = [1, 2, 3];
const hallados = [];
for (const dia of DIAS) {
  for (const modo of MODOS) {
    for (const molestia of [false, true]) {
      for (const semana of SEMANAS) {
        const day = diaDeSesion(dia, modo, { molestia, semana });
        const dups = duplicadosEnSesion(day.ex);
        const etiqueta = `${dia} ${modo} ${molestia ? "con" : "sin"} molestia semana ${semana}`;
        if (dups.length) hallados.push(etiqueta + ": " + dups.join("; "));
      }
    }
  }
}
console.log("duplicados en sesión: " + (hallados.length ? hallados.join(" | ") : "cero"));
assert.deepEqual(hallados, []);
assert.equal(diaDeSesion("A", "relajado", { molestia: true, semana: 3 }).ex.some((e) => e.id === "a3r"), false);
assert.equal(diaDeSesion("C", "espartano", { molestia: true }).ex[0].loadPct, 0.8);
assert.equal(diaDeSesion("A", "normal", { molestia: true }).ex.find((e) => e.id === "a1r").loadPct, undefined);

console.log("escala ok");
for (const dia of DIAS) {
  for (const modo of MODOS) {
    for (const molestia of [false, true]) {
      const r = resumenEscala(dia, modo, molestia, 1);
      console.log(
        dia,
        modo.padEnd(9),
        molestia ? "molestia" : "sin     ",
        r.ej + " ej",
        r.ejPct.toFixed(0) + "% ej",
        r.volPct.toFixed(1) + "% vol",
        "meta " + r.meta,
      );
    }
  }
}
