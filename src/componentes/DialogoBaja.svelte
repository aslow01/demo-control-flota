<script lang="ts">
  // Diálogo «Dar de baja» (5.17, A7): el aviso de que no se deshace (se lee al abrir), el motivo y un botón de peligro con la patente.
  // El foco inicial es el campo del motivo (hay que escribir algo para seguir; no es una confirmación de un solo toque).
  // No tiene reglas: el contexto lo arma `contextoDeBaja` y `guardar` es `app.darDeBaja`.
  import type { CampoBaja, ContextoBaja, ValoresBaja } from "../lib/dominio/formulario-ficha.ts";
  import { REGLAS } from "../lib/dominio/validacion.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Aviso from "./Aviso.svelte";
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
    contexto: ContextoBaja | null;
    guardar: (valores: ValoresBaja) => Promise<ResultadoGuardado<CampoBaja>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoBaja>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  peligro
  conDescripcion
  {guardar}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      <div id={f.idDescripcion}>
        <Aviso tono="critico" icono="caja">{contexto.aviso}</Aviso>
      </div>
      <Campo
        etiqueta={T.baja.motivo}
        tipo="area"
        id={f.idCampo("motivo")}
        bind:valor={f.valores.motivo}
        requerido
        ayuda={T.baja.ayuda(REGLAS.motivoBaja.min, REGLAS.motivoBaja.max)}
        error={f.error("motivo")}
      />
    {/if}
  {/snippet}
</DialogoFormulario>
