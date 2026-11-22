// Arranque de la aplicación (docs/diseno.md, reglas D4 a D8 y D11): abre el almacenamiento, carga o genera el ejemplo y
// decide qué avisos hay que mostrar. No toca la interfaz ni el reloj: recibe `hoy` ya calculado y devuelve datos.

import { generar, VERSION_ESQUEMA } from "../datos/generador.ts";
import { calcularAlertas } from "../dominio/alertas.ts";
import { sinCambios } from "../dominio/estado.ts";
import { parsearFechaCivil } from "../dominio/fechas.ts";
import { parteLegible } from "../dominio/parte.ts";
import type { Estado, FechaCivil, ItemChecklist, Meta, Parte, Perfil, TipoEvento, TipoUnidad } from "../dominio/tipos.ts";
import { RepositorioMemoria } from "./memoria.ts";
import type { Repositorio } from "./repositorio.ts";

/** La semilla de la demo (docs/diseno.md 9.3): con ella el ejemplo es siempre el mismo. */
export const SEMILLA_POR_DEFECTO = 20261118;

/** D4: "Preparando la flota de ejemplo…" solo si el arranque tarda más que esto. */
export const UMBRAL_PREPARANDO_MS = 300;

/** Si abrir el almacenamiento no responde en este plazo, se lo da por no disponible y se sigue en memoria (D8). */
export const PLAZO_ABRIR_MS = 8000;

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
  /** Cuánto se espera a que abra el almacenamiento antes de seguir en memoria (D8). Por defecto, `PLAZO_ABRIR_MS`. */
  plazoAbrirMs?: number;
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

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function textos(o: Record<string, unknown>, ...campos: string[]): boolean {
  return campos.every((campo) => typeof o[campo] === "string");
}

function numeros(o: Record<string, unknown>, ...campos: string[]): boolean {
  return campos.every((campo) => typeof o[campo] === "number" && Number.isFinite(o[campo]));
}

/** Un texto, o `null` cuando el campo es opcional. */
function textoONulo(o: Record<string, unknown>, ...campos: string[]): boolean {
  return campos.every((campo) => o[campo] === null || typeof o[campo] === "string");
}

// Los conjuntos de valores válidos son `Record<…, true>` para que el compilador avise si un tipo del dominio suma un valor y esto no.
const TIPOS_DE_UNIDAD: Record<TipoUnidad, true> = { camioneta: true, utilitario: true, "camion-liviano": true, minibus: true };
const ITEMS_DEL_CHECKLIST: Record<ItemChecklist, true> = {
  frenos: true,
  direccion: true,
  neumaticos: true,
  luces: true,
  cinturones: true,
  niveles: true,
  matafuego: true,
  botiquin: true,
  documentacion: true,
  cabina: true,
};
/** Los tres estados de un parte (sección 17): revisión sin enviar, en uso (revisión enviada) y cerrado. */
const ESTADOS_DE_PARTE: Record<Parte["estado"], true> = { borrador: true, "en-uso": true, enviado: true };
const TIPOS_DE_EVENTO: Record<TipoEvento, true> = {
  "unidad-alta": true,
  "asignacion-cambiada": true,
  "documento-cargado": true,
  "documento-renovado": true,
  "documento-corregido": true,
  "revision-enviada": true,
  "parte-enviado": true,
  "novedad-abierta": true,
  "novedad-resuelta": true,
  "fuera-de-servicio": true,
  "vuelta-a-servicio": true,
  "km-corregido": true,
  "unidad-baja": true,
};

function estaEn<T extends string>(conjunto: Record<T, true>, valor: unknown): valor is T {
  return typeof valor === "string" && Object.hasOwn(conjunto, valor);
}

function estadoOperativoUtilizable(e: Record<string, unknown>): boolean {
  if (e.tipo === "en-servicio") return true;
  if (e.tipo === "baja") return textos(e, "desde", "motivo");
  if (e.tipo === "fuera-de-servicio") {
    return textos(e, "desde", "motivo", "origen") && Array.isArray(e.novedadIds) && e.novedadIds.every((id: unknown) => typeof id === "string");
  }
  return false;
}

