// Arranque de la aplicación (docs/diseno.md, reglas D4 a D8 y D11): abre el almacenamiento, carga o genera el ejemplo y
// decide qué avisos hay que mostrar. No toca la interfaz ni el reloj: recibe `hoy` ya calculado y devuelve datos.

import { generar, VERSION_ESQUEMA } from "../datos/generador.ts";
import { sinCambios } from "../dominio/estado.ts";
import { parsearFechaCivil } from "../dominio/fechas.ts";
import type { Estado, FechaCivil, Meta, Perfil } from "../dominio/tipos.ts";
import { RepositorioMemoria } from "./memoria.ts";
import type { Repositorio } from "./repositorio.ts";

/** La semilla de la demo (docs/diseno.md 9.3): con ella el ejemplo es siempre el mismo. */
export const SEMILLA_POR_DEFECTO = 20261118;

/** D4: "Preparando la flota de ejemplo…" solo si el arranque tarda más que esto. */
export const UMBRAL_PREPARANDO_MS = 300;

/** Avisos globales que el arranque deja para la interfaz (los textos están en `textos.ts`). */
export type Aviso =
  /** D7: cambió la versión del formato y se volvió a cargar el ejemplo. */
  | { tipo: "esquema-actualizado" }
  /** D5: hay cambios del visitante sobre un ejemplo de otra fecha. */
  | { tipo: "datos-de-otra-fecha"; fechaBase: FechaCivil }
  /** D8: sin IndexedDB, la demo funciona en memoria y los cambios se pierden al cerrar la pestaña. */
  | { tipo: "sin-almacenamiento" };

export interface OpcionesArranque {
  /** Fecha civil de hoy en Argentina (la calcula el reloj). */
  hoy: FechaCivil;
  /** Abre el almacenamiento real (en el navegador, `abrirIndexedDB`). Puede rechazar: entonces se usa la memoria (D8). */
  abrirAlmacenamiento: () => Promise<Repositorio>;
  semilla?: number;
  /** Se llama una vez si el arranque tarda más de `umbralPreparandoMs` (D4). */
  alTardar?: () => void;
  umbralPreparandoMs?: number;
}

export interface ResultadoArranque {
  repositorio: Repositorio;
  estado: Estado;
  avisos: Aviso[];
  /** `true` si se está trabajando sin almacenamiento (D8). */
  enMemoria: boolean;
}

function semillaValida(semilla: unknown): semilla is number {
  return typeof semilla === "number" && Number.isSafeInteger(semilla);
}

/** D7: el registro `meta` es de este formato y se puede leer. Un meta dañado cuenta como esquema distinto. */
function metaUtilizable(meta: unknown): meta is Meta {
  if (typeof meta !== "object" || meta === null) return false;
  const m = meta as Partial<Meta>;
  return (
    m.versionEsquema === VERSION_ESQUEMA &&
    typeof m.fechaBase === "string" &&
    parsearFechaCivil(m.fechaBase) !== null &&
    typeof m.modificada === "boolean" &&
    semillaValida(m.semilla)
  );
}

/** El ejemplo de `hoy`, con el perfil que había si todavía existe (D6: el perfil es de la persona, no de los datos). */
function ejemploDeHoy(hoy: FechaCivil, semilla: number, perfilAnterior: Perfil | null): Estado {
  const nuevo = generar(semilla, hoy);
  if (perfilAnterior?.tipo === "conductor" && nuevo.conductores.some((c) => c.id === perfilAnterior.conductorId)) {
    nuevo.meta.perfil = { tipo: "conductor", conductorId: perfilAnterior.conductorId };
  }
  return nuevo;
}

function perfilDe(meta: unknown): Perfil | null {
  if (typeof meta !== "object" || meta === null) return null;
  const p = (meta as { perfil?: Partial<Perfil> }).perfil;
  if (p?.tipo === "conductor" && typeof p.conductorId === "string") return { tipo: "conductor", conductorId: p.conductorId };
  return p?.tipo === "encargado" ? { tipo: "encargado" } : null;
}

