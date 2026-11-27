// Arranque de la aplicación (docs/diseno.md, reglas D4 a D8 y D11): abre el almacenamiento, carga o genera el ejemplo y
// decide qué avisos hay que mostrar. No toca la interfaz ni el reloj: recibe `hoy` ya calculado y devuelve datos.

import { SEMILLA_POR_DEFECTO, VERSION_ESQUEMA } from "../datos/constantes.ts";
import { bajar, ErrorDeDescarga, PLAZO_DE_DESCARGA_MS } from "../descarga.ts";
import { calcularAlertas } from "../dominio/alertas.ts";
import { sinCambios } from "../dominio/estado.ts";
import { parsearFechaCivil } from "../dominio/fechas.ts";
import { parteLegible } from "../dominio/parte.ts";
import type { Estado, FechaCivil, ItemChecklist, Meta, Parte, Perfil, TipoEvento, TipoUnidad } from "../dominio/tipos.ts";
import { RepositorioMemoria } from "./memoria.ts";
import type { Repositorio } from "./repositorio.ts";

/**
 * Trae el generador de datos. Es un trozo aparte (`import()`): quien ya tiene la demo guardada de hoy no lo baja; solo se pide cuando hay que armar el ejemplo
 * (primera visita, ejemplo de otro día, formato viejo o dañado, sin almacenamiento y «Reiniciar demo»). Los tests pasan uno propio para contar los pedidos.
 */
export type CargarGenerador = () => Promise<Pick<typeof import("../datos/generador.ts"), "generar">>;

const CARGAR_GENERADOR: CargarGenerador = () => import("../datos/generador.ts");

type Generador = Awaited<ReturnType<CargarGenerador>>;

/**
 * El generador, pedido una sola vez por arranque (o por «Reiniciar demo»): si no baja, no se lo vuelve a pedir (un pedido colgado se repite colgado) y todos los que lo
 * esperen reciben el mismo error. No espera más de `plazoMs`. Rechaza siempre con `ErrorDeDescarga`: una descarga que falla no es un problema del almacenamiento.
 */
function generadorUnico(cargar: CargarGenerador, plazoMs: number): () => Promise<Generador> {
  let pedido: Promise<Generador> | null = null;
  return () => (pedido ??= bajar(cargar, { plazoMs }));
}

/** D4: "Preparando la flota de ejemplo…" solo si el arranque tarda más que esto. */
export const UMBRAL_PREPARANDO_MS = 300;

/**
 * Si abrir el almacenamiento no responde en este plazo, o si después leerlo y escribir el ejemplo no termina en este mismo plazo (uno solo, en total, para leer y escribir:
 * no se renueva en cada paso), se lo da por no disponible y se sigue en memoria (D8). La descarga del generador no cuenta: es aparte (`PLAZO_DE_DESCARGA_MS`) y mientras se espera el plazo se detiene.
 */
export const PLAZO_ABRIR_MS = 8000;

/** Avisos globales que el arranque deja para la interfaz (los textos están en `textos-base.ts`). */
export type Aviso =
  /** D7: cambió la versión del formato y se volvió a cargar el ejemplo. */
  | { tipo: "esquema-actualizado" }
  /** D5: hay cambios del visitante sobre un ejemplo de otra fecha. */
  | { tipo: "datos-de-otra-fecha"; fechaBase: FechaCivil }
  /** D8: sin IndexedDB, la demo funciona en memoria y los cambios se pierden al cerrar la pestaña. */
  | { tipo: "sin-almacenamiento" }
  /** QA B2: la base se borró o se cambió desde otra pestaña con la demo abierta; sigue en memoria con lo que tenía. */
  | { tipo: "almacenamiento-perdido" };