function origenDeNovedadUtilizable(origen: unknown): boolean {
  if (!esObjeto(origen)) return false;
  if (origen.tipo === "manual") return true;
  return origen.tipo === "parte" && textos(origen, "parteId") && (origen.item === "otra" || estaEn(ITEMS_DEL_CHECKLIST, origen.item));
}

/**
 * Lo mínimo que tiene que cumplir cada elemento de cada lista para que las pantallas no revienten (no es la validación de los
 * comandos): los campos que las pantallas, la ficha, el parte y el centro de alertas leen, con su tipo. Un campo que el código
 * lee y acá no se mira es un hueco: la pantalla queda en blanco con un dato editado a mano o de otra versión (D7).
 */
const FORMA_DE_ELEMENTO: Record<string, (o: Record<string, unknown>) => boolean> = {
  proyectos: (o) => textos(o, "id", "nombre") && typeof o.requiereHabilitacion === "boolean",
  conductores: (o) => textos(o, "id", "nombre", "legajo") && typeof o.activo === "boolean",
  unidades: (o) =>
    textos(o, "id", "patente", "marca", "modelo", "proyectoId", "creada") &&
    numeros(o, "interno", "anio") &&
    estaEn(TIPOS_DE_UNIDAD, o.tipo) &&
    textoONulo(o, "conductorId") &&
    esObjeto(o.estado) &&
    estadoOperativoUtilizable(o.estado),
  documentos: (o) =>
    textos(o, "id", "tipo", "numero", "emisor", "vence", "cargado") &&
    textoONulo(o, "emitido", "reemplazaA") &&
    esObjeto(o.titular) &&
    textos(o.titular, "tipo", "id"),
  // Los partes pasan después por `parteLegible` (`conPartesLegibles`): acá solo se pide lo que hace falta para ubicarlos.
  partes: (o) => textos(o, "id", "unidadId", "fecha") && estaEn(ESTADOS_DE_PARTE, o.estado) && esObjeto(o.checklist),
  novedades: (o) =>
    textos(o, "id", "unidadId", "estado", "gravedad", "fecha", "descripcion") &&
    origenDeNovedadUtilizable(o.origen) &&
    (o.resolucion === null || (esObjeto(o.resolucion) && textos(o.resolucion, "texto", "instante", "autor"))),
  correccionesKm: (o) => textos(o, "id", "unidadId", "desde", "motivo", "instante", "autor") && numeros(o, "kmBase"),
  eventos: (o) =>
    textos(o, "id", "instante", "resumen", "autor") &&
    numeros(o, "secuencia") &&
    textoONulo(o, "unidadId", "conductorId") &&
    estaEn(TIPOS_DE_EVENTO, o.tipo) &&
    esObjeto(o.datos),
};

/**
 * Los partes guardados, leídos con `parteLegible` (4.5, código M1): quien los usa nunca ve un campo con la forma rota (una lista que falta, un
 * punto del checklist nulo, un kilometraje de texto). Lo que no se puede leer queda vacío, no se inventa nada. `null` si alguno no es un parte
 * (estado o fecha imposibles): ese registro está dañado y no se puede descartar en silencio.
 */
export function partesLegibles(partes: unknown): Parte[] | null {
  if (!Array.isArray(partes)) return null;
  const leidos: Parte[] = [];
  for (const crudo of partes) {
    const parte = parteLegible(crudo);
    if (parte === null) return null;
    leidos.push(parte);
  }
  return leidos;
}

/**
 * D7: las listas guardadas tienen la forma que el código espera. Los datos del almacenamiento son entrada externa (se pueden
 * editar desde las herramientas del navegador): un elemento que no es un objeto, o al que le falta un campo básico, cuenta como
 * otro formato. Los partes se normalizan con `parteLegible` (una sola vía de lectura para todas las pantallas) y se prueba que el
 * cálculo de alertas no falle, que es lo primero que hace la pantalla principal. Devuelve el estado listo para usar, o `null`.
 */
