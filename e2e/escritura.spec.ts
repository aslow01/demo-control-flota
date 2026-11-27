// Escribir de punta a punta: lo que sirve para escribir (los comandos, la escritura de la ficha y la del parte) se baja con la pantalla o al usarla, y el cambio queda guardado.
import { expect, test } from "@playwright/test";
import { esperarPantalla, verComoConductor } from "./ayuda.ts";

const TROZO_DE_ESCRITURA = /\/assets\/(comandos|ficha-escritura|parte-escritura)-[^/]*\.js$/;

test("poner una unidad fuera de servicio desde la ficha baja los comandos y la escritura de la ficha recién al guardar", async ({ page }) => {
  const trozos: string[] = [];
  page.on("request", (r) => {
    const m = TROZO_DE_ESCRITURA.exec(r.url());
    if (m?.[1] !== undefined) trozos.push(m[1]);
  });

  await page.goto("/#/unidad/ZYN469");
  await esperarPantalla(page, "ZYN 469");
  expect(trozos, "al abrir la ficha todavía no se bajó nada para escribir").toEqual([]);

  await page.getByRole("button", { name: "Poner fuera de servicio" }).click();
  const dialogo = page.getByRole("dialog", { name: "Poner fuera de servicio: ZYN 469" });
  await dialogo.getByRole("textbox", { name: "Motivo" }).fill("En taller: cambio de embrague");
  await dialogo.getByRole("button", { name: "Poner fuera de servicio" }).click();

  await expect(page.getByRole("status").filter({ hasText: "ZYN 469 está fuera de servicio." })).toBeVisible();
  expect(trozos.sort()).toEqual(["comandos", "ficha-escritura"]);

  await page.reload();
  await esperarPantalla(page, "ZYN 469");
  await expect(page.getByText("Fuera de servicio").first()).toBeVisible();
});

test("el borrador de un parte se guarda solo, sobrevive a recargar y se puede descartar", async ({ page }) => {
  await page.goto("/#/inicio");
  await verComoConductor(page);
  await page.getByRole("link", { name: "Empezar la revisión" }).click();
  await esperarPantalla(page, "Revisión antes de salir");

  await page.getByRole("textbox", { name: "Al iniciar" }).fill("141800");
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado en este equipo." })).toBeVisible();

  await page.reload();
  await esperarPantalla(page, "Revisión antes de salir");
  await expect(page.getByRole("textbox", { name: "Al iniciar" })).toHaveValue("141.800");

  await page.getByRole("button", { name: "Descartar borrador" }).click();
  // Descartar es un botón de dos pasos: el segundo clic, a menos de 500 ms del primero, se ignora a propósito.
  await expect(page.getByRole("button", { name: "Confirmar descarte" })).toBeVisible();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Confirmar descarte" }).click();
  await expect(page.getByRole("textbox", { name: "Al iniciar" })).toHaveValue("");
});
