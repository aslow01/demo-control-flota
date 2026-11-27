<script lang="ts">
  // Horizonte, variante completa INTERACTIVA (5.6 del prototipo «Turno»): la regla de 0 a 30 días con un botón por documento. La usa `Horizonte` cuando recibe `regla`.
  // Solo dibuja: qué hay en la regla, en qué fila cae cada punto, su forma y todo el texto salen de `app.centroDeAlertas.vencimientos.regla` (lib/estado/centro-alertas.ts).
  //
  // - Un solo punto de tabulación (roving tabindex): Tab entra al punto elegido (o al último que tuvo el foco, o al primero) y sale de la regla. Flechas (derecha/abajo y
  //   izquierda/arriba), Inicio y Fin recorren los puntos y eligen; Enter o un toque eligen. Elegir muestra el detalle debajo (documento, titular, fecha, «Renovar», «Ver ficha»)
  //   en una región `aria-live="polite"`.
  // - «y N más» es un enlace a Vencimientos con el tramo de ese día: entra en el recorrido, pero no abre detalle.
  // - Lo que se escribe junto al punto (la patente o el nombre) está en `aria-hidden`: el nombre accesible del punto ya lo dice. Se muestra fijo solo donde entra sin pisar a su
  //   vecino (se mide en la pantalla, después de pintar); en los demás casos, al pasar el mouse, enfocar o elegir.
  // - CSP: la posición sale de `style:--dia` (se asigna por CSSOM); nunca un atributo `style`.
  // - Colores forzados: formas y línea de hoy en `CanvasText`; los tres tramos se distinguen por el borde (sólido, discontinuo, punteado).
  import { TEXTO_HORIZONTE } from "../lib/dominio/textos-base.ts";
