// Bajar un trozo de código (`import()`): si no llega, el error dice por qué (sin red, plazo vencido o versión nueva) para que cada lugar elija su texto.
// Sin DOM: el reloj y la lista de recursos del navegador (`performance`) se pasan como dobles.
import { describe, expect, it } from "vitest";
import { bajar, causaDelFallo, ErrorDeDescarga, esVersionNueva, type MedioDeDescarga, type RecursoVisto } from "../src/lib/descarga.ts";

const URL_DEL_TROZO = "https://flota.example/assets/PantallaMas-abc123.js";
const FALLO_DE_CHROME = new TypeError(`Failed to fetch dynamically imported module: ${URL_DEL_TROZO}`);
const FALLO_DE_SAFARI = new TypeError("Importing a module script failed.");

const recurso = (name: string, responseStatus: number, startTime = 10): RecursoVisto => ({ name, responseStatus, startTime });
const medio = (recursos: RecursoVisto[]): MedioDeDescarga => ({ ahora: () => 5, recursos: () => recursos });

describe("causaDelFallo", () => {
  it("sin ningún recurso visto (la conexión se cortó antes de la respuesta) es la red", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [])).toBe("red");
  });

  it("un pedido que el navegador anotó sin respuesta (estado 0) es la red", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 0)])).toBe("red");
  });

  it("el servidor contestó 404 al trozo que nombra el error: hay una versión nueva", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 404)])).toBe("version-nueva");
  });

  it("el servidor contestó 200 pero el trozo no se pudo cargar (llegó el index en su lugar): hay una versión nueva", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200)])).toBe("version-nueva");
  });

  it("si el error no trae la dirección (Safari), alcanza con un .js posterior al pedido que dio 404", () => {
    expect(causaDelFallo(FALLO_DE_SAFARI, 5, [recurso("https://flota.example/assets/otro.js", 200), recurso(URL_DEL_TROZO, 404)])).toBe("version-nueva");
  });

  it("si el error no trae la dirección y nada dio error, es la red (no se adivina)", () => {
    expect(causaDelFallo(FALLO_DE_SAFARI, 5, [recurso(URL_DEL_TROZO, 200)])).toBe("red");
  });

  it("un recurso anterior al pedido no cuenta", () => {
    expect(causaDelFallo(FALLO_DE_SAFARI, 50, [recurso(URL_DEL_TROZO, 404, 10)])).toBe("red");
  });

  it("un error que no es de descarga (el trozo llegó y falló al ejecutarse) no es una versión nueva", () => {
    expect(causaDelFallo(new TypeError("x is not a function"), 5, [recurso(URL_DEL_TROZO, 200)])).toBe("red");
    expect(causaDelFallo("texto suelto", 5, [recurso(URL_DEL_TROZO, 404)])).toBe("red");
  });
});

describe("bajar", () => {
  it("devuelve lo que trae el import", async () => {
    expect(await bajar(async () => 42, { medio: medio([]) })).toBe(42);
  });

  it("si falla, rechaza con un ErrorDeDescarga que dice la causa", async () => {
    const sinRed = bajar(() => Promise.reject(FALLO_DE_CHROME), { medio: medio([]) });
    await expect(sinRed).rejects.toBeInstanceOf(ErrorDeDescarga);
    await expect(sinRed).rejects.toMatchObject({ causa: "red" });
    const nueva = bajar(() => Promise.reject(FALLO_DE_CHROME), { medio: medio([recurso(URL_DEL_TROZO, 404)]) });
    await expect(nueva).rejects.toMatchObject({ causa: "version-nueva" });
  });

  it("un ErrorDeDescarga que ya viene hecho se deja como está", async () => {
    const hecho = new ErrorDeDescarga("version-nueva");
    await expect(bajar(() => Promise.reject(hecho), { medio: medio([]) })).rejects.toBe(hecho);
  });

  it("un import que lanza sin devolver una promesa también es un error de descarga", async () => {
    const lanza = (): Promise<never> => {
      throw new Error("sin red");
    };
    await expect(bajar(lanza, { medio: medio([]) })).rejects.toMatchObject({ causa: "red" });
  });

  it("con plazo: si el import no responde, rechaza con la causa «plazo» y no espera más", async () => {
    const colgado = new Promise<never>(() => {});
    await expect(bajar(() => colgado, { plazoMs: 20, medio: medio([]) })).rejects.toMatchObject({ causa: "plazo" });
  });

  it("con plazo: un import que llega a tiempo anda y no deja el plazo corriendo", async () => {
    expect(await bajar(async () => "listo", { plazoMs: 50, medio: medio([]) })).toBe("listo");
    await new Promise((resolver) => setTimeout(resolver, 80));
  });

  it("con plazo: un import que llega tarde se ignora (no rechaza dos veces ni escapa un rechazo sin atender)", async () => {
    const tarde = new Promise<string>((resolver) => setTimeout(() => resolver("tarde"), 60));
    await expect(bajar(() => tarde, { plazoMs: 10, medio: medio([]) })).rejects.toMatchObject({ causa: "plazo" });
    await tarde;
  });
});

describe("esVersionNueva", () => {
  it("solo es cierto para el error de descarga con esa causa", () => {
    expect(esVersionNueva(new ErrorDeDescarga("version-nueva"))).toBe(true);
    expect(esVersionNueva(new ErrorDeDescarga("red"))).toBe(false);
    expect(esVersionNueva(new ErrorDeDescarga("plazo"))).toBe(false);
    expect(esVersionNueva(new Error("otro"))).toBe(false);
    expect(esVersionNueva(undefined)).toBe(false);
  });
});
