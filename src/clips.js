/* Silent looping movement clip (Hevy-style). Prefer /previews/{id}.gif|mp4, else jsDelivr GIF. */
export const CLIPS_CDN = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/";
export const CLIPS = {
  a1: "pectorals/lever-chest-press.gif",
  "a1~alt": "pectorals/dumbbell-bench-press.gif",
  a2: "pectorals/lever-seated-fly.gif",
  "a2~alt": "pectorals/cable-middle-fly.gif",
  a3: "delts/lever-military-press.gif", // seated plate-loaded machine (TRUE), not standing landmine
  "a3~alt": "delts/dumbbell-arnold-press.gif",
  a4: "delts/dumbbell-front-raise.gif",
  "a4~alt": "delts/cable-front-raise.gif",
  a5: "delts/dumbbell-lateral-raise.gif",
  "a5~alt": "delts/cable-one-arm-lateral-raise.gif",
  a6: "pectorals/barbell-incline-bench-press.gif",
  "a6~alt": "pectorals/lever-incline-chest-press.gif",
  a7: "/previews/a7.gif",
  "a7~alt": "pectorals/dumbbell-fly.gif",
  a8: "triceps/barbell-lying-triceps-extension-skull-crusher.gif",
  "a8~alt": "triceps/dumbbell-standing-triceps-extension.gif",
  a9: "triceps/cable-pushdown-with-rope-attachment.gif",
  "a9~alt": "triceps/dumbbell-kickback.gif",
  a10: "pectorals/assisted-chest-dip-kneeling.gif",
  "a10~alt": "triceps/bench-dip-knees-bent.gif",
  a11: "pectorals/kneeling-push-up-male.gif",
  "a11~alt": "pectorals/push-up.gif",
  b1: "lats/cable-pulldown.gif",
  "b1~alt": "lats/cable-straight-arm-pulldown-with-rope.gif",
  b2: "upper-back/cable-seated-row.gif",
  "b2~alt": "upper-back/lever-seated-row.gif",
  b3: "upper-back/dumbbell-one-arm-bent-over-row.gif",
  "b3~alt": "upper-back/cable-one-arm-bent-over-row.gif",
  b4: "upper-back/dumbbell-incline-row.gif",
  "b4~alt": "upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif",
  b5: "lats/lever-assisted-chin-up.gif",
  "b5~alt": "lats/assisted-standing-chin-up.gif",
  b10: "lats/assisted-pull-up.gif",
  "b10~alt": "lats/band-assisted-pull-up.gif",
  b6: "biceps/ez-barbell-curl.gif",
  "b6~alt": "biceps/cable-curl.gif",
  b7: "biceps/dumbbell-hammer-curl.gif",
  "b7~alt": "biceps/cable-hammer-curl-with-rope.gif",
  b8: "biceps/dumbbell-incline-curl.gif",
  "b8~alt": "biceps/dumbbell-concentration-curl.gif",
  b9: "/previews/b9.gif",
  "b9~alt": "abs/dead-bug.gif",
  b11: "spine/hyperextension.gif",
  "b11~alt": "spine/lever-back-extension.gif",
  c1: "glutes/sled-45-leg-press.gif",
  "c1~alt": "glutes/sled-45-degrees-one-leg-press.gif",
  c2: "hamstrings/lever-lying-leg-curl.gif",
  "c2~alt": "hamstrings/standing-single-leg-curl.gif",
  c3: "quads/lever-leg-extension.gif",
  "c3~alt": "quads/resistance-band-leg-extension.gif",
  c4: "/previews/c4.gif",
  "c4~alt": "glutes/low-glute-bridge-on-floor.gif",
  c5: "abductors/lever-seated-hip-abduction.gif",
  "c5~alt": "abductors/side-hip-abduction.gif",
  c6: "adductors/lever-seated-hip-adduction.gif",
  "c6~alt": "adductors/cable-hip-adduction.gif",
  c7: "/previews/c7.gif",
  "c7~alt": "abs/cable-kneeling-crunch.gif",
  c8: "calves/lever-seated-calf-raise.gif",
  "c8~alt": "calves/lever-standing-calf-raise.gif",
  c11: "/previews/c11.mp4",
  "c11~alt": "glutes/cable-standing-hip-extension.gif",
  c12: "abs/band-horizontal-pallof-press.gif",
  "c12~alt": "abs/band-vertical-pallof-press.gif",
  c9: "abs/weighted-front-plank.gif",
  "c9~alt": "abs/kneeling-plank-tap-shoulder-male.gif",
  c10: "abs/reverse-crunch.gif",
  "c10~alt": "abs/tuck-crunch.gif",
  h1: "delts/cable-standing-shoulder-external-rotation.gif",
  "h1~alt": "delts/cable-standing-shoulder-external-rotation.gif",
  h2: "delts/cable-seated-shoulder-internal-rotation.gif",
  "h2~alt": "delts/cable-seated-shoulder-internal-rotation.gif",
  h3: "delts/dumbbell-full-can-lateral-raise.gif",
  "h3~alt": "delts/cable-one-arm-lateral-raise.gif",
  /* Isométrico de abducción en pared. El catálogo v1.1.0 no tiene el empuje
     contra la pared; el más cercano del mismo tag es la abducción de hombro
     tumbado de lado (apoyado, sin polea y sin subir el brazo de pie).
     La ⇄ en polea sí usa la elevación lateral de cable. */
  h4: "delts/dumbbell-side-lying-one-hand-raise.gif",
  "h4~alt": "delts/cable-one-arm-lateral-raise.gif",
  h5: "delts/cable-rear-delt-row-with-rope.gif",
  "h5~alt": "delts/band-standing-rear-delt-row.gif",
  a1r: "pectorals/lever-chest-press.gif",
  "a1r~alt": "pectorals/dumbbell-bench-press.gif",
  a6r: "pectorals/barbell-incline-bench-press.gif",
  "a6r~alt": "pectorals/lever-incline-chest-press.gif",
  a3r: "delts/dumbbell-seated-shoulder-press-parallel-grip.gif",
  "a3r~alt": "delts/lever-military-press.gif",
  a5r: "delts/dumbbell-full-can-lateral-raise.gif",
  "a5r~alt": "delts/cable-one-arm-lateral-raise.gif",
  a12r: "delts/cable-rear-delt-row-with-rope.gif",
  "a12r~alt": "delts/band-standing-rear-delt-row.gif",
  b1r: "lats/cable-lateral-pulldown-with-v-bar.gif",
  "b1r~alt": "lats/cable-one-arm-pulldown.gif",
  b2r: "upper-back/cable-seated-row.gif",
  "b2r~alt": "upper-back/lever-seated-row.gif",
  b3r: "upper-back/dumbbell-one-arm-bent-over-row.gif",
  "b3r~alt": "upper-back/cable-one-arm-bent-over-row.gif",
  b4r: "upper-back/dumbbell-incline-row.gif",
  "b4r~alt": "upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif",
  b10r: "lats/assisted-parallel-close-grip-pull-up.gif",
  "b10r~alt": "lats/cable-lateral-pulldown-with-v-bar.gif",
  b12r: "delts/dumbbell-upright-shoulder-external-rotation.gif",
  "b12r~alt": "delts/cable-standing-shoulder-external-rotation.gif",
};

