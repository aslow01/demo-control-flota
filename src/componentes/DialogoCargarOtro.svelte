<script lang="ts">
  // Diálogo «Cargar otro documento» (ficha, 5.17): el mismo formulario de Renovar y Cargar (Número*, Emisor, Vence*, Emitido) precedido por el `select`
  // Tipo, que viene vacío (hay que elegir) y lista los tipos de la unidad sin documento vigente. No tiene reglas: el contexto lo arma
  // `contextoDeCargarOtro` y `guardar` es `app.cargarOtroDocumento`; si el tipo ya se cargó en otra pestaña el error vuelve en ese campo.
  import type { CampoCargarOtro, ContextoCargarOtro, ValoresCargarOtro } from "../lib/dominio/formulario-documento.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGO_DOCUMENTO as D, TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoCargarOtro | null;
    guardar: (valores: ValoresCargarOtro) => Promise<ResultadoGuardado<CampoCargarOtro>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoCargarOtro>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  {guardar}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      <Campo etiqueta={T.cargarOtro.tipo} tipo="select" id={f.idCampo("tipoDocumento")} bind:valor={f.valores.tipoDocumento} requerido error={f.error("tipoDocumento")}>
        <option value="">{T.cargarOtro.elegirTipo}</option>
        {#each contexto.tipos as t (t.valor)}
          <option value={t.valor}>{t.etiqueta}</option>
        {/each}
      </Campo>
      <Campo etiqueta={D.numero} id={f.idCampo("numero")} bind:valor={f.valores.numero} requerido autocomplete="off" error={f.error("numero")} />
      <Campo etiqueta={D.emisor} id={f.idCampo("emisor")} bind:valor={f.valores.emisor} autocomplete="off" ayuda={D.ayudaOpcional} error={f.error("emisor")} />
      <Campo etiqueta={D.vence} id={f.idCampo("vence")} tipo="fecha" bind:valor={f.valores.vence} requerido error={f.error("vence")} />
      <Campo etiqueta={D.emitido} id={f.idCampo("emitido")} tipo="fecha" bind:valor={f.valores.emitido} ayuda={D.ayudaOpcional} error={f.error("emitido")} />
    {/if}
  {/snippet}
</DialogoFormulario>
