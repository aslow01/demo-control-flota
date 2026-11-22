<script lang="ts">
  // Parte diario (6.5, `#/parte/ZK214BD/2026-11-18`): según `app.parteDeLaRuta` muestra la revisión antes de salir (A) o el cierre de la jornada (B), ambos con `ParteFormulario`; el parte
  // ya cerrado en lectura (D); el motivo por el que no se puede cargar (E: «No se puede cargar este parte»); o «No se encontró la unidad». No tiene reglas de negocio: todo lo arma `vistaDeParte`
  // (lib/estado/parte.ts).
  //  - El formulario vive dentro de un `{#key}` (unidad, fecha, perfil y paso): al cambiar de parte, de perfil o de paso arranca limpio y su autoguardado se cierra.
  //  - Al enviar, `app.parteDeLaRuta` cambia sola (la revisión deja el parte en uso; el cierre lo deja cerrado); esta pantalla se queda en el resultado (C1, C2 o C3, con el `h1` enfocado)
  //    hasta que la persona elige una acción: la vista del resultado es estado de esta pantalla (`recienEnviado`), no de la ruta.
  //  - «Completar el cierre» (C1) lleva a la misma ruta: la dirección no cambia, así que la pantalla suelta el resultado y muestra el cierre (B) con el foco en su `h1`.
  //  - «Descartar borrador» (de dos pasos) en E es la salida (P5). Después el foco va al título y un `role="status"` dice «Borrador descartado.».
  import { tick } from "svelte";
  import { app } from "../lib/estado/instancia.ts";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import ParteEnviado from "./ParteEnviado.svelte";
  import ParteFormulario from "./ParteFormulario.svelte";
  import Patente from "./Patente.svelte";
  import RevisionLeida from "./RevisionLeida.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";
  import type { PanelParteEnviado } from "./tipos.ts";

  // `titulo` es el de la pestaña (`document.title`) cuando el `h1` no es el nombre de la ruta: el de cada paso («Revisión antes de salir», «Cierre de la jornada»), el de los resultados
  // («Revisión enviada»…), «No se puede cargar este parte» y «No se encontró la unidad». `App.svelte` lo lee con `bind:titulo`; vacío = el de la ruta.
  let { titulo = $bindable("") }: { titulo?: string } = $props();

  const vista = $derived(app.parteDeLaRuta);

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
    <div class="solo-angosto"><EtiquetaDemo /></div>
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
      <a class="vuelta" href={vista.vuelta.href}><Icono nombre="flecha-izq" />{vista.vuelta.texto}</a>
      <div class="solo-angosto"><EtiquetaDemo /></div>
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
        <div class="solo-angosto"><EtiquetaDemo /></div>
        <h1 tabindex="-1">{vista.titulo}</h1>
        <p class="parrafo largo">{vista.mensaje}</p>
        {#if vista.tipo === "no-disponible" && vista.nota !== null}<p class="parrafo largo">{vista.nota}</p>{/if}
      </div>
      <div class="acciones">
        {#if vista.tipo === "no-disponible" && vista.borrador !== null}
          {@const b = vista.borrador}
          <BotonConfirmar texto={b.descartar} textoConfirmar={T.confirmarDescartar} alConfirmar={() => descartar(b.parteId)} />
        {/if}
        <EnlaceAccion href={vista.enlace.href}>{vista.enlace.texto}</EnlaceAccion>
      </div>
      <p class="nota" role="status">{mensaje}</p>
    </div>
  {/if}
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: min(100%, var(--ancho-parte));
    min-width: 0;
    margin-inline: auto;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    min-width: 0;
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
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
    font-weight: 600;
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

  /* La revisión de la unidad, dentro del panel de lectura: separada de los datos por una línea. */
  .revision {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding-top: var(--e-4);
    border-top: 1px solid var(--c-borde);
  }
  .revision h2 {
    font-size: var(--t-h3);
    line-height: 1.3;
  }
</style>
