<script lang="ts" module>
  import type { FocoTrasGuardar } from "../lib/estado/app.svelte.ts";

  /**
   * A dónde va el foco al cerrarse el diálogo (5.17). Recibe el resultado del guardado (`foco` dice qué título de la pantalla cambió: la fila o el botón que abrió el
   * diálogo puede haber desaparecido) o `null` si se cerró sin guardar (Cancelar, Esc): ahí devuelve `null` y el foco vuelve al botón que lo abrió. No hay banderas
   * sueltas que alguien tenga que acordarse de armar antes de cerrar.
   */
  export type DestinoDelFoco = (resultado: { foco: FocoTrasGuardar } | null) => HTMLElement | null;

  /** Lo que recibe el contenido de cada diálogo. */
  export interface ArgsDelFormulario<Valores, Campo extends string> {
    /** Los valores del formulario (se enlazan con `bind:` a cada campo). */
    valores: Valores;
    /** El mensaje de error de un campo, o vacío. */
    error: (campo: Campo) => string;
    /** El id del control de un campo (el que usa el resumen de errores). */
    idCampo: (campo: Campo) => string;
    /** El id que lleva el texto que describe el diálogo (`aria-describedby`), si hay uno. */
    idDescripcion: string;
    /** Cierra el diálogo sin guardar, con el foco en el título de `foco` («Ver novedades» de «Volver a servicio»). */
    cerrarEn: (foco: FocoTrasGuardar) => void;
  }
</script>

