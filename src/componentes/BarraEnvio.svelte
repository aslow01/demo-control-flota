<script lang="ts">
  // Barra de envío del parte (5.14): a la izquierda el estado del formulario («Faltan 5 datos» o «Listo para enviar» / «Listo para cerrar» con `i-check`), a la derecha el primario grande
  // («Enviar revisión» en el paso 1, «Cerrar el parte» en el paso 2). El primario nunca se deshabilita: si falta algo, al pulsarlo aparece el resumen de errores (5.15).
  //  - A menos de 40 rem va pegada abajo, a lo ancho de la pantalla; desde 40 rem, estática al final del formulario y sin sombra. Con la pantalla muy baja (menos de 30 rem de alto:
  //    zoom 400 %, teléfono apaisado) tampoco se pega: ocuparía casi la mitad de la pantalla.
  //  - Mientras está en pantalla, `html` reserva `scroll-padding-bottom` para que no tape el campo con foco (WCAG 2.4.11).
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";

  let {
    estado,
    lista,
    etiqueta,
    cargando = false,
    alActivar,
  }: {
    estado: string;
    /** No falta nada: el estado va en verde con su ícono. */
    lista: boolean;
    etiqueta: string;
    cargando?: boolean;
    alActivar: () => void;
  } = $props();
</script>

<div class="barra-envio">
  <p class="estado-barra" class:lista>
    {#if lista}<Icono nombre="check" />{/if}<span>{estado}</span>
  </p>
  <Boton tamano="grande" {cargando} onclick={alActivar}>{etiqueta}</Boton>
</div>

<style>
  .barra-envio {
    position: sticky;
    bottom: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-3);
    min-height: var(--alto-barra-envio);
    margin-inline: calc(-1 * var(--gutter));
    padding: var(--e-3) var(--gutter);
    padding-bottom: calc(var(--e-3) + env(safe-area-inset-bottom, 0px));
    background: var(--c-ventana-barra);
    border-top: 1px solid var(--c-borde);
    box-shadow: var(--s-flotante);
  }
  .estado-barra {
    --icono-tam: 1.125rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.3;
    color: var(--c-texto-2);
  }
  .estado-barra.lista {
    color: var(--c-vigente-t);
  }
  @media (min-width: 40rem) {
    .barra-envio {
      position: static;
      min-height: 0;
      margin-inline: 0;
      padding: var(--e-3) 0 0;
      background: none;
      border-top: 0;
      box-shadow: none;
    }
  }
  /* Pantalla muy baja (zoom 400 %, teléfono apaisado): la barra no se queda pegada. Ocuparía casi la mitad de la pantalla y taparía el campo con foco. */
  @media (max-height: 30rem) {
    .barra-envio {
      position: static;
    }
  }
  /* El campo con foco no queda tapado por la barra pegada (2.4.11). */
  @media (max-width: 39.99rem) and (min-height: 30.01rem) {
    :global(html:has(.barra-envio)) {
      scroll-padding-bottom: calc(var(--alto-barra-envio) + var(--e-4));
    }
  }
</style>
