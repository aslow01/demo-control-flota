<script lang="ts">
  // La cifra de la regla de salida, con aspecto de tambores de odómetro (docs/diseno-ui.md, 15.6.1). Decisión DE7 (28/11/2026): es la cifra FIJA con estilo de tambor. No cuenta en la
  // entrada y, al resolver una pieza, los dígitos cambian de una vez (sin `--d` ni `--desde`: no hay tira que girar). Un tambor por dígito, sin ceros de relleno.
  // Es `aria-hidden`: el valor está siempre en el párrafo de la regla para lectores (`Salida.textoLector`), con el valor final desde el primer cuadro.
  let { valor }: { valor: number } = $props();

  const digitos = $derived(String(Math.max(0, Math.trunc(valor))).split(""));
</script>

<span class="odometro" aria-hidden="true">{#each digitos as digito, i (i)}<span class="tambor"><i>{digito}</i></span>{/each}</span>

<style>
  /* Cifra de cartel con aspecto de tambores (15.6.1): Bricolage a 75 %, peso 780. Cada dígito es una ventana de 0,74 em de alto (lo que mide el número) y 0,5 em de ancho; el tamaño y el color los da la
     mordaza (`.cifra`: `--t-monumental` y `--c-sobre-pleno`). Fija: sin tira que gire (DE7). */
  .odometro {
    display: inline-flex;
    align-items: stretch;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-cifra);
    font-weight: var(--t-peso-cifra);
    line-height: 1;
    font-variant-numeric: lining-nums;
  }
  /* La ventana centra el dígito sin depender de la interlínea ni del ancho de letra: con el espaciado de texto aumentado (WCAG 1.4.12: interlínea 1,5 y letras +0,12 em) la cifra no se recorta. */
  .tambor {
    display: inline-block;
    width: 0.5em;
    height: 0.74em;
    overflow: clip;
    overflow-clip-margin: 0.14em;
    text-align: center;
  }
  .tambor i {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-style: normal;
    line-height: 0.74;
  }
</style>
