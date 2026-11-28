<script lang="ts">
  // Pantalla «Más» (`#/mas`, la ven los dos perfiles): lo que antes colgaba de la barra superior. «Ver como» (el perfil de ahora y cómo cambiarlo), «La demo»
  // («Cómo funciona», «Reiniciar demo», volver al portafolio), «Apariencia» (tema y «Sin animaciones»; solo vive acá, DE7) y el texto del pie. Los diálogos los abre quien la usa (`App.svelte`).
  import { NOMBRES_DE_PANTALLA } from "../lib/dominio/textos-base.ts";
  import Apariencia from "./Apariencia.svelte";
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

  <section class="ficha" aria-labelledby="mas-ver-como">
    <h2 class="rotulo" id="mas-ver-como">{T.verComo.titulo}</h2>
    <div class="fila perfil">
      <p class="datos">
        <strong>{perfil}</strong>
        <span>{descripcionDelPerfil}</span>
        <span>{T.verComo.ayuda}</span>
      </p>
      <Boton variante="secundario" aria-haspopup="dialog" onclick={alCambiarPerfil}>{T.verComo.cambiarPerfil}</Boton>
    </div>
  </section>

  <Apariencia />

  <section class="ficha" aria-labelledby="mas-la-demo">
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
  /* «Más» en Pie de rey (15.9.9): tres fichas en una columna de 40 rem («Ver como», «Apariencia», «La demo») y la autoría al pie. Misma ficha que `Panel` y `Apariencia`: hoja lisa,
     contorno fino y cabeza de 1,5 px en tinta. Los renglones miden 60 px (44 como mínimo) y el rótulo de cada ficha va en técnica, como el de «Apariencia». */
  .mas {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    width: 100%;
    max-width: 40rem;
  }
  h1 {
    margin-bottom: var(--e-2);
  }

  .ficha {
    display: flex;
    flex-direction: column;
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .rotulo {
    padding: var(--e-4) var(--e-4) var(--e-3);
    color: var(--c-tinta-2);
  }

  /* Los renglones se separan con un filete entero; el primero también, para cerrar la cabeza. */
  .lista {
    border-top: 1px solid var(--c-filete);
  }
  li + li {
    border-top: 1px solid var(--c-filete);
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
    color: var(--c-tinta);
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
      background: var(--c-papel-2);
      text-decoration: none;
    }
  }
  button.fila:active,
  a.fila:active {
    background: var(--c-papel-2);
  }
  .perfil {
    flex-wrap: wrap;
    border-top: 1px solid var(--c-filete);
    cursor: default;
  }
  /* Por debajo de 30 rem el botón baja entero a su renglón: más fácil de pulsar con el pulgar y sin quedar a medias. */
  @media (max-width: 29.99rem) {
    .perfil > :global(.boton) {
      flex: 1 1 100%;
    }
  }
  .datos {
    display: flex;
    flex: 1 1 14rem;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }
  /* El nombre del renglón va en la letra de texto (el cartel queda para el h1 y las cifras). */
  .datos strong {
    font-size: var(--t-cuerpo);
    font-weight: var(--t-peso-fuerte);
    line-height: 1.3;
  }
  .perfil .datos strong {
    font-size: 1.0625rem;
  }
  .datos span {
    color: var(--c-tinta-2);
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
  .fila > :global(.icono) {
    flex: none;
    color: var(--c-tinta-3);
  }
  @media (hover: hover) {
    .fila:hover > :global(.icono) {
      color: var(--c-tinta);
    }
  }

  .pie {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    max-width: 62ch;
    padding-top: var(--e-3);
    border-top: 1px solid var(--c-filete);
  }

  /* Colores forzados: el fondo del cursor encima desaparece, así que el renglón lleva un contorno del color de selección. */
  @media (forced-colors: active) {
    .ficha {
      border-top-width: 3px;
    }
    button.fila:hover,
    a.fila:hover {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
