<script lang="ts">
  // Panel «Historial» de la ficha (5.16 y 6.3): filtros con conteo, los eventos agrupados por día (el más nuevo arriba), de a 30 con «Ver 30 más».
  // No tiene reglas: todo lo arma `vistaDeHistorial(historial, filtro, límite)` (lib/estado/ficha.ts); el filtro y el límite son estado de este panel.
  //  - Cada evento: hora · ícono del tipo · resumen y autor. El parte enviado es un `details` (resumen corto; al abrir: kilometraje, combustible, litros,
  //    puntos con novedad, «8 puntos en orden», advertencias y el enlace al parte); el documento corregido muestra «Antes / Después» por campo.
  //  - «Ver 30 más»: el foco va al primer evento nuevo (`ids[límiteAnterior]`). Cambiar el filtro vuelve al primer tramo de 30.
  //  - La barra de estado del panel dice «Mostrando 30 de 128 eventos.» y es la región viva: se actualiza al elegir un filtro y al pedir más.
  import { tick, untrack } from "svelte";
  import { vistaDeHistorial, PASO_HISTORIAL, type IdFiltroHistorial, type PanelHistorial } from "../lib/estado/ficha.ts";
  import { TEXTO_FICHA } from "../lib/dominio/textos.ts";
  import Boton from "./Boton.svelte";
  import Detalles from "./Detalles.svelte";
  import FiltrosConteo from "./FiltrosConteo.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";

  let { historial, idTitulo }: { historial: PanelHistorial; idTitulo: string } = $props();

  let filtro = $state<IdFiltroHistorial>("todo");
  let limite = $state(PASO_HISTORIAL);
  const vista = $derived(vistaDeHistorial(historial, filtro, limite));

  // La barra de estado arranca con el conteo de ahora y se pone al día al elegir un filtro, pedir más o cuando cambian los datos.
  let anuncio = $state(untrack(() => vista.anuncio));
  let historialAnterior = untrack(() => historial);
  $effect(() => {
    const actual = historial;
    if (actual === historialAnterior) return;
    historialAnterior = actual;
    untrack(() => (anuncio = vista.anuncio));
  });

  function elegirFiltro(id: IdFiltroHistorial): void {
    filtro = id;
    limite = PASO_HISTORIAL;
    anuncio = vistaDeHistorial(historial, id, PASO_HISTORIAL).anuncio;
  }

  async function verMas(): Promise<void> {
    const antes = limite;
    limite = antes + PASO_HISTORIAL;
    await tick();
    anuncio = vista.anuncio;
    const primeroNuevo = vista.ids[antes];
    if (primeroNuevo !== undefined) document.getElementById(idDeEvento(primeroNuevo))?.focus();
  }

  const idDeEvento = (eventoId: string): string => `${idTitulo}-ev-${eventoId}`;
</script>

<Panel id={idTitulo} titulo={historial.titulo} icono="reloj" meta={historial.rotuloCantidad} estado={anuncio}>
  {#snippet herramientas()}
    <FiltrosConteo leyenda={T.mostrar} opciones={historial.filtros} valor={filtro} alElegir={elegirFiltro} />
  {/snippet}

  {#if vista.vacio !== null}
    <p class="vacio"><Icono nombre="guion" />{vista.vacio}</p>
  {:else}
    <div class="dias">
      {#each vista.grupos as g (g.dia)}
        <section class="dia" aria-labelledby={`${idTitulo}-dia-${g.dia}`}>
          <h3 id={`${idTitulo}-dia-${g.dia}`}>{g.titulo}</h3>
          <ul>
            {#each g.eventos as e (e.eventoId)}
              {@const d = e.detalle}
              <li class="evento" id={idDeEvento(e.eventoId)} tabindex="-1">
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
                      {#if d.fueraDeTermino}<p>{T.historial.fueraDeTermino}</p>{/if}
                      <p><a class="enlace-parte" href={d.href}>{TEXTO_FICHA.historial.verParte}</a></p>
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
                  <p class="autor">{e.autor}</p>
                </div>
              </li>
            {/each}
          </ul>
        </section>
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
  /* Grilla de 5.16: hora · ícono · resumen. En teléfono la hora va encima del resumen. */
  .evento {
    display: grid;
    grid-template-columns: 1.25rem minmax(0, 1fr);
    grid-template-areas:
      "icono hora"
      "icono cuerpo";
    column-gap: var(--e-3);
    padding-block: var(--e-2);
    border-bottom: 1px solid var(--c-borde);
  }
  .dia li:last-child {
    border-bottom: 0;
  }
  @media (min-width: 40rem) {
    .evento {
      grid-template-columns: 4rem 1.25rem minmax(0, 1fr);
      grid-template-areas: "hora icono cuerpo";
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
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-3);
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
