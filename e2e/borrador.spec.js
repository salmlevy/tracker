import { expect, test } from "@playwright/test";

async function empezar(page, dia, nombre) {
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: dia }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const hombro = page.locator("[data-hombro-ask]");
  if (await hombro.count()) await hombro.getByRole("radio", { name: "No" }).click();
  const molestia = page.locator("[data-molestia-ask]");
  if (await molestia.count()) await molestia.getByRole("radio", { name: "No" }).click();
  const dolor = page.locator("[data-dolor-inicio]");
  if (await dolor.count()) await dolor.getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Empezar " + nombre }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
}

async function marcarUna(page) {
  const fila = page.locator("[data-serie-check]").first();
  await fila.scrollIntoViewIfNeeded();
  await fila.click();
}

async function guardar(page) {
  await page.getByRole("button", { name: "Terminar sesión" }).click();
  const boton = page.locator("[data-guardar-sesion]");
  await boton.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const b = document.querySelector("[data-guardar-sesion]");
    b.click();
    b.click();
  });
  await expect(page.getByLabel("Guardado")).toBeVisible();
}

async function pageEvaluateHistory(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("trk_gymu_history_v1");
    const draft = localStorage.getItem("trk_gymu_draft_v4");
    const hist = raw ? JSON.parse(raw) : [];
    return {
      dias: hist.map((s) => s.day),
      fechas: hist.map((s) => String(s.date || "").slice(0, 10)),
      borrador: draft,
    };
  });
}

test("guardar el día C no deja un borrador que se vuelva a guardar con el día A", async ({ page }) => {
  await page.goto("/");
  await empezar(page, /Legs/, "Legs + Core");
  await marcarUna(page);
  await guardar(page);
  const trasC = await pageEvaluateHistory(page);
  expect(trasC.dias).toEqual(["C"]);
  expect(trasC.borrador).toBeNull();

  await page.reload();
  await page.locator("[data-tab='pesas']").click();
  await expect(page.locator(".sess-head")).toHaveCount(0);

  await empezar(page, /Push/, "Push");
  await marcarUna(page);
  await guardar(page);
  const trasA = await pageEvaluateHistory(page);
  expect(trasA.dias).toEqual(["C", "A"]);
  expect(trasA.borrador).toBeNull();
});
