// Horizonte de vencimientos (docs/diseno-ui.md, 5.6): todo lo que la pantalla necesita para dibujarlo, sin DOM y sin reglas
// nuevas. Parte de `calcularAlertas` (la lista y la pista salen de las mismas alertas, así no pueden contradecirse) y solo
// decide dónde cae cada marca, de qué tramo y gravedad es, cuántas se dibujan por día y qué dice el `aria-label`.
//
// Uso: `horizonteCompleto(app.alertas)` (centro de alertas), `horizonteDeUnidad(app.alertas, unidad.id)` (ficha) y
// `horizonteMinimo(app.alertas, unidad.id)` (columna "Próximo vencimiento" de la flota).

import type { Alerta, Gravedad, ResultadoAlertas } from "./alertas.ts";
import { TEXTO_HORIZONTE, textoHorizonte } from "./textos-base.ts";
import type { Grupo } from "./vencimientos.ts";

export type VarianteHorizonte = "completa" | "mediana" | "minima";

/** Los tres tramos de la pista; coinciden con los tokens `--c-semana-r`, `--c-quincena-r` y `--c-mes-r`. */
export type TramoHorizonte = "semana" | "quincena" | "mes";

/** Último día de la pista: la grilla tiene 31 columnas (días 0 a 30). */
export const ULTIMO_DIA = 30;

/** Máximo de marcas dibujadas por día (5.6: "Máximo 4 apiladas"); la mínima dibuja una sola marca. */
export const MAX_APILADAS: Record<VarianteHorizonte, number> = { completa: 4, mediana: 4, minima: 1 };

/** 0 a 7 semana, 8 a 15 quincena, 16 a 30 mes (las mismas fronteras que los grupos V2 a V4). */
export function tramoDeDia(dia: number): TramoHorizonte {
  if (dia <= 7) return "semana";
  if (dia <= 15) return "quincena";
  return "mes";
}

export interface TramoDePista {
  tramo: TramoHorizonte;
  /** Primer y último día del tramo (ambos incluidos). */
  desde: number;
  hasta: number;
  /** Líneas de la grilla (empiezan en 1); `columnaFin` es exclusiva: `grid-column: {columnaInicio} / {columnaFin}`. */
  columnaInicio: number;
  columnaFin: number;
}

/** Borde inferior de la pista, dividido en tres (5.6, "Tramos"). */
export const TRAMOS_PISTA: readonly TramoDePista[] = [
  { tramo: "semana", desde: 0, hasta: 7, columnaInicio: 1, columnaFin: 9 },
  { tramo: "quincena", desde: 8, hasta: 15, columnaInicio: 9, columnaFin: 17 },
  { tramo: "mes", desde: 16, hasta: 30, columnaInicio: 17, columnaFin: 32 },
];

export interface MarcaDeEscala {
  /** "Hoy", "7", "15", "30 días". */
  etiqueta: string;
  /** Para pistas de menos de 24rem: "30 días" pasa a "30". */
  etiquetaCorta: string;
  dia: number;
  /** Columna (línea de grilla) donde empieza el rótulo: día + 1. */
  columna: number;
  /** Línea punteada vertical: en 7, 15 y 30 (la de "Hoy" es la línea de `--c-hoy`, aparte). */
  linea: boolean;
}

export const ESCALA_COMPLETA: readonly MarcaDeEscala[] = [
  { etiqueta: "Hoy", etiquetaCorta: "Hoy", dia: 0, columna: 1, linea: false },
  { etiqueta: "7", etiquetaCorta: "7", dia: 7, columna: 8, linea: true },
  { etiqueta: "15", etiquetaCorta: "15", dia: 15, columna: 16, linea: true },
  { etiqueta: "30 días", etiquetaCorta: "30", dia: 30, columna: 31, linea: true },
];

/** Mediana: solo "Hoy" y "30" (5.6, tabla de variantes). */
export const ESCALA_MEDIANA: readonly MarcaDeEscala[] = [
  { etiqueta: "Hoy", etiquetaCorta: "Hoy", dia: 0, columna: 1, linea: false },
  { etiqueta: "30", etiquetaCorta: "30", dia: 30, columna: 31, linea: true },
];

export interface MarcaHorizonte {
  alertaId: string;
  dia: number;
  tramo: TramoHorizonte;
  gravedad: Gravedad;
  /** `true` en la última marca de una columna con más de las que caben: aro hueco del mismo color ("y más"). */
  hueca: boolean;
}

export interface ColumnaHorizonte {
  dia: number;
  /** Para `style:grid-column-start`: día + 1 (1 a 31). */
  columna: number;
  /** De abajo hacia arriba (con `flex-direction: column-reverse` el primero queda abajo). */
  marcas: MarcaHorizonte[];
  /** Cuántos vencimientos hay ese día, se dibujen o no. */
  total: number;
  /** Las que no tienen marca llena (`total` menos las llenas); las representa el aro hueco. El número exacto está en la lista. */
  ocultas: number;
}

