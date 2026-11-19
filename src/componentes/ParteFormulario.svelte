<script lang="ts">
  // Parte diario para completar (6.5, edición): jerarquía 1) de qué unidad y qué día es, 2) lo que falta, 3) enviar. Una columna de 40 rem; el kilometraje en dos columnas
  // cuando entra. No tiene reglas de negocio: los valores son texto (`dominio/formulario-parte.ts`), el borrador se guarda solo (`app.autoguardadoDeParte`, P3) y «Enviar parte»
  // lo decide `app.enviarParte`.
  //  - Autoguardado: cada tecla (`input`) y cada cambio de un radio o un `select` (`change`) lo programan 500 ms después; al salir de un campo guarda ya. El texto escrito nunca
  //    se pisa: la vista nueva (`valoresIniciales`) solo se lee al arrancar y después de «Descartar borrador». Antes de enviar, de descartar o de irse, se guarda lo pendiente.
  //  - El indicador de guardado es texto visible; el `role="status"` oculto dice SOLO el texto de `indicador.anuncio`, que cambia al cambiar de estado (no en cada guardado).
  //  - «Enviar parte» nunca se deshabilita (5.14): con datos que faltan abre el resumen de errores arriba, con el foco; con avisos (K6, K7, P9), el diálogo «Antes de enviar»;
  //    si sale, avisa a la pantalla (`alEnviado`) y esta pasa a «Parte enviado». El error de un campo se queda mientras el campo tenga lo mismo que al enviar (no desaparece solo
  //    con el tiempo); al tocarlo, su mensaje y su renglón del resumen se van, y el resumen cambia su título al nuevo conteo.
  //  - Los errores de formato de un campo (km con letras…) llegan al salir del campo y bloquean el guardado hasta corregirlos (indicador «Sin guardar: corrija…»).
  //  - Barra de envío: pegada abajo con poco ancho (5.14); `html` reserva `scroll-padding-bottom` para que no tape el campo con foco (WCAG 2.4.11). Con la pantalla muy baja
  //    (menos de 30 rem de alto: zoom 400 %, teléfono apaisado) no se pega: queda al final del formulario.
  import { onDestroy, tick, untrack } from "svelte";
  import { errorGeneralParte, recorridoDe, respondidos, textoBarraDeEnvio, validarParaEnviar, type CampoParte, type ErroresDeParte, type ValoresParte } from "../lib/dominio/formulario-parte.ts";
  import { ERRORES, TEXTO_DIALOGOS_FICHA, TEXTO_FORMULARIO_PARTE } from "../lib/dominio/textos.ts";
  import type { Advertencia, ItemChecklist } from "../lib/dominio/tipos.ts";
  import type { AdvertenciaDeEnvio, ResultadoDeEnvio } from "../lib/estado/app.svelte.ts";
  import type { IndicadorDeGuardado } from "../lib/estado/autoguardado.ts";
  import { guardarConIndicador } from "../lib/estado/guardado.ts";
  import { app } from "../lib/estado/instancia.ts";
  import type { ParteEnEdicion, PanelParteEnviado } from "../lib/estado/parte.ts";
  import Aviso from "./Aviso.svelte";
  import Boton from "./Boton.svelte";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
  import DialogoAntesDeEnviar from "./DialogoAntesDeEnviar.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import ItemRevision from "./ItemRevision.svelte";
  import Patente from "./Patente.svelte";
  import ResumenErrores from "./ResumenErrores.svelte";
  import SelectorCombustible from "./SelectorCombustible.svelte";
  import { TEXTO_DIALOGO, TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  let { vista, alEnviado }: { vista: ParteEnEdicion; alEnviado: (panel: PanelParteEnviado) => void } = $props();

  const uid = $props.id();
  const id = (nombre: string): string => `${uid}-${nombre}`;
  const idCampo = (campo: CampoParte): string => id(campo);

  // Con lo que arrancó el formulario: no se vuelve a leer (pisaría lo que se está escribiendo), salvo al descartar el borrador.
  const arranque = untrack(() => vista);
  let valores = $state<ValoresParte>(structuredClone(arranque.valoresIniciales));
  let indicador = $state<IndicadorDeGuardado>({ estado: "inicial", visible: "", anuncio: "", hora: null });
  let descartado = $state("");
  const auto = app.autoguardadoDeParte(arranque, (i) => {
    indicador = i;
    if (i.estado !== "inicial") descartado = "";
  });

  // «Recorrido» se actualiza al salir de cada campo (5.11): es un `output`, que se lee solo, y no hay que dictarlo en cada tecla.
  let recorrido = $state(untrack(() => recorridoDe(valores.kmInicio, valores.kmFin)));

  // Errores: los del último «Enviar parte» (resumen y campos, hasta el próximo envío) y los de formato que dijo el autoguardado al salir de un campo.
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
  const itemsResumen = $derived(listaVigente.map((x) => ({ campoId: idDelError(x.campo), mensaje: x.mensaje })));
  const tituloResumen = $derived(
    erroresEnvio === null ? "" : listaVigente.length === erroresEnvio.lista.length ? erroresEnvio.titulo : TEXTO_FORMULARIO_PARTE.tituloRevise(listaVigente.length),
  );
  const hayResumen = $derived(erroresEnvio !== null && (listaVigente.length > 0 || erroresEnvio.general !== null));

  const pendientes = $derived(validarParaEnviar(valores)?.lista.length ?? 0);
  const textoIndicador = $derived(
    descartado !== "" && indicador.estado === "inicial" ? descartado : indicador.visible !== "" ? indicador.visible : (vista.borrador?.mensaje ?? ""),
  );
  const anuncioVivo = $derived(descartado !== "" ? descartado : indicador.anuncio);
  const indicadorConError = $derived(indicador.estado === "error" || indicador.estado === "campos");

  // ---------- Autoguardado ----------
  function alCambiar(): void {
    auto.cambio(instantanea());
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
  // Al irse de la pantalla se guarda lo pendiente; un parte que ya salió no se toca (al enviar, la vista pasa a «lectura» antes de que este componente se entere).
  const yaEnviado = (): boolean => app.estado?.partes.some((p) => p.unidadId === arranque.unidadId && p.fecha === arranque.fecha && p.estado === "enviado") === true;
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
        return app.enviarParte(arranque.unidadId, arranque.fecha, copia, aceptadas);
      },
      {
        alTardar: () => (mostrarEnviando = true),
        alTerminar: () => {
          enviando = false;
          mostrarEnviando = false;
        },
        alFallar: () => ({ tipo: "errores", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte), foco: "resumen-de-errores", primerCampo: null }),
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

  // ---------- Descartar el borrador ----------
  async function descartar(): Promise<void> {
    const parteId = vista.parteId;
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

  function etiquetaConductor(o: { etiqueta: string; asignadoA: string | null }): string {
    return o.asignadoA === null ? o.etiqueta : T.opcionConductor(o.etiqueta, o.asignadoA);
  }
</script>

<svelte:document onvisibilitychange={alOcultarse} />

<div class="parte">
  <a class="vuelta" href={vista.vuelta.href}><Icono nombre="flecha-izq" />{vista.vuelta.texto}</a>

  <header class="encabezado">
    <div class="solo-angosto"><EtiquetaDemo /></div>
    <h1 tabindex="-1">{vista.titulo}</h1>
    <p class="identidad">
      <Patente patente={vista.patente} tamano="grande" />
      <span class="interno">{vista.interno}</span>
    </p>
    <p class="descripcion">{vista.descripcion}</p>
    {#if vista.conductor.tipo === "fijo"}
      <p class="conductor">{T.conductorLinea(vista.conductor.nombre)}</p>
    {/if}
    {#if vista.avisoFueraDeTermino !== null}
      <Aviso tono="semana" icono="calendario">{vista.avisoFueraDeTermino}</Aviso>
    {/if}
    {#if vista.avisoAptitud !== null}
      <Aviso tono="critico" icono="vencido"><span class="largo">{vista.avisoAptitud}</span></Aviso>
    {/if}
    {#if textoIndicador !== ""}
      <p class="indicador" class:con-error={indicadorConError}><Icono nombre={indicadorConError ? "vencido" : "guardado"} /><span>{textoIndicador}</span></p>
    {/if}
    <!-- Lo que se dice al lector de pantalla: solo cambia cuando cambia de estado, no en cada guardado. -->
    <div class="solo-lectores" role="status">{anuncioVivo}</div>
  </header>

  {#if erroresEnvio !== null && hayResumen}
    <div data-resumen-parte>
      <ResumenErrores bind:this={resumen} titulo={tituloResumen} general={erroresEnvio.general ?? ""} items={itemsResumen} />
    </div>
  {/if}

  <p class="nota">{TEXTO_DIALOGO.obligatorios} {T.obligatoriosRevision}</p>

  <!-- Los cambios llegan por `input` (texto) y `change` (radios, casillas y listas); el foco al salir de un campo guarda ya y actualiza el recorrido. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form class="hoja" novalidate onsubmit={(evento) => evento.preventDefault()} oninput={alCambiar} onchange={alCambiar} onfocusout={alSalirDelCampo}>
    <section class="seccion" aria-labelledby={id("km-titulo")}>
      <h2 id={id("km-titulo")}>{T.secciones.km}</h2>
      {#if vista.conductor.tipo === "elegir"}
        <Campo etiqueta={vista.conductor.etiqueta} tipo="select" grande requerido id={idCampo("conductor")} bind:valor={valores.conductorId} error={errorDe("conductor")}>
          {#each vista.conductor.opciones as o (o.valor)}
            <option value={o.valor}>{etiquetaConductor(o)}</option>
          {/each}
        </Campo>
      {/if}
      <div class="km">
        <Campo etiqueta={T.kmInicio} tipo="km" grande requerido id={idCampo("kmInicio")} bind:valor={valores.kmInicio} ayuda={vista.ayudaKmInicio} error={errorDe("kmInicio")} />
        <Campo etiqueta={T.kmFin} tipo="km" grande requerido id={idCampo("kmFin")} bind:valor={valores.kmFin} ayuda={vista.ayudaKmFin} error={errorDe("kmFin")} />
      </div>
      <p class="recorrido">{T.recorrido}: <output for={`${idCampo("kmInicio")} ${idCampo("kmFin")}`} class="num">{recorrido}</output></p>
    </section>

    <section class="seccion" aria-labelledby={id("revision-titulo")}>
      <div class="titulo-seccion">
        <h2 id={id("revision-titulo")}>{T.secciones.revision}</h2>
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

    <section class="seccion" aria-labelledby={id("combustible-titulo")}>
      <h2 id={id("combustible-titulo")}>{T.secciones.combustible}</h2>
      <SelectorCombustible leyenda={T.nivelCombustible} opciones={vista.combustible} bind:valor={valores.combustible} id={idCampo("combustible")} error={errorDe("combustible")} />
      <Campo etiqueta={T.litros} tipo="litros" grande id={idCampo("litrosCargados")} bind:valor={valores.litros} ayuda={vista.ayudaLitros} error={errorDe("litrosCargados")} />
    </section>

    <section class="seccion" aria-labelledby={id("otra-titulo")}>
      <h2 id={id("otra-titulo")}>{T.secciones.otra}</h2>
      <Campo etiqueta={vista.etiquetaOtraNovedad} tipo="area" id={idCampo("otraNovedad")} bind:valor={valores.otraNovedad.descripcion} error={errorDe("otraNovedad")} />
      <Casilla etiqueta={vista.etiquetaImpideUso} bind:marcada={valores.otraNovedad.impideUso} ayuda={TEXTO_DIALOGOS_FICHA.cargarNovedad.impideNota} />
    </section>
  </form>

  {#if vista.parteId !== null}
    <div class="descartar">
      <BotonConfirmar texto={T.descartar} textoConfirmar={T.confirmarDescartar} alConfirmar={descartar} />
    </div>
  {/if}

  <div class="barra-envio">
    <p class="estado-barra" class:lista={pendientes === 0}>
      {#if pendientes === 0}<Icono nombre="check" />{/if}<span>{textoBarraDeEnvio(valores)}</span>
    </p>
    <Boton tamano="grande" cargando={enviando} onclick={() => enviar()}>{mostrarEnviando ? T.enviando : T.enviar}</Boton>
  </div>
</div>

<DialogoAntesDeEnviar bind:abierto={dialogoAbierto} {advertencias} {enviando} {mostrarEnviando} alEnviarIgual={() => enviar(aceptables)} focoDestino={focoDelDialogo} />

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
  .vuelta {
    --icono-tam: 1.125rem;
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    font-weight: 600;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    min-width: 0;
  }
  .encabezado > :global(.aviso) {
    align-self: stretch;
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }
  .identidad {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  .interno {
    font-weight: 600;
  }
  .descripcion,
  .conductor,
  .largo {
    overflow-wrap: anywhere;
  }
  .indicador {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .indicador :global(.icono) {
    flex: none;
    margin-top: 0.1rem;
  }
  .indicador.con-error {
    font-weight: 600;
    color: var(--c-critico-t);
  }

  /* La hoja del formulario: las cuatro secciones sobre una superficie, separadas por una línea. */
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
  .seccion + .seccion {
    border-top: 1px solid var(--c-borde);
  }
  @container parte (min-width: 30rem) {
    .seccion {
      padding: var(--e-5);
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
  .km {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  @container parte (min-width: 30rem) {
    .km {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      /* Las ayudas tienen largos distintos: los dos campos quedan a la misma altura. */
      align-items: end;
    }
  }
  .recorrido {
    font-weight: 600;
  }
  .recorrido output {
    font-weight: 600;
  }

  .descartar {
    display: flex;
  }

  /* Barra de envío (5.14): con poco ancho, pegada abajo y a lo ancho de la pantalla; desde 40 rem, estática al final del formulario. */
  .barra-envio {
    position: sticky;
    bottom: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-3);
    min-height: var(--alto-barra-envio);
    margin-inline: calc(-1 * var(--gutter));
    padding: var(--e-3) var(--gutter);
    padding-bottom: calc(var(--e-3) + env(safe-area-inset-bottom, 0px));
    background: var(--c-ventana-barra);
    border-top: 1px solid var(--c-borde);
    box-shadow: var(--s-flotante);
  }
  .estado-barra {
    --icono-tam: 1.125rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.3;
    color: var(--c-texto-2);
  }
  .estado-barra.lista {
    color: var(--c-vigente-t);
  }
  @media (min-width: 40rem) {
    .barra-envio {
      position: static;
      min-height: 0;
      margin-inline: 0;
      padding: var(--e-3) 0 0;
      background: none;
      border-top: 0;
      box-shadow: none;
    }
  }
  /* Pantalla muy baja (zoom 400 %, teléfono apaisado): la barra no se queda pegada. Ocuparía casi la mitad de la pantalla y taparía el campo con foco. */
  @media (max-height: 30rem) {
    .barra-envio {
      position: static;
    }
  }
  /* El campo con foco no queda tapado por la barra pegada (2.4.11). */
  @media (max-width: 39.99rem) and (min-height: 30.01rem) {
    :global(html:has(.barra-envio)) {
      scroll-padding-bottom: calc(var(--alto-barra-envio) + var(--e-4));
    }
  }
</style>
