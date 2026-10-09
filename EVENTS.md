# Eventos de uso (ENTRENO)

Cada llamada a `track(nombre, props)` inserta una fila en `public.events`. El módulo no bloquea la app: si el insert falla, el evento queda en `localStorage` (`entreno_events_q_v1`, máximo 40 y ~48 KB) y se reintenta al siguiente evento, al volver a primer plano o al recuperar la red.

Columnas que manda el cliente: `event_name`, `props`, `client_ts`, `local_date` (día civil del dispositivo), `tz` (IANA, por ejemplo `America/Mexico_City`), `session_id`, `app_version`. `id` y `server_ts` los pone Postgres. El insert usa `return=minimal` (anon no puede leer).

`props` solo admite booleanos, números finitos y textos de una línea de hasta 64 caracteres, con claves `snake_case`. Se descartan notas, pesos, reps, nombres, correos, tokens y cualquier texto libre.

| Evento | Cuándo | Props |
| --- | --- | --- |
| `app_abierta` | La app deja de estar en “Cargando…”, una vez por carga | `pantalla`: `home`, `gym` o `running` |
| `pantalla_vista` | Cambia la sección visible (HOME / GYM / RUNNING). No se repite al pasar de sesión a cierre dentro de GYM | `pantalla` |
| `sesion_iniciada` | Empieza un día de pesas (no al reanudar el mismo borrador) | `dia`: `A`, `B` o `C` |
| `sesion_terminada` | Toca “Terminar sesión” | `dia`, `duracion_min` (desde que empezó, también tras recargar), `series_hechas`, `series_plan`, `en_regreso` |
| `sesion_abandonada` | Empieza otro día y el borrador anterior ya tenía series hechas, o se descarta así | `dia` del día dejado, `series_hechas` |
| `sesion_borrada` | Borra una sesión del historial en GYM | `dia` |
| `serie_completada` | Marca una serie hecha (✓) | `ex` (id del catálogo, p. ej. `c1`), `dia` |
| `serie_deshecha` | Quita el ✓ de una serie | `ex`, `dia` |
| `ejercicio_cambiado` | ⇄ de variante, o un chip de opción (Plana / Declive) | `ex`, `dia`, `opcion`: `main`, `alt`, o el id de la opción (`flat`, `dec10`) |
| `nota_guardada` | Guarda una nota no vacía y distinta a la anterior. Nunca el texto | `ambito`: `gym` o `running`. `ex` si es de un ejercicio o de un slot de running (`res`, `pot`, `lar`). La nota de la sesión de pesas no lleva `ex` |
| `video_abierto` | Toca el enlace de YouTube del ejercicio | `ex` (no la búsqueda) |
| `info_abierta` | Abre el panel ⓘ. No al cerrarlo | `ex`, `dia` |
| `unidad_cambiada` | Cambia lb/kg en un ejercicio | `ex`, `unidad`: `lb` o `kg` |
| `regreso_activado` | El modo regreso queda activo para un episodio, una vez por id (sobrevive recarga) | `origen`: `auto` o `manual`, `dias_hueco`, `semanas` |
| `regreso_entendido` | Toca Entendido y el banner se pliega | — |
| `regreso_apagado` | Toca × y apaga el episodio | `origen` |
| `regreso_reactivado` | Vuelve a encender un episodio apagado | `origen` |
| `regreso_saltado` | Salta la semana de regreso | — |
| `regreso_deshecho` | Deshace ese salto | — |
| `running_sugerencia_oculta` | Oculta la sugerencia de trote de regreso | — |
| `running_sugerencia_mostrada` | La vuelve a mostrar | — |
| `trote_registrado` | Confirma una corrida (como el plan, o minutos a mano) | `min` |
| `tema_cambiado` | Cambia el tema | `modo`: `system`, `light` o `dark` |
| `error_guardado` | El caché no confirmó el guardado de la sesión de pesas | `dia` |
| `cambio_feedback` | Responde “¿Te sirvió el cambio?” (una vez por cambio). El texto libre no viaja aquí: queda en `estado.datos` (`gymu_cambio_fb_v1`) | `cambio_id`, `util` (`true`/`false`). `ex` solo si el cambio es de un ejercicio |
