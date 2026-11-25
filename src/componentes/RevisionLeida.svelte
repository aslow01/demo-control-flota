<script lang="ts">
  // La revisión de un parte tal como se envió, en lectura: los puntos «En orden» agrupados en una línea («8 puntos en orden: …») y, debajo, los que tienen novedad con su texto
  // (6.5, D; y el `details` «Ver la revisión» del resumen del paso 2). No tiene reglas: todo lo arma `revisionEnLectura` (lib/estado/parte.ts, por `tipos.ts`). Sin puntos ni novedades no muestra nada.
  import type { RevisionEnLectura } from "./tipos.ts";
  import Icono from "./Icono.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  let { revision }: { revision: RevisionEnLectura } = $props();
</script>

<div class="revision">
  {#if revision.puntosEnOrden !== null}
    <p class="en-orden"><span class="icono-orden"><Icono nombre="check" /></span><span>{revision.puntosEnOrden}</span></p>
  {/if}
  {#if revision.novedades.length > 0}
    <ul class="novedades">
      {#each revision.novedades as n (n.rotulo + n.texto)}
        <li class="novedad" data-tono={n.critica ? "critico" : "semana"}>
          <span class="icono-novedad"><Icono nombre={n.critica ? "octogono" : "alerta"} /></span>
          <p>
            <strong>{n.critica ? `${n.rotulo} (${T.lectura.critica})` : n.rotulo}:</strong>
            {n.texto}
          </p>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .revision {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
  }
  .en-orden {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    overflow-wrap: anywhere;
  }
  .icono-orden {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--c-vigente-t);
  }
  .novedades {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .novedad {
    display: flex;
    align-items: flex-start;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4);
    background: var(--tono-f);
    border: 1px solid transparent;
    border-left: 4px solid var(--tono-r);
    border-radius: 0 var(--r-1) var(--r-1) 0;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .icono-novedad {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--tono-t);
  }
  /* Texto agrandado (el contenedor mide 17 rem o menos): el ícono y el texto no caben uno al lado del otro sin partir las palabras; el texto baja a su renglón, a todo el ancho (S5 de la etapa 7). */
  @container (max-width: 17rem) {
    .en-orden,
    .novedad {
      flex-wrap: wrap;
      gap: var(--e-1) var(--e-2);
    }
    .novedad {
      padding-inline: var(--e-2);
    }
    .en-orden > :last-child,
    .novedad > :last-child {
      flex: 1 1 8rem;
      min-width: 0;
      margin: 0;
    }
  }
</style>
