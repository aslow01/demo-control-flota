// Enrutador por hash (docs/diseno-ui.md, sección 2; decisión S4). Puro: recibe y devuelve texto y datos, no toca la
// ventana. El hash es entrada externa (cualquiera puede escribirlo en la barra): se acota, se valida y NUNCA se repite
// tal cual en la interfaz; una ruta que no se entiende es `desconocida` y no guarda lo que se escribió.

import { formatearFechaConDia, parsearFechaCivil } from "../dominio/fechas.ts";
import { formatearPatente, formatoDePatente, normalizarPatente } from "../dominio/patente.ts";
import type { FechaCivil, Perfil } from "../dominio/tipos.ts";

export type Ruta =
  | { tipo: "alertas" }
  | { tipo: "flota" }
  | { tipo: "unidad"; patente: string }
  | { tipo: "conductor" }
  | { tipo: "parte"; patente: string; fecha: FechaCivil }
  /** Una ruta que no existe o está mal escrita: la pantalla muestra el estado de error. */
  | { tipo: "desconocida" };

/** Lo que devuelve `parsearHash` antes de mirar el perfil: sin ruta todavía. */
export type RutaLeida = Ruta | { tipo: "inicio" };

const LARGO_MAXIMO_HASH = 200;
const DESCONOCIDA: Ruta = { tipo: "desconocida" };

function decodificar(segmento: string): string | null {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return null; // %E0%A4%A y similares
  }
}

/** La patente de la ruta, normalizada, o `null` si no tiene un formato válido. */
function patenteDeRuta(texto: string): string | null {
  const patente = normalizarPatente(texto);
  return formatoDePatente(patente) === null ? null : patente;
}

export function parsearHash(hash: string): RutaLeida {
  if (hash.length > LARGO_MAXIMO_HASH) return DESCONOCIDA;
  const sinNumeral = hash.startsWith("#") ? hash.slice(1) : hash;
  if (sinNumeral === "" || sinNumeral === "/") return { tipo: "inicio" };
  if (!sinNumeral.startsWith("/")) return DESCONOCIDA;

  const segmentos: string[] = [];
  for (const crudo of sinNumeral.slice(1).replace(/\/$/, "").split("/")) {
    const s = decodificar(crudo);
    if (s === null) return DESCONOCIDA;
    segmentos.push(s);
  }

  const [pantalla, a, b] = segmentos;
  switch (segmentos.length) {
    case 1:
      if (pantalla === "alertas") return { tipo: "alertas" };
      if (pantalla === "flota") return { tipo: "flota" };
      if (pantalla === "conductor") return { tipo: "conductor" };
      return DESCONOCIDA;
    case 2: {
      const patente = pantalla === "unidad" && a !== undefined ? patenteDeRuta(a) : null;
      return patente === null ? DESCONOCIDA : { tipo: "unidad", patente };
    }
    case 3: {
      const patente = pantalla === "parte" && a !== undefined ? patenteDeRuta(a) : null;
      const fecha = b === undefined ? null : parsearFechaCivil(b);
      return patente === null || fecha === null ? DESCONOCIDA : { tipo: "parte", patente, fecha };
    }
    default:
      return DESCONOCIDA;
  }
}

/** La forma canónica del hash de una ruta (patente normalizada, sin espacios). */
export function aHash(ruta: Ruta): string {
  switch (ruta.tipo) {
    case "alertas":
      return "#/alertas";
    case "flota":
      return "#/flota";
    case "conductor":
      return "#/conductor";
    case "unidad":
      return `#/unidad/${ruta.patente}`;
    case "parte":
      return `#/parte/${ruta.patente}/${ruta.fecha}`;
    case "desconocida":
      return "#/";
  }
}

export function rutaPorDefecto(perfil: Perfil): Ruta {
  return perfil.tipo === "encargado" ? { tipo: "alertas" } : { tipo: "conductor" };
}

/** Qué perfil ve qué pantalla (diseno-ui.md, tabla de la sección 2): el parte lo ven los dos. */
function permitida(ruta: Ruta, perfil: Perfil): boolean {
  switch (ruta.tipo) {
    case "alertas":
    case "flota":
    case "unidad":
      return perfil.tipo === "encargado";
    case "conductor":
      return perfil.tipo === "conductor";
    case "parte":
    case "desconocida":
      return true;
  }
}

/**
 * La ruta que hay que mostrar: la del hash si el perfil la puede ver; si no, la de inicio de su perfil. Una ruta
 * desconocida se muestra como error en cualquier perfil.
 */
export function resolverRuta(hash: string, perfil: Perfil): Ruta {
  const leida = parsearHash(hash);
  if (leida.tipo === "inicio") return rutaPorDefecto(perfil);
  return permitida(leida, perfil) ? leida : rutaPorDefecto(perfil);
}

const SUFIJO_TITULO = "Control de flota (demo)";

/** `document.title` de cada pantalla (sección 2): "{Pantalla} · Control de flota (demo)". */
export function tituloDePagina(ruta: Ruta): string {
  let pantalla: string;
  switch (ruta.tipo) {
    case "alertas":
      pantalla = "Centro de alertas";
      break;
    case "flota":
      pantalla = "Flota";
      break;
    case "unidad":
      pantalla = `Unidad ${formatearPatente(ruta.patente)}`;
      break;
    case "conductor":
      pantalla = "Parte diario";
      break;
    case "parte":
      pantalla = `Parte del ${formatearFechaConDia(ruta.fecha)}`;
      break;
    case "desconocida":
      pantalla = "Página no encontrada";
      break;
  }
  return `${pantalla} · ${SUFIJO_TITULO}`;
}
