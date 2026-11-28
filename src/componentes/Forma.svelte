<script lang="ts" module>
  import type { FormaDeMarca } from "../lib/dominio/horizonte.ts";
  import type { Tono } from "./tipos.ts";

  /** Las cuatro formas del horizonte (rombo, triángulo, círculo, aro) más el tilde de «en orden» y el cuadrado de lo neutro. */
  export type FormaVisual = FormaDeMarca | "check" | "cuadro";

  const FORMA_DEL_TONO: Record<Tono, FormaVisual> = {
    critico: "rombo",
    semana: "triangulo",
    quincena: "circulo",
    mes: "aro",
    vigente: "check",
    neutro: "cuadro",
  };

  /** La forma que acompaña a cada tono: el color nunca va solo (la misma de la leyenda del horizonte, las pastillas y las etiquetas). */
  export function formaDeTono(tono: Tono): FormaVisual {
    return FORMA_DEL_TONO[tono];
  }
</script>

<script lang="ts">
  // Una forma chica de 8 px que dice el estado sin depender del color: rombo = vencido o crítico, triángulo = hasta 7 días, círculo = hasta 15, aro = hasta 30,
  // tilde = en orden, cuadrado = neutro. Es decorativa (el texto que la acompaña es el que se lee) y se dibuja con CSS: no pesa JavaScript.
  // El color sale del tono: o se pasa `tono`, o lo hereda de un contenedor con `data-tono` (`--tono-r`, definido en base.css).
  let { forma, tono }: { forma: FormaVisual; tono?: Tono } = $props();
</script>

<span class="forma" data-forma={forma} data-tono={tono} aria-hidden="true"></span>

<style>
  /* Pie de rey (15.5.3): 10 px, en el color de marca del tono (`-r`). Triángulo, círculo lleno y aro (trazo de 1,5 px) de 10 px; rombo y cuadrado de 8 px (girado, el rombo mide
     11 px de punta a punta, así que a 8 px no sobresale de la caja de las demás). Sin estados. */
  .forma {
    --forma-tam: 0.625rem;
    display: inline-block;
    flex: none;
    width: var(--forma-tam);
    height: var(--forma-tam);
    background: var(--tono-r, currentColor);
    vertical-align: middle;
  }
  .forma[data-forma="rombo"] {
    width: 0.5rem;
    height: 0.5rem;
    margin-inline: 0.0625rem;
    transform: rotate(45deg);
  }
  .forma[data-forma="triangulo"] {
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
  .forma[data-forma="circulo"] {
    border-radius: 50%;
  }
  .forma[data-forma="aro"] {
    background: none;
    border: 1.5px solid var(--tono-r, currentColor);
    border-radius: 50%;
  }
  .forma[data-forma="check"] {
    width: 0.625rem;
    height: 0.3125rem;
    background: none;
    border: solid var(--tono-r, currentColor);
    border-width: 0 0 2px 2px;
    transform: rotate(-45deg) translate(1px, -1px);
  }
  .forma[data-forma="cuadro"] {
    width: 0.5rem;
    height: 0.5rem;
    margin-inline: 0.0625rem;
    border-radius: 0;
  }

  /* Colores forzados: el fondo desaparece, así que la forma se dibuja con el color del texto del sistema. */
  @media (forced-colors: active) {
    .forma {
      forced-color-adjust: none;
      background: CanvasText;
    }
    .forma[data-forma="aro"],
    .forma[data-forma="check"] {
      background: none;
      border-color: CanvasText;
    }
  }
</style>
