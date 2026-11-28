<script lang="ts">
  // Sello «Datos ficticios» (docs/diseno-ui.md, 15.4.3): un sello de goma, no un control. El texto visible es corto y oculto a lectores; ellos reciben «Demo con datos ficticios».
  // El marco lo dibuja en tres lugares (barra de escritorio, barra superior y renglón de lámina del celular) y la hoja de estilos deja uno solo a la vista, con `display: none` en los demás.
  import { TEXTO_MARCO, TEXTO_SELLO_DE_DATOS } from "./textos-marco.ts";
</script>

<span class="sello"><span class="forma" aria-hidden="true"></span><span aria-hidden="true">{TEXTO_SELLO_DE_DATOS}</span><span class="solo-lectores">{TEXTO_MARCO.etiquetaDemo}</span></span>

<style>
  /* Doble borde, como un sello de goma: 1,5 px y, a 2 px de distancia, un filete de 1 px; girado -1,5°. */
  .sello {
    display: inline-flex;
    flex: none;
    align-items: center;
    /* Con el texto al 200 % el sello no pasa del ancho de su renglón: parte el texto en lugar de ensanchar la página (WCAG 1.4.4 y 1.4.10). */
    max-width: 100%;
    gap: 0.375rem;
    min-height: 1.625rem;
    padding: 0 0.5rem;
    border: 1.5px solid currentColor;
    outline: 1px solid currentColor;
    outline-offset: 2px;
    color: var(--c-pleno-texto);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transform: rotate(-1.5deg);
  }
  /* Rombo de 8 px: la forma del aviso (el color nunca va solo). */
  .forma {
    width: 0.5rem;
    height: 0.5rem;
    background: currentColor;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }
  @media (max-width: 23.74rem) {
    .sello {
      gap: 0.25rem;
      padding: 0 0.375rem;
      letter-spacing: 0.04em;
    }
  }
</style>
