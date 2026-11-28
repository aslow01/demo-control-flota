// El encabezado de lámina del escritorio (docs/diseno-ui.md, 15.4.3 y 15.9): el código de cada pantalla («FL-01» a «FL-09») y, en la ficha y el parte, el enlace al padre. Sin DOM.
// El código es presentación (va con `aria-hidden`: no agrega nada a lo que ya dice el `h1`) y no es parte del `h1`. Las rutas que no son pantallas no tienen.
import { aHash, nombreDePantalla, type Ruta } from "../lib/estado/enrutador.ts";
import { TEXTO_NAVEGACION } from "./textos-marco.ts";

/** El enlace de vuelta: `texto` es lo que se ve («Operación»); `nombreAccesible`, lo que dice el lector («Volver a Operación diaria»). */
export interface PadreDeLamina {
  href: string;
  texto: string;
  nombreAccesible: string;
}

const CODIGOS: Partial<Record<Ruta["tipo"], string>> = {
  inicio: "FL-01",
  movilidades: "FL-02",
  vencimientos: "FL-03",
  operacion: "FL-04",
  unidad: "FL-05",
  parte: "FL-06",
  conductor: "FL-07",
  "mis-partes": "FL-08",
  mas: "FL-09",
};

/** `null` en una dirección que no corresponde a ninguna pantalla. */
export function codigoDeLamina(ruta: Ruta): string | null {
  return CODIGOS[ruta.tipo] ?? null;
}

/** El enlace al padre (`app.padre`): el texto corto de la navegación en Operación diaria y el nombre de la pantalla en las demás. */
export function padreDeLamina(padre: Ruta): PadreDeLamina {
  const nombre = nombreDePantalla(padre);
  return { href: aHash(padre), texto: padre.tipo === "operacion" ? TEXTO_NAVEGACION.operacionCorto : nombre, nombreAccesible: TEXTO_NAVEGACION.volverA(nombre) };
}
