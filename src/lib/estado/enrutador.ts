// Enrutador por hash (docs/diseno-ui.md, sección 2; decisión S4). Puro: recibe y devuelve texto y datos, no toca la
// ventana. El hash es entrada externa (cualquiera puede escribirlo en la barra): se acota, se valida y NUNCA se repite
// tal cual en la interfaz; una ruta que no se entiende es `desconocida` y no guarda lo que se escribió.
//
// Dos ideas que importan para la vista:
//  - La «pantalla» (`clavePantalla`) es a dónde se llegó: cambia el foco al título y sube la página. La «consulta»
//    (`claveConsulta`: `?filtro=` y `&q=`) es lo que se muestra dentro de esa pantalla: no mueve ni foco ni desplazamiento.
//  - Las rutas viejas (`#/alertas`, `#/flota…`, `#/operacion`) se entienden y se reescriben a la forma nueva.

import { formatearPatente, formatoDePatente, normalizarPatente } from "../dominio/patente.ts";
import { formatearFechaConDia, parsearFechaCivil } from "../dominio/fechas.ts";
import { NOMBRES_DE_PANTALLA as NOMBRES } from "../dominio/textos.ts";
import type { FechaCivil, Perfil } from "../dominio/tipos.ts";

/**
 * Filtros de Movilidades que pueden viajar en la ruta. Son los ids de siempre; en la dirección se escriben con el vocabulario nuevo
 * (`FILTRO_EN_RUTA`) y los valores viejos se siguen entendiendo. «activas» es el de por defecto y no viaja. `no-disponibles` junta
 * «bloqueadas» y «fuera de servicio»: es el que usa «Ver las N no disponibles en Movilidades» de Inicio.
 */
export const FILTROS_DE_FLOTA_EN_RUTA = ["pueden-salir", "no-pueden-salir", "fuera-de-servicio", "de-baja", "no-disponibles"] as const;
export type FiltroDeFlotaEnRuta = (typeof FILTROS_DE_FLOTA_EN_RUTA)[number];

/** Cómo se escribe cada filtro de Movilidades en la dirección: `#/movilidades?filtro=bloqueadas`. */
const FILTRO_EN_RUTA: Record<FiltroDeFlotaEnRuta, string> = {
  "pueden-salir": "disponibles",
  "no-pueden-salir": "bloqueadas",
  "fuera-de-servicio": "fuera",
  "de-baja": "baja",
  "no-disponibles": "no-disponibles",
};

/** Filtros de Vencimientos en la ruta (`?filtro=`). «todos» es el de por defecto y no viaja. */
export const FILTROS_DE_VENCIMIENTOS_EN_RUTA = ["vencidos", "proximos", "7", "15", "30"] as const;
export type FiltroDeVencimientosEnRuta = (typeof FILTROS_DE_VENCIMIENTOS_EN_RUTA)[number];

/** Las dos solapas de Operación diaria (`#/operacion/checklists`, `#/operacion/novedades`). */
export const SOLAPAS_DE_OPERACION = ["checklists", "novedades"] as const;
export type SolapaDeOperacion = (typeof SOLAPAS_DE_OPERACION)[number];

export type Ruta =
  | { tipo: "inicio" }
  /** `q` es lo escrito en el buscador, tal cual (sin `trim`: la dirección sigue lo que se tipea). */
  | { tipo: "movilidades"; filtro?: FiltroDeFlotaEnRuta; q?: string }
  | { tipo: "unidad"; patente: string }
  | { tipo: "vencimientos"; filtro?: FiltroDeVencimientosEnRuta }
  | { tipo: "operacion"; solapa: SolapaDeOperacion }
  /** «Hoy» del conductor. */
  | { tipo: "conductor" }
  | { tipo: "mis-partes" }
  | { tipo: "parte"; patente: string; fecha: FechaCivil }
  | { tipo: "mas" }
  /** Una ruta que no existe o está mal escrita: la pantalla muestra el estado de error. */
  | { tipo: "desconocida" };

