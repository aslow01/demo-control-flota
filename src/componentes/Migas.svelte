<script lang="ts">
  // Encabezado de lámina de la barra de escritorio (docs/diseno-ui.md, 15.4.3): reemplaza a las migas. A la izquierda el código de lámina («FL-01» a «FL-09»), que es presentación (`aria-hidden`:
  // no agrega nada a lo que ya dice el `h1`) y va fuera del `h1`; en la ficha y el parte, a continuación, el enlace al padre («‹ Movilidades»): la única vuelta atrás en escritorio.
  // El enlace conserva su `nav` con nombre («Ruta») y su nombre accesible «Volver a …». En las pantallas del menú no hay enlace (ya no se repite el nombre de la pantalla).
  // Lo calculan `codigoDeLamina` y `padreDeLamina` (lamina.ts); acá solo se dibuja.
  import Icono from "./Icono.svelte";
  import type { PadreDeLamina } from "./lamina.ts";
  import { TEXTO_NAVEGACION } from "./textos-marco.ts";

  let { codigo, padre }: { codigo: string | null; padre: PadreDeLamina | null } = $props();
</script>

<div class="lamina">
  {#if codigo !== null}<span class="lamina-codigo" aria-hidden="true">{codigo}</span>{/if}
  {#if padre !== null}
    <nav aria-label={TEXTO_NAVEGACION.migas}>
      <a href={padre.href} aria-label={padre.nombreAccesible}><Icono nombre="flecha-izq" />{padre.texto}</a>
    </nav>
  {/if}
</div>

<style>
  .lamina {
    display: flex;
    align-items: center;
    gap: var(--e-4);
    min-width: 0;
  }
  /* Código de lámina: técnica de 12 px, tinta 3 (sin importar el modo, el contraste lo mide `npm run contraste`). */
  .lamina-codigo {
    color: var(--c-tinta-3);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: 1;
    white-space: nowrap;
  }
  a {
    --icono-tam: 1rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-control);
    color: var(--c-pleno-texto);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  @media (hover: hover) {
    a:hover {
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
  }
</style>
