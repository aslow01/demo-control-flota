<script lang="ts">
  // Inicio del conductor (6.4, `#/conductor`): 1) qué unidad es y qué hay que hacer hoy con el parte, 2) lo pendiente de otros días, 3) su licencia, 4) sus últimos
  // partes. No tiene reglas de negocio: todo lo arma `leerInicioDelConductor(app, unidadElegida)` (lib/estado/conductor.ts, que se baja con esta pantalla).
  //  - Panel «Hoy», en ocho estados (el primero que aplica gana; los decide `inicioDelConductor`): sin unidad (solo el `select`), cerrado («Cerrado a las 18:42» o, si no salió, el
  //    aviso crítico de la revisión con «hasta mañana»; «Ver el parte»), en uso («En uso desde las 06:52» y «Cerrar el parte»), unidad fuera de servicio (aviso: no hace falta parte),
  //    licencia que no ampara hoy (aviso de bloqueo, sin primario y sin «Usar otra unidad»: no cambia nada), «Cerrar antes» (estado 5 bis: aviso semana y «Cerrar el parte anterior»),
  //    borrador («Continuar la revisión» y «Descartar borrador», de dos pasos) y sin parte («Empezar la revisión»). El aviso de «no puede salir» va arriba del botón y el botón sigue (P9).
  //  - Los avisos de dos renglones son el compacto de `Aviso.svelte` (5.18): el hecho en firme y debajo lo que hay que hacer.
  //  - «Usar otra unidad» abre un `select` de las unidades en servicio; elegir una cambia a qué parte lleva el botón (la unidad elegida es estado de esta pantalla).
  //  - «Descartar borrador» no deja otro botón en su lugar: el foco va al título del panel y la barra de estado dice «Borrador descartado.».
  //  - Los paneles «Pendientes» y «Su licencia» existen solo si hay algo que decir.
  import { onDestroy, tick } from "svelte";
  import { TEXTO_INICIO_CONDUCTOR, textoAvisoDeDocumento, textoFraseDelAviso } from "../lib/dominio/textos-conductor.ts";
  import { leerInicioDelConductor } from "../lib/estado/conductor.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { veredictoDelDia } from "../lib/estado/veredicto.ts";
  import { entrada } from "./entrada.ts";
  import type { SituacionDeEntrada } from "./entrada.ts";
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
  import { TEXTO_CONDUCTOR_VISTA as T } from "./textos-marco-parte.ts";

  const uid = $props.id();
  const idHoy = `${uid}-hoy`;
  /** m4 de la etapa 7: el `h1` de «Cerrar antes» lleva la razón en `aria-describedby`, como los resultados C1 y C2. */
  const ID_AVISO_CERRAR_ANTES = `${uid}-aviso-cerrar-antes`;
  const idSelect = `${uid}-unidad`;

  // Entrada de la vista (15.10): una vez por sesión; acá solo se pone `data-entrada` y `data-pausa` y el CSS hace el resto.
  let situacion = $state<SituacionDeEntrada>({ estado: "completa", pausa: true });
  onDestroy(entrada.empezar("conductor", (nueva) => (situacion = nueva)));

  // Lo que eligió con «Usar otra unidad» (`""` = la asignada).
  let seleccion = $state("");
  let mostrandoSelect = $state(false);
  const inicio = $derived(leerInicioDelConductor(app, seleccion === "" ? null : seleccion));
  // El veredicto de la llave (15.8, DE3): sale del estado del día; con el aviso de «no puede salir» arriba del botón (P9) no puede decir «sale». `null` sin unidad asignada.
  const veredicto = $derived(inicio === null ? null : veredictoDelDia(inicio.hoyEstado, inicio.avisoAptitud !== null));
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
  /** El motivo de «no puede salir» sin su remate «La unidad no puede salir.»: el veredicto del pie de la llave («No puede salir hoy») ya lo dice y repetirlo es ruido (T17). El texto de dominio no cambia. */
  const sinElRemate = (motivo: string): string => motivo.replace(/ La unidad no puede salir.$/, "");

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
  <div class="pantalla" data-entrada={situacion.estado} data-pausa={situacion.pausa ? "" : undefined}>
    <div class="encabezado">
      <h1 tabindex="-1" aria-describedby={inicio.hoyEstado.tipo === "cierre-pendiente" ? ID_AVISO_CERRAR_ANTES : undefined}>{inicio.titulo}</h1>
    </div>

    <!-- Una columna en el celular (primero «Hoy», lo que hay que hacer); desde 64 rem, «Hoy» a la izquierda y lo demás a la derecha. -->
    <div class="cuerpo">
      <div class="col-hoy">
        <Panel id={idHoy} titulo={inicio.hoy.titulo} icono="parte" estado={mensaje.texto} repetir={mensaje.n}>
          {#if inicio.unidad !== null}
            <!-- La llave (15.8): un objeto de papel que cuelga de un gancho; la chapa grande, los datos y, en el pie, el veredicto. `.objeto` va en el cuerpo dibujado. -->
            <div class="unidad">
              <div class="llave objeto" data-veredicto={veredicto?.tipo} data-corto={veredicto !== null && veredicto.texto.length <= 12 ? "" : undefined} data-largo={veredicto !== null && veredicto.texto.length > 20 ? "" : undefined}>
                <p class="chapa"><Patente patente={inicio.unidad.patente} tamano="grande" /></p>
                <p class="datos"><span class="interno">{inicio.unidad.interno}</span><span class="separador" aria-hidden="true">{" · "}</span><span class="descripcion">{inicio.unidad.descripcion}</span></p>
                <p class="nota">{inicio.unidad.ultimoRegistro}</p>
                <!-- El veredicto (15.8): un párrafo, no una región viva; está escrito desde el primer cuadro y a la vista en el pie de la llave. -->
                {#if veredicto !== null}
                  <p class="veredicto" data-veredicto={veredicto.tipo}>
                    <span class="marca">{#if veredicto.tipo === "sale"}<Icono nombre="circulo-check" />{:else if veredicto.tipo === "no-sale"}<Icono nombre="rombo-alerta" />{:else}<Forma forma="triangulo" tono="semana" />{/if}</span><span class="texto-veredicto">{veredicto.texto}</span>
                  </p>
                {/if}
              </div>
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
            <!-- «En uso desde las 06:52» ya es el veredicto de la llave: la etiqueta de abajo no se repite. -->
            {#if veredicto?.texto !== u.etiqueta}<p class="enviado"><EtiquetaParte tipo="en-uso" texto={u.etiqueta} /></p>{/if}
            <p class="nota-estado">{u.texto}</p>
            <div class="accion-principal"><EnlaceAccion href={u.primario.href} variante="primario" tamano="grande">{u.primario.texto}</EnlaceAccion></div>
          {:else if inicio.hoyEstado.tipo === "enviado"}
            {@const e = inicio.hoyEstado}
            {#if e.sinSalida !== null}
              <Aviso tono="critico" icono="octogono"><span class="largo">{e.sinSalida}</span></Aviso>
            {:else if veredicto?.texto !== e.etiqueta}
              <!-- Con «Cerrado a las 18:42» como veredicto la etiqueta no se repite abajo. -->
              <p class="enviado"><EtiquetaParte tipo="cerrado" texto={e.etiqueta} /></p>
            {/if}
            {#if e.hastaManana !== null}<p class="nota-estado">{e.hastaManana}</p>{/if}
            <div class="secundaria"><EnlaceAccion href={e.enlace.href}>{e.enlace.texto}</EnlaceAccion></div>
          {:else if inicio.hoyEstado.tipo === "fuera-de-servicio"}
            <Aviso tono="semana" icono="llave"><span class="largo">{inicio.hoyEstado.aviso}</span></Aviso>
          {:else if inicio.hoyEstado.tipo === "licencia-no-vigente" || inicio.hoyEstado.tipo === "no-puede-salir"}
            <!-- Estados 5 (L1) y 5 ter (P21, la documentación de la unidad): el bloqueo se dice sin rol de alerta (el foco ya fue al h1 y esto es lo primero que se lee en el panel) y sin primario: no se deshabilita nada, se explica. -->
            {@const l = inicio.hoyEstado}
            <Aviso tono="critico" icono="vencido" accion={l.renglon2}>{sinElRemate(l.renglon1)}</Aviso>
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

  /* ---------- La llave de Hoy (15.8) ----------
     Un objeto de papel que cuelga de un gancho de 3 px: borde de 2 px, esquinas de 6 px arriba y de 22 px abajo, agujero de 12 px. Adentro, la chapa grande (franja de 12 px), el interno
     con la descripción y el último registro (13 px, centrados) y, en el pie y separado por un filete de 1,5 px, el veredicto en cartel. Mide como mucho 24 rem y va centrada. */
  .unidad {
    position: relative;
    width: min(100%, 24rem);
    min-width: 0;
    margin-inline: auto;
    padding-top: 1rem;
  }
  .unidad::before {
    content: "";
    position: absolute;
    top: 0;
    left: calc(50% - 1.5px);
    width: 3px;
    height: 1.75rem;
    background: var(--c-tinta);
  }
  .llave {
    container: llave / inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-1);
    padding-top: 2.125rem;
    overflow: hidden;
    background: var(--obj-hoja);
    border: var(--b-caja) solid var(--obj-tinta);
    border-radius: 6px 6px 22px 22px;
    box-shadow: 0 16px 26px -14px rgb(0 0 0 / 0.55);
    transform-origin: 50% -1rem;
  }
  /* El agujero de la argolla. */
  .llave::before {
    content: "";
    position: absolute;
    top: 0.625rem;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    background: var(--obj-papel);
    border: var(--b-control) solid var(--obj-tinta);
    border-radius: var(--r-redondo);
  }
  .chapa {
    margin-bottom: var(--e-1);
  }
  /* La chapa es la de siempre con el tamaño de la llave: letra de 28 px (34 desde 22,5 rem) y franja de 12 px. */
  .chapa :global(.patente[data-tamano="grande"]) {
    --tam: var(--t-patente-llave);
    --banda: 12px;
    padding: calc(var(--banda) + 0.25rem) 0.875rem 0.25rem;
  }
  .datos,
  .nota {
    padding-inline: var(--e-4);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-tinta-2);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .interno {
    font-weight: 650;
    color: var(--c-tinta);
  }
  .nota {
    padding-bottom: var(--e-3);
  }

  /* El veredicto: cartel a 75 % (peso 780), 60 px; con más de una palabra o los «no sale», 46 px en dos renglones (`text-wrap: balance`). Marca de 42 px (36 por debajo de 23,75 rem). */
  .veredicto {
    --marca: 2.625rem;
    --separacion: var(--e-3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--separacion);
    align-self: stretch;
    min-width: 0;
    padding: var(--e-3) var(--e-4) var(--e-4);
    border-top: var(--b-fuerte) solid var(--obj-tinta);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-cifra);
    font-weight: var(--t-peso-cifra);
    font-size: var(--t-veredicto-2);
    line-height: 0.86;
    color: var(--obj-tinta);
  }
  .llave[data-corto] .veredicto {
    /* «Puede salir» nunca en dos renglones: 60 px, y si el ancho de la llave no alcanza, baja con él. */
    font-size: min(var(--t-veredicto), 17cqi);
    white-space: nowrap;
  }
  /* «En uso desde las 06:52» lleva la hora: con tres renglones de 46 px la llave se alarga de más; baja a 36 px y queda en dos. */
  .llave[data-largo] .veredicto {
    font-size: 2.25rem;
  }
  .marca {
    --icono-tam: var(--marca);
    display: inline-flex;
    flex: none;
  }
  .texto-veredicto {
    min-width: 0;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }
  /* El triángulo de «Cierre pendiente» es de tinta (no del tono): no es un bloqueo. */
  .marca :global(.forma) {
    width: var(--marca);
    height: var(--marca);
    background: var(--obj-tinta);
  }
  @media (max-width: 23.74rem) {
    .veredicto {
      --marca: 2.25rem;
      --separacion: var(--e-2);
    }
  }
  /* No sale: el texto y la marca en rojo, la llave con borde del relleno crítico y, al pie, el precinto de 10 px. */
  .llave[data-veredicto="no-sale"] {
    border-color: var(--obj-crit-relleno);
  }
  .llave[data-veredicto="no-sale"] .veredicto {
    padding-bottom: calc(var(--e-4) + 10px);
    color: var(--obj-crit);
  }
  .llave[data-veredicto="no-sale"]::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 10px;
    background: var(--obj-crit-relleno) repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.22) 0 2px, transparent 2px 7px);
  }

  /* Entrada (15.10), solo con `data-entrada="completa"`: la llave se balancea una vez desde su gancho y, cuando para, el veredicto se estampa. Una pieza por vez; el estado final es el de arriba. */
  :global([data-entrada="completa"]) .llave {
    animation: balanceo 520ms var(--m-curva-resorte);
  }
  :global([data-entrada="completa"]) .veredicto {
    animation: estampa 380ms var(--m-curva) 520ms backwards;
  }
  :global([data-pausa]) .llave,
  :global([data-pausa]) .veredicto {
    animation-play-state: paused;
  }
  @keyframes balanceo {
    0% {
      transform: rotate(0deg);
    }
    20% {
      transform: rotate(4deg);
    }
    60% {
      transform: rotate(-3deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
  @keyframes estampa {
    from {
      opacity: 0;
      transform: scale(1.18) rotate(-2.5deg);
    }
  }
  @media (forced-colors: active) {
    .llave {
      forced-color-adjust: none;
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }
    .veredicto {
      color: CanvasText;
    }
    .llave[data-veredicto="no-sale"]::after {
      background: CanvasText;
    }
  }

  .estado-dia {
    font-weight: 600;
  }
  /* Estado 3 (en uso): lo que falta hacer, en letra chica. */
  .nota-estado {
    font-size: var(--t-chico);
    color: var(--c-tinta-2);
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
    .chapa :global(.patente[data-tamano="grande"]) {
      --tam: var(--t-patente-chica);
      --banda: 6px;
      padding-inline: 0.375rem;
    }
    .unidad {
      width: 100%;
    }
    .datos,
    .nota,
    .veredicto {
      padding-inline: var(--e-2);
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