// Pantalla del parte (docs/diseno-ui.md, 6.5): todo lo que dibuja, listo, sin DOM y sin reglas nuevas. Los enlaces vienen como `href` ya armados (`#/parte/ZK214BD/2026-11-18`).
//
// El parte tiene dos pasos (docs/diseno.md, sección 17): la revisión antes de salir y el cierre de la jornada. Qué se muestra en cada ruta lo decide el
// estado del parte: sin parte o borrador → revisión; en uso → cierre; cerrado → lectura. Se baja con la pantalla del parte; el inicio del conductor está en `conductor.ts`.
// Uso: `leerParte(app)`.

import { diaDeLaSemana, diasEntre, fechaEnArgentina, formatearFecha, parsearInstante } from "../dominio/fechas.ts";
import { type OpcionDeConductor, opcionesDeConductor } from "../dominio/formulario.ts";
import { OPCIONES_COMBUSTIBLE, valoresIniciales } from "../dominio/formulario-parte.ts";
import { valoresDeParte, type ValoresParte } from "../dominio/formulario-parte-valores.ts";
import { describirRegistro, kmDeRegistro, registroAnterior, textoRecorrido } from "../dominio/kilometraje.ts";
import { conductorParaParte, documentacionQueBloquea, ITEMS_CHECKLIST, novedadesDelParte, parteEnUsoDelConductor, parteLegible, partePendienteDeCierre, renglonesDeAvisosAceptados, validarFechaParte } from "../dominio/parte.ts";
import { formatearPatente } from "../dominio/patente.ts";
import { errDocumentacionDeLaUnidad, errUnidadDeBaja, errUnidadFueraDeServicio, formatearKm, NOMBRES_COMBUSTIBLE, type RenglonDeAviso, textoCerrarAntesDeLaRevision, textoDescripcionUnidad, textoInterno, textoLitros, textoParteSinCerrarDeLaUnidad, textoRangoKm, textoUltimoRegistro, textoUnidadNoEncontrada } from "../dominio/textos-base.ts";
import { type AvisoDeAptitud, TEXTO_BORRADOR_CONSERVADO, TEXTO_BORRADOR_CONSERVADO_POR_DOCUMENTACION, TEXTO_CERRAR_ANTES, textoLicenciaDelConductorNoAmpara, textoOpcionDeConductor, TEXTO_INICIO_CONDUCTOR as TI } from "../dominio/textos-conductor.ts";
import { TEXTO_FORMULARIO_PARTE, TEXTO_GUARDADO, TEXTO_PARTE, textoLineaParteCerrado, textoLineaRevisionEnviada, textoLineaSinSalida, textoNovedadesDelParte, textoPuntosEnOrdenConNombres, textoResumenDeLaRevision, textoUnidadQuedoFueraDeServicio, TEXTO_PANTALLA_PARTE as TP } from "../dominio/textos-parte.ts";
import type { Estado, FechaCivil, ItemChecklist, NivelCombustible, Parte, Perfil, Unidad } from "../dominio/tipos.ts";
import { estadoDeLicencia } from "../dominio/vencimientos.ts";
import { aHash, nombreDePantalla, rutaPorDefecto } from "./enrutador.ts";
import type { LecturaDeApp } from "./lectura.ts";
import { type EnlaceDeParte, horaDe, hrefDelParte, nombreDelPunto, parteDe, textoDeNoPuedeSalir } from "./conductor.ts";

/**
 * El panel de resultado de un parte (5.4): lo que se muestra al enviar la revisión (C1), cuando una novedad crítica deja la unidad sin salir (C2) y al cerrar (C3) y,
 * con los mismos datos, al abrir un parte ya cerrado (D). `variante` dice cuál es; los campos que no corresponden vienen `null` o vacíos.
 */
