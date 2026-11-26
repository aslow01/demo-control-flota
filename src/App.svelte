<script lang="ts">
  // El marco de la aplicación «tipo app» (docs/diseno-ui.md, secciones 2, 4, 5.17 a 5.19; el prototipo «Turno» manda donde difieren): enlace «Ir al contenido»,
  // lateral oscuro (escritorio), barra superior con «Atrás» y chip de perfil (celular y tableta), migas y fecha (escritorio), avisos globales,
  // `main` (estado de arranque, error o la pantalla) y barra inferior (celular y tableta). Lee todo del estado (`app`); no tiene reglas de negocio.
  // Pantallas: Inicio, Vencimientos, Operación diaria, Movilidades y «Más» (las del encargado); Hoy, Mis partes y el parte (las del conductor); y la ficha de una unidad.
  // La ficha, el parte, Hoy y Mis partes se bajan al entrar (trozos aparte). Una dirección que no corresponde a ninguna pantalla muestra «Página no encontrada».
  import { tick, untrack } from "svelte";
  import Aviso from "./componentes/Aviso.svelte";
  import BarraInferior, { type ItemNavegacion } from "./componentes/BarraInferior.svelte";
  import BarraSuperior from "./componentes/BarraSuperior.svelte";
  import Boton from "./componentes/Boton.svelte";
  import DialogoComoFunciona from "./componentes/DialogoComoFunciona.svelte";
  import DialogoConductor from "./componentes/DialogoConductor.svelte";
  import DialogoReiniciar from "./componentes/DialogoReiniciar.svelte";
  import EnlaceAccion from "./componentes/EnlaceAccion.svelte";
  import Lateral from "./componentes/Lateral.svelte";
  import Migas from "./componentes/Migas.svelte";
  import PantallaFlota from "./componentes/PantallaFlota.svelte";
  import PantallaInicio from "./componentes/PantallaInicio.svelte";
  import PantallaMas from "./componentes/PantallaMas.svelte";
  import PantallaOperacion from "./componentes/PantallaOperacion.svelte";
  import PantallaVencimientos from "./componentes/PantallaVencimientos.svelte";
  import { cuentasDeNavegacion } from "./componentes/insignias.ts";
  import { pedirCuenta } from "./componentes/movimiento.ts";
  import { TEXTO_MARCO, TEXTO_MAS, TEXTO_NAVEGACION, TEXTO_REINICIO } from "./componentes/textos-marco.ts";
  import type { OpcionConductor } from "./componentes/tipos.ts";
  import { aHash, migasDe, nombreDePantalla, rutaPorDefecto, type Ruta } from "./lib/estado/enrutador.ts";
  import { formatearFechaConDia } from "./lib/dominio/fechas.ts";
  import { NOMBRES_DE_PANTALLA, TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, TEXTO_ERROR_DESCARGA, TEXTO_ERROR_PANTALLA, textoDatosDeOtraFecha } from "./lib/dominio/textos.ts";
  import { app } from "./lib/estado/instancia.ts";

  const TITULO_BASE = `${TEXTO_MARCO.nombreApp} (demo)`;
  const MINUTO_MS = 60_000;

  // ---------- Diálogos (5.17): "Cómo funciona", "Reiniciar demo" y "Ver como" ----------
  let dialogoComoFuncionaAbierto = $state(false);
  let dialogoReiniciarAbierto = $state(false);
  let dialogoVerComoAbierto = $state(false);

  // A dónde va el foco al cerrar un diálogo cuando el botón que lo abrió ya no sirve (o cuando hay una pantalla nueva): el h1.
  let irAlTitulo = false;
  function destinoDelFoco(): HTMLElement | null {
    if (!irAlTitulo) return null;
    irAlTitulo = false;
    return document.querySelector<HTMLElement>("main h1");
  }

  // «Atrás» o «Adelante» con uno de estos diálogos abiertos cambia la pantalla de abajo: el diálogo se cierra con ella (no queda tapando otra pantalla) y el foco va al
  // título nuevo. Si está trabajando (reiniciando o cambiando de perfil) no se cierra: lo cierra su propio resultado.
  $effect(() => {
    void app.versionDePantalla;
    untrack(() => {
      const abiertos = dialogoComoFuncionaAbierto || (dialogoReiniciarAbierto && !reiniciando) || (dialogoVerComoAbierto && !cambiandoPerfil);
      if (!abiertos) return;
      irAlTitulo = true;
      dialogoComoFuncionaAbierto = false;
      if (!reiniciando) dialogoReiniciarAbierto = false;
      if (!cambiandoPerfil) dialogoVerComoAbierto = false;
      void tick().then(enfocarTitulo);
    });
  });

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
      pedirCuenta(); // la cifra cobre de Inicio vuelve a contar desde 0
      anunciar(TEXTO_REINICIO.hecho);
    } else {
      errorAlReiniciar = r.error.mensaje;
    }
  }

  // «Ver como»: elegir el perfil y, con Conductor, quién completa el parte. Lo abren el chip de la barra superior, el lateral, «Más» y «Abrir el parte diario» de Inicio
  // (este último con Conductor ya elegido). El error se muestra dentro del diálogo, que no se puede cerrar mientras trabaja.
  let cambiandoPerfil = $state(false);
  let errorAlCambiarPerfil = $state("");
  let perfilInicialDelDialogo = $state<"encargado" | "conductor">("encargado");
  /** El conductor que el diálogo trae elegido al abrirse desde «Probar como conductor» (Inicio); `null` = el del perfil actual. */
  let conductorInicialDelDialogo = $state<string | null>(null);
  const conductores = $derived<OpcionConductor[]>(app.opcionesDeConductor());
  const conductorActual = $derived(app.perfil.tipo === "conductor" ? app.perfil.conductorId : null);
  const opcionActual = $derived(conductores.find((c) => c.id === conductorActual));
  const esConductor = $derived(app.perfil.tipo === "conductor");
  const perfilTexto = $derived(esConductor ? TEXTO_MARCO.perfilConductor : TEXTO_MARCO.perfilEncargado);

  function pedirVerComo(inicial: "encargado" | "conductor" = app.perfil.tipo, conductorId: string | null = null): void {
    errorAlCambiarPerfil = "";
    perfilInicialDelDialogo = inicial;
    conductorInicialDelDialogo = conductorId;
    dialogoVerComoAbierto = true;
  }
  async function confirmarPerfil(perfil: { tipo: "encargado" } | { tipo: "conductor"; conductorId: string }): Promise<void> {
    if (cambiandoPerfil) return;
    // Sin cambios: se cierra y listo (volver a aplicar el mismo perfil llevaría a su inicio sin motivo).
    const igual = perfil.tipo === "encargado" ? !esConductor : conductorActual === perfil.conductorId;
    if (igual) {
      dialogoVerComoAbierto = false;
      return;
    }
    cambiandoPerfil = true;
    errorAlCambiarPerfil = "";
    const r = await app.cambiarPerfil(perfil);
    cambiandoPerfil = false;
    if (r.ok) {
      irAlTitulo = true; // cambió la pantalla: el foco va a su título, no al botón que abrió el diálogo
      dialogoVerComoAbierto = false;
    } else {
      errorAlCambiarPerfil = r.error.mensaje;
    }
  }

  // ---------- Navegación: destinos, insignias, «Atrás» y migas ----------
  // Cuentas de las insignias: las mismas cifras de Inicio y las dos solapas de Operación diaria (`app.centroDeAlertas`), no un cálculo aparte.
  const cuentas = $derived(cuentasDeNavegacion(app.centroDeAlertas));

  /** Qué destino de la navegación contiene la pantalla actual. `parte` es de Operación (encargado) o de Hoy (conductor). */
  function seccionDe(ruta: Ruta, conductor: boolean): string | null {
    switch (ruta.tipo) {
      case "inicio":
        return "inicio";
      case "movilidades":
      case "unidad":
        return "movilidades";
      case "vencimientos":
        return "vencimientos";
      case "operacion":
        return "operacion";
      case "conductor":
        return "hoy";
      case "mis-partes":
        return "partes";
      case "parte":
        return conductor ? "hoy" : "operacion";
      case "mas":
        return "mas";
      default:
        return null;
    }
  }
  const seccion = $derived(seccionDe(app.ruta, esConductor));
  /** `page` en la pantalla de la sección; `true` en la ficha o el parte, que están dentro de ella. */
  function actual(id: string): "page" | "true" | undefined {
    if (seccion !== id) return undefined;
    return app.ruta.tipo === "unidad" || app.ruta.tipo === "parte" ? "true" : "page";
  }
  const conInsignia = (cantidad: number, texto: string, critica: boolean): ItemNavegacion["insignia"] => (cantidad > 0 ? { cantidad, texto, critica } : undefined);

  const destinos = $derived.by(() => {
    const t = TEXTO_NAVEGACION;
    const solapa = app.ruta.tipo === "operacion" ? app.ruta.solapa : null;
    const pendientes = cuentas.checklists + cuentas.novedades;
    return {
      inicio: { id: "inicio", href: aHash({ tipo: "inicio" }), texto: NOMBRES_DE_PANTALLA.inicio, icono: "inicio", actual: actual("inicio"), insignia: conInsignia(cuentas.noDisponibles, t.insignias.noDisponibles(cuentas.noDisponibles), true) },
      movilidades: { id: "movilidades", href: aHash({ tipo: "movilidades" }), texto: NOMBRES_DE_PANTALLA.movilidades, icono: "unidad", actual: actual("movilidades") },
      vencimientos: { id: "vencimientos", href: aHash({ tipo: "vencimientos" }), texto: NOMBRES_DE_PANTALLA.vencimientos, icono: "calendario", actual: actual("vencimientos"), insignia: conInsignia(cuentas.vencidos, t.insignias.vencidosOFaltantes(cuentas.vencidos), true) },
      operacion: {
        id: "operacion",
        href: aHash({ tipo: "operacion", solapa: "checklists" }),
        texto: t.operacionCorto,
        textoOculto: t.operacionOculto,
        icono: "parte",
        actual: actual("operacion"),
        insignia: conInsignia(pendientes, t.insignias.pendientes(pendientes), false),
        subitems: [
          { id: "checklists", href: aHash({ tipo: "operacion", solapa: "checklists" }), texto: NOMBRES_DE_PANTALLA.operacionChecklists, actual: solapa === "checklists" ? "page" : undefined, insignia: conInsignia(cuentas.checklists, t.insignias.pendientes(cuentas.checklists), false) },
          { id: "novedades", href: aHash({ tipo: "operacion", solapa: "novedades" }), texto: NOMBRES_DE_PANTALLA.operacionNovedades, actual: solapa === "novedades" ? "page" : undefined, insignia: conInsignia(cuentas.novedades, t.insignias.abiertas(cuentas.novedades), false) },
        ],
      },
      hoy: { id: "hoy", href: aHash({ tipo: "conductor" }), texto: NOMBRES_DE_PANTALLA.conductor, icono: "parte", actual: actual("hoy") },
      partes: { id: "partes", href: aHash({ tipo: "mis-partes" }), texto: NOMBRES_DE_PANTALLA.conductorPartes, icono: "partes", actual: actual("partes") },
      mas: { id: "mas", href: aHash({ tipo: "mas" }), texto: NOMBRES_DE_PANTALLA.mas, icono: "mas", actual: actual("mas") },
    } satisfies Record<string, ItemNavegacion>;
  });
  // La barra inferior y el lateral van en el mismo orden (3.2.3 Navegación coherente); la barra suma «Más», que en el lateral es la pantalla de abajo.
  const itemsDeLaBarra = $derived<ItemNavegacion[]>(
    esConductor ? [destinos.hoy, destinos.partes, destinos.mas] : [destinos.inicio, destinos.movilidades, destinos.vencimientos, destinos.operacion, destinos.mas],
  );
  const itemsDelLateral = $derived<ItemNavegacion[]>(
    esConductor ? [destinos.hoy, destinos.partes] : [destinos.inicio, destinos.movilidades, destinos.vencimientos, destinos.operacion],
  );

  const lista = $derived(app.fase === "lista");
  const fecha = $derived(formatearFechaConDia(app.hoy));
  const enParte = $derived(app.ruta.tipo === "parte");
  const nombreDeLaPantalla = $derived(app.nombrePantalla);
  /** El nombre que se ve en la barra superior al bajar: el de la solapa en Operación diaria. */
  const tituloDeLaBarra = $derived(
    app.ruta.tipo === "operacion" ? (app.ruta.solapa === "checklists" ? NOMBRES_DE_PANTALLA.operacionChecklists : NOMBRES_DE_PANTALLA.operacionNovedades) : nombreDeLaPantalla,
  );
  // «Atrás» lleva al padre (la ficha, a Movilidades con el filtro y la búsqueda que tenía); en las pantallas de la barra no hay.
  const atras = $derived.by(() => {
    const padre = app.padre;
    if (padre === null) return null;
    const nombre = nombreDePantalla(padre);
    return { href: aHash(padre), texto: padre.tipo === "operacion" ? TEXTO_NAVEGACION.operacionCorto : nombre, nombreAccesible: TEXTO_NAVEGACION.volverA(nombre) };
  });
  // Migas: las pantallas de la barra llevan un solo tramo (su nombre); la primera miga de las demás vuelve al padre tal como estaba.
  const tramos = $derived.by(() => {
    const migas = migasDe(app.ruta, app.perfil);
    if (migas.length === 0) return [{ nombre: tituloDeLaBarra, href: null }];
    return migas.map((m, i) => ({ nombre: m.nombre, href: m.ruta === null ? null : aHash(i === 0 && app.padre !== null ? app.padre : m.ruta) }));
  });
  const descripcionDelPerfil = $derived(
    !esConductor
      ? TEXTO_MAS.verComo.encargadoDescripcion
      : opcionActual === undefined
        ? ""
        : opcionActual.unidad === null
          ? TEXTO_MAS.verComo.conductorDescripcionSinUnidad(opcionActual.nombre)
          : TEXTO_MAS.verComo.conductorDescripcion(opcionActual.nombre, opcionActual.unidad),
  );
  const perfilDelLateral = $derived(esConductor ? TEXTO_NAVEGACION.conductorCorto(app.autor.split(" ")[0] ?? app.autor) : perfilTexto);
  // Título de pestaña propio del parte («Parte enviado», «No se puede cargar este parte», «No se encontró la unidad»): `PantallaParte` lo informa con `bind:titulo`.
  let tituloDelParte = $state("");

  // ---------- D9: "Actualizar" ----------
  let errorAlActualizar = $state("");
  async function actualizar(): Promise<void> {
    const r = await app.actualizar();
    errorAlActualizar = r.ok ? "" : r.error.mensaje;
    // Con éxito el aviso desaparece (y con él el botón que tenía el foco): si no cambió la pantalla, el foco va al título.
    if (r.ok) void tick().then(enfocarTitulo);
  }

  // Si se intenta escribir (enviar, guardar, cambiar de perfil) con cambios de otra pestaña sin actualizar, el error manda a «Actualizar en el aviso»: el aviso está arriba de
  // todo y en el celular, con la página desplazada, queda fuera de la vista. Se lo trae a la vista (sin tocar el foco: lo escrito sigue donde estaba).
  let regionDeAvisos = $state<HTMLElement>();
  let bloqueosVistos = 0;
  $effect(() => {
    const bloqueos = app.bloqueosPorOtraPestana;
    if (bloqueos === bloqueosVistos) return;
    bloqueosVistos = bloqueos;
    // Después del siguiente cuadro: el error que acaba de aparecer en la pantalla también mueve la vista, y esta tiene que ser la última.
    void tick().then(() => requestAnimationFrame(() => regionDeAvisos?.scrollIntoView({ block: "start" })));
  });

  // ---------- Título, foco y desplazamiento al cambiar de pantalla ----------
  $effect(() => {
    document.title = app.fase !== "lista" ? TITULO_BASE : app.ruta.tipo === "parte" && tituloDelParte !== "" ? `${tituloDelParte} · ${TITULO_BASE}` : app.titulo;
  });

  // La primera pantalla no roba el foco al cargar: solo los cambios posteriores (y el error de arranque) lo mueven al h1.
  // La ficha, el parte y el conductor se bajan al entrar (`{#await import()}`): si todavía no llegaron no hay h1, y el foco queda
  // pendiente hasta que llegan (`alLlegarLaPantalla`). Sin esto, la primera apertura con red lenta dejaría el foco en el `body`.
  let versionVista: number | null = null;
  let tituloPendiente = false;
  function enfocarTitulo(): void {
    const titulo = document.querySelector<HTMLElement>("main h1");
    tituloPendiente = titulo === null;
    titulo?.focus();
  }
  function alLlegarLaPantalla(): void {
    if (tituloPendiente) void tick().then(enfocarTitulo);
  }
  // Un trozo que no se pudo bajar (sin red, o un trozo de una versión anterior): título y «Recargar»; el foco va a ese título.
  function alMostrarseElErrorDeCarga(): void {
    void tick().then(enfocarTitulo);
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

  // Si una pantalla falla al dibujarse (datos dañados que el arranque no detectó), la red de seguridad de `main` muestra el error y el marco
  // sigue andando. Al cambiar de pantalla se vuelve a intentar: sin esto, el error quedaría pegado aunque la persona navegue.
  let reponerPantalla: (() => void) | null = null;
  $effect(() => {
    void app.versionDePantalla;
    const reponer = reponerPantalla;
    reponerPantalla = null;
    reponer?.();
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

<!-- Mientras llega el trozo de la ficha, el parte o el conductor: lo mismo que el arranque (nada al principio, después el texto y un
     <progress> indeterminado). Al desmontarse (llegó la pantalla, o se fue a otra) se devuelve el foco al título si había quedado pendiente. -->
{#snippet cargandoPantalla()}
  <div class="preparando diferida" role="status" {@attach () => alLlegarLaPantalla}>
    <p id="texto-cargando">{TEXTO_MARCO.cargandoPantalla}</p>
    <progress aria-labelledby="texto-cargando"></progress>
  </div>
{/snippet}

{#snippet errorDeCarga()}
  <h1 tabindex="-1" {@attach () => alMostrarseElErrorDeCarga()}>{TEXTO_ERROR_DESCARGA.titulo}</h1>
  <p class="parrafo">{TEXTO_ERROR_DESCARGA.mensaje}</p>
  <div class="acciones-error">
    <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
  </div>
{/snippet}

<a class="saltar" href="#principal" onclick={saltarAlContenido}>{TEXTO_MARCO.saltar}</a>

<div class="app">
  <Lateral
    items={itemsDelLateral}
    cargada={lista}
    inicioHref={aHash(rutaPorDefecto(app.perfil))}
    masHref={aHash({ tipo: "mas" })}
    masActual={app.ruta.tipo === "mas" ? "page" : undefined}
    perfilTexto={perfilDelLateral}
    alComoFunciona={abrirComoFunciona}
    alReiniciar={pedirReinicio}
    alVerComo={() => pedirVerComo()}
  />

  <div class="marco">
    <BarraSuperior cargada={lista} {atras} titulo={tituloDeLaBarra} perfil={perfilTexto} {esConductor} {fecha} alVerComo={() => pedirVerComo()} />
    {#if lista}
      <header class="barra-escritorio">
        <div class="ancho interior">
          <Migas {tramos} />
          <span class="fecha">{fecha}</span>
        </div>
      </header>
    {/if}
    <!-- Región viva siempre presente (vacía, sin relleno): lo que llega con la página abierta (D9) se anuncia como un cambio dentro de ella. -->
    <div class="avisos ancho" class:hay={lista && (app.avisos.length > 0 || app.hayCambiosEnOtraPestana)} role="status" bind:this={regionDeAvisos}>
      {#if app.fase === "lista"}
        <div class="lista-avisos">
          {#each app.avisos as aviso (aviso.tipo)}
            {#if aviso.tipo === "sin-almacenamiento"}
              <Aviso tono="semana" icono="alerta">{TEXTO_AVISO.sinAlmacenamiento}</Aviso>
            {:else if aviso.tipo === "almacenamiento-perdido"}
              <Aviso tono="semana" icono="alerta">{TEXTO_AVISO.almacenamientoPerdido}</Aviso>
            {:else if aviso.tipo === "datos-de-otra-fecha"}
              <Aviso tono="semana" icono="calendario" alCerrar={() => app.descartarAviso("datos-de-otra-fecha")}>
                {textoDatosDeOtraFecha(aviso.fechaBase)}
                {#snippet boton()}
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
              {#snippet boton()}
                <Boton variante="secundario" onclick={actualizar}>{TEXTO_MARCO.actualizar}</Boton>
              {/snippet}
            </Aviso>
          {/if}
        </div>
      {/if}
    </div>

    <main id="principal" class="ancho" class:en-parte={enParte} tabindex="-1">
      <svelte:boundary onerror={(_error, reponer) => (reponerPantalla = reponer)}>
        {#if app.fase === "arrancando"}
          <!-- 5.19: nada durante 300 ms; después, el texto y un <progress> indeterminado. La región existe desde el principio para que se anuncie. -->
          <div class="preparando" role="status">
            {#if app.preparando}
              <p id="texto-preparando">{TEXTO_AVISO.preparando}</p>
              <progress aria-labelledby="texto-preparando"></progress>
            {/if}
          </div>
        {:else if app.fase === "error"}
          <h1 tabindex="-1">{TEXTO_ERROR_ARRANQUE.titulo}</h1>
          <p class="parrafo">{app.errorDeArranque}</p>
          <div class="acciones-error">
            <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
          </div>
        {:else if app.ruta.tipo === "inicio"}
          <PantallaInicio alAbrirParte={() => pedirVerComo("conductor")} alProbarComoConductor={(conductorId) => pedirVerComo("conductor", conductorId)} />
        {:else if app.ruta.tipo === "vencimientos"}
          <PantallaVencimientos />
        {:else if app.ruta.tipo === "operacion"}
          <PantallaOperacion alAbrirParte={() => pedirVerComo("conductor")} />
        {:else if app.ruta.tipo === "movilidades"}
          <PantallaFlota />
        {:else if app.ruta.tipo === "mas"}
          <PantallaMas perfil={perfilTexto} {descripcionDelPerfil} alCambiarPerfil={() => pedirVerComo()} alComoFunciona={abrirComoFunciona} alReiniciar={pedirReinicio} />
        {:else if app.ruta.tipo === "unidad"}
          <!-- Una ficha nueva (otra patente, o el alta de una unidad) arranca limpia: filtro del historial, mensajes y diálogos. -->
          {#key app.versionDePantalla}
            {#await import("./componentes/PantallaFicha.svelte")}
              {@render cargandoPantalla()}
            {:then { default: PantallaFicha }}
              <PantallaFicha />
            {:catch}
              {@render errorDeCarga()}
            {/await}
          {/key}
        {:else if app.ruta.tipo === "conductor"}
          {#await import("./componentes/PantallaConductor.svelte")}
            {@render cargandoPantalla()}
          {:then { default: PantallaConductor }}
            <PantallaConductor />
          {:catch}
            {@render errorDeCarga()}
          {/await}
        {:else if app.ruta.tipo === "mis-partes"}
          {#await import("./componentes/PantallaMisPartes.svelte")}
            {@render cargandoPantalla()}
          {:then { default: PantallaMisPartes }}
            <PantallaMisPartes />
          {:catch}
            {@render errorDeCarga()}
          {/await}
        {:else if app.ruta.tipo === "parte"}
          <!-- Un parte nuevo (otra unidad u otra fecha) arranca limpio: formulario, errores y el panel de «Parte enviado». -->
          {#key app.versionDePantalla}
            {#await import("./componentes/PantallaParte.svelte")}
              {@render cargandoPantalla()}
            {:then { default: PantallaParte }}
              <PantallaParte bind:titulo={tituloDelParte} />
            {:catch}
              {@render errorDeCarga()}
            {/await}
          {/key}
        {:else}
          <!-- Una dirección que no corresponde a ninguna pantalla (8: Error): nunca una pantalla en blanco, y el camino de vuelta. -->
          <h1 tabindex="-1">{nombreDeLaPantalla}</h1>
          <p class="parrafo">{TEXTO_MARCO.paginaNoEncontrada}</p>
          <div><EnlaceAccion href={aHash(rutaPorDefecto(app.perfil))}>{TEXTO_MARCO.irA(nombreDePantalla(rutaPorDefecto(app.perfil)))}</EnlaceAccion></div>
        {/if}
        {#snippet failed()}
          <h1 tabindex="-1">{TEXTO_ERROR_PANTALLA.titulo}</h1>
          <p class="parrafo">{TEXTO_ERROR_PANTALLA.mensaje}</p>
          <div class="acciones-error">
            <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
            <Boton variante="secundario" onclick={pedirReinicio}>{TEXTO_MARCO.reiniciarDemo}</Boton>
          </div>
        {/snippet}
      </svelte:boundary>
    </main>
  </div>
</div>

<BarraInferior items={itemsDeLaBarra} oculta={enParte || !lista} />

<!-- Lo que pasó sin que se vea en pantalla (por ejemplo, "Demo reiniciada"), para lectores de pantalla. -->
<div class="solo-lectores" role="status">{anuncio}</div>

<!-- Diálogos al final del body (5.17). -->
<DialogoComoFunciona bind:abierto={dialogoComoFuncionaAbierto} focoDestino={destinoDelFoco} />
<DialogoReiniciar
  bind:abierto={dialogoReiniciarAbierto}
  cargando={reiniciando}
  error={errorAlReiniciar}
  focoDestino={destinoDelFoco}
  alConfirmar={confirmarReinicio}
/>
<DialogoConductor
  bind:abierto={dialogoVerComoAbierto}
  perfilInicial={perfilInicialDelDialogo}
  {conductores}
  elegidoInicial={conductorInicialDelDialogo ?? conductorActual}
  cargando={cambiandoPerfil}
  error={errorAlCambiarPerfil}
  focoDestino={destinoDelFoco}
  alConfirmar={confirmarPerfil}
/>

<style>
  /* El foco y el desplazamiento de «saltar al foco» no quedan bajo las barras fijas: arriba la superior (con su franja), abajo la inferior; en escritorio, arriba la de migas. */
  :global(html) {
    scroll-padding-top: calc(var(--alto-barra) + var(--alto-franja) + var(--e-4));
    scroll-padding-bottom: calc(var(--alto-pestanas) + var(--e-4));
  }
  @media (min-width: 64rem) {
    :global(html) {
      scroll-padding-top: 4.5rem;
      scroll-padding-bottom: var(--e-4);
    }
  }

  /* Celular y tableta: una columna. Desde 64 rem el lateral fijo a la izquierda y el marco a la derecha. */
  .app {
    min-height: 100vh;
    min-height: 100dvh;
  }
  .marco {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 100vh;
    min-height: 100dvh;
  }
  @media (min-width: 64rem) {
    .app {
      display: grid;
      grid-template-columns: var(--ancho-lateral) minmax(0, 1fr);
    }
  }

  /* Ancho y medianil del contenido: alineados con las migas y la fecha de la barra de escritorio. Pegado a la izquierda, no centrado. */
  .ancho {
    width: 100%;
    max-width: 82.5rem;
    padding-inline: var(--gutter);
  }

  /* Barra de escritorio: migas a la izquierda y la fecha a la derecha. Fija arriba al desplazar. */
  .barra-escritorio {
    display: none;
  }
  @media (min-width: 64rem) {
    .barra-escritorio {
      display: block;
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--c-fondo);
      border-bottom: 1px solid var(--c-borde);
      color: var(--c-texto-2);
      font-size: var(--t-tabla);
    }
    .interior {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e-4);
      min-height: 3.5rem;
    }
    .fecha {
      flex: none;
    }
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
    /* Abajo deja lugar a la barra inferior fija (en el parte no hay: manda la barra de envío). */
    padding-block: var(--e-5) calc(var(--alto-pestanas) + env(safe-area-inset-bottom, 0px) + var(--e-6));
  }
  main.en-parte {
    padding-bottom: var(--e-6);
  }
  @media (min-width: 64rem) {
    main {
      padding-bottom: var(--e-7);
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
  /* Los trozos locales llegan en un instante: el texto no aparece hasta pasados 300 ms (como en el arranque) para que no parpadee. */
  .diferida {
    animation: aparecer-tarde 0s linear 300ms backwards;
  }
  @keyframes aparecer-tarde {
    from {
      visibility: hidden;
    }
  }
</style>