import assert from "node:assert/strict";
import {
  CAMBIOS, cambioForEx, cambiosDeHome, cambiosDeSesion, dismissCambio, feedbackEventProps,
  pendingCambios, recordFeedback, saveCambioTexto,
} from "./cambios.js";

assert.equal(CAMBIOS.filter((c) => c.cuando === "ejercicio").length, 4);
assert.deepEqual(CAMBIOS.map((c) => c.ex).filter(Boolean).sort(), ["a6", "c11", "c4", "c9"]);
assert.equal(cambioForEx({}, "a6").id, "a6_barra_total");
assert.equal(cambioForEx({}, "a6").nombre, "Press inclinado: peso total con barra");

assert.equal(cambioForEx({}, "c4").id, "c4_gif_maquina");
assert.equal(cambioForEx({}, "c1"), null);
assert.equal(cambiosDeSesion({}).length, 7);
assert.equal(CAMBIOS.find((c) => c.id === "hombro_rehab").nombre, "Modo rehab de hombro derecho");
assert.equal(CAMBIOS.find((c) => c.id === "modo_al_empezar").nombre, "Elegir modo al empezar (Relajado, Normal, Espartano)");
assert.equal(cambiosDeSesion({}).some((c) => c.id === "notas_adjuntos"), true);
assert.equal(CAMBIOS.find((c) => c.id === "notas_adjuntos").nombre, "Adjuntar foto");
assert.equal(cambiosDeHome({}).length, 2);
assert.equal(cambiosDeHome({})[0].nombre, "Inicio sin Logros, solo lo que toca hoy");
assert.equal(cambiosDeSesion({}).some((c) => c.id === "inicio_solo_hoy"), false);
assert.equal(CAMBIOS.every((c) => typeof c.nombre === "string" && c.nombre.length > 0), true);

const once = recordFeedback({}, { id: "c4_gif_maquina", util: true });
assert.equal(cambioForEx(once, "c4"), null);
assert.equal(pendingCambios(once).length, CAMBIOS.length - 1);

const no = recordFeedback({}, { id: "c9_tiempo_real", util: false, texto: "el timer se adelanta" });
assert.equal(no.texto.c9_tiempo_real, "el timer se adelanta");
assert.equal(no.answered.c9_tiempo_real.util, false);
const withText = saveCambioTexto(no, "c9_tiempo_real", "  que el check siga a mano  ");
assert.equal(withText.texto.c9_tiempo_real, "que el check siga a mano");

const gone = dismissCambio({}, "notas_teclado");
assert.equal(cambiosDeSesion(gone).some((c) => c.id === "notas_teclado"), false);
assert.equal(gone.answered.notas_teclado, undefined);

const props = feedbackEventProps(CAMBIOS[0], false);
assert.deepEqual(props, { cambio_id: "c4_gif_maquina", util: false, ex: "c4" });
assert.equal("texto" in props, false);
const sesion = feedbackEventProps(cambiosDeSesion({})[0], true);
assert.equal(sesion.ex, undefined);
assert.equal(sesion.util, true);
assert.equal(sesion.cambio_id, "reapertura_ejercicio");

console.log("cambios.test.js ok");
