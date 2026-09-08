/** Paleta ENTRENO: claro + oscuro. El acento rojo→naranja no cambia. */

export const LIGHT = {
  bg: "#EDEFF3", card: "#FFFFFF", card2: "#E3E7ED", line: "#CFD5DD",
  txt: "#0B0D10", mut: "#5B6470", dim: "#8A93A0",
  past: "#6E7684",
  acc: "#E8102E", accDark: "#FCE3E7", accText: "#FFFFFF",
  good: "#12B76A", goodDark: "#DFF5EA",
  warn: "#9A6B00", warnDark: "#F6ECCF",
  err: "#C81E1E", errDark: "#F8DEDE",
};

export const DARK = {
  bg: "#0B0D10", card: "#171B21", card2: "#222830", line: "#2E3540",
  txt: "#F3F5F7", mut: "#A7B0BA", dim: "#8B939E",
  past: "#9AA3AD",
  acc: "#E8102E", accDark: "#3D151C", accText: "#FFFFFF",
  good: "#12B76A", goodDark: "#153528",
  warn: "#E0B34A", warnDark: "#3A3014",
  err: "#F07070", errDark: "#3A1818",
};

export const C = { ...LIGHT };

export const THEME_KEY = "gymu_theme_v1";
const LS_KEY = "trk_" + THEME_KEY;

export function loadThemeMode() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return "system";
    const v = JSON.parse(raw);
    if (v === "light" || v === "dark" || v === "system") return v;
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {}
  return "system";
}

export function saveThemeMode(mode) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(mode)); } catch {}
}

export function resolvedTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function applyTheme(mode) {
  const resolved = resolvedTheme(mode);
  Object.assign(C, resolved === "dark" ? DARK : LIGHT);
  if (typeof document === "undefined") return resolved;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", C.bg);
  return resolved;
}