export interface PanelParteEnviado {
  variante: "revision-enviada" | "sin-salida" | "cerrado";
  /** «Revisión enviada» · «La unidad no puede salir» · «Parte cerrado». */
  titulo: string;
  /** «ZK 214 BD puede salir. Revisión enviada a las 06:52.» · «Revisión enviada a las 06:52 con una novedad crítica: Frenos.» · «ZK 214 BD, 18/11/2026: revisión a las 06:52, cierre a las 18:42.» */
  linea: string;
  /**
   * Un `dl`. C1: Al iniciar y Novedades. C3: Recorrido «132 km (84.320 → 84.452)», Combustible «3/4», Combustible cargado «Cargó 45,5 litros», Novedades. Sin salida
   * (lectura): Recorrido «Sin uso: la unidad no salió» y Combustible «No se registró: la unidad no salió», sin litros. C2: vacío.
   */
  filas: { rotulo: string; valor: string }[];
  /** Aviso en tono semana si hubo una novedad crítica y la unidad está fuera de servicio (A3): en C2 y, mientras siga así, en la lectura de un parte sin salida. */
  avisoCritica: string | null;
  /**
   * Los avisos que se aceptaron al enviar (K6, K7), uno por renglón y con su tono (C3 y lectura: los de la revisión y los del cierre): un renglón por documento vencido y uno por cada
   * aviso de kilómetros. La vista elige el ícono por el `tono` y usa el índice como clave (dos renglones pueden decir lo mismo).
   */
  advertencias: RenglonDeAviso[];
  /** «Revisión enviada fuera de plazo.» (P5) o `null`. */
  fueraDePlazo: string | null;
  /** C1: «El encargado la ve en el centro de alertas.» si la revisión abrió novedades normales. */
  notaEncargado: string | null;
  /** El párrafo final: C1 «Al terminar la jornada, vuelva a este parte…», C2 «Si tiene que salir, elija otra unidad en Hoy.» (Encargado: «…desde el inicio.»); `null` en C3. */
  parrafo: string | null;
  /** Solo C1: «Completar el cierre ahora» (parte de hoy: botón-texto) o «Completar el cierre» (parte de un día pasado: primario). `href` es el de la misma ruta. */
  completarCierre: { texto: string; href: string; primario: boolean } | null;
  /** «Volver a Hoy» (perfil Conductor) o «Volver al inicio» (Encargado): la pantalla de entrada del perfil. */
  volverAlInicio: EnlaceDeParte;
}

/** Una opción del `select` Conductor del parte: `textoDeOpcion` es lo que se escribe en la opción (C13): «{Nombre} · {P}» o, sin licencia vigente, «{Nombre} (sin licencia)». */
export interface OpcionDeConductorDelParte extends OpcionDeConductor {
  textoDeOpcion: string;
}

export interface ParteNoEncontrada {
  tipo: "no-encontrada";
  /** El `h1`: «No se encontró la unidad». */
  titulo: string;
  mensaje: string;
  enlace: EnlaceDeParte;
}

/** No se puede cargar (P2, P8, baja, L1, «Cerrar antes»): el mensaje de la regla. Con un borrador, se ofrece descartarlo (P5: es la salida). */
export interface ParteNoDisponible {
  tipo: "no-disponible";
  titulo: string;
  mensaje: string;
  /** L1 con el perfil Conductor, parte de hoy y un borrador: «El borrador se conserva: cuando el encargado cargue una licencia vigente, podrá enviarlo.» */
  nota: string | null;
  borrador: { parteId: string; descartar: string } | null;
  enlace: EnlaceDeParte;
  /**
   * «Cerrar antes» (A1, P20; pantalla E): la unidad tiene un parte anterior en uso, o el conductor (perfil Conductor) tiene uno en otra unidad. `renglon1` «ZK 214 BD: el
   * parte del martes 17/11/2026 quedó sin cerrar.», `renglon2` «Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.» (`mensaje` es los dos juntos) y
   * `primario` «Cerrar el parte anterior» hacia el cierre. Con un borrador de esta fecha, `nota` dice que se conserva. `null` en los demás motivos.
   */
  cerrarAntes: { renglon1: string; renglon2: string; primario: EnlaceDeParte } | null;
}

export interface PuntoDelFormulario {
  id: ItemChecklist;
  texto: string;
  critico: boolean;
  /** La nota en tono crítico de un punto crítico (5.12); `null` en los demás, que tienen la casilla «Impide usar la unidad». */
  notaCritica: string | null;
}

