// Alertas (docs/diseno.md, sección 7): `calcularAlertas` es una función pura; una alerta no se guarda, se recalcula.

import { resumenDeAptitud, type ResumenAptitud } from "./aptitud.ts";
import { diasEntre, fechaEnArgentina, formatearFecha, sumarDias } from "./fechas.ts";
import { rotuloNovedad, textoOrigenNovedad } from "./novedades.ts";
import { pluralizar } from "./textos.ts";
import type { Conductor, Documento, Estado, FechaCivil, Novedad, Parte, Titular, TipoDocumento, Unidad } from "./tipos.ts";
import {
  NOMBRES_DOCUMENTO,
  REQUISITOS,
  compararUrgencia,
  documentoVigente,
  evaluarObligatorio,
  tiposObligatoriosDeConductor,
  tiposObligatoriosDeUnidad,
  type Evaluacion,
  type Grupo,
} from "./vencimientos.ts";

export type TipoAlerta =
  | "documento-faltante"
  | "documento-vencido"
  | "documento-por-vencer"
  | "novedad-critica"
  | "uso-con-documentacion-vencida"
  | "parte-sin-enviar"
  | "sin-parte"
  | "novedad-abierta";

export type TipoAlertaOperacion = Exclude<TipoAlerta, "documento-faltante" | "documento-vencido" | "documento-por-vencer">;

/** Crítica: vencido, faltante, novedad crítica, uso con documentación vencida. Media: por vencer en 7 días y pendientes. Baja: 15 y 30 días. */
export type Gravedad = "critica" | "media" | "baja";

export interface Alerta {
  /** Estable entre cálculos (sirve de clave en la interfaz). */
  id: string;
  categoria: "vencimientos" | "operacion";
  tipo: TipoAlerta;
  gravedad: Gravedad;
  /** Solo las de vencimientos. */
  grupo: Grupo | null;
  /** Texto listo para mostrar (español neutro). */
  texto: string;
  unidadId: string | null;
  conductorId: string | null;
  documentoId: string | null;
  tipoDocumento: TipoDocumento | null;
  /** Días hasta el vencimiento (negativo si ya venció); `null` si falta el documento o no es un vencimiento. */
  d: number | null;
  /** Fecha de referencia de las alertas de operación (parte o novedad), para ordenar. */
  fecha: FechaCivil | null;
}

export interface PuntoHorizonte {
  /** 0 a 30. */
  dia: number;
  grupo: "7" | "15" | "30";
  alertaId: string;
}

export interface ResumenAlertas extends ResumenAptitud {
  porGrupo: Record<Grupo, number>;
  operacion: Record<TipoAlertaOperacion, number>;
  totalOperacion: number;
  /** Alertas críticas: es el número de la insignia de la pestaña. */
  criticas: number;
}

export interface ResultadoAlertas {
  /** Primero los vencimientos (V16) y después la operación (N5). */
  alertas: Alerta[];
  resumen: ResumenAlertas;
  horizonte: PuntoHorizonte[];
}

const ORDEN_GRUPO: Record<Grupo, number> = { vencidos: 0, "7": 1, "15": 2, "30": 3 };
const ORDEN_GRAVEDAD: Record<Gravedad, number> = { critica: 0, media: 1, baja: 2 };
const DIAS_AVISO_DOCUMENTACION_VENCIDA = 30;

/** `Luis Ferreyra` -> `L. Ferreyra`. */
export function nombreCorto(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((p) => p !== "");
  const primera = palabras[0];
  const ultima = palabras[palabras.length - 1];
  if (primera === undefined || ultima === undefined) return "";
  if (palabras.length === 1) return primera;
  return `${primera.charAt(0)}. ${ultima}`;
}

