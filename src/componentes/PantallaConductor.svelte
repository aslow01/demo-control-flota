<script lang="ts">
  // Inicio del conductor (6.4, `#/conductor`): 1) qué unidad es y qué hay que hacer hoy con el parte, 2) lo pendiente de otros días, 3) su licencia, 4) sus últimos
  // partes. No tiene reglas de negocio: todo lo arma `app.inicioDelConductor(unidadElegida)` (lib/estado/parte.ts).
  //  - Panel «Hoy», en ocho estados (el primero que aplica gana; los decide `inicioDelConductor`): sin unidad (solo el `select`), cerrado («Cerrado a las 18:42» o, si no salió, el
  //    aviso crítico de la revisión con «hasta mañana»; «Ver el parte»), en uso («En uso desde las 06:52» y «Cerrar el parte»), unidad fuera de servicio (aviso: no hace falta parte),
  //    licencia que no ampara hoy (aviso de bloqueo, sin primario y sin «Usar otra unidad»: no cambia nada), «Cerrar antes» (estado 5 bis: aviso semana y «Cerrar el parte anterior»),
  //    borrador («Continuar la revisión» y «Descartar borrador», de dos pasos) y sin parte («Empezar la revisión»). El aviso de «no puede salir» va arriba del botón y el botón sigue (P9).
  //  - Los avisos de dos renglones son el compacto de `Aviso.svelte` (5.18): el hecho en firme y debajo lo que hay que hacer.
  //  - «Usar otra unidad» abre un `select` de las unidades en servicio; elegir una cambia a qué parte lleva el botón (la unidad elegida es estado de esta pantalla).
  //  - «Descartar borrador» no deja otro botón en su lugar: el foco va al título del panel y la barra de estado dice «Borrador descartado.».
  //  - Los paneles «Pendientes» y «Su licencia» existen solo si hay algo que decir.
  import { tick } from "svelte";
  import { TEXTO_INICIO_CONDUCTOR, textoAvisoDeDocumento, textoFraseDelAviso } from "../lib/dominio/textos.ts";
  import { app } from "../lib/estado/instancia.ts";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import Boton from "./Boton.svelte";
  import Campo from "./Campo.svelte";
  import Aviso from "./Aviso.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Forma from "./Forma.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_CONDUCTOR_VISTA as T } from "./textos-marco.ts";

  const uid = $props.id();
  const idHoy = `${uid}-hoy`;
  /** m4 de la etapa 7: el `h1` de «Cerrar antes» lleva la razón en `aria-describedby`, como los resultados C1 y C2. */
  const ID_AVISO_CERRAR_ANTES = `${uid}-aviso-cerrar-antes`;
  const idSelect = `${uid}-unidad`;

  // Lo que eligió con «Usar otra unidad» (`""` = la asignada).
  let seleccion = $state("");
  let mostrandoSelect = $state(false);
  const inicio = $derived(app.inicioDelConductor(seleccion === "" ? null : seleccion));
  // Con «Cerrar antes» (estado 5 bis) el aviso ya lleva a ese parte: «Pendientes» no lo repite (los demás siguen).
  const pendientes = $derived.by(() => {
    if (inicio === null) return [];
    const e = inicio.hoyEstado;
    return e.tipo === "cierre-pendiente" ? inicio.pendientes.filter((p) => p.accion.href !== e.primario.href) : inicio.pendientes;
  });

  // La barra de estado del panel «Hoy» (hoy: «Borrador descartado.»); `n` hace que dos mensajes iguales seguidos se vuelvan a anunciar.
  let mensaje = $state({ texto: "", n: 0 });

  async function mostrarSelect(): Promise<void> {
    // La unidad de hoy parte como elegida solo si está entre las opciones (las que están en servicio); una fuera de servicio no: el `select` quedaría en blanco.
    const actual = inicio?.unidad?.unidadId ?? "";
    seleccion = inicio?.elegirUnidad.opciones.some((o) => o.valor === actual) === true ? actual : "";
    mostrandoSelect = true;
    await tick();
    document.getElementById(idSelect)?.focus();
  }

  // Elegir otra unidad cambia patente, interno, último registro y destino del botón: se dice en la barra de estado del panel.
  function alElegirUnidad(): void {
    const u = inicio?.unidad;
    if (seleccion === "" || u === null || u === undefined) return;
    mensaje = { texto: T.unidadElegida(u.patenteTexto, u.interno), n: mensaje.n + 1 };
  }

  async function descartar(parteId: string): Promise<void> {
    const r = await app.descartarBorradorDeParte(parteId);
    mensaje = { texto: r.mensaje, n: mensaje.n + 1 };
    await tick();
    // El botón que tenía el foco ya no existe: el foco va al título del panel, donde el mensaje se lee.
    document.getElementById(idHoy)?.focus();
  }
