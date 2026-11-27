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
          <span class="marca-vacia" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
          <h2 id="vencimientos-vacio" tabindex="-1">{TEXTO_VACIO_PANTALLAS.vencimientos.titulo}</h2>
          <p>{TEXTO_VACIO_PANTALLAS.vencimientos.ayuda}</p>
        </section>
      {:else if v.textoVacio !== null}
        <section class="caja vacio">
          <span class="marca-vacia sin" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
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
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  .contexto {
    color: var(--c-texto-2);
  }
  .contexto strong {
    color: var(--c-texto);
    font-weight: 600;
  }

  /* El panel de Turno: superficie, borde fino y sombra casi nula. Lo comparten la regla, los grupos y el estado vacío. */
  .caja {
    container: caja / inline-size;
    min-width: 0;
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
    box-shadow: var(--s-panel);
  }

  /* ---------- Regla y leyenda ---------- */
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

  /* ---------- Lo que pasó al renovar o cargar ---------- */
  .estado {
    padding: var(--e-3) var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-left: 4px solid var(--c-vigente-r);
    border-radius: var(--r-2);
    font-weight: 600;
  }
  /* Sin mensaje la región sigue en el DOM (tiene que existir antes del texto) pero no ocupa lugar. */
  .estado.oculto {
    display: none;
  }

  /* ---------- Grupos y filas ---------- */
  .lista {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
  }
  .barra {
    display: flex;
    align-items: center;
    min-height: 3rem;
    padding: 0 var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
    padding-block: var(--e-2);
    /* Como el título de un panel: la fuente de texto (la de títulos queda para el h1 y las cifras). */
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.005em;
  }
  .cantidad {
    color: var(--c-texto-3);
    font-size: var(--t-chico);
    font-weight: 600;
  }

  .fila {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) + 2px);
    /* Franja de 4 px del tono, a la izquierda de la fila. */
    box-shadow: inset 4px 0 0 var(--tono-r, transparent);
  }
  .fila + .fila {
    border-top: 1px solid var(--c-borde);
  }
  @media (hover: hover) {
    .fila:hover {
      background: var(--c-superficie-2);
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
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .sec a {
    position: relative;
    color: inherit;
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
  /* Con poco lugar (320 px, o el texto agrandado) el botón baja debajo del texto, con su ancho. */
  @container caja (max-width: 18rem) {
    .fila {
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
    }
  }
  /* Con el texto agrandado (la caja mide 14 rem o menos) un número largo no puede ensanchar la página: ahí sí se parte. */
  @container caja (max-width: 14rem) {
    .codigo {
      white-space: normal;
    }
  }

  /* ---------- Vacío ---------- */
  .vacio {
    display: grid;
    justify-items: start;
    gap: var(--e-2);
    padding: var(--e-6) var(--e-4);
  }
  .vacio h2 {
    padding: 0;
    font-size: var(--t-h3);
  }
  .vacio p {
    max-width: 46ch;
    color: var(--c-texto-2);
  }
  /* La marca del vacío es la regla propia, vacía: tres tramos, la línea de hoy y un tilde (o un aro si no hubo resultados). */
  .marca-vacia {
    position: relative;
    display: grid;
    grid-template-columns: 7fr 8fr 15fr;
    width: 10.5rem;
    height: 1rem;
    margin: 1.5rem 0 var(--e-2) 0.125rem;
  }
  .marca-vacia i:nth-child(1) {
    background: var(--c-semana-f);
    border-radius: 3px 0 0 3px;
  }
  .marca-vacia i:nth-child(2) {
    background: var(--c-quincena-f);
  }
  .marca-vacia i:nth-child(3) {
    background: var(--c-mes-f);
    border-radius: 0 3px 3px 0;
  }
  .marca-vacia::before {
    content: "";
    position: absolute;
    inset-block: -0.375rem;
    left: -0.125rem;
    width: 3px;
    border-radius: 2px;
    background: var(--c-hoy);
  }
  .marca-vacia b {
    position: absolute;
    top: -1.375rem;
    left: 0.5rem;
    width: 0.75rem;
    height: 1.375rem;
    border: solid var(--c-vigente-r);
    border-width: 0 4px 4px 0;
    transform: rotate(40deg);
  }
  .marca-vacia.sin b {
    top: -0.1875rem;
    left: 4.625rem;
    width: 1.375rem;
    height: 1.375rem;
    border: 3.5px solid var(--c-borde-fuerte);
    border-radius: 50%;
    background: var(--c-superficie);
    transform: none;
  }

  @media (forced-colors: active) {
    .caja,
    .estado {
      border-color: CanvasText;
    }
    .fila {
      box-shadow: none;
      border-inline-start: 4px solid CanvasText;
    }
    .marca-vacia i {
      background: Canvas;
      outline: 1px solid CanvasText;
    }
    .marca-vacia::before {
      background: CanvasText;
    }
    .marca-vacia b {
      border-color: CanvasText;
    }
  }
</style>