/** Los diez puntos de la revisión y «Otra novedad», tal como se enviaron: el resumen del paso 2 y la lectura de un parte cerrado. */
export interface RevisionEnLectura {
  /** «9 puntos en orden: Dirección, …»; `null` si ninguno. */
  puntosEnOrden: string | null;
  /** Los puntos con novedad y «Otra novedad», con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
}

export interface ParteEnLectura {
  tipo: "lectura";
  /** El `h1`: «Parte del miércoles 18/11/2026». Con el panel recién enviado, el `h1` es `panel.titulo`. */
  titulo: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  conductor: string | null;
  /** La etiqueta de estado: «Cerrado». */
  etiqueta: string;
  /** Revisión «06:52» y Cierre «18:42» (sin salida: solo la revisión); un instante ilegible no se muestra. */
  momentos: { rotulo: string; valor: string }[];
  sinSalida: boolean;
  panel: PanelParteEnviado;
  /** «9 puntos en orden: Dirección, …»; `null` si ninguno. */
  puntosEnOrden: string | null;
  /** Los puntos con novedad y «Otra novedad», con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
  vuelta: EnlaceDeParte;
}

/** Paso 1: la revisión antes de salir (parte sin enviar o borrador). */
export interface ParteEnEdicion {
  tipo: "edicion";
  paso: "revision";
  /** El `h1` y el título de la pestaña: «Revisión antes de salir». */
  titulo: string;
  /** «Parte del miércoles 18/11/2026 · paso 1 de 2». */
  contexto: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  fecha: FechaCivil;
  /** «Este parte es del 17/11/2026: la revisión se va a enviar fuera de plazo.» */
  avisoFueraDePlazo: string | null;
  /** El mismo aviso de «no puede salir» del inicio (con la acción solo para el conductor). */
  avisoAptitud: AvisoDeAptitud | null;
  /** El id del borrador guardado; `null` si todavía no se guardó nada (se crea con el primer cambio). */
  parteId: string | null;
  /** Un borrador que ya existía al abrir (por ejemplo, tras recargar): cuándo se guardó. */
  borrador: { mensaje: string } | null;
  /**
   * Perfil Conductor: el conductor es quien completa (texto fijo). Perfil Encargado: un `select`; cada opción dice si su licencia ampara la fecha del parte
   * (`licenciaVigente`: la vista agrega « (sin licencia vigente)»). El asignado se precarga solo si su licencia ampara la fecha (P13).
   */
  conductor: { tipo: "fijo"; id: string; nombre: string } | { tipo: "elegir"; etiqueta: string; opciones: OpcionDeConductorDelParte[] };
  /**
   * Los valores para ARRANCAR el formulario (el borrador guardado o los de P13). La vista los copia a su propio estado y no los vuelve a leer: cada
   * autoguardado cambia el estado de la aplicación y esta vista se recalcula, pero lo que escribe la persona no se pisa.
   */
  valoresIniciales: ValoresParte;
  ayudaKmInicio: string;
  ayudaKmFin: string;
  ayudaLitros: string;
  puntos: PuntoDelFormulario[];
  /** «Impide usar la unidad» de los puntos no críticos y de «Otra novedad». */
  etiquetaImpideUso: string;
  etiquetaOtraNovedad: string;
  combustible: readonly { valor: NivelCombustible; etiqueta: string }[];
  /** «← Parte diario» (Conductor) o «← Ficha de ZK 214 BD» (Encargado). */
  vuelta: EnlaceDeParte;
}

/** Paso 2: el cierre de la jornada (parte en uso). */
export interface ParteEnCierre {
  tipo: "cierre";
  paso: "cierre";
  /** El `h1` y el título de la pestaña: «Cierre de la jornada». */
  titulo: string;
  /** «Parte del miércoles 18/11/2026 · paso 2 de 2». */
  contexto: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  fecha: FechaCivil;
  parteId: string;
  /**
   * Lo que ya se envió y no cambia (P7): «Revisión enviada a las 06:52 · Al iniciar: 84.320 km · Sin novedades» (con el perfil Encargado agrega «· Conductor: {Nombre}») y,
   * en el `details` «Ver la revisión», los puntos como en la lectura. Sin hora legible: «Revisión enviada · …».
   */
  resumen: { linea: string; verLaRevision: string; revision: RevisionEnLectura };
  /** «84.320 km»: «Al iniciar» como texto (a partir de 30rem va junto al campo «Al terminar»). */
  kmInicioTexto: string;
  /** Los valores para ARRANCAR el cierre (lo que hubiera guardado): solo cuentan `kmFin`, `combustible` y `litros`; `kmInicio` sirve para el recorrido. */
  valoresIniciales: ValoresParte;
  /** Un cierre que ya tenía datos guardados al abrir: cuándo se guardó. */
  borrador: { mensaje: string } | null;
  ayudaKmFin: string;
  ayudaLitros: string;
  combustible: readonly { valor: NivelCombustible; etiqueta: string }[];
  /** «← Parte diario» (Conductor) o «← Ficha de ZK 214 BD» (Encargado). */
  vuelta: EnlaceDeParte;
}

export type VistaDeParte = ParteNoEncontrada | ParteNoDisponible | ParteEnLectura | ParteEnEdicion | ParteEnCierre;

function enlaceAlInicio(perfil: Perfil): EnlaceDeParte {
  const ruta = rutaPorDefecto(perfil);
  return { texto: `Ir a ${nombreDePantalla(ruta)}`, href: aHash(ruta) };
}

function enlaceDeVuelta(perfil: Perfil, unidad: Unidad): EnlaceDeParte {
  return perfil.tipo === "conductor"
    ? { texto: TP.vueltaConductor, href: aHash({ tipo: "conductor" }) }
    : { texto: TP.vueltaFicha(formatearPatente(unidad.patente)), href: aHash({ tipo: "unidad", patente: unidad.patente }) };
}

function diaConFecha(fecha: FechaCivil): string {
  return `${diaDeLaSemana(fecha)} ${formatearFecha(fecha)}`;
}

/** Las novedades de un parte, separadas por gravedad y con el nombre del punto. */
function novedadesPorGravedad(parte: Parte): { criticas: string[]; normales: string[] } {
  const novedades = novedadesDelParte(parte);
  return {
    criticas: novedades.filter((n) => n.gravedad === "critica").map((n) => nombreDelPunto(n.item)),
    normales: novedades.filter((n) => n.gravedad === "normal").map((n) => nombreDelPunto(n.item)),
  };
}

function revisionEnLectura(parte: Parte): RevisionEnLectura {
  const enOrden = ITEMS_CHECKLIST.filter((i) => parte.checklist[i.id].estado === "en-orden").map((i) => i.texto);
  return {
    puntosEnOrden: enOrden.length === 0 ? null : textoPuntosEnOrdenConNombres(enOrden),
    novedades: novedadesDelParte(parte).map((n) => ({ rotulo: nombreDelPunto(n.item), texto: n.descripcion, critica: n.gravedad === "critica" })),
  };
}

function panelBase(estado: Estado, parte: Parte, perfil: Perfil): { patente: string; unidad: Unidad | undefined; volverAlInicio: EnlaceDeParte } {
  const unidad = estado.unidades.find((u) => u.id === parte.unidadId);
  return { patente: unidad === undefined ? "" : formatearPatente(unidad.patente), unidad, volverAlInicio: { texto: perfil.tipo === "conductor" ? TP.volverAHoy : TP.volverAlInicio, href: aHash(rutaPorDefecto(perfil)) } };
}

/** El panel «Parte cerrado» (C3) de un parte cerrado, y con los mismos datos la lectura (D). Un parte con la forma rota se lee con `parteLegible`: lo que no se puede leer se muestra como «—», sin inventar nada. */
export function panelDeParteEnviado(estado: Estado, entrada: Parte, perfil: Perfil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, unidad, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas, normales } = novedadesPorGravedad(parte);
  const revision = parte.revisado;
  const diaDeRevision = revision === null || parsearInstante(revision) === null ? null : fechaEnArgentina(revision);
  const sinValor = TEXTO_FORMULARIO_PARTE.sinRecorrido;

