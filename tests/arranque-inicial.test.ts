// `public/arranque.js` es la copia mínima, en JavaScript clásico, de lo que `preferencias.ts` pone en <html> antes de montar: corre antes del primer pintado, sin esperar al módulo.
// Estas pruebas lo ejecutan contra un documento y un almacenamiento de mentira y exigen que dé lo mismo que el código de la aplicación (mismas claves, mismos valores, mismos atributos).
import { describe, expect, it } from "vitest";
import arranque from "../public/arranque.js?raw";
import { atributosDeLaPiel, CLAVES_DE_PREFERENCIAS, leerPreferencias } from "../src/lib/estado/preferencias.ts";

function correr(guardado: Record<string, string>, almacenRoto = false): Map<string, string> {
  const atributos = new Map<string, string>();
  const documento = { documentElement: { setAttribute: (nombre: string, valor: string) => void atributos.set(nombre, valor) } };
  const almacen = {
    getItem: (clave: string): string | null => {
      if (almacenRoto) throw new Error("almacenamiento bloqueado");
      return guardado[clave] ?? null;
    },
  };
  new Function("document", "localStorage", arranque)(documento, almacen);
  return atributos;
}

describe("public/arranque.js", () => {
  const temas = [undefined, "claro", "oscuro", "automatico", "Oscuro", "<script>", ""];
  const quietos = [undefined, "1", "0", "si", "true", ""];
  for (const tema of temas) {
    for (const quieto of quietos) {
      it(`tema ${JSON.stringify(tema)} y sin animaciones ${JSON.stringify(quieto)}: los mismos atributos que la aplicación`, () => {
        const guardado: Record<string, string> = {};
        if (tema !== undefined) guardado[CLAVES_DE_PREFERENCIAS.tema] = tema;
        if (quieto !== undefined) guardado[CLAVES_DE_PREFERENCIAS.sinAnimaciones] = quieto;
        const esperado = atributosDeLaPiel(leerPreferencias({ getItem: (clave) => guardado[clave] ?? null, setItem: () => {} }));
        const puestos = correr(guardado);
        expect(puestos.get("data-modo") ?? null).toBe(esperado.modo);
        expect(puestos.get("data-movimiento") ?? null).toBe(esperado.movimiento);
      });
    }
  }

  it("con el almacenamiento bloqueado no tira ni pone nada", () => {
    expect(correr({}, true).size).toBe(0);
  });
});