/** Lo que devuelve `parsearHash` antes de mirar el perfil: `sin-ruta` es un hash vacío (no la pantalla Inicio). */
export type RutaLeida = Ruta | { tipo: "sin-ruta" };

const LARGO_MAXIMO_HASH = 200;
/** Lo que se lee de `q`: más largo se corta. El buscador de Movilidades debería tener este `maxlength`. */
export const LARGO_MAXIMO_BUSQUEDA = 60;
/** `q` ya codificado nunca pasa de esto, para que la dirección entera no supere `LARGO_MAXIMO_HASH` (con el filtro más largo quedan 188). */
const LARGO_MAXIMO_BUSQUEDA_CODIFICADA = 150;
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

/** El texto de `q` acotado: sin caracteres de control ni de reemplazo, hasta `LARGO_MAXIMO_BUSQUEDA` caracteres y codificable en `LARGO_MAXIMO_BUSQUEDA_CODIFICADA`. */
function acotarBusqueda(texto: string): string {
  const letras = Array.from(texto.replace(/[\p{Cc}�]/gu, "")).slice(0, LARGO_MAXIMO_BUSQUEDA);
  while (letras.length > 0 && encodeURIComponent(letras.join("")).length > LARGO_MAXIMO_BUSQUEDA_CODIFICADA) letras.pop();
  return letras.join("");
}

/** El filtro de Movilidades de `?filtro=…`: el valor nuevo o el viejo; cualquier otra cosa se ignora y no se repite en ningún lado. */
function filtroDeMovilidades(consulta: URLSearchParams): FiltroDeFlotaEnRuta | null {
  const valor = consulta.get("filtro");
  return FILTROS_DE_FLOTA_EN_RUTA.find((f) => f === valor || FILTRO_EN_RUTA[f] === valor) ?? null;
}

function rutaDeMovilidades(consulta: URLSearchParams | null): Ruta {
  const ruta: Ruta = { tipo: "movilidades" };
  if (consulta === null) return ruta;
  const filtro = filtroDeMovilidades(consulta);
  if (filtro !== null) ruta.filtro = filtro;
  const q = acotarBusqueda(consulta.get("q") ?? "");
  if (q !== "") ruta.q = q;
  return ruta;
}

function rutaDeVencimientos(consulta: URLSearchParams | null): Ruta {
  const valor = consulta?.get("filtro");
  const filtro = FILTROS_DE_VENCIMIENTOS_EN_RUTA.find((f) => f === valor);
  return filtro === undefined ? { tipo: "vencimientos" } : { tipo: "vencimientos", filtro };
}

/**
 * Lee un hash. `hoy` completa `#/parte/PATENTE` (sin fecha es el parte de hoy); si no se lo pasa, esa dirección es desconocida: el enrutador
 * no inventa una fecha.
 */
