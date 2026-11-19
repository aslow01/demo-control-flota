<script lang="ts">
  // Diálogo «Agregar unidad» (5.11, 5.15 y 5.17): Patente*, Interno*, Tipo*, Marca*, Modelo*, Año*, Proyecto* y Conductor, con las opciones de los `select` y los textos que arma
  // el dominio (`contextoDeAgregarUnidad`). Solo pone sus campos: el resumen de errores, el «Guardando…», el foco y el cierre son de `DialogoFormulario`. `guardar` es
  // `app.agregarUnidad`, que al guardar bien ya navegó a la ficha de la unidad nueva (el cambio de pantalla lleva el foco al título de la ficha).
  import type { CampoUnidad, ContextoAgregarUnidad, ValoresUnidad } from "../lib/dominio/formulario-unidad.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Campo from "./Campo.svelte";
  import DialogoFormulario, { type DestinoDelFoco } from "./DialogoFormulario.svelte";
  import { TEXTO_DIALOGO_UNIDAD as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoAgregarUnidad | null;
    guardar: (valores: ValoresUnidad) => Promise<ResultadoGuardado<CampoUnidad>>;
    alGuardar?: (resultado: Extract<ResultadoGuardado<CampoUnidad>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  {guardar}
  alGuardar={(r) => alGuardar?.(r)}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      {@const conductorElegido = contexto.conductores.find((c) => c.valor === f.valores.conductorId)}
      <div class="campos">
        <Campo
          etiqueta={T.patente}
          id={f.idCampo("patente")}
          bind:valor={f.valores.patente}
          requerido
          autocomplete="off"
          mayusculas
          ayuda={T.ayudaPatente}
          error={f.error("patente")}
        />
        <Campo
          etiqueta={T.interno}
          id={f.idCampo("interno")}
          bind:valor={f.valores.interno}
          requerido
          autocomplete="off"
          modoEntrada="numeric"
          corto
          ayuda={T.ayudaInterno}
          error={f.error("interno")}
        />
        <Campo etiqueta={T.tipo} id={f.idCampo("tipo")} tipo="select" bind:valor={f.valores.tipo} requerido error={f.error("tipo")}>
          <option value="">{T.elegirTipo}</option>
          {#each contexto.tipos as t (t.valor)}
            <option value={t.valor}>{t.etiqueta}</option>
          {/each}
        </Campo>
        <Campo etiqueta={T.marca} id={f.idCampo("marca")} bind:valor={f.valores.marca} requerido autocomplete="off" error={f.error("marca")} />
        <Campo etiqueta={T.modelo} id={f.idCampo("modelo")} bind:valor={f.valores.modelo} requerido autocomplete="off" error={f.error("modelo")} />
        <Campo
          etiqueta={T.anio}
          id={f.idCampo("anio")}
          bind:valor={f.valores.anio}
          requerido
          autocomplete="off"
          modoEntrada="numeric"
          corto
          ayuda={T.ayudaAnio(contexto.anios.minimo, contexto.anios.maximo)}
          error={f.error("anio")}
        />
        <Campo etiqueta={T.proyecto} id={f.idCampo("proyectoId")} tipo="select" bind:valor={f.valores.proyectoId} requerido error={f.error("proyectoId")}>
          <option value="">{T.elegirProyecto}</option>
          {#each contexto.proyectos as p (p.valor)}
            <option value={p.valor}>{p.etiqueta}</option>
          {/each}
        </Campo>
        <Campo
          etiqueta={T.conductor}
          id={f.idCampo("conductorId")}
          tipo="select"
          bind:valor={f.valores.conductorId}
          ayuda={conductorElegido?.asignadoA != null ? T.yaTiene(conductorElegido.asignadoA) : T.ayudaConductor}
          error={f.error("conductorId")}
        >
          {#each contexto.conductores as c (c.valor)}
            <option value={c.valor}>{c.asignadoA === null ? c.etiqueta : T.opcionConUnidad(c.etiqueta, c.asignadoA)}</option>
          {/each}
        </Campo>
      </div>
    {/if}
  {/snippet}
</DialogoFormulario>

<style>
  /* Dos columnas cuando el diálogo es una ventana (desde 40 rem); el orden del DOM es el de lectura, fila por fila. */
  .campos {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  @media (min-width: 40rem) {
    .campos {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
</style>
