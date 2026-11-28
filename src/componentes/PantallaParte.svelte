<script lang="ts">
  // Parte diario (6.5, `#/parte/ZK214BD/2026-11-18`): según `leerParte(app)` muestra la revisión antes de salir (A) o el cierre de la jornada (B), ambos con `ParteFormulario`; el parte
  // ya cerrado en lectura (D); el motivo por el que no se puede cargar (E: «No se puede cargar este parte»); o «No se encontró la unidad». No tiene reglas de negocio: todo lo arma `vistaDeParte`
  // (lib/estado/parte.ts).
  //  - El formulario vive dentro de un `{#key}` (unidad, fecha, perfil y paso): al cambiar de parte, de perfil o de paso arranca limpio y su autoguardado se cierra.
  //  - Al enviar, `leerParte(app)` cambia sola (la revisión deja el parte en uso; el cierre lo deja cerrado); esta pantalla se queda en el resultado (C1, C2 o C3, con el `h1` enfocado)
  //    hasta que la persona elige una acción: la vista del resultado es estado de esta pantalla (`recienEnviado`), no de la ruta.
  //  - «Completar el cierre» (C1) lleva a la misma ruta: la dirección no cambia, así que la pantalla suelta el resultado y muestra el cierre (B) con el foco en su `h1`.
  //  - «Descartar borrador» (de dos pasos, botón-texto) en E es la salida (P5). Después el foco va al título y un `role="status"` dice «Borrador descartado.».
  //  - E «Cerrar antes» (P18, P20): en lugar del párrafo de la regla, el aviso compacto en tono semana (una tarea pendiente, no una prohibición) y el primario «Cerrar el parte anterior»;
  //    «Descartar borrador» (si hay) y el enlace de vuelta quedan como botones-texto. Es la única E con primario: la regla tiene un remedio inmediato y es de la misma persona.
  import { tick } from "svelte";
  import { aHash } from "../lib/estado/enrutador.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { leerParte } from "../lib/estado/parte.ts";
  import Aviso from "./Aviso.svelte";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Icono from "./Icono.svelte";
  import ParteEnviado from "./ParteEnviado.svelte";
  import ParteFormulario from "./ParteFormulario.svelte";
  import Patente from "./Patente.svelte";
  import RevisionLeida from "./RevisionLeida.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco-parte.ts";
  import type { PanelParteEnviado } from "./tipos.ts";

  // `titulo` es el de la pestaña (`document.title`) cuando el `h1` no es el nombre de la ruta: el de cada paso («Revisión antes de salir», «Cierre de la jornada»), el de los resultados
  // («Revisión enviada»…), «No se puede cargar este parte» y «No se encontró la unidad». `App.svelte` lo lee con `bind:titulo`; vacío = el de la ruta.
  let { titulo = $bindable("") }: { titulo?: string } = $props();

  const vista = $derived(leerParte(app));
  /** m4 de la etapa 7: el `h1` de la pantalla E «Cerrar antes» lleva la razón en `aria-describedby`, como los resultados C1 y C2. */
  const ID_AVISO_CERRAR_ANTES = "aviso-cerrar-antes";

  // El panel que sale de enviar: se muestra en lugar del formulario hasta que se elige una acción.
  let recienEnviado = $state.raw<PanelParteEnviado | null>(null);
  async function irAlTitulo(): Promise<void> {
    await tick();
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("main h1")?.focus();
  }
  async function alEnviado(panel: PanelParteEnviado): Promise<void> {
    recienEnviado = panel;
    await irAlTitulo();
  }
  // C1 → B: misma ruta, otro contenido. El enlace conserva su dirección (se puede abrir en otra pestaña), pero acá no navega.
  async function completarCierre(evento: MouseEvent): Promise<void> {
    evento.preventDefault();
    recienEnviado = null;
    await irAlTitulo();
  }

  $effect(() => {
    titulo =
      recienEnviado !== null
        ? recienEnviado.titulo
        : vista !== null && (vista.tipo === "no-disponible" || vista.tipo === "no-encontrada" || vista.tipo === "edicion" || vista.tipo === "cierre")
          ? vista.titulo
          : "";
  });

  // «Borrador descartado.» en «No se puede cargar este parte».
  let mensaje = $state("");
  async function descartar(parteId: string): Promise<void> {
    const r = await app.descartarBorradorDeParte(parteId);
    mensaje = r.mensaje;
    await tick();
    document.querySelector<HTMLElement>("main h1")?.focus();
  }
