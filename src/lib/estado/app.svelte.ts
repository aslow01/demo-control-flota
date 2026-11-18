// Estado reactivo de la aplicación (Svelte 5, runes). Une el dominio (puro), el repositorio, el reloj, la barra de
// direcciones y el aviso entre pestañas. Las pantallas LEEN de acá y llaman a sus métodos; no hay reglas de negocio
// en este archivo: las reglas siguen en `src/lib/dominio`.
//
// Decisiones:
// - El estado completo vive en `$state.raw`: se reemplaza entero con cada comando (el dominio es inmutable), así no
//   se pagan proxies sobre miles de registros y nunca se le pasa un proxy al repositorio (structuredClone falla con ellos).
// - Escribir primero, aplicar después (D10): el estado en memoria cambia solo si el repositorio confirmó la escritura.
// - Los comandos se hacen de a uno (cola de promesas): un doble clic no puede aplicar dos veces sobre el mismo estado viejo.
// - Todo lo que toca el navegador entra por `DependenciasApp`, así esto se prueba en Node con dobles.

import { EMPRESA, ENCARGADA } from "../datos/generador.ts";
import { calcularAlertas, type ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud } from "../dominio/aptitud.ts";
import { ejecutar as ejecutarComando, type Comando, type Ejecucion } from "../dominio/comandos.ts";
import {
  comandoDeCargar,
  comandoDeCargarOtro,
  comandoDeCorregir,
  comandoDeRenovar,
  errorGeneral,
  errorGeneralCargarOtro,
  erroresDeNegocio,
  erroresDeNegocioCargarOtro,
  etiquetaDeTitular,
  validarCargarOtro,
  validarValores,
  type CampoCargarOtro,
  type ErroresDeFormulario,
  type ValoresCargarOtro,
  type ValoresDocumento,
} from "../dominio/formulario-documento.ts";
import { errorGeneralEn, type ErroresDeFormularioDe } from "../dominio/formulario.ts";
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
import {
  comandoDeCargarNovedad,
  comandoDeResolver,
  erroresDeNegocioCargarNovedad,
  erroresDeNegocioResolver,
  errorGeneralCargarNovedad,
  errorGeneralResolver,
  validarCargarNovedad,
  validarResolver,
  type CampoCargarNovedad,
  type CampoResolver,
  type ValoresCargarNovedad,
  type ValoresResolver,
} from "../dominio/formulario-novedad.ts";
import { rotuloNovedad } from "../dominio/novedades.ts";
import {
  comandoDeAgregarUnidad,
  erroresDeNegocioUnidad,
  errorGeneralUnidad,
  validarValoresUnidad,
  type ErroresDeFormularioUnidad,
  type ValoresUnidad,
} from "../dominio/formulario-unidad.ts";
import {
  ERRORES,
  TEXTO_ERROR_ARRANQUE,
  textoAsignacionCambiada,
  textoDocumentoCargado,
  textoDocumentoCorregido,
  textoDocumentoRenovado,
  textoDocumentoRenovadoEnFicha,
  textoFueraDeServicio,
  textoKmCorregido,
  textoNovedadCargada,
  textoNovedadResuelta,
  textoQuedanVencimientos,
  textoUnidadAgregada,
  textoUnidadDadaDeBaja,
  textoVueltaAServicio,
} from "../dominio/textos.ts";
import { fallo, ok, type ErrorDeNegocio, type Estado, type FechaCivil, type Perfil, type Resultado, type TipoDocumento, type Titular } from "../dominio/tipos.ts";
import { arrancar, cambiarPerfil as guardarPerfil, reiniciarDemo, type Aviso } from "../persistencia/arranque.ts";
import { avisoEntrePestanas, type AvisoEntrePestanas } from "../persistencia/pestanas.ts";
import type { Repositorio } from "../persistencia/repositorio.ts";
import { centroDeAlertas, contarVencimientos, type CentroDeAlertas } from "./centro-alertas.ts";
import { aHash, nombreDePantalla, resolverRuta, rutaPorDefecto, tituloDePagina, type Ruta } from "./enrutador.ts";
import { fichaDeUnidad as armarFicha, type FichaDeUnidad, type FichaNoEncontrada } from "./ficha.ts";
import { panelDeFlota, type PanelFlota } from "./flota.ts";
import { generarId } from "./ids.ts";
import type { Reloj } from "./reloj.ts";
import type { Ubicacion } from "./ubicacion.ts";

