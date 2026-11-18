<script lang="ts">
  // Diálogo "Reiniciar demo" (5.17): confirmación de lo que no se puede deshacer. El foco inicial es "Cancelar".
  // Quien lo usa hace el reinicio (`alConfirmar`) y dice si está trabajando (`cargando`) y si falló (`error`, que se muestra
  // acá adentro: el diálogo no se cierra). Mientras trabaja, el botón queda con aria-disabled y no repite el pedido.
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_REINICIO } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    cargando = false,
    error = "",
    focoDestino,
    alConfirmar,
  }: {
    abierto?: boolean;
    cargando?: boolean;
    error?: string;
    focoDestino?: () => HTMLElement | null;
    alConfirmar: () => void;
  } = $props();

  const uid = $props.id();
  const idDescripcion = $derived(`${uid}-descripcion`);
</script>

<Dialogo
  titulo={TEXTO_REINICIO.titulo}
  bind:abierto
  bloqueado={cargando}
  focoInicial="cancelar"
  descripcionId={idDescripcion}
  {focoDestino}
>
  <p id={idDescripcion} class="parrafo">{TEXTO_REINICIO.descripcion}</p>
  {#if error !== ""}
    <p class="error" role="alert"><Icono nombre="vencido" /><span>{error}</span></p>
  {/if}
  {#snippet pie()}
    <Boton variante="peligro" {cargando} onclick={alConfirmar}>{cargando ? TEXTO_REINICIO.reiniciando : TEXTO_REINICIO.confirmar}</Boton>
  {/snippet}
</Dialogo>

<style>
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
