// Estado compartido de los diálogos Renovar / Cargar / Corregir un documento y Resolver una novedad. Lo usan Inicio, Vencimientos y Operación diaria con UN solo
// componente de diálogos: acá vive qué está abierto, con qué contexto, a dónde va lo guardado y qué se dice en la barra de cada pantalla. Sin DOM: la vista solo
// dibuja `DialogoDocumento` y `DialogoResolver` con lo que devuelve.
//
// Reglas que cumple (docs/diseno-ui.md 5.17, QA M1 del prototipo):
//  - Un diálogo no sobrevive a un cambio de pantalla (`versionDePantalla`): «Atrás» o un enlace lo dejan cerrado. Cambiar el filtro o escribir en el buscador no.
//  - Nunca hay dos diálogos abiertos.
//  - El mensaje de lo que pasó es un objeto nuevo cada vez (el mismo texto dos veces se vuelve a anunciar) y se olvida al llegar a otra pantalla.
//  - Si la fila que se quiso abrir ya no está pendiente (se renovó mientras tanto), no se abre nada: se dice.
// Uso: `const dialogos = new DialogosDeDocumento(app)` (la aplicación real, en `dialogos-instancia.ts`) y, en la vista:
//   `<DialogoDocumento bind:abierto={dialogos.abierto} contexto={dialogos.contexto} guardar={dialogos.guardar} alGuardar={(r) => dialogos.alGuardar(r)} focoDestino={...} />`.

import { contextoDeCargar, contextoDeCorregir, contextoDeRenovar, errorGeneral, type CampoDocumento, type ValoresDocumento } from "../lib/dominio/formulario-documento.ts";
import { contextoDeResolver, type CampoResolver, type ContextoResolver, type ValoresResolver } from "../lib/dominio/formulario-novedad.ts";
import { ERRORES } from "../lib/dominio/textos-base.ts";
import { TEXTO_CONDUCTORES_SIN_LICENCIA as TCL } from "../lib/dominio/textos-inicio.ts";
import type { EstadoApp, ResultadoGuardado } from "../lib/estado/app.svelte.ts";
import type { AccionDeConductorSinLicencia, AccionDeDocumento, FilaDeConductorSinLicencia } from "../lib/estado/centro-alertas.ts";
import { TEXTO_ALERTAS as T } from "./textos-marco.ts";

/** La pantalla donde se abrió el diálogo: de ahí depende dónde se dice lo que pasó y a qué título va el foco al terminar. */
export type OrigenDeDialogo = "inicio" | "vencimientos" | "operacion";

/** Lo que pone `DialogoDocumento` en su cabecera y en sus campos (el mismo tipo que exporta ese componente). */
export interface ContextoDeDocumento {
  titulo: string;
  /** Línea de contexto («Actual: póliza …» al renovar; la nota de «Use esto para corregir…» al corregir). */
  contexto?: string;
  primario: string;
  valoresIniciales: ValoresDocumento;
}

/** Lo único que lee y llama de la aplicación (así se prueba con la `EstadoApp` de verdad, sin DOM). */
export type AppDeDialogos = Pick<
  EstadoApp,
  "estado" | "hoy" | "versionDePantalla" | "renovarDocumento" | "cargarDocumento" | "corregirDocumento" | "resolverNovedad"
>;

const SIN_MENSAJE = { texto: "" };

export class DialogosDeDocumento {
  readonly #app: AppDeDialogos;
  /** La `versionDePantalla` en que se abrió cada diálogo; `null` si está cerrado. Estar abierto es seguir en esa pantalla: no hace falta un efecto que lo cierre. */
  #documentoAbiertoEn = $state<number | null>(null);
  #resolverAbiertoEn = $state<number | null>(null);
  #contexto = $state.raw<ContextoDeDocumento | null>(null);
  #contextoResolver = $state.raw<ContextoResolver | null>(null);
  #accion: ((valores: ValoresDocumento) => Promise<ResultadoGuardado<CampoDocumento>>) | null = null;
  /** Si el diálogo es de la licencia de un conductor, el mensaje dice su nombre en vez del general. */
  #conductor: { nombre: string; tipo: AccionDeConductorSinLicencia["tipo"] } | null = null;
  #origen: OrigenDeDialogo = "inicio";
  #mensajes = $state.raw<Partial<Record<OrigenDeDialogo, { texto: string; version: number }>>>({});

