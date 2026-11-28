<script lang="ts">
  // Barra de envío del parte (5.14): a la izquierda el estado del formulario («Faltan 5 datos» o «Listo para enviar» / «Listo para cerrar» con `i-check`), a la derecha el primario grande
  // («Enviar revisión» en el paso 1, «Cerrar el parte» en el paso 2). El primario nunca se deshabilita: si falta algo, al pulsarlo aparece el resumen de errores (5.15).
  //  - Va pegada al borde de abajo de la pantalla (superficie con borde y sombra hacia arriba): a menos de 40 rem a lo ancho; desde 40 rem, a lo ancho de la columna del
  //    parte y despegada del borde. Con la pantalla muy baja (menos de 30 rem de alto: zoom 400 %, teléfono apaisado) no se pega: ocuparía casi la mitad de la pantalla.
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
    flex-wrap: wrap; /* a 320 px o con el texto agrandado el botón baja a su renglón en vez de salirse de la pantalla */
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-3);
    min-height: var(--alto-barra-envio);
    margin-inline: calc(-1 * var(--gutter));
    padding: var(--e-3) var(--gutter);
    padding-bottom: calc(var(--e-3) + env(safe-area-inset-bottom, 0px));
    /* Pie de rey (15.5.10): fondo `--c-papel` opaco (nada se transparenta detrás del texto) y un filete superior de 1,5 px en tinta, sin sombra. */
    background: var(--c-papel);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .estado-barra {
    --icono-tam: 1.125rem;
    display: flex;
    flex: 1 1 7rem;
    min-width: 0;
    align-items: center;
    gap: var(--e-2);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--c-tinta);
  }
  .estado-barra.lista {
    color: var(--c-ok);
  }
  /* Desde 40 rem la barra es de la columna del parte: no se ensancha hasta los bordes y queda separada del borde de abajo. */
  @media (min-width: 40rem) {
    .barra-envio {
      bottom: var(--e-3);
      margin-inline: 0;
      padding: var(--e-3) var(--e-4);
      border: var(--b-fuerte) solid var(--c-tinta);
      border-radius: var(--r-0);
      box-shadow: var(--s-flotante);
    }
  }
  /* Pantalla muy baja (zoom 400 %, teléfono apaisado): la barra no se queda pegada. Ocuparía casi la mitad de la pantalla y taparía el campo con foco. */
  @media (max-height: 30rem) {
    .barra-envio {
      position: static;
    }
  }
  /* El campo con foco no queda tapado por la barra pegada (2.4.11). */
  @media (min-height: 30.01rem) {
    :global(html:has(.barra-envio)) {
      scroll-padding-bottom: calc(var(--alto-barra-envio) + var(--e-6));
    }
  }
</style>
