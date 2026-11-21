import { expect, test } from "@playwright/test";

test("Navy sugiere mancuerna par y el press de hombros no pasa de 50 kg", async ({ page }, info) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const ancla = Date.parse("2026-11-13T18:00:00.000Z");
    const real = Date.now();
    const Orig = Date;
    function Fijada(...args) {
      const ahora = ancla + (Orig.now() - real);
      if (!new.target) return new Orig(ahora).toString();
      if (args.length === 0) return new Orig(ahora);
      return new Orig(...args);
    }
    Fijada.now = () => ancla + (Orig.now() - real);
    Fijada.parse = Orig.parse;
    Fijada.UTC = Orig.UTC;
    Fijada.prototype = Orig.prototype;
    window.Date = Fijada;
  });
  const serie = (w, r) => ({ w, r, f: true, done: true });
  const hist = [{
    date: "2026-11-12",
    day: "A",
    gymId: "gym-technogym",
    energy: "normal",
    logs: {
      a5: { v: "main", sets: [serie(25, 15), serie(25, 15), serie(25, 15)] },
      a3: { v: "main", sets: [serie(135, 12), serie(135, 12), serie(135, 12)] },
    },
  }];
  const gyms = [
    { id: "habitual", nombre: "EW", unidad: "lb", incremento: 5 },
    { id: "gym-technogym", nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5 },
  ];
  await page.addInitScript(({ histRaw, gymsRaw }) => {
    localStorage.setItem("trk_gymu_history_v1", histRaw);
    localStorage.setItem("trk_gymu_gyms_v1", gymsRaw);
    localStorage.setItem("trk_gymu_gym_sel_v1", JSON.stringify("gym-technogym"));
  }, { histRaw: JSON.stringify(hist), gymsRaw: JSON.stringify(gyms) });

  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const hombro = page.locator("[data-hombro-ask]");
  if (await hombro.count()) await hombro.getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();

  const a5 = page.locator("[data-ex-id='a5']");
  await a5.scrollIntoViewIfNeeded();
  const abrirA5 = a5.getByRole("button", { name: "Abrir ejercicio" });
  if (await abrirA5.count()) await abrirA5.click();
  const pesoA5 = a5.locator("[data-set-input='peso']");
  await expect(pesoA5).toBeVisible();
  const vA5 = Number(await pesoA5.inputValue());
  expect(vA5 % 2).toBe(0);
  expect(vA5).toBeGreaterThanOrEqual(2);
  expect(vA5).toBeLessThanOrEqual(32);
  if (info.project.name === "iphone-se-light-chromium") {
    await a5.screenshot({ path: "/opt/cursor/artifacts/mancuerna-sugerida-14kg-se.png" });
  }

  const a3 = page.locator("[data-ex-id='a3']");
  await a3.scrollIntoViewIfNeeded();
  const abrirA3 = a3.getByRole("button", { name: "Abrir ejercicio" });
  if (await abrirA3.count()) await abrirA3.click();
  const pesoA3 = a3.locator("[data-set-input='peso']");
  await expect(pesoA3).toBeVisible();
  const vA3 = Number(await pesoA3.inputValue());
  expect(vA3).toBeLessThanOrEqual(50);
  expect(vA3).toBeGreaterThan(0);
  if (info.project.name === "iphone-se-light-chromium") {
    await a3.screenshot({ path: "/opt/cursor/artifacts/a3-tope-50kg-se.png" });
  }
});