  const filas: PanelParteEnviado["filas"] = [];
  if (parte.sinSalida) {
    filas.push({ rotulo: TP.rotulos.recorrido, valor: TP.sinUsoSinSalida }, { rotulo: TP.rotulos.combustible, valor: TP.noSeRegistroSinSalida });
  } else {
    filas.push(
      { rotulo: TP.rotulos.recorrido, valor: parte.kmInicio === null || parte.kmFin === null ? sinValor : `${textoRecorrido(parte.kmFin - parte.kmInicio)} (${textoRangoKm(parte.kmInicio, parte.kmFin)})` },
      { rotulo: TP.rotulos.combustible, valor: parte.combustible === null ? sinValor : NOMBRES_COMBUSTIBLE[parte.combustible] },
      { rotulo: TP.rotulos.litros, valor: parte.litrosCargados === null ? TP.noCargo : `Cargó ${textoLitros(parte.litrosCargados)}` },
    );
  }
  filas.push({ rotulo: TP.rotulos.novedades, valor: textoNovedadesDelParte(criticas, normales) });

  return {
    variante: "cerrado",
    titulo: TP.enviado,
    linea: textoLineaParteCerrado(patente, parte.fecha, horaDe(revision), parte.sinSalida ? null : horaDe(parte.enviado ?? (parte.actualizado === "" ? null : parte.actualizado))),
    filas,
    avisoCritica: criticas.length > 0 && unidad?.estado.tipo === "fuera-de-servicio" && parte.sinSalida ? TEXTO_PARTE.enviadoConCritica : null,
    advertencias: renglonesDeAvisosAceptados(parte),
    fueraDePlazo: diaDeRevision !== null && diasEntre(parte.fecha, diaDeRevision) > 0 ? TP.fueraDePlazo : null,
    notaEncargado: null,
    parrafo: null,
    completarCierre: null,
    volverAlInicio,
  };
}

