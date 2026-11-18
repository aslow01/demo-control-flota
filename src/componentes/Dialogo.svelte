<script lang="ts" module>
  // Safari y Firefox en Mac no enfocan un botón al hacer clic: sin esto, un diálogo abierto con el mouse no sabría a dónde devolver el foco.
  let ultimoPuntero: HTMLElement | null = null;
  if (typeof document !== "undefined") {
    document.addEventListener(
      "pointerdown",
      (evento) => {
        const blanco = evento.target;
        ultimoPuntero = blanco instanceof Element ? blanco.closest<HTMLElement>("button, a[href], [tabindex]") : null;
      },
      true,
    );
  }

  const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function enfocables(raiz: ParentNode): HTMLElement[] {
    return [...raiz.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((e) => e.getClientRects().length > 0);
  }
</script>

<script lang="ts">
  // 5.17 Diálogo modal base. <dialog> con showModal(): el resto de la página queda inerte de forma nativa.
  //  - >= 40 rem: centrado, ancho min(34 rem, 100% - 2 rem), alto máximo 85 %, barra de título con botón cerrar (44 × 44),
  //    interior con desplazamiento propio y pie con los botones a la izquierda, primario primero y después "Cancelar" (botón-texto).
  //  - < 40 rem: hoja a pantalla completa; pie fijo abajo con el primario a todo el ancho y "Cancelar" debajo.
  //  - Foco al abrir: el primer campo (o el elemento con data-foco-inicial); en confirmaciones destructivas, "Cancelar" (`focoInicial="cancelar"`).
  //    Al cerrar: vuelve al botón que lo abrió; si ya no existe, a `focoDestino()` o, si no, al h1 de la pantalla.
  //  - Tab y Mayús+Tab dan la vuelta dentro del diálogo. Esc = Cancelar. El fondo no se desplaza.
  //  - Con `hayCambios`, cancelar muestra "Tiene cambios sin guardar." con "Descartar cambios" y "Seguir editando" (el foco va a este último).
  //  - Los errores de validación viven en el contenido (5.11): el diálogo no se cierra solo.
  // Quien lo usa controla `abierto` (bind:abierto) y pone el primario en el fragmento `pie`.
  import { tick, onDestroy, type Snippet } from "svelte";
  import Boton from "./Boton.svelte";
  import { TEXTO_DIALOGO } from "./textos-marco.ts";

  let {
    titulo,
    abierto = $bindable(false),
    hayCambios = false,
    cancelar = TEXTO_DIALOGO.cancelar,
    focoInicial = "campo",
    descripcionId,
    focoDestino,
    pie,
    children,
  }: {
    titulo: string;
    abierto?: boolean;
    hayCambios?: boolean;
    /** Texto del botón "Cancelar"; `null` si el diálogo solo tiene un botón que lo cierra ("Entendido"). */
    cancelar?: string | null;
    focoInicial?: "campo" | "cancelar";
    /** Id del texto que describe el diálogo (aria-describedby). */
    descripcionId?: string;
    /** A dónde va el foco al cerrar, si hay un lugar mejor que el botón que lo abrió (por ejemplo, el h1 de la pantalla nueva). */
    focoDestino?: () => HTMLElement | null;
    pie?: Snippet;
    children: Snippet;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(`${uid}-titulo`);

  let dialogo = $state<HTMLDialogElement | null>(null);
  let confirmandoDescarte = $state(false);
  let disparador: HTMLElement | null = null;

  $effect(() => {
    if (dialogo === null) return;
    if (abierto && !dialogo.open) abrir(dialogo);
    else if (!abierto && dialogo.open) dialogo.close();
  });

  onDestroy(() => {
    document.documentElement.classList.remove("dialogo-abierto");
  });

  function abrir(el: HTMLDialogElement): void {
    const activo = document.activeElement;
    disparador = activo instanceof HTMLElement && activo !== document.body ? activo : ultimoPuntero;
    confirmandoDescarte = false;
    el.showModal();
    document.documentElement.classList.add("dialogo-abierto");
    void tick().then(() => enfocarInicial(el));
  }

  function enfocarInicial(el: HTMLDialogElement): void {
    if (!el.open) return;
    const cuerpo = el.querySelector<HTMLElement>(".cuerpo");
    const pieEl = el.querySelector<HTMLElement>(".pie");
    let destino: HTMLElement | null | undefined;
    if (focoInicial === "cancelar") destino = el.querySelector<HTMLElement>("[data-foco-cancelar]");
    else destino = el.querySelector<HTMLElement>("[data-foco-inicial]") ?? (cuerpo && enfocables(cuerpo)[0]) ?? (pieEl && enfocables(pieEl)[0]);
    (destino ?? el).focus();
  }

  /** Corre cuando el diálogo ya se cerró (por `abierto = false`): suelta el desplazamiento del fondo y devuelve el foco. */
  function alCerrarse(): void {
    document.documentElement.classList.remove("dialogo-abierto");
    if (abierto) abierto = false;
    confirmandoDescarte = false;
    const lugar = focoDestino?.() ?? null;
    const volver = disparador !== null && disparador.isConnected && disparador.getClientRects().length > 0 ? disparador : null;
    disparador = null;
    const destino = lugar ?? volver ?? document.querySelector<HTMLElement>("main h1");
    destino?.focus();
  }

  function cerrar(): void {
    abierto = false;
  }

  function pedirCierre(): void {
    if (hayCambios && !confirmandoDescarte) {
      confirmandoDescarte = true;
      void tick().then(() => dialogo?.querySelector<HTMLElement>("[data-seguir-editando]")?.focus());
    } else {
      cerrar();
    }
  }

  function seguirEditando(): void {
    confirmandoDescarte = false;
    if (dialogo !== null) void tick().then(() => dialogo !== null && enfocarInicial(dialogo));
  }

  function alCancelar(evento: Event): void {
    // Esc: no se cierra solo, se trata igual que "Cancelar".
    evento.preventDefault();
    if (confirmandoDescarte) seguirEditando();
    else pedirCierre();
  }

  function alTeclear(evento: KeyboardEvent): void {
    if (evento.key !== "Tab" || dialogo === null) return;
    const lista = enfocables(dialogo);
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (primero === undefined || ultimo === undefined) {
      evento.preventDefault();
      return;
    }
    const activo = document.activeElement;
    if (evento.shiftKey && (activo === primero || activo === dialogo)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
</script>

<dialog
  bind:this={dialogo}
  aria-labelledby={idTitulo}
  aria-describedby={descripcionId}
  oncancel={alCancelar}
  onclose={alCerrarse}
  onkeydown={alTeclear}
>
  <div class="caja">
    <div class="barra">
      <h2 id={idTitulo}>{titulo}</h2>
      <Boton variante="icono" icono="cerrar" etiqueta={TEXTO_DIALOGO.cerrar} onclick={pedirCierre} />
    </div>
    <div class="cuerpo">{@render children()}</div>
    <div class="pie">
      {#if confirmandoDescarte}
        <p class="cambios">{TEXTO_DIALOGO.tieneCambios}</p>
        <div class="acciones">
          <Boton variante="peligro" onclick={cerrar}>{TEXTO_DIALOGO.descartarCambios}</Boton>
          <Boton variante="secundario" data-seguir-editando onclick={seguirEditando}>{TEXTO_DIALOGO.seguirEditando}</Boton>
        </div>
      {:else}
        <div class="acciones">
          {@render pie?.()}
          {#if cancelar !== null}
            <Boton variante="texto" data-foco-cancelar onclick={pedirCierre}>{cancelar}</Boton>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</dialog>

<style>
  dialog {
    padding: 0;
    border: 1px solid var(--c-ventana-borde);
    background: var(--c-superficie);
    color: var(--c-texto);
    box-shadow: var(--s-flotante);
    /* Pantalla completa a menos de 40 rem (hoja). */
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    border-radius: 0;
    overscroll-behavior: contain;
  }
  dialog::backdrop {
    background: var(--c-velo);
  }
  dialog[open] {
    animation: subir var(--m-lento) var(--m-curva);
  }
  @keyframes subir {
    from {
      transform: translateY(2rem);
      opacity: 0;
    }
  }
  @keyframes aparecer {
    from {
      opacity: 0;
    }
  }

  .caja {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: inherit;
  }

  .barra {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2);
    min-height: 2.75rem;
    padding: 0 var(--e-1) 0 var(--e-4);
    background: var(--c-ventana-barra);
    border-bottom: 1px solid var(--c-borde);
  }
  h2 {
    padding-block: var(--e-2);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .cuerpo {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--e-4);
    min-height: 0;
    padding: var(--e-4);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .pie {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-3) var(--e-4);
    padding-bottom: calc(var(--e-3) + env(safe-area-inset-bottom, 0px));
    background: var(--c-ventana-barra);
    border-top: 1px solid var(--c-borde);
  }
  .acciones {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--e-2);
  }
  .cambios {
    font-size: var(--t-chico);
    font-weight: 600;
    color: var(--c-texto);
  }

  /* Escritorio: centrado, con el pie a la izquierda y el primario primero. */
  @media (min-width: 40rem) {
    dialog {
      width: min(34rem, 100% - 2rem);
      height: fit-content; /* no `auto`: un cuadro con top y bottom fijos se estiraría hasta el alto máximo */
      max-height: 85dvh;
      margin: auto;
      border-radius: var(--r-4);
    }
    dialog[open] {
      animation: aparecer var(--m-medio) var(--m-curva);
    }
    .caja {
      height: auto;
      max-height: 85dvh;
    }
    .barra {
      border-radius: calc(var(--r-4) - 1px) calc(var(--r-4) - 1px) 0 0;
    }
    .pie {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      padding-bottom: var(--e-3);
      border-radius: 0 0 calc(var(--r-4) - 1px) calc(var(--r-4) - 1px);
    }
    .acciones {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }
  }
</style>