export interface DependenciasApp {
  reloj: Reloj;
  /** Abre el almacenamiento (en el navegador, IndexedDB). Si rechaza, la demo sigue en memoria (D8). */
  abrirAlmacenamiento: () => Promise<Repositorio>;
  ubicacion: Ubicacion;
  /** Por defecto, el BroadcastChannel del navegador. */
  crearAvisoPestanas?: (alRecibir: () => void) => AvisoEntrePestanas;
  /** Por defecto, `generarId`. */
  nuevoId?: () => string;
  semilla?: number;
  umbralPreparandoMs?: number;
  /** Cuánto se espera a que abra el almacenamiento antes de seguir en memoria (D8). Por defecto, 8 s. */
  plazoAbrirMs?: number;
}

export type FaseApp = "arrancando" | "lista" | "error";

/**
 * Resultado de guardar desde un diálogo de documento. Con `ok: false` el diálogo no se cierra y muestra `errores`; el texto
 * escrito se conserva. Con `ok: true`, `mensaje` va a la barra de estado del panel y `foco` dice dónde cae el foco al cerrar:
 * la fila que abrió el diálogo ya no existe (la alerta se resolvió o cambió de documento), así que va al título del panel (5.17).
 */
export type ResultadoGuardadoDocumento =
  | { ok: true; mensaje: string; foco: "titulo-del-panel" | "titulo-de-documentos" }
  | { ok: false; errores: ErroresDeFormulario };

/** Desde dónde se guarda: la alerta del centro de alertas (4.2) o la ficha de la unidad (4.4). Cambia el mensaje y adónde cae el foco. */
export type DondeSeGuarda = "centro" | "ficha";

/**
 * Dónde cae el foco al cerrar un diálogo (5.17): la fila o el botón que lo abrió puede haber cambiado o desaparecido, así que va al título de
 * lo que cambió. `titulo-del-panel` es el del centro de alertas (4.2); los demás son de la ficha (4.4).
 */
export type FocoTrasGuardar =
  | "titulo-del-panel"
  | "titulo-de-la-ficha"
  | "titulo-de-documentos"
  | "titulo-de-novedades"
  | "titulo-de-kilometraje";

/**
 * Resultado de guardar desde un diálogo de la ficha (4.4). Con `ok: false` el diálogo no se cierra y muestra `errores` (por campo, en lista para
 * el resumen y uno general); el texto escrito se conserva. Con `ok: true`, `mensaje` va a la barra de estado y `foco` dice adónde va el foco.
 */
export type ResultadoGuardado<Campo extends string> =
  | { ok: true; mensaje: string; foco: FocoTrasGuardar }
  | { ok: false; errores: ErroresDeFormularioDe<Campo> };

/**
 * Resultado de guardar «Agregar unidad». Con `ok: false` el diálogo no se cierra y muestra `errores`; el texto escrito se conserva.
 * Con `ok: true` la unidad ya existe y **la aplicación ya navegó a su ficha** (`ruta` y `href` dicen adónde; el cambio de pantalla ya mueve el foco al
 * título): el diálogo solo tiene que cerrarse. El `mensaje` viaja en `app.mensajeDeLlegada` para que la ficha lo muestre como mensaje inicial.
 */
export type ResultadoAgregarUnidad =
  | { ok: true; mensaje: string; foco: "titulo-de-la-ficha"; href: string; ruta: Ruta }
  | { ok: false; errores: ErroresDeFormularioUnidad };

/** El perfil Conductor solo usa los comandos del parte (docs/diseno.md, sección 8). No es seguridad: es la perspectiva. */
const COMANDOS_DEL_CONDUCTOR: ReadonlySet<Comando["tipo"]> = new Set(["guardarBorrador", "enviarParte", "descartarBorrador"]);

/** Si no se pueden escribir, el mensaje habla del parte ("lo escrito sigue en pantalla; no cierre la pestaña"). */
const COMANDOS_DEL_PARTE_A_GUARDAR: ReadonlySet<Comando["tipo"]> = new Set(["guardarBorrador", "enviarParte"]);