/** C1: el panel de «Revisión enviada» (el parte quedó en uso). `hoy` decide cuál de las dos acciones es la primaria. */
export function panelDeRevisionEnviada(estado: Estado, entrada: Parte, perfil: Perfil, hoy: FechaCivil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, unidad, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas, normales } = novedadesPorGravedad(parte);
  const hora = horaDe(parte.revisado);
  const diaDeEnvio = hora === null || parte.revisado === null ? null : fechaEnArgentina(parte.revisado);
  const esHoy = parte.fecha === hoy;
  const href = unidad === undefined ? volverAlInicio.href : aHash({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha });

  return {
    variante: "revision-enviada",
    titulo: TP.tituloRevisionEnviada,
    linea: textoLineaRevisionEnviada(patente, parte.fecha, diaDeEnvio, hora),
    filas: [
      { rotulo: TP.rotulos.alIniciar, valor: parte.kmInicio === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : `${formatearKm(parte.kmInicio)} km` },
      { rotulo: TP.rotulos.novedades, valor: textoNovedadesDelParte(criticas, normales) },
    ],
    avisoCritica: null,
    advertencias: renglonesDeAvisosAceptados(parte),
    // El texto de «fuera de plazo» ya va en la línea (C1).
    fueraDePlazo: null,
    notaEncargado: normales.length > 0 ? TP.encargadoLaVe : null,
    parrafo: esHoy ? TP.alTerminarVuelva : TP.faltaCerrarJornadaPasada,
    completarCierre: { texto: esHoy ? TP.completarCierreAhora : TP.completarCierre, href, primario: !esHoy },
    volverAlInicio,
  };
}

/** C2: el panel «La unidad no puede salir» (la revisión informó una novedad crítica y el parte quedó cerrado sin uso). */
export function panelDeSinSalida(estado: Estado, entrada: Parte, perfil: Perfil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas } = novedadesPorGravedad(parte);
  return {
    variante: "sin-salida",
    titulo: TP.tituloSinSalida,
    linea: textoLineaSinSalida(horaDe(parte.revisado), criticas),
    filas: [],
    avisoCritica: textoUnidadQuedoFueraDeServicio(patente),
    advertencias: renglonesDeAvisosAceptados(parte),
    fueraDePlazo: null,
    notaEncargado: null,
    parrafo: perfil.tipo === "conductor" ? TP.siTieneQueSalir : TP.siTieneQueSalirEncargado,
    completarCierre: null,
    volverAlInicio,
  };
}

