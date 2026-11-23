// Comandos (docs/diseno.md, sección 8): toda modificación es un comando puro
// `aplicar(estado, comando, contexto) -> { cambios, eventos } | error`. El repositorio escribe los dos en una sola transacción.
// Reglas de este archivo: A3 a A7, K5, L1, L3, L4, N1 a N3, P1 a P4, P7, P8, P14 a P16, V10, V11, U1 a U7, H1, D11.

import { aplicarCambios, sinCambios, type Cambios } from "./estado.ts";
import { diasEntre, fechaEnArgentina, parsearFechaCivil, parsearInstante } from "./fechas.ts";
import { kmActual, registrosDeKm, validarKmDeCierre, validarKmDeSalida } from "./kilometraje.ts";
import { criticasAbiertasDeUnidad, rotuloNovedad } from "./novedades.ts";
import {
  ITEMS_CHECKLIST,
  advertenciasDeRevision,
  documentacionVencidaEn,
  esBorradorVacio,
  faltantesDeCierre,
  faltantesDeRevision,
  validarLitros,
  novedadesDelParte,
  parteEnUsoDelConductor,
  partePendienteDeCierre,
  validarFechaParte,
} from "./parte.ts";
import { formatearPatente } from "./patente.ts";
import { limpiarTexto, normalizarTexto } from "./texto.ts";
import { ERRORES, MOTIVO_NOVEDAD_CRITICA, RESUMEN_EVENTO, TEXTO_DIALOGOS_FICHA, abreviar, errDocumentoExistente, errKmCorreccionAnterior, errKmCorreccionParteEnUso, errLicenciaNoVigente, errConductorConParteSinCerrar, errNovedadesCriticasAbiertas, errParteAnteriorSinCerrar, errParteDuplicado, errRenovacionNoPosterior, errVenceNoPosteriorAlAnterior, errTipoDeDocumentoNoCorresponde, errUnidadConParteEnUso, errUnidadDeBaja, errUnidadFueraDeServicio, errVenceAntesQueSuRenovacion, textoFaltantes } from "./textos.ts";
import {
  fallo,
  ok,
  type Advertencia,
  type Conductor,
  type Documento,
  type Estado,
  type Evento,
  type FechaCivil,
  type Instante,
  type NivelCombustible,
  type Novedad,
  type Parte,
  type Proyecto,
  type Resultado,
  type TipoDocumento,
  type TipoEvento,
  type TipoUnidad,
  type Titular,
  type Unidad,
} from "./tipos.ts";
import {
  REGLAS,
  validarAnioDeAlta,
  validarFecha,
  validarFechaNoFutura,
  validarInternoDeAlta,
  validarKmNumero,
  validarPatenteDeAlta,
  validarTexto,
  validarTextoDeBorrador,
  validarVencimiento,
} from "./validacion.ts";
import { NOMBRES_DOCUMENTO, REQUISITOS, documentoVigente, esTipoDocumento, estadoDeLicencia, type EstadoLicencia } from "./vencimientos.ts";

/** Lo que el dominio necesita saber del momento y de quién actúa. El reloj y los ids se inyectan: nada es global. */
export interface Contexto {
  /** Fecha civil de hoy en Argentina (T1). */
  hoy: FechaCivil;
  ahora: Instante;
  autor: string;
  nuevoId: () => string;
}

export type Comando =
  | {
      tipo: "altaUnidad";
      patente: string;
      interno: number;
      marca: string;
      modelo: string;
      anio: number;
      /** Lo que llega del formulario: el comando comprueba que sea uno de `TIPOS_DE_UNIDAD` (no se afirma el tipo antes de tiempo). */
      tipoUnidad: string;
      proyectoId: string;
      conductorId: string | null;
    }
  | { tipo: "cambiarAsignacion"; unidadId: string; proyectoId: string; conductorId: string | null }
  | {
      tipo: "cargarDocumento";
      titular: Titular;
      /** Igual que `tipoUnidad`: el comando comprueba que sea un `TipoDocumento` (`esTipoDocumento`). */
      tipoDocumento: string;
      numero: string;
      emisor: string;
      vence: string;
      emitido: string | null;
    }
  | { tipo: "renovarDocumento"; documentoId: string; numero: string; emisor: string; vence: string; emitido: string | null }
  | {
      tipo: "corregirDocumento";
      documentoId: string;
      numero?: string;
      emisor?: string;
      vence?: string;
      emitido?: string | null;
    }
  | {
      tipo: "guardarBorrador";
      /** `null` crea un borrador nuevo; con un id, actualiza ese borrador. */
      parteId: string | null;
      unidadId: string;
      fecha: string;
      conductorId: string | null;
      kmInicio: number | null;
      kmFin: number | null;
      combustible: NivelCombustible | null;
      litrosCargados: number | null;
      checklist: Parte["checklist"];
      otraNovedad: Parte["otraNovedad"];
    }
  /** La revisión antes de salir (reemplaza a `enviarParte`, sección 17): el parte pasa a en uso o, con una novedad crítica, se cierra sin salida. */
  | { tipo: "enviarRevision"; parteId: string; advertenciasAceptadas: Advertencia["tipo"][] }
  /** Autoguardado del cierre de un parte en uso. */
  | { tipo: "guardarCierre"; parteId: string; kmFin: number | null; combustible: NivelCombustible | null; litrosCargados: number | null }
  | { tipo: "enviarCierre"; parteId: string; advertenciasAceptadas: Advertencia["tipo"][] }
  | { tipo: "descartarBorrador"; parteId: string }
  | { tipo: "cargarNovedad"; unidadId: string; descripcion: string; impideUso: boolean }
  | { tipo: "resolverNovedad"; novedadId: string; texto: string; volverAServicio: boolean }
  | { tipo: "ponerFueraDeServicio"; unidadId: string; motivo: string }
  | { tipo: "volverAServicio"; unidadId: string }
  | { tipo: "corregirKilometraje"; unidadId: string; desde: string; kmBase: number; motivo: string }
  | { tipo: "darDeBaja"; unidadId: string; motivo: string };

export interface Aplicacion {
  cambios: Cambios;
  eventos: Evento[];
}

export interface Ejecucion extends Aplicacion {
  /** El estado con los cambios y los eventos ya aplicados. */
  estado: Estado;
}

interface EventoNuevo {
  tipo: TipoEvento;
  unidadId: string | null;
  conductorId: string | null;
  resumen: string;
  datos: Record<string, unknown>;
}

interface Parcial {
  cambios: Partial<Cambios>;
  eventos: EventoNuevo[];
  /** `false` solo para el autoguardado de un borrador vacío (D11). */
  modifica: boolean;
}

export const TIPOS_DE_UNIDAD: readonly TipoUnidad[] = ["camioneta", "utilitario", "camion-liviano", "minibus"];

/** Guarda de tipo: `true` si el texto es uno de los tipos de unidad del dominio. */
export function esTipoDeUnidad(valor: string): valor is TipoUnidad {
  return TIPOS_DE_UNIDAD.some((t) => t === valor);
}
const NIVELES_COMBUSTIBLE: readonly NivelCombustible[] = ["reserva", "cuarto", "medio", "tres-cuartos", "lleno"];
const LARGO_MAXIMO_MOTIVO = 200;

// ---------------------------------------------------------------------------------------------
// Entrada pública
// ---------------------------------------------------------------------------------------------

/**
 * M2: el contexto lo arma el código de la aplicación (el reloj), no el usuario; si está mal es un error de programación y
 * se lanza, para que un `ahora` inválido no llegue a guardarse y deje el centro de alertas sin poder calcularse.
 */
