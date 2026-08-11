# Arrancar en Cursor · paso a paso

## 1. Traer el proyecto (5 min)
Tienes dos caminos; el segundo es el bueno si quieres que Vercel publique solo.

**A. Rápido:** descomprime el zip donde guardes tus proyectos y en Cursor: File → Open Folder → elige la carpeta.

**B. Con Git (recomendado):** en tu repo `tracker` de GitHub, borra el `index.html` viejo. Luego en Cursor:
```bash
git clone https://github.com/salmlevy/tracker.git
cd tracker
```
Copia dentro todos los archivos del zip y sigue abajo.

## 2. Instalar y correr (2 min)
En la terminal de Cursor (Ctrl+`):
```bash
npm install
npm run dev
```
Abre http://localhost:5173. La app ya funciona en modo local (sin nube).

Para probarla en tu celular mientras la editas: Vite imprime también una URL de red (`http://192.168.x.x:5173`), ábrela en Safari estando en el mismo wifi.

## 3. Conectar la nube (5 min)
1. Crea el proyecto en supabase.com, corre `schema.sql` en el SQL Editor.
2. Project Settings → API: copia Project URL y la clave `anon public`.
3. En Cursor: duplica `.env.example` como `.env.local` y pega los dos valores.
4. Reinicia `npm run dev`. Ahora la app pide nombre al entrar y sincroniza.

## 4. Publicar (5 min)
```bash
git add -A
git commit -m "App en Vite con nube e IA"
git push
```
En vercel.com → Add New Project → importa `tracker` → en Environment Variables agrega `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` y (si quieres IA) `ANTHROPIC_API_KEY` → Deploy.

Cada `git push` de ahí en adelante republica solo.

## 5. Trabajar con la IA de Cursor
El archivo `.cursorrules` ya carga el contexto del proyecto (restricción de columna, metodología de progresión, arquitectura). Pídele cosas concretas, por ejemplo:
- "Agrega un ejercicio de oblicuos al día C respetando las reglas de columna"
- "Haz que el anillo del HOME muestre también las caminatas"
- "Extrae los SEED_* de App.jsx a un archivo src/data.js sin cambiar comportamiento"

Consejo: pídele un cambio a la vez y corre `npm run build` entre cambios.
