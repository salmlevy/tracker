import assert from "node:assert/strict";
import { parseNota, applyParsedProtocol, hydrateTroteFromNotas, formatPlanLines, planIsEmpty } from "./parseNota.js";

const R1 = "El lunes hice calentamiento de 7 min en 9km sin inclinación después ejercicios de calentamiento fuera de la banda y empezó el entrenamiento todo con inclinacion 1.5 hice 3 series de 3 min a 14 por 1 min de descanso 2 min a 15 por 1 min de descanso y 1 min a 16 por 2.5 min de descanso y cerré con 5 min a 7 de enfriamiento y estiramientos";

const R2 = "Ayer hice 7 min de calentamiento en 9km/h después calentamientos fuera de banda y después empezó el entrenamiento de 12 series a 12 km/h con inclinación 12 de 1 minuto por 1.5 min de descanso y al final un enfriamiento de 5 min a 6 sin inclinación y después estiramientos sin banda";

/* Dictado un poco distinto: uniforme, otros números. */
const R3 = "Hoy hice calentamiento de 8 min en 10km/h y después el entrenamiento de 8 series a 11 km/h con inclinación 4 de 2 minutos por 45 seg de descanso y al final un enfriamiento de 3 min a 8";

const COMPACT = "17 ago: 15x1'15\" @15 km/h incl 1, desc 45\" fuera. Cal 7'@8.5 incl 0, enf 5'@7 incl 0. (La escalera 3-2-1 del 4 ago queda como variante del coach.)";

const OLD_POT = "Ayer hice 7 minutos de calentamiento en velocidad 9 después hice un ronda de 10 minutos a velocidad 13 en inclinación 1,5 después una de 5 minutos en velocidad 12 en inclinación 3 después otra serie de 5 minutos a velocidad 11 en inclinación 4, después otra de 5 minutos en inclinación 5 y después una de 5 minutos a velocidad 13 en inclinación 1.5 y por último enfriamiento de 5 minutos a velocidad 6 sin inclinación";

function checkR1() {
  const p = parseNota(R1);
  assert.ok(p, "R1 debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(Array.isArray(p.sets) && p.sets.length === 3, "R1 series variables, got " + JSON.stringify(p));
  assert.deepEqual(p.sets.map((s) => ({ t: s.t, v: s.v, inc: s.inc, dt: s.dt })), [
    { t: 180, v: 14, inc: 1.5, dt: 60 },
    { t: 120, v: 15, inc: 1.5, dt: 60 },
    { t: 60, v: 16, inc: 1.5, dt: 150 },
  ]);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
  assert.equal(p.dv, 0);
}

function checkR2() {
  const p = parseNota(R2);
  assert.ok(p, "R2 debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(!Array.isArray(p.sets), "R2 es uniforme, no sets[]. got " + JSON.stringify(p));
  assert.equal(p.n, 12);
  assert.equal(p.t, 60);
  assert.equal(p.v, 12);
  assert.equal(p.inc, 12);
  assert.equal(p.dt, 90);
  assert.equal(p.dv, 0);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 6);
}

function checkR3() {
  const p = parseNota(R3);
  assert.ok(p, "R3 debe parsear algo sensible");
  assert.equal(p.cal, 8);
  assert.equal(p.cv, 10);
  assert.equal(p.n, 8);
  assert.equal(p.t, 120);
  assert.equal(p.v, 11);
  assert.equal(p.inc, 4);
  assert.equal(p.dt, 45);
  assert.equal(p.cool.min, 3);
  assert.equal(p.cool.v, 8);
}

function checkCompact() {
  const p = parseNota(COMPACT);
  assert.ok(p, "compacto debe parsear");
  assert.equal(p.n, 15);
  assert.equal(p.t, 75);
  assert.equal(p.v, 15);
  assert.equal(p.inc, 1);
  assert.equal(p.dt, 45);
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 8.5);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
}

function checkOldPot() {
  const p = parseNota(OLD_POT);
  assert.ok(p, "nota vieja de potencia debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(Array.isArray(p.sets) && p.sets.length >= 4, "rondas variables " + JSON.stringify(p));
  assert.equal(p.sets[0].t, 600);
  assert.equal(p.sets[0].v, 13);
  assert.equal(p.sets[0].inc, 1.5);
  assert.equal(p.sets[3].v, 11, "inclinación 5 sin vel: arrastra 11, no la 13 de la siguiente. " + JSON.stringify(p.sets));
  assert.equal(p.sets[3].inc, 5);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 6);
}

const LEGACY = "7 min calentamiento a 8.5, 15 repeticiones de 1 min 15 secs a velocidad 15 inclinacion 1 con 45 secs de descanso, enfriamiento 5 min a velocidad 7.";