  constructor(app: AppDeDialogos) {
    this.#app = app;
  }

  // --- Lo que dibuja la vista -------------------------------------------------------------------

  /** Renovar, Cargar o Corregir está abierto (en esta pantalla). Se puede enlazar con `bind:abierto`: poner `false` lo cierra. */
  get abierto(): boolean {
    return this.#documentoAbiertoEn !== null && this.#documentoAbiertoEn === this.#app.versionDePantalla;
  }
  set abierto(valor: boolean) {
    this.#documentoAbiertoEn = valor ? this.#app.versionDePantalla : null;
  }

  get resolverAbierto(): boolean {
    return this.#resolverAbiertoEn !== null && this.#resolverAbiertoEn === this.#app.versionDePantalla;
  }
  set resolverAbierto(valor: boolean) {
    this.#resolverAbiertoEn = valor ? this.#app.versionDePantalla : null;
  }

  /** Título, línea de contexto, botón y valores iniciales del diálogo de documento; `null` si nunca se abrió. */
  get contexto(): ContextoDeDocumento | null {
    return this.#contexto;
  }

  get contextoResolver(): ContextoResolver | null {
    return this.#contextoResolver;
  }

  /** Lo que se dijo en la barra de estado de esa pantalla. Es un objeto nuevo con cada mensaje (aunque el texto se repita) y vacío al llegar a otra pantalla. */
  mensaje(origen: OrigenDeDialogo): { texto: string } {
    const m = this.#mensajes[origen];
    return m !== undefined && m.version === this.#app.versionDePantalla ? m : SIN_MENSAJE;
  }

  // --- Abrir ------------------------------------------------------------------------------------

  /**
   * «Renovar», «Cargar» o «Corregir» un documento (la acción de una fila de Vencimientos, del detalle de un punto de la regla o de un conductor sin licencia). Si el
   * documento ya no está pendiente no abre nada y lo dice en `origen`.
   */
  abrirRenovar(accion: AccionDeDocumento | AccionDeConductorSinLicencia, origen: OrigenDeDialogo): void {
    this.#abrirDocumento(accion, origen, null);
  }

  /** La licencia de un conductor que hoy no puede manejar (Inicio): igual que `abrirRenovar`, pero lo que se dice al guardar nombra al conductor. */
  abrirLicencia(conductor: FilaDeConductorSinLicencia, origen: OrigenDeDialogo = "inicio"): void {
    this.#abrirDocumento(conductor.accion, origen, { nombre: conductor.nombre, tipo: conductor.accion.tipo });
  }