export class EstadoApp {
  fase = $state<FaseApp>("arrancando");
  /** Todo lo que sabe la aplicación; `null` hasta que termina el arranque. Solo lectura desde afuera. */
  estado = $state.raw<Estado | null>(null);
  /** Hoy en Argentina. Se refresca con `actualizarReloj` (al volver a la pestaña, o cada minuto). */
  hoy = $state<FechaCivil>("");
  avisos = $state.raw<Aviso[]>([]);
  /** D8: sin almacenamiento, la demo funciona en memoria. */
  enMemoria = $state(false);
  /** D4: el arranque tarda más del umbral: mostrar "Preparando la flota de ejemplo…". */
  preparando = $state(false);
  /** D9: otra pestaña escribió. Los datos de esta no cambian hasta `actualizar()`. */
  hayCambiosEnOtraPestana = $state(false);
  errorDeArranque = $state<string | null>(null);
  /** Sube cada vez que se llega a otra pantalla: la vista mueve el foco al h1 y el título de la página. */
  versionDePantalla = $state(0);
  /** El hash de la barra de direcciones, tal como está. */
  hash = $state("");

  perfil = $derived<Perfil>(this.estado?.meta.perfil ?? { tipo: "encargado" });
  /** La pantalla que corresponde al hash y al perfil (rutas del conductor y del encargado, redirecciones). */
  ruta = $derived<Ruta>(resolverRuta(this.hash, this.perfil));
  /** El nombre de la pantalla sin el sufijo (para el `h1` y los anuncios); `titulo` es el de `document.title`. */
  nombrePantalla = $derived(nombreDePantalla(this.ruta));
  titulo = $derived(tituloDePagina(this.ruta));
  /** El centro de alertas, recalculado solo cuando cambian los datos o el día. */
  alertas = $derived<ResultadoAlertas | null>(this.estado === null ? null : calcularAlertas(this.estado, this.hoy));
  /** Todo lo que dibuja el centro de alertas (6.1), recalculado con cada cambio; `null` hasta que termina el arranque. */
  centroDeAlertas = $derived<CentroDeAlertas | null>(
    this.estado === null || this.alertas === null ? null : centroDeAlertas(this.estado, this.alertas, this.hoy, EMPRESA.nombre),
  );
  /** Todas las filas de la flota (6.2), recalculadas con cada cambio; la búsqueda, los filtros y el orden son de `vistaDeFlota`. `null` hasta que termina el arranque. */
  panelDeFlota = $derived<PanelFlota | null>(
    this.estado === null || this.alertas === null ? null : panelDeFlota(this.estado, this.alertas, this.hoy),
  );
  /**
   * La ficha de la unidad de `#/unidad/…` (6.3), recalculada con cada cambio de datos y al cambiar el día. `null` fuera de esa ruta o antes de
   * terminar el arranque; con una patente que no existe, `{ encontrada: false, … }` (el estado de error de la pantalla).
   */
  fichaDeUnidad = $derived.by<FichaDeUnidad | FichaNoEncontrada | null>(() => {
    const ruta = this.ruta;
    if (ruta.tipo !== "unidad" || this.estado === null || this.alertas === null) return null;
    return armarFicha(this.estado, this.alertas, this.hoy, ruta.patente, this.perfil);
  });
  /** Se llegó a una ficha desde otra pantalla con algo que decir (hoy, «Unidad agregada…»): patente y mensaje. Se va al salir de esa ficha. */
  private llegada = $state<{ patente: string; mensaje: string } | null>(null);
  /** El mensaje de llegada a la ficha que se está mirando (la barra de estado arranca con él); `null` si no hay. La vista lo reemplaza con los suyos. */
  mensajeDeLlegada = $derived<string | null>(
    this.llegada !== null && this.ruta.tipo === "unidad" && this.ruta.patente === this.llegada.patente ? this.llegada.mensaje : null,
  );
  /** Nombre con el que firman los eventos: el conductor elegido o la encargada. */
  autor = $derived.by(() => {
    const perfil = this.perfil;
    if (perfil.tipo === "conductor") return this.estado?.conductores.find((c) => c.id === perfil.conductorId)?.nombre ?? "Conductor";
    return ENCARGADA;
  });

  private readonly deps: DependenciasApp;
  private repositorio: Repositorio | null = null;
  private pestanas: AvisoEntrePestanas | null = null;
  private dejarDeEscucharUbicacion: (() => void) | null = null;
  private pantallaActual = "";
  private cola: Promise<unknown> = Promise.resolve();

  constructor(deps: DependenciasApp) {
    this.deps = deps;
    this.hash = deps.ubicacion.leerHash();
  }

  // --- Ciclo de vida -------------------------------------------------------------------------------