</script>

{#if recienEnviado !== null}
  {@const panel = recienEnviado}
  <div class="pantalla">
    <ParteEnviado {panel} nivel="h1">
      {#snippet acciones()}
        {#if panel.completarCierre !== null && panel.completarCierre.primario}
          <!-- Parte de un día pasado: lo que falta es el cierre; volver al inicio queda como botón-texto. -->
          <EnlaceAccion href={panel.completarCierre.href} variante="primario" tamano="grande" alActivar={completarCierre}>{panel.completarCierre.texto}</EnlaceAccion>
          <EnlaceAccion href={panel.volverAlInicio.href} variante="texto">{panel.volverAlInicio.texto}</EnlaceAccion>
        {:else}
          <EnlaceAccion href={panel.volverAlInicio.href} variante="primario" tamano="grande">{panel.volverAlInicio.texto}</EnlaceAccion>
          {#if panel.completarCierre !== null}
            <EnlaceAccion href={panel.completarCierre.href} variante="texto" alActivar={completarCierre}>{panel.completarCierre.texto}</EnlaceAccion>
          {/if}
        {/if}
      {/snippet}
    </ParteEnviado>
  </div>
{:else if vista !== null}
  {#if vista.tipo === "edicion" || vista.tipo === "cierre"}
    {#key `${vista.unidadId}/${vista.fecha}/${app.perfil.tipo}/${vista.tipo}`}
      <ParteFormulario {vista} {alEnviado} />
    {/key}
  {:else if vista.tipo === "lectura"}
    <div class="pantalla">
      <a class="vuelta" class:repite-barra={app.padre !== null && aHash(app.padre) === vista.vuelta.href} href={vista.vuelta.href}><Icono nombre="flecha-izq" />{vista.vuelta.texto}</a>
      <ParteEnviado panel={vista.panel} nivel="h1" titulo={vista.titulo} etiqueta={vista.etiqueta} momentos={vista.momentos} sinLinea>
        {#snippet encabezado()}
          <div class="unidad">
            <p class="identidad">
              <Patente patente={vista.patente} tamano="grande" />
              <span class="interno">{vista.interno}</span>
            </p>
            <p class="largo">{vista.descripcion}</p>
            <p class="largo">{T.conductorLinea(vista.conductor ?? T.lectura.sinConductor)}</p>
          </div>
        {/snippet}
        {#snippet cuerpo()}
          <section class="revision" aria-labelledby="titulo-revision">
            <h2 id="titulo-revision">{T.lectura.revision}</h2>
            <RevisionLeida revision={{ puntosEnOrden: vista.puntosEnOrden, novedades: vista.novedades }} />
          </section>
        {/snippet}
      </ParteEnviado>
    </div>
  {:else if vista.tipo === "no-disponible" || vista.tipo === "no-encontrada"}
    <!-- E: «No se puede cargar este parte» y «No se encontró la unidad»: h1, el motivo y el camino de vuelta (8: Error). -->
    <div class="pantalla">
      <div class="encabezado">
        <h1 tabindex="-1" aria-describedby={vista.tipo === "no-disponible" && vista.cerrarAntes !== null ? ID_AVISO_CERRAR_ANTES : undefined}>{vista.titulo}</h1>
        {#if vista.tipo === "no-disponible" && vista.cerrarAntes !== null}
          <Aviso tono="semana" icono="lapiz" accion={vista.cerrarAntes.renglon2} idTexto={ID_AVISO_CERRAR_ANTES}>{vista.cerrarAntes.renglon1}</Aviso>
        {:else}
          <p class="parrafo largo" class:bloqueo={vista.tipo === "no-disponible"}>{vista.mensaje}</p>
        {/if}
        {#if vista.tipo === "no-disponible" && vista.nota !== null}<p class="parrafo largo">{vista.nota}</p>{/if}
      </div>
      {#if vista.tipo === "no-disponible" && vista.cerrarAntes !== null}
        <div class="accion-principal"><EnlaceAccion href={vista.cerrarAntes.primario.href} variante="primario" tamano="grande">{vista.cerrarAntes.primario.texto}</EnlaceAccion></div>
      {/if}
      <div class="acciones">
        {#if vista.tipo === "no-disponible" && vista.borrador !== null}
          {@const b = vista.borrador}
          <BotonConfirmar variante="texto" texto={b.descartar} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.parteId)} />
        {/if}
        <EnlaceAccion href={vista.enlace.href} variante={vista.tipo === "no-disponible" && vista.cerrarAntes !== null ? "texto" : "secundario"}>{vista.enlace.texto}</EnlaceAccion>
      </div>
      <p class="nota" role="status">{mensaje}</p>
    </div>
  {/if}
{/if}

<style>
  .pantalla {
    /* Las reglas de texto agrandado de los resultados y de la lectura miden el ancho de esta pantalla (S5 de la etapa 7). */
    container: pagina-parte / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: min(100%, var(--ancho-parte));
    min-width: 0;
    margin-inline: auto;
  }
  /* Desde 64 rem el parte gana ancho (760 px como en el prototipo aprobado). */
  @media (min-width: 64rem) {
    .pantalla {
      width: min(100%, 47.5rem);
    }
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    min-width: 0;
  }
  /* En el celular y la tableta la barra de arriba ya trae el mismo «‹ Atrás»: no se repite. */
  @media (max-width: 63.99rem) {
    .vuelta.repite-barra {
      display: none;
    }
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
  /* Texto agrandado (la pantalla mide 17 rem o menos): la chapa grande, que no se parte, sale de su caja; pasa a su tamaño chico (como en el inicio del conductor). */
  @container pagina-parte (max-width: 17rem) {
    .identidad :global(.patente[data-tamano="grande"]) {
      --alto: 1.5rem;
      --relleno: 0.375rem;
      --tam: var(--t-patente-chica);
    }
  }
  .largo {
    overflow-wrap: anywhere;
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
  }
  /* El primario de «Cerrar antes»: ancho completo con poco ancho; desde 40 rem, el de su texto. */
  .accion-principal {
    display: flex;
  }
  .accion-principal :global(.enlace-accion) {
    flex: 1;
  }
  @media (min-width: 40rem) {
    .accion-principal :global(.enlace-accion) {
      flex: none;
    }
  }
  .encabezado > :global(.aviso) {
    align-self: stretch;
  }
  /* Bloqueado por documento o por licencia (pantalla E, 15.9.6): una ficha sobre la hoja con el precinto crítico de 6 px a la izquierda y el motivo al lado. El texto no va sobre el rayado:
     el relleno izquierdo lo deja libre. */
  .bloqueo {
    position: relative;
    align-self: stretch;
    padding: var(--e-4) var(--e-4) var(--e-4) calc(var(--e-4) + 6px + var(--e-1));
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    color: var(--c-tinta);
  }
  .bloqueo::before {
    content: "";
    position: absolute;
    inset-block: 0;
    left: 0;
    width: 6px;
    background-image: repeating-linear-gradient(-45deg, var(--c-crit-marca) 0 1.5px, transparent 1.5px 7px);
  }
  @media (forced-colors: active) {
    .bloqueo::before {
      background-image: repeating-linear-gradient(-45deg, CanvasText 0 1.5px, transparent 1.5px 7px);
    }
  }
  /* Con el texto agrandado (la pantalla mide 17 rem o menos): menos relleno, para que el motivo conserve el ancho. */
  @container pagina-parte (max-width: 17rem) {
    .bloqueo {
      padding-inline: calc(6px + var(--e-1)) var(--e-2);
    }
  }

  /* La revisión de la unidad, dentro de la hoja de lectura: separada de los datos por un filete de 1,5 px en tinta (15.9.6). */
  .revision {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding-top: var(--e-4);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .revision h2 {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-h2);
    font-weight: var(--t-peso-cartel);
    line-height: 1.1;
  }
</style>
