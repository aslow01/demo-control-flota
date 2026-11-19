<script lang="ts">
  // 5.18 Aviso global: franja a lo ancho del contenido, con borde izquierdo del tono, ícono, texto y, a la derecha
  // (o debajo a menos de 40 rem), su acción. No lleva rol propio: va dentro del contenedor `role="status"` de la cabecera
  // (siempre presente, así lo que llega con la página abierta se anuncia). `rol="alert"` solo para el error de una acción
  // de la persona, que se inserta suelto. El que se puede cerrar lleva "Cerrar aviso" (`alCerrar`); al cerrarlo el foco pasa
  // al aviso siguiente (o al anterior) y, si no queda ninguno, al h1: nunca se pierde en el `body`.
  // El texto va como contenido; la acción, como el fragmento `accion`.
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
    accion,
    children,
  }: {
    tono: Tono;
    icono: NombreIcono;
    rol?: "alert";
    alCerrar?: () => void;
    accion?: Snippet;
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
  <div class="texto">{@render children()}</div>
  {#if accion !== undefined || alCerrar !== undefined}
    <div class="acciones" class:con-accion={accion !== undefined}>
      {#if accion !== undefined}{@render accion()}{/if}
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
  @media (max-width: 39.99rem) {
    /* Con poco ancho una acción con texto baja a su renglón; el "Cerrar aviso" solo se queda a la derecha. */
    .acciones.con-accion {
      flex: 1 0 100%;
      margin-left: 0;
    }
  }
</style>
