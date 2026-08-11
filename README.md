# Tracker de entrenamiento

App personal de hipertrofia + trote. React + Vite, datos en Supabase, IA vía función serverless en Vercel.

## Correr en local (Cursor)
```bash
npm install
cp .env.example .env.local   # llena tus datos de Supabase (opcional: sin esto corre 100% local)
npm run dev
```
Abre la URL que imprime (normalmente http://localhost:5173). Aparece también una URL de red para abrirla desde el celular en el mismo wifi.

## Estructura
- `src/App.jsx` — la app completa. Los datos históricos son constantes `SEED_*` arriba del archivo.
- `src/cloud.js` — capa de datos: `window.storage` con cache local + sync a Supabase, y redirección de la IA a `/api/ai`.
- `src/Login.jsx` — pantalla de entrada por nombre.
- `api/ai.js` — función de Vercel que llama a Claude con la key del servidor.
- `schema.sql` — tabla de Supabase.
- `.cursorrules` — contexto del proyecto para la IA de Cursor. Léelo antes de pedir cambios grandes.

## Desplegar
Push a GitHub → Vercel detecta Vite y publica solo. Variables en Vercel:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` (build)
- `ANTHROPIC_API_KEY` (solo servidor, para la IA)

## Comandos útiles
```bash
npm run build     # verifica que todo compila
npm run preview   # sirve el build de producción
```
