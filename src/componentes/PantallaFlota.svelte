<script lang="ts">
  // Flota (6.2, `#/flota`): 1) encontrar la unidad (búsqueda, proyecto, orden y filtros por estado), 2) ver su estado de hoy (tabla de 5.10 con el
  // Horizonte mínimo en «Próximo vencimiento»), 3) agregar una unidad (diálogo). No tiene reglas de negocio: todo lo que muestra lo arma
  // `app.panelDeFlota` y `vistaDeFlota(panel, consulta)` (lib/estado/flota.ts); el diálogo usa `contextoDeAgregarUnidad` y `app.agregarUnidad`.
  //  - La consulta es estado de esta pantalla (no escribe el hash): arranca en `consultaDeRuta(app.ruta)` y se vuelve a leer cuando sube
  //    `app.versionDePantalla` (por ejemplo, «Ver las 4 en la flota» estando ya en la flota).
  //  - La barra de estado del panel dice «Mostrando 23 de 23 unidades.» y es la región viva: al escribir se actualiza con 500 ms de pausa; al elegir
  //    un filtro, un proyecto o un orden, al instante.
  //  - Al agregar bien la aplicación navega sola a la ficha de la unidad nueva (`app.agregarUnidad`) y el cambio de pantalla lleva el foco al título de la ficha,
  //    que muestra el mensaje de llegada («Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.»): acá no queda nada por hacer salvo cerrar el diálogo.
  import { onDestroy, tick, untrack } from "svelte";
  import { contextoDeAgregarUnidad, type ContextoAgregarUnidad, type ValoresUnidad } from "../lib/dominio/formulario-unidad.ts";
  import type { ResultadoAgregarUnidad } from "../lib/estado/app.svelte.ts";
  import {
    consultaDeRuta,
    quitarFiltros,
    vistaDeFlota,
    type ConsultaFlota,
    type FilaFlota,
    type IdFiltroFlota,
  } from "../lib/estado/flota.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { aspectoDeAptitud } from "./alertas-aspecto.ts";
  import Boton from "./Boton.svelte";
  import DialogoUnidad from "./DialogoUnidad.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import FiltrosConteo from "./FiltrosConteo.svelte";
  import Horizonte from "./Horizonte.svelte";
  import Icono from "./Icono.svelte";
  import ListaTabla, { type GrupoDeLista } from "./ListaTabla.svelte";
  import { CELDA } from "./lista-roles.ts";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_FLOTA_VISTA as T } from "./textos-marco.ts";
  import type { EtiquetaDeParte, Tono } from "./tipos.ts";

  // «Último parte» (5.10): la etiqueta que arma `panelDeFlota` («En uso», «Sin enviar», «Sin cerrar», «Sin parte») y la de tabla 5.7 que le toca. «Sin parte» no es una etiqueta de parte
  // (es la falta de uno): tono semana con `i-guion`.
  const ETIQUETA_DE_PARTE: Record<string, EtiquetaDeParte> = { "En uso": "en-uso", "Sin enviar": "sin-enviar", "Sin cerrar": "sin-cerrar" };

  const ID_TITULO = "titulo-flota";
  const PAUSA_AL_ESCRIBIR_MS = 500;

  const panel = $derived(app.panelDeFlota);
  let consulta = $state<ConsultaFlota>(consultaDeRuta(app.ruta));
  const v = $derived(panel === null ? null : vistaDeFlota(panel, consulta));

  // ---------- Barra de estado: el conteo (con pausa al escribir) o el mensaje de la última acción ----------
  // Parte con el conteo de ahora (así «escribir» no lo cambia hasta que pase la pausa).
  let anuncio = $state<string | null>(untrack(() => v?.anuncio ?? null));
  const textoBarra = $derived(anuncio ?? v?.anuncio ?? "");
  let plazoAnuncio: ReturnType<typeof setTimeout> | undefined;

  function anunciar(): void {
    clearTimeout(plazoAnuncio);
    if (v !== null) anuncio = v.anuncio;
  }
  /** Los `select` con `bind:value` actualizan la consulta en el mismo evento: se anuncia cuando ya lo hicieron. */
  function alCambiarSelector(): void {
    void tick().then(anunciar);
  }
  function alEscribir(): void {
    clearTimeout(plazoAnuncio);
    plazoAnuncio = setTimeout(anunciar, PAUSA_AL_ESCRIBIR_MS);
  }
  onDestroy(() => clearTimeout(plazoAnuncio));

  // Si los datos cambian (se agregó una unidad, otra pestaña escribió), el conteo de la barra se pone al día.
  let panelAnterior = untrack(() => panel);
  $effect(() => {
    const actual = panel;
    if (actual === panelAnterior) return;
    panelAnterior = actual;
    untrack(() => {
      if (v !== null) anuncio = v.anuncio;
    });
  });

  // Llegar a la flota por otro enlace sin salir de la pantalla: volver a leer la ruta.
  let versionLeida = app.versionDePantalla;
  $effect(() => {
    const version = app.versionDePantalla;
    if (version === versionLeida) return;
    versionLeida = version;
    consulta = consultaDeRuta(app.ruta);
    anunciar();
  });

  // ---------- Filtros ----------
  const TONO_FILTRO: Record<IdFiltroFlota, Tono | undefined> = {
    activas: undefined,
    "pueden-salir": "vigente",
    "no-pueden-salir": "critico",
    "fuera-de-servicio": "semana",
    "de-baja": "neutro",
    "no-disponibles": "critico",
  };
  const filtros = $derived((v?.filtros ?? []).map((f) => ({ ...f, tono: TONO_FILTRO[f.id] })));

  function elegirFiltro(id: IdFiltroFlota): void {
    consulta.filtro = id;
    anunciar();
  }

  let campoBusqueda = $state<HTMLInputElement | null>(null);
  function quitar(): void {
    consulta = quitarFiltros(consulta);
    anunciar();
    campoBusqueda?.focus(); // el botón «Quitar filtros» desaparece: el foco vuelve a la búsqueda
  }

  const columnas = [
    { id: "unidad", titulo: T.columnas.unidad },
    { id: "estado", titulo: T.columnas.estado },
    { id: "proximo", titulo: T.columnas.proximo },
    { id: "km", titulo: T.columnas.km },
    { id: "parte", titulo: T.columnas.parte },
    { id: "novedades", titulo: T.columnas.novedades },
    { id: "proyecto", titulo: T.columnas.proyecto },
  ];
  /** «Volkswagen Amarok 2015 · Camioneta» -> «Volkswagen Amarok 2015»: con el tipo la segunda línea de la celda se parte en dos (C9); el tipo está en la ficha. */
  const sinTipo = (descripcion: string): string => (descripcion.includes(" · ") ? descripcion.slice(0, descripcion.lastIndexOf(" · ")) : descripcion);
  const grupos = $derived<GrupoDeLista<FilaFlota>[]>(v === null ? [] : [{ clave: "flota", titulo: "", tono: "neutro", filas: v.filas }]);

  // ---------- Diálogo «Agregar unidad» ----------
  let dialogoAbierto = $state(false);
  let contextoDialogo = $state.raw<ContextoAgregarUnidad | null>(null);

  function abrirAgregar(): void {
    const estado = app.estado;
    if (estado === null) return;
    contextoDialogo = contextoDeAgregarUnidad(estado, app.hoy);
    dialogoAbierto = true;
  }
  const guardar = (valores: ValoresUnidad): Promise<ResultadoAgregarUnidad> => app.agregarUnidad(valores);