export function parsearHash(hash: string, hoy?: FechaCivil): RutaLeida {
  if (hash.length > LARGO_MAXIMO_HASH) return DESCONOCIDA;
  const sinNumeral = hash.startsWith("#") ? hash.slice(1) : hash;
  if (sinNumeral === "" || sinNumeral === "/") return { tipo: "sin-ruta" };
  if (!sinNumeral.startsWith("/")) return DESCONOCIDA;

  const signo = sinNumeral.indexOf("?");
  const camino = signo === -1 ? sinNumeral : sinNumeral.slice(0, signo);
  const consulta = signo === -1 ? null : new URLSearchParams(sinNumeral.slice(signo + 1));

  const segmentos: string[] = [];
  for (const crudo of camino.slice(1).replace(/\/$/, "").split("/")) {
    const s = decodificar(crudo);
    if (s === null) return DESCONOCIDA;
    segmentos.push(s);
  }

  const [pantalla, a, b] = segmentos;
  // Solo Movilidades y Vencimientos admiten consulta; en las demás pantallas un `?` es una ruta que no se entiende.
  const conConsulta = segmentos.length === 1 && (pantalla === "movilidades" || pantalla === "flota" || pantalla === "vencimientos");
  if (consulta !== null && !conConsulta) return DESCONOCIDA;
  switch (segmentos.length) {
    case 1:
      if (pantalla === "inicio" || pantalla === "alertas") return { tipo: "inicio" };
      if (pantalla === "movilidades" || pantalla === "flota") return rutaDeMovilidades(consulta);
      if (pantalla === "vencimientos") return rutaDeVencimientos(consulta);
      if (pantalla === "operacion") return { tipo: "operacion", solapa: "checklists" };
      if (pantalla === "conductor") return { tipo: "conductor" };
      if (pantalla === "mas") return { tipo: "mas" };
      return DESCONOCIDA;
    case 2: {
      if (pantalla === "operacion") {
        const solapa = SOLAPAS_DE_OPERACION.find((s) => s === a);
        return solapa === undefined ? DESCONOCIDA : { tipo: "operacion", solapa };
      }
      if (pantalla === "conductor") return a === "partes" ? { tipo: "mis-partes" } : DESCONOCIDA;
      const patente = a === undefined ? null : patenteDeRuta(a);
      if (patente === null) return DESCONOCIDA;
      if (pantalla === "unidad") return { tipo: "unidad", patente };
      if (pantalla === "parte" && hoy !== undefined && hoy !== "") return { tipo: "parte", patente, fecha: hoy };
      return DESCONOCIDA;
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

/** La forma canónica del hash de una ruta (patente normalizada, sin espacios, vocabulario nuevo). */
export function aHash(ruta: Ruta): string {
  switch (ruta.tipo) {
    case "inicio":
      return "#/inicio";
    case "movilidades": {
      const q = acotarBusqueda(ruta.q ?? "");
      const partes = [...(ruta.filtro === undefined ? [] : [`filtro=${FILTRO_EN_RUTA[ruta.filtro]}`]), ...(q === "" ? [] : [`q=${encodeURIComponent(q)}`])];
      return partes.length === 0 ? "#/movilidades" : `#/movilidades?${partes.join("&")}`;
    }
    case "vencimientos":
      return ruta.filtro === undefined ? "#/vencimientos" : `#/vencimientos?filtro=${ruta.filtro}`;
    case "operacion":
      return `#/operacion/${ruta.solapa}`;
    case "conductor":
      return "#/conductor";
    case "mis-partes":
      return "#/conductor/partes";
    case "mas":
      return "#/mas";
    case "unidad":
      return `#/unidad/${ruta.patente}`;
    case "parte":
      return `#/parte/${ruta.patente}/${ruta.fecha}`;
    case "desconocida":
      return "#/";
  }
}

/** A qué pantalla se llegó: lo que, al cambiar, mueve el foco al título y sube la página. No incluye la consulta (`claveConsulta`). */
export function clavePantalla(ruta: Ruta): string {
  switch (ruta.tipo) {
    case "unidad":
      return `unidad/${ruta.patente}`;
    case "parte":
      return `parte/${ruta.patente}/${ruta.fecha}`;
    case "operacion":
      return `operacion/${ruta.solapa}`;
    default:
      return ruta.tipo;
  }
}

/** Lo que se está mostrando dentro de la pantalla (`filtro=baja&q=hilux`, o vacío): cambiarlo no es cambiar de pantalla. */
export function claveConsulta(ruta: Ruta): string {
  return aHash(ruta).split("?")[1] ?? "";
}

export function rutaPorDefecto(perfil: Perfil): Ruta {
  return perfil.tipo === "encargado" ? { tipo: "inicio" } : { tipo: "conductor" };
}

/** Qué perfil ve qué pantalla (diseno-ui.md, tabla de la sección 2): el parte y Más los ven los dos. */
function permitida(ruta: Ruta, perfil: Perfil): boolean {
  switch (ruta.tipo) {
    case "inicio":
    case "movilidades":
    case "unidad":
    case "vencimientos":
    case "operacion":
      return perfil.tipo === "encargado";
    case "conductor":
    case "mis-partes":
      return perfil.tipo === "conductor";
    case "parte":
    case "mas":
    case "desconocida":
      return true;
  }
}

/**
 * La ruta que hay que mostrar: la del hash si el perfil la puede ver; si no, la de inicio de su perfil (no se cambia de perfil por
 * escribir una dirección). Una ruta desconocida se muestra como error en cualquier perfil. `hoy` es el de `parsearHash`.
 */
export function resolverRuta(hash: string, perfil: Perfil, hoy?: FechaCivil): Ruta {
  const leida = parsearHash(hash, hoy);
  if (leida.tipo === "sin-ruta") return rutaPorDefecto(perfil);
  return permitida(leida, perfil) ? leida : rutaPorDefecto(perfil);
}

/**
 * Adónde lleva «Atrás» cuando no hay historia dentro de la aplicación, y la miga anterior: la ficha, a Movilidades; el parte, a Operación
 * diaria (encargado) o a Hoy (conductor). Las pantallas raíz (las de la barra) no tienen padre. Siempre es una ruta que ese perfil puede ver.
 */
export function rutaPadre(ruta: Ruta, perfil: Perfil): Ruta | null {
  switch (ruta.tipo) {
    case "unidad":
      return { tipo: "movilidades" };
    case "parte":
      return perfil.tipo === "conductor" ? { tipo: "conductor" } : { tipo: "operacion", solapa: "checklists" };
    default:
      return null;
  }
}

/** Un tramo de las migas: `ruta` es adónde lleva; `null` en el último (la pantalla de ahora, sin enlace). */
export interface Miga {
  nombre: string;
  ruta: Ruta | null;
}

/** Las migas de las pantallas que no son raíz (ficha, parte y las solapas de Operación); las raíz no llevan. */
export function migasDe(ruta: Ruta, perfil: Perfil): Miga[] {
  switch (ruta.tipo) {
    case "unidad":
      return [{ nombre: NOMBRES.movilidades, ruta: { tipo: "movilidades" } }, { nombre: nombreDePantalla(ruta), ruta: null }];
    case "parte": {
      const conductor = perfil.tipo === "conductor";
      return [
        { nombre: conductor ? NOMBRES.conductor : NOMBRES.operacion, ruta: rutaPadre(ruta, perfil) },
        { nombre: NOMBRES.parte, ruta: null },
      ];
    }
    case "operacion":
      return [
        { nombre: NOMBRES.operacion, ruta: { tipo: "operacion", solapa: "checklists" } },
        { nombre: nombreDeSolapa(ruta.solapa), ruta: null },
      ];
    default:
      return [];
  }
}

const SUFIJO_TITULO = "Control de flota (demo)";

function nombreDeSolapa(solapa: SolapaDeOperacion): string {
  return solapa === "checklists" ? NOMBRES.operacionChecklists : NOMBRES.operacionNovedades;
}

/** El nombre de la pantalla, sin el sufijo del título: lo que dice el `h1` de la barra y el aviso de cambio de pantalla. */
export function nombreDePantalla(ruta: Ruta): string {
  switch (ruta.tipo) {
    case "inicio":
      return NOMBRES.inicio;
    case "movilidades":
      return NOMBRES.movilidades;
    case "vencimientos":
      return NOMBRES.vencimientos;
    case "operacion":
      return NOMBRES.operacion;
    case "conductor":
      return NOMBRES.conductor;
    case "mis-partes":
      return NOMBRES.conductorPartes;
    case "mas":
      return NOMBRES.mas;
    case "unidad":
      return NOMBRES.unidad(formatearPatente(ruta.patente));
    case "parte":
      return NOMBRES.parteDelDia(formatearFechaConDia(ruta.fecha));
    case "desconocida":
      return NOMBRES.desconocida;
  }
}

/** `document.title` de cada pantalla (sección 2): "{Pantalla} · Control de flota (demo)"; en Operación diaria, el de la solapa. */
export function tituloDePagina(ruta: Ruta): string {
  return `${ruta.tipo === "operacion" ? nombreDeSolapa(ruta.solapa) : nombreDePantalla(ruta)} · ${SUFIJO_TITULO}`;
}