export interface OpcionesArranque {
  /** Fecha civil de hoy en Argentina (la calcula el reloj). */
  hoy: FechaCivil;
  /** Abre el almacenamiento real (en el navegador, `abrirIndexedDB`). Puede rechazar: entonces se usa la memoria (D8). */
  abrirAlmacenamiento: () => Promise<Repositorio>;
  semilla?: number;
  /** Cuánto se espera a que abra el almacenamiento y, aparte, a que lo lea y escriba el ejemplo (un solo plazo, en total, para esos dos pasos) antes de seguir en memoria (D8). Por defecto, `PLAZO_ABRIR_MS`. */
  plazoAbrirMs?: number;
  /** Se llama una vez si el arranque tarda más de `umbralPreparandoMs` (D4). */
  alTardar?: () => void;
  umbralPreparandoMs?: number;
  /** Por defecto, el `import()` del generador. */
  cargarGenerador?: CargarGenerador;
  /** Cuánto se espera a que baje el generador antes de darlo por perdido. Por defecto, `PLAZO_DE_DESCARGA_MS`. Es aparte del plazo del almacenamiento: no se descuenta de él. */
  plazoGeneradorMs?: number;
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
  perticaBaliza: true,
  alarmaRetroceso: true,
  niveles: true,
  matafuego: true,
  botiquin: true,
  documentacion: true,
  cabina: true,
  calzasAntiderrame: true,
  radio: true,
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
async function ejemploDeHoy(hoy: FechaCivil, semilla: number, perfilAnterior: Perfil | null, generador: () => Promise<Generador>): Promise<Estado> {
  const nuevo = (await generador()).generar(semilla, hoy);
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

/** Espera `pedido` sin que corra el plazo del almacenamiento (ver `usarAlmacenamientoConPlazo`). */
type SinContarElPlazo = <T>(pedido: Promise<T>) => Promise<T>;

/**
 * Lo mismo que `usarAlmacenamiento`, pero con plazo: abrir puede andar y aun así leer o escribir el ejemplo no terminar nunca (una transacción grande en el WebKit de
 * Windows no completó en 8 s; en Chromium tarda 160 ms). Sin esto, la pantalla se quedaba en «Preparando la flota de ejemplo…» para siempre. Pasado el plazo rechaza.
 * El plazo es uno solo para leer y escribir y se detiene mientras se espera el generador (`sinContar`): bajar el trozo no es del almacenamiento y tiene el suyo.
 */
function usarAlmacenamientoConPlazo(repositorio: Repositorio, opciones: OpcionesArranque, semilla: number, generador: () => Promise<Generador>): Promise<ResultadoArranque> {
  return new Promise<ResultadoArranque>((resolver, rechazar) => {
    let vencido = false;
    let restante = opciones.plazoAbrirMs ?? PLAZO_ABRIR_MS;
    let corriendoDesde = Date.now();
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const correr = (): void => {
      corriendoDesde = Date.now();
      temporizador = setTimeout(() => {
        vencido = true;
        rechazar(new Error("El almacenamiento no respondió a tiempo."));
      }, Math.max(restante, 0));
    };
    const sinContar: SinContarElPlazo = async (pedido) => {
      clearTimeout(temporizador);
      restante -= Date.now() - corriendoDesde;
      try {
        return await pedido;
      } finally {
        if (!vencido) correr();
      }
    };
    correr();
    usarAlmacenamiento(repositorio, opciones, semilla, () => sinContar(generador())).then(
      (resultado) => {
        clearTimeout(temporizador);
        if (!vencido) resolver(resultado);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        if (!vencido) rechazar(error);
      },
    );
  });
}

/** Todo el camino feliz sobre un almacenamiento que anda. Cualquier falla del almacenamiento sube y `arrancar` pasa a la memoria; una del generador, no. */
async function arrancarConAlmacenamiento(opciones: OpcionesArranque, semilla: number, generador: () => Promise<Generador>): Promise<ResultadoArranque> {
  const repositorio = await abrirConPlazo(opciones);
  try {
    return await usarAlmacenamientoConPlazo(repositorio, opciones, semilla, generador);
  } catch (error) {
    repositorio.cerrar?.(); // se sigue en memoria (o se muestra el error): no dejar la conexión abierta
    throw error;
  }
}

async function usarAlmacenamiento(repositorio: Repositorio, opciones: OpcionesArranque, semilla: number, generador: () => Promise<Generador>): Promise<ResultadoArranque> {
  const cargado = await repositorio.cargar();
  const { hoy } = opciones;

  if (cargado === null) {
    // D4: primera visita.
    const estado = (await generador()).generar(semilla, hoy);
    await repositorio.reemplazarTodo(estado);
    return { repositorio, estado, avisos: [], enMemoria: false };
  }

  const guardado = metaUtilizable(cargado.meta) ? datosUtilizables(cargado, hoy) : null;
  if (guardado === null) {
    // D7: otro formato (o un registro dañado): se vuelve al ejemplo y se avisa. El perfil no se arrastra: no se sabe leer.
    const estado = (await generador()).generar(semilla, hoy);
    await repositorio.reemplazarTodo(estado);
    return { repositorio, estado, avisos: [{ tipo: "esquema-actualizado" }], enMemoria: false };
  }

  if (guardado.meta.fechaBase < hoy) {
    if (!guardado.meta.modificada) {
      // D5, primer camino: el ejemplo intacto se corre al día de hoy, en silencio.
      try {
        const estado = await ejemploDeHoy(hoy, guardado.meta.semilla, perfilDe(guardado.meta), generador);
        await repositorio.reemplazarTodo(estado);
        return { repositorio, estado, avisos: [], enMemoria: false };
      } catch (error) {
        // Sin el generador no se puede correr el ejemplo a hoy, pero lo guardado sirve: se sigue con él y el aviso de abajo (que ofrece «Reiniciar demo») en vez de dejar a la persona afuera.
        if (!(error instanceof ErrorDeDescarga)) throw error;
      }
    }
    // D5, segundo camino: hay cambios del visitante (o no se pudo correr el ejemplo a hoy), se conservan y se avisa.
    const estado = conPerfilValido(guardado);
    return { repositorio, estado, avisos: [{ tipo: "datos-de-otra-fecha", fechaBase: guardado.meta.fechaBase }], enMemoria: false };
  }

  return { repositorio, estado: conPerfilValido(guardado), avisos: [], enMemoria: false };
}

/** D8: sin almacenamiento la demo igual funciona, con un repositorio en memoria y un aviso fijo. */
async function arrancarEnMemoria(hoy: FechaCivil, semilla: number, generador: () => Promise<Generador>): Promise<ResultadoArranque> {
  const repositorio = new RepositorioMemoria();
  const estado = (await generador()).generar(semilla, hoy);
  await repositorio.reemplazarTodo(estado);
  return { repositorio, estado, avisos: [{ tipo: "sin-almacenamiento" }], enMemoria: true };
}

export async function arrancar(opciones: OpcionesArranque): Promise<ResultadoArranque> {
  const semilla = opciones.semilla ?? SEMILLA_POR_DEFECTO;
  const umbral = opciones.umbralPreparandoMs ?? UMBRAL_PREPARANDO_MS;
  const temporizador = opciones.alTardar === undefined ? null : setTimeout(opciones.alTardar, umbral);
  const generador = generadorUnico(opciones.cargarGenerador ?? CARGAR_GENERADOR, opciones.plazoGeneradorMs ?? PLAZO_DE_DESCARGA_MS);
  try {
    try {
      return await arrancarConAlmacenamiento(opciones, semilla, generador);
    } catch (error) {
      // Un generador que no baja no es un almacenamiento que no anda: seguir en memoria pediría el mismo trozo y dejaría la demo sin guardar por un problema de red.
      if (error instanceof ErrorDeDescarga) throw error;
      return await arrancarEnMemoria(opciones.hoy, semilla, generador);
    }
  } finally {
    if (temporizador !== null) clearTimeout(temporizador);
  }
}

/**
 * D6: "Reiniciar demo". Una sola escritura que reemplaza todo (incluido el historial): si falla, queda lo de antes y el
 * error sube para que la interfaz lo muestre (D10). Conserva el perfil elegido y la semilla.
 */
export async function reiniciarDemo(
  repositorio: Repositorio,
  actual: Estado,
  hoy: FechaCivil,
  cargar: CargarGenerador = CARGAR_GENERADOR,
  plazoGeneradorMs: number = PLAZO_DE_DESCARGA_MS,
): Promise<Estado> {
  const semilla = semillaValida(actual.meta.semilla) ? actual.meta.semilla : SEMILLA_POR_DEFECTO;
  const nuevo = await ejemploDeHoy(hoy, semilla, actual.meta.perfil, generadorUnico(cargar, plazoGeneradorMs));
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
