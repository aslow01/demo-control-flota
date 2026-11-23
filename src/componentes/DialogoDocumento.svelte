<script lang="ts" module>
  import type { ValoresDocumento } from "../lib/dominio/formulario-documento.ts";

  export interface ContextoDeDocumento {
    titulo: string;
    /** Línea de contexto («Actual: póliza …» al renovar; la nota de «Use esto para corregir…» al corregir). */
    contexto?: string;
    /** La ayuda del emisor, si no es la de siempre (al corregir, el emisor no viene «del documento anterior»). */
    ayudaEmisor?: string;
    primario: string;
    valoresIniciales: ValoresDocumento;
  }
</script>

<script lang="ts">
  // Diálogos «Renovar», «Cargar documento» y «Corregir documento» (5.11, 5.15 y 5.17): el mismo formulario (Número*, Emisor, Vence*, Emitido) con el título, la línea
  // de contexto y el botón primario que arma el dominio (`contextoDeRenovar` / `contextoDeCargar` / `contextoDeCorregir`). Solo pone sus campos: el resumen de errores,
  // el «Guardando…», el foco y el cierre son de `DialogoFormulario`. `guardar` es `app.renovarDocumento`, `cargarDocumento` o `corregirDocumento`.
  import type { CampoDocumento } from "../lib/dominio/formulario-documento.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGO_DOCUMENTO as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoDeDocumento | null;
    guardar: (valores: ValoresDocumento) => Promise<ResultadoGuardado<CampoDocumento>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoDocumento>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  conDescripcion={contexto?.contexto !== undefined}
  {guardar}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      {#if contexto.contexto !== undefined}
        <p class="nota" id={f.idDescripcion}>{contexto.contexto}</p>
      {/if}
      <Campo etiqueta={T.numero} id={f.idCampo("numero")} bind:valor={f.valores.numero} requerido autocomplete="off" error={f.error("numero")} />
      <Campo
        etiqueta={T.emisor}
        id={f.idCampo("emisor")}
        bind:valor={f.valores.emisor}
        autocomplete="off"
        ayuda={contexto.ayudaEmisor ?? (contexto.valoresIniciales.emisor !== "" ? T.ayudaEmisorHeredado : T.ayudaOpcional)}
        error={f.error("emisor")}
      />
      <Campo etiqueta={T.vence} id={f.idCampo("vence")} tipo="fecha" bind:valor={f.valores.vence} requerido error={f.error("vence")} />
      <Campo etiqueta={T.emitido} id={f.idCampo("emitido")} tipo="fecha" bind:valor={f.valores.emitido} ayuda={T.ayudaOpcional} error={f.error("emitido")} />
    {/if}
  {/snippet}
</DialogoFormulario>