function validarContexto(ctx: Contexto): void {
  if (typeof ctx.hoy !== "string" || parsearFechaCivil(ctx.hoy) === null) {
    throw new Error(`Contexto inválido: 'hoy' tiene que ser una fecha AAAA-MM-DD válida (llegó ${JSON.stringify(ctx.hoy)}).`);
  }
  // `ahora` tiene que ser exactamente lo que devuelve toISOString (con milisegundos y Z): los instantes se comparan como texto.
  const ms = typeof ctx.ahora === "string" ? parsearInstante(ctx.ahora) : null;
  if (ms === null || new Date(ms).toISOString() !== ctx.ahora) {
    throw new Error(
      `Contexto inválido: 'ahora' tiene que ser un instante UTC con milisegundos y Z, como 2026-11-18T15:00:00.000Z (llegó ${JSON.stringify(ctx.ahora)}).`,
    );
  }
  if (fechaEnArgentina(ctx.ahora) !== ctx.hoy) {
    throw new Error(
      `Contexto inválido: 'hoy' (${ctx.hoy}) no coincide con la fecha de Argentina de 'ahora' (${fechaEnArgentina(ctx.ahora)}).`,
    );
  }
  if (typeof ctx.autor !== "string" || ctx.autor.trim() === "") throw new Error("Contexto inválido: 'autor' no puede estar vacío.");
  if (typeof ctx.nuevoId !== "function") throw new Error("Contexto inválido: 'nuevoId' tiene que ser una función.");
}

/** Aplica un comando sin modificar el estado: devuelve los cambios y los eventos que hay que escribir, o el error. */
export function aplicar(estado: Estado, comando: Comando, ctx: Contexto): Resultado<Aplicacion> {
  validarContexto(ctx);
  const r = manejar(estado, comando, ctx);
  if (!r.ok) return r;
  const { cambios: parcial, eventos: nuevos, modifica } = r.valor;
  const cambios: Cambios = { ...sinCambios(), ...parcial };
  if (modifica && !estado.meta.modificada) cambios.meta = { ...estado.meta, modificada: true };

  let secuencia = estado.eventos.reduce((max, e) => Math.max(max, e.secuencia), 0);
  const eventos: Evento[] = nuevos.map((e) => ({
    id: ctx.nuevoId(),
    secuencia: ++secuencia,
    instante: ctx.ahora,
    unidadId: e.unidadId,
    conductorId: e.conductorId,
    tipo: e.tipo,
    resumen: e.resumen,
    // M6: el evento tiene su propia copia; no comparte arreglos ni objetos con el estado (los eventos no se editan, H2).
    datos: structuredClone(e.datos),
    autor: ctx.autor,
  }));
  return ok({ cambios, eventos });
}

/** `aplicar` y, si salió bien, el estado resultante. */
export function ejecutar(estado: Estado, comando: Comando, ctx: Contexto): Resultado<Ejecucion> {
  const r = aplicar(estado, comando, ctx);
  if (!r.ok) return r;
  return ok({ ...r.valor, estado: aplicarCambios(estado, r.valor.cambios, r.valor.eventos) });
}

