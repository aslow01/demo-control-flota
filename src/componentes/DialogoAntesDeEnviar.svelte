<script lang="ts">
  // Diálogo «Antes de enviar» (5.17): el parte está completo pero hay avisos (K6, K7, P9) que conviene leer antes de enviarlo. Cada aviso va con su ícono y su tono (crítico
  // para la documentación vencida, semana para los kilómetros inusuales). «Enviar igual» manda el parte aceptando esos avisos; «Volver al parte» lo cierra y devuelve
  // el foco al botón «Enviar parte». No tiene reglas: la lista y los tonos los arma `app.enviarParte`.
  //  - Foco al abrir: «Volver al parte» (el diálogo no tiene campos; enviar no es lo que se pide por defecto).
  //  - Enviando: el botón queda con aria-disabled y no repite el pedido; el texto «Enviando…» aparece solo si tarda más de 200 ms (5.19). No se puede cerrar mientras tanto.
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
    alEnviarIgual,
    focoDestino,
  }: {
    abierto?: boolean;
    advertencias: readonly AdvertenciaDeEnvio[];
    enviando?: boolean;
    /** «Enviando…» en el botón (recién cuando tarda). */
    mostrarEnviando?: boolean;
    alEnviarIgual: () => void;
    focoDestino?: () => HTMLElement | null;
  } = $props();

  const uid = $props.id();
  const idIntro = `${uid}-intro`;
</script>

<Dialogo titulo={T.antesDeEnviar.titulo} bind:abierto bloqueado={enviando} cancelar={T.antesDeEnviar.volver} focoInicial="cancelar" descripcionId={idIntro} {focoDestino}>
  <p id={idIntro}>{T.antesDeEnviar.intro}</p>
  <ul class="avisos">
    {#each advertencias as a (a.tipo)}
      <li class="aviso" data-tono={a.tono}>
        <span class="icono-aviso"><Icono nombre={a.tono === "critico" ? "vencido" : "alerta"} /></span>
        <span class="texto">{a.texto}</span>
      </li>
    {/each}
  </ul>
  {#snippet pie()}
    <Boton cargando={enviando} onclick={alEnviarIgual}>{mostrarEnviando ? T.enviando : T.antesDeEnviar.enviarIgual}</Boton>
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
