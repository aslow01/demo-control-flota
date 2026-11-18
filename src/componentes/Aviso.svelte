<script lang="ts">
  // 5.18 Aviso global: franja a lo ancho del contenido, con borde izquierdo del tono, ícono, texto y, a la derecha
  // (o debajo a menos de 40 rem), su acción. Es role="status" (se anuncia sin interrumpir); el de "modo en memoria" al
  // arrancar usa rol="alert" para anunciarse una vez. El que se puede cerrar lleva "Cerrar aviso" (`alCerrar`).
  // El texto va como contenido; la acción, como el fragmento `accion`.
  import type { Snippet } from "svelte";
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    tono,
    icono,
    rol = "status",
    alCerrar,
    accion,
    children,
  }: {
    tono: Tono;
    icono: NombreIcono;
    rol?: "status" | "alert";
    alCerrar?: () => void;
    accion?: Snippet;
    children: Snippet;
  } = $props();
</script>

<div class="aviso" role={rol} data-tono={tono}>
  <span class="icono-aviso"><Icono nombre={icono} /></span>
  <div class="texto">{@render children()}</div>
  {#if accion !== undefined || alCerrar !== undefined}
    <div class="acciones" class:con-accion={accion !== undefined}>
      {#if accion !== undefined}{@render accion()}{/if}
      {#if alCerrar !== undefined}
        <Boton variante="icono" icono="cerrar" etiqueta={TEXTO_MARCO.cerrarAviso} onclick={alCerrar} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .aviso {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-3) var(--e-4);
    background: var(--tono-f);
    border: 1px solid transparent;
    border-left: 4px solid var(--tono-r);
    border-radius: var(--r-2);
    color: var(--c-texto);
  }
  .icono-aviso {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    align-self: flex-start;
    margin-top: 0.1875rem;
    color: var(--tono-t);
  }
  .texto {
    flex: 1 1 12rem;
    min-width: 0;
    line-height: 1.5;
  }
  .acciones {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2);
    margin-left: auto;
  }
  @media (max-width: 39.99rem) {
    /* Con poco ancho una acción con texto baja a su renglón; el "Cerrar aviso" solo se queda a la derecha. */
    .acciones.con-accion {
      flex: 1 0 100%;
      margin-left: 0;
    }
  }
</style>
