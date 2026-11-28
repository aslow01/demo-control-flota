// La regla de salida de Inicio (docs/diseno-ui.md, 15.6 y 15.7): cuántas unidades activas pueden salir hoy, una llave por unidad en el orden de la escala, la «Acción del día» y los cuatro
// renglones de lectura. Todo sale de los datos de hoy y nada está escrito a mano: la hoja de estilos no calcula nada. Sin DOM, sin reloj (`hoy` llega de afuera) y sin reglas nuevas: parte de
// `aptitud` (la misma que usa el resto de la aplicación) y de lo que ya calcula el centro de alertas (cifras y acciones de documento), así la regla no puede contradecir a Inicio.
//
// Uso: `calcularSalida(app.estado, app.centroDeAlertas, app.hoy)` (los dos primeros son `null` hasta que termina el arranque).

import { aptitud, type Aptitud } from "../dominio/aptitud.ts";
import { formatearPatente } from "../dominio/patente.ts";
import { TEXTO_FLOTA, textoInterno, textoUnidadNoPuedeSalir } from "../dominio/textos-base.ts";
import { TEXTO_REGLA, textoCota, textoLectorDeLaRegla, textoProtagonistaLector } from "../dominio/textos-inicio.ts";
import type { Estado, FechaCivil, TipoDocumento, Unidad } from "../dominio/tipos.ts";
import type { AccionDeDocumento, CentroDeAlertas, CifraDeInicio } from "./centro-alertas.ts";
import { aHash } from "./enrutador.ts";

/** Cuántas posiciones tiene el tablero corto (15.6.3): si hay más no disponibles, la octava es «y N más». */
const POSICIONES_DEL_TABLERO_CORTO = 8;
/** Un número de la escala que quedaría más cerca que esto (en fracción del ancho) de la lectura, del origen o del final no se escribe. */
const MARGEN_DE_LA_ESCALA = 0.05;
/** Hasta cuántas activas se dibujan las marcas menores de la escala (una por unidad). */
const ACTIVAS_CON_MARCAS_MENORES = 60;

export type CategoriaDeSalida = Exclude<Aptitud["categoria"], "baja">;

/** Una unidad activa en el tablero. Las que no salen son «piezas» y llevan número (el del globo, el de la lista «No disponibles hoy» y el de la «Acción del día»). */
export interface LlaveDeSalida {
  unidadId: string;
  /** Normalizada, sin espacios (`ZK214BD`). */
  patente: string;
  /** Con formato (`ZK 214 BD`). */
  patenteTexto: string;
  /** «Int. 07». */
  interno: string;
  sale: boolean;
  categoria: CategoriaDeSalida;
  /** «Disponible» · «Bloqueada» · «Fuera de servicio»: la etiqueta de la flota. */
  etiqueta: string;
  /** Solo en las que no salen: `critico` (bloqueada por documentos o fuera de servicio por una novedad crítica) o `neutro` (fuera de servicio por taller o a mano). `null` si sale. */
  tono: "critico" | "neutro" | null;
  /** El primero de `motivos`, sin punto final; `null` si sale. */
  motivo: string | null;
  motivos: string[];
  /** 1, 2, 3… entre las que no salen; `null` si sale. */
  pieza: number | null;
  /** La ficha de la unidad. */
  href: string;
}

export interface RenglonDeLectura {
  id: "vencidos" | "proximos" | "partes" | "novedad-critica";
  valor: number;
  /** El de siempre de Inicio («Vencidos o faltantes», «Vencen en 30 días», «Partes pendientes», «Novedad crítica»). */
  rotulo: string;
  tono: CifraDeInicio["tono"];
  /** Solo si hay algo que atender (en cero es `null`: la hoja de estilos dibuja el cuadrado neutro). */
  forma: CifraDeInicio["forma"];
  href: string;
}

/** Un número de la escala, de 0 a las activas. `lectura` es el recuadro con las disponibles; `extremo`, 0 y el total; `marca`, los intermedios. */
export interface MarcaDeEscala {
  valor: number;
  /** De 0 a 1: posición sobre el ancho de la regla. */
  x: number;
  tipo: "extremo" | "marca" | "lectura";
}

