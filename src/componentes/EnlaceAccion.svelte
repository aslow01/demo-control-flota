<script lang="ts">
  // Un enlace con el aspecto del botón secundario (5.1): para las acciones de una fila que llevan a otra pantalla ("Abrir parte", "Ver ficha").
  // Es un <a>: navega; las acciones que hacen algo en el lugar son <button> (componente Boton).
  import type { Snippet } from "svelte";

  let { href, children }: { href: string; children: Snippet } = $props();
</script>

<a class="enlace-accion" {href}>{@render children()}</a>

<style>
  .enlace-accion {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto);
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    transition: background-color var(--m-rapido) var(--m-curva);
  }
  @media (hover: hover) {
    .enlace-accion:hover {
      background: var(--c-superficie-2);
    }
  }
</style>