</script>

{#if panel !== null && v !== null}
  <div class="pantalla">
    <div class="solo-angosto"><EtiquetaDemo /></div>
    <div class="encabezado">
      <h1 tabindex="-1">{app.nombrePantalla}</h1>
      <div class="agregar"><Boton onclick={abrirAgregar}>{T.agregarUnidad}</Boton></div>
      <p class="linea">{panel.resumen}</p>
    </div>

    <Panel id={ID_TITULO} titulo={panel.titulo} icono="unidad" meta={String(panel.cantidad)} estado={textoBarra}>
      {#snippet herramientas()}
        <div class="busqueda">
          <label class="rotulo-busqueda" for="buscar-unidad">{T.buscar}</label>
          <div class="campo-busqueda">
            <span class="lupa"><Icono nombre="buscar" /></span>
            <input
              id="buscar-unidad"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder={T.buscarMarcador}
              bind:this={campoBusqueda}
              bind:value={consulta.busqueda}
              oninput={alEscribir}
            />
          </div>
        </div>
        <label class="selector">
          <span>{T.proyecto}</span>
          <select bind:value={consulta.proyecto} onchange={alCambiarSelector}>
            {#each panel.proyectos as p (p.valor)}
              <option value={p.valor}>{p.etiqueta}</option>
            {/each}
          </select>
        </label>
        <label class="selector">
          <span>{T.ordenarPor}</span>
          <select bind:value={consulta.orden} onchange={alCambiarSelector}>
            {#each panel.ordenes as o (o.id)}
              <option value={o.id}>{o.etiqueta}</option>
            {/each}
          </select>
        </label>
        <div class="filtros">
          <FiltrosConteo leyenda={T.mostrar} opciones={filtros} valor={consulta.filtro} alElegir={elegirFiltro} />
        </div>
      {/snippet}

      {#if v.vacio !== null}
        <div class="vacio-bloque">
          <p class="vacio"><Icono nombre="guion" />{v.vacio.texto}</p>
          {#if v.vacio.tipo === "sin-unidades"}
            <Boton variante="secundario" onclick={abrirAgregar}>{T.agregarUnidad}</Boton>
          {:else if v.vacio.conQuitarFiltros}
            <Boton variante="texto" onclick={quitar}>{T.quitarFiltros}</Boton>
          {/if}
        </div>
      {:else}
        <ListaTabla
          variante="flota"
          titulo={panel.titulo}
          {columnas}
          {grupos}
          claveDeFila={(f) => f.unidadId}
          tonoDeFila={(f) => f.franja ?? undefined}
        >
          {#snippet fila(f: FilaFlota)}
            {@const aspecto = aspectoDeAptitud(f.estado.categoria)}
            {@const pv = f.proximoVencimiento}
            <td {...CELDA} data-col="unidad">
              <span class="apilado">
                <span class="linea-unidad">
                  <Patente patente={f.patente} href={f.href} /><span class="interno">{f.interno}</span>
                </span>
                <span class="nota">{sinTipo(f.descripcion)}</span>
              </span>
            </td>
            <td {...CELDA} data-col="estado">
              <span class="apilado">
                <Etiqueta tono={aspecto.tono} icono={aspecto.icono} variante={f.estado.categoria === "puede-salir" ? "texto" : "relleno"}>{f.estado.etiqueta}</Etiqueta>
                {#if f.estado.motivo !== null}
                  <span class="nota">{f.estado.motivo}{#if f.estado.motivosMas !== null}{" "}{f.estado.motivosMas}{/if}</span>
                {/if}
              </span>
            </td>
            <td {...CELDA} data-col="proximo" data-etiqueta={T.columnas.proximo}>
              {#if pv.tipo === "faltante" || pv.tipo === "vencido"}
                <span class="apilado">
                  <Etiqueta tono="critico" icono={pv.tipo === "faltante" ? "faltante" : "vencido"}>{pv.etiqueta ?? ""}</Etiqueta>
                  <span class="nota">{pv.documento}</span>
                </span>
              {:else if pv.tipo === "por-vencer"}
                <span class="con-horizonte">
                  {#if pv.horizonte !== null}<Horizonte horizonte={pv.horizonte} />{/if}
                  <span>{pv.texto}</span>
                </span>
              {:else}
                <span class="nota">{pv.texto}</span>
              {/if}
            </td>
            <td {...CELDA} data-col="km" data-etiqueta={T.columnas.km}>
              <span class:nota={f.km.valor === null}>{f.km.texto}</span>
            </td>
            <td {...CELDA} data-col="parte" data-etiqueta={T.columnas.parte}>
              <span class="apilado">
                <span class="num" class:nota={f.ultimoParte.fecha === null}>{f.ultimoParte.texto}</span>
                {#if f.ultimoParte.etiqueta !== null}
                  {@const tipo = ETIQUETA_DE_PARTE[f.ultimoParte.etiqueta]}
                  {#if tipo !== undefined}
                    <EtiquetaParte {tipo} />
                  {:else}
                    <Etiqueta tono="semana" icono="guion">{f.ultimoParte.etiqueta}</Etiqueta>
                  {/if}
                {/if}
              </span>
            </td>
            <td {...CELDA} data-col="novedades" data-etiqueta={T.columnas.novedades} data-sin-valor={f.novedades.abiertas === 0 ? "" : undefined}>
              {#if f.novedades.criticas > 0}
                <span class="novedad-critica num"><Icono nombre="octogono" />{f.novedades.texto}</span>
              {:else}
                <span class="num">{f.novedades.texto}</span>
              {/if}
            </td>
            <td {...CELDA} data-col="proyecto" data-etiqueta={T.columnas.proyecto}>
              <span class="apilado">
                <span>{#if f.proyecto !== null}{f.proyecto}{:else}<span aria-hidden="true">—</span><span class="solo-lectores">{T.sinProyecto}</span>{/if}</span>
                <span class="nota">
                  {f.conductor ?? T.sinConductor}
                  {#if f.conductorSinLicencia}
                    <!-- L6: la unidad puede salir con otro conductor (A1): no cambia la etiqueta de «Estado hoy» ni lleva franja. -->
                    <span class="sin-licencia"><Icono nombre="vencido" />{T.sinLicencia}</span>
                  {/if}
                </span>
              </span>
            </td>
          {/snippet}
        </ListaTabla>
      {/if}
    </Panel>
  </div>

  <DialogoUnidad bind:abierto={dialogoAbierto} contexto={contextoDialogo} {guardar} />
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
    min-width: 0;
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }

  /* Teléfono: título, «Agregar unidad» a todo el ancho y el resumen. Desde 40 rem: título y botón en una fila, el resumen debajo. */
  .encabezado {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "titulo"
      "agregar"
      "linea";
    gap: var(--e-2);
  }
  .encabezado h1 {
    grid-area: titulo;
  }
  .agregar {
    grid-area: agregar;
    display: flex;
  }
  .agregar :global(.boton) {
    flex: 1;
  }
  .linea {
    grid-area: linea;
    color: var(--c-texto-2);
  }
  @media (min-width: 40rem) {
    .encabezado {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "titulo agregar"
        "linea linea";
      align-items: center;
    }
    .agregar :global(.boton) {
      flex: none;
    }
  }

  /* ---------- Herramientas: búsqueda, proyecto, orden y filtros ---------- */
  .busqueda {
    display: flex;
    flex: 1 1 100%;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .campo-busqueda {
    position: relative;
  }
  /* Con el rótulo visible, como Proyecto y Ordenar por (C10); en escritorio, donde todo va en una línea, queda solo para lectores. */
  .rotulo-busqueda {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
  }
  .lupa {
    position: absolute;
    top: 50%;
    left: var(--e-3);
    display: inline-flex;
    translate: 0 -50%;
    color: var(--c-texto-2);
    pointer-events: none;
  }
  input[type="search"] {
    width: 100%;
    height: var(--alto-tactil);
    padding: 0 var(--e-3) 0 calc(var(--e-3) + 1.25rem + var(--e-2));
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: var(--t-cuerpo); /* 16 px: evita el zoom automático de iOS */
    line-height: 1.5;
    -webkit-appearance: none;
    appearance: none;
  }
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
  input::placeholder {
    color: var(--c-texto-2);
    opacity: 1;
  }
  /* Proyecto y Ordenar por, uno al lado del otro (C10): ahorran un renglón entero antes de los resultados. */
  .selector {
    display: flex;
    flex: 1 1 calc(50% - var(--e-3) / 2);
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .selector span {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto);
  }
  select {
    width: 100%;
    min-width: 0;
    height: var(--alto-tactil);
    padding: 0 var(--e-3);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: var(--t-cuerpo);
    line-height: 1.5;
  }
  @media (hover: hover) {
    input[type="search"]:hover,
    select:hover {
      border-color: var(--c-texto-2);
    }
  }
  .filtros {
    flex: 1 1 100%;
    min-width: 0;
  }
  /* Tableta: proyecto y orden en una fila (cada uno con su rótulo arriba). Escritorio: todo en una línea y el rótulo al costado. */
  @container panel (min-width: 36rem) {
    .selector {
      flex: 1 1 14rem;
    }
  }
  @container panel (min-width: 64rem) {
    .busqueda {
      flex: 1 1 20rem;
    }
    .rotulo-busqueda {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .selector {
      flex: 0 1 auto;
      flex-direction: row;
      align-items: center;
      gap: var(--e-2);
    }
    .selector select {
      width: auto;
      min-width: 9rem;
    }
  }

  /* ---------- Filas ---------- */
  .apilado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-1);
  }
  .apilado {
    min-width: 0;
  }
  .apilado .nota {
    line-height: 1.3;
  }
  .linea-unidad {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
  }
  /* El enlace de la patente mide 44 px (su blanco táctil) y la patente 24: lo que sobra no ocupa lugar entre las dos líneas de la celda (C8). */
  .linea-unidad :global(.enlace-patente) {
    margin-block: -0.625rem;
  }
  /* Tarjeta (C7): «[ZZD 563] Int. 10 · Volkswagen Amarok 2015» en un renglón y los datos de abajo, en renglones de dos pasos. */
  @container lista (max-width: 39.99rem) {
    td[data-col="unidad"] .apilado {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 var(--e-2);
    }
    /* El punto va pegado al interno (nunca queda solo al principio del renglón de abajo si el modelo no entra). */
    td[data-col="unidad"] .interno::after {
      content: " ·";
      content: " ·" / "";
    }
    td[data-col="parte"] .apilado {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 var(--e-2);
    }
  }
  .interno {
    font-size: var(--t-tabla);
    color: var(--c-texto-2);
  }
  /* El horizonte mínimo va siempre a la izquierda del texto, en su propia columna de 4 rem (C9): antes pasaba arriba o al lado según si el texto entraba. */
  .con-horizonte {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr);
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .con-horizonte > :global(:only-child) {
    grid-column: 1 / -1;
  }
  .nota {
    color: var(--c-texto-2);
    /* El motivo de «fuera de servicio» lo escribe la persona: un texto sin espacios no tiene que ensanchar la página. */
    overflow-wrap: anywhere;
  }
  /* «sin licencia vigente» a continuación del nombre del conductor, en el mismo renglón si entra (5.10): `i-vencido` de 14 px y texto crítico de 600. */
  .sin-licencia {
    --icono-tam: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    font-size: var(--t-chico);
    font-weight: 600;
    color: var(--c-critico-t);
  }
  .novedad-critica {
    --icono-tam: 1rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    font-weight: 600;
    color: var(--c-critico-t);
  }

  /* ---------- Vacío ---------- */
  .vacio-bloque {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    width: 100%;
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
</style>
