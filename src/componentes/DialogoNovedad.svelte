<script lang="ts">
  // Diálogo «Cargar novedad» (5.17, N3): la descripción y la casilla «Impide usar la unidad» con la nota de A3 (si impide el uso, la unidad queda
  // fuera de servicio). No tiene reglas: el contexto lo arma `contextoDeCargarNovedad` y `guardar` es `app.cargarNovedad`.
  import type { CampoCargarNovedad, ContextoCargarNovedad, ValoresCargarNovedad } from "../lib/dominio/formulario-novedad.ts";
  import { REGLAS } from "../lib/dominio/validacion.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
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
    contexto: ContextoCargarNovedad | null;
    guardar: (valores: ValoresCargarNovedad) => Promise<ResultadoGuardado<CampoCargarNovedad>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoCargarNovedad>, { ok: true }>) => void;
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
      <Campo
        etiqueta={T.novedad.descripcion}
        tipo="area"
        id={f.idCampo("descripcion")}
        bind:valor={f.valores.descripcion}
        requerido
        ayuda={T.novedad.ayuda(REGLAS.novedad.min, REGLAS.novedad.max)}
        error={f.error("descripcion")}
      />
      <Casilla etiqueta={contexto.etiquetaImpideUso} bind:marcada={f.valores.impideUso} ayuda={contexto.notaImpideUso} />
    {/if}
  {/snippet}
</DialogoFormulario>
