// Escritura de la ficha de unidad (paso 4.4): un método por comando de la sección 8 que se dispara desde la ficha (corregir un documento, cargar otro, cargar una novedad, poner fuera de servicio,
// volver a servicio, dar de baja, corregir el kilometraje y cambiar el proyecto o el conductor). Todos revisan todos los campos juntos (5.15) con los mismos validadores del dominio, ejecutan el
// comando (cambios y evento en una escritura, D10) y devuelven `ResultadoGuardado`: nunca rechazan. El perfil Conductor no puede ninguno (error general «sin permiso»).
// Se baja con la ficha (no viaja con el marco): `EstadoApp` lo pide con `import()` la primera vez que se escribe desde la ficha y sigue siendo la puerta (la cola de comandos es una sola).

import { aptitud } from "../dominio/aptitud.ts";
import { comandoDeCargarOtro, comandoDeCorregir, errorGeneralCargarOtro, erroresDeNegocioCargarOtro, etiquetaDeTitular, validarCargarOtro, type CampoCargarOtro, type CampoDocumento, type ValoresCargarOtro, type ValoresDocumento } from "../dominio/formulario-documento.ts";
import { errorGeneralEn } from "../dominio/formulario.ts";
import {
  comandoDeAsignacion,
  comandoDeBaja,
  comandoDeFueraDeServicio,
  comandoDeKilometraje,
  comandoDeVolverAServicio,
  erroresDeNegocioAsignacion,
  erroresDeNegocioBaja,
  erroresDeNegocioFueraDeServicio,
  erroresDeNegocioKilometraje,
  errorGeneralAsignacion,
  errorGeneralBaja,
  errorGeneralFueraDeServicio,
  errorGeneralKilometraje,
  validarAsignacion,
  validarBaja,
  validarFueraDeServicio,
  validarKilometraje,
  type CampoAsignacion,
  type CampoBaja,
  type CampoFueraDeServicio,
  type CampoKilometraje,
  type ValoresAsignacion,
  type ValoresBaja,
  type ValoresFueraDeServicio,
  type ValoresKilometraje,
} from "../dominio/formulario-ficha.ts";
import { comandoDeCargarNovedad, erroresDeNegocioCargarNovedad, errorGeneralCargarNovedad, validarCargarNovedad, type CampoCargarNovedad, type ValoresCargarNovedad } from "../dominio/formulario-novedad.ts";
import { ERRORES } from "../dominio/textos-base.ts";
import { textoAsignacionCambiada, textoDocumentoCorregido, textoFueraDeServicio, textoKmCorregido, textoNovedadCargada, textoUnidadDadaDeBaja, textoVueltaAServicio } from "../dominio/textos-ficha.ts";
import { textoDocumentoCargado } from "../dominio/textos-inicio.ts";
import { esTipoDocumento } from "../dominio/vencimientos.ts";
import type { EstadoApp, ResultadoGuardado } from "./app.svelte.ts";

/** Lo que estas funciones le piden a `EstadoApp`: leer el estado y guardar un formulario (que ya pasa por la cola). */
export type EscrituraDeFicha = Pick<EstadoApp, "estado" | "alertas" | "hoy" | "guardarDocumento" | "guardarFormulario" | "patenteDe">;
/** «Corregir documento»: el vigente de una unidad o de un conductor, con sus cuatro campos. Es de la ficha (foco al título de Documentos). */
export function corregirDocumento(app: EscrituraDeFicha, documentoId: string, valores: ValoresDocumento): Promise<ResultadoGuardado<CampoDocumento>> {
  return app.guardarDocumento(
    valores,
    comandoDeCorregir(documentoId, valores),
    (despues) => {
      const doc = despues.documentos.find((d) => d.id === documentoId);
      return doc === undefined ? null : textoDocumentoCorregido(doc.tipo, etiquetaDeTitular(despues, doc.titular));
    },
    "ficha",
  );
}

/** «Cargar otro documento»: el `select` Tipo elige cuál (uno de `contextoDeCargarOtro(...).tipos`) y el resto es igual que `cargarDocumento`. */
export async function cargarOtroDocumento(app: EscrituraDeFicha, unidadId: string, valores: ValoresCargarOtro): Promise<ResultadoGuardado<CampoCargarOtro>> {
  const tipo = valores.tipoDocumento;
  if (!esTipoDocumento(tipo)) {
    // El `select` no ofrece otra cosa: un valor vacío o inventado se contesta igual que la revisión del formulario (el error va al campo Tipo).
    const previos = app.estado === null ? null : validarCargarOtro(valores, app.estado, unidadId, app.hoy);
    return { ok: false, errores: previos ?? errorGeneralCargarOtro(ERRORES.sinDatos) };
  }
  return app.guardarFormulario({
    previos: (estado) => validarCargarOtro(valores, estado, unidadId, app.hoy),
    comando: comandoDeCargarOtro(unidadId, valores),
    errores: erroresDeNegocioCargarOtro,
    general: errorGeneralCargarOtro,
    exito: (e) => ({ mensaje: textoDocumentoCargado(tipo, app.patenteDe(e.estado, unidadId)), foco: "titulo-de-documentos" }),
  });
}

