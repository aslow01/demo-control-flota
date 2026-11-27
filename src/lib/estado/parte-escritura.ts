// Escritura del parte (docs/diseno.md, sección 17): guardar la revisión y el cierre como borrador (P3), enviarlos, descartar el borrador y el autoguardado de la pantalla.
// Se baja con la pantalla del parte (no viaja con el marco): `EstadoApp` lo pide con `import()` la primera vez que se escribe un parte (`guardarBorradorDeParte`, `enviarRevisionDeParte`, …) y la
// pantalla importa de acá `autoguardadoDeParte` y `autoguardadoDeCierre`, así que cuando se escribe el trozo ya llegó. Los métodos públicos de `EstadoApp` siguen siendo la puerta: hacen la cola
// (los comandos se hacen de a uno); lo de acá corre ya dentro de ella y usa `app.ejecutarAhora`, que no vuelve a encolar.
//
// El parte tiene dos pasos. La revisión se guarda sola (P3: `guardarBorradorDeParte`, que llama el autoguardado) y se envía con `enviarRevisionDeParte`; el cierre se guarda solo (`guardarCierreDeParte`) y
// se envía con `enviarCierreDeParte`. Buscan el borrador de la unidad y la fecha DENTRO de la cola: dos guardados seguidos (autoguardado y «salir del campo») nunca crean dos borradores. Los dos perfiles
// pueden usarlos (sección 8); con el perfil Conductor el conductor del parte es siempre quien lo completa.

import { aplicar as aplicarComando, type Comando, type Contexto, type Ejecucion } from "../dominio/comandos.ts";
import { formatearHora } from "../dominio/fechas.ts";
import { comandoDeBorrador, comandoDeCierre, erroresDeNegocioParte, errorGeneralParte, sumarErrorDeRegla, validarParaEnviar, type ErroresDeParte } from "../dominio/formulario-parte.ts";
import type { ValoresParte } from "../dominio/formulario-parte-valores.ts";
import { validarKmDeSalida } from "../dominio/kilometraje.ts";
import { advertenciasLegibles, esBorradorVacio } from "../dominio/parte.ts";
import { ERRORES, textoAdvertencia } from "../dominio/textos-base.ts";
import { TEXTO_FORMULARIO_PARTE } from "../dominio/textos-parte.ts";
import type { Advertencia, ErrorDeNegocio, Estado, FechaCivil, Parte, Perfil, Resultado } from "../dominio/tipos.ts";
import type { ResultadoDeDescarte, ResultadoDeEnvio } from "./app.svelte.ts";
import { crearAutoguardado, type Autoguardado, type DependenciasAutoguardado, type IndicadorDeGuardado, type ResultadoDeBorrador } from "./autoguardado.ts";
import type { LecturaDeApp } from "./lectura.ts";
import { panelDeParteEnviado, panelDeRevisionEnviada, panelDeSinSalida, type ParteEnCierre, type ParteEnEdicion } from "./parte.ts";

/** Lo que estas funciones le piden a `EstadoApp`: leer el estado y escribir un comando (con o sin pasar por la cola) y, para el autoguardado, guardar el borrador. */
export interface EscrituraDeApp extends LecturaDeApp {
  ejecutar(comando: Comando): Promise<Resultado<Ejecucion>>;
  /** Sin pasar por la cola: solo para código que ya corre dentro de ella. */
  ejecutarAhora(comando: Comando, perfil?: Perfil): Promise<Resultado<Ejecucion>>;
  /** El contexto de un ensayo (comando que no se escribe): no gasta ids del generador. */
  contextoDeEnsayo(perfil: Perfil): Contexto;
  guardarBorradorDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil?: Perfil): Promise<ResultadoDeBorrador>;
  guardarCierreDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil?: Perfil): Promise<ResultadoDeBorrador>;
}

