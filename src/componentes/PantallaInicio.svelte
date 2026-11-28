<script lang="ts">
  // Inicio del encargado (`#/inicio`, docs/diseno-ui.md 15.9.1): 1) la regla de salida (cuántas unidades pueden salir hoy, una llave por unidad, la «Acción del día» y los cuatro renglones
  // de lectura); 2) «No disponibles hoy»: la lista de piezas (con su número) y los conductores que no pueden manejar; 3) el horizonte de vencimientos; 4) la operación diaria.
  // No tiene reglas de negocio: la regla la arma `calcularSalida` (lib/estado/salida.ts) y lo demás `app.centroDeAlertas` (lib/estado/centro-alertas.ts: `protagonista`, `vencimientos.regla`, `operacion`).
  //  - Los diálogos Renovar / Cargar / Corregir son los compartidos (`dialogos`, `DialogosDeDocumento`), con origen «inicio». Un mensaje de lo que pasó se lee en la barra de estado
  //    del panel que abrió el diálogo (o, desde la «Acción del día», en la nota de la regla), y a ese panel (o al título de la regla) va el foco al guardar (la fila o el punto que lo abrió
  //    ya no existe), 5.17. Al cancelar, el foco vuelve al botón.
  //  - «Abrir el parte diario» cambia la vista a Conductor con el diálogo «Ver como» (`alAbrirParte`, que lo abre el marco). «Probar como conductor» vive en la «Acción del día».
  //  - La entrada de la vista (`entrada.ts`, 15.10) corre una vez por sesión: acá solo se pone `data-entrada` y `data-pausa` en el contenedor; el CSS hace el resto. Una acción que cambia
  //    un dato (renovar un documento) no la vuelve a correr: `empezar` se llama solo al montar la pantalla.
  import { onDestroy } from "svelte";
  import { textoAnuncioAlResolver, textoVerTodasEnLaFlota, TEXTO_INICIO } from "../lib/dominio/textos-inicio.ts";
  import type { AccionDeDocumento, FilaDeConductorSinLicencia } from "../lib/estado/centro-alertas.ts";
  import { aHash } from "../lib/estado/enrutador.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { leerEntradaAlRecorrido } from "../lib/estado/recorrido.ts";
  import { calcularSalida } from "../lib/estado/salida.ts";
  import { aspectoDeAptitud, aspectoDeOperacion, origenDeFueraDeServicio } from "./alertas-aspecto.ts";
  import DialogosDeDocumento from "./DialogosDeDocumento.svelte";
  import { dialogos } from "./dialogos-instancia.ts";
  import { entrada } from "./entrada.ts";
  import type { SituacionDeEntrada } from "./entrada.ts";
  import Boton from "./Boton.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Horizonte from "./Horizonte.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import ReglaDeSalida from "./ReglaDeSalida.svelte";
  import { TEXTO_ALERTAS as T, TEXTO_NOMBRES_DE_LA_REGLA, TEXTO_PIE } from "./textos-marco.ts";

  let {
    alAbrirParte,
    alProbarComoConductor,
  }: {
    /** «Abrir el parte diario»: el marco abre «Ver como» con Conductor ya elegido. */
    alAbrirParte: () => void;
    /** «Probar como conductor» (en la «Acción del día» de la regla de salida): el marco abre «Ver como» con Conductor y este conductor ya elegidos. */
    alProbarComoConductor: (conductorId: string) => void;
  } = $props();

  const ID_REGLA = "titulo-regla";
  const ID_NODISPONIBLES = "titulo-no-disponibles";
  const ID_VENCIMIENTOS = "titulo-vencimientos";
  const ID_OPERACION = "titulo-operacion";

  const c = $derived(app.centroDeAlertas);
  /** La regla de salida: sale de los mismos datos y de las mismas cifras que el resto de Inicio (`null` hasta que termina el arranque). */
  const salida = $derived(c === null || app.estado === null ? null : calcularSalida(app.estado, c, app.hoy));
  /** El número de pieza de cada unidad que no sale (el del globo de su llave): lo comparte la lista «No disponibles hoy». */
  const piezas = $derived(new Map<string, number>(salida === null ? [] : salida.llaves.flatMap((l): [string, number][] => (l.pieza === null ? [] : [[l.unidadId, l.pieza]]))));
  /** El conductor con el parte bloqueado por el seguro vencido de su unidad: de él sale la entrada al recorrido (sin ninguno, no se muestra). Se decide con lo que ya viaja con el marco. */
  const recorrido = $derived(leerEntradaAlRecorrido(app));

  // ---------- Entrada (15.10) ----------
  let situacion = $state<SituacionDeEntrada>({ estado: "completa", pausa: true });
  // `empezar` avisa la situación de ahora enseguida (antes del primer dibujo) y cada cambio después; «Reiniciar demo» la vuelve a pedir sin desmontar la pantalla.
  onDestroy(entrada.empezar("inicio", (nueva) => (situacion = nueva)));

  // ---------- Diálogos ----------
  /** En qué panel se abrió el último diálogo: ahí se dice lo que pasó y a ese título va el foco (los tres comparten el origen «inicio»). «regla» es la «Acción del día». */
  let panelDelDialogo = $state<"regla" | "no-disponibles" | "vencimientos">("vencimientos");
  const mensaje = $derived(dialogos.mensaje("inicio"));
  /** Lo que se dice en la nota de la regla al resolver una pieza: el mensaje del diálogo y la medida nueva. */
  const anuncioDeLaRegla = $derived(panelDelDialogo === "regla" && salida !== null && mensaje.texto !== "" ? textoAnuncioAlResolver(mensaje.texto, salida.disponibles, salida.activas) : "");

  function abrirLicencia(conductor: FilaDeConductorSinLicencia): void {
    panelDelDialogo = "no-disponibles";
    dialogos.abrirLicencia(conductor, "inicio");
  }
  function renovarDesdeLaRegla(accion: AccionDeDocumento): void {
    panelDelDialogo = "vencimientos";
    dialogos.abrirRenovar(accion, "inicio");
  }
  function renovarDesdeLaNota(accion: AccionDeDocumento): void {
    panelDelDialogo = "regla";
    dialogos.abrirRenovar(accion, "inicio");
  }
  function focoDestino(): HTMLElement | null {
    return document.getElementById(panelDelDialogo === "regla" ? ID_REGLA : panelDelDialogo === "no-disponibles" ? ID_NODISPONIBLES : ID_VENCIMIENTOS);
  }

  /** «1 novedad crítica abierta» -> la cifra va grande y el resto al lado. */
  function partirCifra(texto: string): { cifra: string; resto: string } {
    const m = /^(\d+)\s*(.*)$/s.exec(texto);
    return m === null ? { cifra: "", resto: texto } : { cifra: m[1] ?? "", resto: m[2] ?? "" };
  }

  const rotuloDeSolapa = (id: "partes" | "novedades"): string => c?.operacionDiaria.solapas.find((s) => s.id === id)?.rotulo ?? "";
