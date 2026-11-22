<script lang="ts">
  // Inicio del conductor (6.4, `#/conductor`): 1) qué unidad es y qué hay que hacer hoy con el parte, 2) lo pendiente de otros días, 3) su licencia, 4) sus últimos
  // partes. No tiene reglas de negocio: todo lo arma `app.inicioDelConductor(unidadElegida)` (lib/estado/parte.ts).
  //  - Panel «Hoy», en siete estados (el primero que aplica gana; los decide `inicioDelConductor`): sin unidad (solo el `select`), cerrado («Cerrado a las 18:42» o, si no salió, el
  //    aviso crítico de la revisión; «Ver el parte»), en uso («En uso desde las 06:52» y «Cerrar el parte»), unidad fuera de servicio (aviso: no hace falta parte), licencia que no
  //    ampara hoy (aviso de bloqueo, sin primario y sin «Usar otra unidad»: no cambia nada), borrador («Continuar la revisión» y «Descartar borrador», de dos pasos) y sin parte
  //    («Empezar la revisión»). El aviso de «no puede salir» va arriba del botón y el botón sigue (P9).
  //  - «Usar otra unidad» abre un `select` de las unidades en servicio; elegir una cambia a qué parte lleva el botón (la unidad elegida es estado de esta pantalla).
  //  - «Descartar borrador» no deja otro botón en su lugar: el foco va al título del panel y la barra de estado dice «Borrador descartado.».
  //  - Los paneles «Pendientes» y «Su licencia» existen solo si hay algo que decir.
  import { tick } from "svelte";
  import { app } from "../lib/estado/instancia.ts";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import Boton from "./Boton.svelte";
  import Campo from "./Campo.svelte";
  import Aviso from "./Aviso.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_CONDUCTOR_VISTA as T } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  const uid = $props.id();
  const idHoy = `${uid}-hoy`;
  const idSelect = `${uid}-unidad`;

  // Lo que eligió con «Usar otra unidad» (`""` = la asignada).
  let seleccion = $state("");
  let mostrandoSelect = $state(false);
  const inicio = $derived(app.inicioDelConductor(seleccion === "" ? null : seleccion));

  // La barra de estado del panel «Hoy» (hoy: «Borrador descartado.»); `n` hace que dos mensajes iguales seguidos se vuelvan a anunciar.
  let mensaje = $state({ texto: "", n: 0 });

  const ICONO_LICENCIA: Record<Tono, NombreIcono> = {
    critico: "vencido",
    semana: "alerta",
    quincena: "calendario",
    mes: "anillo",
    vigente: "check",
    neutro: "anillo",
  };

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
      <div class="solo-angosto"><EtiquetaDemo /></div>
      <h1 tabindex="-1">{inicio.titulo}</h1>
    </div>

    <Panel id={idHoy} titulo={inicio.hoy.titulo} icono="parte" estado={mensaje.texto} repetir={mensaje.n}>
      {#if inicio.unidad !== null}
        <div class="unidad">
          <p class="identidad">
            <Patente patente={inicio.unidad.patente} tamano="grande" />
            <span class="interno">{inicio.unidad.interno}</span>
          </p>
          <p class="descripcion">{inicio.unidad.descripcion}</p>
          <p class="nota num">{inicio.unidad.ultimoRegistro}</p>
        </div>
      {/if}

      {#if inicio.avisoAptitud !== null}
        <Aviso tono="critico" icono="vencido">{inicio.avisoAptitud}</Aviso>
      {/if}

      {#if inicio.hoyEstado.tipo === "sin-parte"}
        <div class="accion-principal"><EnlaceAccion href={inicio.hoyEstado.primario.href} variante="primario" tamano="grande">{inicio.hoyEstado.primario.texto}</EnlaceAccion></div>
      {:else if inicio.hoyEstado.tipo === "borrador"}
        {@const b = inicio.hoyEstado}
        <p class="estado-dia">{b.texto}</p>
        <div class="accion-principal"><EnlaceAccion href={b.primario.href} variante="primario" tamano="grande">{b.primario.texto}</EnlaceAccion></div>
        <div class="secundaria">
          <BotonConfirmar texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
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
        <div class="secundaria"><EnlaceAccion href={e.enlace.href}>{e.enlace.texto}</EnlaceAccion></div>
      {:else if inicio.hoyEstado.tipo === "fuera-de-servicio"}
        <Aviso tono="semana" icono="llave"><span class="largo">{inicio.hoyEstado.aviso}</span></Aviso>
      {:else if inicio.hoyEstado.tipo === "licencia-no-vigente"}
        <!-- Estado 5 (L1): el bloqueo se dice sin rol de alerta (el foco ya fue al h1 y esto es lo primero que se lee en el panel) y sin primario: no se deshabilita nada, se explica. -->
        {@const l = inicio.hoyEstado}
        <Aviso tono="critico" icono="vencido">
          <p class="bloqueo-1 largo">{l.renglon1}</p>
          <p class="bloqueo-2 largo">{l.renglon2}</p>
        </Aviso>
        {#if l.borrador !== null}
          {@const b = l.borrador}
          <p class="estado-dia">{b.texto}</p>
          <div class="secundaria">
            <BotonConfirmar texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
          </div>
        {/if}
      {:else if inicio.hoyEstado.tipo === "cierre-pendiente"}
        <!-- Estado 5b (A1), ajuste mínimo de la lógica: el maquetador le da su forma final. -->
        {@const c = inicio.hoyEstado}
        <p class="estado-dia">{c.texto}</p>
        <div class="accion-principal"><EnlaceAccion href={c.primario.href} variante="primario" tamano="grande">{c.primario.texto}</EnlaceAccion></div>
        {#if c.borrador !== null}
          {@const b = c.borrador}
          <div class="secundaria">
            <BotonConfirmar texto={b.descartar.texto} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.descartar.parteId)} />
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
              <option value="">{inicio.unidad === null || inicio.hoyEstado.tipo === "fuera-de-servicio" ? T.elegirOtra : inicio.elegirUnidad.etiqueta}</option>
              {#each inicio.elegirUnidad.opciones as o (o.valor)}
                <option value={o.valor}>{o.etiqueta}</option>
              {/each}
            </Campo>
          </div>
        {:else}
          <div class="secundaria"><Boton variante="texto" onclick={mostrarSelect}>{inicio.elegirUnidad.etiqueta}</Boton></div>
        {/if}
      {/if}
    </Panel>

    {#if inicio.pendientes.length > 0}
      <Panel titulo={T.pendientes} icono="alerta">
        <ul class="pendientes">
          {#each inicio.pendientes as p (p.clave)}
            <li class="pendiente">
              <span class="icono-pendiente"><Icono nombre={p.tipo === "sin-parte" ? "guion" : "lapiz"} /></span>
              <p class="texto-pendiente">{p.texto}</p>
              <EnlaceAccion href={p.accion.href} etiqueta={T.accionPendiente(p.accion.texto, p.texto)}>{p.accion.texto}</EnlaceAccion>
            </li>
          {/each}
        </ul>
      </Panel>
    {/if}

    {#if inicio.licencia !== null}
      {@const l = inicio.licencia}
      <Panel titulo={l.titulo} icono="persona">
        <p class="licencia" data-tono={l.tono}><span class="icono-licencia"><Icono nombre={ICONO_LICENCIA[l.tono]} /></span><span>{l.texto}</span></p>
      </Panel>
    {/if}

    <Panel titulo={inicio.ultimosPartes.titulo} icono="km">
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
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
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
    font-weight: 600;
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
  /* Estado 5 (L1): renglón 1 firme, renglón 2 más chico. Sobre el fondo crítico, el texto va en `--c-texto` (13,68 en claro, 12,99 en oscuro). */
  .bloqueo-1 {
    font-weight: 600;
  }
  .bloqueo-2 {
    font-size: var(--t-chico);
    line-height: 1.4;
  }
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

  /* Pendientes: ícono, la frase y la acción; con poco ancho la acción baja a su renglón. */
  .pendientes {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .pendiente {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: var(--e-2) var(--e-3);
  }
  .pendiente :global(.enlace-accion) {
    grid-column: 2;
    justify-self: start;
  }
  .icono-pendiente {
    --icono-tam: 1.125rem;
    display: inline-flex;
    margin-top: 0.125rem;
    color: var(--c-semana-t);
  }
  .texto-pendiente {
    overflow-wrap: anywhere;
  }
  @media (min-width: 30rem) {
    .pendiente {
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
    }
    .pendiente :global(.enlace-accion) {
      grid-column: 3;
    }
  }

  .licencia {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-weight: 600;
  }
  .icono-licencia {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--tono-t);
  }

  .ultimos {
    display: flex;
    flex-direction: column;
    margin: calc(-1 * var(--e-2)) 0;
  }
  .ultimos li + li {
    border-top: 1px solid var(--c-borde);
  }
  .fila-parte {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding-block: var(--e-1);
    color: var(--c-texto);
    text-decoration: none;
  }
  .fila-parte .fecha {
    font-weight: 600;
    color: var(--c-acento);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .fila-parte .recorrido {
    color: var(--c-texto-2);
    text-align: right;
  }
  @media (hover: hover) {
    .fila-parte:hover .fecha {
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
</style>
