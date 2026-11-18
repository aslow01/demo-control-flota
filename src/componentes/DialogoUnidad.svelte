<script lang="ts">
  // Diálogo «Agregar unidad» (5.11, 5.15 y 5.17): Patente*, Interno*, Tipo*, Marca*, Modelo*, Año*, Proyecto* y Conductor, con las opciones de los
  // `select` y los textos que arma el dominio (`contextoDeAgregarUnidad`). No tiene reglas: lo escrito va tal cual a `guardar` (`app.agregarUnidad`)
  // y lo que vuelve (errores por campo o un error general) se muestra. Lo escrito se conserva siempre y el diálogo no se cierra con errores.
  //  - Foco al abrir: el primer campo. Con más de un error el foco va al resumen de arriba (con un enlace a cada campo); con uno solo, al campo.
  //  - Con cambios sin guardar, cancelar pide confirmación (Dialogo). Guardando: el botón queda con aria-disabled y no repite el pedido; el
  //    texto «Guardando…» aparece solo si tarda más de 200 ms (5.19).
  //  - Al guardar bien se cierra y llama `alGuardar(resultado)`: quien lo usa pone el mensaje en la barra de estado y decide a dónde va el
  //    foco (`focoDestino`: la fila nueva, o el título del panel si no se ve).
  import { tick, untrack } from "svelte";
  import { CAMPOS_UNIDAD, type CampoUnidad, type ContextoAgregarUnidad, type ErroresDeFormularioUnidad, type ValoresUnidad } from "../lib/dominio/formulario-unidad.ts";
  import type { ResultadoAgregarUnidad } from "../lib/estado/app.svelte.ts";
  import Boton from "./Boton.svelte";
  import Campo from "./Campo.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import ResumenErrores from "./ResumenErrores.svelte";
  import { TEXTO_DIALOGO_DOCUMENTO, TEXTO_DIALOGO_UNIDAD as T } from "./textos-marco.ts";

  type Agregada = Extract<ResultadoAgregarUnidad, { ok: true }>;

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoAgregarUnidad | null;
    guardar: (valores: ValoresUnidad) => Promise<ResultadoAgregarUnidad>;
    alGuardar: (resultado: Agregada) => void;
    focoDestino?: () => HTMLElement | null;
  } = $props();

  const uid = $props.id();
  const idFormulario = `${uid}-formulario`;
  const idCampo = (campo: CampoUnidad): string => `${uid}-${campo}`;

  const VACIOS: ValoresUnidad = { patente: "", interno: "", tipo: "", marca: "", modelo: "", anio: "", proyectoId: "", conductorId: "" };

  let valores = $state<ValoresUnidad>({ ...VACIOS });
  let errores = $state.raw<ErroresDeFormularioUnidad | null>(null);
  let guardando = $state(false);
  let mostrarGuardando = $state(false);
  let resumen = $state<ReturnType<typeof ResumenErrores> | undefined>();

  // Cada vez que se abre, parte de los valores del contexto (todos vacíos) y sin errores.
  $effect(() => {
    if (!abierto) return;
    untrack(() => {
      valores = { ...(contexto?.valoresIniciales ?? VACIOS) };
      errores = null;
      guardando = false;
      mostrarGuardando = false;
    });
  });

  const hayCambios = $derived(contexto !== null && CAMPOS_UNIDAD.some((c) => valores[c] !== contexto.valoresIniciales[c]));
  const itemsResumen = $derived(errores === null ? [] : errores.lista.map((e) => ({ campoId: idCampo(e.campo), mensaje: e.mensaje })));
  const error = (campo: CampoUnidad): string => errores?.porCampo[campo] ?? "";
  const conductorElegido = $derived(contexto?.conductores.find((c) => c.valor === valores.conductorId));
  const ayudaConductor = $derived(conductorElegido?.asignadoA != null ? T.yaTiene(conductorElegido.asignadoA) : T.ayudaConductor);

  async function enviar(evento: SubmitEvent): Promise<void> {
    evento.preventDefault();
    if (guardando || contexto === null) return;
    guardando = true;
    const plazo = setTimeout(() => (mostrarGuardando = true), 200);
    const r = await guardar({ ...valores });
    clearTimeout(plazo);
    guardando = false;
    mostrarGuardando = false;
    if (r.ok) {
      alGuardar(r);
      abierto = false;
      return;
    }
    errores = r.errores;
    await tick();
    if (r.errores.lista.length > 1) resumen?.enfocar();
    else if (r.errores.lista[0] !== undefined) document.getElementById(idCampo(r.errores.lista[0].campo))?.focus();
  }
