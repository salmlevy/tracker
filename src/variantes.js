/* Instrucciones del botón ⇄ y de cada variante (opts).
   No se reutilizan las del ejercicio original: cada una describe esa forma. */

export const ALT_CUES = {
  a1: ["Banco plano, lumbar apoyada", "Mancuernas bajan solo hasta el pecho", "Codos a unos 45°, sin abrirlos de más"],
  a2: ["Poleas a la altura del pecho", "Codos semiflexionados y fijos", "Junta al centro y aprieta 1 seg"],
  a3: ["Sentado, lumbar contra el respaldo", "Gira las palmas mientras subes", "Para si el hombro pincha"],
  a4: ["Un brazo, polea baja", "Sube hasta el hombro, sin impulso", "El torso no se balancea"],
  a5: ["Polea baja, un brazo", "Sube lateral hasta el hombro", "No encojas el trapecio"],
  a6: ["Respaldo inclinado, lumbar pegada", "Baja hasta el pecho alto", "Arriba no bloquees los codos"],
  a7: ["Banco plano, una mancuerna por mano", "Baja con los codos semiflexionados", "Junta arriba sin chocar las mancuernas"],
  a8: ["Sentado, mancuerna detrás de la cabeza", "Codos apuntan al techo y no se abren", "Lumbar apoyada en el respaldo"],
  a9: ["Tronco apoyado en el banco", "Codo fijo, estira el antebrazo atrás", "No gires el hombro para ayudar"],
  a10: ["Manos en el banco, pies cerca", "Baja poco, con los codos hacia atrás", "Hombros lejos de las orejas"],
  a11: ["Cuerpo en línea, de puntas de pie", "Baja el pecho con control", "Si pincha el hombro, vuelve a las rodillas"],
  b1: ["Polea alta, brazos casi rectos", "Arco hacia abajo hasta el muslo", "Lumbar quieta, sin arquear"],
  b2: ["Pecho apoyado en el pad", "Jala al abdomen y aprieta escápulas", "No empujes con la lumbar"],
  b3: ["Polea baja, un brazo", "Codo pegado al costado", "Tronco quieto, sin rotar"],
  b4: ["Pecho al pad, una sola mancuerna", "Jala hacia la cadera", "El otro brazo solo apoya"],
  b5: ["Banda en la barra y bajo el pie", "Agarre supino: palmas hacia ti", "No te cuelgues del todo abajo"],
  b10: ["Banda en la barra para asistir", "Agarre prono: palmas adelante", "Hombros abajo al subir"],
  b6: ["Barra en la polea baja", "Codos fijos a los costados", "Sube sin balancear el torso"],
  b7: ["Cuerda en la polea baja", "Muñecas neutras, separa al final", "Los codos no viajan adelante"],
  b8: ["Codo apoyado en el muslo", "Sube la mancuerna sin mover el hombro", "Baja lento hasta estirar"],
  b9: ["Boca arriba, lumbar pegada al piso", "Brazo y pierna opuestos, lento", "No arquees la espalda al estirar"],
  b11: ["Pecho al pad de la máquina", "Sube solo hasta la línea del cuerpo", "Sin pasar de neutro ni cargar la lumbar"],
  c1: ["Una pierna en la plataforma", "Lumbar pegada, baja a 90°", "No bloquees la rodilla arriba"],
  c2: ["De pie, una pierna en la máquina", "Lleva el talón hacia el glúteo", "Cadera quieta, sin arquear"],
  c3: ["Una pierna en el rodillo", "Pausa 1 seg arriba", "Baja sin soltar de golpe"],
  c4: ["Boca arriba, mancuerna en la cadera", "Aprieta el glúteo 1 seg arriba", "La lumbar no se despega de más"],
  c5: ["Acostado de lado, apoyado", "Sube la pierna de arriba sin girar la cadera", "Baja controlado"],
  c6: ["Polea baja en el tobillo", "Cruza la pierna hacia adentro", "Tronco quieto, sin inclinarte"],
  c7: ["De rodillas frente a la polea alta", "Flexiona el tronco, cadera quieta", "Vuelve lento, sin tirar de la lumbar"],
  c8: ["De pie en la máquina, lumbar neutra", "Sube al máximo y pausa", "Baja hasta estirar, sin rebote"],
  c11: ["Polea baja, una pierna atrás", "Empuja y aprieta el glúteo", "Tronco apoyado, sin arquear"],
  c12: ["Empuja hacia arriba, no al frente", "Resiste el giro con los brazos arriba", "Cadera quieta, sin flexión lumbar"],
  c9: ["Rodillas y antebrazos apoyados", "Cadera en línea con el tronco", "Glúteo apretado y respira"],
  c10: ["Lleva las rodillas hacia el pecho", "Lumbar pegada, sin impulso", "Baja las piernas con control"],
  h1: ["Polea a la altura del codo", "Codo pegado al torso, toalla si hace falta", "Gira el antebrazo hacia afuera, lento", "Peso bajo, sin dolor arriba de 3/10"],
  h2: ["Sentado, polea a la altura del codo", "Codo pegado al costado", "Gira el antebrazo hacia el abdomen", "Peso ligero, hombro abajo"],
  h3: ["Polea baja, pulgar arriba", "Sube en el plano escapular solo hasta 60°", "Sentado, lumbar en el respaldo"],
  h4: ["Polea al costado, brazo pegado al torso", "Empuja suave hacia afuera y sostén", "No subas el brazo ni busques pinchar"],
  h5: ["Banda anclada a la altura de la cara", "Codos altos, separa las manos al final", "Ligero: sigue siendo calentamiento"],
  a1r: ["Banco plano con mancuernas", "Baja solo hasta el nivel del pecho", "Escápulas atrás y lumbar apoyada"],
  a6r: ["Máquina inclinada, espalda al pad", "No bajes más que el pecho", "Sin rebote al fondo"],
  a3r: ["Máquina, palmas enfrentadas si el agarre lo permite", "Lumbar pegada todo el tiempo", "Para si pasa de 3/10"],
  a5r: ["Polea baja, pulgar arriba", "Hasta 60° y en el plano escapular", "Sentado, con el respaldo puesto"],
  a12r: ["Banda a la altura de la cara", "Separa las manos al final y aprieta 1 seg", "Sin arquear la lumbar"],
  a13r: ["Polea baja, un brazo, peso ligero", "Sube lateral solo hasta el hombro", "Sentado o con la lumbar apoyada", "Codos suaves, sin encoger el trapecio"],
  b1r: ["Un brazo, agarre neutro", "El codo viaja al bolsillo", "El hombro no se va hacia la oreja"],
  b2r: ["Pecho al pad, agarre neutro", "Aprieta escápulas al final", "Al volver no dejes salir el hombro"],
  b3r: ["Polea baja, un brazo, neutro", "Mano o rodilla apoyada, espalda neutra", "Codo pegado, sin rotar el tronco"],
  b4r: ["Pecho al pad, una mancuerna", "Agarre neutro hacia la cadera", "Abajo no estires el hombro al frente"],
  b10r: ["Banda en la barra, palmas enfrentadas", "Sube sin colgarte del todo abajo", "Hombros lejos de las orejas"],
  b12r: ["Banda, codo a la altura del hombro", "Gira el antebrazo hacia arriba, lento", "Ligero y sin pinchazo"],
};

export const OPT_CUES = {
  c10: {
    flat: ["Banco plano, no declinado", "Lumbar pegada al banco", "Sube la pelvis, no el pecho", "Si las reps se estancan, pasa al declive"],
    dec10: ["Banco en declive de unos 10°", "Lumbar pegada en todo el recorrido", "Sube la pelvis con control", "Baja lento, sin despegar la espalda"],
  },
};

export function stampVariante(ex) {
  if (!ex) return ex;
  const alt = ALT_CUES[ex.id];
  if (ex.alt && alt) ex.alt.cues = alt;
  const opts = OPT_CUES[ex.id];
  if (ex.opts && opts) ex.opts.forEach((o) => { if (opts[o.id]) o.cues = opts[o.id]; });
  return ex;
}