  /** Abre el almacenamiento, carga o genera el ejemplo y deja la aplicación lista (o en fase "error"). */
  async iniciar(): Promise<void> {
    this.liberar();
    this.fase = "arrancando";
    this.errorDeArranque = null;
    try {
      const momento = this.deps.reloj.momento();
      const opciones = {
        hoy: momento.hoy,
        abrirAlmacenamiento: this.deps.abrirAlmacenamiento,
        alTardar: () => {
          this.preparando = true;
        },
        ...(this.deps.semilla === undefined ? {} : { semilla: this.deps.semilla }),
        ...(this.deps.umbralPreparandoMs === undefined ? {} : { umbralPreparandoMs: this.deps.umbralPreparandoMs }),
        ...(this.deps.plazoAbrirMs === undefined ? {} : { plazoAbrirMs: this.deps.plazoAbrirMs }),
      };
      const r = await arrancar(opciones);
      this.repositorio = r.repositorio;
      this.estado = r.estado;
      this.avisos = r.avisos;
      this.enMemoria = r.enMemoria;
      this.hoy = momento.hoy;
      if (!r.enMemoria) {
        // Sin almacenamiento no hay nada que compartir con otras pestañas (cada una tiene su propia memoria).
        const crear = this.deps.crearAvisoPestanas ?? ((alRecibir) => avisoEntrePestanas({ alRecibir }));
        this.pestanas = crear(() => {
          this.hayCambiosEnOtraPestana = true;
        });
      }
      this.dejarDeEscucharUbicacion = this.deps.ubicacion.alCambiar(() => this.leerUbicacion());
      this.leerUbicacion();
      this.fase = "lista";
    } catch {
      this.fase = "error";
      this.errorDeArranque = TEXTO_ERROR_ARRANQUE.mensaje;
    } finally {
      this.preparando = false;
    }
  }

  /** Deja de escuchar la barra de direcciones y las otras pestañas, y cierra el almacenamiento. */
  cerrar(): void {
    this.liberar();
  }

  private liberar(): void {
    this.dejarDeEscucharUbicacion?.();
    this.dejarDeEscucharUbicacion = null;
    this.pestanas?.cerrar();
    this.pestanas = null;
    this.repositorio?.cerrar?.();
    this.repositorio = null;
  }

  // --- Navegación ----------------------------------------------------------------------------------

  /** Lee la barra de direcciones, deja el hash en su forma canónica y avisa si se llegó a otra pantalla. */
  private leerUbicacion(): void {
    this.hash = this.deps.ubicacion.leerHash();
    const ruta = this.ruta;
    if (ruta.tipo !== "desconocida") {
      const canonico = aHash(ruta);
      if (canonico !== this.hash) {
        this.deps.ubicacion.reemplazarHash(canonico);
        this.hash = canonico;
      }
    }
    const clave = JSON.stringify(ruta);
    if (clave !== this.pantallaActual) {
      this.pantallaActual = clave;
      this.versionDePantalla += 1;
      if (this.llegada !== null && !(ruta.tipo === "unidad" && ruta.patente === this.llegada.patente)) this.llegada = null;
    }
  }

  /** Cambia de pantalla (agrega una entrada al historial). */
  irA(ruta: Ruta): void {
    this.deps.ubicacion.irA(aHash(ruta));
    this.leerUbicacion(); // en el navegador el aviso del cambio llega después: esto es idempotente
  }

  /**
   * Cambia de pantalla SIN agregar una entrada al historial. Es para cuando el cambio no es navegar sino cambiar de perfil: la
   * entrada anterior era de la pantalla del perfil viejo, y con Atrás volvería a un hash que `leerUbicacion` reescribe (el
   * usuario pulsaría Atrás y no pasaría nada).
   */
  private reemplazarPor(ruta: Ruta): void {
    this.deps.ubicacion.reemplazarHash(aHash(ruta));
    this.leerUbicacion();
  }

  // --- Reloj ---------------------------------------------------------------------------------------

  /** Vuelve a leer la hora: si pasó la medianoche de Argentina, "hoy" cambia y las alertas se recalculan (T1). */
  actualizarReloj(): void {
    const { hoy } = this.deps.reloj.momento();
    if (hoy !== this.hoy) this.hoy = hoy;
  }

  // --- Avisos --------------------------------------------------------------------------------------

  descartarAviso(tipo: Aviso["tipo"]): void {
    this.avisos = this.avisos.filter((a) => a.tipo !== tipo);
  }

  // --- Escrituras (de a una) -----------------------------------------------------------------------

