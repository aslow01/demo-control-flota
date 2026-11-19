<script lang="ts">
  // Parte diario (6.5, `#/parte/ZK214BD/2026-11-18`): según `app.parteDeLaRuta` muestra el formulario para completar (`ParteFormulario`), el parte ya enviado en lectura, el
  // motivo por el que no se puede cargar («No se puede cargar este parte») o «No se encontró la unidad». No tiene reglas de negocio: todo lo arma `vistaDeParte` (lib/estado/parte.ts).
  //  - El formulario vive dentro de un `{#key}` (unidad, fecha y perfil): al cambiar de parte o de perfil arranca limpio y su autoguardado se cierra.
  //  - Al enviar, `app.parteDeLaRuta` pasa a «lectura» por sí sola; esta pantalla se queda en «Parte enviado» (el `h1` recibe el foco) hasta que la persona elige «Volver al
  //    inicio»: la vista del resultado es estado de esta pantalla (`recienEnviado`), no de la ruta.
  //  - «Descartar borrador» (de dos pasos) en «No se puede cargar este parte»: es la salida (P5). Después el foco va al título y un `role="status"` dice «Borrador descartado.».
  import { tick } from "svelte";
  import { app } from "../lib/estado/instancia.ts";
  import type { PanelParteEnviado } from "../lib/estado/parte.ts";
  import BotonConfirmar from "./BotonConfirmar.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import ParteEnviado from "./ParteEnviado.svelte";
  import ParteFormulario from "./ParteFormulario.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  const vista = $derived(app.parteDeLaRuta);

  // El panel que sale de enviar: se muestra en lugar del formulario hasta que se vuelve al inicio.
  let recienEnviado = $state.raw<PanelParteEnviado | null>(null);
  async function alEnviado(panel: PanelParteEnviado): Promise<void> {
    recienEnviado = panel;
    await tick();
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("main h1")?.focus();
  }

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
  <div class="pantalla">
    <div class="solo-angosto"><EtiquetaDemo /></div>
    <ParteEnviado panel={recienEnviado} nivel="h1">
      {#snippet acciones()}
        <EnlaceAccion href={recienEnviado?.volverAlInicio.href ?? "#/"} variante="primario" tamano="grande">{recienEnviado?.volverAlInicio.texto ?? ""}</EnlaceAccion>
      {/snippet}
    </ParteEnviado>
  </div>
{:else if vista !== null}
  {#if vista.tipo === "edicion"}
    {#key `${vista.unidadId}/${vista.fecha}/${app.perfil.tipo}`}
      <ParteFormulario {vista} {alEnviado} />
    {/key}
  {:else if vista.tipo === "lectura"}
    <div class="pantalla">
      <a class="vuelta" href={vista.vuelta.href}><Icono nombre="flecha-izq" />{vista.vuelta.texto}</a>
      <header class="encabezado">
        <div class="solo-angosto"><EtiquetaDemo /></div>
        <h1 tabindex="-1">{vista.titulo}</h1>
        <p class="identidad">
          <Patente patente={vista.patente} tamano="grande" />
          <span class="interno">{vista.interno}</span>
        </p>
        <p class="largo">{vista.descripcion}</p>
        <p class="largo">{T.conductorLinea(vista.conductor ?? T.lectura.sinConductor)}</p>
      </header>

      <ParteEnviado panel={vista.panel} />

      <section class="revision" aria-labelledby="titulo-revision">
        <h2 id="titulo-revision">{T.lectura.revision}</h2>
        {#if vista.puntosEnOrden !== null}
          <p class="en-orden"><span class="icono-orden"><Icono nombre="check" /></span><span>{vista.puntosEnOrden}</span></p>
        {/if}
        {#if vista.novedades.length > 0}
          <ul class="novedades">
            {#each vista.novedades as n (n.rotulo + n.texto)}
              <li class="novedad" data-tono={n.critica ? "critico" : "semana"}>
                <span class="icono-novedad"><Icono nombre={n.critica ? "octogono" : "alerta"} /></span>
                <p>
                  <strong>{n.rotulo}{#if n.critica} ({T.lectura.critica}){/if}:</strong>
                  {n.texto}
                </p>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  {:else}
    <!-- «No se puede cargar este parte» y «No se encontró la unidad»: h1, el motivo y el camino de vuelta (8: Error). -->
    <div class="pantalla">
      <div class="encabezado">
        <div class="solo-angosto"><EtiquetaDemo /></div>
        <h1 tabindex="-1">{vista.titulo}</h1>
        <p class="parrafo largo">{vista.mensaje}</p>
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

  .revision {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-radius: var(--r-3);
    box-shadow: var(--s-ventana);
  }
  @media (min-width: 40rem) {
    .revision {
      padding: var(--e-5);
    }
  }
  .revision h2 {
    font-size: var(--t-h3);
    line-height: 1.3;
  }
  .en-orden {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    overflow-wrap: anywhere;
  }
  .icono-orden {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--c-vigente-t);
  }
  .novedades {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .novedad {
    display: flex;
    align-items: flex-start;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4);
    background: var(--tono-f);
    border: 1px solid transparent;
    border-left: 4px solid var(--tono-r);
    border-radius: var(--r-2);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .icono-novedad {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--tono-t);
  }
</style>
