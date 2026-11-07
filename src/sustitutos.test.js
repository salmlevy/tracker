import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { CORPORAL, diaDeSesion } from "./escala.js";
import { esCargaAxial } from "./gyms.js";
import { crearSustituto, equivalentesDe, patronDe, validarSustituto } from "./sustitutos.js";

const ids = new Set();
for (const dia of ["A", "B", "C"]) {
  for (const modo of ["relajado", "normal", "espartano"]) {
    for (const molestia of [false, true]) {
      diaDeSesion(dia, modo, { molestia, semana: 1 }).ex.forEach((e) => {
        if (String(e.id).startsWith("h") || CORPORAL.has(e.id)) return;
        ids.add(e.id);
      });
    }
  }
}
for (const id of ids) {
  const eq = equivalentesDe(id);
  assert.ok(eq.length >= 2 && eq.length <= 4, id + " tiene " + eq.length);
  assert.ok(patronDe(id), id);
  eq.forEach((e) => {
    assert.equal(esCargaAxial(e.n), false, e.n);
    assert.equal(e.patron, patronDe(id));
  });
}
assert.ok(/columna/.test(validarSustituto("Sentadilla con barra", [])));
assert.ok(/sesión/.test(validarSustituto("Press en poleas", ["Press en poleas"])));
assert.equal(validarSustituto("Press en poleas", ["Remo en polea"]), "");
const creado = crearSustituto({ exId: "a1", nombre: "Press en poleas sentado", tipo: "polea", patron: "press horizontal", usados: [] });
assert.equal(creado.tipo, "polea");
assert.equal(creado.patron, "press horizontal");
const mal = crearSustituto({ exId: "a1", nombre: "Peso muerto", tipo: "maquina", usados: [] });
assert.ok(mal.error);
for (const d of Object.values(DAYS)) {
  d.ex.forEach((e) => assert.equal(esCargaAxial(e.n + " " + ((e.alt && e.alt.n) || "")), false, e.id));
}
console.log("sustitutos ok", ids.size);
