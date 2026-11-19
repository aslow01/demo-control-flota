<script lang="ts" module>
  import type { ValoresDocumento } from "../lib/dominio/formulario-documento.ts";

  export interface ContextoDeDocumento {
    titulo: string;
    /** Línea de contexto («Vigente: póliza …» al renovar; la nota de «Use esto para corregir…» al corregir). */
    contexto?: string;
    /** La ayuda del emisor, si no es la de siempre (al corregir, el emisor no viene «del documento anterior»). */
    ayudaEmisor?: string;
    primario: string;
    valoresIniciales: ValoresDocumento;
  }
</script>

<script lang="ts">
  // Diálogos «Renovar», «Cargar documento» y «Corregir documento» (5.11, 5.15 y 5.17): el mismo formulario (Número*, Emisor, Vence*, Emitido) con el título, la
  // línea de contexto y el botón primario que arma el dominio (`contextoDeRenovar` / `contextoDeCargar`). No tiene reglas: lo escrito va tal
  // cual a `guardar` (que es `app.renovarDocumento` o `app.cargarDocumento`) y lo que vuelve (errores por campo o un error general) se muestra.
  //  - Foco al abrir: el primer campo. Si hay más de un error, el foco va al resumen de arriba (con un enlace a cada campo); con uno solo, al campo.
  //  - El texto escrito se conserva siempre y el diálogo no se cierra con errores. Con cambios sin guardar, cancelar pide confirmación (Dialogo).
  //  - Guardando: el botón queda con aria-disabled y no repite el pedido; el texto "Guardando…" aparece solo si tarda más de 200 ms (5.19).
  //  - Al guardar bien se cierra y llama `alGuardar(mensaje)`: quien lo usa pone el mensaje en la barra de estado y decide a dónde va el foco
  //    (`focoDestino`: el título del panel, porque la fila que abrió el diálogo ya no existe).
  import { tick, untrack } from "svelte";
  import { CAMPOS_DOCUMENTO, errorGeneral, type CampoDocumento, type ErroresDeFormulario } from "../lib/dominio/formulario-documento.ts";
  import { ERRORES } from "../lib/dominio/textos.ts";
  import type { ResultadoGuardadoDocumento } from "../lib/estado/app.svelte.ts";
  import { guardarConIndicador } from "../lib/estado/guardado.ts";
  import Boton from "./Boton.svelte";
  import Campo from "./Campo.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import ResumenErrores from "./ResumenErrores.svelte";
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
    guardar: (valores: ValoresDocumento) => Promise<ResultadoGuardadoDocumento>;
    alGuardar: (mensaje: string) => void;
    focoDestino?: () => HTMLElement | null;
  } = $props();

  const uid = $props.id();
  const idFormulario = `${uid}-formulario`;
  const idContexto = `${uid}-contexto`;
  const idCampo = (campo: CampoDocumento): string => `${uid}-${campo}`;

  let valores = $state<ValoresDocumento>({ numero: "", emisor: "", vence: "", emitido: "" });
  let errores = $state.raw<ErroresDeFormulario | null>(null);
  let guardando = $state(false);
  let mostrarGuardando = $state(false);
  let resumen = $state<ReturnType<typeof ResumenErrores> | undefined>();

  // Cada vez que se abre, parte de los valores del contexto y sin errores.
  $effect(() => {
    if (!abierto) return;
    untrack(() => {
      valores = { ...(contexto?.valoresIniciales ?? { numero: "", emisor: "", vence: "", emitido: "" }) };
      errores = null;
      guardando = false;
      mostrarGuardando = false;
    });
  });

  const hayCambios = $derived(contexto !== null && CAMPOS_DOCUMENTO.some((c) => valores[c] !== contexto.valoresIniciales[c]));
  const itemsResumen = $derived(errores === null ? [] : errores.lista.map((e) => ({ campoId: idCampo(e.campo), mensaje: e.mensaje })));
  const error = (campo: CampoDocumento): string => errores?.porCampo[campo] ?? "";

  async function enviar(evento: SubmitEvent): Promise<void> {
    evento.preventDefault();
    if (guardando || contexto === null) return;
    guardando = true;
    const r = await guardarConIndicador(() => guardar({ ...valores }), {
      alTardar: () => (mostrarGuardando = true),
      alTerminar: () => {
        guardando = false;
        mostrarGuardando = false;
      },
      alFallar: () => ({ ok: false as const, errores: errorGeneral(ERRORES.noPudoGuardar) }),
    });
    if (r.ok) {
      alGuardar(r.mensaje);
      abierto = false;
      return;
    }
    errores = r.errores;
    await tick();
    if (r.errores.lista.length > 1) resumen?.enfocar();
    else if (r.errores.lista[0] !== undefined) document.getElementById(idCampo(r.errores.lista[0].campo))?.focus();
  }
</script>

<Dialogo
  titulo={contexto?.titulo ?? ""}
  bind:abierto
  {hayCambios}
  bloqueado={guardando}
  descripcionId={contexto?.contexto !== undefined ? idContexto : undefined}
  {focoDestino}
>
  <form id={idFormulario} class="formulario" novalidate onsubmit={enviar}>
    {#if errores !== null && errores.lista.length > 1}
      <ResumenErrores bind:this={resumen} titulo={T.resumen(errores.lista.length)} items={itemsResumen} />
    {/if}
    {#if errores?.general}
      <p class="error-general" role="alert"><Icono nombre="vencido" /><span>{errores.general}</span></p>
    {/if}
    {#if contexto?.contexto !== undefined}
      <p class="nota" id={idContexto}>{contexto.contexto}</p>
    {/if}
    <Campo etiqueta={T.numero} id={idCampo("numero")} bind:valor={valores.numero} requerido autocomplete="off" error={error("numero")} />
    <Campo
      etiqueta={T.emisor}
      id={idCampo("emisor")}
      bind:valor={valores.emisor}
      autocomplete="off"
      ayuda={contexto?.ayudaEmisor ?? (contexto !== null && contexto.valoresIniciales.emisor !== "" ? T.ayudaEmisorHeredado : T.ayudaOpcional)}
      error={error("emisor")}
    />
    <Campo etiqueta={T.vence} id={idCampo("vence")} tipo="fecha" bind:valor={valores.vence} requerido error={error("vence")} />
    <Campo etiqueta={T.emitido} id={idCampo("emitido")} tipo="fecha" bind:valor={valores.emitido} ayuda={T.ayudaOpcional} error={error("emitido")} />
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