/**
 * La acción principal de Inicio. `con-accion`: la primera pieza que tiene un documento para renovar o cargar (no necesariamente la 1). `sin-accion`: ninguna lo tiene; se ofrece «Ver ficha»
 * de la primera. `en-orden`: no hay ninguna no disponible (la nota se queda, sin botones). `vacia`: flota vacía (no hay nota).
 */
export type AccionDelDia =
  | {
      variante: "con-accion";
      pieza: number;
      unidad: LlaveDeSalida;
      /** «ZK 214 BD no puede salir: Seguro vencido hace 1 día.» */
      frase: string;
      /** La misma `AccionDeDocumento` que dibuja la fila de Vencimientos: el diálogo de siempre. */
      accion: AccionDeDocumento;
      /** De 0 a 1: la división de su llave, para la guía que une la nota con su globo. */
      x: number;
    }
  | { variante: "sin-accion"; pieza: number; unidad: LlaveDeSalida; frase: string; x: number }
  | { variante: "en-orden"; frase: string }
  | { variante: "vacia" };

export interface Salida {
  /** Unidades que no están de baja. */
  activas: number;
  disponibles: number;
  /** Bloqueadas por documentos y fuera de servicio. */
  noDisponibles: number;
  bloqueadas: number;
  fueraDeServicio: number;
  /** Disponibles sobre activas, de 0 a 1 (0 sin activas): el ancho de la mordaza y la posición del cursor (`--medida`). */
  medida: number;
  /** Ninguna unidad activa: la regla muestra el cuadro cero con un mensaje (`data-vacia`). */
  vacia: boolean;
  /** `data-carga`: cuándo entra el tablero completo (15.6.3). */
  carga: "a" | "b" | "c" | "d";
  /** `data-campo`: dónde van los renglones de lectura (15.6.8). */
  campo: "ancho" | "medio" | "angosto";
  /** Una por unidad activa: primero las que salen y después las que no, cada grupo por patente (las que no, bloqueadas primero y después fuera de servicio, como «No disponibles hoy»). */
  llaves: LlaveDeSalida[];
  /** El tablero corto: las no disponibles hasta ocho posiciones; si hay más, siete chapas y `masNoDisponibles` para el enlace «y N más» (siempre 2 o más). */
  corto: { chapas: LlaveDeSalida[]; masNoDisponibles: number };
  /** «4 unidades»: la cota de la zona roja; `null` si no hay no disponibles. */
  cota: string | null;
  escala: MarcaDeEscala[];
  /** `false` con más de 60 activas: se dibujan solo las marcas mayores. */
  marcasMenores: boolean;
  /** Párrafo para lectores, con el valor final desde el primer cuadro. */
  textoLector: string;
  /** Las cuatro cifras de hoy de Inicio, como renglones: vencidos, vencen en 30 días, partes pendientes, novedad crítica. */
  renglones: RenglonDeLectura[];
  accion: AccionDelDia;
}

// --- Funciones puras de la hoja de estilos -------------------------------------------------------

/** `data-carga` (15.6.3): a hasta 24 activas, b de 25 a 30, c de 31 a 46, d desde 47 (siempre tablero corto). */
export function cargaDeActivas(activas: number): "a" | "b" | "c" | "d" {
  if (activas <= 24) return "a";
  if (activas <= 30) return "b";
  if (activas <= 46) return "c";
  return "d";
}

/** `data-campo` (15.6.8) según la medida: ancho desde 0,70; medio de 0,45 a 0,70; angosto por debajo. */
export function campoDeMedida(medida: number): "ancho" | "medio" | "angosto" {
  if (medida >= 0.7) return "ancho";
  if (medida >= 0.45) return "medio";
  return "angosto";
}

/** Cada cuántas unidades va un número en la escala: 5 hasta 60 activas y, de ahí, 10 por cada 100 (decisión propia: la especificación no fija el paso con muchas activas). */
export function pasoDeLaEscala(activas: number): number {
  return activas <= ACTIVAS_CON_MARCAS_MENORES ? 5 : 10 * Math.ceil(activas / 100);
}