  #abrirDocumento(accion: AccionDeDocumento | AccionDeConductorSinLicencia, origen: OrigenDeDialogo, conductor: { nombre: string; tipo: AccionDeConductorSinLicencia["tipo"] } | null): void {
    const estado = this.#app.estado;
    if (estado === null) return;
    const app = this.#app;
    const yaNoPendiente = (): void => this.#decir(origen, T.yaNoPendiente);
    let contexto: ContextoDeDocumento;
    let accionDeGuardado: (valores: ValoresDocumento) => Promise<ResultadoGuardado<CampoDocumento>>;
    if (accion.tipo === "corregir") {
      // M2: la licencia cargada con una emisión futura se corrige con el diálogo de la ficha.
      const documentoId = accion.documentoId;
      const ctx = documentoId === null ? null : contextoDeCorregir(estado, documentoId);
      if (documentoId === null || ctx === null) return yaNoPendiente();
      contexto = { titulo: ctx.titulo, contexto: ctx.nota, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      accionDeGuardado = (valores) => app.corregirDocumento(documentoId, valores);
    } else if (accion.tipo === "renovar" && accion.documentoId !== null) {
      const documentoId = accion.documentoId;
      const ctx = contextoDeRenovar(estado, documentoId, this.#app.hoy);
      if (ctx === null) return yaNoPendiente();
      contexto = { titulo: ctx.titulo, contexto: ctx.contexto, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      accionDeGuardado = (valores) => app.renovarDocumento(documentoId, valores);
    } else {
      const ctx = contextoDeCargar(estado, accion.titular, accion.tipoDocumento);
      if (ctx === null) return yaNoPendiente();
      contexto = { titulo: ctx.titulo, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      accionDeGuardado = (valores) => app.cargarDocumento(accion.titular, accion.tipoDocumento, valores);
    }
    this.#origen = origen;
    this.#conductor = conductor;
    this.#contexto = contexto;
    this.#accion = accionDeGuardado;
    this.#resolverAbiertoEn = null;
    this.#documentoAbiertoEn = this.#app.versionDePantalla;
  }

  /** «Resolver» una novedad abierta (Operación diaria). Si ya no está abierta (otra pestaña, o la ficha), no abre nada y lo dice. */
  abrirResolver(novedadId: string, origen: OrigenDeDialogo = "operacion"): void {
    const estado = this.#app.estado;
    if (estado === null) return;
    const contexto = contextoDeResolver(estado, novedadId, this.#app.hoy);
    if (contexto === null) return this.#decir(origen, T.novedadYaResuelta);
    this.#origen = origen;
    this.#contextoResolver = contexto;
    this.#documentoAbiertoEn = null;
    this.#resolverAbiertoEn = this.#app.versionDePantalla;
  }

  /** Cierra el que esté abierto (por ejemplo, al abrir otra cosa o al salir de la pantalla). */
  cerrar(): void {
    this.#documentoAbiertoEn = null;
    this.#resolverAbiertoEn = null;
  }

  // --- Guardar ----------------------------------------------------------------------------------

  /** Lo que se le pasa a `DialogoDocumento` como `guardar`: renueva, carga o corrige según lo que se abrió. Nunca rechaza (sin diálogo, es un error general). */
  readonly guardar = (valores: ValoresDocumento): Promise<ResultadoGuardado<CampoDocumento>> =>
    this.#accion === null ? Promise.resolve({ ok: false, errores: errorGeneral(ERRORES.sinDatos) }) : this.#accion(valores);

  /** `guardar` de `DialogoResolver`: resuelve la novedad abierta; desde acá el mensaje nombra la unidad y el foco va al título de la lista. */
  readonly guardarResolver = (valores: ValoresResolver): Promise<ResultadoGuardado<CampoResolver>> => this.#app.resolverNovedad(this.#contextoResolver?.novedadId ?? "", valores);

  /** Se guardó bien (Renovar, Cargar o Corregir): lo dice en la barra de la pantalla que lo abrió. Con la licencia de un conductor, nombra al conductor. */
  alGuardar(resultado: { mensaje: string }): void {
    const k = this.#conductor;
    const texto = k === null || k.tipo === "corregir" ? resultado.mensaje : k.tipo === "renovar" ? TCL.licenciaRenovada(k.nombre) : TCL.licenciaCargada(k.nombre);
    this.#decir(this.#origen, texto);
  }

  /** Se resolvió la novedad: lo dice en la barra de Operación diaria. */
  alResolver(resultado: { mensaje: string }): void {
    this.#decir(this.#origen, resultado.mensaje);
  }

  /**
   * A qué título va el foco al cerrarse un diálogo (5.17). Recibe el resultado del guardado, o `null` si se cerró sin guardar (el foco vuelve al botón que lo abrió).
   * Devuelve la pantalla de origen: la fila o el botón que abrió el diálogo puede haber cambiado o desaparecido, así que el foco va al título de lo que cambió.
   */
  destinoDelFoco(resultado: { foco: string } | null): OrigenDeDialogo | null {
    return resultado === null ? null : this.#origen;
  }

  #decir(origen: OrigenDeDialogo, texto: string): void {
    this.#mensajes = { ...this.#mensajes, [origen]: { texto, version: this.#app.versionDePantalla } };
  }
}