/** «Cargar novedad» a mano (N3): con «Impide usar la unidad» la unidad queda fuera de servicio (A3). */
export function cargarNovedad(app: EscrituraDeFicha, unidadId: string, valores: ValoresCargarNovedad): Promise<ResultadoGuardado<CampoCargarNovedad>> {
  return app.guardarFormulario({
    previos: () => validarCargarNovedad(valores),
    comando: comandoDeCargarNovedad(unidadId, valores),
    errores: erroresDeNegocioCargarNovedad,
    general: errorGeneralCargarNovedad,
    exito: (e) => ({ mensaje: textoNovedadCargada(app.patenteDe(e.estado, unidadId), valores.impideUso), foco: "titulo-de-novedades" }),
  });
}

/** «Poner fuera de servicio» (A6). */
export function ponerFueraDeServicio(app: EscrituraDeFicha, unidadId: string, valores: ValoresFueraDeServicio): Promise<ResultadoGuardado<CampoFueraDeServicio>> {
  return app.guardarFormulario({
    previos: () => validarFueraDeServicio(valores),
    comando: comandoDeFueraDeServicio(unidadId, valores),
    errores: erroresDeNegocioFueraDeServicio,
    general: errorGeneralFueraDeServicio,
    exito: (e) => ({ mensaje: textoFueraDeServicio(app.patenteDe(e.estado, unidadId)), foco: "titulo-de-la-ficha" }),
  });
}

/**
 * «Volver a servicio» (A4, A5). Con críticas abiertas se rechaza con el error general que las nombra (el diálogo ya lo avisó y no ofrece el botón).
 * Con documentos vencidos o faltantes vuelve igual y el mensaje dice que todavía no puede salir.
 */
export function volverAServicio(app: EscrituraDeFicha, unidadId: string): Promise<ResultadoGuardado<never>> {
  return app.guardarFormulario<never>({
    previos: () => null,
    comando: comandoDeVolverAServicio(unidadId),
    errores: (error) => errorGeneralEn(error.mensaje),
    general: (mensaje) => errorGeneralEn(mensaje),
    exito: (e) => {
      const u = e.estado.unidades.find((x) => x.id === unidadId);
      const a = u === undefined ? null : aptitud(u, e.estado, app.hoy);
      const pendientes = a === null || a.puedeSalir ? [] : a.motivos.map((m) => m.texto);
      return { mensaje: textoVueltaAServicio(app.patenteDe(e.estado, unidadId), pendientes), foco: "titulo-de-la-ficha" };
    },
  });
}

/** «Dar de baja» (A7): irreversible en la demo; conserva documentos, partes e historial. */
export function darDeBaja(app: EscrituraDeFicha, unidadId: string, valores: ValoresBaja): Promise<ResultadoGuardado<CampoBaja>> {
  return app.guardarFormulario({
    previos: () => validarBaja(valores),
    comando: comandoDeBaja(unidadId, valores),
    errores: erroresDeNegocioBaja,
    general: errorGeneralBaja,
    exito: (e) => ({ mensaje: textoUnidadDadaDeBaja(app.patenteDe(e.estado, unidadId)), foco: "titulo-de-la-ficha" }),
  });
}

/** «Corregir kilometraje» (K5, M3). */
export function corregirKilometraje(app: EscrituraDeFicha, unidadId: string, valores: ValoresKilometraje): Promise<ResultadoGuardado<CampoKilometraje>> {
  return app.guardarFormulario({
    previos: () => validarKilometraje(valores, app.hoy),
    comando: comandoDeKilometraje(unidadId, valores),
    errores: erroresDeNegocioKilometraje,
    general: errorGeneralKilometraje,
    exito: (e) => ({
      mensaje: textoKmCorregido(app.patenteDe(e.estado, unidadId), e.cambios.correccionesKm?.[0]?.kmBase ?? 0),
      foco: "titulo-de-kilometraje",
    }),
  });
}

/** «Cambiar proyecto o conductor» (U6): si el proyecto nuevo exige la habilitación y no la tiene, el mensaje lo dice y la alerta ya existe. */
export function cambiarAsignacion(app: EscrituraDeFicha, unidadId: string, valores: ValoresAsignacion): Promise<ResultadoGuardado<CampoAsignacion>> {
  const antes = app.estado?.unidades.find((u) => u.id === unidadId);
  return app.guardarFormulario({
    previos: () => validarAsignacion(valores),
    comando: comandoDeAsignacion(unidadId, valores),
    errores: erroresDeNegocioAsignacion,
    general: errorGeneralAsignacion,
    exito: () => {
      const cambio = {
        proyecto: antes === undefined || antes.proyectoId !== valores.proyectoId,
        conductor: antes === undefined || (antes.conductorId ?? "") !== valores.conductorId,
      };
      const falta =
        cambio.proyecto &&
        (app.alertas?.alertas.some((x) => x.tipo === "documento-faltante" && x.unidadId === unidadId && x.tipoDocumento === "habilitacion-proyecto") ?? false);
      return { mensaje: textoAsignacionCambiada(cambio, falta), foco: "titulo-de-la-ficha" };
    },
  });
}
