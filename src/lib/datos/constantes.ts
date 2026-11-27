// Lo mínimo del ejemplo que el marco necesita desde el primer cuadro: el nombre de la empresa ficticia, quién firma como encargada y la
// versión del formato guardado. Vive aparte del generador (`generador.ts`, unos 33 kB de fuente) para que quien ya tiene la demo guardada no lo baje:
// el generador se pide con `import()` solo cuando hay que armar el ejemplo (`persistencia/arranque.ts`).

import type { Empresa } from "../dominio/tipos.ts";
import { armarCuit } from "./cuit.ts";

export const ENCARGADA = "Rocío Medina";

const cuit = armarCuit("30", "99000003");
if (cuit === null) throw new Error("CUIT ficticio inválido");
/** Empresa inventada; el CUIT es ficticio y tiene dígito verificador válido. */
export const EMPRESA: Empresa = { nombre: "Logística Andina Demo S.A.", cuit };

/** Versión del formato de los datos guardados (D7): si cambia, la demo se reinicia sola con un aviso. */
export const VERSION_ESQUEMA = 3;