/* Estiramiento final: los mismos GIF que Gym, mismo CDN (tag v1.1.0).
   Licencia: el README de ExerciseGymGifsDB en ese tag dice que los GIF
   pertenecen a sus autores y el repo solo los organiza. El tracker ya
   los reproduce en Gym con previewSrc. No hay otro origen.
   https://github.com/JahelCuadrado/ExerciseGymGifsDB/blob/v1.1.0/README.md
   Si el catálogo no tiene el gesto exacto, se usa el GIF del mismo
   catálogo que más se acerca, sin flexión con rotación ni peso sobre la espalda. */
export const CIERRE_CLIPS = {
  deadbug: "abs/dead-bug.gif",
  birddog: "quads/all-fours-squad-stretch.gif",
  plancha: "abs/weighted-front-plank.gif",
  lateral: "abs/side-bridge-v-2.gif",
  puente: "glutes/low-glute-bridge-on-floor.gif",
  pallof: "abs/band-horizontal-pallof-press.gif",
  cadera: "glutes/band-seated-hip-internal-rotation.gif",
  flexor: "quads/intermediate-hip-flexor-and-quad-stretch.gif",
  isquio: "hamstrings/leg-up-hamstring-stretch.gif",
  gato: "lats/kneeling-lat-stretch.gif",
};

Object.keys(CIERRE_CLIPS).forEach((id) => {
  CLIPS["cierre-" + id] = CIERRE_CLIPS[id];
});

export function cierrePreviewEx(id) {
  const key = "cierre-" + id;
  if (!CLIPS[key]) return null;
  return { id: key };
}

export function previewSrc(ex, v) {
  if (!ex) return null;
  const key = v === "alt" && ex.alt ? ex.id + "~alt" : ex.id;
  const file = CLIPS[key] || CLIPS[ex.id];
  if (!file) return null;
  if (/^https?:/i.test(file) || file.startsWith("/")) return file;
  return CLIPS_CDN + file;
}
