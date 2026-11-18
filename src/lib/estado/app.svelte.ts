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

import { ENCARGADA } from "../datos/generador.ts";
import { calcularAlertas, type ResultadoAlertas } from "../dominio/alertas.ts";
import { ejecutar as ejecutarComando, type Comando, type Ejecucion } from "../dominio/comandos.ts";
import { ERRORES, TEXTO_ERROR_ARRANQUE } from "../dominio/textos.ts";
import { fallo, ok, type Estado, type FechaCivil, type Perfil, type Resultado } from "../dominio/tipos.ts";
import { arrancar, cambiarPerfil as guardarPerfil, reiniciarDemo, type Aviso } from "../persistencia/arranque.ts";
import { avisoEntrePestanas, type AvisoEntrePestanas } from "../persistencia/pestanas.ts";
import type { Repositorio } from "../persistencia/repositorio.ts";
import { aHash, resolverRuta, rutaPorDefecto, tituloDePagina, type Ruta } from "./enrutador.ts";
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
}

export type FaseApp = "arrancando" | "lista" | "error";

/** El perfil Conductor solo usa los comandos del parte (docs/diseno.md, sección 8). No es seguridad: es la perspectiva. */
const COMANDOS_DEL_CONDUCTOR: ReadonlySet<Comando["tipo"]> = new Set(["guardarBorrador", "enviarParte", "descartarBorrador"]);

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
  titulo = $derived(tituloDePagina(this.ruta));
  /** El centro de alertas, recalculado solo cuando cambian los datos o el día. */
  alertas = $derived<ResultadoAlertas | null>(this.estado === null ? null : calcularAlertas(this.estado, this.hoy));
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
      this.errorDeArranque = TEXTO_ERROR_ARRANQUE;
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
    }
  }

  /** Cambia de pantalla (agrega una entrada al historial). */
  irA(ruta: Ruta): void {
    this.deps.ubicacion.irA(aHash(ruta));
    this.leerUbicacion(); // en el navegador el aviso del cambio llega después: esto es idempotente
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
        return fallo("escritura-fallida", ERRORES.noPudoGuardar);
      }
      this.estado = resultado.valor.estado;
      this.hoy = momento.hoy;
      this.pestanas?.avisarCambio();
      return resultado;
    });
  }

  /** D6 y D11: elige el perfil, lo guarda sin marcar la demo como modificada y va al inicio de ese perfil. */
  cambiarPerfil(perfil: Perfil): Promise<Resultado<null>> {
    return this.encolar(async () => {
      const estado = this.estado;
      const repositorio = this.repositorio;
      if (estado === null || repositorio === null) return fallo("sin-datos", ERRORES.sinDatos);
      if (perfil.tipo === "conductor" && !estado.conductores.some((c) => c.id === perfil.conductorId)) {
        return fallo("conductor-inexistente", ERRORES.conductorInexistente);
      }
      try {
        this.estado = await guardarPerfil(repositorio, estado, perfil);
      } catch {
        return fallo("escritura-fallida", ERRORES.noPudoGuardar);
      }
      this.pestanas?.avisarCambio();
      this.irA(rutaPorDefecto(perfil));
      return ok(null);
    });
  }

  /** D6: "Reiniciar demo". Una sola escritura; si falla queda lo de antes y se informa. */
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
        return fallo("escritura-fallida", ERRORES.noPudoGuardar);
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
