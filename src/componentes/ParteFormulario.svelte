<script lang="ts">
  // Parte diario para completar, en sus dos pasos (6.5, A y B): la revisión antes de salir (`vista.tipo === "edicion"`: kilometraje al salir, los 10 puntos y «Otra novedad») y el cierre de
  // la jornada (`vista.tipo === "cierre"`: kilometraje al terminar y combustible). Jerarquía: 1) qué paso es, de qué unidad y qué día; 2) lo que falta; 3) enviar la revisión o cerrar.
  // No tiene reglas de negocio: los valores son texto (`dominio/formulario-parte.ts`), el borrador se guarda solo (`app.autoguardadoDeParte` / `app.autoguardadoDeCierre`, P3) y el envío lo
  // deciden `app.enviarRevisionDeParte` y `app.enviarCierreDeParte`. El paso no cambia mientras el formulario está en pantalla (`PantallaParte` lo monta con una clave que incluye el tipo).
  //  - Autoguardado: cada tecla (`input`) y cada cambio de un radio o un `select` (`change`) lo programan 500 ms después; al salir de un campo guarda ya. El texto escrito nunca
  //    se pisa: la vista nueva (`valoresIniciales`) solo se lee al arrancar y después de «Descartar borrador». Antes de enviar, de descartar o de irse, se guarda lo pendiente.
  //  - El indicador de guardado es texto visible; el `role="status"` oculto dice SOLO el texto de `indicador.anuncio`, que cambia al cambiar de estado (no en cada guardado).
  //  - «Enviar revisión» y «Cerrar el parte» nunca se deshabilitan (5.14): con datos que faltan abren el resumen de errores arriba, con el foco; con avisos (K6, K7, P9), el diálogo
  //    «Antes de enviar»; si sale, avisan a la pantalla (`alEnviado`) y esta pasa al resultado (C1, C2 o C3). El error de un campo se queda mientras el campo tenga lo mismo que al enviar
  //    (no desaparece solo con el tiempo); al tocarlo, su mensaje y su renglón del resumen se van, y el resumen cambia su título al nuevo conteo.
  //  - Los errores de formato de un campo (km con letras…) llegan al salir del campo y bloquean el guardado hasta corregirlos (indicador «Sin guardar: corrija…»).
  //  - Paso 2: la revisión ya enviada no se toca (P7): va como resumen arriba (con un `details` que muestra los puntos), sin «Descartar borrador» y sin `select` de conductor.
  import { onDestroy, tick, untrack } from "svelte";
  import { agruparResumen, barraDeEnvio, errorGeneralParte, recorridoDe, respondidos, type CampoParte, type ErroresDeParte, type ValoresParte } from "../lib/dominio/formulario-parte.ts";
  import { ERRORES, TEXTO_DIALOGOS_FICHA, TEXTO_FORMULARIO_PARTE } from "../lib/dominio/textos.ts";
  import type { Advertencia, ItemChecklist } from "../lib/dominio/tipos.ts";
  import type { AdvertenciaDeEnvio, ResultadoDeEnvio } from "../lib/estado/app.svelte.ts";
  import type { IndicadorDeGuardado } from "../lib/estado/autoguardado.ts";
  import { guardarConIndicador } from "../lib/estado/guardado.ts";
  import { app } from "../lib/estado/instancia.ts";
  import BarraEnvio from "./BarraEnvio.svelte";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
  import Detalles from "./Detalles.svelte";
  import DialogoAntesDeEnviar from "./DialogoAntesDeEnviar.svelte";
  import ItemRevision from "./ItemRevision.svelte";
  import ParteEncabezado from "./ParteEncabezado.svelte";
  import ResumenErrores from "./ResumenErrores.svelte";
  import RevisionLeida from "./RevisionLeida.svelte";
  import SelectorCombustible from "./SelectorCombustible.svelte";
  import { TEXTO_DIALOGO, TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";
  import type { PanelParteEnviado, ParteEnCierre, ParteEnEdicion } from "./tipos.ts";

  let { vista, alEnviado }: { vista: ParteEnEdicion | ParteEnCierre; alEnviado: (panel: PanelParteEnviado) => void } = $props();

  const uid = $props.id();
  const id = (nombre: string): string => `${uid}-${nombre}`;
  const idCampo = (campo: CampoParte): string => id(campo);

  // Con lo que arrancó el formulario: no se vuelve a leer (pisaría lo que se está escribiendo), salvo al descartar el borrador.
  const arranque = untrack(() => vista);
  const paso = arranque.paso;
  const esCierre = paso === "cierre";
  let valores = $state<ValoresParte>(structuredClone(arranque.valoresIniciales));
  let indicador = $state<IndicadorDeGuardado>({ estado: "inicial", visible: "", anuncio: "", hora: null });
  let descartado = $state("");
  const alCambiarIndicador = (i: IndicadorDeGuardado): void => {
    indicador = i;
    if (i.estado !== "inicial") descartado = "";
  };
  const auto = arranque.tipo === "edicion" ? app.autoguardadoDeParte(arranque, alCambiarIndicador) : app.autoguardadoDeCierre(arranque, alCambiarIndicador);

  // «Recorrido» se actualiza al salir de cada campo (5.11): es un `output`, que se lee solo, y no hay que dictarlo en cada tecla.
  let recorrido = $state(untrack(() => recorridoDe(valores.kmInicio, valores.kmFin)));

  // Errores: los del último envío (resumen y campos, hasta el próximo envío) y los de formato que dijo el autoguardado al salir de un campo.
  // El mensaje de un campo se queda hasta que la persona lo toca (no desaparece solo con el tiempo): se compara con lo que había al enviar.
  let erroresEnvio = $state.raw<ErroresDeParte | null>(null);
  let valoresAlEnviar = $state.raw<ValoresParte | null>(null);
  let erroresCampo = $state.raw<Partial<Record<CampoParte, string>>>({});
  function claveDe(campo: CampoParte, v: ValoresParte): string {
    switch (campo) {
      case "conductor":
        return v.conductorId;
      case "kmInicio":
      case "kmFin":
      case "combustible":
        return v[campo];
      case "litrosCargados":
        return v.litros;
      case "otraNovedad":
        return JSON.stringify(v.otraNovedad);
      default:
        return JSON.stringify(v.checklist[campo]);
    }
  }
  /** El error del último envío sigue valiendo mientras el campo tenga lo mismo que cuando se envió. */
  const vigente = (campo: CampoParte): boolean => erroresEnvio !== null && valoresAlEnviar !== null && claveDe(campo, valores) === claveDe(campo, valoresAlEnviar);
  const errorDe = (campo: CampoParte): string => (vigente(campo) ? erroresEnvio?.porCampo[campo] : undefined) ?? erroresCampo[campo] ?? "";
  let resumen = $state<ReturnType<typeof ResumenErrores> | undefined>();
  let irAlResumen = false;

  let enviando = $state(false);
  let mostrarEnviando = $state(false);
  let dialogoAbierto = $state(false);
  let advertencias = $state.raw<AdvertenciaDeEnvio[]>([]);
  let aceptables: Advertencia["tipo"][] = [];
  let terminado = false;

  const instantanea = (): ValoresParte => $state.snapshot(valores) as ValoresParte;
  const esItem = (campo: CampoParte): campo is ItemChecklist => campo in valores.checklist;

  /** A dónde lleva el enlace del resumen: la descripción si el punto ya está «Con novedad»; si no, el primer radio del punto. */
  function idDelError(campo: CampoParte): string {
    return esItem(campo) && valores.checklist[campo].respuesta === "con-novedad" ? `${idCampo(campo)}-descripcion` : idCampo(campo);
  }
  const listaVigente = $derived(erroresEnvio === null ? [] : erroresEnvio.lista.filter((x) => vigente(x.campo)));
  // D1: con más de 3 puntos sin responder, un solo enlace («Faltan 10 puntos de la revisión») que lleva al primero; mientras se completan, lo que sigue vigente se vuelve a agrupar.
  const itemsResumen = $derived(agruparResumen(listaVigente).map((x) => ({ campoId: idDelError(x.campo), mensaje: x.mensaje })));
  const tituloResumen = $derived(
    erroresEnvio === null ? "" : listaVigente.length === erroresEnvio.lista.length ? erroresEnvio.titulo : TEXTO_FORMULARIO_PARTE.tituloRevise(listaVigente.length, paso),
  );
  const hayResumen = $derived(erroresEnvio !== null && (listaVigente.length > 0 || erroresEnvio.general !== null));

  // La barra dice «Faltan N datos» o «Listo para enviar»; tras un intento con errores de reglas que siguen vigentes (la licencia, el kilometraje), «Revise N datos» (C5).
  const barra = $derived(barraDeEnvio(valores, paso, listaVigente.map((x) => x.campo)));
  const textoIndicador = $derived(
    descartado !== "" && indicador.estado === "inicial" ? descartado : indicador.visible !== "" ? indicador.visible : (vista.borrador?.mensaje ?? ""),
  );
  const anuncioVivo = $derived(descartado !== "" ? descartado : indicador.anuncio);
  const indicadorConError = $derived(indicador.estado === "error" || indicador.estado === "campos");

  // ---------- Autoguardado ----------
  function alCambiar(): void {
    auto.cambio(instantanea());
  }
  /** B3 de la etapa 7: la tecla Enter de un campo hace lo que promete su `enterkeyhint`. «next» pasa al control siguiente del formulario; «done» lleva el foco al botón de envío (no lo activa: otro Enter lo hace). */
  function alTeclear(evento: KeyboardEvent & { currentTarget: EventTarget & HTMLFormElement }): void {
    if (evento.key !== "Enter" || evento.isComposing || evento.shiftKey || evento.ctrlKey || evento.altKey || evento.metaKey) return;
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement)) return;
    const tecla = campo.getAttribute("enterkeyhint");
    if (tecla === null) return;
    evento.preventDefault();
    if (tecla === "done") {
      document.querySelector<HTMLButtonElement>(".barra-envio button")?.focus();
      return;
    }
    const controles = [...evento.currentTarget.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]")];
    const siguiente = controles.find(
      (c) => c !== campo && c.tabIndex >= 0 && !c.matches(":disabled") && c.getClientRects().length > 0 && Boolean(campo.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
    // Un grupo de radios con una respuesta elegida entra por esa respuesta (como con Tab).
    const destino = siguiente instanceof HTMLInputElement && siguiente.type === "radio" ? (controles.find((c) => c instanceof HTMLInputElement && c.type === "radio" && c.name === siguiente.name && c.checked) ?? siguiente) : siguiente;
    destino?.focus();
  }
  async function alSalirDelCampo(): Promise<void> {
    recorrido = recorridoDe(valores.kmInicio, valores.kmFin);
    const r = await auto.alSalirDelCampo(instantanea());
    if (r === null) return;
    erroresCampo = r.ok ? {} : r.tipo === "campos" ? r.errores.porCampo : erroresCampo;
  }
  function alOcultarse(): void {
    if (document.visibilityState === "hidden" && !terminado && !yaEnviado()) void auto.vaciar(instantanea());
  }
  // Al irse de la pantalla se guarda lo pendiente; un paso que ya salió no se toca (al enviar, la vista pasa al paso siguiente o a «lectura» antes de que este componente se entere):
  // la revisión salió cuando el parte deja de ser un borrador; el cierre, cuando queda enviado.
  const yaEnviado = (): boolean =>
    app.estado?.partes.some((p) => p.unidadId === arranque.unidadId && p.fecha === arranque.fecha && (esCierre ? p.estado === "enviado" : p.estado !== "borrador")) === true;
  onDestroy(() => {
    if (!terminado && !yaEnviado()) void auto.vaciar(instantanea());
    auto.cerrar();
  });

  // ---------- Enviar ----------
  async function enviar(aceptadas: Advertencia["tipo"][] = []): Promise<void> {
    if (enviando) return;
    enviando = true;
    const copia = instantanea();
    const r = await guardarConIndicador<ResultadoDeEnvio>(
      async () => {
        await auto.vaciar(copia); // lo escrito en los últimos 500 ms no se pierde
        return esCierre ? app.enviarCierreDeParte(arranque.unidadId, arranque.fecha, copia, aceptadas) : app.enviarRevisionDeParte(arranque.unidadId, arranque.fecha, copia, aceptadas);
      },
      {
        alTardar: () => (mostrarEnviando = true),
        alTerminar: () => {
          enviando = false;
          mostrarEnviando = false;
        },
        alFallar: () => ({
          tipo: "errores",
          errores: errorGeneralParte(ERRORES.noPudoGuardarElParte, esCierre ? TEXTO_FORMULARIO_PARTE.tituloGeneralCierre : undefined),
          foco: "resumen-de-errores",
          primerCampo: null,
        }),
      },
    );
    if (r.tipo === "enviado") {
      terminado = true;
      alEnviado(r.panel);
      return;
    }
    if (r.tipo === "advertencias") {
      advertencias = r.advertencias;
      aceptables = r.aceptables;
      dialogoAbierto = true;
      return;
    }
    erroresEnvio = r.errores;
    valoresAlEnviar = copia;
    irAlResumen = dialogoAbierto; // el diálogo, al cerrarse, no se lleva el foco: va al resumen
    dialogoAbierto = false;
    await tick();
    if (!irAlResumen) resumen?.enfocar();
  }
  function focoDelDialogo(): HTMLElement | null {
    if (!irAlResumen) return null;
    irAlResumen = false;
    return document.querySelector<HTMLElement>("[data-resumen-parte] [tabindex='-1']");
  }

  // ---------- Descartar el borrador (solo en la revisión: la revisión enviada no se descarta, P7) ----------
  async function descartar(): Promise<void> {
    const parteId = arranque.tipo === "edicion" ? vista.parteId : null;
    if (parteId === null) return;
    const r = await app.descartarBorradorDeParte(parteId);
    if (!r.ok) {
      erroresEnvio = r.errores;
      valoresAlEnviar = instantanea();
      await tick();
      resumen?.enfocar();
      return;
    }
    const nueva = app.parteDeLaRuta;
    if (nueva !== null && nueva.tipo === "edicion") {
      valores = structuredClone(nueva.valoresIniciales);
      auto.reiniciar(structuredClone(nueva.valoresIniciales));
    }
    erroresEnvio = null;
    valoresAlEnviar = null;
    erroresCampo = {};
    recorrido = recorridoDe(valores.kmInicio, valores.kmFin);
    descartado = r.mensaje;
    await tick();
    // El botón que tenía el foco ya no existe: el foco va al título.
    document.querySelector<HTMLElement>("main h1")?.focus();
  }

</script>

<svelte:document onvisibilitychange={alOcultarse} />

<div class="parte">
  <ParteEncabezado
    vuelta={vista.vuelta}
    titulo={vista.titulo}
    contexto={vista.contexto}
    patente={vista.patente}
    interno={vista.interno}
    descripcion={vista.descripcion}
    avisoFueraDePlazo={vista.tipo === "edicion" ? vista.avisoFueraDePlazo : null}
    avisoAptitud={vista.tipo === "edicion" ? vista.avisoAptitud : null}
    indicador={textoIndicador}
    {indicadorConError}
    anuncio={anuncioVivo}
  />

  {#if vista.tipo === "cierre"}
    <!-- Lo que ya se envió y no cambia (P7): no es un panel ni un campo. -->
    <div class="resumen-revision">
      <p class="linea-revision">{vista.resumen.linea}</p>
      <Detalles resumen={vista.resumen.verLaRevision}>
        <RevisionLeida revision={vista.resumen.revision} />
      </Detalles>
    </div>
  {/if}

  {#if erroresEnvio !== null && hayResumen}
    <div data-resumen-parte>
      <ResumenErrores bind:this={resumen} titulo={tituloResumen} general={erroresEnvio.general ?? ""} items={itemsResumen} />
    </div>
  {/if}

  <p class="nota">{TEXTO_DIALOGO.obligatorios}{esCierre ? "" : ` ${T.obligatoriosRevision}`}</p>

  <!-- Los cambios llegan por `input` (texto) y `change` (radios, casillas y listas); el foco al salir de un campo guarda ya y actualiza el recorrido. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form class="hoja" novalidate onsubmit={(evento) => evento.preventDefault()} oninput={alCambiar} onchange={alCambiar} onfocusout={alSalirDelCampo} onkeydown={alTeclear}>
    {#if vista.tipo === "edicion"}
      <section class="seccion" aria-labelledby={id("km-titulo")}>
        <h2 id={id("km-titulo")}>{T.secciones.revision.km}</h2>
        {#if vista.conductor.tipo === "elegir"}
          <Campo etiqueta={vista.conductor.etiqueta} tipo="select" grande requerido id={idCampo("conductor")} bind:valor={valores.conductorId} error={errorDe("conductor")}>
            {#each vista.conductor.opciones as o (o.valor)}
              <option value={o.valor}>{o.textoDeOpcion}</option>
            {/each}
          </Campo>
        {/if}
        <Campo etiqueta={T.kmInicio} tipo="km" grande requerido id={idCampo("kmInicio")} bind:valor={valores.kmInicio} ayuda={vista.ayudaKmInicio} error={errorDe("kmInicio")} teclaEnter="next" />
      </section>

      <section class="seccion" aria-labelledby={id("revision-titulo")}>
        <div class="titulo-seccion">
          <h2 id={id("revision-titulo")}>{T.secciones.revision.puntos}</h2>
          <p class="respondidos num">{T.respondidos(respondidos(valores), vista.puntos.length)}</p>
        </div>
        <div class="puntos">
          {#each vista.puntos as p (p.id)}
            <ItemRevision
              texto={p.texto}
              critico={p.critico}
              notaCritica={p.notaCritica}
              etiquetaImpideUso={vista.etiquetaImpideUso}
              idBase={idCampo(p.id)}
              bind:valor={valores.checklist[p.id]}
              error={errorDe(p.id)}
            />
          {/each}
        </div>
      </section>

      <section class="seccion" aria-labelledby={id("otra-titulo")}>
        <h2 id={id("otra-titulo")}>{T.secciones.revision.otra}</h2>
        <Campo etiqueta={vista.etiquetaOtraNovedad} tipo="area" id={idCampo("otraNovedad")} bind:valor={valores.otraNovedad.descripcion} error={errorDe("otraNovedad")} />
        <Casilla etiqueta={vista.etiquetaImpideUso} bind:marcada={valores.otraNovedad.impideUso} ayuda={TEXTO_DIALOGOS_FICHA.cargarNovedad.impideNota} />
      </section>
    {:else}
      <section class="seccion" aria-labelledby={id("km-titulo")}>
        <h2 id={id("km-titulo")}>{T.secciones.cierre.km}</h2>
        <div class="km">
          <!-- «Al iniciar» como texto, junto al campo, desde 30 rem de contenedor: con menos ancho ya está en el resumen de la revisión. -->
          <dl class="inicio-texto">
            <dt>{T.kmInicio}</dt>
            <dd class="num">{vista.kmInicioTexto}</dd>
          </dl>
          <Campo etiqueta={T.kmFin} tipo="km" grande requerido id={idCampo("kmFin")} bind:valor={valores.kmFin} ayuda={vista.ayudaKmFin} error={errorDe("kmFin")} teclaEnter="next" />
        </div>
        <p class="recorrido"><span class="rotulo-recorrido">{T.recorrido}:</span> <output for={idCampo("kmFin")} class="num">{recorrido}</output></p>
      </section>

      <section class="seccion" aria-labelledby={id("combustible-titulo")}>
        <h2 id={id("combustible-titulo")}>{T.secciones.cierre.combustible}</h2>
        <SelectorCombustible leyenda={T.nivelCombustible} requerido opciones={vista.combustible} bind:valor={valores.combustible} id={idCampo("combustible")} error={errorDe("combustible")} />
        <Campo etiqueta={T.litros} tipo="litros" grande id={idCampo("litrosCargados")} bind:valor={valores.litros} ayuda={vista.ayudaLitros} error={errorDe("litrosCargados")} teclaEnter="done" />
      </section>
    {/if}
  </form>

  {#if vista.tipo === "edicion" && vista.parteId !== null}
    <div class="descartar">
      <BotonConfirmar texto={T.descartar} textoConfirmar={T.confirmarDescartar} variante="texto" alConfirmar={descartar} />
    </div>
  {/if}

  <BarraEnvio
    estado={barra.texto}
    lista={barra.lista}
    etiqueta={esCierre ? (mostrarEnviando ? T.cerrando : T.cerrar) : mostrarEnviando ? T.enviando : T.enviar}
    cargando={enviando}
    alActivar={() => enviar()}
  />
</div>

<DialogoAntesDeEnviar bind:abierto={dialogoAbierto} {paso} {advertencias} {enviando} {mostrarEnviando} alAceptarAvisos={() => enviar(aceptables)} focoDestino={focoDelDialogo} />

<style>
  .parte {
    container: parte / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: min(100%, var(--ancho-parte));
    min-width: 0;
    margin-inline: auto;
  }
  @media (max-width: 31.99rem) {
    .parte {
      gap: var(--e-3);
    }
  }

  /* Resumen de la revisión (paso 2): una caja del color de la página, sin sombra ni título de panel (no es un campo ni una ventana: es lo que ya se envió). */
  .resumen-revision {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    padding: var(--e-1) var(--e-3);
    background: var(--c-fondo);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
  }
  .linea-revision {
    font-size: var(--t-chico);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  /* La hoja del formulario: las secciones sobre una superficie, separadas por una línea. */
  .hoja {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-radius: var(--r-3);
    box-shadow: var(--s-ventana);
  }
  .seccion {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
    padding: var(--e-4);
  }
  /* Con poco ancho las secciones se aprietan un poco: la meta de 6.5 pide «Al iniciar» y «Al terminar» por encima de los 600 px a 360 × 780. */
  @media (max-width: 31.99rem) {
    .seccion {
      gap: var(--e-3);
      padding: var(--e-3) var(--e-4);
    }
  }
  .seccion + .seccion {
    border-top: 1px solid var(--c-borde);
  }
  @container parte (min-width: 30rem) {
    .seccion {
      padding: var(--e-5);
    }
  }
  /* Texto agrandado (el parte mide 17 rem o menos): menos relleno a los lados, para que una palabra como «Documentación» entre entera en su renglón (S5 de la etapa 7). */
  @container parte (max-width: 17rem) {
    .seccion {
      padding-inline: var(--e-2);
    }
    .resumen-revision {
      padding-inline: var(--e-2);
    }
  }
  /* 320 px con el texto agrandado (el parte mide 8 rem): otro escalón menos de relleno, para que una palabra de 7 rem entre entera. */
  @container parte (max-width: 8.5rem) {
    .seccion {
      padding-inline: var(--e-1);
    }
  }
  .seccion h2 {
    font-size: var(--t-h3);
    line-height: 1.3;
  }
  .titulo-seccion {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--e-1) var(--e-3);
  }
  .respondidos {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .puntos {
    display: flex;
    flex-direction: column;
    margin-top: calc(-1 * var(--e-2));
  }
  .puntos > :global(.item:last-child) {
    padding-bottom: 0;
    border-bottom: 0;
  }

  /* Paso 2: «Al iniciar» (texto) y «Al terminar» (campo) en dos columnas desde 30 rem de contenedor; con menos, solo el campo. */
  .km {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  /* «Al iniciar» es un texto: su rótulo con el estilo de la etiqueta de un campo (5.11) y su valor con el alto de un campo, para que quede en la misma línea que lo escrito en «Al terminar» (C11). */
  .inicio-texto {
    display: none;
    margin: 0;
  }
  .inicio-texto dt {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto);
  }
  .inicio-texto dd {
    display: flex;
    align-items: center;
    min-height: 3rem;
    margin: 0;
  }
  @container parte (min-width: 30rem) {
    .km {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      /* C6 de la etapa 7: las dos celdas miden lo mismo; el rótulo de «Al iniciar» queda arriba, en la línea del de «Al terminar», y su valor abajo, en la línea del texto del campo
         (el campo tiene una ayuda, y a veces un error, entre su rótulo y su caja; el texto no). */
      align-items: stretch;
    }
    .inicio-texto {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }
  /* Recorrido: el rótulo discreto y el valor firme (con todo en 600 competía con el h2). */
  .rotulo-recorrido {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .recorrido output {
    font-weight: 600;
    color: var(--c-texto);
  }

  .descartar {
    display: flex;
  }
</style>