</script>

<Dialogo titulo={contexto?.titulo ?? ""} bind:abierto {hayCambios} bloqueado={guardando} {focoDestino}>
  <form id={idFormulario} class="formulario" novalidate onsubmit={enviar}>
    {#if errores !== null && errores.lista.length > 1}
      <ResumenErrores bind:this={resumen} titulo={TEXTO_DIALOGO_DOCUMENTO.resumen(errores.lista.length)} items={itemsResumen} />
    {/if}
    {#if errores?.general}
      <p class="error-general" role="alert"><Icono nombre="vencido" /><span>{errores.general}</span></p>
    {/if}
    <div class="campos">
      <Campo
        etiqueta={T.patente}
        id={idCampo("patente")}
        bind:valor={valores.patente}
        requerido
        autocomplete="off"
        mayusculas
        ayuda={T.ayudaPatente}
        error={error("patente")}
      />
      <Campo
        etiqueta={T.interno}
        id={idCampo("interno")}
        bind:valor={valores.interno}
        requerido
        autocomplete="off"
        modoEntrada="numeric"
        corto
        ayuda={T.ayudaInterno}
        error={error("interno")}
      />
      <Campo etiqueta={T.tipo} id={idCampo("tipo")} tipo="select" bind:valor={valores.tipo} requerido error={error("tipo")}>
        <option value="">{T.elegirTipo}</option>
        {#each contexto?.tipos ?? [] as t (t.valor)}
          <option value={t.valor}>{t.etiqueta}</option>
        {/each}
      </Campo>
      <Campo etiqueta={T.marca} id={idCampo("marca")} bind:valor={valores.marca} requerido autocomplete="off" error={error("marca")} />
      <Campo etiqueta={T.modelo} id={idCampo("modelo")} bind:valor={valores.modelo} requerido autocomplete="off" error={error("modelo")} />
      <Campo
        etiqueta={T.anio}
        id={idCampo("anio")}
        bind:valor={valores.anio}
        requerido
        autocomplete="off"
        modoEntrada="numeric"
        corto
        ayuda={contexto === null ? "" : T.ayudaAnio(contexto.anios.minimo, contexto.anios.maximo)}
        error={error("anio")}
      />
      <Campo etiqueta={T.proyecto} id={idCampo("proyectoId")} tipo="select" bind:valor={valores.proyectoId} requerido error={error("proyectoId")}>
        <option value="">{T.elegirProyecto}</option>
        {#each contexto?.proyectos ?? [] as p (p.valor)}
          <option value={p.valor}>{p.etiqueta}</option>
        {/each}
      </Campo>
      <Campo
        etiqueta={T.conductor}
        id={idCampo("conductorId")}
        tipo="select"
        bind:valor={valores.conductorId}
        ayuda={ayudaConductor}
        error={error("conductorId")}
      >
        {#each contexto?.conductores ?? [] as c (c.valor)}
          <option value={c.valor}>{c.asignadoA === null ? c.etiqueta : T.opcionConUnidad(c.etiqueta, c.asignadoA)}</option>
        {/each}
      </Campo>
    </div>
  </form>
  {#snippet pie()}
    <Boton type="submit" form={idFormulario} cargando={guardando}>{mostrarGuardando ? T.guardando : (contexto?.primario ?? "")}</Boton>
  {/snippet}
</Dialogo>

<style>
  .formulario {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
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
  .error-general {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    padding: var(--e-3);
    background: var(--c-critico-f);
    border-left: 4px solid var(--c-critico-r);
    border-radius: var(--r-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .error-general :global(.icono) {
    margin-top: 0.1rem;
  }
</style>
