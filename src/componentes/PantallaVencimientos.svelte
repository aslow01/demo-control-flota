<script lang="ts">
  // Vencimientos (`#/vencimientos?filtro=`), según el prototipo «Turno»: título y línea de contexto; la regla interactiva de 0 a 30 días (con su leyenda); los filtros como enlaces
  // (`FiltrosEnlace`, `aria-current` en el elegido) y un panel por grupo con una fila por documento y su acción (Renovar, Cargar).
  // No tiene reglas de negocio: todo sale de `app.centroDeAlertas.vencimientos` y el filtro, de `app.ruta` (la dirección). Cambiar de filtro es navegar a un enlace: no
  // cambia la pantalla, así que el foco y el desplazamiento se quedan donde estaban (y en la región `role="status"` aparte se dice «Mostrando 4 de 11 vencimientos.»).
  // Los diálogos son los de `DialogosDeDocumento` (uno solo para Inicio, Vencimientos y Operación): al renovar o cargar bien, la fila desaparece, el foco va al título del
  // primer grupo que quede (o al h1) y la barra de estado de abajo de los filtros dice qué pasó (5.17). Al cancelar, el foco vuelve al botón que abrió el diálogo.
  import { untrack } from "svelte";
  import { TEXTO_VACIO_PANTALLAS } from "../lib/dominio/textos-inicio.ts";
  import { vencimientosVisibles, type FilaVencimiento, type IdFiltroVencimientos } from "../lib/estado/centro-alertas.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import { aspectoDeVencimiento } from "./alertas-aspecto.ts";
  import Boton from "./Boton.svelte";
  import DialogosDeDocumento from "./DialogosDeDocumento.svelte";
  import { dialogos } from "./dialogos-instancia.ts";
  import Etiqueta from "./Etiqueta.svelte";
  import FiltrosEnlace from "./FiltrosEnlace.svelte";
  import Forma, { formaDeTono } from "./Forma.svelte";
  import Horizonte from "./Horizonte.svelte";
  import { TEXTO_ALERTAS as T } from "./textos-marco.ts";

  const ID_LISTA = "lista-vencimientos";

  const c = $derived(app.centroDeAlertas);
  const filtro = $derived<IdFiltroVencimientos>(app.ruta.tipo === "vencimientos" ? (app.ruta.filtro ?? "todos") : "todos");
  const v = $derived(c === null ? null : vencimientosVisibles(c.vencimientos, filtro));
  const sinNada = $derived(c !== null && c.vencimientos.total === 0);

  /** «3 vencidos o faltantes · 9 vencen en 30 días»: la primera parte va en negrita. */
  const contexto = $derived.by(() => {
    const texto = c?.vencimientos.contexto ?? "";
    const corte = texto.indexOf(" · ");
    return corte < 0 ? { fuerte: texto, resto: "" } : { fuerte: texto.slice(0, corte), resto: texto.slice(corte) };
  });

  // Lo que se dice al cambiar de filtro: una región aparte (la barra de estado es para lo que se hizo). La primera vez no se anuncia nada.
  let anuncioFiltro = $state({ texto: "" });
  let primeraVez = true;
  $effect(() => {
    const elegido = filtro;
    if (primeraVez) {
      primeraVez = false;
      return;
    }
    const datos = untrack(() => app.centroDeAlertas);
    if (datos !== null) anuncioFiltro = { texto: vencimientosVisibles(datos.vencimientos, elegido).anuncio };
  });
  const anunciadoFiltro = textoAnunciado(() => ({ texto: anuncioFiltro.texto, repetir: anuncioFiltro }));

  // Lo que pasó al renovar o cargar un documento: el mismo objeto cambia con cada mensaje (aunque el texto se repita) y se olvida al llegar a otra pantalla.
  const mensaje = $derived(dialogos.mensaje("vencimientos"));
  const anunciado = textoAnunciado(() => ({ texto: mensaje.texto, repetir: mensaje }));

  /** La fila que abrió el diálogo ya no existe: el foco va al título del primer grupo que quede o, si no queda ninguno, al h1. */
  function focoDestino(): HTMLElement | null {
    return document.querySelector<HTMLElement>(`#${ID_LISTA} h2`) ?? document.querySelector<HTMLElement>("main h1");
  }

  /** El resto del nombre accesible de una acción, después del texto visible: «Renovar» + « seguro de ZK 214 BD». */
  function sufijoAccesible(nombreAccesible: string, visible: string): string {
    return nombreAccesible.startsWith(visible) ? nombreAccesible.slice(visible.length) : ` ${nombreAccesible}`;
  }
</script>

