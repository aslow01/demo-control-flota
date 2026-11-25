<script lang="ts">
  // ESQUELETO (E3-M, paso 0): «Mis partes» del conductor (`#/conductor/partes`). Datos: `app.misPartes()` (`titulo`, `conductor`, `filas`, `vacio`). Sin props.
  // Se carga bajo demanda como `PantallaConductor` (ver `App.svelte`). Quien lo completa NO toca `App.svelte`.
  import { app } from "../lib/estado/instancia.ts";

  const partes = $derived(app.misPartes());
</script>

{#if partes !== null}
  <div class="pantalla">
    <h1 tabindex="-1">{partes.titulo}</h1>
    {#if partes.vacio !== null}
      <p>{partes.vacio}</p>
    {:else}
      <ul>
        {#each partes.filas as f (f.parteId)}
          <li><a href={f.href}>{f.fecha} · {f.patenteTexto} · {f.recorrido}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
    min-width: 0;
  }
</style>