function checkLegacy() {
  const p = parseNota(LEGACY);
  assert.ok(p, "estilo viejo del mensaje de error");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 8.5);
  assert.equal(p.n, 15);
  assert.equal(p.t, 75);
  assert.equal(p.v, 15);
  assert.equal(p.inc, 1);
  assert.equal(p.dt, 45);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
  assert.ok(!Array.isArray(p.sets) || p.sets.length === 15, "no debe tragar el calentamiento como serie " + JSON.stringify(p));
}

function checkMergeStripsSets() {
  const leftover = {
    cal: 7, cv: 8.5, t: 180, dt: 60, dv: 0, cool: { min: 5, v: 6.5 },
    sets: [{ v: 10, inc: 1.5 }, { v: 11, inc: 1.5 }],
    nota: R2,
  };
  const next = applyParsedProtocol(leftover, parseNota(R2));
  assert.equal(next.v, 12, "VEL no puede quedar undefined/leftover");
  assert.ok(next.v !== undefined);
  assert.ok(!Array.isArray(next.sets), "debe salir de series variables");
  assert.equal(next.n, 12);
  assert.equal(next.t, 60);
  assert.equal(next.inc, 12);
  assert.equal(next.dt, 90);
  assert.equal(next.cv, 9);
  assert.equal(next.cool.v, 6);
  assert.equal(next.nota, R2);
}

function checkHydrateKeepsOtherWeeks() {
  const trote = {
    weeks: {
      "2026-08-17": { res: { p: { cal: 7, cv: 8.5, n: 15, t: 75, v: 15, inc: 1, dt: 45, dv: 0, cool: { min: 5, v: 7 }, nota: COMPACT } } },
      "2026-08-24": {
        res: { p: { cal: 7, cv: 8.5, n: 3, t: 75, v: 15, inc: 1.5, dt: 45, dv: 0, cool: { min: 5, v: 7 }, nota: R1 }, nx: "keep-me" },
        pot: { p: { cal: 7, cv: 8.5, t: 180, dt: 60, dv: 0, cool: { min: 5, v: 6.5 }, n: 12, inc: 12, nota: R2 } },
      },
    },
    runs: [{ id: "x" }],
  };
  const h = hydrateTroteFromNotas(trote);
  assert.equal(h.weeks["2026-08-24"].res.nx, "keep-me");
  assert.equal(h.weeks["2026-08-24"].res.p.nota, R1);
  assert.equal(h.weeks["2026-08-24"].pot.p.nota, R2);
  assert.equal(h.weeks["2026-08-24"].pot.p.v, 12);
  assert.ok(Array.isArray(h.weeks["2026-08-24"].res.p.sets));
  assert.equal(h.weeks["2026-08-24"].res.p.sets[2].dt, 150);
  assert.equal(h.weeks["2026-08-17"].res.p.n, 15);
  assert.equal(h.weeks["2026-08-17"].res.p.v, 15);
  assert.deepEqual(h.runs, [{ id: "x" }]);
}

const N31 = "Hice calentamiento de 7 min en 9 sin inclinación, luego ejercicios de calentamiento, luesgo 5 reps en 20 sin inclinación de 10 segundos por 15 de descanso luego 10 reps en 17 de 30 segundo por 30 de descanso inclinación 1.5 luego 5 reps de 1 min en 15.5 por 1 min de descanso en 1.5 de inclinación y luego 10 reps en 17 de 30 secs por 30 secs. De descanso en 1.5 de inclinación y para enfriar 5 min e 5 sin inclinación";

const C31 = "cal 7' @9 sin incl\n5×10s @20 sin incl / desc 15s\n10×30s @17 incl 1.5 / desc 30s\n5×1' @15.5 incl 1.5 / desc 1'\n10×30s @17 incl 1.5 / desc 30s\nenf 5' @5 sin incl";

const BLOCKS_31 = [
  { n: 5, t: 10, v: 20, inc: 0, dt: 15 },
  { n: 10, t: 30, v: 17, inc: 1.5, dt: 30 },
  { n: 5, t: 60, v: 15.5, inc: 1.5, dt: 60 },
  { n: 10, t: 30, v: 17, inc: 1.5, dt: 30 },
];

function expect31(p, label) {
  assert.ok(p, label + " debe parsear");
  assert.equal(p.cal, 7, label + " cal " + JSON.stringify(p));
  assert.equal(p.cv, 9);
  assert.ok(Array.isArray(p.blocks) && p.blocks.length === 4, label + " 4 bloques, got " + JSON.stringify(p));
  assert.deepEqual(p.blocks, BLOCKS_31, label + " bloques " + JSON.stringify(p.blocks));
  assert.equal(p.cool.min, 5, label + " enf min");
  assert.equal(p.cool.v, 5, label + " enf vel");
  const lines = formatPlanLines(p);
  assert.equal(lines.length, 6, label + " 6 lineas " + JSON.stringify(lines));
  assert.ok(lines[0].startsWith("cal 7' @9"), lines[0]);
  assert.equal(lines[1], "5×10s @20 · sin incl · desc 15s");
  assert.equal(lines[2], "10×30s @17 · incl 1.5 · desc 30s");
  assert.equal(lines[3], "5×1' @15.5 · incl 1.5 · desc 1'");
  assert.equal(lines[4], "10×30s @17 · incl 1.5 · desc 30s");
  assert.ok(lines[5].startsWith("enf 5' @5"), lines[5]);
}