/** Errores del envío de la revisión que se dicen solos: van antes que los faltantes y no se suman a la lista de lo que falta. */
const ERRORES_QUE_VAN_ANTES_DE_LOS_FALTANTES: ReadonlySet<string> = new Set(["licencia-no-vigente", "documentacion-de-la-unidad-vencida", "parte-anterior-sin-cerrar", "escritura-fallida"]);

/** Dos versiones del mismo borrador son iguales si solo difiere el instante del último guardado. */
function mismoBorrador(a: Parte, b: Parte): boolean {
  return JSON.stringify({ ...a, actualizado: "" }) === JSON.stringify({ ...b, actualizado: "" });
}

function erroresDeBorrador(error: ErrorDeNegocio): ResultadoDeBorrador {
  if (error.codigo === "escritura-fallida") return { ok: false, tipo: "escritura", errores: errorGeneralParte(error.mensaje) };
  const errores = erroresDeNegocioParte(error);
  return { ok: false, tipo: errores.lista.length > 0 ? "campos" : "regla", errores };
}

export async function guardarBorradorAhora(app: EscrituraDeApp, unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil: Perfil): Promise<ResultadoDeBorrador> {
  const estado = app.estado;
  if (estado === null) return { ok: false, tipo: "regla", errores: errorGeneralParte(ERRORES.sinDatos) };
  const v = perfil.tipo === "conductor" ? { ...valores, conductorId: perfil.conductorId } : valores;
  const existente = estado.partes.find((p) => p.unidadId === unidadId && p.fecha === fecha);
  if (existente?.estado === "enviado") return { ok: false, tipo: "regla", errores: errorGeneralParte(ERRORES.parteEnviadoInmutable) };
  if (existente?.estado === "en-uso") return { ok: false, tipo: "regla", errores: errorGeneralParte(ERRORES.revisionYaEnviada) };

  const c = comandoDeBorrador(unidadId, fecha, existente?.id ?? null, v);
  if (!c.ok) return { ok: false, tipo: "campos", errores: c.errores };

  // Ensayo: qué parte quedaría guardado (no se escribe nada ni se gastan ids).
  const ensayo = aplicarComando(estado, c.comando, app.contextoDeEnsayo(perfil));
  if (existente === undefined) {
    // Un parte nuevo se crea con el primer cambio: abrirlo y no escribir nada no deja un borrador (ni marca la demo como modificada, D11).
    if (!ensayo.ok) return erroresDeBorrador(ensayo.error);
    const nuevo = ensayo.valor.cambios.partes[0];
    if (nuevo !== undefined && esBorradorVacio(nuevo)) return { ok: true, parteId: null, hora: null, sinCambios: true };
  } else if (ensayo.ok) {
    // Código B8: lo que ya está guardado no se vuelve a escribir (por ejemplo, «Enviar parte» guarda de nuevo lo que el autoguardado acababa de guardar).
    const nuevo = ensayo.valor.cambios.partes[0];
    if (nuevo !== undefined && mismoBorrador(existente, nuevo)) return { ok: true, parteId: existente.id, hora: formatearHora(existente.actualizado), sinCambios: false };
  }

  const r = await app.ejecutarAhora(c.comando, perfil);
  if (!r.ok) return erroresDeBorrador(r.error);
  const guardado = r.valor.cambios.partes[0];
  return { ok: true, parteId: guardado?.id ?? null, hora: guardado === undefined ? null : formatearHora(guardado.actualizado), sinCambios: false };
}

function erroresDeCierre(error: ErrorDeNegocio): ResultadoDeBorrador {
  if (error.codigo === "escritura-fallida") return { ok: false, tipo: "escritura", errores: errorGeneralParte(error.mensaje, TEXTO_FORMULARIO_PARTE.tituloGeneralCierre) };
  const errores = erroresDeNegocioParte(error, "cierre");
  return { ok: false, tipo: errores.lista.length > 0 ? "campos" : "regla", errores };
}

