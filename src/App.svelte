<script lang="ts">
  // El marco de la aplicación (docs/diseno-ui.md, secciones 2, 4, 5.2, 5.3, 5.18 y 5.19): enlace "Ir al contenido", barra superior,
  // barra de la aplicación con el selector de perfil, avisos globales, `main` (estado de arranque, error o la pantalla) y pie.
  // Lee todo del estado (`app`); no tiene reglas de negocio. Las pantallas internas son un marcador hasta los pasos 4.x.
  import { tick } from "svelte";
  import Aviso from "./componentes/Aviso.svelte";
  import BarraApp from "./componentes/BarraApp.svelte";
  import BarraSuperior from "./componentes/BarraSuperior.svelte";
  import Boton from "./componentes/Boton.svelte";
  import DialogoComoFunciona from "./componentes/DialogoComoFunciona.svelte";
  import DialogoConductor from "./componentes/DialogoConductor.svelte";
  import DialogoReiniciar from "./componentes/DialogoReiniciar.svelte";
  import EtiquetaDemo from "./componentes/EtiquetaDemo.svelte";
  import Icono from "./componentes/Icono.svelte";
  import Pie from "./componentes/Pie.svelte";
  import { TEXTO_MARCO, TEXTO_REINICIO } from "./componentes/textos-marco.ts";
  import type { ItemMenu, OpcionConductor, SeccionActiva } from "./componentes/tipos.ts";
  import { formatearPatente } from "./lib/dominio/patente.ts";
  import { TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, textoDatosDeOtraFecha } from "./lib/dominio/textos.ts";
  import { app } from "./lib/estado/instancia.ts";

  const TITULO_BASE = `${TEXTO_MARCO.nombreApp} (demo)`;
  const MINUTO_MS = 60_000;

  // ---------- Diálogos (5.17): "Cómo funciona", "Reiniciar demo" y "¿Quién completa el parte?" ----------
  let comoFunciona = $state(false);
  let reiniciar = $state(false);
  let elegirConductor = $state(false);

  // A dónde va el foco al cerrar un diálogo cuando el botón que lo abrió ya no sirve (o cuando hay una pantalla nueva): el h1.
  let irAlTitulo = false;
  function destinoDelFoco(): HTMLElement | null {
    if (!irAlTitulo) return null;
    irAlTitulo = false;
    return document.querySelector<HTMLElement>("main h1");
  }

  function abrirComoFunciona(): void {
    comoFunciona = true;
  }

  // Reiniciar demo. Con la demo cargada el error se muestra dentro del diálogo; desde la pantalla de error de arranque (fase "error")
  // el diálogo se cierra y el mensaje queda junto a "Recargar la página". La fase pasa por "arrancando" mientras trabaja.
  let reiniciando = $state(false);
  let errorAlReiniciar = $state("");
  let errorAlReiniciarDesdeError = $state("");
  let anuncio = $state("");

  function pedirReinicio(): void {
    errorAlReiniciar = "";
    reiniciar = true;
  }
  async function confirmarReinicio(): Promise<void> {
    if (reiniciando) return;
    const desdeError = app.fase === "error";
    reiniciando = true;
    errorAlReiniciar = "";
    const r = await app.reiniciar();
    reiniciando = false;
    if (r.ok) {
      errorAlReiniciarDesdeError = "";
      anuncio = TEXTO_REINICIO.hecho;
      irAlTitulo = desdeError;
      reiniciar = false;
    } else if (desdeError) {
      errorAlReiniciarDesdeError = r.error.mensaje;
      reiniciar = false;
    } else {
      errorAlReiniciar = r.error.mensaje;
    }
  }

  // Elegir "Conductor" (o "Cambiar"): diálogo con la lista de conductores activos y su unidad.
  let cambiandoPerfil = $state(false);
  let errorAlElegirConductor = $state("");
  const conductores = $derived<OpcionConductor[]>(
    app.estado === null
      ? []
      : app.estado.conductores
          .filter((c) => c.activo)
          .map((c) => {
            const unidad = app.estado?.unidades.find((u) => u.conductorId === c.id && u.estado.tipo !== "baja");
            return { id: c.id, nombre: c.nombre, unidad: unidad === undefined ? null : formatearPatente(unidad.patente) };
          }),
  );
  const conductorActual = $derived(app.perfil.tipo === "conductor" ? app.perfil.conductorId : null);

  function pedirConductor(): void {
    errorAlElegirConductor = "";
    elegirConductor = true;
  }
  async function confirmarConductor(conductorId: string): Promise<void> {
    if (cambiandoPerfil) return;
    cambiandoPerfil = true;
    errorAlElegirConductor = "";
    const r = await app.cambiarPerfil({ tipo: "conductor", conductorId });
    cambiandoPerfil = false;
    if (r.ok) {
      irAlTitulo = true; // cambió la pantalla: el foco va a su título, no al selector
      elegirConductor = false;
    } else {
      errorAlElegirConductor = r.error.mensaje;
    }
  }

  // Elegir "Encargado" no lleva diálogo; si falla, el mensaje queda en un aviso.
  let errorAlCambiarVista = $state("");
  async function elegirEncargado(): Promise<void> {
    const r = await app.cambiarPerfil({ tipo: "encargado" });
    errorAlCambiarVista = r.ok ? "" : r.error.mensaje;
  }

  // Con el arranque en error no hay almacenamiento donde actuar desde la barra: ahí se ofrece recargar o reiniciar (en `main`).
  const acciones = $derived<ItemMenu[]>(
    app.fase === "lista"
      ? [
          { id: "como-funciona", texto: TEXTO_MARCO.comoFunciona, alActivar: abrirComoFunciona },
          { id: "reiniciar", texto: TEXTO_MARCO.reiniciarDemo, alActivar: pedirReinicio },
        ]
      : [],
  );

  // ---------- Pestaña activa ----------
  function seccionDe(tipo: string, esConductor: boolean): SeccionActiva {
    switch (tipo) {
      case "alertas":
        return "alertas";
      case "flota":
      case "unidad":
        return "flota";
      case "conductor":
        return "conductor";
      case "parte":
        return esConductor ? "conductor" : null;
      default:
        return null;
    }
  }
  const seccion = $derived(seccionDe(app.ruta.tipo, app.perfil.tipo === "conductor"));
  const seccionContieneLaPantalla = $derived(app.ruta.tipo === "unidad" || app.ruta.tipo === "parte");
  const nombreDeLaPantalla = $derived(app.titulo.replace(/ · .*$/, ""));

  function elegirPerfil(tipo: "encargado" | "conductor"): void {
    if (tipo === "encargado") void elegirEncargado();
    else pedirConductor();
  }

  // ---------- D9: "Actualizar" ----------
  let errorAlActualizar = $state("");
  async function actualizar(): Promise<void> {
    const r = await app.actualizar();
    errorAlActualizar = r.ok ? "" : r.error.mensaje;
  }

  // ---------- Título, foco y desplazamiento al cambiar de pantalla ----------
  $effect(() => {
    document.title = app.fase === "lista" ? app.titulo : TITULO_BASE;
  });

  // La primera pantalla no roba el foco al cargar: solo los cambios posteriores (y el error de arranque) lo mueven al h1.
  let versionVista: number | null = null;
  function enfocarTitulo(): void {
    document.querySelector<HTMLElement>("main h1")?.focus();
  }
  $effect(() => {
    const version = app.versionDePantalla;
    const fase = app.fase;
    if (fase === "error") {
      void tick().then(enfocarTitulo);
      return;
    }
    if (fase !== "lista") {
      versionVista = null;
      return;
    }
    if (versionVista === null) {
      versionVista = version;
      return;
    }
    if (version !== versionVista) {
      versionVista = version;
      window.scrollTo(0, 0);
      void tick().then(enfocarTitulo);
    }
  });

  // ---------- Reloj: "hoy" se refresca cada minuto y al volver a la pestaña ----------
  $effect(() => {
    if (app.fase !== "lista") return;
    const refrescar = (): void => app.actualizarReloj();
    const intervalo = setInterval(refrescar, MINUTO_MS);
    const alCambiarVisibilidad = (): void => {
      if (document.visibilityState === "visible") refrescar();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("focus", refrescar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("focus", refrescar);
    };
  });

  function saltarAlContenido(evento: MouseEvent): void {
    // El enlace no puede cambiar el hash: el enrutador lo leería como una ruta desconocida.
    evento.preventDefault();
    (document.querySelector<HTMLElement>("main h1") ?? document.getElementById("principal"))?.focus();
  }
</script>

<a class="saltar" href="#principal" onclick={saltarAlContenido}>{TEXTO_MARCO.saltar}</a>

<div class="pagina">
  <header>
    <BarraSuperior {acciones} />
    {#if app.fase === "lista"}
      <BarraApp
        perfil={app.perfil.tipo}
        {seccion}
        {seccionContieneLaPantalla}
        criticas={app.alertas?.resumen.criticas ?? 0}
        nombreConductor={app.perfil.tipo === "conductor" ? app.autor : undefined}
        alElegirPerfil={elegirPerfil}
        alCambiarConductor={pedirConductor}
      />
      {#if app.avisos.length > 0 || app.hayCambiosEnOtraPestana || errorAlCambiarVista !== ""}
        <div class="avisos contenedor">
          {#each app.avisos as aviso (aviso.tipo)}
            {#if aviso.tipo === "sin-almacenamiento"}
              <Aviso tono="semana" icono="alerta" rol="alert">{TEXTO_AVISO.sinAlmacenamiento}</Aviso>
            {:else if aviso.tipo === "datos-de-otra-fecha"}
              <Aviso tono="semana" icono="calendario" alCerrar={() => app.descartarAviso("datos-de-otra-fecha")}>
                {textoDatosDeOtraFecha(aviso.fechaBase)}
                {#snippet accion()}
                  <Boton variante="secundario" onclick={pedirReinicio}>{TEXTO_MARCO.reiniciarDemo}</Boton>
                {/snippet}
              </Aviso>
            {:else}
              <Aviso tono="neutro" icono="check" alCerrar={() => app.descartarAviso("esquema-actualizado")}>
                {TEXTO_AVISO.esquemaActualizado}
              </Aviso>
            {/if}
          {/each}
          {#if app.hayCambiosEnOtraPestana}
            <Aviso tono="quincena" icono="reiniciar">
              <p>{TEXTO_AVISO.cambiosEnOtraPestana}</p>
              {#if errorAlActualizar !== ""}<p class="error-aviso">{errorAlActualizar}</p>{/if}
              {#snippet accion()}
                <Boton variante="secundario" onclick={actualizar}>{TEXTO_MARCO.actualizar}</Boton>
              {/snippet}
            </Aviso>
          {/if}
          {#if errorAlCambiarVista !== ""}
            <Aviso tono="critico" icono="vencido" rol="alert" alCerrar={() => (errorAlCambiarVista = "")}>{errorAlCambiarVista}</Aviso>
          {/if}
        </div>
      {/if}
    {/if}
  </header>

  <main id="principal" class="contenedor">
    {#if app.fase === "arrancando"}
      <!-- 5.19: nada durante 300 ms; después, el texto y un <progress> indeterminado. La región existe desde el principio para que se anuncie. -->
      <div class="preparando" role="status">
        {#if app.preparando}
          <p id="texto-preparando">{TEXTO_AVISO.preparando}</p>
          <progress aria-labelledby="texto-preparando"></progress>
        {/if}
      </div>
    {:else if app.fase === "error"}
      <div class="encabezado">
        <div class="solo-angosto"><EtiquetaDemo /></div>
        <h1 tabindex="-1">{TEXTO_ERROR_ARRANQUE.titulo}</h1>
      </div>
      <p class="parrafo">{app.errorDeArranque}</p>
      {#if errorAlReiniciarDesdeError !== ""}
        <p class="error-vista parrafo" role="alert"><Icono nombre="vencido" /><span>{errorAlReiniciarDesdeError}</span></p>
      {/if}
      <div class="acciones-error">
        <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
      </div>
    {:else}
      <!-- Marcador: las pantallas llegan en los pasos 4.x. Cada una trae su propio h1 con tabindex="-1". -->
      <div class="encabezado">
        <div class="solo-angosto"><EtiquetaDemo /></div>
        <h1 tabindex="-1">{nombreDeLaPantalla}</h1>
      </div>
      <p class="parrafo nota">{TEXTO_MARCO.pantallaEnPreparacion}</p>
    {/if}
  </main>

  <Pie />
</div>

<!-- Lo que pasó sin que se vea en pantalla (por ejemplo, "Demo reiniciada"), para lectores de pantalla. -->
<div class="solo-lectores" role="status">{anuncio}</div>

<!-- Diálogos al final del body (5.17). -->
<DialogoComoFunciona bind:abierto={comoFunciona} />
<DialogoReiniciar
  bind:abierto={reiniciar}
  cargando={reiniciando}
  error={errorAlReiniciar}
  focoDestino={destinoDelFoco}
  alConfirmar={confirmarReinicio}
/>
<DialogoConductor
  bind:abierto={elegirConductor}
  {conductores}
  elegidoInicial={conductorActual}
  cargando={cambiandoPerfil}
  error={errorAlElegirConductor}
  focoDestino={destinoDelFoco}
  alConfirmar={confirmarConductor}
/>

<style>
  .pagina {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .avisos {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding-block: var(--e-3) 0;
  }
  main {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-4);
    padding-block: var(--e-5) var(--e-6);
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }
  .acciones-error {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-3);
  }
  .error-vista {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-weight: 600;
    color: var(--c-critico-t);
  }
  .error-vista :global(.icono) {
    margin-top: 0.2rem;
  }
  .error-aviso {
    font-weight: 600;
  }
  .preparando {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    width: min(100%, 24rem);
    color: var(--c-texto-2);
  }
  progress {
    width: 100%;
  }
</style>
