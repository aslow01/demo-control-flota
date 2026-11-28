<script lang="ts">
  // Control «Apariencia» (docs/diseno-ui.md, 15.4.5): el tema (claro, oscuro o automático) y «Sin animaciones». Vive solo en la pantalla «Más» (DE7, 28/11/2026: sale del lateral, así no pesa
  // en la carga inicial). Su título NO empieza con «Ver como» (una prueba de punta a punta busca ese nombre).
  //  - Tema: tres radios nativos dentro de un `fieldset` con su `legend` (las flechas mueven entre opciones sin código propio). «Automático» es el de por defecto y sigue al dispositivo.
  //  - «Sin animaciones»: un botón con `aria-pressed`; el texto no cambia al apretarlo.
  // Las dos preferencias las guarda y aplica `lib/estado/preferencias.ts` (`data-modo` y `data-movimiento` en <html>, y `theme-color`); acá solo se leen y se cambian. Si `localStorage` no está
  // disponible los controles funcionan igual (la preferencia dura la sesión), sin error. El estilo está en el `<style>` de este archivo (T10).
  import { onDestroy } from "svelte";
  import { preferenciasDelNavegador, type Tema } from "../lib/estado/preferencias.ts";
  import Icono from "./Icono.svelte";
  import { TEXTO_APARIENCIA as T } from "./textos-marco.ts";
  import type { NombreIcono } from "./tipos.ts";

  const control = preferenciasDelNavegador();
  let preferencias = $state(control.leer());
  // Si hay otro control de «Apariencia» montado, los dos se mantienen iguales.
  onDestroy(control.alCambiar((p) => (preferencias = p)));

  const uid = $props.id();
  const idTitulo = `${uid}-titulo`;
  const TEMAS: { valor: Tema; texto: string; icono: NombreIcono }[] = [
    { valor: "claro", texto: T.tema.claro, icono: "tema-claro" },
    { valor: "oscuro", texto: T.tema.oscuro, icono: "tema-oscuro" },
    { valor: "automatico", texto: T.tema.automatico, icono: "tema-auto" },
  ];
</script>

<section class="apariencia" aria-labelledby={idTitulo}>
  <h2 class="rotulo" id={idTitulo}>{T.titulo}</h2>
  <fieldset class="tema">
    <legend>{T.tema.leyenda}</legend>
    {#each TEMAS as t (t.valor)}
      <label class="opcion">
        <input type="radio" name="{uid}-tema" value={t.valor} checked={preferencias.tema === t.valor} onchange={() => control.cambiarTema(t.valor)} />
        <Icono nombre={t.icono} /><span>{t.texto}</span>
      </label>
    {/each}
  </fieldset>
  <p class="apariencia-nota">{T.notaAutomatico}</p>
  <button type="button" class="sin-anim" aria-pressed={preferencias.sinAnimaciones} onclick={() => control.cambiarSinAnimaciones(!preferencias.sinAnimaciones)}>
    <Icono nombre="quieto" />{T.sinAnimaciones}
  </button>
</section>

<style>
  /* Control «Apariencia» (15.4.5) en «Más»: una ficha con el tema (segmentado de tres radios nativos) y «Sin animaciones». 44 px de alto en todo. */
  .apariencia {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-4);
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .rotulo {
    color: var(--c-tinta-2);
  }
  .tema {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.375rem;
    max-width: 30rem;
  }
  legend {
    grid-column: 1 / -1;
    margin-bottom: var(--e-2);
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    font-weight: 600;
  }
  .opcion {
    --icono-tam: 1.125rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding-inline: var(--e-2);
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-control);
    border-radius: var(--r-1);
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }
  /* En el celular «Automático» no entra al lado del ícono: el ícono va arriba y la palabra, entera, abajo. */
  @media (max-width: 29.99rem) {
    .opcion {
      flex-direction: column;
      gap: var(--e-1);
      padding-block: var(--e-2);
    }
  }
  /* El radio nativo cubre toda la caja (se hace clic en ella y el lector lo anuncia), sin dibujarse. */
  .opcion input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .opcion:has(input:focus-visible) {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }
  @media (hover: hover) {
    .opcion:hover {
      background: var(--c-papel-2);
      border-color: var(--c-tinta);
      color: var(--c-tinta);
    }
  }
  .opcion:has(input:checked),
  .opcion:has(input:checked):hover {
    background: var(--c-pleno);
    border-color: var(--c-pleno);
    color: var(--c-sobre-pleno);
  }
  .apariencia-nota {
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  /* «Sin animaciones»: una marca cuadrada antes del texto (vacía sin apretar, llena apretado) para que el estado no dependa del color. */
  .sin-anim {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    max-width: 100%;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding-inline: var(--e-4);
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-tinta);
    border-radius: var(--r-1);
    box-shadow: var(--s-dura) var(--c-tinta);
    color: var(--c-tinta);
    font-size: 0.875rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .sin-anim::before {
    content: "";
    flex: none;
    width: 0.625rem;
    height: 0.625rem;
    border: var(--b-control) solid currentColor;
  }
  /* La marca ya dice el estado: el ícono `quieto` del sprite no se dibuja acá. */
  .sin-anim :global(.icono) {
    display: none;
  }
  @media (hover: hover) {
    .sin-anim:hover {
      background: var(--c-papel-2);
    }
  }
  .sin-anim:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .sin-anim[aria-pressed="true"] {
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  .sin-anim[aria-pressed="true"]::before {
    background: currentColor;
  }
  @media (hover: hover) {
    .sin-anim[aria-pressed="true"]:hover {
      background: var(--c-tinta-hover);
    }
  }

  /* Colores forzados: los fondos y la sombra desaparecen, así que el estado no puede depender de ellos (ni el radio, que está sin dibujar). La opción elegida lleva un borde grueso, el color de
     selección del sistema y el texto subrayado; «Sin animaciones» llena o vacía su marca cuadrada con el color del texto del botón y suma el borde grueso al apretarlo. */
  @media (forced-colors: active) {
    .opcion {
      forced-color-adjust: none;
      background: Canvas;
      border-color: ButtonText;
      color: ButtonText;
    }
    .opcion:has(input:checked),
    .opcion:has(input:checked):hover {
      background: Highlight;
      border: 4px solid ButtonText;
      color: HighlightText;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 0.25rem;
    }
    .opcion:has(input:focus-visible) {
      outline-color: Highlight;
    }
    .sin-anim {
      forced-color-adjust: none;
      background: ButtonFace;
      border-color: ButtonText;
      color: ButtonText;
    }
    .sin-anim::before {
      background: Canvas;
    }
    .sin-anim[aria-pressed="true"],
    .sin-anim[aria-pressed="true"]:hover {
      background: Highlight;
      border-width: 4px;
      color: HighlightText;
    }
    .sin-anim[aria-pressed="true"]::before {
      background: HighlightText;
    }
  }
</style>
