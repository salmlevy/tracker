import assert from "node:assert/strict";
import { nextThemeMode, themeActionLabel } from "./theme.js";

assert.equal(nextThemeMode("system"), "light");
assert.equal(nextThemeMode("light"), "dark");
assert.equal(nextThemeMode("dark"), "system");
assert.equal(nextThemeMode("nope"), "light");

assert.equal(themeActionLabel("system"), "Tema: automático. Toca para claro");
assert.equal(themeActionLabel("light"), "Tema: claro. Toca para oscuro");
assert.equal(themeActionLabel("dark"), "Tema: oscuro. Toca para automático");

console.log("theme.test.js ok");
