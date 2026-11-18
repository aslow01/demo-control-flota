<script lang="ts">
  // Panel «Novedades» de la ficha (6.3): filtro Abiertas / Resueltas y, de cada novedad, su etiqueta, el texto, de dónde salió, la fecha y «Resolver».
  // No tiene reglas: todo lo arma `ficha.novedades` (abiertas: las críticas primero y la más antigua; resueltas: la última resuelta primero).
  //  - El filtro es de este panel (no escribe el hash) y se anuncia en una región `role="status"` aparte; la barra de estado del panel es para lo
  //    que pasó al guardar.
  //  - Una crítica abierta de una unidad fuera de servicio lleva «Impide volver a servicio…» (A4).
  //  - «Resolver» avisa con `alResolver(novedadId)`; «Cargar novedad» con `alCargar`.
  import type { FilaNovedad, PanelNovedades } from "../lib/estado/ficha.ts";
  import Boton from "./Boton.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import FiltrosConteo from "./FiltrosConteo.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  type IdFiltro = PanelNovedades["filtros"][number]["id"];

  let {
    novedades,
    idTitulo,
    estado = "",
    alResolver,
    alCargar,
  }: {
    novedades: PanelNovedades;
    idTitulo: string;
    estado?: string;
    alResolver: (novedadId: string) => void;
    alCargar: () => void;
  } = $props();

  let filtro = $state<IdFiltro>("abiertas");
  let anuncio = $state("");

  const filas = $derived(filtro === "abiertas" ? novedades.abiertas : novedades.resueltas);
  const vacio = $derived(filtro === "abiertas" ? novedades.vacioAbiertas : novedades.vacioResueltas);

  function elegirFiltro(id: IdFiltro): void {
    filtro = id;
    const f = novedades.filtros.find((x) => x.id === id);
    if (f !== undefined) anuncio = T.novedades.anuncio(f.etiqueta, f.cantidad);
  }

  function aspectoDe(n: FilaNovedad): { tono: Tono; icono: NombreIcono } {
    if (n.resolucion !== null) return { tono: "vigente", icono: "check" };
    return n.gravedad === "critica" ? { tono: "critico", icono: "octogono" } : { tono: "semana", icono: "llave" };
  }

  /** El resto del nombre accesible de una acción, después del texto visible: «Resolver» + « novedad de ZU 899 QE: Frenos». */
  function sufijoAccesible(nombreAccesible: string, visible: string): string {
    return nombreAccesible.startsWith(visible) ? nombreAccesible.slice(visible.length) : ` ${nombreAccesible}`;
  }
</script>

<Panel id={idTitulo} titulo={novedades.titulo} icono="novedad" meta={novedades.rotuloCantidad} {estado}>
  <FiltrosConteo leyenda={T.mostrar} opciones={novedades.filtros} valor={filtro} alElegir={elegirFiltro} />
  <div class="solo-lectores" role="status">{anuncio}</div>

  {#if filas.length === 0}
    <p class="vacio"><Icono nombre="guion" />{vacio}</p>
  {:else}
    <ul class="lista">
      {#each filas as n (n.novedadId)}
        {@const aspecto = aspectoDe(n)}
        <li data-tono={n.resolucion === null ? aspecto.tono : undefined}>
          <div class="cabecera">
            <Etiqueta tono={aspecto.tono} icono={aspecto.icono}>{n.estado}</Etiqueta>
            <span class="fecha num">{n.fecha}</span>
          </div>
          <p class="texto">{n.texto}</p>
          <p class="nota">{n.origen}</p>
          {#if n.impideVolver}
            <p class="impide"><Icono nombre="octogono" />{T.novedades.impideVolver}</p>
          {/if}
          {#if n.resolucion !== null}
            <p class="nota">{T.novedades.resuelta(n.resolucion.fecha, n.resolucion.autor)}</p>
            <p class="resolucion">{n.resolucion.texto}</p>
          {/if}
          {#if n.accion !== null}
            {@const accion = n.accion}
            <div class="accion">
              <Boton variante="secundario" onclick={() => alResolver(accion.novedadId)}>
                {accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(accion.nombreAccesible, accion.etiqueta)}</span>
              </Boton>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if novedades.cargar !== null}
    <div class="cargar"><Boton variante="secundario" onclick={alCargar}>{novedades.cargar.etiqueta}</Boton></div>
  {/if}
</Panel>

<style>
  .lista {
    display: flex;
    flex-direction: column;
  }
  li {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-1);
    padding: var(--e-3) var(--e-3) var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-borde);
    box-shadow: inset 4px 0 0 var(--tono-r, transparent);
  }
  li:last-child {
    border-bottom: 0;
  }
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .fecha {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .texto {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .impide {
    --icono-tam: 1rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .resolucion {
    overflow-wrap: anywhere;
  }
  .accion {
    margin-top: var(--e-2);
  }
  .cargar {
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
  @media (forced-colors: active) {
    li[data-tono] {
      box-shadow: none;
      border-left: 4px solid CanvasText;
    }
  }
</style>