export interface CajaVencidos {
  /** "Vencidos y faltantes" (completa) o "Vencidos" (mediana). */
  rotulo: string;
  cifra: number;
  /** Con 0 la caja va en gris y con "0" (5.6); con más, en crítico. */
  conAlerta: boolean;
}

export interface Horizonte {
  variante: VarianteHorizonte;
  /** Solo los días con marcas, en orden creciente. */
  columnas: ColumnaHorizonte[];
  /** Sin ninguna marca (aunque haya vencidos). */
  vacio: boolean;
  /** Vencidos y faltantes (los que no entran en la pista: van en la caja o en la etiqueta de la fila). */
  vencidos: number;
  porGrupo: Record<Grupo, number>;
  /** `null` en la mínima. */
  cajaVencidos: CajaVencidos | null;
  /** Rótulos de la escala (vacía en la mínima). */
  escala: readonly MarcaDeEscala[];
  /** "Nada vence en los próximos 30 días" para centrar sobre la pista vacía; `null` si hay marcas o es la mínima. */
  textoVacio: string | null;
  /** Texto del `aria-label` del `role="img"`; `null` en la mínima (va con `aria-hidden="true"`). */
  etiquetaAria: string | null;
  ocultoAAyudas: boolean;
}

export interface OpcionesHorizonte {
  /** Cambia el máximo de marcas dibujadas por día (por defecto `MAX_APILADAS[variante]`). */
  maxApiladas?: number;
}

const TRAMO_DE_GRUPO: Record<"7" | "15" | "30", TramoHorizonte> = { "7": "semana", "15": "quincena", "30": "mes" };

function agrupar(alertas: readonly Alerta[], max: number): ColumnaHorizonte[] {
  const porDia = new Map<number, Alerta[]>();
  for (const a of alertas) {
    // Solo las que están por vencer entran en la pista; `d` está entre 0 y 30 por construcción (V2 a V4).
    if (a.tipo !== "documento-por-vencer" || a.d === null) continue;
    porDia.set(a.d, [...(porDia.get(a.d) ?? []), a]);
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dia, delDia]) => {
      const total = delDia.length;
      const hayMas = total > max;
      // Con más de las que caben: max - 1 llenas y la última hueca ("y más").
      const dibujadas = hayMas ? delDia.slice(0, Math.max(max - 1, 0)) : delDia;
      const marcas: MarcaHorizonte[] = dibujadas.map((a) => ({
        alertaId: a.id,
        dia,
        tramo: TRAMO_DE_GRUPO[a.grupo as "7" | "15" | "30"],
        gravedad: a.gravedad,
        hueca: false,
      }));
      if (hayMas && max > 0) {
        const ultima = delDia[dibujadas.length] as Alerta;
        marcas.push({ alertaId: ultima.id, dia, tramo: tramoDeDia(dia), gravedad: ultima.gravedad, hueca: true });
      }
      return { dia, columna: dia + 1, marcas, total, ocultas: total - dibujadas.length };
    });
}

function construir(
  alertas: readonly Alerta[],
  variante: VarianteHorizonte,
  opciones: OpcionesHorizonte,
  soloLaMasProxima: boolean,
): Horizonte {
  // Solo vencimientos: las alertas de operación (partes, novedades) no son del horizonte.
  const deVencimientos = alertas.filter((a) => a.categoria === "vencimientos");
  const porGrupo: Record<Grupo, number> = { vencidos: 0, "7": 0, "15": 0, "30": 0 };
  for (const a of deVencimientos) porGrupo[a.grupo as Grupo] += 1;

  const max = opciones.maxApiladas ?? MAX_APILADAS[variante];
  let columnas = agrupar(deVencimientos, max);
  if (soloLaMasProxima) {
    // El texto de la celda habla del próximo vencimiento: la pista marca ese y nada más.
    const primera = columnas[0];
    columnas = primera === undefined ? [] : [{ ...primera, marcas: primera.marcas.slice(0, 1).map((m) => ({ ...m, hueca: false })), ocultas: 0 }];
  }
  const vacio = columnas.length === 0;
  const minima = variante === "minima";
  return {
    variante,
    columnas,
    vacio,
    vencidos: porGrupo.vencidos,
    porGrupo,
    cajaVencidos: minima
      ? null
      : {
          rotulo: variante === "completa" ? TEXTO_HORIZONTE.rotuloCajaCompleta : TEXTO_HORIZONTE.rotuloCajaMediana,
          cifra: porGrupo.vencidos,
          conAlerta: porGrupo.vencidos > 0,
        },
    escala: minima ? [] : variante === "completa" ? ESCALA_COMPLETA : ESCALA_MEDIANA,
    textoVacio: vacio && !minima ? TEXTO_HORIZONTE.vacio : null,
    etiquetaAria: minima ? null : textoHorizonte(porGrupo),
    ocultoAAyudas: minima,
  };
}

