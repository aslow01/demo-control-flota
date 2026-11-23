// Alertas (docs/diseno.md, sección 7): `calcularAlertas` es una función pura; una alerta no se guarda, se recalcula.

import { resumenDeAptitud, type ResumenAptitud } from "./aptitud.ts";
import { diasEntre, fechaEnArgentina, sumarDias } from "./fechas.ts";
import { rotuloNovedad, textoOrigenNovedad } from "./novedades.ts";
import { TEXTO_ALERTA, pluralizar } from "./textos.ts";
import type { Conductor, Documento, Estado, FechaCivil, Novedad, Parte, Titular, TipoDocumento, Unidad } from "./tipos.ts";
import {
  NOMBRES_DOCUMENTO,
  REQUISITOS,
  compararUrgencia,
  documentoVigente,
  estadoDeLicencia,
  evaluarObligatorio,
  tiposObligatoriosDeConductor,
  tiposObligatoriosDeUnidad,
  type EstadoLicencia,
  type Evaluacion,
  type Grupo,
} from "./vencimientos.ts";

export type TipoAlerta =
  | "documento-faltante"
  | "documento-vencido"
  | "documento-por-vencer"
  | "novedad-critica"
  | "parte-sin-enviar"
  | "sin-parte"
  | "novedad-abierta";

export type TipoAlertaOperacion = Exclude<TipoAlerta, "documento-faltante" | "documento-vencido" | "documento-por-vencer">;

/** Crítica: vencido, faltante, novedad crítica. Media: por vencer en 7 días y pendientes. Baja: 15 y 30 días. */
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
  /** Solo en `parte-sin-enviar` (P5): `borrador` = la revisión no se envió («sin enviar»); `en-uso` = falta el cierre («sin cerrar»). */
  etapaParte: "borrador" | "en-uso" | null;
}

/**
 * L6: un conductor activo cuya licencia no ampara hoy. `alertaId` es la alerta de vencimiento de su licencia (la que abre «Renovar» o «Cargar»); `null` si no
 * tiene una.
 */
export interface ConductorSinLicencia {
  conductorId: string;
  nombre: string;
  motivo: Exclude<EstadoLicencia, { vigente: true }>;
  alertaId: string | null;
}

export interface PuntoHorizonte {
  /** 0 a 30. */
  dia: number;
  grupo: "7" | "15" | "30";
  alertaId: string;
}

export interface ResumenAlertas extends ResumenAptitud {
  /** L6: conductores activos que hoy no pueden manejar, ordenados por nombre. No cambia el protagonista (A8) ni la aptitud de ninguna unidad. */
  conductoresSinLicencia: ConductorSinLicencia[];
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
    // M4 (confirmado por Matías el 18/11/2026): un documento que solo se exige en ciertos proyectos y este no lo exige (la habilitación de ingreso en
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
      etapaParte: null,
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
// Operación (A3, N5, P5, P6)
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
    etapaParte: null,
  };
}

function operacion(
  base: Pick<Alerta, "id" | "tipo" | "gravedad" | "texto" | "fecha"> & { unidadId: string; conductorId?: string | null; etapaParte?: Alerta["etapaParte"] },
): Alerta {
  return {
    categoria: "operacion",
    grupo: null,
    conductorId: base.conductorId ?? null,
    documentoId: null,
    tipoDocumento: null,
    d: null,
    etapaParte: null,
    ...base,
  };
}

function alertaParteSinEnviar(p: Parte, conductores: readonly Conductor[]): Alerta {
  const quien = conductores.find((c) => c.id === p.conductorId);
  const nombre = quien === undefined ? null : nombreCorto(quien.nombre);
  const enUso = p.estado === "en-uso";
  return operacion({
    id: `parte-sin-enviar:${p.id}`,
    tipo: "parte-sin-enviar",
    gravedad: "media",
    etapaParte: enUso ? "en-uso" : "borrador",
    texto: enUso ? TEXTO_ALERTA.parteSinCerrar(p.fecha, nombre) : TEXTO_ALERTA.parteSinEnviar(p.fecha, nombre),
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
    texto: TEXTO_ALERTA.sinParte(ayer),
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
    // P5: borrador o parte en uso de un día anterior a hoy (la revisión o el cierre quedaron sin enviar).
    if (p.estado !== "enviado" && p.fecha < hoy) alertas.push(alertaParteSinEnviar(p, estado.conductores));
  }

  // P6: en servicio, creada antes de ayer y sin parte de ayer (en ningún estado: borrador, en uso ni cerrado).
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

/** L6: los conductores activos sin licencia que ampare hoy, por nombre, cada uno con el id de su alerta de vencimiento de la licencia. */
function conductoresSinLicencia(estado: Estado, hoy: FechaCivil, vencimientos: readonly Alerta[]): ConductorSinLicencia[] {
  const lista: ConductorSinLicencia[] = [];
  for (const c of estado.conductores) {
    if (!c.activo) continue;
    const licencia = estadoDeLicencia(estado.documentos, c.id, hoy);
    if (licencia.vigente) continue;
    const alerta = vencimientos.find((a) => a.conductorId === c.id && a.tipoDocumento === "licencia");
    lista.push({ conductorId: c.id, nombre: c.nombre, motivo: licencia, alertaId: alerta?.id ?? null });
  }
  return lista.sort((a, b) => menor(a.nombre, b.nombre) || menor(a.conductorId, b.conductorId));
}

export function calcularAlertas(estado: Estado, hoy: FechaCivil): ResultadoAlertas {
  const vencimientos = alertasDeVencimientos(estado, hoy);
  const operacionAlertas = alertasDeOperacion(estado, hoy);
  const alertas = [...vencimientos, ...operacionAlertas];

  const porGrupo: Record<Grupo, number> = { vencidos: 0, "7": 0, "15": 0, "30": 0 };
  for (const a of vencimientos) porGrupo[a.grupo as Grupo] += 1;

  const operacionPorTipo: Record<TipoAlertaOperacion, number> = {
    "novedad-critica": 0,
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
      conductoresSinLicencia: conductoresSinLicencia(estado, hoy, vencimientos),
      porGrupo,
      operacion: operacionPorTipo,
      totalOperacion: operacionAlertas.length,
      criticas: alertas.filter((a) => a.gravedad === "critica").length,
    },
    horizonte,
  };
}
