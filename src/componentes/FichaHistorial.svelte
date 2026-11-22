<script lang="ts">
  // Panel «Historial» de la ficha (5.16 y 6.3): filtros con conteo, los eventos agrupados por día (el más nuevo arriba), de a 10 (menos de 40rem) o de a 30 (desde 40rem) con «Ver 10 más» / «Ver 30 más» (D2).
  // No tiene reglas: todo lo arma `vistaDeHistorial(historial, filtro, límite)` (lib/estado/ficha.ts); el filtro y el límite son estado de este panel.
  //  - Cada evento: hora · ícono del tipo · resumen y autor. El parte enviado es un `details` (resumen corto; al abrir: kilometraje, combustible, litros,
  //    puntos con novedad, «8 puntos en orden», advertencias y el enlace al parte); el documento corregido muestra «Antes / Después» por campo.
  //  - El paso (10 o 30) se lee una sola vez con `matchMedia("(min-width: 40rem)")` al crearse el panel (la pantalla de la ficha se recrea en cada unidad): si después
  //    cambia el ancho de la ventana no se esconde nada de lo que ya se ve. «Ver N más»: el foco va al primer evento nuevo (`ids[límiteAnterior]`). Cambiar el filtro vuelve al primer tramo.
  //  - La barra de estado del panel dice «Mostrando 30 de 128 eventos.» y es la región viva: se actualiza al elegir un filtro y al pedir más.
  import { tick } from "svelte";
  import { PASO_HISTORIAL_ANCHO, PASO_HISTORIAL_ANGOSTO, vistaDeHistorial, type IdFiltroHistorial, type PanelHistorial } from "../lib/estado/ficha.ts";
  import { TEXTO_FICHA } from "../lib/dominio/textos.ts";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Boton from "./Boton.svelte";
  import Detalles from "./Detalles.svelte";
  import FiltrosConteo from "./FiltrosConteo.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";

  let { historial, idTitulo }: { historial: PanelHistorial; idTitulo: string } = $props();

  // 5.16 / D2: 10 eventos por tramo en pantallas angostas (< 40rem), 30 desde 40rem. Se mide una vez, al abrir la ficha.
  const PASO = typeof matchMedia === "function" && matchMedia("(min-width: 40rem)").matches ? PASO_HISTORIAL_ANCHO : PASO_HISTORIAL_ANGOSTO;

  let filtro = $state<IdFiltroHistorial>("todo");
  let limite = $state(PASO);
  // El paso se le pasa a `vistaDeHistorial`, que arma el texto del botón («Ver 10 más», o «Ver 4 más» si quedan menos).
  const vista = $derived(vistaDeHistorial(historial, filtro, limite, PASO));

  // La barra de estado muestra siempre el conteo de ahora (texto simple, sin `role="status"`: cuando cambian los datos por una acción de otro panel no se anuncia, para no
  // pisar el mensaje de esa acción). Lo que sí se dice es lo que hace la persona en este panel (elegir un filtro, pedir más), en una región aparte que existe desde el principio.
  let accion = $state({ texto: "" });
  const anunciado = textoAnunciado(() => ({ texto: accion.texto, repetir: accion }));

  function elegirFiltro(id: IdFiltroHistorial): void {
    filtro = id;
    limite = PASO;
    accion = { texto: vistaDeHistorial(historial, id, PASO, PASO).anuncio };
  }

  async function verMas(): Promise<void> {
    const antes = limite;
    limite = antes + PASO;
    await tick();
    accion = { texto: vista.anuncio };
    const primeroNuevo = vista.ids[antes];
    if (primeroNuevo !== undefined) document.getElementById(idDeEvento(primeroNuevo))?.focus();
  }

  const idDeEvento = (eventoId: string): string => `${idTitulo}-ev-${eventoId}`;
</script>

