// Bajar un trozo de código (`import()`): si no llega, el error dice por qué (sin red, plazo vencido o versión nueva) para que cada lugar elija su texto.
// Sin DOM: el reloj y la lista de recursos del navegador (`performance`) se pasan como dobles.
import { describe, expect, it } from "vitest";
import { bajar, causaDelFallo, ErrorDeDescarga, esVersionNueva, type MedioDeDescarga, type RecursoVisto } from "../src/lib/descarga.ts";

const URL_DEL_TROZO = "https://flota.example/assets/PantallaMas-abc123.js";
const FALLO_DE_CHROME = new TypeError(`Failed to fetch dynamically imported module: ${URL_DEL_TROZO}`);
const FALLO_DE_SAFARI = new TypeError("Importing a module script failed.");

const URL_DE_UNA_DEPENDENCIA = "https://flota.example/assets/textos-ficha-def456.js";
const URL_DE_LA_HOJA = "https://flota.example/assets/PantallaMas-xyz789.css";
/** El error de la precarga de Vite cuando no llega la hoja de estilos de un trozo (es un `Error`, no un `TypeError`, y nombra la hoja). */
const FALLO_DE_PRECARGA = new Error(`Unable to preload CSS for ${URL_DE_LA_HOJA}`);
const JS = "text/javascript";
const HTML = "text/html";