/**
 * Los números de la escala: 0, cada `pasoDeLaEscala`, la lectura (las disponibles) y el total. Se omite el que quedaría a menos de 0,05 de la lectura, del origen o del final; la lectura y
 * los dos extremos nunca. Si la lectura coincide con un extremo, ese extremo es la lectura. Sin activas no hay escala.
 */
export function escalaDeLaRegla(disponibles: number, activas: number): MarcaDeEscala[] {
  if (activas <= 0) return [];
  const lectura = disponibles / activas;
  const marcas: MarcaDeEscala[] = [{ valor: 0, x: 0, tipo: disponibles === 0 ? "lectura" : "extremo" }];
  for (let valor = pasoDeLaEscala(activas); valor < activas; valor += pasoDeLaEscala(activas)) {
    if (valor === disponibles) continue; // la pone la lectura
    const x = valor / activas;
    if (x < MARGEN_DE_LA_ESCALA || 1 - x < MARGEN_DE_LA_ESCALA || Math.abs(x - lectura) < MARGEN_DE_LA_ESCALA) continue;
    marcas.push({ valor, x, tipo: "marca" });
  }
  if (disponibles > 0 && disponibles < activas) marcas.push({ valor: disponibles, x: lectura, tipo: "lectura" });
  marcas.push({ valor: activas, x: 1, tipo: disponibles === activas ? "lectura" : "extremo" });
  return marcas.sort((a, b) => a.valor - b.valor);
}

// --- Armado --------------------------------------------------------------------------------------

function porPatente(a: { unidad: Unidad }, b: { unidad: Unidad }): number {
  return a.unidad.patente < b.unidad.patente ? -1 : a.unidad.patente > b.unidad.patente ? 1 : 0;
}

interface UnidadEvaluada {
  unidad: Unidad;
  aptitud: Aptitud;
  categoria: CategoriaDeSalida;
}

function tonoDe(u: Unidad, a: Aptitud): LlaveDeSalida["tono"] {
  if (a.puedeSalir) return null;
  return u.estado.tipo === "fuera-de-servicio" && u.estado.origen === "manual" ? "neutro" : "critico";
}

function renglon(id: RenglonDeLectura["id"], c: CifraDeInicio): RenglonDeLectura {
  return { id, valor: c.valor, rotulo: c.rotulo, tono: c.tono, forma: c.forma, href: c.href };
}

/** Qué documento destraba la pieza: el del primer motivo de documento (vencido o faltante); `null` si la unidad no está bloqueada por documentos. */
function documentoQueDestraba(a: Aptitud): TipoDocumento | null {
  return a.motivos.find((m) => m.documento !== undefined)?.documento ?? null;
}

