<script lang="ts">
  // 5.18 Aviso global: franja a lo ancho del contenido, con borde izquierdo del tono, ícono, texto y, a la derecha
  // (o debajo a menos de 40 rem), su acción. No lleva rol propio: va dentro del contenedor `role="status"` de la cabecera
  // (siempre presente, así lo que llega con la página abierta se anuncia). `rol="alert"` solo para el error de una acción
  // de la persona, que se inserta suelto. El que se puede cerrar lleva "Cerrar aviso" (`alCerrar`); al cerrarlo el foco pasa
  // al aviso siguiente (o al anterior) y, si no queda ninguno, al h1: nunca se pierde en el `body`.
  // El texto va como contenido; el botón de la derecha, como el fragmento `boton`.
  // Aviso compacto de dos renglones (C10): con `accion` (texto), el contenido es el renglón 1 (`aviso-titular`, 600) y `accion`, el renglón 2 (`aviso-accion`, `--t-chico`).
  import { tick, type Snippet } from "svelte";
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    tono,
    icono,
    rol,
    alCerrar,
    boton,
    accion = "",
    idTexto,
    children,
  }: {
    tono: Tono;
    icono: NombreIcono;
    rol?: "alert";
    alCerrar?: () => void;
    boton?: Snippet;
    accion?: string;
    /** `id` del texto del aviso, para que un título lo use en `aria-describedby` («Cerrar antes»: quien recibe el foco en el `h1` oye también la razón). */
    idTexto?: string;
    children: Snippet;
  } = $props();

  let raiz = $state<HTMLElement | null>(null);

  function cerrar(): void {
    const vecinos = [raiz?.nextElementSibling, raiz?.previousElementSibling];
    alCerrar?.();
    void tick().then(() => {
      for (const vecino of vecinos) {
        const control = vecino?.isConnected === true ? vecino.querySelector<HTMLElement>("button, a[href]") : null;
        if (control) {
          control.focus();
          return;
        }
      }
      document.querySelector<HTMLElement>("main h1")?.focus();
    });
  }
</script>

<div class="aviso" role={rol} data-tono={tono} bind:this={raiz}>
  <span class="icono-aviso"><Icono nombre={icono} /></span>
  <div class="texto" id={idTexto}>
    {#if accion !== ""}
      <span class="aviso-titular">{@render children()}</span>
      <span class="aviso-accion">{accion}</span>
    {:else}
      {@render children()}
    {/if}
  </div>
  {#if boton !== undefined || alCerrar !== undefined}
    <div class="acciones" class:con-accion={boton !== undefined}>
      {#if boton !== undefined}{@render boton()}{/if}
      {#if alCerrar !== undefined}
        <Boton variante="icono" icono="cerrar" etiqueta={TEXTO_MARCO.cerrarAviso} onclick={cerrar} />
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
    /* Lo que escribe la persona (un motivo, una marca) puede no tener espacios: no tiene que ensanchar la página. */
    overflow-wrap: anywhere;
  }
  .aviso-titular,
  .aviso-accion {
    display: block;
  }
  .aviso-titular {
    font-weight: 600;
  }
  .aviso-accion {
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  .texto :global(p + p) {
    margin-top: var(--e-1);
  }
  .acciones {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2);
    margin-left: auto;
  }
  /* Texto agrandado (el contenedor del aviso mide 17 rem o menos): menos relleno a los lados, así lo que dice el aviso conserva el ancho (S5 de la etapa 7). */
  @container (max-width: 17rem) {
    .aviso {
      padding-inline: var(--e-2);
    }
  }
  @media (max-width: 39.99rem) {
    /* Con poco ancho una acción con texto baja a su renglón; el "Cerrar aviso" solo se queda a la derecha. */
    .acciones.con-accion {
      flex: 1 0 100%;
      margin-left: 0;
    }
  }
</style>