export async function guardarCierreAhora(app: EscrituraDeApp, unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil: Perfil): Promise<ResultadoDeBorrador> {
  const estado = app.estado;
  if (estado === null) return { ok: false, tipo: "regla", errores: errorGeneralParte(ERRORES.sinDatos, TEXTO_FORMULARIO_PARTE.tituloGeneralCierre) };
  const existente = estado.partes.find((p) => p.unidadId === unidadId && p.fecha === fecha);
  if (existente === undefined) return { ok: false, tipo: "regla", errores: errorGeneralParte(ERRORES.parteInexistente, TEXTO_FORMULARIO_PARTE.tituloGeneralCierre) };

  const c = comandoDeCierre(existente.id, valores);
  if (!c.ok) return { ok: false, tipo: "campos", errores: c.errores };
  // Ensayo: si no cambia nada, no se escribe (ni se marca la demo como modificada).
  const ensayo = aplicarComando(estado, c.comando, app.contextoDeEnsayo(perfil));
  if (!ensayo.ok) return erroresDeCierre(ensayo.error);
  if (ensayo.valor.cambios.partes.length === 0) return { ok: true, parteId: existente.id, hora: formatearHora(existente.actualizado), sinCambios: false };

  const r = await app.ejecutarAhora(c.comando, perfil);
  if (!r.ok) return erroresDeCierre(r.error);
  const guardado = r.valor.cambios.partes[0];
  return { ok: true, parteId: guardado?.id ?? existente.id, hora: guardado === undefined ? null : formatearHora(guardado.actualizado), sinCambios: false };
}

/** Los errores de un envío, con el foco en el resumen de errores. */
function erroresDeEnvio(e: ErroresDeParte): ResultadoDeEnvio {
  return { tipo: "errores", errores: e, foco: "resumen-de-errores", primerCampo: e.lista[0]?.campo ?? null };
}

/** Las advertencias que hay que aceptar (K6, K7), listas para el diálogo «Antes de enviar». */
function advertenciasPendientes(error: ErrorDeNegocio): ResultadoDeEnvio {
  const pendientes = advertenciasLegibles(error.detalle?.["advertencias"]);
  return {
    tipo: "advertencias",
    advertencias: pendientes.map((a) => ({ tipo: a.tipo, texto: textoAdvertencia(a), tono: "semana" })),
    aceptables: pendientes.map((a) => a.tipo),
    foco: "dialogo-antes-de-enviar",
  };
}

/** El resultado de un parte que ya estaba enviado cuando se pidió enviar (doble clic, otra pestaña): se devuelve el mismo panel sin hacer nada. */
function resultadoYaHecho(hoy: FechaCivil, estado: Estado, p: Parte, perfil: Perfil): ResultadoDeEnvio {
  if (p.estado === "en-uso") return { tipo: "enviado", paso: "revision-enviada", yaEnviado: true, panel: panelDeRevisionEnviada(estado, p, perfil, hoy), foco: "titulo-del-parte-enviado" };
  if (p.sinSalida) return { tipo: "enviado", paso: "sin-salida", yaEnviado: true, panel: panelDeSinSalida(estado, p, perfil), foco: "titulo-del-parte-enviado" };
  return { tipo: "enviado", paso: "cerrado", yaEnviado: true, panel: panelDeParteEnviado(estado, p, perfil), foco: "titulo-del-parte-enviado" };
}