/** Todo el camino feliz sobre un almacenamiento que anda. Cualquier falla sube y `arrancar` pasa a la memoria. */
async function arrancarConAlmacenamiento(opciones: OpcionesArranque, semilla: number): Promise<ResultadoArranque> {
  const repositorio = await opciones.abrirAlmacenamiento();
  const guardado = await repositorio.cargar();
  const { hoy } = opciones;

  if (guardado === null) {
    // D4: primera visita.
    const estado = generar(semilla, hoy);
    await repositorio.reemplazarTodo(estado);
    return { repositorio, estado, avisos: [], enMemoria: false };
  }

  if (!metaUtilizable(guardado.meta)) {
    // D7: otro formato (o un registro dañado): se vuelve al ejemplo y se avisa. El perfil no se arrastra: no se sabe leer.
    const estado = generar(semilla, hoy);
    await repositorio.reemplazarTodo(estado);
    return { repositorio, estado, avisos: [{ tipo: "esquema-actualizado" }], enMemoria: false };
  }

  if (guardado.meta.fechaBase < hoy) {
    if (!guardado.meta.modificada) {
      // D5, primer camino: el ejemplo intacto se corre al día de hoy, en silencio.
      const estado = ejemploDeHoy(hoy, guardado.meta.semilla, perfilDe(guardado.meta));
      await repositorio.reemplazarTodo(estado);
      return { repositorio, estado, avisos: [], enMemoria: false };
    }
    // D5, segundo camino: hay cambios del visitante, se conservan y se avisa.
    return { repositorio, estado: guardado, avisos: [{ tipo: "datos-de-otra-fecha", fechaBase: guardado.meta.fechaBase }], enMemoria: false };
  }

  return { repositorio, estado: guardado, avisos: [], enMemoria: false };
}

/** D8: sin almacenamiento la demo igual funciona, con un repositorio en memoria y un aviso fijo. */
async function arrancarEnMemoria(hoy: FechaCivil, semilla: number): Promise<ResultadoArranque> {
  const repositorio = new RepositorioMemoria();
  const estado = generar(semilla, hoy);
  await repositorio.reemplazarTodo(estado);
  return { repositorio, estado, avisos: [{ tipo: "sin-almacenamiento" }], enMemoria: true };
}

export async function arrancar(opciones: OpcionesArranque): Promise<ResultadoArranque> {
  const semilla = opciones.semilla ?? SEMILLA_POR_DEFECTO;
  const umbral = opciones.umbralPreparandoMs ?? UMBRAL_PREPARANDO_MS;
  const temporizador = opciones.alTardar === undefined ? null : setTimeout(opciones.alTardar, umbral);
  try {
    try {
      return await arrancarConAlmacenamiento(opciones, semilla);
    } catch {
      return await arrancarEnMemoria(opciones.hoy, semilla);
    }
  } finally {
    if (temporizador !== null) clearTimeout(temporizador);
  }
}

/**
 * D6: "Reiniciar demo". Una sola escritura que reemplaza todo (incluido el historial): si falla, queda lo de antes y el
 * error sube para que la interfaz lo muestre (D10). Conserva el perfil elegido y la semilla.
 */
export async function reiniciarDemo(repositorio: Repositorio, actual: Estado, hoy: FechaCivil): Promise<Estado> {
  const semilla = semillaValida(actual.meta.semilla) ? actual.meta.semilla : SEMILLA_POR_DEFECTO;
  const nuevo = ejemploDeHoy(hoy, semilla, actual.meta.perfil);
  await repositorio.reemplazarTodo(nuevo);
  return nuevo;
}

/** D11: cambiar de perfil guarda el perfil pero NO marca la demo como modificada. Devuelve el estado nuevo. */
export async function cambiarPerfil(repositorio: Repositorio, estado: Estado, perfil: Perfil): Promise<Estado> {
  if (perfil.tipo === "conductor" && !estado.conductores.some((c) => c.id === perfil.conductorId)) {
    throw new Error(`No existe el conductor ${perfil.conductorId}.`);
  }
  const meta: Meta = { ...estado.meta, perfil: perfil.tipo === "encargado" ? { tipo: "encargado" } : { tipo: "conductor", conductorId: perfil.conductorId } };
  await repositorio.escribir({ ...sinCambios(), meta }, []);
  return { ...estado, meta };
}
