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

import { EMPRESA, ENCARGADA } from "../datos/constantes.ts";
import { bajar, ErrorDeDescarga, esVersionNueva, PLAZO_DE_DESCARGA_MS } from "../descarga.ts";
import { calcularAlertas, type ResultadoAlertas } from "../dominio/alertas.ts";
import type { Comando, Contexto, Ejecucion } from "../dominio/comandos.ts";
import { comandoDeCargar, comandoDeRenovar, errorGeneral, erroresDeNegocio, etiquetaDeTitular, validarValores, type CampoCargarOtro, type CampoDocumento, type ValoresCargarOtro, type ValoresDocumento } from "../dominio/formulario-documento.ts";
import { errorGeneralEn, type ErroresDeFormularioDe } from "../dominio/formulario.ts";
import type { CampoAsignacion, CampoBaja, CampoFueraDeServicio, CampoKilometraje, ValoresAsignacion, ValoresBaja, ValoresFueraDeServicio, ValoresKilometraje } from "../dominio/formulario-ficha.ts";
import type { CampoParte, ValoresParte } from "../dominio/formulario-parte-valores.ts";
import type { ErroresDeParte } from "../dominio/formulario-parte.ts";
import { unidadSinSalidaHoy } from "../dominio/parte.ts";
import { comandoDeResolver, erroresDeNegocioResolver, errorGeneralResolver, validarResolver, type CampoCargarNovedad, type CampoResolver, type ValoresCargarNovedad, type ValoresResolver } from "../dominio/formulario-novedad.ts";
import { rotuloNovedad } from "../dominio/novedades.ts";
import {
  comandoDeAgregarUnidad,
  erroresDeNegocioUnidad,
  errorGeneralUnidad,
  validarValoresUnidad,
  type ErroresDeFormularioUnidad,
  type ValoresUnidad,
} from "../dominio/formulario-unidad.ts";
import { ERRORES, ERRORES_PESTANAS, TEXTO_ERROR_ARRANQUE, TEXTO_ERROR_DESCARGA, TITULOS_DE_ERROR_DEL_PARTE } from "../dominio/textos-base.ts";
import { textoDocumentoCargado, textoDocumentoRenovado, textoDocumentoRenovadoEnFicha, textoNovedadResuelta, textoQuedanVencimientos } from "../dominio/textos-inicio.ts";
import { textoUnidadAgregada } from "../dominio/textos-flota.ts";
import { fallo, ok, type Advertencia, type ErrorDeNegocio, type Estado, type FechaCivil, type Perfil, type Resultado, type TipoDocumento, type Titular } from "../dominio/tipos.ts";
import { arrancar, cambiarPerfil as guardarPerfil, partesLegibles, reiniciarDemo, type Aviso, type CargarGenerador } from "../persistencia/arranque.ts";
import { avisoEntrePestanas, type AvisoEntrePestanas } from "../persistencia/pestanas.ts";
import { RepositorioMemoria } from "../persistencia/memoria.ts";
import { ErrorDeRepositorio, type Repositorio } from "../persistencia/repositorio.ts";
import type { ResultadoDeBorrador } from "./autoguardado.ts";
import { opcionesParaElegirConductor, type OpcionParaElegirConductor } from "./conductor-opciones.ts";
import { centroDeAlertas, contarVencimientos, type CentroDeAlertas } from "./centro-alertas.ts";
import { aHash, claveConsulta, clavePantalla, nombreDePantalla, resolverRuta, rutaPadre, rutaPorDefecto, tituloDePagina, type Ruta } from "./enrutador.ts";
import { generarId } from "./ids.ts";
import type { PanelParteEnviado } from "./parte.ts";
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
  /** De dónde se bajan los trozos de escritura. Por defecto, `import()`; las pruebas pasan los suyos (por ejemplo, uno que falla como si no hubiera red). */
  trozos?: Partial<TrozosDeEscritura>;
  /** De dónde se baja el generador de datos (arranque y «Reiniciar demo»). Por defecto, su `import()`. */
  cargarGenerador?: CargarGenerador;
  /** Cuánto se espera a que baje el generador o un trozo de escritura antes de darlo por perdido. Por defecto, `PLAZO_DE_DESCARGA_MS`. */
  plazoDescargaMs?: number;
}

export type FaseApp = "arrancando" | "lista" | "error";

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

/** Una advertencia que hay que aceptar antes de enviar (K6, K7): el diálogo «Antes de enviar» las lista; el tono es siempre semana. */
export interface AdvertenciaDeEnvio {
  tipo: Advertencia["tipo"];
  texto: string;
  tono: "semana";
}

