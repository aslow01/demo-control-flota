<script lang="ts">
  // Centro de alertas (6.1, `#/alertas`): 1) protagonista "No pueden salir hoy", 2) operación diaria, 3) horizonte y vencimientos (con filtros y los
  // diálogos Renovar y Cargar), 4) detalle de la operación. No tiene reglas de negocio: todo lo que muestra lo arma `app.centroDeAlertas`
  // (lib/estado/centro-alertas.ts) y los diálogos usan `contextoDeRenovar`/`contextoDeCargar` y `app.renovarDocumento`/`app.cargarDocumento`.
  //  - Al renovar o cargar bien, la fila desaparece (su alerta se resolvió o pasó a ser la del documento nuevo): el foco va al h2 del panel de
  //    vencimientos y la barra de estado dice qué pasó (5.17). Al cancelar, el foco vuelve al botón que abrió el diálogo (lo hace Dialogo).
  //  - "Resolver" (novedades) abre el diálogo «Resolver novedad» (el mismo de la ficha, con `contextoDeResolver` y `app.resolverNovedad`): al guardar bien la
  //    fila desaparece, el mensaje («Novedad resuelta: Frenos (ZU 899 QE).») va a la barra de estado del detalle y el foco, a su título (o al de «Operación
  //    diaria» si el detalle quedó vacío). "Abrir el parte diario" cambia la vista a Conductor con el diálogo ya existente (`alAbrirParte`, que lo abre el marco).
  //  - Cambiar el filtro anuncia "Mostrando 4 de 11 vencimientos." en una región `role="status"` aparte (la barra de estado del panel es para lo que pasó).
  import { formatearFecha } from "../lib/dominio/fechas.ts";
  import { contextoDeCargar, contextoDeRenovar, type CampoDocumento, type ValoresDocumento } from "../lib/dominio/formulario-documento.ts";
  import { contextoDeResolver } from "../lib/dominio/formulario-novedad.ts";
  import type { TipoAlertaOperacion } from "../lib/dominio/alertas.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import {
    vencimientosVisibles,
    type AccionDeDocumento,
    type FilaOperacion,
    type FilaVencimiento,
    type IdFiltro,
  } from "../lib/estado/centro-alertas.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { aspectoDeOperacion, aspectoDeVencimiento } from "./alertas-aspecto.ts";
  import Boton from "./Boton.svelte";
  import DialogoDocumento, { type ContextoDeDocumento } from "./DialogoDocumento.svelte";
  import DialogoResolver from "./DialogoResolver.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import FiltrosConteo from "./FiltrosConteo.svelte";
  import Horizonte from "./Horizonte.svelte";
  import Icono from "./Icono.svelte";
  import ListaTabla, { type GrupoDeLista } from "./ListaTabla.svelte";
  import { CELDA } from "./lista-roles.ts";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_ALERTAS as T } from "./textos-marco.ts";
  import type { Tono } from "./tipos.ts";

  let { alAbrirParte }: { alAbrirParte: () => void } = $props();

  const ID_TITULO_VENCIMIENTOS = "titulo-vencimientos";

  const c = $derived(app.centroDeAlertas);

  // ---------- Filtros de vencimientos ----------
  let filtro = $state<IdFiltro>("todos");
  const v = $derived(c === null ? null : vencimientosVisibles(c.vencimientos, filtro));
  let anuncioFiltro = $state("");
  const TONO_FILTRO: Record<IdFiltro, Tono | undefined> = { todos: undefined, vencidos: "critico", "7": "semana", "15": "quincena", "30": "mes" };

  function elegirFiltro(id: IdFiltro): void {
    filtro = id;
    if (c !== null) anuncioFiltro = vencimientosVisibles(c.vencimientos, id).anuncio;
  }

  const filtros = $derived((c?.vencimientos.filtros ?? []).map((f) => ({ ...f, tono: TONO_FILTRO[f.id] })));
  const gruposVencimientos = $derived<GrupoDeLista<FilaVencimiento>[]>(
    (v?.grupos ?? []).map((g) => ({ clave: g.id, titulo: g.tituloConCantidad, tono: g.tono, filas: g.filas })),
  );

  const columnasVencimientos = [
    { id: "estado", titulo: T.columnasVencimientos.estado },
    { id: "documento", titulo: T.columnasVencimientos.documento },
    { id: "titular", titulo: T.columnasVencimientos.titular },
    { id: "proyecto", titulo: T.columnasVencimientos.proyecto },
    { id: "vence", titulo: T.columnasVencimientos.vence },
    { id: "accion", titulo: T.columnasVencimientos.accion },
  ];
  const columnasOperacion = [
    { id: "estado", titulo: T.columnasOperacion.estado },
    { id: "que", titulo: T.columnasOperacion.que },
    { id: "unidad", titulo: T.columnasOperacion.unidad },
    { id: "fecha", titulo: T.columnasOperacion.fecha },
    { id: "accion", titulo: T.columnasOperacion.accion },
  ];

  // ---------- Detalle de operación ----------
  interface FilaDelDetalle {
    fila: FilaOperacion;
    tipo: TipoAlertaOperacion;
  }
  const gruposDetalle = $derived<GrupoDeLista<FilaDelDetalle>[]>(
    (c?.detalle.grupos ?? []).map((g) => ({
      clave: g.tipo,
      titulo: g.tituloConCantidad,
      tono: aspectoDeOperacion(g.tipo).tono,
      idTitulo: g.idGrupo,
      filas: g.filas.map((fila) => ({ fila, tipo: g.tipo })),
    })),
  );

  /** "Ver" lleva al grupo del detalle: desplazamiento suave (salvo movimiento reducido) y foco al título del grupo. */
  function verGrupo(idGrupo: string): void {
    const destino = document.getElementById(idGrupo);
    if (destino === null) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destino.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
    destino.focus({ preventScroll: true });
  }

  /** «1 novedad crítica abierta» -> la cifra va en negrita y tabular. */
  function partirCifra(texto: string): { cifra: string; resto: string } {
    const m = /^(\d+)(.*)$/s.exec(texto);
    return m === null ? { cifra: "", resto: texto } : { cifra: m[1] ?? "", resto: m[2] ?? "" };
  }

  /** El resto del nombre accesible de una acción, después del texto visible: «Renovar» + « seguro de ZK 214 BD». */
  function sufijoAccesible(nombreAccesible: string, visible: string): string {
    return nombreAccesible.startsWith(visible) ? nombreAccesible.slice(visible.length) : ` ${nombreAccesible}`;
  }

  // ---------- Diálogos Renovar y Cargar ----------
  let dialogoAbierto = $state(false);
  let contextoDialogo = $state.raw<ContextoDeDocumento | null>(null);
  let guardarDocumento = $state.raw<(valores: ValoresDocumento) => Promise<ResultadoGuardado<CampoDocumento>>>(() =>
    Promise.resolve({ ok: true, mensaje: "", foco: "titulo-del-panel" }),
  );
  // Cada mensaje es un objeto nuevo: dos iguales seguidos («Seguro renovado…») cambian la identidad y el panel los vuelve a anunciar.
  let estadoVencimientos = $state({ texto: "" });

  function abrirDialogo(accion: AccionDeDocumento): void {
    const estado = app.estado;
    if (estado === null) return;
    if (accion.tipo === "renovar" && accion.documentoId !== null) {
      const documentoId = accion.documentoId;
      const ctx = contextoDeRenovar(estado, documentoId, app.hoy);
      if (ctx === null) {
        estadoVencimientos = { texto: T.yaNoPendiente };
        return;
      }
      contextoDialogo = { titulo: ctx.titulo, contexto: ctx.contexto, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      guardarDocumento = (valores) => app.renovarDocumento(documentoId, valores);
    } else {
      const ctx = contextoDeCargar(estado, accion.titular, accion.tipoDocumento);
      if (ctx === null) {
        estadoVencimientos = { texto: T.yaNoPendiente };
        return;
      }
      contextoDialogo = { titulo: ctx.titulo, primario: ctx.primario, valoresIniciales: ctx.valoresIniciales };
      guardarDocumento = (valores) => app.cargarDocumento(accion.titular, accion.tipoDocumento, valores);
    }
    dialogoAbierto = true;
  }

  function alGuardar(r: { mensaje: string }): void {
    estadoVencimientos = { texto: r.mensaje };
  }

  // ---------- Diálogo Resolver (novedades) ----------
  let dialogoResolverAbierto = $state(false);
  let contextoResolver = $state.raw<ReturnType<typeof contextoDeResolver>>(null);
  let estadoDetalle = $state({ texto: "" });

  function abrirResolver(novedadId: string): void {
    const estado = app.estado;
    if (estado === null) return;
    contextoResolver = contextoDeResolver(estado, novedadId, app.hoy);
    if (contextoResolver === null) {
      estadoDetalle = { texto: T.novedadYaResuelta };
      return;
    }
    dialogoResolverAbierto = true;
  }
  function alResolver(r: { mensaje: string }): void {
    estadoDetalle = { texto: r.mensaje };
  }
  // A dónde va el foco al cerrarse un diálogo: reciben el resultado del guardado, o `null` si se cerró sin guardar (el foco vuelve al botón que lo abrió, 5.17).
  /** La fila que abrió «Resolver» ya no existe: el foco va al título del detalle o, si quedó vacío, al de «Operación diaria». */
  function focoDestinoResolver(r: { foco: string } | null): HTMLElement | null {
    if (r === null) return null;
    return document.getElementById("titulo-detalle") ?? document.getElementById("titulo-operacion");
  }
  /** La fila que abrió «Renovar» o «Cargar» ya no existe: el foco va al h2 del panel de vencimientos. */
  function focoDestino(r: { foco: string } | null): HTMLElement | null {
    if (r === null) return null;
    return document.getElementById(ID_TITULO_VENCIMIENTOS);
  }
</script>

<!-- «Disponibles hoy: 20 de 23 unidades activas.»: es un dato de la pantalla, no un mensaje de lo que se hizo; sin `role="status"` no se anuncia cada vez que cambian los datos
     (guardar un documento lo cambiaba y pisaba la confirmación, auditoría de accesibilidad M3). -->
{#snippet disponibles()}{c?.protagonista.disponibles}{/snippet}

{#if c !== null && v !== null}
  <div class="pantalla">
    <div class="encabezado">
      <div class="solo-angosto"><EtiquetaDemo /></div>
      <h1 tabindex="-1">{c.titulo}</h1>
      <p class="linea">{c.encabezado.linea}</p>
    </div>

    <!-- 1 y 2: el protagonista y la operación diaria. -->
    <div class="principales">
      <Panel
        id="titulo-protagonista"
        titulo={c.protagonista.titulo}
        icono="vencido"
        meta={T.alFecha(formatearFecha(app.hoy))}
        contenidoEstado={c.protagonista.disponibles === "" ? undefined : disponibles}
      >
        <div class="protagonista" data-tono={c.protagonista.tono}>
          {#if c.protagonista.cifra > 0}
            <p class="solo-lectores">{c.protagonista.textoLector}</p>
            <p class="cifra-linea" aria-hidden="true">
              <span class="cifra num">{c.protagonista.cifra}</span>
              <span class="palabra">{c.protagonista.palabra}</span>
            </p>
            <ul class="unidades">
              {#each c.protagonista.items as u (u.unidadId)}
                <li>
                  <a class="unidad" href={u.href}>
                    <span class="solo-lectores">Ficha de </span><Patente patente={u.patente} />
                    <span class="interno">{u.interno}</span>
                    <span class="motivo">{u.motivo}</span>
                    <span class="siguiente"><Icono nombre="chevron" /></span>
                  </a>
                </li>
              {/each}
            </ul>
            {#if c.protagonista.masEnLaFlota !== null}
              <p class="mas"><a href={c.protagonista.masEnLaFlota.href}>{c.protagonista.masEnLaFlota.texto}</a></p>
            {/if}
          {:else}
            <p class="todas"><Icono nombre="check" />{c.protagonista.textoLector}</p>
          {/if}
        </div>
      </Panel>

      <Panel id="titulo-operacion" titulo={c.operacion.titulo} icono="parte" meta={c.operacion.rotuloTotal}>
        {#if c.operacion.vacio !== null}
          <p class="todas vacio-operacion" data-tono="vigente"><Icono nombre="check" />{c.operacion.vacio}</p>
        {:else}
          <ul class="filas-operacion">
            {#each c.operacion.filas as f (f.tipo)}
              {@const aspecto = aspectoDeOperacion(f.tipo)}
              {@const partes = partirCifra(f.texto)}
              <li data-tono={aspecto.tono}>
                <span class="icono-fila"><Icono nombre={aspecto.icono} /></span>
                <span class="texto-fila"><span class="cifra-fila num">{partes.cifra}</span>{partes.resto}</span>
                <Boton variante="texto" onclick={() => verGrupo(f.idGrupo)}>
                  {T.ver}<span class="solo-lectores">{T.verDetalleDe(f.texto)}</span>
                  <span class="abajo"><Icono nombre="chevron" /></span>
                </Boton>
              </li>
            {/each}
          </ul>
        {/if}
        {#snippet contenidoEstado()}
          <span class="conductor-estado">
            <span id="conductor-intro">{c.operacion.barraEstado.intro}</span>
            <Boton variante="texto" aria-describedby="conductor-aclaracion" onclick={alAbrirParte}>
              {c.operacion.barraEstado.accion}<Icono nombre="flecha-der" />
            </Boton>
            <span id="conductor-aclaracion" class="aclaracion">{c.operacion.barraEstado.aclaracion}</span>
          </span>
        {/snippet}
      </Panel>
    </div>

    <!-- 3: horizonte, filtros y lista de vencimientos. -->
    <Panel id={ID_TITULO_VENCIMIENTOS} titulo={c.vencimientos.titulo} icono="calendario" meta={c.vencimientos.rotuloCantidad} estado={estadoVencimientos.texto} repetir={estadoVencimientos}>
      <Horizonte horizonte={c.vencimientos.horizonte} />
      <FiltrosConteo leyenda={T.mostrar} opciones={filtros} valor={filtro} alElegir={elegirFiltro} />
      <div class="solo-lectores" role="status">{anuncioFiltro}</div>
      {#if v.textoVacio !== null}
        <p class="vacio"><Icono nombre="guion" />{v.textoVacio}</p>
      {/if}
      {#if gruposVencimientos.length > 0}
        <ListaTabla
          variante="vencimientos"
          titulo={c.vencimientos.titulo}
          columnas={columnasVencimientos}
          grupos={gruposVencimientos}
          claveDeFila={(f) => f.alertaId}
          tonoDeFila={(f) => aspectoDeVencimiento(f).tono}
        >
          {#snippet fila(f: FilaVencimiento)}
            {@const aspecto = aspectoDeVencimiento(f)}
            <td {...CELDA} data-col="estado"><Etiqueta tono={aspecto.tono} icono={aspecto.icono}>{f.estado}</Etiqueta></td>
            <td {...CELDA} data-col="documento">
              <span class="doc">{f.documento}</span>
              {#if f.numero !== null}<span class="numero codigo">{f.numero}</span>{/if}
            </td>
            <td {...CELDA} data-col="titular">
              {#if f.titular.tipo === "unidad"}
                <span class="titular">
                  <span class="linea-titular">
                    <Patente patente={f.titular.patente} href={f.titular.href} /><span class="interno">{f.titular.interno}</span>
                  </span>
                  <span class="nota">{f.titular.descripcion}</span>
                </span>
              {:else}
                <span class="titular">
                  {#if f.titular.unidad !== null}
                    <a href={f.titular.unidad.href}>{f.titular.nombre}<span class="solo-lectores"> (ficha de {f.titular.unidad.patenteTexto})</span></a>
                  {:else}
                    <span>{f.titular.nombre}</span>
                  {/if}
                  <span class="nota">{f.titular.detalle}</span>
                </span>
              {/if}
            </td>
            <td {...CELDA} data-col="proyecto" data-etiqueta={T.proyectoDe} data-sin-valor={f.proyecto === null ? "" : undefined}>{#if f.proyecto !== null}{f.proyecto}{:else}<span aria-hidden="true">—</span><span class="solo-lectores">{T.sinProyecto}</span>{/if}</td>
            <td {...CELDA} data-col="vence" data-etiqueta={T.venceEl} data-sin-valor={f.sinVencimiento ? "" : undefined}>{#if f.sinVencimiento}<span aria-hidden="true">{f.vence}</span><span class="solo-lectores">{T.sinFecha}</span>{:else}{f.vence}{/if}</td>
            <td {...CELDA} data-col="accion">
              <Boton variante="secundario" onclick={() => abrirDialogo(f.accion)}>
                {f.accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(f.accion.nombreAccesible, f.accion.etiqueta)}</span>
              </Boton>
            </td>
          {/snippet}
        </ListaTabla>
      {/if}
    </Panel>

    <!-- 4: detalle de la operación (solo los tipos con pendientes). -->
    {#if gruposDetalle.length > 0 || estadoDetalle.texto !== ""}
      <Panel id="titulo-detalle" titulo={c.detalle.titulo} icono="novedad" estado={estadoDetalle.texto} repetir={estadoDetalle}>
        {#if gruposDetalle.length === 0}
          <p class="vacio"><Icono nombre="check" />{c.operacion.vacio ?? ""}</p>
        {:else}
          <ListaTabla
            variante="operacion"
            titulo={c.detalle.titulo}
            columnas={columnasOperacion}
            grupos={gruposDetalle}
            claveDeFila={(x) => x.fila.alertaId}
            tonoDeFila={(x) => aspectoDeOperacion(x.tipo).tono}
          >
            {#snippet fila(x: FilaDelDetalle)}
              {@const aspecto = aspectoDeOperacion(x.tipo)}
              <td {...CELDA} data-col="estado"><Etiqueta tono={aspecto.tono} icono={aspecto.icono}>{x.fila.estado}</Etiqueta></td>
              <td {...CELDA} data-col="que">{x.fila.texto}</td>
              <td {...CELDA} data-col="unidad">
                <span class="linea-titular">
                  <Patente patente={x.fila.unidad.patente} href={x.fila.unidad.href} /><span class="interno">{x.fila.unidad.interno}</span>
                </span>
              </td>
              <td {...CELDA} data-col="fecha" data-etiqueta={T.columnasOperacion.fecha} data-sin-valor={x.fila.sinFecha ? "" : undefined}>{#if x.fila.sinFecha}<span aria-hidden="true">{x.fila.fecha}</span><span class="solo-lectores">{T.sinFecha}</span>{:else}{x.fila.fecha}{/if}</td>
              <td {...CELDA} data-col="accion">
                {#if x.fila.accion.tipo === "resolver"}
                  {@const accion = x.fila.accion}
                  <Boton variante="secundario" onclick={() => abrirResolver(accion.novedadId)}>
                    {accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(accion.nombreAccesible, accion.etiqueta)}</span>
                  </Boton>
                {:else}
                  <EnlaceAccion href={x.fila.accion.href}>
                    {x.fila.accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(x.fila.accion.nombreAccesible, x.fila.accion.etiqueta)}</span>
                  </EnlaceAccion>
                {/if}
              </td>
            {/snippet}
          </ListaTabla>
        {/if}
      </Panel>
    {/if}
  </div>

  <DialogoResolver
    bind:abierto={dialogoResolverAbierto}
    contexto={contextoResolver}
    guardar={(valores) => app.resolverNovedad(contextoResolver?.novedadId ?? "", valores)}
    alGuardar={alResolver}
    focoDestino={focoDestinoResolver}
  />
  <DialogoDocumento bind:abierto={dialogoAbierto} contexto={contextoDialogo} guardar={guardarDocumento} {alGuardar} {focoDestino} />
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }
  .linea {
    color: var(--c-texto-2);
  }

  /* Protagonista (columnas 1-7) y operación diaria (8-12) en escritorio; una debajo de la otra en tableta y teléfono. */
  .principales {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-5);
  }
  @media (min-width: 68.75rem) {
    .principales {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    }
  }

  /* ---------- Protagonista ---------- */
  .protagonista {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding-left: var(--e-4);
    border-left: 4px solid var(--tono-r);
  }
  .cifra-linea {
    display: flex;
    align-items: baseline;
    gap: var(--e-3);
    color: var(--tono-t);
  }
  .cifra {
    font-family: var(--t-familia-titulo);
    font-size: var(--t-cifra);
    font-weight: 700;
    line-height: 1;
  }
  .palabra {
    font-size: var(--t-h2);
    font-weight: 600;
    line-height: 1.2;
  }
  .unidades {
    display: flex;
    flex-direction: column;
  }
  .unidades li + li {
    border-top: 1px solid var(--c-borde);
  }
  .unidad {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
    min-height: 3rem;
    padding: var(--e-2) var(--e-6) var(--e-2) var(--e-1);
    color: var(--c-texto);
    text-decoration: none;
  }
  .interno {
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
  }
  .motivo {
    flex: 1 1 14rem;
    min-width: 0;
    font-size: var(--t-tabla);
    font-weight: 600;
    color: var(--tono-t, var(--c-texto));
  }
  .siguiente {
    position: absolute;
    top: 50%;
    right: var(--e-2);
    translate: 0 -50%;
    color: var(--c-texto-3);
  }
  @media (hover: hover) {
    .unidad:hover {
      background: var(--c-superficie-2);
    }
    .unidad:hover .siguiente {
      color: var(--c-texto);
    }
  }
  .mas {
    font-size: var(--t-tabla);
  }
  .mas a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }
  /* Con 0: franja vigente, ícono grande y la frase. */
  .todas {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--c-vigente-t);
  }

  /* ---------- Operación diaria ---------- */
  .filas-operacion {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  @container interior (min-width: 36rem) {
    .filas-operacion {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: var(--e-5);
    }
  }
  .filas-operacion li {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: 3rem;
    border-bottom: 1px solid var(--c-borde);
  }
  .icono-fila {
    display: inline-flex;
    flex: none;
    color: var(--tono-t);
  }
  .texto-fila {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .cifra-fila {
    margin-right: 0.25em;
    font-weight: 700;
  }
  .abajo {
    display: inline-flex;
    rotate: 90deg;
  }
  /* «Así lo carga el conductor: Abrir el parte diario → (cambia la vista a Conductor)»: las tres partes juntas, en el mismo renglón si entran (C13). */
  .conductor-estado {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--e-1);
  }
  .aclaracion {
    color: var(--c-texto-2);
  }
  .vacio-operacion {
    padding-block: var(--e-2);
  }

  /* ---------- Vencimientos y detalle ---------- */
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
  .doc {
    display: block;
    font-weight: 600;
  }
  .numero {
    display: block;
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .titular {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  .linea-titular {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
  }
  /* El enlace de la patente mide 44 px de alto (su blanco táctil) y la patente solo 24: los 10 px que sobran arriba y abajo no son aire entre las dos líneas de la celda (C8).
     El blanco sigue siendo de 44 px; solo deja de ocupar lugar. */
  .linea-titular :global(.enlace-patente) {
    margin-block: -0.625rem;
  }
  .titular .nota {
    line-height: 1.3;
  }
  /* Tarjeta (C7): «[ZR 536 MZ] Int. 12 · Toyota Hilux» en un renglón, el documento con su número al lado y los dos de abajo (proyecto, fecha) sin rótulo. */
  @container lista (max-width: 39.99rem) {
    .titular {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 var(--e-2);
    }
    .titular .interno::after {
      content: " ·";
      content: " ·" / "";
    }
    .doc,
    .numero {
      display: inline;
    }
    .numero {
      margin-left: var(--e-2);
    }
  }
  td a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }

  @media (forced-colors: active) {
    .protagonista {
      border-left-color: CanvasText;
    }
  }
</style>