const recurso = (name: string, responseStatus: number, startTime = 10, contentType = responseStatus === 200 ? JS : ""): RecursoVisto => ({ name, responseStatus, startTime, contentType });
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

  it("el servidor contestó 200 con HTML (llegó el `index.html` en lugar del trozo): hay una versión nueva", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200, 10, HTML)])).toBe("version-nueva");
  });

  it("el trozo llegó bien (200, JavaScript) y lo que falló fue la red al pedir algo que el trozo necesita: es la red, no una versión nueva", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200), recurso(URL_DE_UNA_DEPENDENCIA, 0)])).toBe("red");
    // Tampoco si el navegador ni siquiera anotó la dependencia que no llegó.
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200)])).toBe("red");
  });

  it("el trozo llegó bien pero una dependencia suya ya no existe (404, o el `index.html` en su lugar): hay una versión nueva", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200), recurso(URL_DE_UNA_DEPENDENCIA, 404)])).toBe("version-nueva");
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200), recurso(URL_DE_UNA_DEPENDENCIA, 200, 10, HTML)])).toBe("version-nueva");
  });

  it("un servidor que falla (500, 503) o que rechaza (403) no es una versión nueva: solo el 404 y el `index.html` dicen que el trozo ya no está", () => {
    for (const estado of [400, 403, 500, 502, 503]) expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, estado)]), String(estado)).toBe("red");
  });

  it("sin el tipo de contenido (un navegador que no lo anota) un 200 no alcanza: no se adivina", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 200, 10, "")])).toBe("red");
  });

  it("una hoja de estilos que ya no existe también dice que hay una versión nueva (cada pantalla tiene la suya); una imagen o una fuente, no", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 0), recurso(URL_DE_LA_HOJA, 404)])).toBe("version-nueva");
    expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 0), recurso(URL_DE_LA_HOJA, 200, 10, HTML)])).toBe("version-nueva");
    for (const otro of ["https://flota.example/og-inicio.png", "https://flota.example/assets/letra-abc123.woff2", "https://flota.example/assets/PantallaMas.css.map"]) {
      expect(causaDelFallo(FALLO_DE_CHROME, 5, [recurso(URL_DEL_TROZO, 0), recurso(otro, 404)]), otro).toBe("red");
    }
  });

  // La precarga del empaquetador pide primero la hoja de estilos de la pantalla y, si no llega, rechaza sin pedir el `import()`: el error es otro y nombra la hoja.
  describe("cuando lo que no llega es la hoja de estilos del trozo (el error de la precarga)", () => {
    it("la hoja ya no existe (404, o el `index.html` en su lugar): hay una versión nueva", () => {
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, 404)])).toBe("version-nueva");
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, 200, 10, HTML)])).toBe("version-nueva");
    });

    it("la hoja que nombra el error cuenta aunque el navegador la haya pedido antes; otra hoja anterior al pedido, no", () => {
      expect(causaDelFallo(FALLO_DE_PRECARGA, 50, [recurso(URL_DE_LA_HOJA, 404, 10)])).toBe("version-nueva");
      expect(causaDelFallo(FALLO_DE_PRECARGA, 50, [recurso("https://flota.example/assets/Otra-abc123.css", 404, 10)])).toBe("red");
    });

    it("el trozo de JavaScript que se precarga junto con la hoja también cuenta si ya no existe", () => {
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, 0), recurso(URL_DEL_TROZO, 404)])).toBe("version-nueva");
    });

    it("sin respuesta, con un error del servidor o sin el tipo de contenido es la red: no se adivina", () => {
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [])).toBe("red");
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, 0)])).toBe("red");
      for (const estado of [403, 500, 503]) expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, estado)]), String(estado)).toBe("red");
      expect(causaDelFallo(FALLO_DE_PRECARGA, 5, [recurso(URL_DE_LA_HOJA, 200, 10, "")])).toBe("red");
    });
  });

  it("el trozo que nombra el error cuenta aunque el navegador lo haya pedido antes (no lo volvió a pedir); otro `.js` anterior al pedido, no", () => {
    expect(causaDelFallo(FALLO_DE_CHROME, 50, [recurso(URL_DEL_TROZO, 404, 10)])).toBe("version-nueva");
    expect(causaDelFallo(FALLO_DE_CHROME, 50, [recurso(URL_DE_UNA_DEPENDENCIA, 404, 10)])).toBe("red");
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
    const sinLaHoja = bajar(() => Promise.reject(FALLO_DE_PRECARGA), { medio: medio([recurso(URL_DE_LA_HOJA, 404)]) });
    await expect(sinLaHoja).rejects.toMatchObject({ causa: "version-nueva", cause: FALLO_DE_PRECARGA });
  });

  // Sin la hoja de estilos la precarga rechaza antes de pedir el trozo, y de la hoja el navegador puede no dejar ver nada (con `nosniff` anota estado 0 aunque el servidor haya
  // contestado). Para saber del trozo se lo pide una vez más: la segunda vuelta ya no espera la hoja y el error, si lo hay, nombra el trozo.
  describe("cuando la precarga falla por la hoja de estilos", () => {
    const HOJA_SIN_DATOS = recurso(URL_DE_LA_HOJA, 0);

    /** Un `import()` que la primera vez falla por la hoja y la segunda hace lo que diga `segunda` (después de anotar `alSegundo` entre los recursos vistos). */
    function conLaHojaCaida<T>(segunda: () => Promise<T>, alSegundo: RecursoVisto[] = []) {
      const vistos = [HOJA_SIN_DATOS];
      let llamadas = 0;
      const cargar = (): Promise<T> => {
        llamadas += 1;
        if (llamadas === 1) return Promise.reject(FALLO_DE_PRECARGA);
        vistos.push(...alSegundo);
        return segunda();
      };
      return { cargar, medio: { ahora: () => 5, recursos: () => vistos } satisfies MedioDeDescarga, llamadas: () => llamadas };
    }

    it("vuelve a pedir el trozo: si ya no existe (el despliegue cambió el trozo y la hoja), hay una versión nueva aunque el trozo se haya anotado después de fallar la hoja", async () => {
      for (const delTrozo of [recurso(URL_DEL_TROZO, 404), recurso(URL_DEL_TROZO, 200, 10, HTML)]) {
        const caso = conLaHojaCaida(() => Promise.reject(FALLO_DE_CHROME), [delTrozo]);
        await expect(bajar(caso.cargar, { medio: caso.medio })).rejects.toMatchObject({ causa: "version-nueva", cause: FALLO_DE_CHROME });
        expect(caso.llamadas()).toBe(2);
      }
    });

    it("si el trozo tampoco llega y nadie contestó, es la red", async () => {
      const caso = conLaHojaCaida(() => Promise.reject(FALLO_DE_CHROME), [recurso(URL_DEL_TROZO, 0)]);
      await expect(bajar(caso.cargar, { medio: caso.medio })).rejects.toMatchObject({ causa: "red" });
    });

    it("si el trozo sí llega, igual rechaza (no se devuelve una pantalla sin sus estilos) con el error de la hoja; sin datos de la hoja, es la red", async () => {
      const caso = conLaHojaCaida(() => Promise.resolve("la pantalla"), [recurso(URL_DEL_TROZO, 200)]);
      await expect(bajar(caso.cargar, { medio: caso.medio })).rejects.toMatchObject({ causa: "red", cause: FALLO_DE_PRECARGA });
      expect(caso.llamadas()).toBe(2);
    });

    it("no pide una tercera vez", async () => {
      const caso = conLaHojaCaida(() => Promise.reject(FALLO_DE_PRECARGA));
      await expect(bajar(caso.cargar, { medio: caso.medio })).rejects.toMatchObject({ causa: "red" });
      expect(caso.llamadas()).toBe(2);
    });

    it("el plazo cubre las dos vueltas: si la segunda no responde, rechaza con la causa «plazo»", async () => {
      const caso = conLaHojaCaida(() => new Promise<never>(() => {}));
      await expect(bajar(caso.cargar, { plazoMs: 20, medio: caso.medio })).rejects.toMatchObject({ causa: "plazo" });
    });
  });

  it("un fallo que no es de la hoja de estilos no se vuelve a pedir (reintentar es de quien llama)", async () => {
    let llamadas = 0;
    const cargar = (): Promise<never> => {
      llamadas += 1;
      return Promise.reject(FALLO_DE_CHROME);
    };
    await expect(bajar(cargar, { medio: medio([recurso(URL_DEL_TROZO, 404)]) })).rejects.toMatchObject({ causa: "version-nueva" });
    expect(llamadas).toBe(1);
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