/**
 * Resultado de «Enviar revisión» y de «Cerrar el parte» (sección 17). Nunca rechaza.
 * - `enviado`: salió. `paso` dice cuál de los tres resultados es: `revision-enviada` (C1: el parte quedó en uso), `sin-salida` (C2: una novedad crítica cerró el parte sin salida) o
 *   `cerrado` (C3). `panel` es el panel de resultado (el `h1` recibe el foco: `foco`). `yaEnviado` es `true` si ya estaba hecho (doble clic, otra pestaña): no se hizo nada y se
 *   devuelve el mismo panel.
 * - `errores`: faltan datos o falla una regla (P4, K2 a K4, P2, P8, escritura): resumen de errores arriba del formulario con el foco (`foco`) y enlaces a cada campo.
 *   Lo escrito se guardó como borrador (si se podía): no se pierde.
 * - `advertencias`: el parte está completo pero hay que aceptar algo (K6, K7): abrir «Antes de enviar». Al elegir «Enviar de todos modos» (o «Cerrar de todos modos») se vuelve a llamar con
 *   `aceptables` como `aceptadas`.
 */
export type ResultadoDeEnvio =
  | { tipo: "enviado"; paso: "revision-enviada" | "sin-salida" | "cerrado"; yaEnviado: boolean; panel: PanelParteEnviado; foco: "titulo-del-parte-enviado" }
  | { tipo: "errores"; errores: ErroresDeParte; foco: "resumen-de-errores"; primerCampo: CampoParte | null }
  | { tipo: "advertencias"; advertencias: AdvertenciaDeEnvio[]; aceptables: Advertencia["tipo"][]; foco: "dialogo-antes-de-enviar" };

/** Resultado de descartar un borrador: el mensaje va a la barra de estado de la pantalla (o es el error). */
export type ResultadoDeDescarte = { ok: true; mensaje: string } | { ok: false; mensaje: string; errores: ErroresDeParte };

/** El perfil Conductor solo usa los comandos del parte (docs/diseno.md, sección 8). No es seguridad: es la perspectiva. */
const COMANDOS_DEL_CONDUCTOR: ReadonlySet<Comando["tipo"]> = new Set(["guardarBorrador", "enviarRevision", "guardarCierre", "enviarCierre", "descartarBorrador"]);

/** Si no se pueden escribir, el mensaje habla del parte ("lo escrito sigue en pantalla; no cierre la pestaña"). */
const COMANDOS_DEL_PARTE_A_GUARDAR: ReadonlySet<Comando["tipo"]> = new Set(["guardarBorrador", "enviarRevision", "guardarCierre", "enviarCierre"]);

/**
 * Lo que sirve para escribir no viaja con el marco: se baja la primera vez que se escribe (los comandos del dominio) o la primera vez que se guarda desde la ficha o el parte
 * (`ficha-escritura.ts`, `parte-escritura.ts`). Cada trozo se pide con `import()`; si no baja (sin red, sin respuesta o ya inexistente), la escritura contesta «No se pudo guardar»
 * como cualquier otra que falla (D10), sin rechazar y con lo escrito en su lugar.
 */
export interface ModulosDeEscritura {
  comandos: typeof import("../dominio/comandos.ts");
  ficha: typeof import("./ficha-escritura.ts");
  parte: typeof import("./parte-escritura.ts");
}

export type TrozosDeEscritura = { [K in keyof ModulosDeEscritura]: () => Promise<ModulosDeEscritura[K]> };

const TROZOS: TrozosDeEscritura = {
  comandos: () => import("../dominio/comandos.ts"),
  ficha: () => import("./ficha-escritura.ts"),
  parte: () => import("./parte-escritura.ts"),
};

/** El texto de una escritura que no pudo bajar su trozo: el de siempre (sin red, sin respuesta) o, si el trozo ya no existe en el servidor, el de la versión nueva. */
function textoDeEscrituraSinTrozo(error: unknown, siempre: string): string {
  return esVersionNueva(error) ? ERRORES.noPudoGuardarPorVersionNueva : siempre;
}