function checkN31() { expect31(parseNota(N31), "N31 dictado"); }
function checkC31() { expect31(parseNota(C31), "C31 compacto"); }

function checkEmptyNote() {
  assert.equal(parseNota(""), null);
  assert.equal(parseNota("   "), null);
  assert.equal(parseNota("hoy me senti bien"), null);
  assert.ok(planIsEmpty({ nota: "" }));
  assert.ok(planIsEmpty({}));
  assert.ok(!planIsEmpty({ n: 12, t: 60, v: 12 }));
}

function checkHydrate31KeepsOtherWeeks() {
  const trote = {
    weeks: {
      "2026-08-10": { pot: { p: { cal: 7, cv: 9, n: 5, t: 600, v: 13, inc: 1.5, dt: 0, dv: 0, cool: { min: 5, v: 6 }, nota: OLD_POT, sets: [{ t: 600, v: 13, dt: 0, inc: 1.5 }] } } },
      "2026-08-17": { res: { p: { cal: 7, cv: 8.5, n: 15, t: 75, v: 15, inc: 1, dt: 45, dv: 0, cool: { min: 5, v: 7 }, nota: COMPACT } } },
      "2026-08-24": {
        res: { p: { cal: 7, cv: 9, n: 3, t: 180, v: 14, inc: 1.5, dt: 60, dv: 0, cool: { min: 5, v: 7 }, nota: R1 }, nx: "keep-me" },
        pot: { p: { cal: 7, cv: 9, n: 12, t: 60, v: 12, inc: 12, dt: 90, dv: 0, cool: { min: 5, v: 6 }, nota: R2 } },
      },
      "2026-08-31": { res: { p: { n: 4, t: 60, v: 15.5, cv: 9, dt: 60, dv: 0, cal: 7, inc: 1.5, cool: { v: 7, min: 5 }, nota: N31, sets: [{ t: 60, v: 15.5, dt: 60, inc: 1.5 }] } } },
    },
    runs: [{ id: "x" }],
  };
  const h = hydrateTroteFromNotas(trote);
  assert.equal(h.weeks["2026-08-24"].res.nx, "keep-me");
  assert.equal(h.weeks["2026-08-17"].res.p.n, 15);
  assert.equal(h.weeks["2026-08-17"].res.p.v, 15);
  assert.ok(!Array.isArray(h.weeks["2026-08-17"].res.p.blocks));
  assert.ok(Array.isArray(h.weeks["2026-08-24"].res.p.sets));
  assert.equal(h.weeks["2026-08-24"].res.p.sets[2].dt, 150);
  assert.equal(h.weeks["2026-08-24"].pot.p.v, 12);
  assert.equal(h.weeks["2026-08-24"].pot.p.n, 12);
  assert.deepEqual(h.weeks["2026-08-31"].res.p.blocks, BLOCKS_31);
  assert.equal(h.weeks["2026-08-31"].res.p.cool.v, 5);
  assert.equal(h.weeks["2026-08-31"].res.p.nota, N31);
  assert.deepEqual(h.runs, [{ id: "x" }]);
}

const tests = [
  ["R1 resistencia variable", checkR1],
  ["R2 potencia uniforme VEL=12", checkR2],
  ["R3 dictado distinto", checkR3],
  ["compacto coach", checkCompact],
  ["nota vieja potencia (rondas)", checkOldPot],
  ["estilo legacy 1 min 15 secs", checkLegacy],
  ["merge quita leftover sets y pone v", checkMergeStripsSets],
  ["hydrate no borra notas ni otras semanas", checkHydrateKeepsOtherWeeks],
  ["31 ago dictado: 4 bloques distintos", checkN31],
  ["31 ago compacto: 4 bloques distintos", checkC31],
  ["nota vacia o sin protocolo no inventa", checkEmptyNote],
  ["hydrate 31 ago no toca 10/17/24 ago", checkHydrate31KeepsOtherWeeks],
];

let failed = 0;
tests.forEach(([name, fn]) => {
  try {
    fn();
    console.log("ok  " + name);
  } catch (e) {
    failed++;
    console.log("FAIL " + name);
    console.log("    " + (e && e.stack ? e.stack : e));
  }
});
if (failed) {
  console.log("\n" + failed + " failed");
  process.exit(1);
}
console.log("\n" + tests.length + " passed");