function lecturaDe(estado: Estado, unidad: Unidad, parte: Parte, perfil: Perfil): ParteEnLectura {
  const revision = revisionEnLectura(parte);
  const momentos: ParteEnLectura["momentos"] = [];
  const horaRevision = horaDe(parte.revisado);
  const horaCierre = parte.sinSalida ? null : horaDe(parte.enviado);
  if (horaRevision !== null) momentos.push({ rotulo: TP.rotulos.revision, valor: horaRevision });
  if (horaCierre !== null) momentos.push({ rotulo: TP.rotulos.cierre, valor: horaCierre });
  return {
    tipo: "lectura",
    titulo: nombreDePantalla({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha }),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    conductor: estado.conductores.find((c) => c.id === parte.conductorId)?.nombre ?? null,
    etiqueta: TI.enviado,
    momentos,
    sinSalida: parte.sinSalida,
    panel: panelDeParteEnviado(estado, parte, perfil),
    puntosEnOrden: revision.puntosEnOrden,
    novedades: revision.novedades,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}

/** Cuándo se guardó el borrador que se retoma; sin un instante legible, solo «Borrador recuperado.» */
function borradorRecuperado(p: Parte): { mensaje: string } {
  const hora = horaDe(p.actualizado === "" ? null : p.actualizado);
  if (hora === null) return { mensaje: TEXTO_GUARDADO.recuperadoSinFecha };
  return { mensaje: TEXTO_GUARDADO.recuperado(formatearFecha(fechaEnArgentina(p.actualizado)), hora) };
}

/** Por qué no se puede cargar un parte nuevo o seguir uno empezado (P8 y P2, en el orden en que los revisa el comando); `null` si se puede. */
function motivoDeBloqueo(unidad: Unidad, fecha: FechaCivil, hoy: FechaCivil): string | null {
  const e = unidad.estado;
  if (e.tipo === "baja") return errUnidadDeBaja(formatearPatente(unidad.patente), e.desde);
  if (e.tipo === "fuera-de-servicio") return errUnidadFueraDeServicio(e.desde, e.motivo);
  const f = validarFechaParte(fecha, hoy);
  return f.ok ? null : f.error.mensaje;
}

/**
 * El parte de `#/parte/ZK214BD/2026-11-18` (6.5) para el estado de la aplicación: para completar, ya enviado (lectura) o el motivo por el que no se puede cargar. `null` fuera de esa ruta o
 * antes de terminar el arranque. Se llama dentro de un `$derived` de la pantalla: se recalcula con cada cambio de datos (cada autoguardado también): `valoresIniciales` es solo para ARRANCAR
 * el formulario, no se vuelve a leer.
 */
export function leerParte(app: LecturaDeApp): VistaDeParte | null {
  const ruta = app.ruta;
  if (ruta.tipo !== "parte" || app.estado === null) return null;
  return vistaDeParte(app.estado, app.hoy, app.perfil, ruta.patente, ruta.fecha);
}

/**
 * Lo que muestra `#/parte/ZK214BD/2026-11-18`: la revisión para completar (sin parte o borrador), el cierre (en uso), el parte ya cerrado (lectura), o el motivo por el
 * que no se puede cargar. Un parte cerrado se ve siempre en lectura, sin importar la fecha ni el estado de la unidad (P7, A7). Con el perfil Conductor, una licencia
 * que no ampara la fecha del parte también es «No se puede cargar» (L1); con el perfil Encargado el formulario se muestra y el error llega al enviar.
 */
export function vistaDeParte(estado: Estado, hoy: FechaCivil, perfil: Perfil, patente: string, fecha: FechaCivil): VistaDeParte {
  const unidad = estado.unidades.find((u) => u.patente === patente);
  if (unidad === undefined) {
    return { tipo: "no-encontrada", titulo: "No se encontró la unidad", mensaje: textoUnidadNoEncontrada(formatearPatente(patente)), enlace: enlaceAlInicio(perfil) };
  }
  const existente = parteDe(estado, unidad.id, fecha);
  if (existente?.estado === "enviado") return lecturaDe(estado, unidad, existente, perfil);

  const noDisponible = (mensaje: string, nota: string | null = null, conBorrador = true): ParteNoDisponible => ({
    tipo: "no-disponible",
    titulo: TP.noDisponible,
    mensaje,
    nota,
    borrador: existente === undefined || !conBorrador ? null : { parteId: existente.id, descartar: TP.descartar },
    enlace: enlaceAlInicio(perfil),
    cerrarAntes: null,
  });

  // Un parte en uso: el cierre. Con la unidad de baja no se puede (A7) y no hay nada que descartar (P7).
  if (existente?.estado === "en-uso") {
    const e = unidad.estado;
    if (e.tipo === "baja") return noDisponible(errUnidadDeBaja(formatearPatente(unidad.patente), e.desde), null, false);
    return cierreDe(estado, unidad, existente, perfil, fecha);
  }

  const bloqueo = motivoDeBloqueo(unidad, fecha, hoy);
  if (bloqueo !== null) return noDisponible(bloqueo);

  // L1: el conductor del perfil sin licencia vigente para la fecha del parte.
  if (perfil.tipo === "conductor") {
    const licencia = estadoDeLicencia(estado.documentos, perfil.conductorId, fecha);
    if (!licencia.vigente) return noDisponible(textoLicenciaDelConductorNoAmpara(fecha, licencia), existente !== undefined && fecha === hoy ? TEXTO_BORRADOR_CONSERVADO : null);
  }

  // P21: la documentación de la unidad a la fecha del parte (M1). Vale para los dos perfiles: es un hecho sobre la unidad, no sobre quién completa. Si además la licencia bloquea,
  // gana la licencia (arriba, perfil Conductor); con el perfil Encargado la licencia llega al enviar.
  const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
  const sinPapeles = proyecto === undefined ? null : documentacionQueBloquea({ fecha, unidad, proyecto, documentos: estado.documentos });
  if (sinPapeles !== null) {
    return noDisponible(errDocumentacionDeLaUnidad(sinPapeles.documentos, sinPapeles.contexto, perfil.tipo === "conductor"), existente !== undefined && fecha === hoy ? TEXTO_BORRADOR_CONSERVADO_POR_DOCUMENTACION : null);
  }

  // «Cerrar antes»: un parte anterior de la unidad en uso (P18) o, con el perfil Conductor, uno suyo en otra unidad (P20): primero hay que cerrarlo. Si además la licencia
  // bloquea, gana la licencia (arriba). Con el perfil Encargado el conductor se elige en el formulario y P20 llega al enviar.
  const legibles = { partes: estado.partes.flatMap((p) => parteLegible(p) ?? []), unidades: estado.unidades };
  const sinCerrar =
    partePendienteDeCierre(legibles.partes, unidad.id, fecha) ?? (perfil.tipo === "conductor" ? parteEnUsoDelConductor(legibles, perfil.conductorId, unidad.id) : undefined);
  const deLaUnidad = sinCerrar === undefined ? undefined : estado.unidades.find((u) => u.id === sinCerrar.unidadId);
  if (sinCerrar !== undefined && deLaUnidad !== undefined) {
    const renglon1 = textoParteSinCerrarDeLaUnidad(formatearPatente(deLaUnidad.patente), sinCerrar.fecha, hoy);
    const renglon2 = textoCerrarAntesDeLaRevision(fecha);
    const primario = { texto: TEXTO_CERRAR_ANTES.primario, href: hrefDelParte(deLaUnidad, sinCerrar.fecha) };
    return { ...noDisponible(`${renglon1} ${renglon2}`, existente === undefined ? null : TEXTO_CERRAR_ANTES.borradorEnPantalla(fecha)), cerrarAntes: { renglon1, renglon2, primario } };
  }

  const previo = registroAnterior(unidad.id, fecha, estado.partes, estado.correccionesKm);

  // El conductor del parte: quien lo completa (perfil Conductor), o el del borrador / el asignado con licencia vigente (perfil Encargado, P13).
  const activos = new Set(estado.conductores.filter((c) => c.activo).map((c) => c.id));
  const delPerfil = conductorParaParte(perfil, unidad, estado.documentos, fecha);
  const asignado = delPerfil !== null && activos.has(delPerfil) ? delPerfil : null;
  const conductorId = perfil.tipo === "conductor" ? perfil.conductorId : (existente?.conductorId ?? asignado);

  const valores = existente === undefined ? valoresIniciales({ conductorId }) : { ...valoresDeParte(existente), conductorId: conductorId ?? "" };

  let conductor: ParteEnEdicion["conductor"];
  if (perfil.tipo === "conductor") {
    conductor = { tipo: "fijo", id: perfil.conductorId, nombre: estado.conductores.find((c) => c.id === perfil.conductorId)?.nombre ?? "" };
  } else {
    const lista = opcionesDeConductor(estado, { conservarId: existente?.conductorId ?? null, licencia: { fecha, documentos: estado.documentos } });
    conductor = {
      tipo: "elegir",
      etiqueta: TP.conductorEtiqueta,
      opciones: lista.map((o, i) => {
        const sinElegir = i === 0;
        const etiqueta = sinElegir ? TP.conductorSinElegir : o.etiqueta;
        return { ...o, etiqueta, textoDeOpcion: sinElegir ? etiqueta : textoOpcionDeConductor(etiqueta, o.asignadoA, !o.licenciaVigente) };
      }),
    };
  }

  const aviso = unidad.estado.tipo === "en-servicio" ? textoDeNoPuedeSalir(estado, unidad, hoy, perfil.tipo === "conductor") : null;
  return {
    tipo: "edicion",
    paso: "revision",
    titulo: TP.tituloRevision,
    contexto: TP.contexto(diaConFecha(fecha), 1),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    fecha,
    avisoFueraDePlazo: fecha < hoy ? TEXTO_FORMULARIO_PARTE.fueraDePlazo(fecha) : null,
    avisoAptitud: aviso,
    parteId: existente?.id ?? null,
    borrador: existente === undefined ? null : borradorRecuperado(existente),
    conductor,
    valoresIniciales: valores,
    ayudaKmInicio: previo === null ? TEXTO_FORMULARIO_PARTE.ayudaPrimerRegistro : textoUltimoRegistro(kmDeRegistro(previo), describirRegistro(previo)),
    ayudaKmFin: TEXTO_FORMULARIO_PARTE.ayudaKmFin,
    ayudaLitros: TEXTO_FORMULARIO_PARTE.ayudaLitros,
    puntos: ITEMS_CHECKLIST.map((i) => ({ id: i.id, texto: i.texto, critico: i.critico, notaCritica: i.critico ? TEXTO_PARTE.puntoCritico : null })),
    etiquetaImpideUso: TP.impideUso,
    etiquetaOtraNovedad: TP.otraNovedad,
    combustible: OPCIONES_COMBUSTIBLE,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}

function cierreDe(estado: Estado, unidad: Unidad, parte: Parte, perfil: Perfil, fecha: FechaCivil): ParteEnCierre {
  const revision = revisionEnLectura(parte);
  const nombresNovedades = novedadesDelParte(parte).map((n) => nombreDelPunto(n.item));
  const quien = perfil.tipo === "encargado" ? (estado.conductores.find((c) => c.id === parte.conductorId)?.nombre ?? null) : null;
  const guardado = parte.kmFin !== null || parte.combustible !== null || parte.litrosCargados !== null;
  return {
    tipo: "cierre",
    paso: "cierre",
    titulo: TP.tituloCierre,
    contexto: TP.contexto(diaConFecha(fecha), 2),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    fecha,
    parteId: parte.id,
    resumen: { linea: textoResumenDeLaRevision(horaDe(parte.revisado), parte.kmInicio, nombresNovedades, quien), verLaRevision: TP.verLaRevision, revision },
    kmInicioTexto: parte.kmInicio === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : `${formatearKm(parte.kmInicio)} km`,
    valoresIniciales: valoresDeParte(parte),
    borrador: guardado ? borradorRecuperado(parte) : null,
    ayudaKmFin: TEXTO_FORMULARIO_PARTE.ayudaKmFin,
    ayudaLitros: TEXTO_FORMULARIO_PARTE.ayudaLitros,
    combustible: OPCIONES_COMBUSTIBLE,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}
