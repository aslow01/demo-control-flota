<script lang="ts">
  // Diálogo «Cambiar proyecto o conductor» (5.17, U6): los dos `select` con lo que la unidad tiene hoy. El conductor que ya tiene otra unidad se
  // avisa junto a su opción (no se impide). Si el proyecto elegido exige una habilitación que la unidad no tiene, un aviso lo dice antes de guardar:
  // `aviso(valores)` es `avisoDeAsignacion` y se vuelve a pedir al cambiar el proyecto. No tiene reglas.
  import type { CampoAsignacion, ContextoAsignacion, ValoresAsignacion } from "../lib/dominio/formulario-ficha.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Aviso from "./Aviso.svelte";
  import Campo from "./Campo.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    aviso,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoAsignacion | null;
    /** U6: el aviso para los valores de ahora, o `null`. */
    aviso: (valores: ValoresAsignacion) => string | null;
    guardar: (valores: ValoresAsignacion) => Promise<ResultadoGuardado<CampoAsignacion>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoAsignacion>, { ok: true }>) => void;
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
      {@const conductor = contexto.conductores.find((c) => c.valor === f.valores.conductorId)}
      {@const avisoHabilitacion = aviso({ ...f.valores })}
      <Campo etiqueta={T.asignacion.proyecto} tipo="select" id={f.idCampo("proyectoId")} bind:valor={f.valores.proyectoId} requerido error={f.error("proyectoId")}>
        <option value="">{T.asignacion.elegirProyecto}</option>
        {#each contexto.proyectos as p (p.valor)}
          <option value={p.valor}>{p.etiqueta}</option>
        {/each}
      </Campo>
      {#if avisoHabilitacion !== null}
        <Aviso tono="semana" icono="alerta">{avisoHabilitacion}</Aviso>
      {/if}
      <Campo
        etiqueta={T.asignacion.conductor}
        tipo="select"
        id={f.idCampo("conductorId")}
        bind:valor={f.valores.conductorId}
        ayuda={conductor?.asignadoA != null ? T.asignacion.yaTiene(conductor.asignadoA) : T.asignacion.ayudaConductor}
        error={f.error("conductorId")}
      >
        {#each contexto.conductores as c (c.valor)}
          <option value={c.valor}>{c.asignadoA === null ? c.etiqueta : T.asignacion.opcionConUnidad(c.etiqueta, c.asignadoA)}</option>
        {/each}
      </Campo>
    {/if}
  {/snippet}
</DialogoFormulario>
