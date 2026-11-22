<script lang="ts">
  // 4.2 Barra de la aplicación (fondo de superficie, borde inferior, 52 px): navegación por pestañas-enlace a la izquierda y
  // selector de perfil a la derecha (a menos de 40 rem, en una fila propia debajo de la navegación: así el orden visual es el del foco).
  // Con perfil Conductor el selector lleva además «{nombre} (persona ficticia) · Cambiar» a su lado: hasta 48 rem la fila del selector también va debajo, para que la barra
  // de una sola fila (52 px) solo exista cuando todo entra.
  //  - Encargado: "Alertas" (con insignia de alertas críticas) · "Flota".  Conductor: "Parte diario".
  //  - Pestaña activa: aria-current="page" (la sección que contiene la pantalla actual lleva aria-current="true").
  // Los enlaces son del enrutador por hash: no hay clics que interceptar.
  import { textoInsigniaAlertas } from "../lib/dominio/textos.ts";
  import SelectorPerfil from "./SelectorPerfil.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";
  import type { SeccionActiva } from "./tipos.ts";

  let {
    perfil,
    seccion,
    seccionContieneLaPantalla = false,
    criticas,
    nombreConductor,
    alElegirPerfil,
    alCambiarConductor,
  }: {
    perfil: "encargado" | "conductor";
    /** La pestaña que corresponde a la pantalla actual. */
    seccion: SeccionActiva;
    /** `true` si la pantalla actual está dentro de la sección pero no es su inicio (la ficha de una unidad, un parte). */
    seccionContieneLaPantalla?: boolean;
    /** Alertas críticas (insignia de "Alertas"); con 0 no hay insignia. */
    criticas: number;
    nombreConductor?: string;
    alElegirPerfil: (tipo: "encargado" | "conductor") => void;
    alCambiarConductor?: () => void;
  } = $props();

  const pestanas = $derived(
    perfil === "encargado"
      ? [
          { id: "alertas", texto: TEXTO_MARCO.pestanaAlertas, href: "#/alertas" },
          { id: "flota", texto: TEXTO_MARCO.pestanaFlota, href: "#/flota" },
        ]
      : [{ id: "conductor", texto: TEXTO_MARCO.pestanaParteDeHoy, href: "#/conductor" }],
  );

  function actual(id: string): "page" | "true" | undefined {
    if (seccion !== id) return undefined;
    return seccionContieneLaPantalla ? "true" : "page";
  }
</script>

<div class="barra-app">
  <div class="interior contenedor" class:con-conductor={nombreConductor !== undefined}>
    <nav aria-label={TEXTO_MARCO.navegacionSecciones}>
      <ul>
        {#each pestanas as p (p.id)}
          <li>
            <a
              class="pestana"
              href={p.href}
              aria-current={actual(p.id)}
              aria-label={p.id === "alertas" && criticas > 0 ? textoInsigniaAlertas(criticas) : undefined}
            >
              {p.texto}
              {#if p.id === "alertas" && criticas > 0}
                <span class="insignia num" data-tono="critico" aria-hidden="true">{criticas}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <div class="perfil">
      <SelectorPerfil tipo={perfil} {nombreConductor} alElegir={alElegirPerfil} {alCambiarConductor} />
    </div>
  </div>
</div>

<style>
  .barra-app {
    background: var(--c-superficie);
    border-bottom: 1px solid var(--c-borde);
  }
  .interior {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: space-between;
    gap: 0 var(--e-4);
  }
  /* La pestaña llena el alto de la barra (aunque el selector lleve una segunda línea) y su línea inferior queda en el borde. */
  nav,
  nav ul,
  nav li {
    display: flex;
  }
  .pestana {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: 3.25rem;
    padding: 0 var(--e-4);
    color: var(--c-texto-2);
    text-decoration: none;
  }
  .pestana[aria-current] {
    box-shadow: inset 0 -3px 0 var(--c-acento);
    color: var(--c-texto);
    font-weight: 600;
  }
  .pestana:focus-visible {
    outline-offset: -2px;
  }
  @media (hover: hover) {
    .pestana:hover {
      background: var(--c-superficie-2);
      color: var(--c-texto);
      text-decoration: none;
    }
  }
  .insignia {
    display: inline-block;
    min-width: 1.25rem;
    padding: 0 0.375rem;
    background: var(--tono-f);
    border: 1px solid transparent;
    border-radius: var(--r-1);
    color: var(--tono-t);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.25rem;
    text-align: center;
  }

  .perfil {
    align-self: center;
    padding-block: var(--e-2);
  }
  /* Menos de 40 rem: el selector va en una fila propia a todo el ancho, debajo de las pestañas (el orden visual es el del foco). */
  @media (max-width: 39.99rem) {
    .perfil {
      flex: 1 0 100%;
      border-top: 1px solid var(--c-borde);
    }
    nav {
      flex: 1 0 100%;
    }
  }
  /* Con el nombre del conductor al lado, el selector necesita unos 33 rem: hasta 48 rem baja a su fila. */
  @media (max-width: 47.99rem) {
    .con-conductor .perfil {
      flex: 1 0 100%;
      border-top: 1px solid var(--c-borde);
    }
    .con-conductor nav {
      flex: 1 0 100%;
    }
  }

  @media (forced-colors: active) {
    .pestana[aria-current] {
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-underline-offset: 6px;
    }
  }
</style>
