<script lang="ts">
  // El marco de la aplicación «tipo app» (docs/diseno-ui.md, secciones 2, 4, 5.17 a 5.19; el prototipo «Turno» manda donde difieren): enlace «Ir al contenido»,
  // lateral oscuro (escritorio), barra superior con «Atrás» y chip de perfil (celular y tableta), migas y fecha (escritorio), avisos globales,
  // `main` (estado de arranque, error o la pantalla) y barra inferior (celular y tableta). Lee todo del estado (`app`); no tiene reglas de negocio.
  // Pantallas: Inicio, Vencimientos, Operación diaria, Movilidades y «Más» (las del encargado); Hoy, Mis partes y el parte (las del conductor); y la ficha de una unidad.
  // Solo Inicio viaja con el marco; las demás pantallas (Vencimientos, Operación diaria, Movilidades, «Más», la ficha, el parte, Hoy y Mis partes) se bajan al entrar (trozos aparte). Una dirección que no corresponde a ninguna pantalla muestra «Página no encontrada».
  import { tick, untrack } from "svelte";
  import Aviso from "./componentes/Aviso.svelte";
  import BarraInferior, { type ItemNavegacion } from "./componentes/BarraInferior.svelte";
  import BarraSuperior from "./componentes/BarraSuperior.svelte";
  import Boton from "./componentes/Boton.svelte";
  import DialogoComoFunciona from "./componentes/DialogoComoFunciona.svelte";
  import DialogoConductor from "./componentes/DialogoConductor.svelte";
  import DialogoReiniciar from "./componentes/DialogoReiniciar.svelte";
  import EnlaceAccion from "./componentes/EnlaceAccion.svelte";
  import { entrada } from "./componentes/entrada.ts";
  import Lateral from "./componentes/Lateral.svelte";
  import { codigoDeLamina, padreDeLamina } from "./componentes/lamina.ts";
  import Migas from "./componentes/Migas.svelte";
  import PantallaInicio from "./componentes/PantallaInicio.svelte";
  import SelloDatos from "./componentes/SelloDatos.svelte";
  import { cuentasDeNavegacion } from "./componentes/insignias.ts";
  import { TEXTO_MARCO, TEXTO_MAS, TEXTO_NAVEGACION, TEXTO_REINICIO } from "./componentes/textos-marco.ts";
  import type { OpcionConductor } from "./componentes/tipos.ts";
  import { bajar, esVersionNueva, PLAZO_DE_DESCARGA_MS } from "./lib/descarga.ts";
  import { conSugerencias, PLAZO_DE_SUGERENCIAS_MS } from "./lib/estado/conductor-opciones.ts";
  import { aHash, nombreDePantalla, rutaPorDefecto, type Ruta } from "./lib/estado/enrutador.ts";
  import { formatearFechaConDia } from "./lib/dominio/fechas.ts";
  import { NOMBRES_DE_PANTALLA, TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, TEXTO_ERROR_DESCARGA, TEXTO_ERROR_PANTALLA, textoDatosDeOtraFecha } from "./lib/dominio/textos-base.ts";
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
      entrada.reiniciar(); // la entrada de Inicio y de Hoy vuelve a pedirse (15.10); la que sigue en pantalla arranca de nuevo
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
  // Las opciones (quién, con qué unidad) son livianas y viajan con el marco: de ellas sale también de quién es la vista de ahora.
  const opcionesDeConductor = $derived(app.opcionesDeConductor());
  const conductorActual = $derived(app.perfil.tipo === "conductor" ? app.perfil.conductorId : null);
  const opcionActual = $derived(opcionesDeConductor.find((c) => c.id === conductorActual));
  // Las marcas «Para probar» del diálogo salen de `estado/conductor.ts`, que no viaja con el marco (arma el inicio de cada conductor): se baja la primera vez que se abre «Ver como».
  // Hasta entonces, y si no baja, las opciones van sin marcas. Calcularlas es lo caro del diálogo, así que solo se leen con el diálogo abierto: cerrado (sigue montado, con su
  // lista) nadie las lee y un cambio de estado, como el autoguardado del parte, no las vuelve a calcular. Al reabrirlo se calculan de nuevo solo si algo cambió.
  let trozoDelConductor = $state.raw<typeof import("./lib/estado/conductor.ts") | null>(null);
  const sugerencias = $derived(trozoDelConductor?.leerSugerenciasDeVerComo(app) ?? null);
  const conductores = $derived<OpcionConductor[]>(conSugerencias(opcionesDeConductor, dialogoVerComoAbierto ? sugerencias : null));
  const esConductor = $derived(app.perfil.tipo === "conductor");
  const perfilTexto = $derived(esConductor ? TEXTO_MARCO.perfilConductor : TEXTO_MARCO.perfilEncargado);

  /** Cuánto se espera en silencio a las sugerencias antes de decir que «Ver como» se está abriendo (lo mismo que el arranque y las pantallas: 300 ms). */
  const DEMORA_DEL_AVISO_MS = 300;

  async function pedirVerComo(inicial: "encargado" | "conductor" = app.perfil.tipo, conductorId: string | null = null): Promise<void> {
    // Primero las sugerencias (un pedido chico, solo la primera vez). Con un plazo corto: si no llegan a tiempo el diálogo se abre igual, sin ellas, y la próxima vez se vuelven a pedir.
    if (trozoDelConductor === null) {
      // Si tardan, el botón no queda mudo: un mensaje de estado dice que se está abriendo. Se retira al terminar la espera (si otro anuncio ya ocupó su lugar, no se toca).
      const aviso = setTimeout(() => (anuncio = TEXTO_MARCO.abriendoVerComo), DEMORA_DEL_AVISO_MS);
      trozoDelConductor = await bajar(() => import("./lib/estado/conductor.ts"), { plazoMs: PLAZO_DE_SUGERENCIAS_MS }).catch(() => null);
      clearTimeout(aviso);
      if (anuncio === TEXTO_MARCO.abriendoVerComo) anuncio = "";
    }
    // Si mientras bajaban se abrió otro diálogo (o este mismo, con un segundo clic), no se le pone uno encima.
    if (document.querySelector("dialog[open]") !== null) return;
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
  // La insignia de Inicio avisa desde las otras pantallas que hay unidades que no pueden salir; estando en Inicio repite la cifra grande de al lado, así que ahí no se muestra.
  const conInsignia = (cantidad: number, texto: string, critica: boolean): ItemNavegacion["insignia"] => (cantidad > 0 ? { cantidad, texto, critica } : undefined);

  const destinos = $derived.by(() => {
    const t = TEXTO_NAVEGACION;
    const pendientes = cuentas.partes + cuentas.novedades;
    return {
      inicio: { id: "inicio", href: aHash({ tipo: "inicio" }), texto: NOMBRES_DE_PANTALLA.inicio, icono: "inicio", actual: actual("inicio"), insignia: app.ruta.tipo === "inicio" ? undefined : conInsignia(cuentas.noDisponibles, t.insignias.noDisponibles(cuentas.noDisponibles), true) },
      movilidades: { id: "movilidades", href: aHash({ tipo: "movilidades" }), texto: NOMBRES_DE_PANTALLA.movilidades, icono: "unidad", actual: actual("movilidades") },
      vencimientos: { id: "vencimientos", href: aHash({ tipo: "vencimientos" }), texto: NOMBRES_DE_PANTALLA.vencimientos, icono: "calendario", actual: actual("vencimientos"), insignia: conInsignia(cuentas.vencidos, t.insignias.vencidosOFaltantes(cuentas.vencidos), true) },
      operacion: {
        id: "operacion",
        href: aHash({ tipo: "operacion", solapa: "partes" }),
        texto: t.operacionCorto,
        textoOculto: t.operacionOculto,
        icono: "parte",
        actual: actual("operacion"),
        insignia: conInsignia(pendientes, t.insignias.pendientes(pendientes), false),
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
    app.ruta.tipo === "operacion" ? (app.ruta.solapa === "partes" ? NOMBRES_DE_PANTALLA.operacionPartes : NOMBRES_DE_PANTALLA.operacionNovedades) : nombreDeLaPantalla,
  );
  // «Atrás» lleva al padre (la ficha, a Movilidades con el filtro y la búsqueda que tenía); en las pantallas de la barra no hay. El mismo enlace va en el encabezado de lámina del escritorio
  // (15.4.3), junto al código de la lámina («FL-01» a «FL-09»).
  const atras = $derived(app.padre === null ? null : padreDeLamina(app.padre));
  const codigoDeLaLamina = $derived(codigoDeLamina(app.ruta));
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
  // Dónde estaba el foco cuando el cambio de pantalla lo dejó pendiente (el enlace que se pulsó, o el cuerpo): si al llegar la pantalla sigue ahí, nadie lo movió.
  let focoAlCambiar: Element | null = null;
  function enfocarTitulo(): void {
    const titulo = document.querySelector<HTMLElement>("main h1");
    tituloPendiente = titulo === null;
    if (titulo === null) focoAlCambiar = document.activeElement;
    titulo?.focus();
  }
  function alLlegarLaPantalla(): void {
    if (!tituloPendiente) return;
    // Si la persona movió el foco mientras la pantalla bajaba (siguió con Tab, abrió un diálogo), no se lo quitamos (2.4.3).
    const activo = document.activeElement;
    if (activo !== null && activo !== document.body && activo !== focoAlCambiar) {
      tituloPendiente = false;
      return;
    }
    void tick().then(enfocarTitulo);
  }
  // Cada pantalla se baja al entrar, con un plazo: una que no responde (la conexión se cortó a medio camino) no queda en «Cargando la pantalla…» para siempre.
  function bajarPantalla<T>(cargar: () => Promise<T>): Promise<T> {
    return bajar(cargar, { plazoMs: PLAZO_DE_DESCARGA_MS });
  }
  // Un trozo que no se pudo bajar (sin red, sin respuesta, o un trozo de una versión anterior que ya no está): título y «Recargar»; el foco va a ese título.
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

{#snippet errorDeCarga(error: unknown)}
  <h1 tabindex="-1" {@attach () => alMostrarseElErrorDeCarga()}>{TEXTO_ERROR_DESCARGA.titulo}</h1>
  <p class="parrafo">{esVersionNueva(error) ? TEXTO_ERROR_DESCARGA.versionNueva : TEXTO_ERROR_DESCARGA.mensaje}</p>
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
    <BarraSuperior cargada={lista} {atras} titulo={tituloDeLaBarra} perfil={perfilTexto} {esConductor} alVerComo={() => pedirVerComo()} />
    <!-- La barra de escritorio existe también durante el arranque (vacía, con su alto): al llegar los datos nada se corre. -->
    <header class="barra-escritorio">
      <div class="ancho interior">
        {#if lista}
          <Migas codigo={codigoDeLaLamina} padre={atras} />
          <div class="datos-lamina">
            <SelloDatos />
            <span class="fecha">{fecha}</span>
          </div>
        {/if}
      </div>
    </header>
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
      <!-- Renglón de lámina (15.4.4): solo por debajo de 64 rem (en escritorio la misma información está en la barra) y primero en `main`, antes del `h1`. A la derecha, la fecha (pantallas del menú)
           o el sello (ficha, parte y cualquier pantalla angosta de menos de 22,5 rem, donde la barra no lo lleva): es el mismo dato en dos lugares y la hoja de estilos deja uno solo a la vista. -->
      {#if lista && codigoDeLaLamina !== null}
        <p class="renglon-lamina" class:con-padre={atras !== null}>
          <span class="lamina-codigo" aria-hidden="true">{codigoDeLaLamina}</span>
          <span class="lamina-fecha">{fecha}</span>
          <SelloDatos />
        </p>
      {/if}
      <svelte:boundary onerror={(_error, reponer) => (reponerPantalla = reponer)}>
        {#if app.fase === "arrancando"}
          <!-- El cuadro cero de la regla (15.4.6): la caja vacía, sin ningún dato falso, con el alto de la regla real (la hoja de estilos reserva arriba el del encabezado de la pantalla), así
               al llegar los datos la regla aparece en el mismo lugar. 5.19: nada durante 300 ms; después, el texto y un <progress> indeterminado. La región existe desde el principio para que se anuncie. -->
          <div class="cuadro-cero">
            <div class="cuadro-cero-reserva" aria-hidden="true"></div>
            <div class="cuadro-cero-caja">
              <div class="preparando" role="status">
                {#if app.preparando}
                  <p id="texto-preparando">{TEXTO_AVISO.preparando}</p>
                  <progress aria-labelledby="texto-preparando"></progress>
                {/if}
              </div>
            </div>
            <div class="cuadro-cero-escala" aria-hidden="true"></div>
          </div>
        {:else if app.fase === "error"}
          <h1 tabindex="-1">{TEXTO_ERROR_ARRANQUE.titulo}</h1>
          <div class="ficha-error" data-tono="critico"><p class="parrafo">{app.errorDeArranque}</p></div>
          <div class="acciones-error">
            <Boton onclick={() => window.location.reload()}>{TEXTO_MARCO.recargar}</Boton>
          </div>
        {:else if app.ruta.tipo === "inicio"}
          <PantallaInicio alAbrirParte={() => pedirVerComo("conductor")} alProbarComoConductor={(conductorId) => pedirVerComo("conductor", conductorId)} />
        {:else if app.ruta.tipo === "vencimientos"}
          {#await bajarPantalla(() => import("./componentes/PantallaVencimientos.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaVencimientos }}
            <PantallaVencimientos />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "operacion"}
          {#await bajarPantalla(() => import("./componentes/PantallaOperacion.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaOperacion }}
            <PantallaOperacion alAbrirParte={() => pedirVerComo("conductor")} />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "movilidades"}
          {#await bajarPantalla(() => import("./componentes/PantallaFlota.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaFlota }}
            <PantallaFlota />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "mas"}
          {#await bajarPantalla(() => import("./componentes/PantallaMas.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaMas }}
            <PantallaMas perfil={perfilTexto} {descripcionDelPerfil} alCambiarPerfil={() => pedirVerComo()} alComoFunciona={abrirComoFunciona} alReiniciar={pedirReinicio} />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "unidad"}
          <!-- Una ficha nueva (otra patente, o el alta de una unidad) arranca limpia: filtro del historial, mensajes y diálogos. -->
          {#key app.versionDePantalla}
            {#await bajarPantalla(() => import("./componentes/PantallaFicha.svelte"))}
              {@render cargandoPantalla()}
            {:then { default: PantallaFicha }}
              <PantallaFicha />
            {:catch error}
              {@render errorDeCarga(error)}
            {/await}
          {/key}
        {:else if app.ruta.tipo === "conductor"}
          {#await bajarPantalla(() => import("./componentes/PantallaConductor.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaConductor }}
            <PantallaConductor />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "mis-partes"}
          {#await bajarPantalla(() => import("./componentes/PantallaMisPartes.svelte"))}
            {@render cargandoPantalla()}
          {:then { default: PantallaMisPartes }}
            <PantallaMisPartes />
          {:catch error}
            {@render errorDeCarga(error)}
          {/await}
        {:else if app.ruta.tipo === "parte"}
          <!-- Un parte nuevo (otra unidad u otra fecha) arranca limpio: formulario, errores y el panel de «Parte enviado». -->
          {#key app.versionDePantalla}
            {#await bajarPantalla(() => import("./componentes/PantallaParte.svelte"))}
              {@render cargandoPantalla()}
            {:then { default: PantallaParte }}
              <PantallaParte bind:titulo={tituloDelParte} />
            {:catch error}
              {@render errorDeCarga(error)}
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
  /* El foco y el desplazamiento de «saltar al foco» no quedan bajo las barras fijas: arriba la barra visible más 12 px; abajo, por debajo de 64 rem, la barra inferior, el área segura y 16 px. */
  :global(html) {
    scroll-padding-top: calc(var(--alto-barra) + 0.75rem);
    scroll-padding-bottom: calc(var(--alto-pestanas) + env(safe-area-inset-bottom, 0px) + var(--e-4));
  }
  @media (min-width: 64rem) {
    :global(html) {
      scroll-padding-top: calc(var(--alto-lamina) + 0.75rem);
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

  /* Ancho y medianil del contenido: alineados con el encabezado de lámina de la barra de escritorio. Pegado a la izquierda, no centrado. */
  .ancho {
    width: 100%;
    max-width: 82.5rem;
    padding-inline: var(--gutter);
  }

  /* Barra de escritorio (15.4.3): el encabezado de lámina a la izquierda (código y, en la ficha y el parte, el enlace al padre) y a la derecha el sello y la fecha. Fija arriba, de 56 px, con el
     papel al 92 % y 6 px de desenfoque (la única pieza con desenfoque). */
  .barra-escritorio {
    display: none;
  }
  @media (min-width: 64rem) {
    .barra-escritorio {
      display: block;
      position: sticky;
      top: 0;
      z-index: 40;
      background: color-mix(in srgb, var(--c-papel) 92%, transparent);
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      border-bottom: 1px solid var(--c-filete-medio);
    }
    .interior {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--e-4);
      min-height: var(--alto-lamina);
    }
    .datos-lamina {
      display: flex;
      flex: none;
      align-items: center;
      gap: var(--e-5);
    }
    .fecha {
      color: var(--c-tinta-2);
      font-family: var(--t-mono);
      font-size: var(--t-rotulo);
      font-weight: 500;
      letter-spacing: 0.06em;
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
    padding-block: var(--e-4) calc(var(--alto-pestanas) + env(safe-area-inset-bottom, 0px) + var(--e-6));
  }
  main.en-parte {
    padding-bottom: var(--e-6);
  }
  @media (min-width: 64rem) {
    main {
      padding-block: var(--e-5) var(--e-7);
    }
  }

  /* Renglón de lámina (celular y tableta): código a la izquierda y, a la derecha, la fecha o el sello. Técnica de 12 px. */
  .renglon-lamina {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-3);
    width: 100%;
    min-height: 1.5rem;
    margin-bottom: calc(var(--e-2) * -1);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: 1;
  }
  /* El código y la fecha no se parten; con el texto al 200 % el renglón baja la pieza que no entra a otra línea en lugar de ensanchar la página. */
  .lamina-codigo {
    color: var(--c-tinta-3);
    white-space: nowrap;
  }
  .lamina-fecha {
    margin-left: auto;
    color: var(--c-tinta-2);
    white-space: nowrap;
  }
  .renglon-lamina :global(.sello) {
    display: none;
  }
  /* Ficha y parte: el sello no entra en la barra, así que baja acá, y la fecha no se muestra. */
  .renglon-lamina.con-padre .lamina-fecha {
    display: none;
  }
  .renglon-lamina.con-padre :global(.sello) {
    display: inline-flex;
    margin: 0 3px 0 auto;
  }
  /* El caso de 320 px: el sello baja al renglón de todas las pantallas y la fecha no se muestra. */
  @media (max-width: 22.49rem) {
    .renglon-lamina {
      min-height: 2.125rem;
    }
    .lamina-fecha {
      display: none;
    }
    .renglon-lamina :global(.sello) {
      display: inline-flex;
      margin: 0 3px 0 auto;
    }
  }
  @media (min-width: 64rem) {
    .renglon-lamina {
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

  /* Arranque (15.4.6): el cuadro cero de la regla, la caja vacía con el alto de la regla real (15.6.2, por el ancho del contenedor). Arriba se reserva el alto del encabezado de la pantalla
     (título y línea; el renglón de lámina ya está arriba) y, sobre la caja, el de la fila del cursor: al llegar los datos la regla aparece en el mismo lugar, sin salto. Sin bloques grises ni brillo. */
  .cuadro-cero {
    container: cero / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
  }
  .cuadro-cero-reserva {
    height: calc(min(var(--t-h1), 14vw) + var(--e-2) + 1.5 * var(--t-cuerpo));
  }
  .cuadro-cero-caja {
    display: flex;
    align-items: center;
    height: 8rem;
    margin-top: 0.75rem;
    padding: var(--e-4);
    background: var(--c-hoja);
    border: var(--b-caja) solid var(--c-tinta);
  }
  @container cero (min-width: 37.5rem) {
    .cuadro-cero-caja {
      height: 12.25rem;
    }
  }
  @container cero (min-width: 60rem) {
    .cuadro-cero-caja {
      height: 15.75rem;
    }
  }
  /* La escala sin marcas ni números: solo la línea. */
  .cuadro-cero-escala {
    height: 0;
    margin-top: calc(var(--e-4) * -0.5);
    border-top: 1px solid var(--c-tinta);
  }
  .preparando {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    width: min(100%, 24rem);
    color: var(--c-tinta-2);
  }
  progress {
    width: min(100%, 20rem);
    accent-color: var(--c-tinta);
  }
  /* «Cargando la pantalla…»: un renglón sobre la hoja con un filete de 1,5 px en tinta arriba. Los trozos locales llegan en un instante: el texto no aparece hasta pasados 300 ms (como en el
     arranque) para que no parpadee. */
  .diferida {
    width: 100%;
    padding: var(--e-4);
    background: var(--c-hoja);
    border-top: var(--b-fuerte) solid var(--c-tinta);
    animation: aparecer-tarde 0s linear 300ms backwards;
  }
  @keyframes aparecer-tarde {
    from {
      visibility: hidden;
    }
  }

  /* Error de arranque: una ficha con un precinto crítico de 6 px en el borde izquierdo (el rayado no depende del color). */
  .ficha-error {
    position: relative;
    max-width: 40rem;
    padding: var(--e-4) var(--e-4) var(--e-4) calc(var(--e-4) + 6px);
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .ficha-error::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 6px;
    background-image: repeating-linear-gradient(-45deg, var(--tono-r) 0 1.5px, transparent 1.5px 5px);
  }
</style>
