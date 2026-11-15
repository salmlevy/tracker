/* 14 nov 2026, Navy: el chin-up asistido es con banda de goma, sin peso.
   En EW sigue la máquina de asistencia. No se reescribe el historial. */

import { NOMBRE_NAVY, TECHNOGYM_ID } from "./gyms.js";

export function esNavy(gym) {
  if (!gym) return false;
  return gym.id === TECHNOGYM_ID || gym.nombre === NOMBRE_NAVY;
}

export function b5ConBanda(ex, gym) {
  if (!ex || ex.id !== "b5" || !esNavy(gym)) return ex;
  return {
    ...ex,
    n: "Chin-up con banda",
    lbl: "banda, sin peso",
    type: "band",
    cues: [
      "Banda de goma en la barra y en las rodillas o el pie",
      "Agarre supino: palmas hacia ti",
      "Sin peso. Más reps, o una banda más ligera",
    ],
    alt: {
      n: "Chin-up sin banda",
      lbl: "reps",
      type: "body",
      factor: 0,
      cues: ["Sin banda y sin peso", "Agarre supino: palmas hacia ti", "Baja lento, sin balanceo"],
    },
  };
}
