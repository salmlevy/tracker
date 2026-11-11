import { expect, test } from "@playwright/test";

/* El dictado real de iOS no existe en Playwright. Estos eventos son los que
   Safari manda: composición, beforeinput insertReplacementText / insertFromDictation.
   Comprueban que un re-render no borra la frase y que queda guardada. */

async function abrirPush(page) {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) await ask.getByRole("radio", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
}

async function notaDe(page) {
  const card = page.locator("[data-ex-id]").first();
  const nota = card.locator("textarea.note-field");
  await expect(nota).toBeVisible();
  return { card, nota };
}

async function reabrir(card) {
  await card.getByRole("button", { name: "Cerrar ejercicio" }).click();
  await card.getByRole("button", { name: "Abrir ejercicio" }).click();
  return card.locator("textarea.note-field");
}

test("la composición deja el texto y sobrevive un re-render", async ({ page }, info) => {
  await abrirPush(page);
  const { card, nota } = await notaDe(page);
  await nota.evaluate((el) => {
    el.focus();
    el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
    el.value = "hó";
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "hó" }));
    el.value = "hombro";
    el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "hombro" }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "hombro" }));
  });
  await expect(nota).toHaveValue("hombro");
  await nota.blur();
  await expect(card.locator(".note-docked")).toHaveCount(0);
  if (info.project.name === "iphone-14-light-webkit") {
    await nota.evaluate((el) => {
      const sc = el.closest(".app-scroll");
      const head = document.querySelector(".sess-head");
      const bajo = head ? head.getBoundingClientRect().bottom : 0;
      if (!sc) return;
      sc.scrollTop += el.getBoundingClientRect().top - bajo - 24;
    });
    await page.screenshot({ path: "/opt/cursor/artifacts/dictado-composicion-iphone14.png" });
  }
  await card.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(nota).toHaveValue("hombro");
  const otra = await reabrir(card);
  await expect(otra).toHaveValue("hombro");
  const entero = await otra.evaluate((el) => el.value === "hombro" && el.scrollWidth <= el.clientWidth + 8);
  expect(entero).toBe(true);
});

test("insertReplacementText se queda en la nota después del render", async ({ page }) => {
  await abrirPush(page);
  const { card, nota } = await notaDe(page);
  await nota.evaluate((el) => {
    el.focus();
    const antes = el.value;
    el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertReplacementText", data: "polea al pecho" }));
    if (el.value === antes) el.setRangeText("polea al pecho", el.selectionStart || 0, el.selectionEnd || el.value.length, "end");
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: "polea al pecho" }));
  });
  await expect(nota).toHaveValue("polea al pecho");
  await nota.blur();
  await expect(card.locator(".note-docked")).toHaveCount(0);
  await card.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(nota).toHaveValue("polea al pecho");
  const otra = await reabrir(card);
  await expect(otra).toHaveValue("polea al pecho");
});

test("insertFromDictation usa data si el DOM aún no cambió", async ({ page }) => {
  await abrirPush(page);
  const { card, nota } = await notaDe(page);
  await nota.evaluate((el) => {
    el.focus();
    el.value = "ya";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertFromDictation", data: "codo a noventa" }));
  });
  await expect(nota).toHaveValue("ya codo a noventa", { timeout: 2000 });
  await nota.blur();
  const otra = await reabrir(card);
  await expect(otra).toHaveValue("ya codo a noventa");
});