export async function enviarRevisionAhora(app: EscrituraDeApp, unidadId: string, fecha: FechaCivil, valores: ValoresParte, aceptadas: Advertencia["tipo"][]): Promise<ResultadoDeEnvio> {
  const estado = app.estado;
  if (estado === null) return erroresDeEnvio(errorGeneralParte(ERRORES.sinDatos));
  const perfil = app.perfil;
  const donde = (p: { unidadId: string; fecha: FechaCivil }) => p.unidadId === unidadId && p.fecha === fecha;

  // Un doble clic, o una revisión que otra pestaña ya envió: no se hace nada y se devuelve el mismo resultado.
  const yaHecho = estado.partes.find((p) => donde(p) && p.estado !== "borrador");
  if (yaHecho !== undefined) return resultadoYaHecho(app.hoy, estado, yaHecho, perfil);

  const v = perfil.tipo === "conductor" ? { ...valores, conductorId: perfil.conductorId } : valores;
  // Todo lo que impide enviar (faltantes y errores de formato) se lista junto, en el orden del formulario. Lo escrito se guarda igual, salvo que tenga un error de formato.
  const previos = validarParaEnviar(v, "revision");
  const guardado = await guardarBorradorAhora(app, unidadId, fecha, v, perfil);
  if (!guardado.ok && guardado.tipo !== "campos") return erroresDeEnvio(guardado.errores);
  if (!guardado.ok) return erroresDeEnvio(previos ?? guardado.errores);

  const borrador = app.estado?.partes.find((p) => donde(p));
  // Abrir el formulario y enviarlo vacío no crea un borrador (D11): lo que falta se dice igual.
  if (borrador === undefined) return erroresDeEnvio(previos ?? errorGeneralParte(ERRORES.parteInexistente));
  // L1, P21, P18 y P20 van antes que los faltantes (como en el comando): a quien no puede manejar, o la unidad no puede salir, o tiene un parte anterior sin cerrar, no se le piden los diez puntos.
  const r = await app.ejecutarAhora({ tipo: "enviarRevision", parteId: borrador.id, advertenciasAceptadas: aceptadas }, perfil);
  if (!r.ok) {
    if (ERRORES_QUE_VAN_ANTES_DE_LOS_FALTANTES.has(r.error.codigo)) return erroresDeEnvio(erroresDeNegocioParte(r.error));
    if (previos !== null) return erroresDeEnvio(conErrorDeKilometraje(app.estado, previos, v, borrador));
    if (r.error.codigo === "advertencias-sin-aceptar") return advertenciasPendientes(r.error);
    return erroresDeEnvio(erroresDeNegocioParte(r.error));
  }
  const enviado = r.valor.estado.partes.find((p) => p.id === borrador.id);
  if (enviado === undefined) return erroresDeEnvio(errorGeneralParte(ERRORES.parteInexistente)); // no pasa: el comando acaba de escribirlo
  const hecho = resultadoYaHecho(app.hoy, r.valor.estado, enviado, perfil);
  return hecho.tipo === "enviado" ? { ...hecho, yaEnviado: false } : hecho;
}

/** m3: lo que impide enviar más el kilometraje de salida si retrocede o pasa al parte siguiente (K3, K4), que el comando no llega a decir mientras falten datos. */
function conErrorDeKilometraje(estado: Estado | null, previos: ErroresDeParte, valores: ValoresParte, borrador: Parte): ErroresDeParte {
  const unidad = estado?.unidades.find((u) => u.id === borrador.unidadId);
  if (estado === null || unidad === undefined || borrador.kmInicio === null) return previos;
  const km = validarKmDeSalida({ unidad, fecha: borrador.fecha, kmInicio: borrador.kmInicio, partes: estado.partes, correcciones: estado.correccionesKm });
  return km.ok ? previos : sumarErrorDeRegla(valores, previos, km.error);
}

