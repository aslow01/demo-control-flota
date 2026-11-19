<script lang="ts">
  // Panel «Parte enviado» (6.5): una franja vigente a la izquierda, el título, la línea «ZK 214 BD, 18/11/2026, enviado a las 18:42.», los datos en un `dl` (Recorrido,
  // Combustible, Combustible cargado, Novedades), el aviso de que la unidad quedó fuera de servicio si hubo una novedad crítica, los avisos que se aceptaron al enviar y
  // «Enviado fuera de término.». Lo usan las dos vistas: al terminar de enviar (el título es el `h1` de la pantalla y recibe el foco, con «Volver al inicio») y el parte
  // ya enviado en lectura (el título es un `h2`). No tiene reglas: todo lo arma `panelDeParteEnviado` (lib/estado/parte.ts).
  import type { Snippet } from "svelte";
  import type { PanelParteEnviado } from "../lib/estado/parte.ts";
  import Aviso from "./Aviso.svelte";
  import Dato from "./Dato.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  let {
    panel,
    nivel = "h2",
    acciones,
  }: {
    panel: PanelParteEnviado;
    /** El `h1` cuando es lo principal de la pantalla (recién enviado); si no, `h2`. */
    nivel?: "h1" | "h2";
    /** Los botones de abajo («Volver al inicio»). */
    acciones?: Snippet;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(`${uid}-titulo`);
</script>

<section class="enviado" aria-labelledby={idTitulo}>
  <svelte:element this={nivel} class="titulo" id={idTitulo} tabindex="-1"><Icono nombre="check" />{panel.titulo}</svelte:element>
  <p class="linea">{panel.linea}</p>
  <dl class="datos">
    {#each panel.filas as f (f.rotulo)}
      <Dato etiqueta={f.rotulo} valor={f.valor} />
    {/each}
  </dl>
  {#if panel.avisoCritica !== null}
    <Aviso tono="semana" icono="llave">{panel.avisoCritica}</Aviso>
  {/if}
  {#if panel.advertencias.length > 0}
    <div class="aceptados">
      <p class="rotulo-chico">{T.enviado.avisosAceptados}</p>
      <ul>
        {#each panel.advertencias as a (a)}
          <li><span class="icono-aviso"><Icono nombre="alerta" /></span><span>{a}</span></li>
        {/each}
      </ul>
    </div>
  {/if}
  {#if panel.fueraDeTermino !== null}<p class="nota">{panel.fueraDeTermino}</p>{/if}
  {#if acciones !== undefined}<div class="acciones">{@render acciones()}</div>{/if}
</section>

<style>
  .enviado {
    container: enviado / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
    padding: var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-left: 4px solid var(--c-vigente-r);
    border-radius: var(--r-3);
    box-shadow: var(--s-ventana);
  }
  @media (min-width: 40rem) {
    .enviado {
      padding: var(--e-5);
    }
  }
  .titulo {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-size: var(--t-h2);
    line-height: 1.25;
    color: var(--c-vigente-t);
  }
  .titulo :global(.icono) {
    flex: none;
  }
  .linea {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .datos {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-3);
  }
  @container enviado (min-width: 28rem) {
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
    color: var(--c-semana-t);
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
  }
</style>
