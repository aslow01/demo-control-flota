<script lang="ts" module>
  // Safari y Firefox en Mac no enfocan un botón al hacer clic: sin esto, un diálogo abierto con el mouse no sabría a dónde devolver el foco.
  let ultimoPuntero: HTMLElement | null = null;
  let ultimoPunteroEn = 0;
  if (typeof document !== "undefined") {
    document.addEventListener(
      "pointerdown",
      (evento) => {
        const blanco = evento.target;
        ultimoPuntero = blanco instanceof Element ? blanco.closest<HTMLElement>("button, a[href], [tabindex]") : null;
        ultimoPunteroEn = performance.now();
      },
      true,
    );
  }

  // Cuántos diálogos hay abiertos: el fondo recién se desbloquea cuando se cierra el último.
  let abiertos = 0;
  function bloquearFondo(bloquear: boolean): void {
    abiertos = Math.max(0, abiertos + (bloquear ? 1 : -1));
    document.documentElement.classList.toggle("dialogo-abierto", abiertos > 0);
  }

  /**
   * El segundo clic de un doble clic sobre el botón que abre un diálogo cae sobre el diálogo ya abierto (la caja o el fondo) y le quita el foco al primer campo. Solo si el
   * diálogo se abrió tras un toque o clic muy reciente: un instante después se sigue con normalidad (el teclado no frena nada).
   */
  function protegerFocoAlAbrir(): void {
    if (performance.now() - ultimoPunteroEn > 800) return;
    const frenar = (evento: Event): void => evento.preventDefault(); // sin esto el segundo `mousedown` mueve el foco
    document.addEventListener("mousedown", frenar, true);
    setTimeout(() => document.removeEventListener("mousedown", frenar, true), ABSORBER_CLICS_MS);
  }

  const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const ABSORBER_CLICS_MS = 350;

  function enfocables(raiz: ParentNode): HTMLElement[] {
    return [...raiz.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((e) => e.getClientRects().length > 0);
  }

  /**
   * El segundo clic de un doble clic no tiene que caer sobre lo que había debajo del diálogo que acaba de cerrarse. Solo si el
   * diálogo se cerró tras un toque o clic muy reciente: cerrarlo con el teclado no frena nada.
   */
  function absorberClics(): void {
    if (performance.now() - ultimoPunteroEn > 800) return;
    const absorber = (evento: Event): void => {
      evento.stopPropagation();
      evento.preventDefault();
    };
    document.addEventListener("click", absorber, true);
    setTimeout(() => document.removeEventListener("click", absorber, true), ABSORBER_CLICS_MS);
  }
</script>

<script lang="ts">
  // 5.17 Diálogo modal base. <dialog> con showModal(): el resto de la página queda inerte de forma nativa.
  //  - >= 40 rem: centrado, ancho min(34 rem, 100% - 2 rem), alto máximo 85 %, barra de título con botón cerrar (44 × 44),
  //    interior con desplazamiento propio y pie con los botones a la izquierda, primario primero y después "Cancelar" (botón-texto).
  //  - < 40 rem: hoja a pantalla completa; pie fijo abajo con el primario a todo el ancho y "Cancelar" debajo.
  //  - Foco al abrir: el primer campo (o el elemento con data-foco-inicial); `focoInicial="cancelar"` en confirmaciones destructivas;
  //    `focoInicial="titulo"` en los que solo informan (se lee el nombre y se sigue desde el principio).
  //    Al cerrar: va a `focoDestino()` si lo hay (por ejemplo, el h1 de la pantalla nueva o el h2 del panel); si no, vuelve al botón
  //    que lo abrió; si ese ya no existe, al h1 de la pantalla.
  //  - Tab y Mayús+Tab dan la vuelta dentro del diálogo. Esc = Cancelar (se maneja en keydown: el evento `cancel` del navegador
  //    deja de ser cancelable tras varios Esc seguidos). El fondo no se desplaza (con varios abiertos, hasta que se cierra el último).
  //  - Con `hayCambios`, cancelar muestra "Tiene cambios sin guardar." con "Descartar cambios" y "Seguir editando" (el foco va a este último).
  //  - Con `bloqueado` (una acción en curso) no se puede cerrar: ni Esc, ni la X, ni "Cancelar".
  //  - El interior es una región con nombre; si desborda, se puede enfocar para desplazarlo con el teclado (en todos los navegadores).
  //  - Los errores de validación viven en el contenido (5.11): el diálogo no se cierra solo.
  // Quien lo usa controla `abierto` (bind:abierto) y pone el primario en el fragmento `pie`.
  import { tick, onDestroy, type Snippet } from "svelte";
  import Boton from "./Boton.svelte";
  import { TEXTO_DIALOGO } from "./textos-marco.ts";

  let {
    titulo,
    abierto = $bindable(false),
    hayCambios = false,
    bloqueado = false,
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
    bloqueado?: boolean;
    /** Texto del botón "Cancelar"; `null` si el diálogo solo tiene un botón que lo cierra ("Entendido"). */
    cancelar?: string | null;
    focoInicial?: "campo" | "cancelar" | "titulo";
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
  let cuerpo = $state<HTMLElement | null>(null);
  let contenido = $state<HTMLElement | null>(null);
  let confirmandoDescarte = $state(false);
  let desborda = $state(false);
  let disparador: HTMLElement | null = null;
  let bloqueandoFondo = false;
  // Dónde estaba el foco cuando se pidió cerrar con cambios sin guardar: «Seguir editando» lo devuelve ahí (no al primer elemento del diálogo).
  let focoAntesDeConfirmar: HTMLElement | null = null;
  const idCambios = $derived(`${uid}-cambios`);

  $effect(() => {
    if (dialogo === null) return;
    if (abierto && !dialogo.open) abrir(dialogo);
    else if (!abierto && dialogo.open) dialogo.close();
  });

  // El interior se puede enfocar solo si desborda (si no, sería una parada de Tab sin nada que hacer).
  $effect(() => {
    if (cuerpo === null || contenido === null) return;
    const medir = (): void => {
      desborda = cuerpo !== null && cuerpo.scrollHeight > cuerpo.clientHeight + 1;
    };
    const observador = new ResizeObserver(medir);
    observador.observe(cuerpo);
    observador.observe(contenido);
    medir();
    return () => observador.disconnect();
  });

  onDestroy(() => {
    if (bloqueandoFondo) bloquearFondo(false);
  });

  function abrir(el: HTMLDialogElement): void {
    const activo = document.activeElement;
    disparador = activo instanceof HTMLElement && activo !== document.body ? activo : ultimoPuntero;
    confirmandoDescarte = false;
    el.showModal();
    protegerFocoAlAbrir();
    if (!bloqueandoFondo) {
      bloqueandoFondo = true;
      bloquearFondo(true);
    }
    void tick().then(() => enfocarInicial(el));
  }

  function enfocarInicial(el: HTMLDialogElement): void {
    if (!el.open) return;
    const pieEl = el.querySelector<HTMLElement>(".pie");
    let destino: HTMLElement | null | undefined;
    if (focoInicial === "cancelar") destino = el.querySelector<HTMLElement>("[data-foco-cancelar]");
    else if (focoInicial === "titulo") destino = el.querySelector<HTMLElement>("h2");
    else destino = el.querySelector<HTMLElement>("[data-foco-inicial]") ?? (cuerpo && enfocables(cuerpo)[0]) ?? (pieEl && enfocables(pieEl)[0]);
    (destino ?? el).focus();
  }

  /** Corre cuando el diálogo ya se cerró: suelta el fondo y devuelve el foco. */
  function alCerrarse(): void {
    if (abierto && dialogo !== null && (hayCambios || bloqueado)) {
      // Lo cerró el navegador sin pasar por acá (por ejemplo, un Esc no cancelable): no se pierde lo escrito ni se corta lo que está en curso.
      dialogo.showModal();
      if (hayCambios && !bloqueado) confirmandoDescarte = true;
      return;
    }
    if (bloqueandoFondo) {
      bloqueandoFondo = false;
      bloquearFondo(false);
    }
    absorberClics();
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
    if (bloqueado) return;
    if (hayCambios && !confirmandoDescarte) {
      const activo = document.activeElement;
      focoAntesDeConfirmar = activo instanceof HTMLElement && dialogo?.contains(activo) === true ? activo : null;
      confirmandoDescarte = true;
      void tick().then(() => dialogo?.querySelector<HTMLElement>("[data-seguir-editando]")?.focus());
    } else {
      cerrar();
    }
  }

  function seguirEditando(): void {
    confirmandoDescarte = false;
    const antes = focoAntesDeConfirmar;
    focoAntesDeConfirmar = null;
    void tick().then(() => {
      if (dialogo === null) return;
      // Vuelve donde estaba la persona; si ese control ya no existe (era el botón «Cancelar»), al primer campo.
      if (antes !== null && antes.isConnected && antes.getClientRects().length > 0) antes.focus();
      else enfocarInicial(dialogo);
    });
  }

  function alCancelar(evento: Event): void {
    // Red de seguridad: el Esc ya se manejó en keydown. Si llega un `cancel` suelto, tampoco se cierra solo.
    evento.preventDefault();
  }

  function alTeclear(evento: KeyboardEvent): void {
    if (evento.key === "Escape") {
      // Esc se maneja acá y se cancela el evento: así el navegador no abre su propio cierre del diálogo.
      evento.preventDefault();
      evento.stopPropagation();
      if (bloqueado) return;
      if (confirmandoDescarte) seguirEditando();
      else pedirCierre();
      return;
    }
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
      <h2 id={idTitulo} tabindex="-1">{titulo}</h2>
      <Boton variante="icono" icono="cerrar" etiqueta={TEXTO_DIALOGO.cerrar} cargando={bloqueado} onclick={pedirCierre} />
    </div>
    <!-- Región desplazable: si desborda debe poder enfocarse para desplazarla con el teclado (no todos los navegadores lo hacen solos). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- Solo con desplazamiento es una región con nombre (y se puede enfocar): si no, no suma un punto de referencia por diálogo. -->
    <div class="cuerpo" bind:this={cuerpo} role={desborda ? "region" : undefined} aria-labelledby={desborda ? idTitulo : undefined} tabindex={desborda ? 0 : undefined}>
      <div class="contenido" bind:this={contenido}>{@render children()}</div>
    </div>
    <div class="pie">
      {#if confirmandoDescarte}
        <p class="cambios" id={idCambios}>{TEXTO_DIALOGO.tieneCambios}</p>
        <!-- El grupo se nombra con la frase: al caer el foco en «Seguir editando» el lector dice «Tiene cambios sin guardar» antes del botón. -->
        <div class="acciones" role="group" aria-labelledby={idCambios}>
          <Boton variante="peligro" onclick={cerrar}>{TEXTO_DIALOGO.descartarCambios}</Boton>
          <Boton variante="secundario" data-seguir-editando onclick={seguirEditando}>{TEXTO_DIALOGO.seguirEditando}</Boton>
        </div>
      {:else}
        <div class="acciones">
          {@render pie?.()}
          {#if cancelar !== null}
            <Boton variante="texto" data-foco-cancelar cargando={bloqueado} onclick={pedirCierre}>{cancelar}</Boton>
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
    flex: 1;
    min-height: 0;
    padding: var(--e-4);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  /* El anillo de foco del cuerpo desplazable va por dentro: por fuera lo recortaría el diálogo y lo taparía el pie. */
  .cuerpo:focus-visible {
    outline-offset: -2px;
  }
  .contenido {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
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

  /* Pantalla muy baja (teléfono apaisado, zoom 400 %): el pie no se come el cuerpo; todo el cuadro se desplaza y el pie va al final. */
  @media (max-height: 30rem) {
    .caja {
      overflow-y: auto;
    }
    .cuerpo {
      flex: none;
      overflow: visible;
    }
  }
</style>

