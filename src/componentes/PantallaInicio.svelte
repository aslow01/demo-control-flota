<script lang="ts">
  // Inicio del encargado (`#/inicio`, docs/diseno-ui.md 6.1; prototipo «Turno»): 1) la cifra cobre «No disponibles hoy» y cuatro cifras más, cada una con su destino;
  // 2) «No disponibles hoy»: las unidades y los conductores que no pueden manejar; 3) el horizonte de vencimientos (regla interactiva); 4) la operación diaria.
  // No tiene reglas de negocio: todo lo que muestra lo arma `app.centroDeAlertas` (lib/estado/centro-alertas.ts: `cifras`, `protagonista`, `vencimientos.regla`, `operacion`).
  //  - Los diálogos Renovar / Cargar / Corregir son los compartidos (`dialogos`, `DialogosDeDocumento`), con origen «inicio». Un mensaje de lo que pasó se lee en la barra de estado
  //    del panel que abrió el diálogo, y a ese panel va el foco al guardar (la fila o el punto que lo abrió ya no existe), 5.17. Al cancelar, el foco vuelve al botón.
  //  - «Abrir el parte diario» cambia la vista a Conductor con el diálogo «Ver como» (`alAbrirParte`, que lo abre el marco).
  import { formatearFecha } from "../lib/dominio/fechas.ts";
  import { textoVerTodasEnLaFlota, TEXTO_INICIO } from "../lib/dominio/textos.ts";
  import type { AccionDeDocumento, CifraDeInicio, FilaDeConductorSinLicencia } from "../lib/estado/centro-alertas.ts";
  import { aHash } from "../lib/estado/enrutador.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { aspectoDeAptitud, aspectoDeOperacion } from "./alertas-aspecto.ts";
  import DialogosDeDocumento from "./DialogosDeDocumento.svelte";
  import { dialogos } from "./dialogos-instancia.ts";
  import Boton from "./Boton.svelte";
  import CifraQueCuenta from "./CifraQueCuenta.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Forma from "./Forma.svelte";
  import Horizonte from "./Horizonte.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_ALERTAS as T } from "./textos-marco.ts";

  let {
    alAbrirParte,
    alProbarComoConductor,
  }: {
    /** «Abrir el parte diario»: el marco abre «Ver como» con Conductor ya elegido. */
    alAbrirParte: () => void;
    /** «Probar como conductor» (franja bajo el subtítulo): el marco abre «Ver como» con Conductor y este conductor ya elegidos. */
    alProbarComoConductor: (conductorId: string) => void;
  } = $props();

  const ID_NODISPONIBLES = "titulo-no-disponibles";
  const ID_VENCIMIENTOS = "titulo-vencimientos";
  const ID_OPERACION = "titulo-operacion";

  const c = $derived(app.centroDeAlertas);
  /** El conductor con el parte bloqueado por un documento vencido: de él sale la franja del recorrido (sin ninguno, no se muestra). */
  const recorrido = $derived(app.entradaAlRecorrido());

  // ---------- Diálogos ----------
  /** En qué panel se abrió el último diálogo: ahí se dice lo que pasó y a ese título va el foco (los dos paneles comparten el origen «inicio»). */
  let panelDelDialogo = $state<"no-disponibles" | "vencimientos">("vencimientos");
  const mensaje = $derived(dialogos.mensaje("inicio"));

  function abrirLicencia(conductor: FilaDeConductorSinLicencia): void {
    panelDelDialogo = "no-disponibles";
    dialogos.abrirLicencia(conductor, "inicio");
  }
  function renovarDesdeLaRegla(accion: AccionDeDocumento): void {
    panelDelDialogo = "vencimientos";
    dialogos.abrirRenovar(accion, "inicio");
  }
  function focoDestino(): HTMLElement | null {
    return document.getElementById(panelDelDialogo === "no-disponibles" ? ID_NODISPONIBLES : ID_VENCIMIENTOS);
  }

  /** «1 novedad crítica abierta» -> la cifra va grande y el resto al lado. */
  function partirCifra(texto: string): { cifra: string; resto: string } {
    const m = /^(\d+)\s*(.*)$/s.exec(texto);
    return m === null ? { cifra: "", resto: texto } : { cifra: m[1] ?? "", resto: m[2] ?? "" };
  }

  const cifrasSecundarias = $derived<CifraDeInicio[]>(c === null ? [] : [c.cifras.vencidos, c.cifras.proximos, c.cifras.partes, c.cifras.novedadCritica]);
  const rotuloDeSolapa = (id: "checklists" | "novedades"): string => c?.operacionDiaria.solapas.find((s) => s.id === id)?.rotulo ?? "";
