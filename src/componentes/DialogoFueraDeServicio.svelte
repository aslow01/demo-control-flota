<script lang="ts">
  // Diálogo «Poner fuera de servicio» (5.17, A6): el motivo y, arriba, «Desde hoy (18/11/2026).» como texto (no es un campo).
  // No tiene reglas: el contexto lo arma `contextoDeFueraDeServicio` y `guardar` es `app.ponerFueraDeServicio`.
  import type { CampoFueraDeServicio, ContextoFueraDeServicio, ValoresFueraDeServicio } from "../lib/dominio/formulario-ficha.ts";
  import { REGLAS } from "../lib/dominio/validacion.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoFueraDeServicio | null;
    guardar: (valores: ValoresFueraDeServicio) => Promise<ResultadoGuardado<CampoFueraDeServicio>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoFueraDeServicio>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  conDescripcion
  {guardar}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      <p class="desde" id={f.idDescripcion}>{contexto.desde}</p>
      <Campo
        etiqueta={T.fueraDeServicio.motivo}
        tipo="area"
        id={f.idCampo("motivo")}
        bind:valor={f.valores.motivo}
        requerido
        ayuda={T.fueraDeServicio.ayuda(REGLAS.motivoFueraDeServicio.min, REGLAS.motivoFueraDeServicio.max)}
        error={f.error("motivo")}
      />
    {/if}
  {/snippet}
</DialogoFormulario>

<style>
  .desde {
    color: var(--c-texto-2);
  }
</style>
