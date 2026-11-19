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
  import { tick } from "svelte";
  import { avisoDeAsignacion, contextoDeAsignacion, contextoDeBaja, contextoDeFueraDeServicio, contextoDeKilometraje, contextoDeVolverAServicio } from "../lib/dominio/formulario-ficha.ts";
  import { contextoDeCargarOtro, contextoDeCargar, contextoDeCorregir, contextoDeRenovar, type CampoDocumento, type ValoresDocumento } from "../lib/dominio/formulario-documento.ts";
  import { contextoDeCargarNovedad, contextoDeResolver } from "../lib/dominio/formulario-novedad.ts";
  import type { FocoTrasGuardar, ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import type { AccionDeDocumentoEnFicha, IdAccionDeFicha } from "../lib/estado/ficha.ts";
  import { app } from "../lib/estado/instancia.ts";
  import DialogoAsignacion from "./DialogoAsignacion.svelte";
  import DialogoBaja from "./DialogoBaja.svelte";
  import DialogoCargarOtro from "./DialogoCargarOtro.svelte";
  import DialogoDocumento, { type ContextoDeDocumento } from "./DialogoDocumento.svelte";
  import DialogoFueraDeServicio from "./DialogoFueraDeServicio.svelte";
  import DialogoKilometraje from "./DialogoKilometraje.svelte";
  import DialogoNovedad from "./DialogoNovedad.svelte";
  import DialogoResolver from "./DialogoResolver.svelte";
  import DialogoVolver from "./DialogoVolver.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
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

  // ---------- Mensaje de lo último que se hizo (uno solo, en el lugar que cambió) ----------
  type Lugar = "titulo-de-la-ficha" | "titulo-de-documentos" | "titulo-de-novedades" | "titulo-de-kilometraje";
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
    switch (lugarDe(r.foco)) {
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
    mensaje = { lugar: lugarDe(r.foco), texto: r.mensaje };
  }
  function yaCambio(lugar: Lugar, texto: string): void {
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
    void tick().then(() => document.getElementById(ID.novedades)?.scrollIntoView({ block: "start" }));
  }
</script>

{#if f !== null}
  {#if f.encontrada}
    <div class="pantalla">
      <FichaEncabezado ficha={f} mensaje={textoDe("titulo-de-la-ficha")} repetir={mensaje} alAccion={abrirDeEncabezado} />

      <div class="paneles">
        <div class="area area-documentos">
          <FichaDocumentos
            documentos={f.documentos}
            idTitulo={ID.documentos}
            estado={textoDe("titulo-de-documentos")}
            repetir={mensaje}
            alAccion={abrirDocumento}
            alCargarOtro={abrirCargarOtro}
          />
        </div>
        <div class="area area-novedades">
          <FichaNovedades
            novedades={f.novedades}
            idTitulo={ID.novedades}
            estado={textoDe("titulo-de-novedades")}
            repetir={mensaje}
            alResolver={abrirResolver}
            alCargar={abrirCargarNovedad}
          />
        </div>
        <div class="area area-kilometraje">
          <FichaKilometraje
            kilometraje={f.kilometraje}
            idTitulo={ID.kilometraje}
            estado={textoDe("titulo-de-kilometraje")}
            repetir={mensaje}
            alCorregir={() => abrirDeEncabezado("corregir-kilometraje")}
          />
        </div>
        <div class="area area-historial">
          <FichaHistorial historial={f.historial} idTitulo={ID.historial} />
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
        <div class="solo-angosto"><EtiquetaDemo /></div>
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
  @media (min-width: 40rem) {
    .no-encontrada .solo-angosto {
      display: none;
    }
  }

  /* Teléfono y tableta: una columna (documentos, novedades, kilometraje, historial). El orden del DOM es el de la columna y el de Tab: en escritorio Kilometraje se ve a la
     derecha, bajo Novedades, y viene antes que el historial (que puede tener decenas de eventos). Escritorio (desde 68,75 rem): documentos en 8 de 12 columnas, novedades y
     kilometraje en las otras 4 y el historial a todo el ancho. */
  .paneles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "documentos"
      "novedades"
      "kilometraje"
      "historial";
    gap: var(--e-5);
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
  @media (min-width: 68.75rem) {
    .paneles {
      grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
      grid-template-areas:
        "documentos novedades"
        "documentos kilometraje"
        "historial historial";
    }
    .area {
      display: flex;
      flex-direction: column;
    }
    .area > :global(.panel) {
      flex: 1;
    }
  }
</style>
