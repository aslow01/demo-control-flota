<script lang="ts">
  // El marco de la aplicación (docs/diseno-ui.md, secciones 2, 4, 5.2, 5.3, 5.18 y 5.19): enlace "Ir al contenido", barra superior,
  // barra de la aplicación con el selector de perfil, avisos globales, `main` (estado de arranque, error o la pantalla) y pie.
  // Lee todo del estado (`app`); no tiene reglas de negocio. El centro de alertas (4.2), la flota (4.3) y la ficha (4.4) son pantallas; las demás son un marcador hasta el paso 4.5.
  import { tick } from "svelte";
  import Aviso from "./componentes/Aviso.svelte";
  import BarraApp from "./componentes/BarraApp.svelte";
  import BarraSuperior from "./componentes/BarraSuperior.svelte";
  import Boton from "./componentes/Boton.svelte";
  import DialogoComoFunciona from "./componentes/DialogoComoFunciona.svelte";
  import DialogoConductor from "./componentes/DialogoConductor.svelte";
  import DialogoReiniciar from "./componentes/DialogoReiniciar.svelte";
  import EtiquetaDemo from "./componentes/EtiquetaDemo.svelte";
  import PantallaAlertas from "./componentes/PantallaAlertas.svelte";
  import PantallaFicha from "./componentes/PantallaFicha.svelte";
  import PantallaFlota from "./componentes/PantallaFlota.svelte";
  import Pie from "./componentes/Pie.svelte";
  import { TEXTO_MARCO, TEXTO_REINICIO } from "./componentes/textos-marco.ts";
  import type { ItemMenu, OpcionConductor, SeccionActiva } from "./componentes/tipos.ts";
  import { formatearPatente } from "./lib/dominio/patente.ts";
  import { TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, textoDatosDeOtraFecha } from "./lib/dominio/textos.ts";
  import { app } from "./lib/estado/instancia.ts";

  const TITULO_BASE = `${TEXTO_MARCO.nombreApp} (demo)`;
  const MINUTO_MS = 60_000;

  // ---------- Diálogos (5.17): "Cómo funciona", "Reiniciar demo" y "¿Quién completa el parte?" ----------
  let dialogoComoFuncionaAbierto = $state(false);
  let dialogoReiniciarAbierto = $state(false);
  let dialogoConductorAbierto = $state(false);

  // A dónde va el foco al cerrar un diálogo cuando el botón que lo abrió ya no sirve (o cuando hay una pantalla nueva): el h1.
  let irAlTitulo = false;
  function destinoDelFoco(): HTMLElement | null {
    if (!irAlTitulo) return null;
    irAlTitulo = false;
    return document.querySelector<HTMLElement>("main h1");
  }

  // Lo que pasó y no se ve en pantalla ("Demo reiniciada", "Flota de ejemplo lista"): una región `role="status"` que existe desde el
  // principio. Se vacía, se escribe unos 250 ms después (cuando el diálogo ya cerró y el foco volvió a su lugar) y se vuelve a vaciar
  // a los pocos segundos: así cada anuncio es una mutación nueva (también el 2.º y el 3.º) y no queda texto suelto.
  let anuncio = $state("");
  let plazoAnuncio: ReturnType<typeof setTimeout> | undefined;
  let plazoLimpiar: ReturnType<typeof setTimeout> | undefined;
  function anunciar(texto: string): void {
    clearTimeout(plazoAnuncio);
    clearTimeout(plazoLimpiar);
    anuncio = "";
    plazoAnuncio = setTimeout(() => {
      anuncio = texto;
      plazoLimpiar = setTimeout(() => (anuncio = ""), 6000);
    }, 250);
  }

  function abrirComoFunciona(): void {
    dialogoComoFuncionaAbierto = true;
  }

  // Reiniciar demo (solo con la demo cargada: desde la pantalla de error de arranque la única salida es recargar). El error se
  // muestra dentro del diálogo, que no se puede cerrar mientras trabaja.
  let reiniciando = $state(false);
  let errorAlReiniciar = $state("");

  function pedirReinicio(): void {
    errorAlReiniciar = "";
    dialogoReiniciarAbierto = true;
  }
  async function confirmarReinicio(): Promise<void> {
    if (reiniciando) return;
    const pantallaAntes = app.versionDePantalla;
    reiniciando = true;
    errorAlReiniciar = "";
    const r = await app.reiniciar();
    reiniciando = false;
    if (r.ok) {
      irAlTitulo = app.versionDePantalla !== pantallaAntes; // si cambió la pantalla, el foco va a su título
      dialogoReiniciarAbierto = false;
      anunciar(TEXTO_REINICIO.hecho);
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
    dialogoConductorAbierto = true;
  }
  async function confirmarConductor(conductorId: string): Promise<void> {
    if (cambiandoPerfil) return;
    cambiandoPerfil = true;
    errorAlElegirConductor = "";
    const r = await app.cambiarPerfil({ tipo: "conductor", conductorId });
    cambiandoPerfil = false;
    if (r.ok) {
      irAlTitulo = true; // cambió la pantalla: el foco va a su título, no al selector
      errorAlCambiarVista = ""; // un error viejo de "Encargado" ya no corresponde
      dialogoConductorAbierto = false;
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

  // Con el arranque en error no hay nada que reiniciar ni que explicar: solo se ofrece recargar (en `main`).
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
  const nombreDeLaPantalla = $derived(app.nombrePantalla);

  function elegirPerfil(tipo: "encargado" | "conductor"): void {
    if (tipo === "encargado") void elegirEncargado();
    else pedirConductor();
  }

  // ---------- D9: "Actualizar" ----------
  let errorAlActualizar = $state("");
  async function actualizar(): Promise<void> {
    const r = await app.actualizar();
    errorAlActualizar = r.ok ? "" : r.error.mensaje;
    // Con éxito el aviso desaparece (y con él el botón que tenía el foco): si no cambió la pantalla, el foco va al título.
    if (r.ok) void tick().then(enfocarTitulo);
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

  // "Preparando la flota de ejemplo…" solo se mostró si el arranque tardó: cuando termina, se avisa que está lista.
  let vioPreparando = false;
  $effect(() => {
    if (app.preparando) vioPreparando = true;
    else if (app.fase === "lista" && vioPreparando) {
      vioPreparando = false;
      anunciar(TEXTO_MARCO.listo);
    } else if (app.fase === "error") vioPreparando = false;
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
    {/if}
    <!-- Región viva siempre presente (vacía, sin relleno): lo que llega con la página abierta (D9) se anuncia como un cambio dentro de ella. -->
    <div class="avisos contenedor" class:hay={app.fase === "lista" && (app.avisos.length > 0 || app.hayCambiosEnOtraPestana)} role="status">
      {#if app.fase === "lista"}
        <div class="lista-avisos">
          {#each app.avisos as aviso (aviso.tipo)}
            {#if aviso.tipo === "sin-almacenamiento"}
              <Aviso tono="semana" icono="alerta">{TEXTO_AVISO.sinAlmacenamiento}</Aviso>
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
        </div>
      {/if}
    </div>
    <!-- El error de una acción de la persona (cambiar de vista) se inserta suelto y se anuncia como alerta. -->
    {#if app.fase === "lista" && errorAlCambiarVista !== ""}
      <div class="avisos contenedor hay">
        <Aviso tono="critico" icono="vencido" rol="alert" alCerrar={() => (errorAlCambiarVista = "")}>{errorAlCambiarVista}</Aviso>
      </div>
    {/if}
  </header>

  <main id="principal" class="contenedor" tabindex="-1">
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
      <div class="acciones-error">
        <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
      </div>
    {:else if app.ruta.tipo === "alertas"}
      <PantallaAlertas alAbrirParte={pedirConductor} />
    {:else if app.ruta.tipo === "flota"}
      <PantallaFlota />
    {:else if app.ruta.tipo === "unidad"}
      <!-- Una ficha nueva (otra patente, o el alta de una unidad) arranca limpia: filtro del historial, mensajes y diálogos. -->
      {#key app.versionDePantalla}
        <PantallaFicha />
      {/key}
    {:else}
      <!-- Marcador: las demás pantallas llegan en el paso 4.5. Cada una trae su propio h1 con tabindex="-1". -->
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
<DialogoComoFunciona bind:abierto={dialogoComoFuncionaAbierto} />
<DialogoReiniciar
  bind:abierto={dialogoReiniciarAbierto}
  cargando={reiniciando}
  error={errorAlReiniciar}
  focoDestino={destinoDelFoco}
  alConfirmar={confirmarReinicio}
/>
<DialogoConductor
  bind:abierto={dialogoConductorAbierto}
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
  /* La región viva existe siempre; sin avisos no ocupa lugar. */
  .avisos.hay {
    padding-block: var(--e-3) 0;
  }
  .lista-avisos {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
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
