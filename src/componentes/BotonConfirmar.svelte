<script lang="ts">
  // 5.1 Confirmación en dos pasos (por ejemplo "Descartar borrador"): el primer clic pasa el botón a la variante Peligro con el
  // texto de confirmación; el segundo hace la acción. Se restablece con Esc, al mover el foco, al salir del botón con el mouse y al tocar o hacer clic en cualquier
  // otro lado (en pantallas táctiles no hay "salir con el cursor": `pointerleave` llega antes del `click` y lo desarmaría). No vence por tiempo: un límite que la
  // persona no controla deja afuera a quien lee con lector de pantalla, con temblor o con un conmutador (WCAG 2.2.1); el botón armado no hace nada por sí solo.
  // Un doble clic (segundo clic a menos de 500 ms) se ignora: no confirma sin querer.
  // Es para acciones chicas y fáciles de rehacer; lo grande (Reiniciar demo, Dar de baja) lleva un diálogo (5.17).
  import Boton from "./Boton.svelte";
  import type { NombreIcono } from "./tipos.ts";

  const INTERVALO_DOBLE_CLIC_MS = 500;

  let {
    texto,
    textoConfirmar,
    icono,
    variante = "secundario",
    alConfirmar,
  }: {
    texto: string;
    textoConfirmar: string;
    icono?: NombreIcono;
    /** Cómo se ve antes de armarse: «texto» para una salida que no compite con la acción principal de la pantalla (5.1). Armado, siempre Peligro. */
    variante?: "secundario" | "texto";
    alConfirmar: () => void;
  } = $props();

  let armado = $state(false);
  let armadoEn = 0;
  let caja = $state<HTMLElement | null>(null);

  function restablecer(): void {
    armado = false;
  }

  // Un toque o clic fuera del botón lo desarma (en el táctil no hay otra forma de «salir»); no hay un límite de tiempo.
  $effect(() => {
    if (!armado) return;
    const fuera = (evento: PointerEvent): void => {
      if (!(evento.target instanceof Node) || caja?.contains(evento.target) !== true) restablecer();
    };
    document.addEventListener("pointerdown", fuera, true);
    return () => document.removeEventListener("pointerdown", fuera, true);
  });

  function alHacerClic(): void {
    if (!armado) {
      armado = true;
      armadoEn = performance.now();
      return;
    }
    if (performance.now() - armadoEn < INTERVALO_DOBLE_CLIC_MS) return;
    armado = false;
    alConfirmar();
  }
</script>

<span
  class="confirmar"
  role="presentation"
  bind:this={caja}
  onfocusout={restablecer}
  onpointerleave={(evento) => {
    if (evento.pointerType === "mouse") restablecer();
  }}
  onkeydown={(evento) => {
    if (evento.key === "Escape" && armado) {
      evento.preventDefault(); // dentro de un diálogo, este Esc solo deshace el primer paso (no lo cierra)
      evento.stopPropagation();
      restablecer();
    }
  }}
>
  <Boton variante={armado ? "peligro" : variante} {icono} onclick={alHacerClic}>{armado ? textoConfirmar : texto}</Boton>
  <span class="solo-lectores" role="status">{armado ? textoConfirmar : ""}</span>
</span>

<style>
  /* Pie de rey (15.5.1): dos pasos. El primero usa `secundario` o `texto` y el segundo `peligro` (de contorno, en el crítico); el aspecto de los dos lo da `Boton`. */
  .confirmar {
    position: relative;
    display: inline-flex;
  }
</style>
