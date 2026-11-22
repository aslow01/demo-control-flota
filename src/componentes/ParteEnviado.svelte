<script lang="ts">
  // Panel de resultado de un parte (5.4, variante «panel de resultado»; 6.5, C y D): sin barra de título, con una franja izquierda de 4 px del tono del resultado (vigente si salió bien o se cerró,
  // semana si se envió con documentación vencida aceptada, crítico si la unidad no puede salir), el título (el `h1` de la pantalla o un `h2`, en `--c-texto`, con el ícono del tono a su izquierda:
  // `i-check`, `i-alerta` o `i-octogono`; el color va en la franja y en el ícono, nunca en el título: C9), la línea del resultado, un `dl` con los datos, las notas y los avisos, y las acciones
  // al final (el primario primero). El `h1` lleva `aria-describedby` hacia la línea, así el lector la oye junto al título cuando recibe el foco (m2). La lectura (D) no lleva ícono: la etiqueta
  // «Cerrado» ya dice el estado, y un parte leído días después no tiene que parecer un «enviado con éxito». Lo usan cuatro vistas: C1 «Revisión enviada», C2 «La unidad no puede salir», C3 «Parte cerrado» (el título es el `h1` y recibe
  // el foco) y la lectura de un parte cerrado (D: el `h1` es «Parte del miércoles 18/11/2026», con la etiqueta «Cerrado», los momentos de la revisión y el cierre y la revisión de la unidad).
  // No tiene reglas: todo lo arma la lógica (`panelDeRevisionEnviada`, `panelDeSinSalida`, `panelDeParteEnviado`: lib/estado/parte.ts).
  //  - `titulo` reemplaza al del panel (la lectura usa el de la ruta); `etiqueta` agrega «Cerrado» al lado; `momentos` son las filas «Revisión» y «Cierre», antes de las del panel;
  //    `sinLinea` omite la línea (en la lectura sus horas ya están en `momentos`); `encabezado` va debajo del título; `cuerpo`, después de los datos; `acciones`, al final.
  import type { Snippet } from "svelte";
  import type { PanelParteEnviado } from "./tipos.ts";
  import Aviso from "./Aviso.svelte";
  import Dato from "./Dato.svelte";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  let {
    panel,
    nivel = "h2",
    titulo,
    etiqueta,
    momentos = [],
    sinLinea = false,
    encabezado,
    cuerpo,
    acciones,
  }: {
    panel: PanelParteEnviado;
    /** El `h1` cuando es lo principal de la pantalla (recién enviado y lectura); si no, `h2`. */
    nivel?: "h1" | "h2";
    titulo?: string;
    etiqueta?: string;
    momentos?: { rotulo: string; valor: string }[];
    sinLinea?: boolean;
    encabezado?: Snippet;
    cuerpo?: Snippet;
    /** Los botones de abajo («Volver al inicio»…). */
    acciones?: Snippet;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(`${uid}-titulo`);
  const idLinea = $derived(`${uid}-linea`);
  const critico = $derived(panel.variante === "sin-salida");
  // La lectura (D) se reconoce por su etiqueta «Cerrado»: no lleva ícono.
  const lectura = $derived(etiqueta !== undefined);
  const tono = $derived(critico ? "critico" : panel.conDocumentacionVencida && !lectura ? "semana" : "vigente");
  const iconoDelTono = $derived(critico ? "octogono" : tono === "semana" ? "alerta" : "check");
  const filas = $derived([...momentos, ...panel.filas]);
</script>

<section class="resultado" aria-labelledby={idTitulo} data-tono={tono}>
  <div class="cabeza">
    <svelte:element this={nivel} class="titulo" id={idTitulo} tabindex="-1" aria-describedby={sinLinea ? undefined : idLinea}>{#if !lectura}<Icono nombre={iconoDelTono} />{/if}{titulo ?? panel.titulo}</svelte:element>
    {#if etiqueta !== undefined}<EtiquetaParte tipo="cerrado" texto={etiqueta} />{/if}
  </div>
  {#if encabezado !== undefined}{@render encabezado()}{/if}
  {#if !sinLinea}<p class="linea" id={idLinea}>{panel.linea}</p>{/if}
  {#if filas.length > 0}
    <dl class="datos">
      {#each filas as f (f.rotulo)}
        <Dato etiqueta={f.rotulo} valor={f.valor} />
      {/each}
    </dl>
  {/if}
  {#if panel.notaEncargado !== null}<p class="nota">{panel.notaEncargado}</p>{/if}
  {#if panel.avisoCritica !== null}
    <Aviso tono="semana" icono="llave">{panel.avisoCritica}</Aviso>
  {/if}
  {#if panel.advertencias.length > 0}
    <div class="aceptados">
      <p class="rotulo-chico">{T.enviado.avisosAceptados}</p>
      <ul>
        {#each panel.advertencias as a, i (i)}
          <li data-tono={a.tono}><span class="icono-aviso"><Icono nombre={a.tono === "critico" ? "vencido" : "alerta"} /></span><span>{a.texto}</span></li>
        {/each}
      </ul>
    </div>
  {/if}
  {#if panel.fueraDePlazo !== null}<p class="nota">{panel.fueraDePlazo}</p>{/if}
  {#if panel.parrafo !== null}<p class="parrafo">{panel.parrafo}</p>{/if}
  {#if cuerpo !== undefined}{@render cuerpo()}{/if}
  {#if acciones !== undefined}<div class="acciones">{@render acciones()}</div>{/if}
</section>

<style>
  .resultado {
    container: resultado / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
    padding: var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-left: 4px solid var(--tono-r);
    border-radius: var(--r-3);
    box-shadow: var(--s-ventana);
  }
  @media (min-width: 40rem) {
    .resultado {
      padding: var(--e-5);
    }
  }
  .cabeza {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  .titulo {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
    font-size: var(--t-h2);
    line-height: 1.25;
    color: var(--c-texto);
  }
  .titulo :global(.icono) {
    flex: none;
    color: var(--tono-t);
  }
  .linea {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .parrafo {
    color: var(--c-texto-2);
  }
  .datos {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-3);
  }
  @container resultado (min-width: 28rem) {
    .datos {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .datos :global(dd) {
    overflow-wrap: anywhere;
  }
  .rotulo-chico {
    font-size: var(--t-chico);
    font-weight: 600;
    color: var(--c-texto-2);
  }
  .aceptados ul {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    margin-top: var(--e-1);
  }
  .aceptados li {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .icono-aviso {
    --icono-tam: 1rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1rem;
    color: var(--tono-t);
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
  }
  /* Texto agrandado (la pantalla mide 17 rem o menos): menos relleno a los lados y botones con menos aire, así las palabras largas no se parten (S5 de la etapa 7). */
  @container pagina-parte (max-width: 17rem) {
    .resultado {
      padding: var(--e-3) var(--e-2);
    }
    .acciones :global(.enlace-accion:not([data-variante="texto"])) {
      padding-inline: var(--e-2);
    }
  }
  /* 320 px con el texto agrandado (la pantalla mide 8 rem): el relleno baja otro escalón, para que «Documentación» (7 rem) entre entera. */
  @container pagina-parte (max-width: 8.5rem) {
    .resultado {
      padding-inline: var(--e-1);
    }
  }
</style>
