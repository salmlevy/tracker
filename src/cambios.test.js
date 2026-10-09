import assert from "node:assert/strict";
import {
  CAMBIOS, cambioForEx, cambiosDeSesion, dismissCambio, feedbackEventProps,
  pendingCambios, recordFeedback, saveCambioTexto,
} from "./cambios.js";

assert.equal(CAMBIOS.filter((c) => c.cuando === "ejercicio").length, 3);
assert.deepEqual(CAMBIOS.map((c) => c.ex).filter(Boolean).sort(), ["c11", "c4", "c9"]);

assert.equal(cambioForEx({}, "c4").id, "c4_gif_maquina");
assert.equal(cambioForEx({}, "c1"), null);
assert.equal(cambiosDeSesion({}).length, 2);

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