export async function enviarCierreAhora(app: EscrituraDeApp, unidadId: string, fecha: FechaCivil, valores: ValoresParte, aceptadas: Advertencia["tipo"][]): Promise<ResultadoDeEnvio> {
  const titulo = TEXTO_FORMULARIO_PARTE.tituloGeneralCierre;
  const estado = app.estado;
  if (estado === null) return erroresDeEnvio(errorGeneralParte(ERRORES.sinDatos, titulo));
  const perfil = app.perfil;
  const parte = estado.partes.find((p) => p.unidadId === unidadId && p.fecha === fecha);
  if (parte === undefined) return erroresDeEnvio(errorGeneralParte(ERRORES.parteInexistente, titulo));
  // Un doble clic, o un cierre que otra pestaña ya hizo: no se hace nada y se devuelve el mismo parte.
  if (parte.estado === "enviado") return resultadoYaHecho(app.hoy, estado, parte, perfil);
  if (parte.estado === "borrador") return erroresDeEnvio(errorGeneralParte(ERRORES.parteSinRevision, titulo));

  const previos = validarParaEnviar(valores, "cierre");
  const guardado = await guardarCierreAhora(app, unidadId, fecha, valores, perfil);
  if (!guardado.ok && guardado.tipo !== "campos") return erroresDeEnvio(guardado.errores);
  if (previos !== null) return erroresDeEnvio(previos);
  if (!guardado.ok) return erroresDeEnvio(guardado.errores);

  const r = await app.ejecutarAhora({ tipo: "enviarCierre", parteId: parte.id, advertenciasAceptadas: aceptadas }, perfil);
  if (!r.ok) {
    if (r.error.codigo === "advertencias-sin-aceptar") return advertenciasPendientes(r.error);
    return erroresDeEnvio(erroresDeNegocioParte(r.error, "cierre"));
  }
  const cerrado = r.valor.estado.partes.find((p) => p.id === parte.id);
  if (cerrado === undefined) return erroresDeEnvio(errorGeneralParte(ERRORES.parteInexistente, titulo)); // no pasa: el comando acaba de escribirlo
  return { tipo: "enviado", paso: "cerrado", yaEnviado: false, panel: panelDeParteEnviado(r.valor.estado, cerrado, perfil), foco: "titulo-del-parte-enviado" };
}

/**
 * El autoguardado (P3) de la pantalla de un parte, ya conectado: `autoguardadoDeParte(app, vista, (i) => (indicador = i))`. Hay que `cerrar()` al salir de la pantalla y
 * `reiniciar(valores)` después de descartar el borrador. `opciones` es para los tests (reloj inyectado).
 */
export function autoguardadoDeParte(app: EscrituraDeApp, vista: ParteEnEdicion, alCambiar: (indicador: IndicadorDeGuardado) => void, opciones: Pick<DependenciasAutoguardado, "esperaMs" | "programar" | "cancelar"> = {}): Autoguardado {
  // El perfil se toma ahora, al abrir el formulario: si se cambia de perfil, el formulario se destruye y guarda lo pendiente ya con el perfil nuevo, y ese guardado
  // tiene que seguir firmado por quien escribió (código B9).
  const perfil = app.perfil;
  return crearAutoguardado({ ...opciones, valores: vista.valoresIniciales, alCambiar, guardar: (valores) => app.guardarBorradorDeParte(vista.unidadId, vista.fecha, valores, perfil) });
}

/** El autoguardado (P3) del cierre de la jornada (paso 2), con las mismas reglas que el de la revisión: `autoguardadoDeCierre(app, vista, (i) => (indicador = i))`. */
export function autoguardadoDeCierre(app: EscrituraDeApp, vista: ParteEnCierre, alCambiar: (indicador: IndicadorDeGuardado) => void, opciones: Pick<DependenciasAutoguardado, "esperaMs" | "programar" | "cancelar"> = {}): Autoguardado {
  const perfil = app.perfil;
  return crearAutoguardado({ ...opciones, valores: vista.valoresIniciales, alCambiar, guardar: (valores) => app.guardarCierreDeParte(vista.unidadId, vista.fecha, valores, perfil) });
}

/** «Descartar borrador» (el botón-texto de dos pasos del parte y del inicio del conductor). No deja eventos (sección 8); un parte enviado no se descarta (P7). */
export async function descartarBorradorDeParte(app: EscrituraDeApp, parteId: string): Promise<ResultadoDeDescarte> {
  const r = await app.ejecutar({ tipo: "descartarBorrador", parteId });
  return r.ok
    ? { ok: true, mensaje: TEXTO_FORMULARIO_PARTE.borradorDescartado }
    : { ok: false, mensaje: r.error.mensaje, errores: errorGeneralParte(r.error.mensaje, TEXTO_FORMULARIO_PARTE.tituloNoSePudoDescartar) };
}