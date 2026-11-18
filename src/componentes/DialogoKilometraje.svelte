<script lang="ts">
  // Diálogo «Corregir kilometraje» (5.17, K5 y M3): la fecha desde la que vale (hoy de entrada; no puede ser futura), el nuevo kilometraje y el motivo,
  // con el último registro y la nota de cuándo usarlo arriba. No tiene reglas: el contexto lo arma `contextoDeKilometraje` y `guardar` es
  // `app.corregirKilometraje`; que ya haya un parte posterior a la fecha lo dice el comando, en el campo de la fecha.
  import type { CampoKilometraje, ContextoKilometraje, ValoresKilometraje } from "../lib/dominio/formulario-ficha.ts";
  import { REGLAS } from "../lib/dominio/validacion.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import DialogoFormulario from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoKilometraje | null;
    guardar: (valores: ValoresKilometraje) => Promise<ResultadoGuardado<CampoKilometraje>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoKilometraje>, { ok: true }>) => void;
    focoDestino?: () => HTMLElement | null;
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
      <div class="contexto" id={f.idDescripcion}>
        <p>{contexto.ultimoRegistro}</p>
        <p class="nota">{contexto.nota}</p>
      </div>
      <Campo
        etiqueta={T.kilometraje.desde}
        tipo="fecha"
        id={f.idCampo("desde")}
        bind:valor={f.valores.desde}
        maxFecha={contexto.desdeMaxima}
        requerido
        ayuda={T.kilometraje.ayudaDesde}
        error={f.error("desde")}
      />
      <Campo
        etiqueta={T.kilometraje.kmBase}
        tipo="km"
        id={f.idCampo("kmBase")}
        bind:valor={f.valores.kmBase}
        requerido
        ayuda={T.kilometraje.ayudaKm}
        error={f.error("kmBase")}
      />
      <Campo
        etiqueta={T.kilometraje.motivo}
        tipo="area"
        id={f.idCampo("motivo")}
        bind:valor={f.valores.motivo}
        requerido
        ayuda={T.kilometraje.ayudaMotivo(REGLAS.motivoKm.min, REGLAS.motivoKm.max)}
        error={f.error("motivo")}
      />
    {/if}
  {/snippet}
</DialogoFormulario>

<style>
  .contexto {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
</style>
