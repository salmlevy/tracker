/* Registro de cambios nuevos. Un id por cambio, para preguntar una sola vez.
   El texto de “qué mejoraría” vive en estado.datos, nunca en el evento. */

export const CAMBIOS = [
  { id: "c4_gif_maquina", ex: "c4", fecha: "2026-10-09", cuando: "ejercicio" },
  { id: "c11_de_pie", ex: "c11", fecha: "2026-10-09", cuando: "ejercicio" },
  { id: "c9_tiempo_real", ex: "c9", fecha: "2026-10-09", cuando: "ejercicio" },
  { id: "reapertura_ejercicio", ex: "", fecha: "2026-10-09", cuando: "sesion" },
  { id: "notas_teclado", ex: "", fecha: "2026-10-09", cuando: "sesion" },
];

function blank(feedback) {
  const fb = feedback || {};
  return {
    answered: { ...(fb.answered || {}) },
    dismissed: { ...(fb.dismissed || {}) },
    texto: { ...(fb.texto || {}) },
  };
}

export function pendingCambios(feedback, { ex, cuando } = {}) {
  const fb = blank(feedback);
  return CAMBIOS.filter((c) => {
    if (cuando && c.cuando !== cuando) return false;
    if (ex && c.ex !== ex) return false;
    if (fb.answered[c.id] || fb.dismissed[c.id]) return false;
    return true;
  });
}

export function cambioForEx(feedback, exId) {
  return pendingCambios(feedback, { ex: exId, cuando: "ejercicio" })[0] || null;
}

export function cambiosDeSesion(feedback) {
  return pendingCambios(feedback, { cuando: "sesion" });
}

export function recordFeedback(feedback, { id, util, texto }) {
  const fb = blank(feedback);
  fb.answered[id] = { util: !!util };
  delete fb.dismissed[id];
  if (util) delete fb.texto[id];
  else if (texto && String(texto).trim()) fb.texto[id] = String(texto).trim().slice(0, 280);
  return fb;
}

export function saveCambioTexto(feedback, id, texto) {
  const fb = blank(feedback);
  const t = String(texto || "").trim().slice(0, 280);
  if (t) fb.texto[id] = t;
  else delete fb.texto[id];
  return fb;
}

export function dismissCambio(feedback, id) {
  const fb = blank(feedback);
  fb.dismissed[id] = true;
  return fb;
}

/* Props del evento. Sin el texto. */
export function feedbackEventProps(cambio, util) {
  const props = { cambio_id: cambio.id, util: !!util };
  if (cambio.ex) props.ex = cambio.ex;
  return props;
}
