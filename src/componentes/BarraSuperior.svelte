<script lang="ts">
  // 4.1 Barra superior (fondo del escritorio, 56 px, no fija). La marca no es un enlace.
  //  - >= 56 rem: marca + "Demo con datos ficticios" · botones-texto de las acciones · "← Volver al portafolio".
  //  - 40 a 56 rem: las acciones pasan al menú "Más" y el enlace se acorta a "← Portafolio".
  //  - < 40 rem: marca + "← Portafolio" + "Más"; el rótulo "Demo con datos ficticios" baja al encabezado de cada pantalla.
  // Las acciones (Cómo funciona, Reiniciar demo) las decide quien arma la barra; sin acciones no hay botones ni menú.
  // Texto agrandado (m1, 1.4.4): sin alto fijo (`min-height`), la fila pasa a otro renglón en vez de empujar la página, el ícono nunca se achica y el nombre puede partirse.
  import Boton from "./Boton.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import MenuMas from "./MenuMas.svelte";
  import { TEXTO_MARCO, URL_PORTAFOLIO } from "./textos-marco.ts";
  import type { ItemMenu } from "./tipos.ts";

  let { acciones = [] }: { acciones?: ItemMenu[] } = $props();
</script>

<div class="barra-superior">
  <div class="interior contenedor">
    <p class="marca">
      <span class="icono-marca"><Icono nombre="marca" /></span>
      <span class="nombre">{TEXTO_MARCO.nombreApp}</span>
      <span class="demo"><EtiquetaDemo /></span>
    </p>
    <div class="derecha">
      <div class="acciones">
        {#each acciones as accion (accion.id)}
          <Boton variante="texto" onclick={accion.alActivar}>{accion.texto}</Boton>
        {/each}
      </div>
      <a class="portafolio" href={URL_PORTAFOLIO}>
        <span class="largo">{TEXTO_MARCO.volverAlPortafolio}</span><span class="corto">{TEXTO_MARCO.volverAlPortafolioCorto}</span>
      </a>
      <div class="mas">
        <MenuMas items={acciones} />
      </div>
    </div>
  </div>
</div>

<style>
  .barra-superior {
    background: var(--c-escritorio);
  }
  .interior {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    column-gap: var(--e-3);
    row-gap: var(--e-1);
    min-height: 3.5rem;
  }
  .marca {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
  }
  .icono-marca {
    display: inline-flex;
    flex: none;
    color: var(--c-acento);
  }
  .nombre {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .derecha {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-3);
  }
  .acciones {
    display: flex;
    align-items: center;
    gap: var(--e-1);
  }
  .portafolio {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }
  .largo,
  .corto {
    white-space: nowrap;
  }
  .corto {
    display: none;
  }

  /* Menos de 56 rem: las acciones van al menú "Más" y el enlace se acorta. */
  @media (max-width: 55.99rem) {
    .acciones {
      display: none;
    }
    .largo {
      display: none;
    }
    .corto {
      display: inline;
    }
  }
  @media (min-width: 56rem) {
    .mas {
      display: none;
    }
  }
  /* Menos de 40 rem: el rótulo de demo baja a cada pantalla. */
  @media (max-width: 39.99rem) {
    .demo {
      display: none;
    }
  }
</style>