/** Lo que contestan las escrituras del parte cuando no se pudo bajar su trozo (el resumen de errores con el foco, sin ningún campo señalado). */
function errorDeParteSinTrozo(error: unknown, titulo: string): ErroresDeParte {
  return { ...errorGeneralEn<CampoParte>(textoDeEscrituraSinTrozo(error, ERRORES.noPudoGuardarElParte)), titulo };
}

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
  /** Cuántas veces se frenó una escritura por lo de arriba. La pantalla lo usa para llevar la vista al aviso («Actualizar»), que puede estar fuera de la vista (QA E5, M5). */
  bloqueosPorOtraPestana = $state(0);
  errorDeArranque = $state<string | null>(null);
  /**
   * Sube cada vez que se llega a otra pantalla (`clavePantalla`: tipo, patente, fecha o solapa): la vista mueve el foco al h1 y sube la página.
   * NO sube con un cambio de filtro o de búsqueda (R3): esos son de `versionDeConsulta`.
   */
  versionDePantalla = $state(0);
  /** Sube cada vez que cambia la consulta de la ruta (`?filtro=`, `&q=`: `claveConsulta`), en la misma pantalla o al llegar a otra. No mueve el foco ni el desplazamiento. */
  versionDeConsulta = $state(0);
  /** El hash de la barra de direcciones, tal como está. */
  hash = $state("");

  perfil = $derived<Perfil>(this.estado?.meta.perfil ?? { tipo: "encargado" });
  /** La pantalla que corresponde al hash y al perfil (rutas del conductor y del encargado, redirecciones; `#/parte/PATENTE` es el de hoy). */
  ruta = $derived<Ruta>(resolverRuta(this.hash, this.perfil, this.hoy));
  /** La última Movilidades vista (con su filtro y búsqueda) mientras se pasa por una ficha; se olvida al ir a cualquier otra pantalla. */
  private movilidades = $state.raw<Ruta | null>(null);
  /**
   * A dónde lleva «Atrás» (y la miga anterior) cuando no hay historia dentro de la aplicación; `null` en las pantallas raíz. La ficha vuelve a Movilidades
   * con el filtro y la búsqueda que tenía al salir de ahí.
   */
  padre = $derived<Ruta | null>(this.ruta.tipo === "unidad" && this.movilidades !== null ? this.movilidades : rutaPadre(this.ruta, this.perfil));
  /** El nombre de la pantalla sin el sufijo (para el `h1` y los anuncios); `titulo` es el de `document.title`. */
  nombrePantalla = $derived(nombreDePantalla(this.ruta));
  titulo = $derived(tituloDePagina(this.ruta));
  /** El centro de alertas, recalculado solo cuando cambian los datos o el día. */
  alertas = $derived<ResultadoAlertas | null>(this.estado === null ? null : calcularAlertas(this.estado, this.hoy));
  /** Todo lo que dibuja el centro de alertas (6.1), recalculado con cada cambio; `null` hasta que termina el arranque. */
  centroDeAlertas = $derived<CentroDeAlertas | null>(
    this.estado === null || this.alertas === null ? null : centroDeAlertas(this.estado, this.alertas, this.hoy, EMPRESA.nombre),
  );
  // La flota (6.2), la ficha (6.3), el parte (6.5) y las pantallas del conductor (6.4) las arman sus propios módulos, que se bajan con su pantalla: `leerPanelDeFlota(app)` (estado/flota.ts),
  // `leerFicha(app)` (estado/ficha.ts), `leerParte(app)` (estado/parte.ts), y `leerInicioDelConductor(app)` y `leerMisPartes(app)` (estado/conductor.ts). La entrada al recorrido de Inicio
  // es `leerEntradaAlRecorrido(app)` (estado/recorrido.ts, liviano: viaja con el marco).
  /** Se llegó a una ficha desde otra pantalla con algo que decir (hoy, «Unidad agregada…»): patente y mensaje. Se va al salir de esa ficha. */
  private llegada = $state<{ patente: string; mensaje: string } | null>(null);
  /** El mensaje de llegada a la ficha que se está mirando (la barra de estado arranca con él); `null` si no hay. La vista lo reemplaza con los suyos. */
  mensajeDeLlegada = $derived<string | null>(
    this.llegada !== null && this.ruta.tipo === "unidad" && this.ruta.patente === this.llegada.patente ? this.llegada.mensaje : null,
  );
  /** Nombre con el que firman los eventos: el conductor elegido o la encargada. */
  autor = $derived(this.autorDe(this.perfil));

  /** El nombre que firma lo que hace `perfil` (no siempre el perfil de ahora: un guardado en cola firma como quien lo pidió, código B9). */
  private autorDe(perfil: Perfil): string {
    if (perfil.tipo === "conductor") return this.estado?.conductores.find((c) => c.id === perfil.conductorId)?.nombre ?? "Conductor";
    return ENCARGADA;
  }

  private readonly deps: DependenciasApp;
  private repositorio: Repositorio | null = null;
  private pestanas: AvisoEntrePestanas | null = null;
  private dejarDeEscucharUbicacion: (() => void) | null = null;
  private pantallaActual = "";
  private consultaActual = "";
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
        ...(this.deps.cargarGenerador === undefined ? {} : { cargarGenerador: this.deps.cargarGenerador }),
        ...(this.deps.plazoDescargaMs === undefined ? {} : { plazoGeneradorMs: this.deps.plazoDescargaMs }),
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
    } catch (error) {
      this.fase = "error";
      // Un generador que no bajó (sin red, vencido el plazo o ya inexistente) se dice como lo que es; cualquier otra falla, el mensaje de siempre. En los dos casos, «Recargar».
      this.errorDeArranque =
        error instanceof ErrorDeDescarga ? (esVersionNueva(error) ? TEXTO_ERROR_DESCARGA.versionNueva : TEXTO_ERROR_DESCARGA.mensaje) : TEXTO_ERROR_ARRANQUE.mensaje;
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

  /**
   * Corre `accion` sobre el almacenamiento. Si la conexión está cerrada (QA B2: la base se borró o se cambió desde otra pestaña con la demo abierta) ningún reintento puede
   * funcionar sobre ella: se sigue con un repositorio en memoria que arranca con `estado` (lo último que se guardó bien, o sea lo que se ve en pantalla), se avisa que los cambios
   * ya no se guardan y se repite la acción una vez. Así lo escrito no se pierde y el reintento anda; cualquier otro error sube tal cual.
   */
  private async conAlmacenamiento<T>(estado: Estado, accion: (repositorio: Repositorio) => Promise<T>): Promise<T> {
    const repositorio = this.repositorio;
    if (repositorio === null) throw new Error(ERRORES.sinDatos);
    try {
      return await accion(repositorio);
    } catch (error) {
      if (!(error instanceof ErrorDeRepositorio) || error.codigo !== "conexion-cerrada") throw error;
      const enMemoria = new RepositorioMemoria();
      await enMemoria.reemplazarTodo(estado);
      repositorio.cerrar?.();
      this.repositorio = enMemoria;
      this.enMemoria = true;
      // Sin almacenamiento no hay nada que compartir con otras pestañas.
      this.pestanas?.cerrar();
      this.pestanas = null;
      this.hayCambiosEnOtraPestana = false;
      if (!this.avisos.some((a) => a.tipo === "almacenamiento-perdido")) this.avisos = [...this.avisos, { tipo: "almacenamiento-perdido" }];
      return await accion(enMemoria);
    }
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
    // La pantalla y la consulta se miran por separado (R3): cambiar el filtro o escribir en el buscador no es llegar a otra pantalla.
    const pantalla = clavePantalla(ruta);
    if (pantalla !== this.pantallaActual) {
      this.pantallaActual = pantalla;
      this.versionDePantalla += 1;
      if (this.llegada !== null && !(ruta.tipo === "unidad" && ruta.patente === this.llegada.patente)) this.llegada = null;
    }
    const consulta = claveConsulta(ruta);
    if (consulta !== this.consultaActual) {
      this.consultaActual = consulta;
      this.versionDeConsulta += 1;
    }
    // La ficha vuelve a Movilidades como la dejó la persona; en cualquier otra pantalla eso se olvida.
    if (ruta.tipo === "movilidades") this.movilidades = ruta;
    else if (ruta.tipo !== "unidad") this.movilidades = null;
  }

  /** Cambia de pantalla, o de filtro dentro de ella (agrega una entrada al historial: Atrás lo deshace). */
  irA(ruta: Ruta): void {
    this.deps.ubicacion.irA(aHash(ruta));
    this.leerUbicacion(); // en el navegador el aviso del cambio llega después: esto es idempotente
  }

  /**
   * Cambia la consulta de la pantalla donde se está (cada letra del buscador) SIN agregar una entrada al historial y sin tocar el foco ni
   * el desplazamiento. Una ruta de otra pantalla no es una consulta: se navega a ella como siempre (`irA`).
   */
  ajustarConsulta(ruta: Ruta): void {
    if (clavePantalla(ruta) !== clavePantalla(this.ruta)) return this.irA(ruta);
    this.deps.ubicacion.reemplazarHash(aHash(ruta));
    this.leerUbicacion();
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
   * La pantalla lo llama cuando una acción de la persona (enviar el parte, que primero guarda el borrador) se frenó por los cambios de otra pestaña: cuenta como un bloqueo
   * y lleva la vista al aviso. Sin cambios de otra pestaña no hace nada.
   */
  pedirVerElAviso(): void {
    if (this.hayCambiosEnOtraPestana) this.bloqueosPorOtraPestana++;
  }

  /**
   * Ejecuta un comando del dominio: lo valida, lo escribe (cambios y eventos juntos) y recién entonces actualiza el
   * estado. Devuelve el error de negocio con su mensaje, o `escritura-fallida` (D10) sin haber cambiado nada.
   */
  ejecutar(comando: Comando): Promise<Resultado<Ejecucion>> {
    return this.encolar(() => this.ejecutarAhora(comando));
  }

  /**
   * Un trozo de escritura (ver `TrozosDeEscritura`): el de la dependencia, o el `import()` de siempre. Si no baja, o no responde en `plazoDescargaMs`, rechaza con `ErrorDeDescarga`
   * (que dice si fue la red, el plazo o una versión nueva) y no deja la cola colgada: el pedido de la próxima escritura es nuevo.
   */
  private trozo<K extends keyof ModulosDeEscritura>(cual: K): Promise<ModulosDeEscritura[K]> {
    const cargar: TrozosDeEscritura[K] = this.deps.trozos?.[cual] ?? TROZOS[cual];
    return bajar<ModulosDeEscritura[K]>(cargar, { plazoMs: this.deps.plazoDescargaMs ?? PLAZO_DE_DESCARGA_MS });
  }

  /**
   * Lo que frena un comando antes de escribirlo, o `null` si puede seguir: la demo todavía no cargó, el perfil no puede, o hay cambios de otra pestaña (D12): los comandos se evalúan
   * contra el estado de esta pestaña; si otra ya escribió y esta no se actualizó, se pisarían sus cambios (una baja desaparecería, una renovación se duplicaría). Hasta que se pulse
   * «Actualizar» no se escribe nada.
   */
  private frenarComando(comando: Comando, perfil: Perfil): Resultado<Ejecucion> | null {
    if (this.estado === null || this.repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
    if (perfil.tipo === "conductor" && !COMANDOS_DEL_CONDUCTOR.has(comando.tipo)) return fallo("sin-permiso", ERRORES.sinPermiso);
    if (this.hayCambiosEnOtraPestana) {
      // El autoguardado no cuenta: corre solo mientras se escribe y no tiene que llevar la vista a ningún lado.
      if (comando.tipo !== "guardarBorrador" && comando.tipo !== "guardarCierre") this.bloqueosPorOtraPestana++;
      return fallo("cambios-en-otra-pestana", ERRORES_PESTANAS.escrituraConCambiosEnOtraPestana);
    }
    return null;
  }

  /** `ejecutar` sin pasar por la cola: para los métodos que ya están dentro de ella y encadenan más de un comando (guardar y enviar el parte). */
  async ejecutarAhora(comando: Comando, perfil: Perfil = this.perfil): Promise<Resultado<Ejecucion>> {
    // Lo que ya se sabe frena antes de esperar nada: sin bajar el trozo de comandos para una escritura que no se va a hacer.
    const antes = this.frenarComando(comando, perfil);
    if (antes !== null) return antes;

    let comandos: ModulosDeEscritura["comandos"];
    try {
      comandos = await this.trozo("comandos");
    } catch (error) {
      return fallo("escritura-fallida", textoDeEscrituraSinTrozo(error, COMANDOS_DEL_PARTE_A_GUARDAR.has(comando.tipo) ? ERRORES.noPudoGuardarElParte : ERRORES.noPudoGuardar));
    }
    // La espera pudo ser larga (la red, solo la primera escritura) y en ese rato pudo llegar el aviso de otra pestaña (D12): se vuelve a mirar y recién ahora se toma el estado
    // contra el que se evalúa el comando, para no pisar lo que la otra pestaña escribió.
    const despues = this.frenarComando(comando, perfil);
    const estado = this.estado;
    if (despues !== null || estado === null) return despues ?? fallo("sin-datos", ERRORES.sinDatos);
    const momento = this.deps.reloj.momento();
    const resultado = comandos.ejecutar(estado, comando, {
      hoy: momento.hoy,
      ahora: momento.ahora,
      autor: this.autorDe(perfil),
      nuevoId: this.deps.nuevoId ?? generarId,
    });
    if (!resultado.ok) return resultado;
    try {
      await this.conAlmacenamiento(estado, (r) => r.escribir(resultado.valor.cambios, resultado.valor.eventos));
    } catch {
      return fallo("escritura-fallida", COMANDOS_DEL_PARTE_A_GUARDAR.has(comando.tipo) ? ERRORES.noPudoGuardarElParte : ERRORES.noPudoGuardar);
    }
    this.estado = resultado.valor.estado;
    this.hoy = momento.hoy;
    this.pestanas?.avisarCambio();
    return resultado;
  }

  // --- Diálogos de documentos (paso 4.2) -----------------------------------------------------------

  /**
   * «Renovar documento»: revisa todos los campos, ejecuta `renovarDocumento` (cambios y evento en una escritura) y actualiza el
   * estado sin recargar. Nunca rechaza: los errores vuelven repartidos por campo (o como error general) para el formulario.
   */
  renovarDocumento(documentoId: string, valores: ValoresDocumento, donde: DondeSeGuarda = "centro"): Promise<ResultadoGuardado<CampoDocumento>> {
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
  cargarDocumento(titular: Titular, tipoDocumento: TipoDocumento, valores: ValoresDocumento, donde: DondeSeGuarda = "centro"): Promise<ResultadoGuardado<CampoDocumento>> {
    return this.guardarDocumento(
      valores,
      comandoDeCargar(titular, tipoDocumento, valores),
      (despues) => textoDocumentoCargado(tipoDocumento, etiquetaDeTitular(despues, titular)),
      donde,
    );
  }

  /** Para `ficha-escritura.ts`: lo que tienen en común los diálogos de documentos. */
  async guardarDocumento(
    valores: ValoresDocumento,
    comando: Comando,
    texto: (despues: Estado) => string | null,
    donde: DondeSeGuarda,
  ): Promise<ResultadoGuardado<CampoDocumento>> {
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

  /** Para `ficha-escritura.ts`. Lo que tienen en común: sin datos, validación previa, ejecutar y repartir el error o armar el mensaje. */
  async guardarFormulario<Campo extends string>(a: {
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

  /** Para `ficha-escritura.ts`. `ZK 214 BD` de la unidad, en el estado que se pasa. */
  patenteDe(estado: Estado, unidadId: string): string {
    return etiquetaDeTitular(estado, { tipo: "unidad", id: unidadId });
  }

  /**
   * La escritura de la ficha es un trozo aparte (`ficha-escritura.ts`): se baja la primera vez que se guarda algo desde ella. Si no baja (sin red), se contesta como cualquier otra
   * escritura que falla: «No se pudo guardar», con el formulario abierto y lo escrito en su lugar (D10).
   */
  private async conEscrituraDeFicha<Campo extends string>(usar: (modulo: typeof import("./ficha-escritura.ts")) => Promise<ResultadoGuardado<Campo>>): Promise<ResultadoGuardado<Campo>> {
    let modulo: typeof import("./ficha-escritura.ts");
    try {
      modulo = await this.trozo("ficha");
    } catch (error) {
      return { ok: false, errores: errorGeneralEn(textoDeEscrituraSinTrozo(error, ERRORES.noPudoGuardar)) };
    }
    return usar(modulo);
  }

  /** «Corregir documento»: el vigente de una unidad o de un conductor, con sus cuatro campos. Es de la ficha (foco al título de Documentos). */
  corregirDocumento(documentoId: string, valores: ValoresDocumento): Promise<ResultadoGuardado<CampoDocumento>> {
    return this.conEscrituraDeFicha((m) => m.corregirDocumento(this, documentoId, valores));
  }

  /** «Cargar otro documento»: el `select` Tipo elige cuál (uno de `contextoDeCargarOtro(...).tipos`) y el resto es igual que `cargarDocumento`. */
  cargarOtroDocumento(unidadId: string, valores: ValoresCargarOtro): Promise<ResultadoGuardado<CampoCargarOtro>> {
    return this.conEscrituraDeFicha((m) => m.cargarOtroDocumento(this, unidadId, valores));
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
        // P19: con una novedad crítica de hoy (del parte o cargada a mano), vuelve a servicio pero no sale hasta mañana.
        const hastaManana = volvio && n !== undefined && unidadSinSalidaHoy(e.estado, n.unidadId, this.hoy);
        return {
          mensaje: textoNovedadResuelta(n === undefined ? "" : rotuloNovedad(n), patente, volvio, donde === "centro", hastaManana),
          foco: donde === "centro" ? "titulo-del-panel" : "titulo-de-novedades",
        };
      },
    });
  }

  /** «Cargar novedad» a mano (N3): con «Impide usar la unidad» la unidad queda fuera de servicio (A3). */
  cargarNovedad(unidadId: string, valores: ValoresCargarNovedad): Promise<ResultadoGuardado<CampoCargarNovedad>> {
    return this.conEscrituraDeFicha((m) => m.cargarNovedad(this, unidadId, valores));
  }

  /** «Poner fuera de servicio» (A6). */
  ponerFueraDeServicio(unidadId: string, valores: ValoresFueraDeServicio): Promise<ResultadoGuardado<CampoFueraDeServicio>> {
    return this.conEscrituraDeFicha((m) => m.ponerFueraDeServicio(this, unidadId, valores));
  }

  /**
   * «Volver a servicio» (A4, A5). Con críticas abiertas se rechaza con el error general que las nombra (el diálogo ya lo avisó y no ofrece el botón).
   * Con documentos vencidos o faltantes vuelve igual y el mensaje dice que todavía no puede salir.
   */
  volverAServicio(unidadId: string): Promise<ResultadoGuardado<never>> {
    return this.conEscrituraDeFicha((m) => m.volverAServicio(this, unidadId));
  }

  /** «Dar de baja» (A7): irreversible en la demo; conserva documentos, partes e historial. */
  darDeBaja(unidadId: string, valores: ValoresBaja): Promise<ResultadoGuardado<CampoBaja>> {
    return this.conEscrituraDeFicha((m) => m.darDeBaja(this, unidadId, valores));
  }

  /** «Corregir kilometraje» (K5, M3). */
  corregirKilometraje(unidadId: string, valores: ValoresKilometraje): Promise<ResultadoGuardado<CampoKilometraje>> {
    return this.conEscrituraDeFicha((m) => m.corregirKilometraje(this, unidadId, valores));
  }

  /** «Cambiar proyecto o conductor» (U6): si el proyecto nuevo exige la habilitación y no la tiene, el mensaje lo dice y la alerta ya existe. */
  cambiarAsignacion(unidadId: string, valores: ValoresAsignacion): Promise<ResultadoGuardado<CampoAsignacion>> {
    return this.conEscrituraDeFicha((m) => m.cambiarAsignacion(this, unidadId, valores));
  }

  // --- Inicio del conductor y parte diario (paso 4.5) --------------------------------------------------
  //
  // El parte tiene dos pasos (sección 17). La revisión se guarda sola (P3: `guardarBorradorDeParte`, que llama el autoguardado) y se envía con `enviarRevisionDeParte`; el cierre se guarda solo
  // (`guardarCierreDeParte`) y se envía con `enviarCierreDeParte`. Los dos van por la misma cola que el resto de
  // los comandos, y buscan el borrador de la unidad y la fecha DENTRO de la cola: dos guardados seguidos (autoguardado y «salir del campo») nunca crean dos borradores.
  // Los dos perfiles pueden usarlos (sección 8); con el perfil Conductor el conductor del parte es siempre quien lo completa.

  /**
   * Las opciones del diálogo «¿Quién completa el parte?»: todo conductor activo, con su unidad y si su licencia ampara hoy (L1). Las marcas «Para probar» (M1) no viajan con el marco:
   * salen de `leerSugerenciasDeVerComo(app)` (estado/conductor.ts), que el marco baja al abrir el diálogo y suma con `conSugerencias`.
   */
  opcionesDeConductor(): OpcionParaElegirConductor[] {
    return this.estado === null ? [] : opcionesParaElegirConductor(this.estado, this.hoy);
  }

  /** El contexto de un ensayo (comando que no se escribe): no gasta ids del generador. Lo usa `parte-escritura.ts`. */
  contextoDeEnsayo(perfil: Perfil): Contexto {
    const momento = this.deps.reloj.momento();
    return { hoy: momento.hoy, ahora: momento.ahora, autor: this.autorDe(perfil), nuevoId: () => "ensayo" };
  }

  // La escritura del parte vive en `parte-escritura.ts`, que se baja con la pantalla del parte (y acá, la primera vez que se la necesita): estos métodos son la puerta de siempre
  // y la cola de comandos sigue siendo una sola.

  /**
   * P3: guarda el borrador del parte de `unidadId` y `fecha` con lo que hay en el formulario (`valores`, todo texto). Solo se controla el formato de cada campo: con un
   * error no se guarda nada y vuelve `tipo: "campos"`. Un borrador que todavía no existe y cuyos valores siguen siendo los iniciales NO se crea (`sinCambios`; D11): el
   * borrador nace con el primer cambio. No cambia el kilometraje de la unidad ni abre novedades (K9, P3).
   */
  guardarBorradorDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil: Perfil = this.perfil): Promise<ResultadoDeBorrador> {
    return this.encolar(() =>
      this.conEscrituraDeParte(
        (m) => m.guardarBorradorAhora(this, unidadId, fecha, valores, perfil),
        (error) => ({ ok: false, tipo: "escritura", errores: errorDeParteSinTrozo(error, TITULOS_DE_ERROR_DEL_PARTE.revision) }),
      ),
    );
  }

  /**
   * P3: guarda el cierre (kilometraje al terminar, combustible y litros) del parte en uso de `unidadId` y `fecha`. Solo se controla el formato de cada campo. No genera eventos ni cuenta
   * para el kilometraje hasta cerrar (K9); lo ya guardado no se vuelve a escribir (`sinCambios`).
   */
  guardarCierreDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, perfil: Perfil = this.perfil): Promise<ResultadoDeBorrador> {
    return this.encolar(() =>
      this.conEscrituraDeParte(
        (m) => m.guardarCierreAhora(this, unidadId, fecha, valores, perfil),
        (error) => ({ ok: false, tipo: "escritura", errores: errorDeParteSinTrozo(error, TITULOS_DE_ERROR_DEL_PARTE.cierre) }),
      ),
    );
  }

  /**
   * «Enviar revisión» (P4, P12, L1, K3, K4, K6, P21, A3, P16). Primero guarda lo que hay en el formulario como borrador (así lo escrito en los últimos 500 ms no se pierde y, si el
   * envío se bloquea —licencia, K3—, el borrador queda), después revisa lo que falta y por último envía. El envío es atómico (P12): el parte, las novedades, el cambio de estado de la
   * unidad y los eventos se escriben juntos; si falla, queda el borrador. `aceptadas` son las advertencias que la persona aceptó en «Antes de enviar». El resultado es C1 (el parte quedó
   * en uso) o C2 (una novedad crítica: la unidad no sale y el parte se cerró sin uso).
   */
  enviarRevisionDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, aceptadas: Advertencia["tipo"][] = []): Promise<ResultadoDeEnvio> {
    return this.encolar(() =>
      this.conEscrituraDeParte(
        (m) => m.enviarRevisionAhora(this, unidadId, fecha, valores, aceptadas),
        (error) => ({ tipo: "errores", errores: errorDeParteSinTrozo(error, TITULOS_DE_ERROR_DEL_PARTE.revision), foco: "resumen-de-errores", primerCampo: null }),
      ),
    );
  }

  /**
   * «Cerrar el parte» (P4, P12, P15, K2, K4, K7). Primero guarda lo que hay en el formulario del cierre, después revisa lo que falta y por último cierra. `aceptadas` son las
   * advertencias que la persona aceptó en «Antes de enviar» (el cierre solo puede avisar del recorrido largo, K7). El resultado es C3.
   */
  enviarCierreDeParte(unidadId: string, fecha: FechaCivil, valores: ValoresParte, aceptadas: Advertencia["tipo"][] = []): Promise<ResultadoDeEnvio> {
    return this.encolar(() =>
      this.conEscrituraDeParte(
        (m) => m.enviarCierreAhora(this, unidadId, fecha, valores, aceptadas),
        (error) => ({ tipo: "errores", errores: errorDeParteSinTrozo(error, TITULOS_DE_ERROR_DEL_PARTE.cierre), foco: "resumen-de-errores", primerCampo: null }),
      ),
    );
  }

  /** «Descartar borrador» (el botón-texto de dos pasos del parte y del inicio del conductor). No deja eventos (sección 8); un parte enviado no se descarta (P7). */
  async descartarBorradorDeParte(parteId: string): Promise<ResultadoDeDescarte> {
    let modulo: ModulosDeEscritura["parte"];
    try {
      modulo = await this.trozo("parte");
    } catch (error) {
      const mensaje = textoDeEscrituraSinTrozo(error, ERRORES.noPudoGuardar);
      return { ok: false, mensaje, errores: { ...errorGeneralEn<CampoParte>(mensaje), titulo: mensaje } };
    }
    return modulo.descartarBorradorDeParte(this, parteId);
  }

  /**
   * Corre `usar` con la escritura del parte, que es un trozo aparte (`parte-escritura.ts`): se baja la primera vez que se la necesita. Si no baja, no rechaza: `sinTrozo` arma la
   * respuesta de error de esa escritura («No se pudo guardar el parte», con lo escrito en su lugar), como en la ficha. Va dentro de la cola, así que la espera del trozo no deja pasar a otra.
   */
  private async conEscrituraDeParte<R>(usar: (modulo: ModulosDeEscritura["parte"]) => Promise<R>, sinTrozo: (error: unknown) => R): Promise<R> {
    let modulo: ModulosDeEscritura["parte"];
    try {
      modulo = await this.trozo("parte");
    } catch (error) {
      return sinTrozo(error);
    }
    return usar(modulo);
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
      if (this.hayCambiosEnOtraPestana) {
        this.bloqueosPorOtraPestana++;
        return fallo("cambios-en-otra-pestana", ERRORES.cambiosEnOtraPestana);
      }
      if (perfil.tipo === "conductor" && !estado.conductores.some((c) => c.id === perfil.conductorId)) {
        return fallo("conductor-inexistente", ERRORES.conductorInexistente);
      }
      try {
        this.estado = await this.conAlmacenamiento(estado, (r) => guardarPerfil(r, estado, perfil));
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
        this.estado = await this.conAlmacenamiento(estado, (r) => reiniciarDemo(r, estado, momento.hoy, this.deps.cargarGenerador, this.deps.plazoDescargaMs));
        this.hoy = momento.hoy;
      } catch (error) {
        // El generador que ya no existe (versión nueva) manda a recargar; cualquier otra falla (sin red, sin respuesta, el almacenamiento) es el «Intente de nuevo» de siempre.
        return fallo("escritura-fallida", esVersionNueva(error) ? ERRORES.noPudoReiniciarPorVersionNueva : ERRORES.noPudoReiniciar);
      }
      this.avisos = this.avisos.filter((a) => a.tipo === "sin-almacenamiento" || a.tipo === "almacenamiento-perdido");
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
        nuevo = this.estado === null ? await repositorio.cargar() : await this.conAlmacenamiento(this.estado, (r) => r.cargar());
      } catch {
        return fallo("lectura-fallida", ERRORES.noPudoActualizar);
      }
      // Lo que escribió la otra pestaña también se lee con `parteLegible`: una sola vía de lectura para los partes (código M1).
      const partes = nuevo === null ? null : partesLegibles(nuevo.partes);
      if (nuevo === null || partes === null) return fallo("lectura-fallida", ERRORES.noPudoActualizar);
      this.estado = { ...nuevo, partes };
      this.hayCambiosEnOtraPestana = false;
      this.leerUbicacion(); // el perfil o los datos pudieron cambiar: puede haber que redirigir
      return ok(null);
    });
  }
}