{#snippet titular(f: FilaVencimiento)}
  {@const t = f.titular}
  {#if t.tipo === "unidad"}
    <a href={t.href}><span class="solo-lectores">{T.fichaDe}</span>{t.patenteTexto}</a> · {t.interno} · {t.descripcion}
  {:else}
    {T.conductorFicticio(t.nombre)} · {#if t.unidad !== null}{T.detalleDe(t.detalle)}<a href={t.unidad.href}><span class="solo-lectores">{T.fichaDe}</span>{t.unidad.patenteTexto}</a>{:else}{t.detalle}{/if}
  {/if}
  {#if f.proyecto !== null}{" · "}{f.proyecto}{/if}
{/snippet}

{#if c !== null && v !== null}
  <div class="pantalla">
    <div class="encabezado">
      <h1 tabindex="-1">{c.vencimientos.titulo}</h1>
      <p class="contexto"><strong>{contexto.fuerte}</strong>{contexto.resto}</p>
    </div>

    <!-- La regla de 0 a 30 días, interactiva (puntos que se eligen con teclado, detalle con «Renovar» y «Ver ficha»), y su propia leyenda. -->
    <div class="caja regla">
      <Horizonte regla={c.vencimientos.regla} alRenovar={(accion) => dialogos.abrirRenovar(accion, "vencimientos")} />
    </div>

    <FiltrosEnlace leyenda={T.mostrar} opciones={c.vencimientos.filtrosEnlace} valor={filtro} />
    <div class="solo-lectores" role="status">{anunciadoFiltro.valor}</div>

    <!-- Lo que pasó al renovar o cargar. La región existe siempre; sin mensaje no ocupa lugar. -->
    <div class="estado" class:oculto={anunciado.valor === ""} role="status"><span>{anunciado.valor}</span></div>

    <div class="lista" id={ID_LISTA}>
      {#if sinNada}
        <section class="caja vacio">
          <h2 id="vencimientos-vacio" tabindex="-1">{TEXTO_VACIO_PANTALLAS.vencimientos.titulo}</h2>
          <p>{TEXTO_VACIO_PANTALLAS.vencimientos.ayuda}</p>
        </section>
      {:else if v.textoVacio !== null}
        <section class="caja vacio">
          <h2 id="vencimientos-vacio" tabindex="-1">{v.textoVacio}</h2>
        </section>
      {:else}
        {#each v.grupos as g (g.id)}
          <section class="caja grupo" aria-labelledby={`${ID_LISTA}-${g.id}`}>
            <div class="barra" data-tono={g.tono}>
              <h2 id={`${ID_LISTA}-${g.id}`} tabindex="-1"><Forma forma={formaDeTono(g.tono)} />{g.titulo}<span class="cantidad num">{g.cantidad}</span></h2>
            </div>
            <ul>
              {#each g.filas as f (f.alertaId)}
                {@const aspecto = aspectoDeVencimiento(f)}
                <li class="fila" data-tono={aspecto.tono}>
                  <div class="cuerpo">
                    <div class="arriba">
                      <Etiqueta tono={aspecto.tono}>{f.estado}</Etiqueta>
                      <span class="documento">{f.documento}</span>
                    </div>
                    <p class="sec">{@render titular(f)}</p>
                    <p class="sec">
                      {T.venceEl}
                      {#if f.sinVencimiento}<span aria-hidden="true">{f.vence}</span><span class="solo-lectores">{T.sinFecha}</span>{:else}<span class="num">{f.vence}</span>{/if}
                      {#if f.numero !== null}{" · "}<span class="codigo">{f.numero}</span>{/if}
                    </p>
                  </div>
                  <div class="accion">
                    <Boton variante="secundario" tamano="chico" onclick={() => dialogos.abrirRenovar(f.accion, "vencimientos")}>
                      {f.accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(f.accion.nombreAccesible, f.accion.etiqueta)}</span>
                    </Boton>
                  </div>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      {/if}
    </div>
  </div>

  <DialogosDeDocumento {focoDestino} />
{/if}

<style>
  /* Vencimientos (FL-03, 15.9.3): título y resumen, una ficha con el horizonte (papel y tinta, sin campo pleno: el cobalto está solo en el filtro elegido), el segmentado de
     filtros y una ficha por tramo con su forma en el título y una fila por documento. Entre piezas, 12 px, como en Inicio y Movilidades. */
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  /* La línea de resumen: 13 px en `--c-tinta-2`; la primera parte, en tinta. */
  .contexto {
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-tinta-2);
  }
  .contexto strong {
    color: var(--c-tinta);
    font-weight: 600;
  }

  /* La ficha (15.5.4): hoja, contorno de 1 px, cabeza de 1,5 px en tinta, esquinas rectas y sin sombra. La comparten el horizonte, cada grupo y el vacío. */
  .caja {
    container: caja / inline-size;
    min-width: 0;
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
    border-radius: var(--r-0);
    box-shadow: var(--s-panel);
  }

  /* ---------- Horizonte ---------- */
  .regla {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-3);
  }
  @media (min-width: 40rem) {
    .regla {
      padding: var(--e-4);
    }
  }
  @media (min-width: 68.75rem) {
    .regla {
      padding: var(--e-5);
    }
  }

  /* ---------- Lo que pasó al renovar o cargar (15.5.6: borde de 1,5 px y fondo del tono «en orden») ---------- */
  .estado {
    padding: var(--e-3) var(--e-4);
    background: var(--c-ok-f);
    border: var(--b-fuerte) solid var(--c-ok-t);
    border-radius: var(--r-0);
    color: var(--c-tinta);
    font-size: var(--t-cuerpo);
    font-weight: 600;
    line-height: 1.4;
  }
  /* Sin mensaje la región sigue en el DOM (tiene que existir antes del texto) pero no ocupa lugar. */
  .estado.oculto {
    display: none;
  }

  /* ---------- Grupos y filas ---------- */
  .lista {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
  }
  /* Barra de título de la ficha: 44 px como mínimo, la forma del tono antes del título y la cuenta en técnica. */
  .barra {
    display: flex;
    align-items: center;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4);
    border-bottom: 1px solid var(--c-filete);
  }
  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
    padding-block: var(--e-2);
    /* Título de ficha: la letra de texto (la de cartel queda para el h1 y las piezas de vacío). */
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: var(--t-h2-ficha);
    font-weight: var(--t-peso-h2);
    line-height: 1.3;
  }
  .cantidad {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    color: var(--c-tinta-3);
  }

  .fila {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) + 6px);
  }
  /* Precinto de 6 px del tono en el borde izquierdo (15.5.5). Solo decoración: lo que dice el estado está en la etiqueta. */
  .fila::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 6px;
    background-image: repeating-linear-gradient(-45deg, var(--tono-r, var(--c-tinta-3)) 0 1.5px, transparent 1.5px 5px);
  }
  .fila + .fila {
    border-top: 1px solid var(--c-filete);
  }
  @media (hover: hover) {
    .fila:hover {
      background: var(--c-papel-2);
    }
  }
  .cuerpo {
    min-width: 0;
  }
  .arriba {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .documento {
    min-width: 0;
    font-weight: 650;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .sec {
    margin-top: 0.1875rem;
    color: var(--c-tinta-2);
    font-size: var(--t-tabla);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  /* El enlace de la patente mide 24 px de alto como mínimo (WCAG 2.5.8): en línea con el texto medía 16 px. */
  .sec a {
    position: relative;
    display: inline-block;
    min-height: 1.5rem;
    color: inherit;
    line-height: 1.5rem;
  }
  /* El número del documento («DEMO-LC-8514») no se parte en el guion: si no entra, baja entero. */
  .codigo {
    white-space: nowrap;
  }
  /* El enlace de la unidad va dentro de una frase: su área de toque sube a 44 px sin ensanchar el renglón. */
  .sec a::after {
    content: "";
    position: absolute;
    inset-inline: -0.25rem;
    inset-block: -0.75rem;
  }
  /* «Renovar» o «Cargar» (secundario): 36 px en escritorio. El tamaño «chico» del botón queda para los renglones de las fichas. */
  .accion :global(.boton) {
    min-height: 2.25rem;
  }
  /* Con poco lugar (el celular, o el texto agrandado) el botón baja debajo del texto, a todo el ancho y de 40 px. */
  @container caja (max-width: 30rem) {
    .fila {
      grid-template-columns: minmax(0, 1fr);
    }
    .accion {
      display: flex;
    }
    .accion :global(.boton) {
      flex: 1 1 auto;
      min-height: 2.5rem;
    }
  }
  /* Con el texto agrandado (la caja mide 14 rem o menos) un número largo no puede ensanchar la página: ahí sí se parte. */
  @container caja (max-width: 14rem) {
    .codigo {
      white-space: normal;
    }
  }

  /* ---------- Vacío (15.5.12): caja de 1 px punteada en `--c-control` sobre la hoja, el porqué en cartel a 78 % y 24 px. Sin ilustración ---------- */
  .vacio {
    display: grid;
    justify-items: start;
    gap: var(--e-2);
    padding: var(--e-5) var(--e-4);
    border: 1px dashed var(--c-control);
    background: var(--c-hoja);
  }
  .vacio h2 {
    padding: 0;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-h2);
    font-weight: var(--t-peso-cartel);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .vacio p {
    max-width: 46ch;
    color: var(--c-tinta-2);
  }

  @media (forced-colors: active) {
    .caja,
    .estado {
      border-color: CanvasText;
    }
    .fila::before {
      background-image: repeating-linear-gradient(-45deg, CanvasText 0 1.5px, transparent 1.5px 5px);
    }
  }
</style>