// --- Regla interactiva (Inicio y Vencimientos) -----------------------------------------------------

/** La forma dice el tramo sin depender del color: triángulo hasta 7 días, círculo hasta 15, aro hasta 30 y rombo para lo vencido o faltante. */
export type FormaDeMarca = "rombo" | "triangulo" | "circulo" | "aro";

const FORMA_DE_TRAMO: Record<TramoHorizonte, FormaDeMarca> = { semana: "triangulo", quincena: "circulo", mes: "aro" };

export function formaDeTramo(tramo: TramoHorizonte): FormaDeMarca {
  return FORMA_DE_TRAMO[tramo];
}

export function formaDeGrupo(grupo: Grupo): FormaDeMarca {
  return grupo === "vencidos" ? "rombo" : FORMA_DE_TRAMO[TRAMO_DE_GRUPO[grupo]];
}

/** La regla interactiva tiene dos filas: por día entran dos marcas, o una marca y «y N más». */
export const FILAS_DE_REGLA = 2;
export const MAX_POR_DIA_EN_REGLA = 2;
/** Dos marcas más cerca que esto (en días) no entran en la misma fila: se pisarían sus etiquetas. */
export const SEPARACION_MINIMA_EN_DIAS = 2.7;

/**
 * A qué fila va cada marca, dadas las fechas (días desde hoy) en orden de recorrido: la primera fila donde entra sin pisar a la anterior; si no entra en
 * ninguna, la que quedó más lejos. No cambia lo que recibe.
 */
export function asignarFilas(dias: readonly number[]): (0 | 1)[] {
  const ultimo: (number | undefined)[] = Array.from({ length: FILAS_DE_REGLA }, () => undefined);
  return dias.map((dia) => {
    let fila = ultimo.findIndex((u) => u === undefined || dia - u >= SEPARACION_MINIMA_EN_DIAS);
    if (fila < 0) fila = ultimo.reduce<number>((mejor, u, j) => ((u ?? -Infinity) < (ultimo[mejor] ?? -Infinity) ? j : mejor), 0);
    ultimo[fila] = dia;
    return fila === 0 ? 0 : 1;
  });
}

interface BaseDeElemento {
  /** Para «y N más», la primera alerta que quedó sin marca propia. */
  alertaId: string;
  dia: number;
  /** Día + 1: la línea de la grilla de 31 columnas. */
  columna: number;
  tramo: TramoHorizonte;
  fila: 0 | 1;
}

/** Cada cosa que se puede elegir en la regla, en el orden en que la recorren las flechas. */
export type ElementoDeRegla =
  | (BaseDeElemento & { tipo: "marca"; forma: FormaDeMarca })
  /** «y N más»: los documentos de ese día que no tienen marca propia. Lleva a la lista de ese tramo, no abre un detalle. */
  | (BaseDeElemento & { tipo: "mas"; mas: number });

/** Aplana las columnas de un horizonte en el orden de recorrido (de hoy hacia adelante) y le da su fila a cada elemento. */
export function recorridoDeRegla(h: Horizonte): ElementoDeRegla[] {
  const marcas = h.columnas.flatMap((c) => c.marcas.map((m) => ({ m, c })));
  const filas = asignarFilas(marcas.map(({ m }) => m.dia));
  return marcas.map(({ m, c }, i): ElementoDeRegla => {
    const base = { alertaId: m.alertaId, dia: m.dia, columna: c.columna, tramo: m.tramo, fila: filas[i] ?? 0 };
    return m.hueca ? { ...base, tipo: "mas", mas: c.ocultas } : { ...base, tipo: "marca", forma: formaDeTramo(m.tramo) };
  });
}

type Entrada = Pick<ResultadoAlertas, "alertas">;

/** Centro de alertas: todos los vencimientos de unidades y de conductores. */
export function horizonteCompleto(r: Entrada, opciones: OpcionesHorizonte = {}): Horizonte {
  return construir(r.alertas, "completa", opciones, false);
}

/** Ficha de una unidad: solo los documentos de esa unidad (no los de su conductor). */
export function horizonteDeUnidad(r: Entrada, unidadId: string, opciones: OpcionesHorizonte = {}): Horizonte {
  return construir(
    r.alertas.filter((a) => a.unidadId === unidadId),
    "mediana",
    opciones,
    false,
  );
}

/** Columna "Próximo vencimiento" de la flota: una sola marca, la del vencimiento más próximo de la unidad. */
export function horizonteMinimo(r: Entrada, unidadId: string, opciones: OpcionesHorizonte = {}): Horizonte {
  return construir(
    r.alertas.filter((a) => a.unidadId === unidadId),
    "minima",
    opciones,
    true,
  );
}