{#snippet conteo()}
  <span>{vista.anuncio}</span>
  <span class="solo-lectores" role="status">{anunciado.valor}</span>
{/snippet}

<Panel id={idTitulo} titulo={historial.titulo} icono="reloj" meta={historial.rotuloCantidad} contenidoEstado={conteo}>
  {#snippet herramientas()}
    <FiltrosConteo leyenda={T.mostrar} opciones={historial.filtros} valor={filtro} alElegir={elegirFiltro} />
  {/snippet}

  {#if vista.vacio !== null}
    <p class="vacio"><Icono nombre="guion" />{vista.vacio}</p>
  {:else}
    <div class="dias">
      {#each vista.grupos as g (g.dia)}
        <!-- Un `div` y no una región: con 30 días serían 30 puntos de referencia (auditoría de accesibilidad B7). El `h3` ya titula el grupo. -->
        <div class="dia">
          <h3>{g.titulo}</h3>
          <ul>
            {#each g.eventos as e (e.eventoId)}
              {@const d = e.detalle}
              <li class="evento" class:con-resumen-largo={d !== null && d.tipo === "parte"} id={idDeEvento(e.eventoId)} tabindex="-1">
                <span class="hora num">{e.hora}</span>
                <span class="icono-evento"><Icono nombre={e.icono} /></span>
                <div class="cuerpo">
                  {#if d !== null && d.tipo === "parte"}
                    <Detalles resumen={d.resumenCorto} suave>
                      <dl class="detalle">
                        <div>
                          <dt>{T.historial.kilometraje}</dt>
                          <dd class="num">{d.kmInicio} → {d.kmFin} ({d.recorrido})</dd>
                        </div>
                        {#if d.combustible !== null}
                          <div>
                            <dt>{T.historial.combustible}</dt>
                            <dd class="num">{d.combustible}</dd>
                          </div>
                        {/if}
                        <div>
                          <dt>{T.historial.litros}</dt>
                          <dd class="num">{d.litros}</dd>
                        </div>
                        {#if d.novedades.length > 0}
                          <div>
                            <dt>{T.historial.novedades}</dt>
                            <dd>
                              <ul class="novedades-parte">
                                {#each d.novedades as n (n.rotulo + n.texto)}
                                  <li>{n.rotulo}: {n.texto}{#if n.critica} ({T.historial.critica}){/if}</li>
                                {/each}
                              </ul>
                            </dd>
                          </div>
                        {/if}
                      </dl>
                      {#if d.puntosEnOrden !== null}<p>{d.puntosEnOrden}</p>{/if}
                      {#each d.advertencias as advertencia (advertencia)}
                        <p class="advertencia"><Icono nombre="alerta" />{advertencia}</p>
                      {/each}
                      {#if d.fueraDeTermino}<p>{T.historial.fueraDePlazo}</p>{/if}
                      <p><a class="enlace-parte" href={d.href} aria-label={T.historial.verParteEnviado(TEXTO_FICHA.historial.verParte, e.instante)}>{TEXTO_FICHA.historial.verParte}</a></p>
                    </Detalles>
                  {:else}
                    <p class="resumen">{e.resumen}</p>
                    {#if d !== null && d.tipo === "documento-corregido"}
                      <table class="cambios">
                        <caption class="solo-lectores">{T.historial.resumenDelDetalle}</caption>
                        <thead>
                          <tr>
                            <th scope="col">{T.historial.campo}</th>
                            <th scope="col">{TEXTO_FICHA.historial.antes}</th>
                            <th scope="col">{TEXTO_FICHA.historial.despues}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each d.cambios as c (c.campo)}
                            <tr>
                              <th scope="row">{c.campo}</th>
                              <td>{c.antes}</td>
                              <td>{c.despues}</td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    {/if}
                  {/if}
                </div>
                <p class="autor">{e.autor}</p>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    {#if vista.botonVerMas !== null}
      <div class="mas"><Boton variante="secundario" onclick={verMas}>{vista.botonVerMas}</Boton></div>
    {/if}
  {/if}
</Panel>

<style>
  .dias {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
  .dia {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    padding-top: var(--e-3);
    border-top: 1px solid var(--c-borde);
  }
  .dia:first-child {
    padding-top: 0;
    border-top: 0;
  }
  h3 {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  /* Grilla de 5.16. Con poco ancho: ícono · (hora y autor en un renglón, el resumen debajo); desde 40 rem: hora · ícono · resumen · autor, todo en un renglón (un evento
     cerrado mide unos 60 px). La hora, el ícono y el autor se alinean con el centro del resumen: el de un `details` mide 44 px (su blanco
     táctil); el de un texto suelto, 24. */
  .evento {
    display: grid;
    grid-template-columns: 1.25rem auto minmax(0, 1fr);
    grid-template-areas:
      "icono hora autor"
      "icono cuerpo cuerpo";
    align-items: start;
    column-gap: var(--e-3);
    padding-block: var(--e-2);
    border-bottom: 1px solid var(--c-borde);
  }
  .dia li:last-child {
    border-bottom: 0;
  }
  @media (min-width: 40rem) {
    .evento {
      grid-template-columns: 4rem 1.25rem minmax(0, 1fr) auto;
      grid-template-areas: "hora icono cuerpo autor";
    }
  }
  .hora {
    grid-area: hora;
    font-family: var(--t-mono);
    font-size: var(--t-chico);
    line-height: 1.5rem;
    color: var(--c-texto-3);
  }
  .icono-evento {
    grid-area: icono;
    --icono-tam: 1.125rem;
    display: inline-flex;
    align-items: center;
    align-self: start;
    height: 1.5rem;
    color: var(--c-texto-2);
  }
  .cuerpo {
    grid-area: cuerpo;
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .resumen {
    font-size: var(--t-tabla);
    line-height: 1.5rem;
    overflow-wrap: anywhere;
  }
  .autor {
    grid-area: autor;
    min-width: 0;
    font-size: var(--t-chico);
    line-height: 1.5rem;
    color: var(--c-texto-3);
    overflow-wrap: anywhere;
  }
  @media (min-width: 40rem) {
    .autor {
      justify-self: end;
      max-width: 14rem;
      text-align: right;
    }
    .evento.con-resumen-largo :is(.hora, .autor) {
      line-height: var(--alto-tactil);
    }
    .evento.con-resumen-largo .icono-evento {
      height: var(--alto-tactil);
    }
  }
  .detalle {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  .detalle > div {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--e-2);
  }
  .detalle dt {
    font-weight: 600;
    color: var(--c-texto-2);
  }
  .detalle dt::after {
    content: ":";
  }
  .detalle dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .novedades-parte {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  .advertencia {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-1);
    font-weight: 600;
    color: var(--c-semana-t);
  }
  .advertencia :global(.icono) {
    margin-top: 0.1rem;
  }
  .enlace-parte {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }

  .cambios {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
  .cambios th,
  .cambios td {
    padding: var(--e-1) var(--e-3) var(--e-1) 0;
    vertical-align: top;
    text-align: left;
    overflow-wrap: anywhere;
  }
  .cambios thead th {
    font-size: var(--t-rotulo);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  .cambios tbody th {
    font-weight: 600;
  }

  .mas {
    display: flex;
  }
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
</style>
