<script lang="ts">
  // Diálogo «Volver a servicio» (5.17, A4 y A5): no tiene campos, solo confirma.
  //  - Con novedades críticas abiertas (A4) no hay botón de guardar: el texto dice cuáles son y «Ver novedades» cierra el diálogo y lleva el foco al
  //    título de Novedades (`cerrarEn` pone el foco ahí y `alVerNovedades` lleva la vista).
  //  - Con documentos vencidos o faltantes (A5) la unidad vuelve igual: un aviso lo dice.
  //  - El foco inicial es el título: se lee qué pasa antes de decidir.
  import type { ContextoVolverAServicio } from "../lib/dominio/formulario-ficha.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Aviso from "./Aviso.svelte";
  import Boton from "./Boton.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGO } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    alVerNovedades,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoVolverAServicio | null;
    guardar: () => Promise<ResultadoGuardado<never>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<never>, { ok: true }>) => void;
    /** «Ver novedades»: el diálogo se cierra con el foco en el título de Novedades (`focoDestino` lo recibe como `titulo-de-novedades`); quien lo usa, además, lleva la vista ahí. */
    alVerNovedades: () => void;
    focoDestino?: DestinoDelFoco;
  } = $props();

</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto === null ? null : {}}
  primario={contexto?.primario ?? null}
  cancelar={contexto?.bloqueo != null ? TEXTO_DIALOGO.cerrar : undefined}
  focoInicial="titulo"
  conDescripcion
  obligatorios={false}
  guardar={() => guardar()}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      <p id={f.idDescripcion}>{contexto.situacion}</p>
      {#if contexto.bloqueo !== null}
        <Aviso tono="critico" icono="octogono">
          <p>{contexto.bloqueo.texto}</p>
        </Aviso>
        <div class="acciones-bloqueo">
          <Boton variante="secundario" onclick={() => { alVerNovedades(); f.cerrarEn("titulo-de-novedades"); }}>{contexto.bloqueo.verNovedades}</Boton>
        </div>
      {:else if contexto.aviso !== null}
        <Aviso tono="semana" icono="alerta">{contexto.aviso}</Aviso>
      {/if}
    {/if}
  {/snippet}
</DialogoFormulario>

<style>
  .acciones-bloqueo {
    display: flex;
  }
</style>
