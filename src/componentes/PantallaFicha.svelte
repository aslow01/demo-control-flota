<script lang="ts">
  // Ficha de unidad (6.3, `#/unidad/ZK214BD`): 1) qué unidad es y si puede salir (y por qué), 2) documentos, 3) novedades abiertas, 4) historial,
  // y el kilometraje. No tiene reglas de negocio: todo lo que muestra lo arma `app.fichaDeUnidad` (lib/estado/ficha.ts) y los diálogos usan los
  // `contextoDe…` del dominio y un método de `app` por comando.
  //  - Los diálogos de la ficha: Resolver novedad, Cargar novedad, Poner fuera de servicio, Volver a servicio, Dar de baja, Corregir kilometraje,
  //    Cambiar proyecto o conductor y Cargar otro documento (cada uno su componente sobre `DialogoFormulario`), y Renovar / Cargar / Corregir documento
  //    (`DialogoDocumento`). Cada contexto se arma al abrir; si ya no hay nada que abrir (otra pestaña cambió la unidad) la barra de estado lo dice.
  //  - Al guardar bien: el mensaje va a la barra de estado de lo que cambió (Documentos, Novedades, Kilometraje) o, si cambió la unidad entera,
  //    a la región de estado del encabezado; solo hay un mensaje a la vez (la acción siguiente lo reemplaza). El foco va adonde dice `r.foco`
  //    (5.17), que cada diálogo recibe al cerrarse (`focoDestino`): la fila o el botón que abrió el diálogo puede haber cambiado. Al cancelar, vuelve al botón.
  //  - La pantalla se vuelve a crear al llegar a otra ficha (`{#key}` en App.svelte): el filtro del historial, los mensajes y los diálogos arrancan limpios.
  import { flushSync, tick, untrack } from "svelte";
  import { avisoDeAsignacion, contextoDeAsignacion, contextoDeBaja, contextoDeFueraDeServicio, contextoDeKilometraje, contextoDeVolverAServicio } from "../lib/dominio/formulario-ficha.ts";
  import { contextoDeCargarOtro, contextoDeCargar, contextoDeCorregir, contextoDeRenovar, type CampoDocumento, type ValoresDocumento } from "../lib/dominio/formulario-documento.ts";
  import { contextoDeCargarNovedad, contextoDeResolver } from "../lib/dominio/formulario-novedad.ts";
  import type { FocoTrasGuardar, ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import type { AccionDeDocumentoEnFicha, FichaDeUnidad, IdAccionDeFicha, NumeroDeSolapa, SolapaDeFicha } from "../lib/estado/ficha.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { TEXTO_FICHA } from "../lib/dominio/textos.ts";
  import DialogoAsignacion from "./DialogoAsignacion.svelte";
  import DialogoBaja from "./DialogoBaja.svelte";
  import DialogoCargarOtro from "./DialogoCargarOtro.svelte";
  import DialogoDocumento, { type ContextoDeDocumento } from "./DialogoDocumento.svelte";
  import DialogoFueraDeServicio from "./DialogoFueraDeServicio.svelte";
  import DialogoKilometraje from "./DialogoKilometraje.svelte";
  import DialogoNovedad from "./DialogoNovedad.svelte";
  import DialogoResolver from "./DialogoResolver.svelte";
  import DialogoVolver from "./DialogoVolver.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import FichaDocumentos from "./FichaDocumentos.svelte";
  import FichaEncabezado from "./FichaEncabezado.svelte";
  import FichaHistorial from "./FichaHistorial.svelte";
  import FichaKilometraje from "./FichaKilometraje.svelte";
  import FichaNovedades from "./FichaNovedades.svelte";
  import { TEXTO_DIALOGO_DOCUMENTO, TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";

  const f = $derived(app.fichaDeUnidad);

  // Los títulos de los paneles: destino del foco tras guardar y de «Ver novedades».
  const ID = {
    documentos: "titulo-documentos",
    novedades: "titulo-novedades",
    kilometraje: "titulo-kilometraje",
    historial: "titulo-historial",
  } as const;

  // ---------- Solapas (solo en pantallas angostas) ----------
  // Por debajo de 64 rem (cuando el marco no tiene lateral) las secciones se ven de a una, con solapas; desde 64 rem, todas juntas en dos columnas y sin solapas ni roles de pestaña.
  // Es solo presentación: qué solapa se ve no cambia nada de lo que hace la pantalla. Cada solapa muestra un panel: Resumen = Kilometraje, y los otros tres, el suyo.
  // La solapa inicial sale de `ficha.solapaInicial`: la de la causa del bloqueo (documentos o novedades) y, sin causa, Resumen. Se lee UNA vez, al abrir la pantalla (la ficha se vuelve a crear al llegar a otra,
  // `{#key}` en App.svelte): si después se resuelve la causa, la solapa no se mueve sola. Cruzar los 64 rem con la ficha abierta no la cambia (solo se muestra o se esconde el resto).
  const ESCRITORIO = "(min-width: 64rem)";
  const idSolapa = (id: SolapaDeFicha): string => `solapa-${id}`;
  const idSeccion = (id: SolapaDeFicha): string => `seccion-${id}`;
  let angosto = $state(typeof matchMedia === "function" ? !matchMedia(ESCRITORIO).matches : false);
  let solapa = $state<SolapaDeFicha>(untrack(() => (f !== null && f.encontrada ? f.solapaInicial : "resumen")));
  $effect(() => {
    if (typeof matchMedia !== "function") return;
    const consulta = matchMedia(ESCRITORIO);
    const alCambiar = (): void => {
      angosto = !consulta.matches;
    };
    alCambiar();
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  });

  /** Muestra una solapa ya, en el DOM: el foco no puede ir a un título que está en una solapa oculta (`display: none`). */
  function mostrarSolapa(id: SolapaDeFicha): void {
    if (solapa === id) return;
    solapa = id;
    flushSync();
  }
  function alTeclearSolapa(evento: KeyboardEvent, ficha: FichaDeUnidad, indice: number): void {
    const n = ficha.solapas.length;
    const teclas: Record<string, number> = { ArrowRight: (indice + 1) % n, ArrowLeft: (indice - 1 + n) % n, Home: 0, End: n - 1 };
    const destino = teclas[evento.key];
    const siguiente = destino === undefined ? undefined : ficha.solapas[destino];
    if (siguiente === undefined) return;
    evento.preventDefault();
    mostrarSolapa(siguiente.id);
    document.getElementById(idSolapa(siguiente.id))?.focus();
  }
  /** El número de la solapa para lectores de pantalla («, 2 vencidos o faltantes»); sin nada que contar, vacío. */
  function insignia(ficha: FichaDeUnidad, s: NumeroDeSolapa): string {
    if (s.cantidad <= 0) return "";
    if (s.id === "documentos") return TEXTO_FICHA.insigniaSolapa.documentos(s.cantidad);
    if (s.id === "novedades") return TEXTO_FICHA.insigniaSolapa.novedades(s.cantidad, ficha.novedades.abiertas.filter((n) => n.gravedad === "critica").length);
    return "";
  }

  // ---------- Mensaje de lo último que se hizo (uno solo, en el lugar que cambió) ----------
  type Lugar = "titulo-de-la-ficha" | "titulo-de-documentos" | "titulo-de-novedades" | "titulo-de-kilometraje";
  /** La solapa donde vive el panel de cada lugar (el encabezado está siempre a la vista). */
  const SOLAPA_DEL_LUGAR: Record<Lugar, SolapaDeFicha | null> = {
    "titulo-de-la-ficha": null,
    "titulo-de-documentos": "documentos",
    "titulo-de-novedades": "novedades",
    "titulo-de-kilometraje": "resumen",
  };
  function mostrarLugar(lugar: Lugar): void {
    const s = SOLAPA_DEL_LUGAR[lugar];
    if (s !== null) mostrarSolapa(s);
  }
  let mensaje = $state<{ lugar: Lugar; texto: string } | null>(
    app.mensajeDeLlegada === null ? null : { lugar: "titulo-de-la-ficha", texto: app.mensajeDeLlegada },
  );
  const textoDe = (lugar: Lugar): string => (mensaje?.lugar === lugar ? mensaje.texto : "");
  function lugarDe(foco: FocoTrasGuardar): Lugar {
    return foco === "titulo-del-panel" ? "titulo-de-la-ficha" : foco;
  }

  // ---------- Foco al cerrar un diálogo ----------
  // Cada diálogo, al cerrarse, pregunta a dónde va el foco y recibe el resultado del guardado (`null` si se cerró sin guardar: vuelve al botón que lo abrió).
  function focoDestino(r: { foco: FocoTrasGuardar } | null): HTMLElement | null {
    if (r === null) return null;
    const lugar = lugarDe(r.foco);
    mostrarLugar(lugar);
    switch (lugar) {
      case "titulo-de-documentos":
        return document.getElementById(ID.documentos);
      case "titulo-de-novedades":
        return document.getElementById(ID.novedades);
      case "titulo-de-kilometraje":
        return document.getElementById(ID.kilometraje);
      default:
        return document.querySelector<HTMLElement>("main h1");
    }
  }
  function guardado(r: { mensaje: string; foco: FocoTrasGuardar }): void {
    const lugar = lugarDe(r.foco);
    mostrarLugar(lugar);
    mensaje = { lugar, texto: r.mensaje };
  }
  function yaCambio(lugar: Lugar, texto: string): void {
    mostrarLugar(lugar);
    mensaje = { lugar, texto };
  }

  // ---------- Diálogos ----------
  const abierto = $state({
    resolver: false,
    novedad: false,
    fuera: false,
    volver: false,
    baja: false,
    kilometraje: false,
    asignacion: false,
    cargarOtro: false,
    documento: false,
  });
  let cResolver = $state.raw<ReturnType<typeof contextoDeResolver>>(null);
  let cNovedad = $state.raw<ReturnType<typeof contextoDeCargarNovedad>>(null);
  let cFuera = $state.raw<ReturnType<typeof contextoDeFueraDeServicio>>(null);
  let cVolver = $state.raw<ReturnType<typeof contextoDeVolverAServicio>>(null);
  let cBaja = $state.raw<ReturnType<typeof contextoDeBaja>>(null);
  let cKilometraje = $state.raw<ReturnType<typeof contextoDeKilometraje>>(null);
  let cAsignacion = $state.raw<ReturnType<typeof contextoDeAsignacion>>(null);
  let cCargarOtro = $state.raw<ReturnType<typeof contextoDeCargarOtro>>(null);
  let cDocumento = $state.raw<ContextoDeDocumento | null>(null);
  let guardarDocumento = $state.raw<(valores: ValoresDocumento) => Promise<ResultadoGuardado<CampoDocumento>>>(() =>
    Promise.resolve({ ok: true, mensaje: "", foco: "titulo-de-documentos" }),
  );

  function unidadId(): string {
    return f !== null && f.encontrada ? f.unidadId : "";
  }

  function abrirDeEncabezado(id: IdAccionDeFicha): void {
    const estado = app.estado;
    if (estado === null) return;
    const u = unidadId();
    switch (id) {
      case "poner-fuera-de-servicio":
        cFuera = contextoDeFueraDeServicio(estado, u, app.hoy);
        if (cFuera !== null) abierto.fuera = true;
        else yaCambio("titulo-de-la-ficha", T.yaCambio);
        return;
      case "volver-a-servicio":
        cVolver = contextoDeVolverAServicio(estado, u, app.hoy);
        if (cVolver !== null) abierto.volver = true;
        else yaCambio("titulo-de-la-ficha", T.yaCambio);
        return;
      case "dar-de-baja":
        cBaja = contextoDeBaja(estado, u);
        if (cBaja !== null) abierto.baja = true;
        else yaCambio("titulo-de-la-ficha", T.yaCambio);
        return;
      case "corregir-kilometraje":
        cKilometraje = contextoDeKilometraje(estado, u, app.hoy);
        if (cKilometraje !== null) abierto.kilometraje = true;
        else yaCambio("titulo-de-kilometraje", T.yaCambio);
        return;
      case "cambiar-asignacion":
        cAsignacion = contextoDeAsignacion(estado, u);
        if (cAsignacion !== null) abierto.asignacion = true;
        else yaCambio("titulo-de-la-ficha", T.yaCambio);
        return;
      case "cargar-novedad":
        abrirCargarNovedad();
        return;
      case "cargar-parte":
        return; // es un enlace (EnlaceAccion): no pasa por acá
    }
  }

  function abrirCargarNovedad(): void {
    const estado = app.estado;
    if (estado === null) return;
    cNovedad = contextoDeCargarNovedad(estado, unidadId());
    if (cNovedad !== null) abierto.novedad = true;
    else yaCambio("titulo-de-novedades", T.yaCambio);
  }

  function abrirResolver(novedadId: string): void {
    const estado = app.estado;
    if (estado === null) return;
    cResolver = contextoDeResolver(estado, novedadId, app.hoy);
    if (cResolver !== null) abierto.resolver = true;
    else yaCambio("titulo-de-novedades", T.novedades.yaResuelta);
  }

  function abrirCargarOtro(): void {
    const estado = app.estado;
    if (estado === null) return;
    cCargarOtro = contextoDeCargarOtro(estado, unidadId());
    if (cCargarOtro !== null) abierto.cargarOtro = true;
    else yaCambio("titulo-de-documentos", T.documentos.yaNoDisponible);
  }

  function abrirDocumento(accion: AccionDeDocumentoEnFicha): void {
    const estado = app.estado;
    if (estado === null) return;
    const documentoId = accion.documentoId;
    if (accion.tipo === "renovar" && documentoId !== null) {
      const ctx = contextoDeRenovar(estado, documentoId, app.hoy);
      if (ctx === null) return yaCambio("titulo-de-documentos", T.documentos.yaNoDisponible);
      cDocumento = { titulo: ctx.titulo, contexto: ctx.contexto, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      guardarDocumento = (valores) => app.renovarDocumento(documentoId, valores, "ficha");
    } else if (accion.tipo === "corregir" && documentoId !== null) {
      const ctx = contextoDeCorregir(estado, documentoId);
      if (ctx === null) return yaCambio("titulo-de-documentos", T.documentos.yaNoDisponible);
      cDocumento = { titulo: ctx.titulo, contexto: ctx.nota, ayudaEmisor: TEXTO_DIALOGO_DOCUMENTO.ayudaOpcional, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      guardarDocumento = (valores) => app.corregirDocumento(documentoId, valores);
    } else {
      const titular = { tipo: "unidad", id: unidadId() } as const;
      const ctx = contextoDeCargar(estado, titular, accion.tipoDocumento);
      if (ctx === null) return yaCambio("titulo-de-documentos", T.documentos.yaNoDisponible);
      cDocumento = { titulo: ctx.titulo, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      guardarDocumento = (valores) => app.cargarDocumento(titular, accion.tipoDocumento, valores, "ficha");
    }
    abierto.documento = true;
  }
  /** «Ver novedades» de «Volver a servicio»: el diálogo se cierra con el foco en el título de Novedades (`focoDestino`) y la vista baja hasta ahí. */
  function verNovedades(): void {
    mostrarSolapa("novedades");
    void tick().then(() => document.getElementById(ID.novedades)?.scrollIntoView({ block: "start" }));
  }
</script>

{#if f !== null}
  {#if f.encontrada}
    <div class="pantalla">
      <FichaEncabezado ficha={f} mensaje={textoDe("titulo-de-la-ficha")} repetir={mensaje} alAccion={abrirDeEncabezado} />

      <div class="cuerpo">
        {#if angosto}
          <!-- Solapas (celular y tableta): un solo punto de tabulación; flechas, Inicio y Fin recorren y eligen. Se nombran con el `h1` (la patente). -->
          <div class="solapas" role="tablist" aria-labelledby="titulo-de-la-unidad">
            {#each f.solapas as s, i (s.id)}
              {@const nombreInsignia = insignia(f, s)}
              <button
                type="button"
                class="solapa"
                id={idSolapa(s.id)}
                role="tab"
                aria-selected={solapa === s.id}
                aria-controls={idSeccion(s.id)}
                tabindex={solapa === s.id ? 0 : -1}
                onclick={() => mostrarSolapa(s.id)}
                onkeydown={(e) => alTeclearSolapa(e, f, i)}
              >
                {TEXTO_FICHA.solapas[s.id]}
                {#if s.cantidad > 0}<span class="n" class:critica={s.critica} aria-hidden="true">{s.cantidad}</span>{/if}
                {#if nombreInsignia !== ""}<span class="solo-lectores">, {nombreInsignia}</span>{/if}
              </button>
            {/each}
          </div>
        {/if}

        <div class="paneles" class:con-solapas={angosto}>
          <div
            class="area area-documentos"
            id={idSeccion("documentos")}
            role={angosto ? "tabpanel" : undefined}
            aria-labelledby={angosto ? idSolapa("documentos") : undefined}
            hidden={angosto && solapa !== "documentos"}
          >
            <FichaDocumentos
              documentos={f.documentos}
              idTitulo={ID.documentos}
              estado={textoDe("titulo-de-documentos")}
              repetir={mensaje}
              alAccion={abrirDocumento}
              alCargarOtro={abrirCargarOtro}
            />
          </div>
          <div
            class="area area-novedades"
            id={idSeccion("novedades")}
            role={angosto ? "tabpanel" : undefined}
            aria-labelledby={angosto ? idSolapa("novedades") : undefined}
            hidden={angosto && solapa !== "novedades"}
          >
            <FichaNovedades
              novedades={f.novedades}
              idTitulo={ID.novedades}
              estado={textoDe("titulo-de-novedades")}
              repetir={mensaje}
              alResolver={abrirResolver}
              alCargar={abrirCargarNovedad}
            />
          </div>
          <div
            class="area area-kilometraje"
            id={idSeccion("resumen")}
            role={angosto ? "tabpanel" : undefined}
            aria-labelledby={angosto ? idSolapa("resumen") : undefined}
            hidden={angosto && solapa !== "resumen"}
          >
            <FichaKilometraje
              kilometraje={f.kilometraje}
              idTitulo={ID.kilometraje}
              estado={textoDe("titulo-de-kilometraje")}
              repetir={mensaje}
              alCorregir={() => abrirDeEncabezado("corregir-kilometraje")}
            />
          </div>
          <div
            class="area area-historial"
            id={idSeccion("historial")}
            role={angosto ? "tabpanel" : undefined}
            aria-labelledby={angosto ? idSolapa("historial") : undefined}
            hidden={angosto && solapa !== "historial"}
          >
            <FichaHistorial historial={f.historial} idTitulo={ID.historial} />
          </div>
        </div>
      </div>
    </div>

    <DialogoResolver
      bind:abierto={abierto.resolver}
      contexto={cResolver}
      guardar={(valores) => app.resolverNovedad(cResolver?.novedadId ?? "", valores, "ficha")}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoNovedad
      bind:abierto={abierto.novedad}
      contexto={cNovedad}
      guardar={(valores) => app.cargarNovedad(unidadId(), valores)}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoFueraDeServicio
      bind:abierto={abierto.fuera}
      contexto={cFuera}
      guardar={(valores) => app.ponerFueraDeServicio(unidadId(), valores)}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoVolver
      bind:abierto={abierto.volver}
      contexto={cVolver}
      guardar={() => app.volverAServicio(unidadId())}
      alGuardar={guardado}
      alVerNovedades={verNovedades}
      {focoDestino}
    />
    <DialogoBaja bind:abierto={abierto.baja} contexto={cBaja} guardar={(valores) => app.darDeBaja(unidadId(), valores)} alGuardar={guardado} {focoDestino} />
    <DialogoKilometraje
      bind:abierto={abierto.kilometraje}
      contexto={cKilometraje}
      guardar={(valores) => app.corregirKilometraje(unidadId(), valores)}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoAsignacion
      bind:abierto={abierto.asignacion}
      contexto={cAsignacion}
      aviso={(valores) => (app.estado === null ? null : avisoDeAsignacion(app.estado, unidadId(), valores))}
      guardar={(valores) => app.cambiarAsignacion(unidadId(), valores)}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoCargarOtro
      bind:abierto={abierto.cargarOtro}
      contexto={cCargarOtro}
      guardar={(valores) => app.cargarOtroDocumento(unidadId(), valores)}
      alGuardar={guardado}
      {focoDestino}
    />
    <DialogoDocumento bind:abierto={abierto.documento} contexto={cDocumento} guardar={guardarDocumento} alGuardar={guardado} {focoDestino} />
  {:else}
    <!-- La patente no existe: h1, el motivo y el camino de vuelta (8: Error). -->
    <div class="pantalla">
      <div class="no-encontrada">
        <h1 tabindex="-1">{f.titulo}</h1>
        <p class="parrafo">{f.mensaje}</p>
        <div><EnlaceAccion href={f.enlace.href}>{f.enlace.texto}</EnlaceAccion></div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    width: 100%;
    min-width: 0;
  }
  .no-encontrada {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-3);
  }

  .cuerpo {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* ---------- Solapas (celular y tableta) ----------
     Pestañas de archivo: la elegida es del color de la hoja, lleva una barra de tinta arriba y el corte en diagonal a la derecha. La fila se desplaza sola si no entran todas
     (con el texto agrandado); no desplaza la página. Los 3 px de la barra y el borde de 1 px de la hoja se solapan con `margin-bottom: -1px`. */
  .solapas {
    --corte: 0.5rem;
    position: relative;
    z-index: 1;
    display: flex;
    gap: 2px;
    margin: 0 -2px -1px;
    padding: 4px 2px 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .solapa {
    position: relative;
    isolation: isolate;
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: var(--alto-tactil);
    padding: 0 calc(0.125rem + var(--corte)) 0 0.5rem;
    border: 0;
    background: none;
    color: var(--c-texto-2);
    font-family: var(--t-familia-titulo);
    font-stretch: 75%;
    font-size: 0.90625rem;
    font-weight: 650;
    cursor: pointer;
  }
  .solapa::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--c-superficie-2);
    border-radius: var(--r-2) 0 0 0;
    clip-path: polygon(0 0, calc(100% - var(--corte)) 0, 100% 100%, 0 100%);
  }
  @media (hover: hover) {
    .solapa:hover {
      color: var(--c-texto);
    }
    .solapa:hover::before {
      background: color-mix(in srgb, var(--c-superficie-2) 70%, var(--c-borde-fuerte));
    }
  }
  .solapa[aria-selected="true"] {
    color: var(--c-texto);
  }
  .solapa[aria-selected="true"]::before {
    background: var(--c-superficie);
    box-shadow: inset 1px 1px 0 var(--c-borde);
  }
  .solapa[aria-selected="true"]::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0.5rem;
    right: calc(var(--corte) + 0.5rem);
    height: 3px;
    background: var(--c-tinta);
  }
  .solapa:focus-visible {
    outline-offset: -3px;
  }
  /* El número: cuántos documentos vencidos o faltantes y cuántas novedades abiertas (el lector de pantalla lo dice con palabras). */
  .n {
    display: inline-grid;
    place-items: center;
    min-width: 1.375rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    border-radius: var(--r-pildora);
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .solapa[aria-selected="true"] .n {
    background: var(--c-texto-2);
    color: var(--c-superficie);
  }
  .n.critica,
  .solapa[aria-selected="true"] .n.critica {
    background: var(--c-critico-solido);
    color: var(--c-sobre-solido);
  }
  @media (forced-colors: active) {
    .solapa[aria-selected="true"]::after {
      background: Highlight;
    }
    .n {
      border: 1px solid CanvasText;
    }
  }

  /* La hoja de debajo de las solapas pierde la esquina de arriba a la izquierda (las solapas nacen ahí). */
  .paneles.con-solapas :global(.panel) {
    border-top-left-radius: 0;
  }

  /* Celular y tableta: una columna, un panel a la vez (el de la solapa elegida). El orden del DOM es el de Tab: en escritorio Kilometraje se ve a la derecha, bajo Novedades, y viene
     antes que el historial (que puede tener decenas de eventos). Escritorio (desde 64 rem, cuando el marco tiene lateral): documentos a la izquierda, novedades y kilometraje en una columna
     a la derecha y el historial a todo el ancho. */
  .paneles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "documentos"
      "novedades"
      "kilometraje"
      "historial";
    gap: var(--e-4);
  }
  .area {
    min-width: 0;
  }
  .area-documentos {
    grid-area: documentos;
  }
  .area-novedades {
    grid-area: novedades;
  }
  .area-historial {
    grid-area: historial;
  }
  .area-kilometraje {
    grid-area: kilometraje;
  }
  @media (min-width: 64rem) {
    .paneles {
      /* La columna de la derecha mide entre 18 y 22 rem (la tabla de kilometraje necesita más de 17); documentos toma el resto. */
      grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
      /* Documentos ocupa dos filas: lo que sobre de su altura va a la segunda, no entre Novedades y Kilometraje. */
      grid-template-rows: auto 1fr;
      grid-template-areas:
        "documentos novedades"
        "documentos kilometraje"
        "historial historial";
      /* Cada panel mide lo que tiene: documentos ya no se estira hasta el fondo de la columna de al lado (quedaba un hueco con borde). */
      align-items: start;
    }
  }
</style>
