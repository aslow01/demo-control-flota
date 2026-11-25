<script lang="ts">
  // 5.7 Etiqueta de estado: rectángulo con una forma chica y texto. El color nunca va solo.
  // Los colores salen del tono (`data-tono`, definido en base.css) y la forma también: rombo = crítico, triángulo = hasta 7 días, círculo = hasta 15, aro = hasta 30,
  // tilde = en orden, cuadrado = neutro (la misma de la leyenda del horizonte y de las pastillas; ver `Forma.svelte`).
  // El texto va como contenido: <Etiqueta ...>Vence en 6 días</Etiqueta>.
  import type { Snippet } from "svelte";
  import Forma, { formaDeTono } from "./Forma.svelte";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    tono,
    variante = "relleno",
    children,
  }: {
    tono: Tono;
    /** Ya no se dibuja: la forma la da el tono. Sigue aceptándose para no tocar las pantallas que todavía lo pasan (se retira con ellas, en E3). */
    icono?: NombreIcono;
    /** «texto» (D1, solo «Disponible»): sin fondo ni borde, mismas medidas y misma forma; el texto y la forma van en el color del tono. */
    variante?: "relleno" | "texto";
    children: Snippet;
  } = $props();
</script>

<span class="etiqueta" class:texto={variante === "texto"} data-tono={tono}><Forma forma={formaDeTono(tono)} />{@render children()}</span>

<style>
  .etiqueta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 1.5rem;
    padding: 0.125rem 0.5rem;
    /* El borde es transparente: solo se ve en colores forzados, donde el fondo desaparece. */
    border: 1px solid transparent;
    border-radius: var(--r-1);
    background: var(--tono-f);
    color: var(--tono-t);
    font-size: var(--t-chico);
    font-weight: 650;
    line-height: 1.35;
    vertical-align: middle;
    /* Las columnas se dimensionan para que la etiqueta entre en un renglón; con el texto agrandado (1.4.4) baja de renglón en lugar de empujar la página. */
    max-width: 100%;
  }
  /* Variante texto (5.7, D1): el borde sigue ahí (transparente) para que la forma quede en la misma columna que la de las etiquetas con fondo. */
  .texto {
    background: transparent;
  }
</style>
