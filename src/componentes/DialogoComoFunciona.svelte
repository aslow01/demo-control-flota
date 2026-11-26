<script lang="ts">
  // Diálogo "Cómo funciona" (5.17): qué es, las reglas de vencimiento, el parte, dónde se guardan los datos y para qué sirve "Ver como".
  // Solo informa: un único botón "Entendido" que lo cierra. (El horizonte mediano de ejemplo de la especificación llega con el 4.1:
  // mientras tanto las reglas se explican con las mismas etiquetas que usa la aplicación.)
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import { TEXTO_COMO_FUNCIONA as T } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    abierto = $bindable(false),
    focoDestino,
  }: {
    abierto?: boolean;
    /** A dónde va el foco al cerrar si no es el botón que lo abrió (el título de la pantalla nueva, si «Atrás» cambió la pantalla). */
    focoDestino?: () => HTMLElement | null;
  } = $props();

  // Mismos tonos e íconos que las etiquetas de vencimiento (5.7), en el orden de T.reglas.
  const aspecto: { tono: Tono; icono: NombreIcono }[] = [
    { tono: "critico", icono: "vencido" },
    { tono: "semana", icono: "alerta" },
    { tono: "quincena", icono: "calendario" },
    { tono: "mes", icono: "anillo" },
    { tono: "vigente", icono: "check" },
  ];
</script>

<Dialogo titulo={T.titulo} bind:abierto cancelar={null} focoInicial="titulo" {focoDestino}>
  <div class="bloque">
    {#each T.queEs as parrafo (parrafo)}
      <p class="parrafo">{parrafo}</p>
    {/each}
  </div>

  <section class="bloque" aria-labelledby="cf-reglas">
    <h3 id="cf-reglas">{T.tituloReglas}</h3>
    <ul class="reglas">
      {#each T.reglas as regla, i (regla.etiqueta)}
        <li>
          <Etiqueta tono={aspecto[i]?.tono ?? "neutro"} icono={aspecto[i]?.icono ?? "guion"}>{regla.etiqueta}</Etiqueta>
          <span class="nota">{regla.texto}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="bloque" aria-labelledby="cf-parte">
    <h3 id="cf-parte">{T.tituloParte}</h3>
    <p class="parrafo">{T.parte}</p>
  </section>

  <section class="bloque" aria-labelledby="cf-datos">
    <h3 id="cf-datos">{T.tituloDatos}</h3>
    <p class="parrafo">{T.datos}</p>
  </section>

  <section class="bloque" aria-labelledby="cf-ver-como">
    <h3 id="cf-ver-como">{T.tituloVerComo}</h3>
    <p class="parrafo">{T.verComo}</p>
  </section>

  {#snippet pie()}
    <Boton onclick={() => (abierto = false)}>{T.entendido}</Boton>
  {/snippet}
</Dialogo>

<style>
  .bloque {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  h3 {
    font-size: var(--t-cuerpo);
  }
  .reglas {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .reglas li {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-1);
  }
</style>