function menor(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------
// Vencimientos (V1 a V6, V9, V12 a V17)
// ---------------------------------------------------------------------------------------------

interface AlertaDeVencimiento {
  alerta: Alerta;
  evaluacion: Evaluacion;
  /** Patente o nombre, para desempatar (V16). */
  rotulo: string;
}

function alertasDeTitular(
  titular: Titular,
  rotulo: string,
  tiposObligatorios: readonly TipoDocumento[],
  documentos: readonly Documento[],
  hoy: FechaCivil,
): AlertaDeVencimiento[] {
  const resultado: AlertaDeVencimiento[] = [];
  for (const req of REQUISITOS) {
    if (req.titular !== titular.tipo) continue;
    const tipo = req.tipo;
    const vigente = documentoVigente(documentos, titular, tipo);
    // V17: un documento no obligatorio que falta no alerta; si está cargado, alerta como cualquier otro.
    const exigido = tiposObligatorios.includes(tipo);
    if (vigente === undefined && !exigido) continue;
    // M4 (a confirmar): un documento que solo se exige en ciertos proyectos y este no lo exige (la habilitación de ingreso en
    // la base de mantenimiento) alerta con gravedad baja: la aptitud (A1) no lo considera bloqueante y no tiene que subir la insignia.
    const noExigidoAqui = req.obligatorio === "si-proyecto-requiere" && !exigido;
    const evaluacion = evaluarObligatorio(vigente, hoy);
    if (evaluacion.estado === "vigente") continue;

    const base = {
      categoria: "vencimientos" as const,
      unidadId: titular.tipo === "unidad" ? titular.id : null,
      conductorId: titular.tipo === "conductor" ? titular.id : null,
      tipoDocumento: tipo,
      fecha: null,
      texto: `${evaluacion.texto} · ${NOMBRES_DOCUMENTO[tipo]}`,
    };
    if (evaluacion.estado === "faltante" || vigente === undefined) {
      resultado.push({
        alerta: {
          ...base,
          id: `falta:${titular.tipo}:${titular.id}:${tipo}`,
          tipo: "documento-faltante",
          gravedad: "critica",
          grupo: "vencidos",
          documentoId: null,
          d: null,
        },
        evaluacion,
        rotulo,
      });
    } else if (evaluacion.estado === "vencido") {
      resultado.push({
        alerta: {
          ...base,
          id: `doc:${vigente.id}`,
          tipo: "documento-vencido",
          gravedad: noExigidoAqui ? "baja" : "critica",
          grupo: "vencidos",
          documentoId: vigente.id,
          d: evaluacion.d,
        },
        evaluacion,
        rotulo,
      });
    } else {
      const grupo = evaluacion.grupo as Grupo;
      resultado.push({
        alerta: {
          ...base,
          id: `doc:${vigente.id}`,
          tipo: "documento-por-vencer",
          gravedad: grupo === "7" && !noExigidoAqui ? "media" : "baja",
          grupo,
          documentoId: vigente.id,
          d: evaluacion.d,
        },
        evaluacion,
        rotulo,
      });
    }
  }
  return resultado;
}

function alertasDeVencimientos(estado: Estado, hoy: FechaCivil): Alerta[] {
  const todas: AlertaDeVencimiento[] = [];
  for (const unidad of estado.unidades) {
    // V14: las bajas no alertan. V15: las unidades fuera de servicio sí.
    if (unidad.estado.tipo === "baja") continue;
    const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
    if (proyecto === undefined) continue;
    todas.push(
      ...alertasDeTitular({ tipo: "unidad", id: unidad.id }, unidad.patente, tiposObligatoriosDeUnidad(proyecto), estado.documentos, hoy),
    );
  }
  for (const conductor of estado.conductores) {
    // V14: los conductores inactivos no alertan.
    if (!conductor.activo) continue;
    todas.push(
      ...alertasDeTitular({ tipo: "conductor", id: conductor.id }, conductor.nombre, tiposObligatoriosDeConductor(), estado.documentos, hoy),
    );
  }
  // V16: grupo; después faltantes primero y más vencido primero; después patente o nombre.
  todas.sort(
    (a, b) =>
      ORDEN_GRUPO[a.alerta.grupo as Grupo] - ORDEN_GRUPO[b.alerta.grupo as Grupo] ||
      compararUrgencia(a.evaluacion, b.evaluacion) ||
      menor(a.rotulo, b.rotulo) ||
      menor(a.alerta.id, b.alerta.id),
  );
  return todas.map((x) => x.alerta);
}

// ---------------------------------------------------------------------------------------------
// Operación (A3, N5, P5, P6, P9)
// ---------------------------------------------------------------------------------------------

function textoAntiguedad(dias: number): string {
  if (dias <= 0) return "abierta hoy";
  return `abierta hace ${pluralizar(dias, "día", "días")}`;
}

function alertaDeNovedad(n: Novedad, hoy: FechaCivil): Alerta {
  const critica = n.gravedad === "critica";
  const conItem = n.origen.tipo === "parte" && n.origen.item !== "otra";
  const prefijo = n.origen.tipo === "parte" ? `${rotuloNovedad(n)}: ` : "";
  let texto: string;
  if (critica) {
    // "Frenos: ruido al frenar en bajada (parte del 16/11/2026)"
    texto = `${prefijo}${n.descripcion} (${textoOrigenNovedad(n)})`;
  } else {
    // "Luz de patente quemada · abierta hace 9 días" (con el ítem delante si salió de un ítem del checklist)
    texto = `${conItem ? prefijo : ""}${n.descripcion} · ${textoAntiguedad(diasEntre(n.fecha, hoy))}`;
  }
  return {
    id: `novedad:${n.id}`,
    categoria: "operacion",
    tipo: critica ? "novedad-critica" : "novedad-abierta",
    gravedad: critica ? "critica" : "media",
    grupo: null,
    texto,
    unidadId: n.unidadId,
    conductorId: null,
    documentoId: null,
    tipoDocumento: null,
    d: null,
    fecha: n.fecha,
  };
}

function operacion(base: Pick<Alerta, "id" | "tipo" | "gravedad" | "texto" | "fecha"> & { unidadId: string; conductorId?: string | null }): Alerta {
  return {
    categoria: "operacion",
    grupo: null,
    conductorId: base.conductorId ?? null,
    documentoId: null,
    tipoDocumento: null,
    d: null,
    ...base,
  };
}

function alertaUsoConDocumentacionVencida(p: Parte): Alerta {
  const nombres = p.documentacionVencida.map((t) => NOMBRES_DOCUMENTO[t]).join(", ");
  return operacion({
    id: `uso-doc:${p.id}`,
    tipo: "uso-con-documentacion-vencida",
    gravedad: "critica",
    texto: `Circuló con documentación vencida: ${nombres} (parte del ${formatearFecha(p.fecha)})`,
    fecha: p.fecha,
    unidadId: p.unidadId,
    conductorId: p.conductorId,
  });
}

function alertaParteSinEnviar(p: Parte, conductores: readonly Conductor[]): Alerta {
  const quien = conductores.find((c) => c.id === p.conductorId);
  const sufijo = quien === undefined ? "" : ` (empezado por ${nombreCorto(quien.nombre)})`;
  return operacion({
    id: `parte-sin-enviar:${p.id}`,
    tipo: "parte-sin-enviar",
    gravedad: "media",
    texto: `Parte del ${formatearFecha(p.fecha)} sin enviar${sufijo}`,
    fecha: p.fecha,
    unidadId: p.unidadId,
    conductorId: p.conductorId,
  });
}

function alertaSinParte(u: Unidad, ayer: FechaCivil): Alerta {
  return operacion({
    id: `sin-parte:${u.id}:${ayer}`,
    tipo: "sin-parte",
    gravedad: "media",
    texto: `Sin parte de ayer (${formatearFecha(ayer)})`,
    fecha: ayer,
    unidadId: u.id,
  });
}

function alertasDeOperacion(estado: Estado, hoy: FechaCivil): Alerta[] {
  const activas = new Map<string, Unidad>();
  for (const u of estado.unidades) if (u.estado.tipo !== "baja") activas.set(u.id, u);
  const alertas: Alerta[] = [];

  for (const n of estado.novedades) {
    if (n.estado === "abierta" && activas.has(n.unidadId)) alertas.push(alertaDeNovedad(n, hoy));
  }

  for (const p of estado.partes) {
    if (!activas.has(p.unidadId)) continue;
    if (p.estado === "enviado" && p.documentacionVencida.length > 0) {
      // P9: la alerta dura 30 días desde la fecha del parte.
      const dias = diasEntre(p.fecha, hoy);
      if (dias >= 0 && dias <= DIAS_AVISO_DOCUMENTACION_VENCIDA) alertas.push(alertaUsoConDocumentacionVencida(p));
    }
    // P5: borrador de un día anterior a hoy.
    if (p.estado === "borrador" && p.fecha < hoy) alertas.push(alertaParteSinEnviar(p, estado.conductores));
  }

  // P6: en servicio, creada antes de ayer y sin parte de ayer (enviado ni borrador).
  const ayer = sumarDias(hoy, -1);
  for (const u of activas.values()) {
    if (u.estado.tipo !== "en-servicio") continue;
    if (fechaEnArgentina(u.creada) >= ayer) continue;
    const tieneParteDeAyer = estado.partes.some((p) => p.unidadId === u.id && p.fecha === ayer);
    if (!tieneParteDeAyer) alertas.push(alertaSinParte(u, ayer));
  }

  // N5: críticas primero; dentro de cada gravedad, la más antigua primero.
  const patente = (a: Alerta): string => (a.unidadId === null ? "" : (activas.get(a.unidadId)?.patente ?? ""));
  return alertas.sort(
    (a, b) =>
      ORDEN_GRAVEDAD[a.gravedad] - ORDEN_GRAVEDAD[b.gravedad] ||
      menor(a.fecha ?? "", b.fecha ?? "") ||
      menor(patente(a), patente(b)) ||
      menor(a.id, b.id),
  );
}

// ---------------------------------------------------------------------------------------------

export function calcularAlertas(estado: Estado, hoy: FechaCivil): ResultadoAlertas {
  const vencimientos = alertasDeVencimientos(estado, hoy);
  const operacionAlertas = alertasDeOperacion(estado, hoy);
  const alertas = [...vencimientos, ...operacionAlertas];

  const porGrupo: Record<Grupo, number> = { vencidos: 0, "7": 0, "15": 0, "30": 0 };
  for (const a of vencimientos) porGrupo[a.grupo as Grupo] += 1;

  const operacionPorTipo: Record<TipoAlertaOperacion, number> = {
    "novedad-critica": 0,
    "uso-con-documentacion-vencida": 0,
    "parte-sin-enviar": 0,
    "sin-parte": 0,
    "novedad-abierta": 0,
  };
  for (const a of operacionAlertas) operacionPorTipo[a.tipo as TipoAlertaOperacion] += 1;

  const horizonte: PuntoHorizonte[] = vencimientos
    .filter((a) => a.tipo === "documento-por-vencer")
    .map((a) => ({ dia: a.d as number, grupo: a.grupo as "7" | "15" | "30", alertaId: a.id }))
    .sort((a, b) => a.dia - b.dia || menor(a.alertaId, b.alertaId));

  return {
    alertas,
    resumen: {
      ...resumenDeAptitud(estado, hoy),
      porGrupo,
      operacion: operacionPorTipo,
      totalOperacion: operacionAlertas.length,
      criticas: alertas.filter((a) => a.gravedad === "critica").length,
    },
    horizonte,
  };
}