</script>

{#if inicio !== null}
  <div class="pantalla">
    <div class="encabezado">
      <h1 tabindex="-1" aria-describedby={inicio.hoyEstado.tipo === "cierre-pendiente" ? ID_AVISO_CERRAR_ANTES : undefined}>{inicio.titulo}</h1>
    </div>

    <!-- Una columna en el celular (primero «Hoy», lo que hay que hacer); desde 64 rem, «Hoy» a la izquierda y lo demás a la derecha. -->
    <div class="cuerpo">
      <div class="col-hoy">
        <Panel id={idHoy} titulo={inicio.hoy.titulo} icono="parte" estado={mensaje.texto} repetir={mensaje.n}>
          {#if inicio.unidad !== null}
            <div class="unidad">
              <p class="identidad">
                <Patente patente={inicio.unidad.patente} tamano="grande" />
                <span class="interno">{inicio.unidad.interno}</span>
              </p>
              <p class="descripcion">{inicio.unidad.descripcion}</p>
              <p class="nota">{inicio.unidad.ultimoRegistro}</p>
            </div>
          {/if}

          {#if inicio.avisoAptitud !== null}
            <Aviso tono="critico" icono="vencido" accion={inicio.avisoAptitud.accion}>{inicio.avisoAptitud.titular}</Aviso>
          {/if}

          {#if inicio.avisoDeUnidad !== null}
            <!-- «Su unidad vence hoy» (o en 7 días o menos): la unidad puede salir, pero el conductor tiene que saberlo. Es un aviso de tarea (tono semana), no de bloqueo; la frase de abajo dice hasta cuándo sale. -->
            {@const au = inicio.avisoDeUnidad}
            {@const frase = textoFraseDelAviso(au.dias)}
            {@const titular = textoAvisoDeDocumento(au.tipoDocumento, au.dias)}
            {#if titular !== null}
              <Aviso tono="semana" icono="reloj" accion={frase ?? ""}>{T.avisoDeUnidad(titular, au.vence)}</Aviso>
            {/if}
          {/if}

          {#if inicio.hoyEstado.tipo === "sin-parte"}
            <!-- Estado 7 (C3): la frase de lo que hay que hacer va arriba del primario. -->
            <p class="nota-estado">{inicio.hoyEstado.texto}</p>
            <div class="accion-principal"><EnlaceAccion href={inicio.hoyEstado.primario.href} variante="primario" tamano="grande">{inicio.hoyEstado.primario.texto}</EnlaceAccion></div>
          {:else if inicio.hoyEstado.tipo === "borrador"}
            {@const b = inicio.hoyEstado}
            <p class="estado-dia">{b.texto}</p>
            <div class="accion-principal"><EnlaceAccion href={b.primario.href} variante="primario" tamano="grande">{b.primario.texto}</EnlaceAccion></div>
            <div class="secundaria">
              <BotonConfirmar variante="texto" texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
            </div>
          {:else if inicio.hoyEstado.tipo === "en-uso"}
            {@const u = inicio.hoyEstado}
            <p class="enviado"><EtiquetaParte tipo="en-uso" texto={u.etiqueta} /></p>
            <p class="nota-estado">{u.texto}</p>
            <div class="accion-principal"><EnlaceAccion href={u.primario.href} variante="primario" tamano="grande">{u.primario.texto}</EnlaceAccion></div>
          {:else if inicio.hoyEstado.tipo === "enviado"}
            {@const e = inicio.hoyEstado}
            {#if e.sinSalida !== null}
              <Aviso tono="critico" icono="octogono"><span class="largo">{e.sinSalida}</span></Aviso>
            {:else}
              <p class="enviado"><EtiquetaParte tipo="cerrado" texto={e.etiqueta} /></p>
            {/if}
            {#if e.hastaManana !== null}<p class="nota-estado">{e.hastaManana}</p>{/if}
            <div class="secundaria"><EnlaceAccion href={e.enlace.href}>{e.enlace.texto}</EnlaceAccion></div>
          {:else if inicio.hoyEstado.tipo === "fuera-de-servicio"}
            <Aviso tono="semana" icono="llave"><span class="largo">{inicio.hoyEstado.aviso}</span></Aviso>
          {:else if inicio.hoyEstado.tipo === "licencia-no-vigente" || inicio.hoyEstado.tipo === "no-puede-salir"}
            <!-- Estados 5 (L1) y 5 ter (P21, la documentación de la unidad): el bloqueo se dice sin rol de alerta (el foco ya fue al h1 y esto es lo primero que se lee en el panel) y sin primario: no se deshabilita nada, se explica. -->
            {@const l = inicio.hoyEstado}
            <Aviso tono="critico" icono="vencido" accion={l.renglon2}>{l.renglon1}</Aviso>
            {#if l.borrador !== null}
              {@const b = l.borrador}
              <p class="estado-dia">{b.texto}</p>
              <div class="secundaria">
                <BotonConfirmar variante="texto" texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
              </div>
            {/if}
          {:else if inicio.hoyEstado.tipo === "cierre-pendiente"}
            <!-- Estado 5 bis, «Cerrar antes» (P18, P20): una tarea pendiente (tono semana, `i-lapiz`), no una prohibición; por eso hay primario. Tampoco es `role="alert"`. -->
            {@const c = inicio.hoyEstado}
            <Aviso tono="semana" icono="lapiz" accion={c.renglon2} idTexto={ID_AVISO_CERRAR_ANTES}>{c.renglon1}</Aviso>
            <div class="accion-principal"><EnlaceAccion href={c.primario.href} variante="primario" tamano="grande">{c.primario.texto}</EnlaceAccion></div>
            {#if c.borrador !== null}
              {@const b = c.borrador}
              <p class="nota-estado">{b.texto}</p>
              <div class="secundaria">
                <BotonConfirmar variante="texto" texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
              </div>
            {/if}
          {:else}
            <p class="estado-dia">{T.sinUnidad}</p>
          {/if}

          {#if inicio.hoyEstado.tipo !== "licencia-no-vigente" && inicio.elegirUnidad.opciones.length > 0}
            {#if inicio.elegirUnidad.modo === "elegir" || mostrandoSelect || seleccion !== ""}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div onchange={alElegirUnidad}>
                <Campo etiqueta={inicio.elegirUnidad.etiqueta} tipo="select" id={idSelect} grande bind:valor={seleccion}>
                  <option value="">{inicio.unidad === null ? T.elegirUna : T.elegirOtra}</option>
                  {#each inicio.elegirUnidad.opciones as o (o.valor)}
                    <option value={o.valor}>{o.etiqueta}</option>
                  {/each}
                </Campo>
              </div>
            {:else}
              <div class="secundaria"><Boton variante="secundario" onclick={mostrarSelect}>{inicio.elegirUnidad.etiqueta}</Boton></div>
            {/if}
          {/if}
        </Panel>
      </div>

      <div class="col-datos">
        {#if pendientes.length > 0}
          <Panel titulo={T.pendientes} icono="alerta" sinRelleno>
            <ul class="pendientes">
              {#each pendientes as p (p.clave)}
                <li class="pendiente">
                  <span class="forma-pendiente"><Forma forma="triangulo" tono="semana" /></span>
                  <p class="texto-pendiente">{p.texto}</p>
                  <EnlaceAccion href={p.accion.href} etiqueta={T.accionPendiente(p.accion.texto, p.texto)}>{p.accion.texto}</EnlaceAccion>
                </li>
              {/each}
            </ul>
          </Panel>
        {/if}

        {#if inicio.licencia !== null}
          {@const l = inicio.licencia}
          <Panel titulo={l.titulo} icono="persona" sinRelleno>
            <div class="licencia" data-tono={l.tono}><Etiqueta tono={l.tono}>{l.texto}</Etiqueta></div>
          </Panel>
        {/if}

        <Panel titulo={inicio.ultimosPartes.titulo} icono="km">
          {#snippet controles()}
            {#if inicio.ultimosPartes.verTodos !== null}
              <!-- «Mis partes» es una pantalla propia (`#/conductor/partes`): el nombre accesible dice a dónde lleva (hay otro «Ver todos» en la página). -->
              <a class="ver-todos" href={inicio.ultimosPartes.verTodos.href} aria-label={TEXTO_INICIO_CONDUCTOR.verTodosPartes.nombre}>
                {TEXTO_INICIO_CONDUCTOR.verTodosPartes.visible}<Icono nombre="flecha" />
              </a>
            {/if}
          {/snippet}
          {#if inicio.ultimosPartes.vacio !== null}
            <p class="vacio"><Icono nombre="guion" />{inicio.ultimosPartes.vacio}</p>
          {:else}
            <ul class="ultimos">
              {#each inicio.ultimosPartes.filas as f (f.parteId)}
                <li>
                  <a class="fila-parte" href={f.href}>
                    <span class="fecha num"><span class="solo-lectores">{T.parteDel}</span>{f.fecha}</span>
                    <span class="patente-fila"><Patente patente={f.patenteTexto.replaceAll(" ", "")} /></span>
                    <span class="recorrido num">{f.recorrido}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </Panel>
      </div>
    </div>
  </div>
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    width: min(100%, var(--ancho-parte));
    min-width: 0;
    margin-inline: auto;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }

  /* Dos columnas desde 64 rem: «Hoy» (620 px como máximo) y lo demás (440 px), arriba alineados y sin estirarse (prototipo aprobado). */
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-5);
    align-items: start;
  }
  .col-hoy,
  .col-datos {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    min-width: 0;
  }
  @media (min-width: 64rem) {
    .pantalla {
      width: min(100%, 67.75rem);
    }
    .cuerpo {
      grid-template-columns: minmax(0, 38.75rem) minmax(0, 27.5rem);
    }
    .accion-principal :global(.enlace-accion) {
      flex: 0 1 26.25rem;
    }
  }

  .unidad {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .identidad {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  .interno {
    font-weight: 650;
  }
  .descripcion {
    overflow-wrap: anywhere;
  }
  .estado-dia {
    font-weight: 600;
  }
  /* Estado 3 (en uso): lo que falta hacer, en letra chica debajo de la etiqueta. */
  .nota-estado {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  /* Estados 5 y 5 bis: los avisos de dos renglones son el compacto de `Aviso.svelte`; sobre el fondo crítico el texto va en `--c-texto` (13,68 en claro, 12,99 en oscuro). */
  .largo {
    overflow-wrap: anywhere;
  }
  .accion-principal {
    display: flex;
  }
  .accion-principal :global(.enlace-accion) {
    flex: 1;
  }
  .secundaria {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  .enviado {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
  }

  /* Pendientes: filas con riel de azufre (hay que atender), la forma, la frase y la acción; con poco ancho la acción baja a su renglón. */
  .pendientes {
    display: flex;
    flex-direction: column;
  }
  .pendiente {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) + 2px);
    box-shadow: inset 4px 0 0 var(--c-semana-r);
  }
  .pendiente + .pendiente {
    border-top: 1px solid var(--c-borde);
  }
  .pendiente :global(.enlace-accion) {
    grid-column: 2;
    justify-self: start;
  }
  .forma-pendiente {
    display: inline-flex;
    align-items: center;
    height: 1.5em;
  }
  .texto-pendiente {
    overflow-wrap: anywhere;
  }
  @media (forced-colors: active) {
    .pendiente {
      border-left: 4px solid CanvasText;
      box-shadow: none;
    }
  }
  @media (min-width: 30rem) {
    .pendiente {
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
    }
    .forma-pendiente {
      height: auto;
    }
    .pendiente :global(.enlace-accion) {
      grid-column: 3;
    }
  }

  /* Su licencia: la etiqueta del tono; con riel del tono si pide atención (lo vigente va sin franja, como en el prototipo). */
  .licencia {
    --riel: var(--tono-r);
    padding: var(--e-3) var(--e-4) var(--e-3) calc(var(--e-4) + 2px);
    box-shadow: inset 4px 0 0 var(--riel);
  }
  .licencia[data-tono="vigente"],
  .licencia[data-tono="neutro"] {
    --riel: transparent;
  }
  @media (forced-colors: active) {
    .licencia {
      border-left: 4px solid CanvasText;
      box-shadow: none;
    }
  }

  .ultimos {
    /* M1 (texto al 200 %): la fila mira el ancho de la lista y no el de la pantalla; con 17 rem o menos pasa a dos renglones. */
    container: partes / inline-size;
    display: flex;
    flex-direction: column;
    margin: calc(-1 * var(--e-2)) 0;
  }
  .ultimos li + li {
    border-top: 1px solid var(--c-borde);
  }
  .fila-parte {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    grid-template-areas: "fecha patente recorrido";
    align-items: center;
    column-gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding-block: var(--e-1);
    color: var(--c-texto);
    text-decoration: none;
  }
  .fila-parte .fecha {
    grid-area: fecha;
    font-weight: 700;
    color: var(--c-acento);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .fila-parte .patente-fila {
    grid-area: patente;
    white-space: nowrap;
  }
  .fila-parte .recorrido {
    grid-area: recorrido;
    color: var(--c-texto-2);
    text-align: right;
  }
  /* El umbral va en rem a propósito: en una consulta de contenedor el rem sigue al tamaño de letra de la raíz. A 360 px con texto normal la lista mide unos 296 px (más que 17 rem = 272 px) y la fila queda en un renglón; con el texto al 200 % se apila. */
  @container partes (max-width: 17rem) {
    .fila-parte {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        "fecha patente"
        "recorrido recorrido";
      row-gap: var(--e-1);
    }
    .fila-parte .recorrido {
      text-align: left;
    }
  }
  /* Desvío de la especificación: al 200 % con 360 px la lista mide unos 9 rem y la fecha más la patente (que no se parte) no entran juntas: tres renglones en vez de dos. */
  @container partes (max-width: 12rem) {
    .fila-parte {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "fecha"
        "patente"
        "recorrido";
      justify-items: start;
    }
  }
  @media (hover: hover) {
    .fila-parte:hover .fecha {
      text-decoration-thickness: 2px;
    }
  }
  /* «Ver todos →» en la barra del panel: enlace de texto con la flecha del prototipo; mide 44 px de alto (blanco táctil) y la flecha no cambia de renglón. */
  .ver-todos {
    --icono-tam: 1rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    min-height: var(--alto-tactil);
    padding-inline: var(--e-2);
    color: var(--c-acento);
    font-weight: 650;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    .ver-todos:hover {
      text-decoration-thickness: 2px;
    }
  }
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    color: var(--c-texto-2);
  }
  .vacio :global(.icono) {
    flex: none;
    color: var(--c-texto-3);
  }

  /* Texto agrandado (va al final: a igual especificidad gana la última regla). C9 y m1 de la etapa 7: con el texto agrandado (el interior mide 17 rem o menos) la patente grande, que no se parte, sale de su caja; pasa a su tamaño chico (5.5). */
  @container interior (max-width: 17rem) {
    .identidad :global(.patente[data-tamano="grande"]) {
      --alto: 1.5rem;
      --relleno: 0.375rem;
      --tam: var(--t-patente-chica);
    }
    .pendiente :global(.enlace-accion) {
      grid-column: 1 / -1;
      padding-inline: var(--e-1);
    }
    .pendiente {
      column-gap: var(--e-2);
      padding-inline: calc(var(--e-1) + 4px) var(--e-1);
    }
    .licencia {
      padding-inline: calc(var(--e-1) + 4px) var(--e-1);
    }
  }
</style>