  private encolar<T>(trabajo: () => Promise<T>): Promise<T> {
    const resultado = this.cola.then(trabajo);
    this.cola = resultado.catch(() => undefined);
    return resultado;
  }

  /**
   * Ejecuta un comando del dominio: lo valida, lo escribe (cambios y eventos juntos) y recién entonces actualiza el
   * estado. Devuelve el error de negocio con su mensaje, o `escritura-fallida` (D10) sin haber cambiado nada.
   */
  ejecutar(comando: Comando): Promise<Resultado<Ejecucion>> {
    return this.encolar(async () => {
      const estado = this.estado;
      const repositorio = this.repositorio;
      if (estado === null || repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
      if (this.perfil.tipo === "conductor" && !COMANDOS_DEL_CONDUCTOR.has(comando.tipo)) return fallo("sin-permiso", ERRORES.sinPermiso);

      const momento = this.deps.reloj.momento();
      const resultado = ejecutarComando(estado, comando, {
        hoy: momento.hoy,
        ahora: momento.ahora,
        autor: this.autor,
        nuevoId: this.deps.nuevoId ?? generarId,
      });
      if (!resultado.ok) return resultado;
      try {
        await repositorio.escribir(resultado.valor.cambios, resultado.valor.eventos);
      } catch {
        return fallo("escritura-fallida", COMANDOS_DEL_PARTE_A_GUARDAR.has(comando.tipo) ? ERRORES.noPudoGuardarElParte : ERRORES.noPudoGuardar);
      }
      this.estado = resultado.valor.estado;
      this.hoy = momento.hoy;
      this.pestanas?.avisarCambio();
      return resultado;
    });
  }

  // --- Diálogos de documentos (paso 4.2) -----------------------------------------------------------

  /**
   * «Renovar documento»: revisa todos los campos, ejecuta `renovarDocumento` (cambios y evento en una escritura) y actualiza el
   * estado sin recargar. Nunca rechaza: los errores vuelven repartidos por campo (o como error general) para el formulario.
   */
  renovarDocumento(documentoId: string, valores: ValoresDocumento, donde: DondeSeGuarda = "centro"): Promise<ResultadoGuardadoDocumento> {
    return this.guardarDocumento(
      valores,
      comandoDeRenovar(documentoId, valores),
      (despues) => {
        const nuevo = despues.documentos.find((d) => d.reemplazaA === documentoId);
        if (nuevo === undefined) return null;
        const titular = etiquetaDeTitular(despues, nuevo.titular);
        return donde === "ficha" ? textoDocumentoRenovadoEnFicha(nuevo.tipo, titular, nuevo.vence) : textoDocumentoRenovado(nuevo.tipo, titular);
      },
      donde,
    );
  }

  /** «Cargar documento» (un obligatorio que falta, o uno nuevo): igual que `renovarDocumento`. */
  cargarDocumento(titular: Titular, tipoDocumento: TipoDocumento, valores: ValoresDocumento, donde: DondeSeGuarda = "centro"): Promise<ResultadoGuardadoDocumento> {
    return this.guardarDocumento(
      valores,
      comandoDeCargar(titular, tipoDocumento, valores),
      (despues) => textoDocumentoCargado(tipoDocumento, etiquetaDeTitular(despues, titular)),
      donde,
    );
  }

  private async guardarDocumento(
    valores: ValoresDocumento,
    comando: Comando,
    texto: (despues: Estado) => string | null,
    donde: DondeSeGuarda,
  ): Promise<ResultadoGuardadoDocumento> {
    if (this.estado === null) return { ok: false, errores: errorGeneral(ERRORES.sinDatos) };
    const previos = validarValores(valores, this.hoy);
    if (previos !== null) return { ok: false, errores: previos };
    const r = await this.ejecutar(comando);
    if (!r.ok) return { ok: false, errores: erroresDeNegocio(r.error) };
    const hecho = texto(r.valor.estado);
    // En la ficha el mensaje es solo de lo que se hizo; «Quedan N vencimientos» es del centro de alertas (cuenta toda la flota).
    if (donde === "ficha") return { ok: true, mensaje: hecho ?? "", foco: "titulo-de-documentos" };
    const quedan = this.alertas === null ? null : textoQuedanVencimientos(contarVencimientos(this.alertas));
    return { ok: true, mensaje: [hecho, quedan].filter((t) => t !== null).join(" "), foco: "titulo-del-panel" };
  }

  // --- Ficha de unidad y sus diálogos (paso 4.4) ------------------------------------------------------
  //
  // Un método por comando de la sección 8 que se dispara desde la ficha. Todos hacen lo mismo: revisan todos los campos juntos (5.15) con los mismos
  // validadores del dominio, ejecutan el comando (cambios y evento en una escritura, D10) y devuelven `ResultadoGuardado`: nunca rechazan. El
  // perfil Conductor no puede ninguno (error general «sin permiso»).

  /** Lo que tienen en común: sin datos, validación previa, ejecutar y repartir el error o armar el mensaje. */
  private async guardarFormulario<Campo extends string>(a: {
    previos: (estado: Estado) => ErroresDeFormularioDe<Campo> | null;
    comando: Comando;
    errores: (error: ErrorDeNegocio) => ErroresDeFormularioDe<Campo>;
    general: (mensaje: string) => ErroresDeFormularioDe<Campo>;
    exito: (ejecucion: Ejecucion) => { mensaje: string; foco: FocoTrasGuardar };
  }): Promise<ResultadoGuardado<Campo>> {
    if (this.estado === null) return { ok: false, errores: a.general(ERRORES.sinDatos) };
    const previos = a.previos(this.estado);
    if (previos !== null) return { ok: false, errores: previos };
    const r = await this.ejecutar(a.comando);
    if (!r.ok) return { ok: false, errores: a.errores(r.error) };
    return { ok: true, ...a.exito(r.valor) };
  }

  /** `ZK 214 BD` de la unidad, en el estado que se pasa. */
  private patenteDe(estado: Estado, unidadId: string): string {
    return etiquetaDeTitular(estado, { tipo: "unidad", id: unidadId });
  }

  /** «Corregir documento»: el vigente de una unidad o de un conductor, con sus cuatro campos. Es de la ficha (foco al título de Documentos). */
  corregirDocumento(documentoId: string, valores: ValoresDocumento): Promise<ResultadoGuardadoDocumento> {
    return this.guardarDocumento(
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
  cargarOtroDocumento(unidadId: string, valores: ValoresCargarOtro): Promise<ResultadoGuardado<CampoCargarOtro>> {
    return this.guardarFormulario({
      previos: (estado) => validarCargarOtro(valores, estado, unidadId, this.hoy),
      comando: comandoDeCargarOtro(unidadId, valores),
      errores: erroresDeNegocioCargarOtro,
      general: errorGeneralCargarOtro,
      exito: (e) => ({ mensaje: textoDocumentoCargado(valores.tipoDocumento as TipoDocumento, this.patenteDe(e.estado, unidadId)), foco: "titulo-de-documentos" }),
    });
  }

  /**
   * «Resolver novedad» (N1, N2). Con `volverAServicio` marcado (solo si el diálogo lo ofreció) la unidad vuelve en la misma escritura. Desde el
   * centro de alertas (`donde = "centro"`, el valor por defecto) el mensaje nombra la unidad y el foco va al título del panel; desde la ficha, al de Novedades.
   */
  resolverNovedad(novedadId: string, valores: ValoresResolver, donde: DondeSeGuarda = "centro"): Promise<ResultadoGuardado<CampoResolver>> {
    return this.guardarFormulario({
      previos: () => validarResolver(valores),
      comando: comandoDeResolver(novedadId, valores),
      errores: erroresDeNegocioResolver,
      general: errorGeneralResolver,
      exito: (e) => {
        const n = e.estado.novedades.find((x) => x.id === novedadId);
        const patente = n === undefined ? "" : this.patenteDe(e.estado, n.unidadId);
        const volvio = e.eventos.some((ev) => ev.tipo === "vuelta-a-servicio");
        return {
          mensaje: textoNovedadResuelta(n === undefined ? "" : rotuloNovedad(n), patente, volvio, donde === "centro"),
          foco: donde === "centro" ? "titulo-del-panel" : "titulo-de-novedades",
        };
      },
    });
  }

  /** «Cargar novedad» a mano (N3): con «Impide usar la unidad» la unidad queda fuera de servicio (A3). */
  cargarNovedad(unidadId: string, valores: ValoresCargarNovedad): Promise<ResultadoGuardado<CampoCargarNovedad>> {
    return this.guardarFormulario({
      previos: () => validarCargarNovedad(valores),
      comando: comandoDeCargarNovedad(unidadId, valores),
      errores: erroresDeNegocioCargarNovedad,
      general: errorGeneralCargarNovedad,
      exito: (e) => ({ mensaje: textoNovedadCargada(this.patenteDe(e.estado, unidadId), valores.impideUso), foco: "titulo-de-novedades" }),
    });
  }

  /** «Poner fuera de servicio» (A6). */
  ponerFueraDeServicio(unidadId: string, valores: ValoresFueraDeServicio): Promise<ResultadoGuardado<CampoFueraDeServicio>> {
    return this.guardarFormulario({
      previos: () => validarFueraDeServicio(valores),
      comando: comandoDeFueraDeServicio(unidadId, valores),
      errores: erroresDeNegocioFueraDeServicio,
      general: errorGeneralFueraDeServicio,
      exito: (e) => ({ mensaje: textoFueraDeServicio(this.patenteDe(e.estado, unidadId)), foco: "titulo-de-la-ficha" }),
    });
  }

  /**
   * «Volver a servicio» (A4, A5). Con críticas abiertas se rechaza con el error general que las nombra (el diálogo ya lo avisó y no ofrece el botón).
   * Con documentos vencidos o faltantes vuelve igual y el mensaje dice que todavía no puede salir.
   */
  volverAServicio(unidadId: string): Promise<ResultadoGuardado<never>> {
    return this.guardarFormulario<never>({
      previos: () => null,
      comando: comandoDeVolverAServicio(unidadId),
      errores: (error) => errorGeneralEn(error.mensaje),
      general: (mensaje) => errorGeneralEn(mensaje),
      exito: (e) => {
        const u = e.estado.unidades.find((x) => x.id === unidadId);
        const a = u === undefined ? null : aptitud(u, e.estado, this.hoy);
        const pendientes = a === null || a.puedeSalir ? [] : a.motivos.map((m) => m.texto);
        return { mensaje: textoVueltaAServicio(this.patenteDe(e.estado, unidadId), pendientes), foco: "titulo-de-la-ficha" };
      },
    });
  }

  /** «Dar de baja» (A7): irreversible en la demo; conserva documentos, partes e historial. */
  darDeBaja(unidadId: string, valores: ValoresBaja): Promise<ResultadoGuardado<CampoBaja>> {
    return this.guardarFormulario({
      previos: () => validarBaja(valores),
      comando: comandoDeBaja(unidadId, valores),
      errores: erroresDeNegocioBaja,
      general: errorGeneralBaja,
      exito: (e) => ({ mensaje: textoUnidadDadaDeBaja(this.patenteDe(e.estado, unidadId)), foco: "titulo-de-la-ficha" }),
    });
  }

  /** «Corregir kilometraje» (K5, M3). */
  corregirKilometraje(unidadId: string, valores: ValoresKilometraje): Promise<ResultadoGuardado<CampoKilometraje>> {
    return this.guardarFormulario({
      previos: () => validarKilometraje(valores, this.hoy),
      comando: comandoDeKilometraje(unidadId, valores),
      errores: erroresDeNegocioKilometraje,
      general: errorGeneralKilometraje,
      exito: (e) => ({
        mensaje: textoKmCorregido(this.patenteDe(e.estado, unidadId), e.cambios.correccionesKm?.[0]?.kmBase ?? 0),
        foco: "titulo-de-kilometraje",
      }),
    });
  }

  /** «Cambiar proyecto o conductor» (U6): si el proyecto nuevo exige la habilitación y no la tiene, el mensaje lo dice y la alerta ya existe. */
  cambiarAsignacion(unidadId: string, valores: ValoresAsignacion): Promise<ResultadoGuardado<CampoAsignacion>> {
    const antes = this.estado?.unidades.find((u) => u.id === unidadId);
    return this.guardarFormulario({
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
          (this.alertas?.alertas.some((x) => x.tipo === "documento-faltante" && x.unidadId === unidadId && x.tipoDocumento === "habilitacion-proyecto") ?? false);
        return { mensaje: textoAsignacionCambiada(cambio, falta), foco: "titulo-de-la-ficha" };
      },
    });
  }

  // --- Diálogo «Agregar unidad» (paso 4.3) ----------------------------------------------------------

  /**
   * «Agregar unidad»: revisa todos los campos, ejecuta `altaUnidad` (la unidad y su evento en una escritura) y actualiza el estado sin
   * recargar. La unidad nace en servicio y sin documentos (U5): aparece al instante en el centro de alertas y en la flota con sus
   * faltantes. Nunca rechaza: los errores vuelven repartidos por campo (o como error general) para el formulario.
   */
  async agregarUnidad(valores: ValoresUnidad): Promise<ResultadoAgregarUnidad> {
    if (this.estado === null) return { ok: false, errores: errorGeneralUnidad(ERRORES.sinDatos) };
    const previos = validarValoresUnidad(valores, this.estado, this.hoy);
    if (previos !== null) return { ok: false, errores: previos };
    const r = await this.ejecutar(comandoDeAgregarUnidad(valores));
    if (!r.ok) return { ok: false, errores: erroresDeNegocioUnidad(r.error) };
    const nueva = r.valor.cambios.unidades?.[0];
    if (nueva === undefined) return { ok: false, errores: errorGeneralUnidad(ERRORES.noPudoGuardar) }; // no pasa: altaUnidad siempre crea una
    const faltantes = this.alertas?.alertas.filter((a) => a.tipo === "documento-faltante" && a.unidadId === nueva.id).length ?? 0;
    const ruta: Ruta = { tipo: "unidad", patente: nueva.patente };
    const mensaje = textoUnidadAgregada(faltantes);
    // La unidad ya existe: se va a su ficha (donde están los faltantes, con su botón «Cargar») y el mensaje viaja en `mensajeDeLlegada`.
    this.llegada = { patente: nueva.patente, mensaje };
    this.irA(ruta);
    return { ok: true, mensaje, foco: "titulo-de-la-ficha", href: aHash(ruta), ruta };
  }

  /** D6 y D11: elige el perfil, lo guarda sin marcar la demo como modificada y va al inicio de ese perfil. */
  cambiarPerfil(perfil: Perfil): Promise<Resultado<null>> {
    return this.encolar(async () => {
      const estado = this.estado;
      const repositorio = this.repositorio;
      if (estado === null || repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
      // D6: se guarda el `meta` de esta pestaña; si otra escribió después, se pisarían sus datos. Primero hay que `actualizar()`.
      if (this.hayCambiosEnOtraPestana) return fallo("cambios-en-otra-pestana", ERRORES.cambiosEnOtraPestana);
      if (perfil.tipo === "conductor" && !estado.conductores.some((c) => c.id === perfil.conductorId)) {
        return fallo("conductor-inexistente", ERRORES.conductorInexistente);
      }
      try {
        this.estado = await guardarPerfil(repositorio, estado, perfil);
      } catch {
        return fallo("escritura-fallida", ERRORES.noPudoCambiarVista);
      }
      this.pestanas?.avisarCambio();
      this.reemplazarPor(rutaPorDefecto(perfil));
      return ok(null);
    });
  }

  /**
   * D6: "Reiniciar demo". Una sola escritura; si falla queda lo de antes y se informa (`noPudoReiniciar`). Sin estado cargado
   * (arranque en curso o fase "error") devuelve `sin-datos`: la fase "error" no se arregla borrando datos guardados (ver
   * docs/diseno.md), la salida es recargar la página.
   */
  reiniciar(): Promise<Resultado<null>> {
    return this.encolar(async () => {
      const estado = this.estado;
      const repositorio = this.repositorio;
      if (estado === null || repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
      try {
        const momento = this.deps.reloj.momento();
        this.estado = await reiniciarDemo(repositorio, estado, momento.hoy);
        this.hoy = momento.hoy;
      } catch {
        return fallo("escritura-fallida", ERRORES.noPudoReiniciar);
      }
      this.avisos = this.avisos.filter((a) => a.tipo === "sin-almacenamiento");
      this.hayCambiosEnOtraPestana = false;
      this.pestanas?.avisarCambio();
      this.irA(rutaPorDefecto(this.perfil));
      return ok(null);
    });
  }

  /** D9: "Actualizar": lee del almacenamiento lo que escribió la otra pestaña. */
  actualizar(): Promise<Resultado<null>> {
    return this.encolar(async () => {
      const repositorio = this.repositorio;
      if (repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
      let nuevo: Estado | null;
      try {
        nuevo = await repositorio.cargar();
      } catch {
        return fallo("lectura-fallida", ERRORES.noPudoActualizar);
      }
      if (nuevo === null) return fallo("lectura-fallida", ERRORES.noPudoActualizar);
      this.estado = nuevo;
      this.hayCambiosEnOtraPestana = false;
      this.leerUbicacion(); // el perfil o los datos pudieron cambiar: puede haber que redirigir
      return ok(null);
    });
  }
}
