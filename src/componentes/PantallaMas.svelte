<script lang="ts">
  // Pantalla «Más» (`#/mas`, la ven los dos perfiles): lo que antes colgaba de la barra superior. «Ver como» (el perfil de ahora y cómo cambiarlo), «La demo»
  // («Cómo funciona», «Reiniciar demo», volver al portafolio) y el texto del pie. Los diálogos los abre quien la usa (`App.svelte`).
  import { NOMBRES_DE_PANTALLA } from "../lib/dominio/textos.ts";
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_MAS, TEXTO_PIE, URL_PORTAFOLIO } from "./textos-marco.ts";

  let {
    perfil,
    descripcionDelPerfil,
    alCambiarPerfil,
    alComoFunciona,
    alReiniciar,
  }: {
    /** «Encargado» o «Conductor». */
    perfil: string;
    /** «Inicio, movilidades, …» o «Tamara Olivera (persona ficticia) · unidad ZK 214 BD». */
    descripcionDelPerfil: string;
    alCambiarPerfil: () => void;
    alComoFunciona: () => void;
    alReiniciar: () => void;
  } = $props();

  const T = TEXTO_MAS;
</script>

<div class="mas">
  <h1 tabindex="-1">{NOMBRES_DE_PANTALLA.mas}</h1>

  <section aria-labelledby="mas-ver-como">
    <h2 class="rotulo" id="mas-ver-como">{T.verComo.titulo}</h2>
    <div class="lista">
      <div class="fila perfil">
        <p class="datos">
          <strong>{perfil}</strong>
          <span>{descripcionDelPerfil}</span>
          <span>{T.verComo.ayuda}</span>
        </p>
        <Boton variante="secundario" aria-haspopup="dialog" onclick={alCambiarPerfil}>{T.verComo.cambiarPerfil}</Boton>
      </div>
    </div>
  </section>

  <section aria-labelledby="mas-la-demo">
    <h2 class="rotulo" id="mas-la-demo">{T.laDemo.titulo}</h2>
    <ul class="lista">
      <li>
        <button type="button" class="fila" onclick={alComoFunciona}>
          <span class="datos"><strong>{T.laDemo.comoFunciona.rotulo}</strong><span>{T.laDemo.comoFunciona.ayuda}</span></span>
          <Icono nombre="chevron" />
        </button>
      </li>
      <li>
        <button type="button" class="fila" onclick={alReiniciar}>
          <span class="datos"><strong>{T.laDemo.reiniciar.rotulo}</strong><span>{T.laDemo.reiniciar.ayuda}</span></span>
          <Icono nombre="chevron" />
        </button>
      </li>
      <li>
        <a class="fila" href={URL_PORTAFOLIO}>
          <span class="datos"><strong>{T.laDemo.portafolio.rotulo}</strong><span>{T.laDemo.portafolio.ayuda}</span></span>
          <Icono nombre="flecha" />
        </a>
      </li>
    </ul>
  </section>

  <div class="pie nota">
    <p>{TEXTO_PIE.datos}</p>
    <p>{TEXTO_PIE.autoria}</p>
  </div>
</div>

<style>
  .mas {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    width: 100%;
    max-width: 47.5rem;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .rotulo {
    color: var(--c-texto-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-weight: 700;
  }

  .lista {
    overflow: hidden;
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-3);
  }
  li + li {
    border-top: 1px solid var(--c-borde);
  }
  .fila {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-4);
    width: 100%;
    min-height: 3.75rem;
    padding: var(--e-3) var(--e-4);
    border: 0;
    background: none;
    color: var(--c-texto);
    font: inherit;
    text-align: left;
    text-decoration: none;
  }
  button.fila,
  a.fila {
    cursor: pointer;
  }
  .fila:focus-visible {
    outline-offset: -3px;
  }
  @media (hover: hover) {
    button.fila:hover,
    a.fila:hover {
      background: var(--c-superficie-2);
      text-decoration: none;
    }
  }
  .perfil {
    flex-wrap: wrap;
    cursor: default;
  }
  .datos {
    display: flex;
    flex: 1 1 14rem;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }
  .datos strong {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.1875rem;
    font-weight: 650;
    line-height: 1.25;
  }
  .datos span {
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
  }
  .fila > :global(.icono) {
    color: var(--c-texto-2);
  }

  .pie {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    max-width: 62ch;
  }
</style>
