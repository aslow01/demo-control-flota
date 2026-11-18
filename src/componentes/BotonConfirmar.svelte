<script lang="ts">
  // 5.1 Confirmación en dos pasos (por ejemplo "Descartar borrador"): el primer clic pasa el botón a la variante Peligro con el
  // texto de confirmación; el segundo hace la acción. Se restablece con Esc, al mover el foco, al salir del botón con el mouse
  // y a los 4 segundos (en pantallas táctiles no hay "salir con el cursor": `pointerleave` llega antes del `click` y lo desarmaría).
  // Un doble clic (segundo clic a menos de 500 ms) se ignora: no confirma sin querer.
  // Es para acciones chicas y fáciles de rehacer; lo grande (Reiniciar demo, Dar de baja) lleva un diálogo (5.17).
  import Boton from "./Boton.svelte";
  import type { NombreIcono } from "./tipos.ts";

  const INTERVALO_DOBLE_CLIC_MS = 500;
  const VENCIMIENTO_MS = 4000;

  let {
    texto,
    textoConfirmar,
    icono,
    alConfirmar,
  }: {
    texto: string;
    textoConfirmar: string;
    icono?: NombreIcono;
    alConfirmar: () => void;
  } = $props();

  let armado = $state(false);
  let armadoEn = 0;

  function restablecer(): void {
    armado = false;
  }

  // El segundo paso vence solo: una persona que toca y se arrepiente no deja el botón armado para siempre.
  $effect(() => {
    if (!armado) return;
    const plazo = setTimeout(restablecer, VENCIMIENTO_MS);
    return () => clearTimeout(plazo);
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
  <Boton variante={armado ? "peligro" : "secundario"} {icono} onclick={alHacerClic}>{armado ? textoConfirmar : texto}</Boton>
  <span class="solo-lectores" role="status">{armado ? textoConfirmar : ""}</span>
</span>

<style>
  .confirmar {
    position: relative;
    display: inline-flex;
  }
</style>