</script>

{#if c !== null && salida !== null}
  {@const n = c.cifras.noDisponibles}
  <div class="pantalla" data-entrada={situacion.estado} data-pausa={situacion.pausa ? "" : undefined}>
    <div class="encabezado">
      <h1 tabindex="-1">{c.titulo}</h1>
      <p class="linea">{c.encabezado.linea}</p>
    </div>

    <!-- 1: la regla de salida. Trae la «Acción del día» (con «Probar como conductor», que antes era una franja aparte) y los cuatro renglones de lectura que reemplazan a las cuatro tarjetas. -->
    <ReglaDeSalida
      {salida}
      idTitulo={ID_REGLA}
      {recorrido}
      alRenovar={renovarDesdeLaNota}
      {alProbarComoConductor}
      estado={anuncioDeLaRegla}
      repetir={mensaje}
    />

    <div class="paneles">
      <!-- 2: No disponibles hoy. -->
      <div class="p-no-disponibles">
        <Panel
          id={ID_NODISPONIBLES}
          titulo={c.protagonista.titulo}
          icono="vencido"
          estado={panelDelDialogo === "no-disponibles" ? mensaje.texto : ""}
          repetir={mensaje}
          sinRelleno
        >
          {#if c.protagonista.items.length > 0}
            <ul class="filas">
              {#each c.protagonista.items as u (u.unidadId)}
                {@const aspecto = aspectoDeAptitud(u.categoria, origenDeFueraDeServicio(u.unidadId))}
                {@const numero = piezas.get(u.unidadId)}
                <li>
                  <a class="fila" data-tono={aspecto.tono} href={u.href}>
                    <!-- El número de pieza: el mismo del globo de su llave y de la «Acción del día». -->
                    {#if numero !== undefined}<span class="globo" data-tono={aspecto.tono}><span class="solo-lectores">{TEXTO_NOMBRES_DE_LA_REGLA.numero(numero)} </span><span aria-hidden="true">{numero}</span></span>{/if}
                    <span class="cuerpo">
                      <span class="linea1">
                        <Patente patente={u.patente} />
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

    <!-- Autoría: en el celular y la tableta el lateral no está y el texto vive en «Más»; acá va una vez, al final y discreta. Desde 64 rem lo dice el lateral. -->
    <p class="autoria">{TEXTO_PIE.autoria}</p>

    <DialogosDeDocumento {focoDestino} />
  </div>
{/if}

<style>
  /* Una pantalla de plano: el encabezado, la regla de salida (con su «Acción del día») y debajo las fichas. Entre piezas, 12 px (15.7: la nota va a 12 px del tablero). */
  .pantalla {
    container: inicio / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  /* La línea de contexto (15.9.1): 13 px en `--c-tinta-2`. */
  .linea {
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }

  .autoria {
    max-width: 46ch;
    padding-block: var(--e-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  @media (min-width: 64rem) {
    .autoria {
      display: none;
    }
  }

  /* ---------- Paneles ---------- */
  .paneles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
    min-width: 0;
    margin-top: var(--e-2);
  }
  .paneles > div {
    min-width: 0;
  }

  @media (min-width: 70rem) {
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

  /* ---------- Filas: la lista de piezas del plano, con el precinto de 6 px de su tono a la izquierda (15.6.5) ---------- */
  .filas > li + li {
    border-top: 1px solid var(--c-borde);
  }
  .fila {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: 3.375rem;
    padding: var(--e-2) var(--e-3) var(--e-2) 1.125rem;
    color: var(--c-texto);
    text-decoration: none;
    transition: background-color var(--m-rapido) linear;
  }
  .fila::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 6px;
    background-image: repeating-linear-gradient(-45deg, var(--tono-r, var(--c-crit-marca)) 0 1.5px, transparent 1.5px 5px);
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

  /* Rótulo del grupo: técnica de 12 px, mayúsculas. */
  .subtitulo {
    padding: var(--e-4) var(--e-4) var(--e-2);
    border-top: 1px solid var(--c-borde);
    font-family: var(--t-mono);
    font-stretch: 100%;
    font-size: var(--t-rotulo);
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-texto-3);
  }
  .conductor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-2) var(--e-4) var(--e-3);
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
  /* La cifra de cada fila es de cartel y de 28 px; solo la crítica lleva el color de su tono (el ámbar no se usa para texto en cifras grandes: la forma y la franja ya lo dicen). */
  .cifra-fila {
    flex: none;
    min-width: 2rem;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-cifra);
    font-size: 1.75rem;
    font-weight: var(--t-peso-cifra);
    line-height: 1;
    text-align: center;
  }
  .fila-operacion[data-tono="critico"] .cifra-fila {
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
     Las filas se apilan: ningún texto parte una palabra (docs/diseno-ui.md, 12). */
  @container inicio (max-width: 17rem) {
    .siguiente {
      display: none;
    }
    .fila {
      padding-inline: calc(var(--e-2) + 6px) var(--e-2);
    }
    .conductor {
      padding-inline: var(--e-2);
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
    .fila {
      border-inline-start: 4px solid CanvasText;
    }
    .fila::before {
      display: none;
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
