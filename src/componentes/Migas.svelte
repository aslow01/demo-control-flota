<script lang="ts">
  // Migas de pan de la barra de escritorio. El último tramo es la pantalla de ahora (`aria-current="page"`, sin enlace); los anteriores son enlaces.
  // En las pantallas de la barra lateral hay un solo tramo: el nombre de la pantalla.
  import { TEXTO_NAVEGACION } from "./textos-marco.ts";

  let { tramos }: { tramos: { nombre: string; href: string | null }[] } = $props();
</script>

<nav aria-label={TEXTO_NAVEGACION.migas}>
  <ol>
    {#each tramos as t, i (i)}
      <li>
        {#if t.href !== null}
          <a href={t.href}>{t.nombre}</a>
        {:else}
          <span aria-current="page">{t.nombre}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  nav {
    min-width: 0;
  }
  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
  }
  li + li::before {
    content: "/";
    margin-right: var(--e-2);
    color: var(--c-texto-3);
  }
  a {
    display: inline-block;
    /* Área de toque de 44 px sin cambiar el aspecto del renglón. */
    padding-block: 0.8125rem;
    margin-block: -0.8125rem;
    color: var(--c-texto-2);
    font-weight: 500;
  }
  [aria-current] {
    color: var(--c-texto);
    font-weight: 650;
    overflow-wrap: anywhere;
  }
</style>