export function calcularSalida(estado: Estado, centro: CentroDeAlertas, hoy: FechaCivil): Salida {
  const evaluadas: UnidadEvaluada[] = [];
  for (const unidad of estado.unidades) {
    if (unidad.estado.tipo === "baja") continue;
    const a = aptitud(unidad, estado, hoy);
    // No es redundante con el `continue` de arriba: estrecha el tipo (`a.categoria` incluye «baja»; `UnidadEvaluada.categoria`, no).
    if (a.categoria !== "baja") evaluadas.push({ unidad, aptitud: a, categoria: a.categoria });
  }
  const deCategoria = (categoria: CategoriaDeSalida): UnidadEvaluada[] => evaluadas.filter((x) => x.categoria === categoria).sort(porPatente);
  const salen = deCategoria("puede-salir");
  const bloqueadas = deCategoria("no-puede-salir");
  const fuera = deCategoria("fuera-de-servicio");
  const ordenadas = [...salen, ...bloqueadas, ...fuera];

  // El número de pieza lo llevan solo las que no salen, en el orden del tablero (1, 2, 3…).
  const numeroDePieza = new Map(ordenadas.filter((x) => !x.aptitud.puedeSalir).map((x, i) => [x.unidad.id, i + 1] as const));
  const llaves: LlaveDeSalida[] = ordenadas.map(({ unidad: u, aptitud: a, categoria }) => {
    const motivos = a.motivos.map((m) => m.texto);
    return {
      unidadId: u.id,
      patente: u.patente,
      patenteTexto: formatearPatente(u.patente),
      interno: textoInterno(u.interno),
      sale: a.puedeSalir,
      categoria,
      etiqueta: TEXTO_FLOTA.estado[categoria],
      tono: tonoDe(u, a),
      motivo: motivos[0] ?? null,
      motivos,
      pieza: numeroDePieza.get(u.id) ?? null,
      href: aHash({ tipo: "unidad", patente: u.patente }),
    };
  });

  const activas = llaves.length;
  const disponibles = salen.length;
  const noDisponibles = activas - disponibles;
  const medida = activas === 0 ? 0 : disponibles / activas;
  const piezas = llaves.filter((l) => !l.sale);
  const hayDeMas = piezas.length > POSICIONES_DEL_TABLERO_CORTO;
  const c = centro.cifras;

  return {
    activas,
    disponibles,
    noDisponibles,
    bloqueadas: bloqueadas.length,
    fueraDeServicio: fuera.length,
    medida,
    vacia: activas === 0,
    carga: cargaDeActivas(activas),
    campo: campoDeMedida(medida),
    llaves,
    corto: {
      chapas: hayDeMas ? piezas.slice(0, POSICIONES_DEL_TABLERO_CORTO - 1) : piezas,
      masNoDisponibles: hayDeMas ? piezas.length - (POSICIONES_DEL_TABLERO_CORTO - 1) : 0,
    },
    cota: noDisponibles === 0 ? null : textoCota(noDisponibles),
    escala: escalaDeLaRegla(disponibles, activas),
    marcasMenores: activas <= ACTIVAS_CON_MARCAS_MENORES,
    textoLector: activas === 0 ? TEXTO_REGLA.sinActivas : textoLectorDeLaRegla(disponibles, activas, bloqueadas.length, fuera.length),
    renglones: [renglon("vencidos", c.vencidos), renglon("proximos", c.proximos), renglon("partes", c.partes), renglon("novedad-critica", c.novedadCritica)],
    accion: accionDelDia(llaves, ordenadas, centro),
  };
}

function accionDelDia(llaves: readonly LlaveDeSalida[], evaluadas: readonly UnidadEvaluada[], centro: CentroDeAlertas): AccionDelDia {
  if (llaves.length === 0) return { variante: "vacia" };
  const primera = llaves.findIndex((l) => !l.sale);
  if (primera === -1) return { variante: "en-orden", frase: textoProtagonistaLector(0) };

  const filas = centro.vencimientos.grupos.find((g) => g.id === "vencidos")?.filas ?? [];
  const posicion = (indice: number): number => (indice + 0.5) / llaves.length;
  const frase = (l: LlaveDeSalida): string => textoUnidadNoPuedeSalir(l.patenteTexto, l.motivos, false).titular;

  for (let i = primera; i < llaves.length; i++) {
    const llave = llaves[i];
    const evaluada = evaluadas[i];
    if (llave === undefined || evaluada === undefined) continue;
    const tipo = documentoQueDestraba(evaluada.aptitud);
    if (tipo === null || llave.pieza === null) continue;
    // La misma acción que ya calcula el centro de alertas para esa fila de Vencimientos (Renovar o Cargar), no una copia.
    const fila = filas.find((f) => f.titular.tipo === "unidad" && f.titular.patente === llave.patente && f.accion.tipoDocumento === tipo);
    if (fila !== undefined) return { variante: "con-accion", pieza: llave.pieza, unidad: llave, frase: frase(llave), accion: fila.accion, x: posicion(i) };
  }
  const llave = llaves[primera];
  if (llave === undefined || llave.pieza === null) return { variante: "vacia" }; // no puede pasar: `primera` es una no disponible, que siempre tiene pieza
  return { variante: "sin-accion", pieza: llave.pieza, unidad: llave, frase: frase(llave), x: posicion(primera) };
}