function datosUtilizables(guardado: Estado, hoy: FechaCivil): Estado | null {
  const crudo = guardado as unknown as Record<string, unknown>;
  for (const [lista, valida] of Object.entries(FORMA_DE_ELEMENTO)) {
    const elementos = crudo[lista];
    if (!Array.isArray(elementos)) return null;
    if (!elementos.every((e: unknown) => esObjeto(e) && valida(e))) return null;
  }
  const partes = partesLegibles(guardado.partes);
  if (partes === null) return null;
  const legible: Estado = { ...guardado, partes };
  try {
    calcularAlertas(legible, hoy);
    return legible;
  } catch {
    return null;
  }
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

/**
 * Abre el almacenamiento, pero no espera para siempre: algunos navegadores dejan el pedido de `indexedDB.open` sin respuesta
 * (ni éxito ni error). Pasado el plazo rechaza, y si la conexión llega más tarde se la cierra para no dejarla colgada.
 */
function abrirConPlazo(opciones: OpcionesArranque): Promise<Repositorio> {
  const plazo = opciones.plazoAbrirMs ?? PLAZO_ABRIR_MS;
  return new Promise<Repositorio>((resolver, rechazar) => {
    let vencido = false;
    const temporizador = setTimeout(() => {
      vencido = true;
      rechazar(new Error("El almacenamiento no respondió a tiempo."));
    }, plazo);
    opciones.abrirAlmacenamiento().then(
      (repositorio) => {
        clearTimeout(temporizador);
        if (vencido) repositorio.cerrar?.();
        else resolver(repositorio);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        if (!vencido) rechazar(error);
      },
    );
  });
}

/** El perfil guardado solo vale si es el encargado o un conductor que existe; si no, se vuelve al encargado (nunca se rompe). */
function conPerfilValido(guardado: Estado): Estado {
  const perfil = perfilDe(guardado.meta);
  const valido: Perfil =
    perfil?.tipo === "conductor" && guardado.conductores.some((c) => c.id === perfil.conductorId) ? perfil : { tipo: "encargado" };
  const igual = JSON.stringify(guardado.meta.perfil) === JSON.stringify(valido);
  return igual ? guardado : { ...guardado, meta: { ...guardado.meta, perfil: valido } };
}

/** Todo el camino feliz sobre un almacenamiento que anda. Cualquier falla sube y `arrancar` pasa a la memoria. */
async function arrancarConAlmacenamiento(opciones: OpcionesArranque, semilla: number): Promise<ResultadoArranque> {
  const repositorio = await abrirConPlazo(opciones);
  try {
    return await usarAlmacenamiento(repositorio, opciones, semilla);
  } catch (error) {
    repositorio.cerrar?.(); // se sigue en memoria: no dejar la conexión abierta
    throw error;
  }
}

async function usarAlmacenamiento(repositorio: Repositorio, opciones: OpcionesArranque, semilla: number): Promise<ResultadoArranque> {
  const cargado = await repositorio.cargar();
  const { hoy } = opciones;

  if (cargado === null) {
    // D4: primera visita.
    const estado = generar(semilla, hoy);
    await repositorio.reemplazarTodo(estado);
    return { repositorio, estado, avisos: [], enMemoria: false };
  }

  const guardado = metaUtilizable(cargado.meta) ? datosUtilizables(cargado, hoy) : null;
  if (guardado === null) {
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
    const estado = conPerfilValido(guardado);
    return { repositorio, estado, avisos: [{ tipo: "datos-de-otra-fecha", fechaBase: guardado.meta.fechaBase }], enMemoria: false };
  }

  return { repositorio, estado: conPerfilValido(guardado), avisos: [], enMemoria: false };
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
