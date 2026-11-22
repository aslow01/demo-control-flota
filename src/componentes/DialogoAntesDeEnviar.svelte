<script lang="ts">
  // Diálogo «Antes de enviar» (5.17): el paso está completo pero hay avisos que conviene leer antes de seguir. En la revisión (`paso="revision"`) son K6 y P9 (solo documentos de la
  // unidad); en el cierre (`paso="cierre"`), K7. Nunca hay una advertencia por la licencia: la licencia bloquea (L1). Cada aviso va con su ícono y su tono (crítico para la
  // documentación vencida, semana para los kilómetros inusuales). «Enviar de todos modos» (revisión) o «Cerrar de todos modos» (cierre) acepta esos avisos; «Volver al parte» cierra el diálogo y devuelve
  // el foco al botón de la barra de envío. No tiene reglas: la lista y los tonos los arma `app.enviarRevisionDeParte` o `app.enviarCierreDeParte`.
  //  - Foco al abrir: «Volver al parte» (el diálogo no tiene campos; enviar no es lo que se pide por defecto).
  //  - Enviando: el botón queda con aria-disabled y no repite el pedido; el texto «Enviando…» («Cerrando…» en el cierre) aparece solo si tarda más de 200 ms (5.19). No se puede cerrar mientras tanto.
  import type { AdvertenciaDeEnvio } from "../lib/estado/app.svelte.ts";
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    advertencias,
    enviando = false,
    mostrarEnviando = false,
    paso = "revision",
    alEnviarIgual,
    focoDestino,
  }: {
    abierto?: boolean;
    advertencias: readonly AdvertenciaDeEnvio[];
    enviando?: boolean;
    /** «Enviando…» en el botón (recién cuando tarda). */
    mostrarEnviando?: boolean;
    /** Qué paso del parte se está enviando: cambia la frase de arriba y el nombre del primario. */
    paso?: "revision" | "cierre";
    alEnviarIgual: () => void;
    focoDestino?: () => HTMLElement | null;
  } = $props();

  const uid = $props.id();
  const idIntro = `${uid}-intro`;
</script>

<Dialogo titulo={T.antesDeEnviar.titulo} bind:abierto bloqueado={enviando} cancelar={T.antesDeEnviar.volver} focoInicial="cancelar" descripcionId={idIntro} {focoDestino}>
  <p id={idIntro}>{paso === "cierre" ? T.antesDeEnviar.introCierre : T.antesDeEnviar.introRevision}</p>
  <ul class="avisos">
    {#each advertencias as a (a.tipo)}
      <li class="aviso" data-tono={a.tono}>
        <span class="icono-aviso"><Icono nombre={a.tono === "critico" ? "vencido" : "alerta"} /></span>
        <span class="texto">{a.texto}</span>
      </li>
    {/each}
  </ul>
  {#snippet pie()}
    <Boton cargando={enviando} onclick={alEnviarIgual}>
      {#if paso === "cierre"}{mostrarEnviando ? T.cerrando : T.antesDeEnviar.cerrarDeTodosModos}{:else}{mostrarEnviando ? T.enviando : T.antesDeEnviar.enviarDeTodosModos}{/if}
    </Boton>
  {/snippet}
</Dialogo>

<style>
  .avisos {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .aviso {
    display: flex;
    align-items: flex-start;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4);
    background: var(--tono-f);
    border: 1px solid transparent;
    border-left: 4px solid var(--tono-r);
    border-radius: var(--r-2);
    line-height: 1.5;
  }
  @container dialogo (max-width: 17rem) {
    .aviso {
      flex-wrap: wrap;
      gap: var(--e-1) var(--e-2);
      padding: var(--e-2);
    }
    .texto {
      flex: 1 1 7rem;
    }
  }
  /* 320 px con el texto agrandado (el diálogo mide 10 rem): otro escalón menos de relleno, para que «documentación» (7 rem) entre entera. */
  @container dialogo (max-width: 10.5rem) {
    .aviso {
      padding-inline: var(--e-1);
    }
  }
  .icono-aviso {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: none;
    margin-top: 0.1875rem;
    color: var(--tono-t);
  }
  .texto {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
