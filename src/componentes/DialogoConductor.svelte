<script lang="ts">
  // Diálogo "¿Quién completa el parte?" (5.2 y 5.17): lista de conductores activos (ficticios) con su unidad, en radios.
  // El foco inicial va al conductor elegido (o al primero). "Continuar" no se deshabilita: sin elección muestra el error en el diálogo.
  // Quien lo usa recibe la lista armada y hace el cambio de perfil (`alConfirmar`); si falla, `error` se muestra acá y el diálogo sigue abierto.
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_ELEGIR_CONDUCTOR as T } from "./textos-marco.ts";
  import type { OpcionConductor } from "./tipos.ts";

  let {
    abierto = $bindable(false),
    conductores,
    elegidoInicial = null,
    cargando = false,
    error = "",
    focoDestino,
    alConfirmar,
  }: {
    abierto?: boolean;
    conductores: OpcionConductor[];
    /** El conductor del perfil actual, si el perfil es Conductor. */
    elegidoInicial?: string | null;
    cargando?: boolean;
    error?: string;
    focoDestino?: () => HTMLElement | null;
    alConfirmar: (conductorId: string) => void;
  } = $props();

  const uid = $props.id();
  const idError = $derived(`${uid}-error`);
  const idAyuda = $derived(`${uid}-ayuda`);

  let elegido = $state<string | null>(null);
  let sinElegir = $state(false);

  // Cada vez que se abre, parte del conductor actual y sin errores.
  $effect(() => {
    if (abierto) {
      elegido = elegidoInicial;
      sinElegir = false;
    }
  });

  const idFoco = $derived(elegido ?? conductores[0]?.id ?? null);
  const mensaje = $derived(sinElegir ? T.elegir : error);

  function continuar(): void {
    if (elegido === null) {
      sinElegir = true;
      document.querySelector<HTMLElement>("dialog[open] [data-foco-inicial]")?.focus();
      return;
    }
    alConfirmar(elegido);
  }
</script>

<Dialogo titulo={T.titulo} bind:abierto descripcionId={idAyuda} {focoDestino}>
  <p id={idAyuda} class="nota">{T.ayuda}</p>
  <fieldset aria-describedby={mensaje !== "" ? idError : undefined}>
    <legend class="nota">{T.leyenda}</legend>
    {#if mensaje !== ""}
      <p class="error" id={idError} role="alert"><Icono nombre="vencido" /><span>{mensaje}</span></p>
    {/if}
    <ul class="lista">
      {#each conductores as c (c.id)}
        <li>
          <label class="opcion">
            <input
              type="radio"
              name="conductor-del-parte"
              value={c.id}
              checked={elegido === c.id}
              data-foco-inicial={c.id === idFoco ? "" : undefined}
              onchange={() => {
                elegido = c.id;
                sinElegir = false;
              }}
            />
            <span class="datos">
              <span class="nombre">{c.nombre}</span>
              <span class="nota">{c.unidad === null ? T.sinUnidad : T.unidad(c.unidad)}</span>
            </span>
          </label>
        </li>
      {/each}
    </ul>
  </fieldset>
  {#snippet pie()}
    <Boton {cargando} onclick={continuar}>{T.continuar}</Boton>
  {/snippet}
</Dialogo>

<style>
  fieldset {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  legend {
    padding: 0;
    margin-bottom: var(--e-2);
    font-weight: 600;
  }
  .lista {
    display: flex;
    flex-direction: column;
  }
  .lista li + li {
    border-top: 1px solid var(--c-borde);
  }
  .opcion {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: 3rem;
    padding: var(--e-2) var(--e-1);
    cursor: pointer;
  }
  .opcion:has(input:checked) {
    background: var(--c-acento-suave);
  }
  @media (hover: hover) {
    .opcion:hover {
      background: var(--c-superficie-2);
    }
    .opcion:has(input:checked):hover {
      background: var(--c-acento-suave);
    }
  }
  input {
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: var(--c-acento);
  }
  .datos {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nombre {
    font-weight: 500;
  }
  .error {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .error :global(.icono) {
    margin-top: 0.1rem;
  }
</style>
