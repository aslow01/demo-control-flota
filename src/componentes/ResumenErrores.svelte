<script lang="ts">
  // 5.15 Resumen de errores (patrón GOV.UK): panel arriba del formulario con borde cobre de 2 px y fondo cobre suave, un título con la forma del tono y una lista de enlaces
  // a cada campo con su mensaje, en el orden del formulario. No es `role="alert"`: es un `div` con `tabindex="-1"` al que quien lo usa le da el foco
  // cuando aparece (`enfocar()`). Los enlaces mueven el foco al campo sin tocar la dirección de la página (el enrutador lee el hash).
  import Forma from "./Forma.svelte";

  let {
    titulo,
    items,
    general = "",
    nivel = "h2",
  }: {
    titulo: string;
    /** `campoId` es el id del control al que lleva el enlace. */
    items: { campoId: string; mensaje: string }[];
    /** Un error que no es de ningún campo (la fecha ya no vale, no se pudo guardar): va como texto, antes de la lista. */
    general?: string;
    /** Nivel del título: `h2` en una pantalla (el `h1` es lo anterior); `h3` dentro de un diálogo, cuyo título ya es un `h2`. */
    nivel?: "h2" | "h3";
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(`${uid}-titulo`);
  let caja = $state<HTMLElement | null>(null);

  export function enfocar(): void {
    caja?.focus();
  }

  function ir(evento: MouseEvent, campoId: string): void {
    evento.preventDefault();
    document.getElementById(campoId)?.focus();
  }
</script>

<div class="resumen" tabindex="-1" bind:this={caja} role="group" aria-labelledby={idTitulo}>
  <svelte:element this={nivel} class="titulo" id={idTitulo}><Forma forma="rombo" tono="critico" /><span>{titulo}</span></svelte:element>
  {#if general !== ""}<p class="general">{general}</p>{/if}
  <ul>
    {#each items as item (item.campoId)}
      <li><a href={`#${item.campoId}`} onclick={(e) => ir(e, item.campoId)}>{item.mensaje}</a></li>
    {/each}
  </ul>
</div>

<style>
  .resumen {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
    padding: var(--e-3) var(--e-4);
    background: var(--c-critico-f);
    border: 2px solid var(--c-critico-r);
    border-radius: var(--r-1);
    color: var(--c-critico-t);
  }
  /* El foco llega por programa al enviar con errores (con ratón no cuenta como «foco visible»): quien ve tiene que saber dónde quedó. Anillo siempre, que se suma al borde. */
  .resumen[tabindex="-1"]:focus {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }
  .titulo {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: var(--t-h3);
    font-weight: 750;
    line-height: 1.3;
    color: var(--c-critico-t);
  }
  .titulo :global(.forma) {
    margin-top: 0.4375rem;
  }
  .general {
    font-size: var(--t-chico);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  li {
    font-size: 0.9375rem;
    line-height: 1.4;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
    color: var(--c-critico-t);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    overflow-wrap: anywhere;
  }
  /* Texto agrandado: menos relleno a los lados para que el mensaje conserve el ancho. */
  @container parte (max-width: 17rem) {
    .resumen {
      padding-inline: var(--e-2);
    }
  }
</style>
