// Escribir de punta a punta: lo que sirve para escribir (los comandos, la escritura de la ficha y la del parte) se baja con la pantalla o al usarla, y el cambio queda guardado.
// La ficha los baja recién al guardar; el parte, que escribe sin parar (autoguardado), los baja al abrirse.
import type { Page } from "@playwright/test";
import { esperarPantalla, verComoConductor } from "./ayuda.ts";
import { expect, test } from "./base.ts";
import { PATENTE, PATENTE_EN_PANTALLA } from "./ejemplo.ts";

const TROZO_DE_ESCRITURA = /\/assets\/(comandos|ficha-escritura|parte-escritura)-[^/]*\.js$/;

/** Anota los trozos de escritura que se piden desde ahora. */
function anotarTrozosDeEscritura(page: Page): string[] {
  const trozos: string[] = [];
  page.on("request", (r) => {
    const m = TROZO_DE_ESCRITURA.exec(r.url());
    if (m?.[1] !== undefined) trozos.push(m[1]);
  });
  return trozos;
}

test("poner una unidad fuera de servicio desde la ficha baja los comandos y la escritura de la ficha recién al guardar", async ({ page }) => {
  const trozos = anotarTrozosDeEscritura(page);

  await page.goto(`/#/unidad/${PATENTE}`);
  await esperarPantalla(page, PATENTE_EN_PANTALLA);
  expect(trozos, "al abrir la ficha todavía no se bajó nada para escribir").toEqual([]);

  await page.getByRole("button", { name: "Poner fuera de servicio" }).click();
  const dialogo = page.getByRole("dialog", { name: `Poner fuera de servicio: ${PATENTE_EN_PANTALLA}` });
  await dialogo.getByRole("textbox", { name: "Motivo" }).fill("En taller: cambio de embrague");
  await dialogo.getByRole("button", { name: "Poner fuera de servicio" }).click();

  await expect(page.getByRole("status").filter({ hasText: `${PATENTE_EN_PANTALLA} está fuera de servicio.` })).toBeVisible();
  expect(trozos.sort()).toEqual(["comandos", "ficha-escritura"]);

  await page.reload();
  await esperarPantalla(page, PATENTE_EN_PANTALLA);
  await expect(page.getByText("Fuera de servicio").first()).toBeVisible();
});

test("el borrador de un parte se guarda solo, sobrevive a recargar y se puede descartar; el parte baja sus trozos de escritura al abrirse", async ({ page }) => {
  const trozos = anotarTrozosDeEscritura(page);
  await page.goto("/#/inicio");
  await verComoConductor(page);
  expect(trozos, "en Hoy todavía no se bajó nada para escribir").toEqual([]);
  await page.getByRole("link", { name: "Empezar la revisión" }).click();
  await esperarPantalla(page, "Revisión antes de salir");
  expect(trozos.sort(), "el parte los baja al abrirse (importa la escritura del parte, que importa los comandos)").toEqual(["comandos", "parte-escritura"]);

  await page.getByRole("textbox", { name: "Al iniciar" }).fill("141800");
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado en este equipo." })).toBeVisible();

  await page.reload();
  await esperarPantalla(page, "Revisión antes de salir");
  await expect(page.getByRole("textbox", { name: "Al iniciar" })).toHaveValue("141.800");

  await page.getByRole("button", { name: "Descartar borrador" }).click();
  // Descartar es un botón de dos pasos: el segundo clic, a menos de 500 ms del primero, se ignora a propósito. En lugar de dormir un tiempo fijo, se repite el clic hasta que descarta.
  const confirmar = page.getByRole("button", { name: "Confirmar descarte" });
  await expect(confirmar).toBeVisible();
  await expect(async () => {
    await confirmar.click({ timeout: 1000 });
    await expect(page.getByRole("textbox", { name: "Al iniciar" })).toHaveValue("", { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
});