function manejar(estado: Estado, c: Comando, ctx: Contexto): Resultado<Parcial> {
  switch (c.tipo) {
    case "altaUnidad":
      return altaUnidad(estado, c, ctx);
    case "cambiarAsignacion":
      return cambiarAsignacion(estado, c);
    case "cargarDocumento":
      return cargarDocumento(estado, c, ctx);
    case "renovarDocumento":
      return renovarDocumento(estado, c, ctx);
    case "corregirDocumento":
      return corregirDocumento(estado, c, ctx);
    case "guardarBorrador":
      return guardarBorrador(estado, c, ctx);
    case "enviarRevision":
      return enviarRevision(estado, c, ctx);
    case "guardarCierre":
      return guardarCierre(estado, c, ctx);
    case "enviarCierre":
      return enviarCierre(estado, c, ctx);
    case "descartarBorrador":
      return descartarBorrador(estado, c);
    case "cargarNovedad":
      return cargarNovedad(estado, c, ctx);
    case "resolverNovedad":
      return resolverNovedad(estado, c, ctx);
    case "ponerFueraDeServicio":
      return ponerFueraDeServicio(estado, c, ctx);
    case "volverAServicio":
      return volverAServicio(estado, c);
    case "corregirKilometraje":
      return corregirKilometraje(estado, c, ctx);
    case "darDeBaja":
      return darDeBaja(estado, c, ctx);
    default: {
      const inalcanzable: never = c;
      throw new Error(`Comando desconocido: ${JSON.stringify(inalcanzable)}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Búsquedas comunes
// ---------------------------------------------------------------------------------------------

function pat(u: Unidad): string {
  return formatearPatente(u.patente);
}

function buscarUnidad(estado: Estado, id: string): Resultado<Unidad> {
  const u = estado.unidades.find((x) => x.id === id);
  return u === undefined ? fallo("unidad-inexistente", ERRORES.unidadInexistente) : ok(u);
}

/** La unidad existe y no está de baja. */
function buscarUnidadActiva(estado: Estado, id: string): Resultado<Unidad> {
  const r = buscarUnidad(estado, id);
  if (!r.ok) return r;
  const e = r.valor.estado;
  if (e.tipo === "baja") return fallo("unidad-de-baja", errUnidadDeBaja(pat(r.valor), e.desde));
  return r;
}

function buscarProyecto(estado: Estado, id: string): Resultado<Proyecto> {
  const p = estado.proyectos.find((x) => x.id === id);
  return p === undefined ? fallo("proyecto-inexistente", ERRORES.proyectoInexistente, { campo: "proyectoId" }) : ok(p);
}

/** `null` = sin conductor asignado; si hay id, tiene que existir y estar activo. */
function buscarConductorActivo(estado: Estado, id: string | null, campo: string): Resultado<Conductor | null> {
  if (id === null) return ok(null);
  const c = estado.conductores.find((x) => x.id === id);
  if (c === undefined) return fallo("conductor-inexistente", ERRORES.conductorInexistente, { campo });
  if (!c.activo) return fallo("conductor-inactivo", ERRORES.conductorInactivo, { campo });
  return ok(c);
}

function nombreDeConductor(estado: Estado, id: string | null): string {
  if (id === null) return "sin conductor asignado";
  return estado.conductores.find((c) => c.id === id)?.nombre ?? "conductor desconocido";
}

/** Cómo se nombra al titular de un documento en los resúmenes: la patente o el nombre del conductor. */
function etiquetaDeTitular(estado: Estado, titular: Titular): string {
  if (titular.tipo === "unidad") {
    const u = estado.unidades.find((x) => x.id === titular.id);
    return u === undefined ? "unidad desconocida" : pat(u);
  }
  return nombreDeConductor(estado, titular.id);
}

// ---------------------------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------------------------

function altaUnidad(estado: Estado, c: Extract<Comando, { tipo: "altaUnidad" }>, ctx: Contexto): Resultado<Parcial> {
  const patente = validarPatenteDeAlta(estado.unidades, c.patente);
  if (!patente.ok) return patente;
  const interno = validarInternoDeAlta(estado.unidades, c.interno);
  if (!interno.ok) return interno;
  const anio = validarAnioDeAlta(c.anio, ctx.hoy);
  if (!anio.ok) return anio;

  const marca = validarTexto(c.marca, REGLAS.marca);
  if (!marca.ok) return marca;
  const modelo = validarTexto(c.modelo, REGLAS.modelo);
  if (!modelo.ok) return modelo;
  if (!esTipoDeUnidad(c.tipoUnidad)) {
    return fallo("tipo-unidad-invalido", ERRORES.tipoDeUnidadInvalido, { campo: "tipoUnidad" });
  }
  const proyecto = buscarProyecto(estado, c.proyectoId);
  if (!proyecto.ok) return proyecto;
  const conductor = buscarConductorActivo(estado, c.conductorId, "conductorId");
  if (!conductor.ok) return conductor;

  const unidad: Unidad = {
    id: ctx.nuevoId(),
    patente: patente.valor,
    interno: interno.valor,
    marca: marca.valor,
    modelo: modelo.valor,
    anio: anio.valor,
    tipo: c.tipoUnidad,
    proyectoId: proyecto.valor.id,
    conductorId: c.conductorId,
    estado: { tipo: "en-servicio" },
    creada: ctx.ahora,
  };
  return ok({
    cambios: { unidades: [unidad] },
    eventos: [
      {
        tipo: "unidad-alta",
        unidadId: unidad.id,
        conductorId: null,
        resumen: RESUMEN_EVENTO.unidadAlta(pat(unidad), unidad.interno),
        datos: { patente: unidad.patente, interno: unidad.interno, proyectoId: unidad.proyectoId },
      },
    ],
    modifica: true,
  });
}

function cambiarAsignacion(estado: Estado, c: Extract<Comando, { tipo: "cambiarAsignacion" }>): Resultado<Parcial> {
  const unidad = buscarUnidadActiva(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const proyecto = buscarProyecto(estado, c.proyectoId);
  if (!proyecto.ok) return proyecto;
  const conductor = buscarConductorActivo(estado, c.conductorId, "conductorId");
  if (!conductor.ok) return conductor;

  const u = unidad.valor;
  const cambiaProyecto = u.proyectoId !== c.proyectoId;
  const cambiaConductor = u.conductorId !== c.conductorId;
  if (!cambiaProyecto && !cambiaConductor) return fallo("sin-cambios", ERRORES.sinCambios);

  const proyectoAntes = estado.proyectos.find((p) => p.id === u.proyectoId)?.nombre ?? "proyecto desconocido";
  const textoProyecto = `de ${proyectoAntes} a ${proyecto.valor.nombre}`;
  const textoConductor = `de ${nombreDeConductor(estado, u.conductorId)} a ${nombreDeConductor(estado, c.conductorId)}`;
  let resumen: string;
  if (cambiaProyecto && cambiaConductor) {
    resumen = RESUMEN_EVENTO.cambioDeProyectoYConductor(pat(u), textoProyecto, textoConductor);
  } else if (cambiaProyecto) {
    resumen = RESUMEN_EVENTO.cambioDeProyecto(pat(u), proyectoAntes, proyecto.valor.nombre);
  } else {
    resumen = RESUMEN_EVENTO.cambioDeConductor(
      pat(u),
      nombreDeConductor(estado, u.conductorId),
      nombreDeConductor(estado, c.conductorId),
    );
  }

  const nueva: Unidad = { ...u, proyectoId: c.proyectoId, conductorId: c.conductorId };
  return ok({
    cambios: { unidades: [nueva] },
    eventos: [
      {
        tipo: "asignacion-cambiada",
        unidadId: u.id,
        conductorId: c.conductorId,
        resumen,
        datos: {
          antes: { proyectoId: u.proyectoId, conductorId: u.conductorId },
          despues: { proyectoId: c.proyectoId, conductorId: c.conductorId },
        },
      },
    ],
    modifica: true,
  });
}

function darDeBaja(estado: Estado, c: Extract<Comando, { tipo: "darDeBaja" }>, ctx: Contexto): Resultado<Parcial> {
  const unidad = buscarUnidadActiva(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const motivo = validarTexto(c.motivo, REGLAS.motivoBaja);
  if (!motivo.ok) return motivo;
  const u = unidad.valor;
  // El cierre de un parte en uso se rechaza para una unidad de baja (A7): el parte quedaría huérfano. Primero hay que cerrarlo.
  const sinCerrar = partePendienteDeCierre(estado.partes, u.id);
  if (sinCerrar !== undefined) return fallo("unidad-con-parte-en-uso", errUnidadConParteEnUso(pat(u), sinCerrar.fecha), { detalle: { parteId: sinCerrar.id, fecha: sinCerrar.fecha } });
  return ok({
    cambios: { unidades: [{ ...u, estado: { tipo: "baja", desde: ctx.hoy, motivo: motivo.valor } }] },
    eventos: [
      {
        tipo: "unidad-baja",
        unidadId: u.id,
        conductorId: null,
        resumen: RESUMEN_EVENTO.unidadBaja(pat(u), motivo.valor),
        datos: { motivo: motivo.valor, estadoAnterior: u.estado.tipo },
      },
    ],
    modifica: true,
  });
}

function ponerFueraDeServicio(
  estado: Estado,
  c: Extract<Comando, { tipo: "ponerFueraDeServicio" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const unidad = buscarUnidadActiva(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const u = unidad.valor;
  if (u.estado.tipo === "fuera-de-servicio") return fallo("ya-fuera-de-servicio", ERRORES.unidadYaFueraDeServicio);
  const motivo = validarTexto(c.motivo, REGLAS.motivoFueraDeServicio);
  if (!motivo.ok) return motivo;
  return ok({
    cambios: {
      unidades: [
        { ...u, estado: { tipo: "fuera-de-servicio", desde: ctx.hoy, motivo: motivo.valor, origen: "manual", novedadIds: [] } },
      ],
    },
    eventos: [
      {
        tipo: "fuera-de-servicio",
        unidadId: u.id,
        conductorId: null,
        resumen: RESUMEN_EVENTO.fueraDeServicio(pat(u), motivo.valor),
        datos: { origen: "manual", motivo: motivo.valor },
      },
    ],
    modifica: true,
  });
}

/** A4 y A5: vuelve a servicio si no quedan novedades críticas abiertas (los documentos vencidos no lo impiden). */
function prepararVuelta(
  unidad: Unidad,
  novedades: readonly Novedad[],
): Resultado<{ unidad: Unidad; evento: EventoNuevo }> {
  const e = unidad.estado;
  if (e.tipo === "baja") return fallo("unidad-de-baja", errUnidadDeBaja(pat(unidad), e.desde));
  if (e.tipo === "en-servicio") return fallo("ya-en-servicio", ERRORES.unidadYaEnServicio);
  const abiertas = criticasAbiertasDeUnidad(novedades, unidad.id);
  if (abiertas.length > 0) {
    return fallo("novedades-criticas-abiertas", errNovedadesCriticasAbiertas(abiertas.map((n) => n.texto)), {
      detalle: { novedadIds: abiertas.map((n) => n.novedadId) },
    });
  }
  return ok({
    unidad: { ...unidad, estado: { tipo: "en-servicio" } },
    evento: {
      tipo: "vuelta-a-servicio",
      unidadId: unidad.id,
      conductorId: null,
      resumen: RESUMEN_EVENTO.vueltaAServicio(pat(unidad)),
      datos: { fueraDesde: e.desde, motivoAnterior: e.motivo },
    },
  });
}

function volverAServicio(estado: Estado, c: Extract<Comando, { tipo: "volverAServicio" }>): Resultado<Parcial> {
  const unidad = buscarUnidad(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const v = prepararVuelta(unidad.valor, estado.novedades);
  if (!v.ok) return v;
  return ok({ cambios: { unidades: [v.valor.unidad] }, eventos: [v.valor.evento], modifica: true });
}

function corregirKilometraje(
  estado: Estado,
  c: Extract<Comando, { tipo: "corregirKilometraje" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const unidad = buscarUnidadActiva(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const desde = validarFechaNoFutura(c.desde, ctx.hoy, "desde");
  if (!desde.ok) return desde;
  const km = validarKmNumero(c.kmBase, "kmBase");
  if (!km.ok) return km;
  const motivo = validarTexto(c.motivo, REGLAS.motivoKm);
  if (!motivo.ok) return motivo;

  const u = unidad.valor;
  // M3 (confirmado por Matías el 18/11/2026): kmActual es el último registro por fecha; una corrección anterior a un registro ya cargado no cambiaría
  // el kilometraje actual ni K3/K4 aunque el historial dijera que sí. Se rechaza en vez de aceptar algo que no tiene efecto.
  const posterior = registrosDeKm(u.id, estado.partes, estado.correccionesKm).filter((r) => r.fecha > desde.valor).pop();
  if (posterior !== undefined) {
    return fallo("km-correccion-anterior", errKmCorreccionAnterior(posterior.tipo === "correccion" ? "correccion" : "parte", posterior.fecha), { campo: "desde" });
  }
  // La salida de un parte en uso fija su kilometraje inicial (P7): una corrección desde ese mismo día dejaría su cierre sin salida posible.
  const enUso = estado.partes.find((p) => p.unidadId === u.id && p.estado === "en-uso" && p.fecha >= desde.valor);
  if (enUso !== undefined) return fallo("km-correccion-parte-en-uso", errKmCorreccionParteEnUso(enUso.fecha), { campo: "desde", detalle: { parteId: enUso.id } });
  const anterior = kmActual(u.id, estado.partes, estado.correccionesKm);
  const correccion = {
    id: ctx.nuevoId(),
    unidadId: u.id,
    desde: desde.valor,
    kmBase: km.valor,
    motivo: motivo.valor,
    instante: ctx.ahora,
    autor: ctx.autor,
  };
  return ok({
    cambios: { correccionesKm: [correccion] },
    eventos: [
      {
        tipo: "km-corregido",
        unidadId: u.id,
        conductorId: null,
        resumen: RESUMEN_EVENTO.kmCorregido(pat(u), anterior, km.valor, desde.valor),
        datos: { kmAnterior: anterior, kmBase: km.valor, desde: desde.valor, motivo: motivo.valor },
      },
    ],
    modifica: true,
  });
}

// ---------------------------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------------------------

function tiposDelTitular(titular: Titular["tipo"]): TipoDocumento[] {
  return REQUISITOS.filter((r) => r.titular === titular).map((r) => r.tipo);
}

/** El titular existe y, si es una unidad, no está de baja. Devuelve los ids para armar el evento. */
function verificarTitular(estado: Estado, titular: Titular): Resultado<{ unidadId: string | null; conductorId: string | null }> {
  if (titular.tipo === "unidad") {
    const u = buscarUnidadActiva(estado, titular.id);
    return u.ok ? ok({ unidadId: titular.id, conductorId: null }) : u;
  }
  const c = estado.conductores.find((x) => x.id === titular.id);
  if (c === undefined) return fallo("conductor-inexistente", ERRORES.conductorInexistente);
  return ok({ unidadId: null, conductorId: c.id });
}

function validarDatosDeDocumento(
  c: { numero: string; emisor: string; vence: string; emitido: string | null },
  ctx: Contexto,
): Resultado<{ numero: string; emisor: string; vence: FechaCivil; emitido: FechaCivil | null }> {
  const numero = validarTexto(c.numero, REGLAS.numeroDocumento);
  if (!numero.ok) return numero;
  const emisor = validarTexto(c.emisor, REGLAS.emisor);
  if (!emisor.ok) return emisor;
  const vence = validarVencimiento(c.vence, ctx.hoy);
  if (!vence.ok) return vence;
  let emitido: FechaCivil | null = null;
  if (c.emitido !== null) {
    const e = validarFecha(c.emitido, "emitido");
    if (!e.ok) return e;
    if (diasEntre(e.valor, vence.valor) < 0) return fallo("emision-posterior", ERRORES.emisionPosterior, { campo: "emitido" });
    emitido = e.valor;
  }
  return ok({ numero: numero.valor, emisor: emisor.valor, vence: vence.valor, emitido });
}

function cargarDocumento(
  estado: Estado,
  c: Extract<Comando, { tipo: "cargarDocumento" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const titular = verificarTitular(estado, c.titular);
  if (!titular.ok) return titular;
  if (!esTipoDocumento(c.tipoDocumento)) {
    return fallo("tipo-documento-invalido", TEXTO_DIALOGOS_FICHA.cargarOtro.tipoVacio, { campo: "tipoDocumento" });
  }
  const nombre = NOMBRES_DOCUMENTO[c.tipoDocumento];
  if (!tiposDelTitular(c.titular.tipo).includes(c.tipoDocumento)) {
    return fallo("tipo-no-corresponde", errTipoDeDocumentoNoCorresponde(nombre, c.titular.tipo), {
      campo: "tipoDocumento",
    });
  }
  if (documentoVigente(estado.documentos, c.titular, c.tipoDocumento) !== undefined) {
    return fallo("documento-existente", errDocumentoExistente(nombre), { campo: "tipoDocumento" });
  }
  const datos = validarDatosDeDocumento(c, ctx);
  if (!datos.ok) return datos;

  const documento: Documento = {
    id: ctx.nuevoId(),
    titular: { tipo: c.titular.tipo, id: c.titular.id }, // M6: copia, no la referencia del comando
    tipo: c.tipoDocumento,
    numero: datos.valor.numero,
    emisor: datos.valor.emisor,
    vence: datos.valor.vence,
    emitido: datos.valor.emitido,
    cargado: ctx.ahora,
    reemplazaA: null,
  };
  return ok({
    cambios: { documentos: [documento] },
    eventos: [
      {
        tipo: "documento-cargado",
        unidadId: titular.valor.unidadId,
        conductorId: titular.valor.conductorId,
        resumen: RESUMEN_EVENTO.documentoCargado(etiquetaDeTitular(estado, c.titular), nombre, documento.vence),
        datos: { documentoId: documento.id, tipoDocumento: documento.tipo, vence: documento.vence },
      },
    ],
    modifica: true,
  });
}

function renovarDocumento(
  estado: Estado,
  c: Extract<Comando, { tipo: "renovarDocumento" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const actual = estado.documentos.find((d) => d.id === c.documentoId);
  if (actual === undefined) return fallo("documento-inexistente", ERRORES.documentoInexistente);
  const titular = verificarTitular(estado, actual.titular);
  if (!titular.ok) return titular;
  if (documentoVigente(estado.documentos, actual.titular, actual.tipo)?.id !== actual.id) {
    return fallo("documento-no-vigente", ERRORES.documentoNoVigente);
  }
  const datos = validarDatosDeDocumento(c, ctx);
  if (!datos.ok) return datos;
  // V10: la renovación vence después del vigente.
  if (diasEntre(actual.vence, datos.valor.vence) <= 0) {
    return fallo("renovacion-no-posterior", errRenovacionNoPosterior(actual.vence), { campo: "vence" });
  }

  const nuevo: Documento = {
    id: ctx.nuevoId(),
    titular: actual.titular,
    tipo: actual.tipo,
    numero: datos.valor.numero,
    emisor: datos.valor.emisor,
    vence: datos.valor.vence,
    emitido: datos.valor.emitido,
    cargado: ctx.ahora,
    reemplazaA: actual.id,
  };
  return ok({
    cambios: { documentos: [nuevo] },
    eventos: [
      {
        tipo: "documento-renovado",
        unidadId: titular.valor.unidadId,
        conductorId: titular.valor.conductorId,
        resumen: RESUMEN_EVENTO.documentoRenovado(
          NOMBRES_DOCUMENTO[actual.tipo],
          etiquetaDeTitular(estado, actual.titular),
          actual.vence,
          nuevo.vence,
        ),
        datos: {
          documentoId: nuevo.id,
          documentoAnteriorId: actual.id,
          tipoDocumento: actual.tipo,
          venceAnterior: actual.vence,
          venceNuevo: nuevo.vence,
        },
      },
    ],
    modifica: true,
  });
}

const ROTULO_CAMPO_DOCUMENTO = { numero: "número", emisor: "emisor", vence: "vencimiento", emitido: "fecha de emisión" } as const;

function corregirDocumento(
  estado: Estado,
  c: Extract<Comando, { tipo: "corregirDocumento" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const actual = estado.documentos.find((d) => d.id === c.documentoId);
  if (actual === undefined) return fallo("documento-inexistente", ERRORES.documentoInexistente);
  const titular = verificarTitular(estado, actual.titular);
  if (!titular.ok) return titular;

  let numero = actual.numero;
  let emisor = actual.emisor;
  let vence = actual.vence;
  let emitido = actual.emitido;

  if (c.numero !== undefined) {
    const r = validarTexto(c.numero, REGLAS.numeroDocumento);
    if (!r.ok) return r;
    numero = r.valor;
  }
  if (c.emisor !== undefined) {
    const r = validarTexto(c.emisor, REGLAS.emisor);
    if (!r.ok) return r;
    emisor = r.valor;
  }
  if (c.vence !== undefined) {
    const r = validarVencimiento(c.vence, ctx.hoy);
    if (!r.ok) return r;
    vence = r.valor;
    // V9 y V10: corregir no puede dar vuelta el orden entre un documento y su renovación.
    const anterior = actual.reemplazaA === null ? undefined : estado.documentos.find((d) => d.id === actual.reemplazaA);
    if (anterior !== undefined && diasEntre(anterior.vence, vence) <= 0) {
      return fallo("renovacion-no-posterior", errVenceNoPosteriorAlAnterior(anterior.vence), { campo: "vence" });
    }
    const renovacion = estado.documentos.find((d) => d.reemplazaA === actual.id);
    if (renovacion !== undefined && diasEntre(vence, renovacion.vence) <= 0) {
      return fallo("vence-posterior-a-renovacion", errVenceAntesQueSuRenovacion(renovacion.vence), { campo: "vence" });
    }
  }
  if (c.emitido !== undefined) {
    if (c.emitido === null) emitido = null;
    else {
      const r = validarFecha(c.emitido, "emitido");
      if (!r.ok) return r;
      emitido = r.valor;
    }
  }
  if (emitido !== null && diasEntre(emitido, vence) < 0) {
    return fallo("emision-posterior", ERRORES.emisionPosterior, { campo: "emitido" });
  }

  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};
  if (numero !== actual.numero) cambios["numero"] = { antes: actual.numero, despues: numero };
  if (emisor !== actual.emisor) cambios["emisor"] = { antes: actual.emisor, despues: emisor };
  if (vence !== actual.vence) cambios["vence"] = { antes: actual.vence, despues: vence };
  if (emitido !== actual.emitido) cambios["emitido"] = { antes: actual.emitido, despues: emitido };
  const campos = Object.keys(cambios);
  if (campos.length === 0) return fallo("sin-cambios", ERRORES.sinCambios);

  return ok({
    cambios: { documentos: [{ ...actual, numero, emisor, vence, emitido }] },
    eventos: [
      {
        tipo: "documento-corregido",
        unidadId: titular.valor.unidadId,
        conductorId: titular.valor.conductorId,
        resumen: RESUMEN_EVENTO.documentoCorregido(
          NOMBRES_DOCUMENTO[actual.tipo],
          etiquetaDeTitular(estado, actual.titular),
          campos.map((k) => ROTULO_CAMPO_DOCUMENTO[k as keyof typeof ROTULO_CAMPO_DOCUMENTO]),
        ),
        datos: { documentoId: actual.id, cambios },
      },
    ],
    modifica: true,
  });
}

// ---------------------------------------------------------------------------------------------
// Novedades
// ---------------------------------------------------------------------------------------------

/** Pasa la unidad a fuera de servicio por una novedad crítica, o suma la novedad a la lista si ya lo está por otra (A3). */
function efectoDeNovedadCritica(
  unidad: Unidad,
  novedadesNuevas: readonly Novedad[],
  motivo: string,
  ctx: Contexto,
): { unidad: Unidad | null; evento: EventoNuevo | null } {
  const e = unidad.estado;
  const ids = novedadesNuevas.map((n) => n.id);
  const motivoAbreviado = abreviar(motivo, LARGO_MAXIMO_MOTIVO);
  if (e.tipo === "en-servicio") {
    return {
      unidad: {
        ...unidad,
        estado: {
          tipo: "fuera-de-servicio",
          desde: ctx.hoy,
          motivo: motivoAbreviado,
          origen: "novedad-critica",
          novedadIds: ids,
        },
      },
      evento: {
        tipo: "fuera-de-servicio",
        unidadId: unidad.id,
        conductorId: null,
        resumen: RESUMEN_EVENTO.fueraDeServicio(pat(unidad), motivoAbreviado),
        datos: { origen: "novedad-critica", motivo: motivoAbreviado, novedadIds: ids },
      },
    };
  }
  if (e.tipo === "fuera-de-servicio" && e.origen === "novedad-critica") {
    return { unidad: { ...unidad, estado: { ...e, novedadIds: [...e.novedadIds, ...ids] } }, evento: null };
  }
  return { unidad: null, evento: null };
}

function eventoDeNovedadAbierta(unidad: Unidad, n: Novedad): EventoNuevo {
  const detalle = n.origen.tipo === "parte" ? `${rotuloNovedad(n)}: ${n.descripcion}` : n.descripcion;
  return {
    tipo: "novedad-abierta",
    unidadId: unidad.id,
    conductorId: null,
    resumen: RESUMEN_EVENTO.novedadAbierta(pat(unidad), n.gravedad === "critica", detalle),
    datos: { novedadId: n.id, gravedad: n.gravedad, origen: n.origen },
  };
}

function cargarNovedad(estado: Estado, c: Extract<Comando, { tipo: "cargarNovedad" }>, ctx: Contexto): Resultado<Parcial> {
  const unidad = buscarUnidadActiva(estado, c.unidadId);
  if (!unidad.ok) return unidad;
  const descripcion = validarTexto(c.descripcion, REGLAS.novedad);
  if (!descripcion.ok) return descripcion;

  const u = unidad.valor;
  const novedad: Novedad = {
    id: ctx.nuevoId(),
    unidadId: u.id,
    origen: { tipo: "manual" },
    descripcion: descripcion.valor,
    gravedad: c.impideUso ? "critica" : "normal",
    fecha: ctx.hoy,
    estado: "abierta",
    resolucion: null,
  };
  const eventos: EventoNuevo[] = [eventoDeNovedadAbierta(u, novedad)];
  const cambios: Partial<Cambios> = { novedades: [novedad] };
  if (novedad.gravedad === "critica") {
    const efecto = efectoDeNovedadCritica(
      u,
      [novedad],
      MOTIVO_NOVEDAD_CRITICA.cargada(ctx.hoy, abreviar(novedad.descripcion, 120)),
      ctx,
    );
    if (efecto.unidad !== null) cambios.unidades = [efecto.unidad];
    if (efecto.evento !== null) eventos.push(efecto.evento);
  }
  return ok({ cambios, eventos, modifica: true });
}

function resolverNovedad(
  estado: Estado,
  c: Extract<Comando, { tipo: "resolverNovedad" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const actual = estado.novedades.find((n) => n.id === c.novedadId);
  if (actual === undefined) return fallo("novedad-inexistente", ERRORES.novedadInexistente);
  if (actual.estado === "resuelta") return fallo("novedad-ya-resuelta", ERRORES.novedadYaResuelta);
  const texto = validarTexto(c.texto, REGLAS.resolucion);
  if (!texto.ok) return texto;
  const unidad = buscarUnidad(estado, actual.unidadId);
  if (!unidad.ok) return unidad;

  const resuelta: Novedad = {
    ...actual,
    estado: "resuelta",
    resolucion: { texto: texto.valor, instante: ctx.ahora, autor: ctx.autor },
  };
  const eventos: EventoNuevo[] = [
    {
      tipo: "novedad-resuelta",
      unidadId: actual.unidadId,
      conductorId: null,
      resumen: RESUMEN_EVENTO.novedadResuelta(pat(unidad.valor), rotuloNovedad(actual), texto.valor),
      datos: { novedadId: actual.id, gravedad: actual.gravedad },
    },
  ];
  const cambios: Partial<Cambios> = { novedades: [resuelta] };

  // N2: al resolver la última crítica se puede volver a servicio en la misma operación (A4 se controla igual).
  if (c.volverAServicio) {
    const despues = estado.novedades.map((n) => (n.id === resuelta.id ? resuelta : n));
    const v = prepararVuelta(unidad.valor, despues);
    if (!v.ok) return v;
    cambios.unidades = [v.valor.unidad];
    eventos.push(v.valor.evento);
  }
  return ok({ cambios, eventos, modifica: true });
}

// ---------------------------------------------------------------------------------------------
// Parte diario
// ---------------------------------------------------------------------------------------------

/** P8: no se aceptan partes de unidades fuera de servicio ni de baja. */
function unidadQuePuedeTenerParte(estado: Estado, unidadId: string): Resultado<Unidad> {
  const r = buscarUnidadActiva(estado, unidadId);
  if (!r.ok) return r;
  const e = r.valor.estado;
  if (e.tipo === "fuera-de-servicio") return fallo("unidad-fuera-de-servicio", errUnidadFueraDeServicio(e.desde, e.motivo));
  return r;
}

/** El detalle del error de L1: el motivo y su fecha, sin la marca `vigente`. */
function detalleDeLicencia(l: Exclude<EstadoLicencia, { vigente: true }>): Record<string, unknown> {
  const { vigente: _vigente, ...detalle } = l;
  return detalle;
}

const ESTADOS_DE_RESPUESTA = ["sin-responder", "en-orden", "con-novedad"];

/** P3: de un borrador solo se valida el tipo de cada campo. */
function validarCamposDelBorrador(c: Extract<Comando, { tipo: "guardarBorrador" }>): Resultado<null> {
  for (const [campo, valor] of [["kmInicio", c.kmInicio], ["kmFin", c.kmFin]] as const) {
    if (valor === null) continue;
    const r = validarKmNumero(valor, campo);
    if (!r.ok) return r;
  }
  if (c.litrosCargados !== null) {
    const litros = validarLitros(c.litrosCargados);
    if (!litros.ok) return litros;
  }
  if (c.combustible !== null && !NIVELES_COMBUSTIBLE.includes(c.combustible)) {
    return fallo("combustible-invalido", ERRORES.combustibleInvalido, { campo: "combustible" });
  }
  for (const item of ITEMS_CHECKLIST) {
    const r = c.checklist[item.id] as unknown;
    if (typeof r !== "object" || r === null || !ESTADOS_DE_RESPUESTA.includes((r as { estado?: string }).estado ?? "")) {
      return fallo("checklist-invalido", ERRORES.checklistInvalido, { campo: "checklist" });
    }
    const respuesta = r as { estado: string; descripcion?: unknown; impideUso?: unknown };
    if (respuesta.estado === "con-novedad") {
      if (typeof respuesta.descripcion !== "string" || typeof respuesta.impideUso !== "boolean") {
        return fallo("checklist-invalido", ERRORES.checklistInvalido, { campo: "checklist" });
      }
      const t = validarTextoDeBorrador(respuesta.descripcion, item.id);
      if (!t.ok) return t;
    }
  }
  if (c.otraNovedad !== null) {
    const o = c.otraNovedad as unknown as { descripcion?: unknown; impideUso?: unknown };
    if (typeof o.descripcion !== "string" || typeof o.impideUso !== "boolean") {
      return fallo("otra-novedad-invalida", ERRORES.otraNovedadInvalida, { campo: "otraNovedad" });
    }
    const t = validarTextoDeBorrador(o.descripcion, "otraNovedad");
    if (!t.ok) return t;
  }
  return ok(null);
}

/** M6: copia solo los campos conocidos de cada respuesta, ya validadas por `validarCamposDelBorrador`. */
function copiarChecklist(origen: Parte["checklist"]): Parte["checklist"] {
  const copia = {} as Parte["checklist"];
  for (const item of ITEMS_CHECKLIST) {
    const r = origen[item.id];
    copia[item.id] =
      r.estado === "con-novedad"
        ? { estado: "con-novedad", descripcion: limpiarTexto(r.descripcion), impideUso: r.impideUso }
        : { estado: r.estado };
  }
  return copia;
}

function guardarBorrador(
  estado: Estado,
  c: Extract<Comando, { tipo: "guardarBorrador" }>,
  ctx: Contexto,
): Resultado<Parcial> {
  const unidad = unidadQuePuedeTenerParte(estado, c.unidadId);
  if (!unidad.ok) return unidad;

  let existente: Parte | undefined;
  if (c.parteId !== null) {
    existente = estado.partes.find((p) => p.id === c.parteId);
    if (existente === undefined) return fallo("parte-inexistente", ERRORES.parteInexistente);
    if (existente.estado === "enviado") return fallo("parte-enviado-inmutable", ERRORES.parteEnviadoInmutable);
    if (existente.estado === "en-uso") return fallo("revision-ya-enviada", ERRORES.revisionYaEnviada);
    if (existente.unidadId !== c.unidadId) return fallo("parte-otra-unidad", ERRORES.parteOtraUnidad);
  }

  const fecha = validarFechaParte(c.fecha, ctx.hoy);
  if (!fecha.ok) return fecha;

  // P1: un parte por unidad y por fecha.
  const duplicado = estado.partes.find((p) => p.unidadId === c.unidadId && p.fecha === fecha.valor && p.id !== existente?.id);
  if (duplicado !== undefined) {
    return fallo("parte-duplicado", errParteDuplicado(pat(unidad.valor), fecha.valor, duplicado.estado), {
      campo: "fecha",
      detalle: { parteId: duplicado.id },
    });
  }

  const conductor = buscarConductorActivo(estado, c.conductorId, "conductorId");
  if (!conductor.ok) return conductor;
  const campos = validarCamposDelBorrador(c);
  if (!campos.ok) return campos;

  const parte: Parte = {
    id: existente?.id ?? ctx.nuevoId(),
    unidadId: c.unidadId,
    fecha: fecha.valor,
    conductorId: c.conductorId,
    estado: "borrador",
    revisado: null,
    sinSalida: false,
    kmInicio: c.kmInicio,
    kmFin: c.kmFin,
    combustible: c.combustible,
    litrosCargados: c.litrosCargados,
    checklist: copiarChecklist(c.checklist),
    otraNovedad: c.otraNovedad === null ? null : { descripcion: limpiarTexto(c.otraNovedad.descripcion), impideUso: c.otraNovedad.impideUso },
    advertenciasAceptadas: [],
    documentacionVencida: [],
    creado: existente?.creado ?? ctx.ahora,
    actualizado: ctx.ahora,
    enviado: null,
    autor: existente?.autor ?? ctx.autor,
  };
  const actual = kmActual(c.unidadId, estado.partes, estado.correccionesKm);
  return ok({ cambios: { partes: [parte] }, eventos: [], modifica: !esBorradorVacio(parte, actual) });
}

function descartarBorrador(estado: Estado, c: Extract<Comando, { tipo: "descartarBorrador" }>): Resultado<Parcial> {
  const parte = estado.partes.find((p) => p.id === c.parteId);
  if (parte === undefined) return fallo("parte-inexistente", ERRORES.parteInexistente);
  if (parte.estado === "enviado") return fallo("parte-enviado-inmutable", ERRORES.parteEnviadoInmutable);
  if (parte.estado === "en-uso") return fallo("revision-ya-enviada", ERRORES.revisionYaEnviada);
  const actual = kmActual(parte.unidadId, estado.partes, estado.correccionesKm);
  return ok({ cambios: { partesBorrados: [parte.id] }, eventos: [], modifica: !esBorradorVacio(parte, actual) });
}

function recortarRespuestas(checklist: Parte["checklist"]): Parte["checklist"] {
  const resultado = { ...checklist };
  for (const item of ITEMS_CHECKLIST) {
    const r = checklist[item.id];
    if (r.estado === "con-novedad") resultado[item.id] = { ...r, descripcion: normalizarTexto(r.descripcion) };
  }
  return resultado;
}

function trimOtraNovedad(o: Parte["otraNovedad"]): Parte["otraNovedad"] {
  return o === null ? null : { ...o, descripcion: normalizarTexto(o.descripcion) };
}

/** Un parte que se puede cerrar o completar: existe y no es un borrador (`parte-sin-revision`) ni está cerrado (`parte-enviado-inmutable`). */
function parteEnUso(estado: Estado, parteId: string): Resultado<Parte> {
  const p = estado.partes.find((x) => x.id === parteId);
  if (p === undefined) return fallo("parte-inexistente", ERRORES.parteInexistente);
  if (p.estado === "borrador") return fallo("parte-sin-revision", ERRORES.parteSinRevision);
  if (p.estado === "enviado") return fallo("parte-enviado-inmutable", ERRORES.parteEnviadoInmutable);
  return ok(p);
}

/**
 * La revisión antes de salir (P14, P16, L1; sección 17.3). El primero que falla corta: parte, unidad (P8), fecha (P2), licencia (L1, antes de pedir los diez
 * puntos: es un hecho sobre quién maneja), faltantes (P4), kilometraje (K3, K4), advertencias (K6, P9). Sin novedad crítica el parte queda en uso; con una, se
 * cierra sin salida y la unidad queda fuera de servicio (A3, P16), todo en la misma operación (P12).
 */
function enviarRevision(estado: Estado, c: Extract<Comando, { tipo: "enviarRevision" }>, ctx: Contexto): Resultado<Parcial> {
  const borrador = estado.partes.find((p) => p.id === c.parteId);
  if (borrador === undefined) return fallo("parte-inexistente", ERRORES.parteInexistente);
  if (borrador.estado === "en-uso") return fallo("revision-ya-enviada", ERRORES.revisionYaEnviada);
  if (borrador.estado === "enviado") return fallo("parte-enviado-inmutable", ERRORES.parteEnviadoInmutable);

  const unidad = unidadQuePuedeTenerParte(estado, borrador.unidadId);
  if (!unidad.ok) return unidad;
  const u = unidad.valor;

  // P2: la fecha se controla otra vez al enviar.
  const fecha = validarFechaParte(borrador.fecha, ctx.hoy);
  if (!fecha.ok) return fecha;

  const conductor = buscarConductorActivo(estado, borrador.conductorId, "conductorId");
  if (!conductor.ok) return conductor;

  // L1: sin licencia vigente a la fecha del parte no se envía la revisión (sin advertencia aceptable).
  if (conductor.valor !== null) {
    const licencia = estadoDeLicencia(estado.documentos, conductor.valor.id, borrador.fecha);
    if (!licencia.vigente) {
      return fallo("licencia-no-vigente", errLicenciaNoVigente(conductor.valor.nombre, borrador.fecha, licencia), {
        campo: "conductorId",
        detalle: detalleDeLicencia(licencia),
      });
    }
  }

  // P18: con un parte en uso anterior de la misma unidad, primero hay que cerrarlo (si no, la revisión de hoy arrancaría con el kilometraje de salida de ayer).
  const sinCerrar = partePendienteDeCierre(estado.partes, u.id, borrador.fecha);
  if (sinCerrar !== undefined) {
    return fallo("parte-anterior-sin-cerrar", errParteAnteriorSinCerrar(pat(u), sinCerrar.fecha, borrador.fecha), { detalle: { parteId: sinCerrar.id, fecha: sinCerrar.fecha } });
  }
  // P20: un conductor con un parte en uso en otra unidad tampoco empieza otra revisión: primero cierra el anterior.
  if (conductor.valor !== null) {
    const suyo = parteEnUsoDelConductor(estado, conductor.valor.id, u.id);
    const suUnidad = suyo === undefined ? undefined : estado.unidades.find((x) => x.id === suyo.unidadId);
    if (suyo !== undefined && suUnidad !== undefined) {
      return fallo("parte-anterior-sin-cerrar", errConductorConParteSinCerrar(conductor.valor.nombre, pat(suUnidad), suyo.fecha, ctx.hoy), {
        campo: "conductorId",
        detalle: { parteId: suyo.id, fecha: suyo.fecha, unidadId: suyo.unidadId },
      });
    }
  }

  // P4: lo que falta de la revisión, en el orden del formulario.
  const faltan = faltantesDeRevision(borrador);
  if (faltan.length > 0) return fallo("faltan-datos", textoFaltantes(faltan.length), { detalle: { faltan } });
  // `faltantesDeRevision` ya incluye `kmInicio` (lo fija tests/parte.test.ts): esto solo acota el tipo.
  const kmInicio = borrador.kmInicio;
  if (kmInicio === null) return fallo("faltan-datos", textoFaltantes(1), { detalle: { faltan: ["kmInicio"] } });

  // K3 y K4 bloquean; K6 es una advertencia.
  const km = validarKmDeSalida({ unidad: u, fecha: borrador.fecha, kmInicio, partes: estado.partes, correcciones: estado.correccionesKm });
  if (!km.ok) return km;

  const checklist = recortarRespuestas(borrador.checklist);
  const otraNovedad = trimOtraNovedad(borrador.otraNovedad);
  const recortado: Parte = { ...borrador, checklist, otraNovedad };

  // P11: novedades del parte. P16: con una crítica la unidad no sale.
  const nuevas = novedadesDelParte(recortado);
  const hayCritica = nuevas.some((n) => n.gravedad === "critica");

  // P9: documentación de la unidad vencida o faltante a la fecha del parte; no si la unidad no sale.
  let documentacionVencida: TipoDocumento[] = [];
  if (!hayCritica) {
    const proyecto = buscarProyecto(estado, u.proyectoId);
    if (!proyecto.ok) return proyecto;
    documentacionVencida = documentacionVencidaEn({ fecha: borrador.fecha, unidad: u, proyecto: proyecto.valor, documentos: estado.documentos });
  }

  const requeridas = advertenciasDeRevision({ kmAnterior: km.valor.kmAnterior, kmInicio, documentacionVencida });
  const pendientes = requeridas.filter((a) => !c.advertenciasAceptadas.includes(a.tipo));
  if (pendientes.length > 0) {
    return fallo("advertencias-sin-aceptar", ERRORES.advertenciasSinAceptar, { detalle: { advertencias: pendientes } });
  }

  const base: Parte = { ...recortado, advertenciasAceptadas: requeridas, actualizado: ctx.ahora, autor: ctx.autor, revisado: ctx.ahora };
  const parte: Parte = hayCritica
    ? { ...base, estado: "enviado", sinSalida: true, kmFin: kmInicio, combustible: null, litrosCargados: null, documentacionVencida: [], enviado: ctx.ahora }
    : { ...base, estado: "en-uso", sinSalida: false, documentacionVencida, enviado: null };

  const novedades: Novedad[] = nuevas.map((n) => ({
    id: ctx.nuevoId(),
    unidadId: u.id,
    origen: { tipo: "parte", parteId: parte.id, item: n.item },
    descripcion: n.descripcion,
    gravedad: n.gravedad,
    fecha: parte.fecha,
    estado: "abierta",
    resolucion: null,
  }));

  // El texto dice «fuera de plazo»; la clave `fueraDeTermino` del evento es un dato guardado en la base de la persona y se conserva con ese nombre.
  const fueraDePlazo = diasEntre(parte.fecha, ctx.hoy) > 0;
  const eventos: EventoNuevo[] = [
    {
      tipo: "revision-enviada",
      unidadId: u.id,
      conductorId: parte.conductorId,
      resumen: RESUMEN_EVENTO.revisionEnviada(pat(u), parte.fecha, fueraDePlazo, kmInicio, hayCritica),
      datos: { parteId: parte.id, fecha: parte.fecha, kmInicio, fueraDeTermino: fueraDePlazo, sinSalida: hayCritica, advertencias: requeridas },
    },
    ...novedades.map((n) => eventoDeNovedadAbierta(u, n)),
  ];

  const cambios: Partial<Cambios> = { partes: [parte], novedades };

  // A3: una novedad crítica deja la unidad fuera de servicio, en la misma operación.
  const criticas = novedades.filter((n) => n.gravedad === "critica");
  if (criticas.length > 0) {
    const nombres = criticas.map((n) => rotuloNovedad(n)).join(", ");
    const efecto = efectoDeNovedadCritica(u, criticas, MOTIVO_NOVEDAD_CRITICA.delParte(parte.fecha, nombres, ctx.hoy), ctx);
    if (efecto.unidad !== null) cambios.unidades = [efecto.unidad];
    if (efecto.evento !== null) eventos.push(efecto.evento);
  }
  return ok({ cambios, eventos, modifica: true });
}

/** P3: el autoguardado del cierre de un parte en uso. No genera eventos ni cuenta para el kilometraje (K9); no controla fecha (P15) ni licencia (L4). */
function guardarCierre(estado: Estado, c: Extract<Comando, { tipo: "guardarCierre" }>, ctx: Contexto): Resultado<Parcial> {
  const p = parteEnUso(estado, c.parteId);
  if (!p.ok) return p;
  const unidad = buscarUnidadActiva(estado, p.valor.unidadId); // fuera de servicio sí se acepta (P8)
  if (!unidad.ok) return unidad;

  if (c.kmFin !== null) {
    const km = validarKmNumero(c.kmFin, "kmFin");
    if (!km.ok) return km;
  }
  if (c.litrosCargados !== null) {
    const litros = validarLitros(c.litrosCargados);
    if (!litros.ok) return litros;
  }
  if (c.combustible !== null && !NIVELES_COMBUSTIBLE.includes(c.combustible)) {
    return fallo("combustible-invalido", ERRORES.combustibleInvalido, { campo: "combustible" });
  }
  const parte = p.valor;
  if (parte.kmFin === c.kmFin && parte.combustible === c.combustible && parte.litrosCargados === c.litrosCargados) {
    return ok({ cambios: {}, eventos: [], modifica: false });
  }
  const guardado: Parte = { ...parte, kmFin: c.kmFin, combustible: c.combustible, litrosCargados: c.litrosCargados, actualizado: ctx.ahora };
  return ok({ cambios: { partes: [guardado] }, eventos: [], modifica: true });
}

/** El cierre (P15): K2, K4 y K7. No vuelve a mirar la licencia (L3) ni la fecha (P15) ni la documentación (P9: quedó fijada en la revisión). */
function enviarCierre(estado: Estado, c: Extract<Comando, { tipo: "enviarCierre" }>, ctx: Contexto): Resultado<Parcial> {
  const p = parteEnUso(estado, c.parteId);
  if (!p.ok) return p;
  const unidad = buscarUnidadActiva(estado, p.valor.unidadId);
  if (!unidad.ok) return unidad;
  const u = unidad.valor;
  const parte = p.valor;

  const faltan = faltantesDeCierre(parte);
  if (faltan.length > 0) return fallo("faltan-datos", textoFaltantes(faltan.length), { detalle: { faltan } });
  const { kmInicio, kmFin } = parte;
  // `faltantesDeCierre` ya incluye `kmFin`: esto solo acota el tipo.
  if (kmFin === null) return fallo("faltan-datos", textoFaltantes(1), { detalle: { faltan: ["kmFin"] } });
  // Un parte en uso siempre tiene su kilometraje de salida (la revisión lo exige); uno con la forma rota (datos viejos) no se cierra a ciegas.
  if (kmInicio === null) return fallo("faltan-datos", textoFaltantes(1), { detalle: { faltan: ["kmInicio"] } });

  const km = validarKmDeCierre({ unidad: u, fecha: parte.fecha, kmInicio, kmFin, partes: estado.partes, correcciones: estado.correccionesKm });
  if (!km.ok) return km;
  const requeridas = km.valor.advertencias;
  const pendientes = requeridas.filter((a) => !c.advertenciasAceptadas.includes(a.tipo));
  if (pendientes.length > 0) {
    return fallo("advertencias-sin-aceptar", ERRORES.advertenciasSinAceptar, { detalle: { advertencias: pendientes } });
  }

  const cerrado: Parte = {
    ...parte,
    estado: "enviado",
    enviado: ctx.ahora,
    actualizado: ctx.ahora,
    advertenciasAceptadas: [...parte.advertenciasAceptadas, ...requeridas],
  };
  return ok({
    cambios: { partes: [cerrado] },
    eventos: [
      {
        tipo: "parte-enviado",
        unidadId: u.id,
        conductorId: parte.conductorId,
        resumen: RESUMEN_EVENTO.parteCerrado(pat(u), parte.fecha, kmInicio, kmFin),
        datos: { parteId: parte.id, fecha: parte.fecha, kmInicio, kmFin, recorrido: kmFin - kmInicio, advertencias: requeridas },
      },
    ],
    modifica: true,
  });
}