<script lang="ts" generics="V extends object, C extends string">
  // Base de los diálogos de la ficha (5.11, 5.15 y 5.17): el formulario con el resumen de errores, el error general, el botón primario con su
  // estado «Guardando…» y el cierre al guardar bien. No tiene reglas: lo escrito va tal cual a `guardar` (un método de `app`, que revisa todos los
  // campos juntos) y lo que vuelve (errores por campo o un error general) se muestra. Cada diálogo (DialogoResolver, DialogoBaja…) solo pone sus campos.
  //  - Foco al abrir: el primer campo (o el título si se pide). Con más de un error el foco va al resumen de arriba (con un enlace a cada
  //    campo); con uno solo, al campo. El texto escrito se conserva siempre y el diálogo no se cierra con errores.
  //  - Con cambios sin guardar, cancelar pide confirmación (Dialogo). Guardando: el botón queda con aria-disabled y no repite el pedido; el texto
  //    «Guardando…» aparece solo si tarda más de 200 ms (5.19).
  //  - Al guardar bien llama `alGuardar(resultado)` (quien lo usa pone el mensaje y decide el foco con `focoDestino`) y se cierra.
  //  - Sin `primario` (Volver a servicio con novedades críticas abiertas) no hay botón de guardar: solo el que cierra.
  import { tick, untrack, type Snippet } from "svelte";
  import { errorGeneralEn, type ErroresDeFormularioDe } from "../lib/dominio/formulario.ts";
  import { ERRORES } from "../lib/dominio/textos.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import { guardarConIndicador } from "../lib/estado/guardado.ts";
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import ResumenErrores from "./ResumenErrores.svelte";
  import { TEXTO_DIALOGO, TEXTO_DIALOGO_DOCUMENTO, TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    titulo,
    valoresIniciales,
    primario,
    peligro = false,
    cancelar,
    focoInicial = "campo",
    conDescripcion = false,
    obligatorios = true,
    guardar,
    alGuardar,
    focoDestino,
    children,
  }: {
    abierto?: boolean;
    titulo: string;
    /** `null` mientras no hay nada que abrir. */
    valoresIniciales: V | null;
    /** Texto del botón de guardar; `null` si no hay (solo informa). */
    primario: string | null;
    /** El botón de guardar es de peligro (dar de baja). */
    peligro?: boolean;
    /** Texto del botón que cierra (por defecto «Cancelar»). */
    cancelar?: string;
    focoInicial?: "campo" | "cancelar" | "titulo";
    /** El diálogo tiene un texto que lo describe: se lee al abrirlo (el contenido lo pone con `idDescripcion`). */
    conDescripcion?: boolean;
    /** Tiene campos con `*`: la línea «Los campos con * son obligatorios.» va al inicio. Sin campos (Volver a servicio), `false`. */
    obligatorios?: boolean;
    guardar: (valores: V) => Promise<ResultadoGuardado<C>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<C>, { ok: true }>) => void;
    focoDestino?: DestinoDelFoco;
    children: Snippet<[ArgsDelFormulario<V, C>]>;
  } = $props();

  const uid = $props.id();
  const idFormulario = `${uid}-formulario`;
  const idDescripcion = `${uid}-descripcion`;
  const idCampo = (campo: C): string => `${uid}-${campo}`;

  let valores = $state<V>({ ...(untrack(() => valoresIniciales) ?? {}) } as V);
  let errores = $state.raw<ErroresDeFormularioDe<C> | null>(null);
  let guardando = $state(false);
  let mostrarGuardando = $state(false);
  let resumen = $state<ReturnType<typeof ResumenErrores> | undefined>();
  // Cómo se cerró (con qué resultado de guardado, o `null`): lo consume `focoDestino` cuando el diálogo ya se cerró.
  let cierre: { foco: FocoTrasGuardar } | null = null;

  // Cada vez que se abre, parte de los valores del contexto y sin errores. `$effect.pre`: tiene que correr antes de que se dibuje el contenido (los campos
  // se enlazan con `bind:` y no aceptan un valor que todavía no existe).
  $effect.pre(() => {
    if (!abierto) return;
    const iniciales = valoresIniciales;
    untrack(() => {
      valores = { ...(iniciales ?? {}) } as V;
      errores = null;
      guardando = false;
      mostrarGuardando = false;
      cierre = null;
    });
  });

  function cerrarEn(foco: FocoTrasGuardar): void {
    cierre = { foco };
    abierto = false;
  }
  function destinoDelFoco(): HTMLElement | null {
    const como = cierre;
    cierre = null;
    return focoDestino?.(como) ?? null;
  }

  const hayCambios = $derived(
    valoresIniciales !== null &&
      Object.keys(valoresIniciales).some((k) => (valores as Record<string, unknown>)[k] !== (valoresIniciales as Record<string, unknown>)[k]),
  );
  const itemsResumen = $derived(errores === null ? [] : errores.lista.map((e) => ({ campoId: idCampo(e.campo), mensaje: e.mensaje })));
  const error = (campo: C): string => errores?.porCampo[campo] ?? "";

  async function enviar(evento: SubmitEvent): Promise<void> {
    evento.preventDefault();
    if (guardando || valoresIniciales === null || primario === null) return;
    guardando = true;
    const r = await guardarConIndicador(() => guardar({ ...valores }), {
      alTardar: () => (mostrarGuardando = true),
      alTerminar: () => {
        guardando = false;
        mostrarGuardando = false;
      },
      alFallar: () => ({ ok: false as const, errores: errorGeneralEn<C>(ERRORES.noPudoGuardar) }),
    });
    if (r.ok) {
      cierre = r;
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

<Dialogo
  {titulo}
  bind:abierto
  {hayCambios}
  bloqueado={guardando}
  {cancelar}
  {focoInicial}
  descripcionId={conDescripcion ? idDescripcion : undefined}
  focoDestino={destinoDelFoco}
>
  <form id={idFormulario} class="formulario" novalidate onsubmit={enviar}>
    {#if errores !== null && errores.lista.length > 1}
      <ResumenErrores bind:this={resumen} nivel="h3" titulo={TEXTO_DIALOGO_DOCUMENTO.resumen(errores.lista.length)} items={itemsResumen} />
    {/if}
    {#if errores?.general}
      <p class="error-general" role="alert"><Icono nombre="vencido" /><span>{errores.general}</span></p>
    {/if}
    {#if obligatorios}<p class="nota">{TEXTO_DIALOGO.obligatorios}</p>{/if}
    {@render children({ valores, error, idCampo, idDescripcion, cerrarEn })}
  </form>
  {#snippet pie()}
    {#if primario !== null}
      <Boton type="submit" form={idFormulario} variante={peligro ? "peligro" : "primario"} cargando={guardando}>
        {mostrarGuardando ? T.guardando : primario}
      </Boton>
    {/if}
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
