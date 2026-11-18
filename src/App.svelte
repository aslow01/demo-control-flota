<script lang="ts">
  // El marco de la aplicación (docs/diseno-ui.md, secciones 2, 4, 5.2, 5.3, 5.18 y 5.19): enlace "Ir al contenido", barra superior,
  // barra de la aplicación con el selector de perfil, avisos globales, `main` (estado de arranque, error o la pantalla) y pie.
  // Lee todo del estado (`app`); no tiene reglas de negocio. Las pantallas internas son un marcador hasta los pasos 4.x.
  import { tick } from "svelte";
  import Aviso from "./componentes/Aviso.svelte";
  import BarraApp from "./componentes/BarraApp.svelte";
  import BarraSuperior from "./componentes/BarraSuperior.svelte";
  import Boton from "./componentes/Boton.svelte";
  import EtiquetaDemo from "./componentes/EtiquetaDemo.svelte";
  import Pie from "./componentes/Pie.svelte";
  import { TEXTO_MARCO } from "./componentes/textos-marco.ts";
  import type { ItemMenu, SeccionActiva } from "./componentes/tipos.ts";
  import { TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, textoDatosDeOtraFecha } from "./lib/dominio/textos.ts";
  import { app } from "./lib/estado/instancia.ts";

  const TITULO_BASE = `${TEXTO_MARCO.nombreApp} (demo)`;
  const MINUTO_MS = 60_000;

  // ---------- Acciones del marco (barra superior y menú "Más") ----------
  // TODO(3.4): "Cómo funciona" y "Reiniciar demo" abren diálogos (5.17) que todavía no existen; hasta entonces no hacen nada.
  function abrirComoFunciona(): void {}
  function pedirReinicio(): void {}
  // TODO(3.4): elegir "Conductor" o "Cambiar" abre el diálogo "¿Quién completa el parte?"; el estado ya tiene `cambiarPerfil`.
  function pedirConductor(): void {}

  // Con el arranque en error no hay almacenamiento donde actuar: solo se ofrece recargar (en `main`).
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
    if (tipo === "encargado") void app.cambiarPerfil({ tipo: "encargado" });
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
      {#if app.avisos.length > 0 || app.hayCambiosEnOtraPestana}
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
              {TEXTO_AVISO.cambiosEnOtraPestana}{#if errorAlActualizar !== ""}{" "}{errorAlActualizar}{/if}
              {#snippet accion()}
                <Boton variante="secundario" onclick={actualizar}>{TEXTO_MARCO.actualizar}</Boton>
              {/snippet}
            </Aviso>
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
      <div><Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton></div>
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