</script>

{#if c !== null}
  {@const n = c.cifras.noDisponibles}
  <div class="pantalla">
    <div class="encabezado">
      <h1 tabindex="-1">{c.titulo}</h1>
      <p class="linea">{c.encabezado.linea}</p>
    </div>

    <!-- Entrada al recorrido: lo mejor de la demo (el parte que se traba por un seguro vencido) a un clic. El estilo es del maquetador (`.entrada-recorrido`). -->
    {#if recorrido !== null}
      <div class="entrada-recorrido">
        <p class="entrada-recorrido-texto">{TEXTO_INICIO.recorrido.texto}</p>
        <Boton variante="secundario" aria-haspopup="dialog" onclick={() => alProbarComoConductor(recorrido.conductorId)}>{TEXTO_INICIO.recorrido.boton}</Boton>
      </div>
    {/if}

    <!-- 1: las cifras. La cobre (principal) lleva al filtro «No disponibles hoy» de Movilidades; cada una de las otras, a su lista. -->
    <div class="cifras">
      <a class="foco" class:ok={n.valor === 0} href={n.href}>
        <!-- La cifra cuenta de 0 a N al abrir la demo; el lector de pantalla lee solo el valor final, aparte. -->
        <span class="valor num" aria-hidden="true"><CifraQueCuenta valor={n.valor} /></span>
        <span class="solo-lectores">{n.valor}</span>
        <span class="rotulo-foco">
          <span class="titulo-foco">{n.rotulo}</span>
          <span class="bajada">{n.bajada}</span>
          <span class="disponibles">{n.disponibles}</span>
        </span>
        <span class="flecha"><Icono nombre="chevron" /></span>
      </a>
      <ul class="sub">
        {#each cifrasSecundarias as k (k.href)}
          <li>
            <a class="cifra" data-tono={k.tono} href={k.href}>
              {#if k.forma !== null}<span class="forma-cifra"><Forma forma={k.forma} /></span>{/if}
              <span class="valor num">{k.valor}</span>
              <span class="rotulo-cifra">{k.rotulo}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <div class="paneles">
      <!-- 2: No disponibles hoy. -->
      <div class="p-no-disponibles">
        <Panel
          id={ID_NODISPONIBLES}
          titulo={c.protagonista.titulo}
          icono="vencido"
          meta={c.protagonista.desglose ?? T.alFecha(formatearFecha(app.hoy))}
          estado={panelDelDialogo === "no-disponibles" ? mensaje.texto : ""}
          repetir={mensaje}
          sinRelleno
        >
          {#if c.protagonista.items.length > 0}
            <ul class="filas">
              {#each c.protagonista.items as u (u.unidadId)}
                {@const aspecto = aspectoDeAptitud(u.categoria)}
                <li>
                  <a class="fila" data-tono={aspecto.tono} href={u.href}>
                    <span class="cuerpo">
                      <span class="linea1">
                        <span class="solo-lectores">Ficha de </span><Patente patente={u.patente} />
                        <span class="interno">{u.interno}</span>
                        <Etiqueta tono={aspecto.tono} variante="texto">{u.etiqueta}</Etiqueta>
                      </span>
                      <span class="motivo">{u.motivo}</span>
                    </span>
                    <span class="siguiente"><Icono nombre="chevron" /></span>
                  </a>
                </li>
              {/each}
            </ul>
          {:else}
            <div class="vacio">
              <span class="marca-vacia" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
              <p class="vacio-titulo">{TEXTO_INICIO.noDisponiblesVacio.titulo}</p>
              <p>{TEXTO_INICIO.noDisponiblesVacio.ayuda}</p>
            </div>
          {/if}

          {#if c.protagonista.conductores.length > 0}
            <!-- Conductores que hoy no pueden manejar (no cambian la cifra: A8). -->
            <h3 class="subtitulo">{c.protagonista.tituloConductores}</h3>
            <ul class="filas">
              {#each c.protagonista.conductores as k (k.conductorId)}
                <li class="conductor" data-tono="critico">
                  <div class="texto-conductor">
                    <span class="nombre">{T.conductorFicticio(k.nombre)}</span>
                    <span class="motivo-conductor">{k.motivo}</span>
                    {#if k.unidad !== null}
                      <span class="unidad-conductor">
                        {T.unidadDelConductor}
                        <Patente patente={k.unidad.patenteTexto.replaceAll(" ", "")} href={k.unidad.href} />
                      </span>
                    {/if}
                  </div>
                  <!-- La acción siempre está completa (B2): «Renovar», «Cargar» o «Corregir» (una licencia que vale desde una fecha futura). -->
                  <Boton variante="secundario" tamano="chico" onclick={() => abrirLicencia(k)}>
                    {k.accion.etiqueta}<span class="solo-lectores">{k.accion.nombreAccesible.startsWith(k.accion.etiqueta) ? k.accion.nombreAccesible.slice(k.accion.etiqueta.length) : ` ${k.accion.nombreAccesible}`}</span>
                  </Boton>
                </li>
              {/each}
            </ul>
          {/if}

          <div class="pie">
            <a class="enlace-flecha" href={c.protagonista.masEnLaFlota?.href ?? n.href}>
              {c.protagonista.masEnLaFlota?.texto ?? textoVerTodasEnLaFlota(n.valor)}<Icono nombre="flecha" />
            </a>
          </div>
        </Panel>
      </div>

      <!-- 3: el horizonte (la regla de 0 a 30 días). -->
      <div class="p-vencimientos">
        <Panel
          id={ID_VENCIMIENTOS}
          titulo={c.vencimientos.titulo}
          icono="calendario"
          meta={c.vencimientos.contexto}
          estado={panelDelDialogo === "vencimientos" ? mensaje.texto : ""}
          repetir={mensaje}
        >
          {#snippet controles()}
            <a class="enlace-flecha" href={aHash({ tipo: "vencimientos" })} aria-label={TEXTO_INICIO.verTodosVencimientos.nombre}>
              {TEXTO_INICIO.verTodosVencimientos.visible}<Icono nombre="flecha" />
            </a>
          {/snippet}
          <Horizonte regla={c.vencimientos.regla} alRenovar={renovarDesdeLaRegla} />
        </Panel>
      </div>

      <!-- 4: la operación diaria. -->
      <div class="p-operacion">
        <Panel id={ID_OPERACION} titulo={c.operacion.titulo} icono="parte" meta={c.operacion.rotuloTotal} sinRelleno>
          {#if c.operacion.vacio !== null}
            <div class="vacio">
              <span class="marca-vacia" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
              <p class="vacio-titulo">{c.operacion.vacio}</p>
              <p>{TEXTO_INICIO.operacionVaciaAyuda}</p>
            </div>
          {:else}
            <ul class="filas compactas">
              {#each c.operacion.filas as f (f.tipo)}
                {@const aspecto = aspectoDeOperacion(f.tipo)}
                {@const partes = partirCifra(f.texto)}
                <li>
                  <a class="fila fila-operacion" data-tono={aspecto.tono} href={f.href}>
                    <span class="cifra-fila num">{partes.cifra}</span>
                    <span class="cuerpo">
                      <span class="motivo">{partes.resto}</span>
                      <span class="seccion">{rotuloDeSolapa(f.solapa)}</span>
                    </span>
                    <span class="siguiente"><Icono nombre="chevron" /></span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
          {#snippet contenidoEstado()}
            <span class="conductor-estado">
              <span>{c.operacion.barraEstado.intro}</span>
              <Boton variante="texto" onclick={alAbrirParte}>{c.operacion.barraEstado.accion}<Icono nombre="flecha" /></Boton>
              <span class="aclaracion">{c.operacion.barraEstado.aclaracion}</span>
            </span>
          {/snippet}
        </Panel>
      </div>
    </div>

    <DialogosDeDocumento {focoDestino} />
  </div>
{/if}

<style>
  .pantalla {
    container: inicio / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .linea {
    color: var(--c-texto-2);
  }

  /* ---------- Cifras ----------
     La cobre manda: en celular y tableta arriba, a todo el ancho; desde 70 rem, la mitad izquierda con la cifra más grande y las otras cuatro en una grilla de 2 × 2 al lado.
     Sin `overflow: hidden`, para no recortar el anillo de foco. */
  .cifras {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
  }
  .valor {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-weight: 700;
    line-height: 0.95;
  }

  .foco {
    display: flex;
    align-items: center;
    gap: var(--e-4);
    min-height: 7.5rem;
    padding: var(--e-4) var(--e-4) var(--e-4) var(--e-5);
    border-radius: var(--r-2) var(--r-2) 0 0;
    background: var(--c-critico-solido);
    color: var(--c-sobre-solido);
    text-decoration: none;
    transition: background-color var(--m-rapido) linear;
  }
  .foco .valor {
    flex: none;
    font-size: var(--t-cifra-grande);
  }
  .rotulo-foco {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .titulo-foco {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.375rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }
  .bajada {
    font-size: var(--t-tabla);
    font-weight: 600;
    line-height: 1.35;
  }
  .disponibles {
    font-size: var(--t-tabla);
    line-height: 1.35;
    color: var(--c-sobre-solido-2);
  }
  .flecha {
    display: inline-flex;
    flex: none;
    margin-inline-start: auto;
  }
  @media (hover: hover) {
    .foco:hover {
      background: color-mix(in srgb, var(--c-critico-solido) 88%, black);
    }
  }
  .foco:focus-visible {
    outline: 3px solid var(--c-foco-oscuro);
    outline-offset: -0.4375rem;
  }
  /* Con 0 no disponibles: en verde malaquita, como «en orden». */
  .foco.ok {
    background: var(--c-vigente-f);
    color: var(--c-vigente-t);
  }
  .foco.ok .disponibles {
    color: var(--c-texto-2);
  }
  .foco.ok:focus-visible {
    outline-color: var(--c-foco);
  }

  .sub {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    border: 1px solid var(--c-borde);
    border-top: 0;
    border-radius: 0 0 var(--r-2) var(--r-2);
    background: var(--c-borde);
  }
  .sub > li {
    display: flex;
    min-width: 0;
  }
  .sub > li:nth-child(3) .cifra {
    border-bottom-left-radius: calc(var(--r-2) - 1px);
  }
  .sub > li:nth-child(4) .cifra {
    border-bottom-right-radius: calc(var(--r-2) - 1px);
  }
  .cifra {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--e-1);
    min-width: 0;
    min-height: 5.5rem;
    padding: var(--e-3) var(--e-4);
    background: var(--c-superficie);
    color: var(--c-texto);
    text-decoration: none;
    transition: background-color var(--m-rapido) linear;
  }
  .cifra .valor {
    font-size: var(--t-cifra);
    color: var(--tono-t, var(--c-texto));
  }
  .rotulo-cifra {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.25;
    color: var(--c-texto-2);
  }
  .forma-cifra {
    position: absolute;
    top: var(--e-3);
    right: var(--e-3);
    display: inline-flex;
    color: var(--tono-r);
  }
  .forma-cifra :global(.forma) {
    --forma-tam: 0.6875rem;
  }
  @media (hover: hover) {
    .cifra:hover {
      background: var(--c-superficie-2);
    }
  }
  .cifra:focus-visible {
    outline-offset: -5px;
    z-index: 1;
  }
  /* Los tonos de una cifra con algo que atender salen de `data-tono`; «neutro» deja el texto en su color. */
  .cifra[data-tono="neutro"] {
    --tono-t: var(--c-texto);
  }

  /* ---------- Paneles ---------- */
  .paneles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
    min-width: 0;
  }
  .paneles > div {
    min-width: 0;
  }

  @media (min-width: 70rem) {
    .cifras {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .foco {
      min-height: 12.25rem;
      padding: var(--e-4) var(--e-6);
      gap: var(--e-5);
      border-radius: var(--r-2) 0 0 var(--r-2);
    }
    .foco .valor {
      font-size: 7rem;
      letter-spacing: -0.02em;
    }
    .titulo-foco {
      font-size: 1.5rem;
    }
    .bajada,
    .disponibles {
      font-size: 0.9375rem;
    }
    .sub {
      border-top: 1px solid var(--c-borde);
      border-left: 0;
      border-radius: 0 var(--r-2) var(--r-2) 0;
    }
    .sub > li:nth-child(2) .cifra {
      border-top-right-radius: calc(var(--r-2) - 1px);
    }
    .sub > li:nth-child(3) .cifra {
      border-bottom-left-radius: 0;
    }
    .cifra {
      min-height: 6rem;
      padding: var(--e-3) var(--e-5);
    }

    /* La regla sube a la primera pantalla: columna derecha, arriba de la operación diaria. */
    .paneles {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        "nd ve"
        "nd op";
      align-items: start;
    }
    .p-no-disponibles {
      grid-area: nd;
    }
    .p-vencimientos {
      grid-area: ve;
    }
    .p-operacion {
      grid-area: op;
    }
  }

  /* ---------- Filas: una lista de trabajo con riel de color ---------- */
  .filas > li + li {
    border-top: 1px solid var(--c-borde);
  }
  .fila {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: 3.75rem;
    padding: var(--e-3) var(--e-3) var(--e-3) calc(var(--e-4) + 2px);
    box-shadow: inset 4px 0 0 var(--tono-r, transparent);
    color: var(--c-texto);
    text-decoration: none;
    transition: background-color var(--m-rapido) linear;
  }
  .fila:focus-visible {
    outline-offset: -3px;
  }
  .cuerpo {
    flex: 1;
    min-width: 0;
  }
  .linea1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .interno {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    white-space: nowrap;
  }
  .motivo {
    display: block;
    margin-top: var(--e-2);
    font-size: var(--t-cuerpo);
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .siguiente {
    display: inline-flex;
    flex: none;
    margin-inline-start: auto;
    color: var(--c-texto-3);
  }
  @media (hover: hover) {
    .fila:hover {
      background: var(--c-superficie-2);
    }
    .fila:hover .siguiente {
      color: var(--c-texto);
    }
  }

  .subtitulo {
    padding: var(--e-4) var(--e-4) var(--e-2);
    border-top: 1px solid var(--c-borde);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: var(--t-chico);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  .conductor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) + 2px);
    box-shadow: inset 4px 0 0 var(--tono-r);
  }
  .texto-conductor {
    display: flex;
    flex: 1 1 14rem;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .nombre {
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .motivo-conductor {
    font-size: var(--t-chico);
    font-weight: 600;
    color: var(--tono-t);
  }
  .unidad-conductor {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  /* El enlace de la patente mide 44 px de alto (su blanco táctil) y la patente solo 24: el aire que sobra no es espacio entre renglones. */
  .unidad-conductor :global(.enlace-patente) {
    margin-block: -0.625rem;
  }

  .pie {
    padding: var(--e-1) var(--e-4);
    border-top: 1px solid var(--c-borde);
  }
  .enlace-flecha {
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    min-height: var(--alto-tactil);
    color: var(--c-enlace);
    font-size: var(--t-cuerpo);
    font-weight: 650;
    text-decoration: none;
    --icono-tam: 1rem;
  }
  .enlace-flecha:hover {
    text-decoration: underline;
  }
  /* Dentro de la barra del panel: sin el relleno derecho que ya tiene. */
  :global(.panel .controles) .enlace-flecha {
    padding-inline: var(--e-3);
  }
  /* «Vencimientos»: el contexto («3 vencidos o faltantes · 9 vencen en 30 días») es largo; baja siempre a su renglón, alineado con el título, y «Ver todos» queda arriba a la derecha. */
  .p-vencimientos :global(.barra .meta) {
    order: 2;
    flex: 1 0 100%;
    padding: 0 0 var(--e-2) calc(1.25rem + var(--e-2));
  }

  /* Operación diaria: la cifra grande de cada fila, en el tono de su gravedad. */
  .compactas .fila {
    min-height: 3.25rem;
    padding-block: var(--e-2);
  }
  .fila-operacion .cuerpo .motivo {
    margin-top: 0;
    font-size: var(--t-cuerpo);
  }
  .seccion {
    display: block;
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .cifra-fila {
    flex: none;
    min-width: 1.5rem;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--tono-t);
  }
  /* «Así lo carga el conductor: Abrir el parte diario → (cambia la vista a Conductor)»: las tres partes juntas, en el mismo renglón si entran. */
  .conductor-estado {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--e-2);
  }
  .conductor-estado :global(.boton) {
    --icono-tam: 1rem;
  }
  .aclaracion {
    color: var(--c-texto-2);
  }

  /* ---------- Estados vacíos: una regla de 0 a 30 días con el tilde de «en orden» ---------- */
  .vacio {
    display: grid;
    justify-items: start;
    gap: var(--e-2);
    padding: var(--e-5) var(--e-4);
  }
  .vacio p {
    max-width: 46ch;
    color: var(--c-texto-2);
  }
  .vacio .vacio-titulo {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--c-texto);
  }
  .marca-vacia {
    position: relative;
    display: grid;
    grid-template-columns: 7fr 8fr 15fr;
    width: 10.5rem;
    height: 1rem;
    margin: 1.375rem 0 var(--e-2) 2px;
  }
  .marca-vacia i:nth-child(1) {
    background: var(--c-semana-f);
    border-radius: 3px 0 0 3px;
  }
  .marca-vacia i:nth-child(2) {
    background: var(--c-quincena-f);
  }
  .marca-vacia i:nth-child(3) {
    background: var(--c-mes-f);
    border-radius: 0 3px 3px 0;
  }
  .marca-vacia::before {
    content: "";
    position: absolute;
    left: -2px;
    top: -6px;
    bottom: -6px;
    width: 3px;
    border-radius: 2px;
    background: var(--c-hoy);
  }
  .marca-vacia b {
    position: absolute;
    left: 8px;
    top: -22px;
    width: 12px;
    height: 22px;
    border: solid var(--c-vigente-r);
    border-width: 0 4px 4px 0;
    transform: rotate(40deg);
  }

  /* ---------- Texto agrandado (200 %): el contenido mide 17 rem o menos (272 px con el texto normal) ----------
     La cifra cobre pasa a una columna, las cuatro cifras a una por renglón y las filas se apilan: ningún texto parte una palabra (docs/diseno-ui.md, 12). */
  @container inicio (max-width: 17rem) {
    .foco {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--e-2);
      padding: var(--e-3);
    }
    .foco .valor {
      font-size: var(--t-cifra);
    }
    .flecha,
    .siguiente {
      display: none;
    }
    .sub {
      grid-template-columns: minmax(0, 1fr);
    }
    .sub > li .cifra {
      border-radius: 0;
    }
    .sub > li:last-child .cifra {
      border-radius: 0 0 calc(var(--r-2) - 1px) calc(var(--r-2) - 1px);
    }
    .cifra {
      min-height: 4.5rem;
      padding: var(--e-2) var(--e-3);
    }
    .fila,
    .conductor {
      padding-inline: calc(var(--e-2) + 4px) var(--e-2);
    }
    .fila-operacion {
      flex-wrap: wrap;
      gap: var(--e-1);
    }
    .fila-operacion .cuerpo {
      flex-basis: 100%;
    }
    .subtitulo,
    .pie {
      padding-inline: var(--e-2);
    }
    .vacio {
      padding-inline: var(--e-2);
    }
    .conductor-estado {
      row-gap: 0;
    }
  }

  /* ---------- Colores forzados ---------- */
  @media (forced-colors: active) {
    .foco {
      border: 2px solid CanvasText;
    }
    .fila,
    .conductor {
      border-inline-start: 4px solid CanvasText;
      box-shadow: none;
    }
    .marca-vacia::before,
    .marca-vacia i {
      background: CanvasText;
    }
    .marca-vacia b {
      border-color: CanvasText;
    }
  }
</style>