import { TEXTO_LEYENDA_HORIZONTE as L, textoPuntoDeLaRegla } from "../lib/dominio/textos-inicio.ts";
  import type { FormaDeMarca } from "../lib/dominio/horizonte.ts";
  import type { AccionDeDocumento, PuntoDeRegla, ReglaDeVencimientos } from "../lib/estado/centro-alertas.ts";
  import { indiceTrasTecla } from "../lib/estado/teclado-lista.ts";
  import Boton from "./Boton.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Forma from "./Forma.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_ALERTAS as T } from "./textos-marco.ts";
  import type { Tono } from "./tipos.ts";

  let {
    regla,
    alRenovar,
  }: {
    regla: ReglaDeVencimientos;
    /** «Renovar» (o «Cargar») del detalle de un punto; sin esto el detalle no lleva ese botón. Quien lo pasa abre el diálogo. */
    alRenovar?: (accion: AccionDeDocumento) => void;
  } = $props();

  const uid = $props.id();

  const TONO_DE_FORMA: Record<FormaDeMarca, Tono> = { rombo: "critico", triangulo: "semana", circulo: "quincena", aro: "mes" };

  const clave = (e: PuntoDeRegla): string => `${e.tipo}-${e.alertaId}`;
  const claves = $derived(regla.elementos.map(clave));

  // ---------- Elección y roving tabindex ----------
  let elegidaClave = $state<string | null>(null);
  let activaClave = $state<string | null>(null);
  const elegido = $derived(regla.elementos.find((e) => e.tipo === "marca" && clave(e) === elegidaClave) ?? null);
  /** El único punto con `tabindex="0"`: el que tiene el foco, si no el elegido, si no el primero. */
  const tabClave = $derived(
    activaClave !== null && claves.includes(activaClave) ? activaClave : elegidaClave !== null && claves.includes(elegidaClave) ? elegidaClave : (claves[0] ?? null),
  );

  let pista = $state<HTMLElement>();

  function elegir(e: PuntoDeRegla): void {
    elegidaClave = e.tipo === "marca" ? clave(e) : null;
  }

  function alTeclear(evento: KeyboardEvent): void {
    if (pista === undefined || regla.elementos.length === 0) return;
    const botones = [...pista.querySelectorAll<HTMLElement>("[data-punto]")];
    const k = botones.findIndex((boton) => boton === document.activeElement);
    if (k < 0 || evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const siguiente = indiceTrasTecla(evento.key, k, botones.length, "ambos");
    if (siguiente === null) return;
    evento.preventDefault();
    const elemento = regla.elementos[siguiente];
    if (elemento !== undefined) elegir(elemento);
    botones[siguiente]?.focus();
  }

  // ---------- Etiquetas fijas: solo donde entran sin pisarse ----------
  interface Rotulo {
    fija: boolean;
    /** En los extremos la etiqueta se alinea con el borde de la regla en vez de centrarse sobre el punto. */
    borde: "" | "ini" | "fin";
  }
  let rotulos = $state.raw<Record<string, Rotulo>>({});
  /** Lo último que se midió (sin reactividad: así medir no depende de `rotulos` y no se vuelve a disparar solo). */
  let medidos: Record<string, Rotulo> = {};
  /** Menos ancha que esto, la regla no tiene lugar para escribir junto a los puntos (quedan al pasar, enfocar o elegir). */
  const ANCHO_MINIMO_PARA_ROTULOS = 280;
  const AIRE_ENTRE_ROTULOS = 6;

  function medir(): void {
    if (!pista) return; // tras desmontar, `bind:this` la deja en null
    const ancho = pista.clientWidth;
    const fin = [-Infinity, -Infinity];
    const siguiente: Record<string, Rotulo> = {};
    for (const boton of pista.querySelectorAll<HTMLElement>("[data-punto]")) {
      const et = boton.querySelector<HTMLElement>("[data-rotulo]");
      const id = boton.dataset.punto ?? "";
      if (et === null) continue;
      const fila = Number(boton.dataset.fila);
      const w = et.offsetWidth;
      const centro = boton.offsetLeft + boton.offsetWidth / 2;
      const borde = centro - w / 2 < 0 ? "ini" : centro + w / 2 > ancho ? "fin" : "";
      const ini = borde === "ini" ? boton.offsetLeft : borde === "fin" ? boton.offsetLeft + boton.offsetWidth - w : centro - w / 2;
      const fija = ancho >= ANCHO_MINIMO_PARA_ROTULOS && ini > (fin[fila] ?? -Infinity) + AIRE_ENTRE_ROTULOS;
      if (fija) fin[fila] = ini + w;
      siguiente[id] = { fija, borde };
    }
    const igual = Object.keys(siguiente).length === Object.keys(medidos).length && Object.entries(siguiente).every(([k, v]) => medidos[k]?.fija === v.fija && medidos[k]?.borde === v.borde);
    if (igual) return;
    medidos = siguiente;
    rotulos = siguiente;
  }

  $effect(() => {
    void regla.elementos;
    if (!pista) return;
    let cancelado = false;
    const medirSiSigue = (): void => {
      if (!cancelado) medir();
    };
    medir();
    const observador = new ResizeObserver(medirSiSigue);
    observador.observe(pista);
    // Las fuentes alojadas llegan después del primer pintado y cambian el ancho de las patentes (y pueden llegar ya desmontada la regla).
    void document.fonts?.ready.then(medirSiSigue);
    return () => {
      cancelado = true;
      observador.disconnect();
    };
  });

  // ---------- Textos derivados ----------
  function nombreDelPunto(e: Extract<PuntoDeRegla, { tipo: "marca" }>): string {
    const v = e.vencimiento;
    const titular = v.titular.tipo === "unidad" ? { patente: v.titular.patenteTexto } : { conductor: v.titular.nombre };
    return textoPuntoDeLaRegla(titular, v.accion.tipoDocumento, v.estado);
  }
  const hayPuntos = $derived(regla.elementos.length > 0);
  const quienes = $derived(regla.vencidos.quienes);
</script>

{#snippet formaDelPunto(forma: FormaDeMarca)}
  <!-- Un dibujo de 16 × 16 por tramo: rombo (vencido), triángulo (hasta 7 días), círculo (hasta 15) y aro (hasta 30). El borde del color de la pista los separa de los vecinos. -->
  <svg class="dibujo" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    {#if forma === "rombo"}<path d="M8 1 15 8 8 15 1 8Z" />
    {:else if forma === "triangulo"}<path d="M8 1.6 15 14.4H1Z" />
    {:else if forma === "circulo"}<circle cx="8" cy="8" r="6.4" />
    {:else}<circle class="aro" cx="8" cy="8" r="5.2" />{/if}
  </svg>
{/snippet}

<div class="regla">
  <div class="marco">
    {#if regla.vencidos.cantidad > 0}
      <a class="vencidos" data-tono="critico" href={regla.vencidos.href}>
        <span class="v-texto">{TEXTO_HORIZONTE.rotuloCajaCompleta}{#if quienes.length > 0}{" "}<small class="codigo">{#each quienes as q, i (q)}{#if i > 0}<span class="sep">{" · "}</span>{/if}<span class="quien">{q}</span>{/each}</small>{/if}</span>
        <span class="v-cifra num">{regla.vencidos.cantidad}</span>
      </a>
    {:else}
      <div class="vencidos cero">
        <span class="v-texto">{TEXTO_HORIZONTE.rotuloCajaCompleta}</span>
        <span class="v-cifra num">0</span>
      </div>
    {/if}

    <div class="cuerpo">
      <!-- El texto de ayuda lo lee quien llega a la regla: cuántos documentos hay en cada tramo y cómo recorrerlos. -->
      <p class="solo-lectores" id={`${uid}-ayuda`}>{regla.etiquetaAria ?? ""}{#if hayPuntos}{" "}{L.ayudaTeclado}{/if}</p>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions -->
      <div
        class="pista"
        class:sin-puntos={!hayPuntos}
        bind:this={pista}
        role={hayPuntos ? "group" : undefined}
        aria-label={hayPuntos ? L.nombrePista : undefined}
        aria-describedby={hayPuntos ? `${uid}-ayuda` : undefined}
        onkeydown={alTeclear}
      >
        <span class="tramo" data-tono="semana"></span><span class="tramo" data-tono="quincena"></span><span class="tramo" data-tono="mes"></span>
        <b class="hoy" aria-hidden="true"></b>
        {#each regla.elementos as e (clave(e))}
          {@const id = clave(e)}
          {@const r = rotulos[id]}
          {#if e.tipo === "marca"}
            <button
              type="button"
              class="punto"
              class:fija={r?.fija}
              data-punto={id}
              data-fila={e.fila}
              data-borde={r?.borde || undefined}
              data-tono={TONO_DE_FORMA[e.forma]}
              aria-pressed={elegidaClave === id}
              aria-label={nombreDelPunto(e)}
              tabindex={tabClave === id ? 0 : -1}
              style:--dia={e.dia}
              onclick={() => elegir(e)}
              onfocus={() => (activaClave = id)}
            >
              {@render formaDelPunto(e.forma)}
              <span class="rotulo codigo" data-rotulo aria-hidden="true">{e.etiquetaCorta}</span>
            </button>
          {:else}
            <a
              class="punto mas"
              data-punto={id}
              data-fila={e.fila}
              data-tono={e.tramo}
              href={e.href}
              tabindex={tabClave === id ? 0 : -1}
              style:--dia={e.dia}
              onfocus={() => (activaClave = id)}
            >
              <span class="mas-texto">{T.yMas(e.mas)}<span class="solo-lectores">{T.yMasLector}</span></span>
            </a>
          {/if}
        {/each}
        {#if !hayPuntos && regla.vacio !== null}
          <span class="vacio">{regla.vacio}</span>
        {/if}
      </div>
      <div class="escala num" aria-hidden="true">
        <span>{L.escala.hoy}</span><span style:--dia={7}>{L.escala.sieteDias}</span><span style:--dia={15}>{L.escala.quinceDias}</span><span style:--dia={30}>{L.escala.treintaDias}</span>
      </div>
    </div>
  </div>

  {#if hayPuntos}
    <div class="detalle" aria-live="polite">
      {#if elegido !== null && elegido.tipo === "marca"}
        {@const v = elegido.vencimiento}
        {@const tono = TONO_DE_FORMA[elegido.forma]}
        <div class="tarjeta" data-tono={tono}>
          <div class="tarjeta-cab">
            <Forma forma={elegido.forma} />
            <span>{v.estado}</span>
            <span class="fecha num">{v.vence}</span>
          </div>
          <p class="documento">{v.documento}</p>
          <p class="titular">
            {#if v.titular.tipo === "unidad"}
              <Patente patente={v.titular.patente} />
              <span class="nota">{v.titular.interno} · {v.titular.descripcion}</span>
            {:else}
              <b>{T.conductorFicticio(v.titular.nombre)}</b>
              <span class="nota">{v.titular.detalle}</span>
              {#if v.titular.unidad !== null}
                <span class="nota">{T.unidadDelConductor}</span>
                <Patente patente={v.titular.unidad.patenteTexto.replaceAll(" ", "")} />
              {/if}
            {/if}
          </p>
          <div class="acciones">
            {#if alRenovar !== undefined}
              <Boton tamano="chico" onclick={() => alRenovar(v.accion)}>
                {v.accion.etiqueta}<span class="solo-lectores">{v.accion.nombreAccesible.startsWith(v.accion.etiqueta) ? v.accion.nombreAccesible.slice(v.accion.etiqueta.length) : ` ${v.accion.nombreAccesible}`}</span>
              </Boton>
            {/if}
            {#if elegido.fichaHref !== null}
              <EnlaceAccion href={elegido.fichaHref} tamano="chico">
                {T.verFicha}<span class="solo-lectores">{T.verFichaDe(v.titular.tipo === "unidad" ? v.titular.patenteTexto : (v.titular.unidad?.patenteTexto ?? v.titular.nombre))}</span>
              </EnlaceAccion>
            {/if}
          </div>
        </div>
      {:else}
        <p class="ayuda-detalle">{L.ayudaDetalle}</p>
      {/if}
    </div>
  {/if}

  <ul class="leyenda">
    {#each regla.leyenda.filter((l) => l.grupo !== "vencidos") as l (l.grupo)}
      <li data-tono={TONO_DE_FORMA[l.forma]}>
        <Forma forma={l.forma} />
        <span aria-hidden="true">{l.rotulo} <b class="num">{l.cantidad}</b></span>
        <span class="solo-lectores">{l.textoLector}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  /* Contenedor de consultas: la caja de vencidos pasa arriba por debajo de 44 rem de ancho (en la columna de Inicio queda siempre arriba). */
  .regla {
    --punto: 26px; /* blanco de toque de 26 px (2.5.8 AA): es un blanco, no un texto, así que no crece con el tamaño de letra */
    container: regla / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
  }
  .marco {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
  }
  /* ---------- Caja de vencidos y faltantes ---------- */
  .vencidos {
    display: flex;
    flex: none;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: var(--e-2) var(--e-3);
    /* El borde fino es transparente: solo se ve en colores forzados, donde el fondo desaparece. */
    border: 1px solid transparent;
    border-inline-start: 4px solid var(--tono-r);
    border-radius: 0 var(--r-1) var(--r-1) 0;
    background: var(--tono-f);
    color: var(--tono-t);
    text-decoration: none;
  }
  a.vencidos:hover {
    background: color-mix(in srgb, var(--tono-f) 80%, var(--tono-r));
  }
  /* Con 0 va en gris: no define tonos propios, usa los del neutro. */
  .vencidos.cero {
    --tono-t: var(--c-texto-2);
    --tono-f: var(--c-superficie-2);
    --tono-r: var(--c-borde-fuerte);
  }
  .v-texto {
    font-size: var(--t-rotulo);
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    min-width: 0;
  }
  .v-texto small {
    display: inline;
    margin-inline-start: var(--e-2);
    font-size: var(--t-rotulo);
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }
  /* Cada patente o nombre es una pieza: puede bajar de renglón entre una y otra, nunca por la mitad. */
  .quien {
    white-space: nowrap;
  }
  .v-cifra {
    flex: none;
    font-family: var(--t-familia-titulo);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
  }

  /* Va después de las reglas base de la caja: si no, `.vencidos` y `.v-texto small` las pisan (nunca se aplicaban). */
  @container regla (min-width: 44rem) {
    .marco {
      flex-direction: row;
      align-items: flex-start;
      gap: var(--e-4);
    }
    .vencidos {
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      inline-size: 10rem;
      /* La regla arranca 22 px más abajo (el aire para las etiquetas de la fila de arriba): la caja baja lo mismo. */
      margin-top: 1.375rem;
    }
    .v-texto small {
      display: block;
      margin: var(--e-1) 0 0;
    }
    /* Uno por renglón: el separador sobra. */
    .quien {
      display: block;
    }
    .sep {
      display: none;
    }
  }

  /* ---------- Pista ---------- */
  .cuerpo {
    flex: 1;
    min-width: 0;
    /* Arriba, el aire para las etiquetas de la fila de arriba. */
    padding-top: 1.375rem;
    inline-size: 100%;
  }
  .pista {
    position: relative;
    display: grid;
    grid-template-columns: 7fr 8fr 15fr;
    height: 70px;
  }
  /* Los tres tramos: 0 a 7, 8 a 15 y 16 a 30 días (7 : 8 : 15 de ancho). */
  .tramo {
    background: var(--tono-f);
    /* Transparente: solo se ve en colores forzados. */
    outline: 1px solid transparent;
    outline-offset: -1px;
  }
  .tramo:first-child {
    border-radius: 3px 0 0 3px;
  }
  .tramo:nth-child(3) {
    border-radius: 0 3px 3px 0;
  }
  /* Hoy: 3 px en el borde izquierdo, más alta que la pista. */
  .hoy {
    position: absolute;
    inset-block: -6px;
    inset-inline-start: 0;
    width: 3px;
    border-radius: 2px;
    background: var(--c-hoy);
  }

  /* ---------- Puntos ---------- */
  .punto {
    --x: calc(var(--dia) / 30 * 100%);
    position: absolute;
    z-index: 1;
    /* En los extremos el blanco entero queda dentro de la pista. */
    left: clamp(calc(var(--punto) / 2), var(--x), calc(100% - var(--punto) / 2));
    translate: -50% 0;
    display: grid;
    place-items: center;
    width: var(--punto);
    height: var(--punto);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--c-texto);
    cursor: pointer;
    transition:
      scale var(--m-rapido) var(--m-curva),
      background-color var(--m-rapido) linear;
  }
  .punto[data-fila="0"] {
    top: 6px;
  }
  .punto[data-fila="1"] {
    top: 38px;
  }
  .dibujo {
    width: 17px;
    height: 17px;
    overflow: visible;
    fill: var(--tono-r);
    /* El borde del color de la superficie separa los puntos entre sí y de la pista. */
    stroke: var(--c-superficie);
    stroke-width: 2.2;
    paint-order: stroke;
  }
  .dibujo .aro {
    fill: var(--c-superficie);
    stroke: var(--tono-r);
    stroke-width: 3.4;
  }
  @media (hover: hover) {
    .punto:hover {
      scale: 1.18;
      z-index: 3;
    }
  }
  .punto:focus-visible {
    outline-offset: 1px;
    z-index: 3;
  }
  .punto[aria-pressed="true"] {
    z-index: 2;
    background: var(--c-superficie);
    box-shadow: 0 0 0 2.5px var(--c-texto);
  }

  /* La patente (o el nombre) junto al punto, como una chapa chica: fija cuando entra; si no, al pasar el mouse, enfocar o elegir. Siempre en el DOM para poder medirla. */
  .rotulo {
    position: absolute;
    left: 50%;
    translate: -50% 0;
    visibility: hidden;
    padding: 0 5px 1px;
    border: 1px solid var(--c-borde-fuerte);
    border-top: 3px solid var(--c-patente-banda);
    border-radius: 2px;
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: 0.71875rem;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    pointer-events: none;
  }
  .punto[data-fila="0"] .rotulo {
    bottom: calc(100% + 3px);
  }
  .punto[data-fila="1"] .rotulo {
    top: calc(100% + 3px);
  }
  .punto[data-borde="ini"] .rotulo {
    left: 0;
    translate: none;
  }
  .punto[data-borde="fin"] .rotulo {
    left: auto;
    right: 0;
    translate: none;
  }
  .punto.fija .rotulo,
  .punto[aria-pressed="true"] .rotulo,
  .punto:focus-visible .rotulo {
    visibility: visible;
  }
  @media (hover: hover) {
    .punto:hover .rotulo {
      visibility: visible;
    }
  }
  .punto[aria-pressed="true"] .rotulo {
    border-top-color: var(--c-texto);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.12);
  }

  /* «y N más»: un aro con el texto siempre a la vista (es el único contenido del enlace; el número exacto está en la lista de Vencimientos). */
  .punto.mas {
    inline-size: auto;
    min-inline-size: var(--punto);
    padding-inline: 0.375rem;
    border-radius: var(--punto);
    background: var(--c-superficie);
    box-shadow: inset 0 0 0 2px var(--tono-r);
    text-decoration: none;
    color: var(--c-texto);
  }
  .mas-texto {
    font-size: var(--t-rotulo);
    font-weight: 650;
    line-height: 1;
    white-space: nowrap;
  }

  /* ---------- Escala ---------- */
  .escala {
    position: relative;
    height: 1.125rem;
    /* Abajo, el aire para las etiquetas de la fila de abajo. */
    margin-top: 1.625rem;
    font-size: var(--t-rotulo);
    line-height: 1.2;
    color: var(--c-texto-3);
  }
  .escala span {
    position: absolute;
    left: calc(var(--dia, 0) / 30 * 100%);
    translate: -50% 0;
    white-space: nowrap;
  }
  .escala span:first-child {
    translate: none;
  }
  .escala span:last-child {
    translate: -100% 0;
  }
  /* Texto agrandado: «7» y «15» se pisarían con «Hoy» y «30 días»; quedan las líneas de la pista y la leyenda. */
  @container regla (max-width: 14rem) {
    .escala span:nth-child(2),
    .escala span:nth-child(3) {
      display: none;
    }
  }

  /* Pista sin puntos: el texto, centrado sobre ella. */
  .pista.sin-puntos {
    height: 3rem;
  }
  .vacio {
    position: absolute;
    inset-inline: 0;
    top: 50%;
    translate: 0 -50%;
    padding-inline: var(--e-2);
    text-align: center;
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }

  /* ---------- Detalle del punto elegido ---------- */
  .ayuda-detalle {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
    padding: var(--e-1) var(--e-3);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-1);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
  }
  .tarjeta {
    display: grid;
    gap: var(--e-1);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) - 4px);
    border-inline-start: 4px solid var(--tono-r);
    border-radius: 0 var(--r-1) var(--r-1) 0;
    background: var(--tono-f);
    animation: entra var(--m-medio) var(--m-curva) both;
  }
  .tarjeta-cab {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    color: var(--tono-t);
    font-size: var(--t-chico);
    font-weight: 700;
  }
  .fecha {
    margin-inline-start: auto;
    color: var(--c-texto-2);
    font-weight: 600;
  }
  .documento {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--c-texto);
  }
  .titular {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .titular b {
    color: var(--c-texto);
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
    margin-top: var(--e-2);
  }
  @keyframes entra {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }

  /* ---------- Leyenda ---------- */
  .leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-1) var(--e-4);
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .leyenda li {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
  }
  .leyenda b {
    color: var(--c-texto);
  }

  /* ---------- Colores forzados ---------- */
  @media (forced-colors: active) {
    .tramo {
      outline-color: CanvasText;
    }
    .tramo:nth-child(2) {
      outline-style: dashed;
    }
    .tramo:nth-child(3) {
      outline-style: dotted;
    }
    .hoy {
      background: CanvasText;
    }
    .dibujo {
      fill: CanvasText;
      stroke: Canvas;
    }
    .dibujo .aro {
      fill: Canvas;
      stroke: CanvasText;
    }
    .punto[aria-pressed="true"] {
      box-shadow: none;
      outline: 2px solid Highlight;
    }
    .punto.mas {
      box-shadow: none;
      border: 2px solid CanvasText;
    }
    .vencidos {
      border-color: CanvasText;
    }
  }
</style>
