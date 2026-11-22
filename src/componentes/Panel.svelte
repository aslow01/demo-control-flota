<script lang="ts">
  // 5.4 Panel: barra de título (identifica) · herramientas (actúan, opcionales) · interior · barra de estado (informa).
  // Sin plegar y sin `overflow: hidden` (cortaría los anillos de foco). El marco nunca cambia de color por el estado de los datos.
  //
  // - `titulo` es un h2 con tabindex="-1": la pantalla que abre un diálogo lo pasa como `focoDestino` del diálogo para que el foco
  //   vuelva ahí si el botón que lo abrió desapareció (5.17; el diálogo solo conoce el h1 de la página). Su id se puede fijar con `id`.
  // - `estado` es el texto de la barra de estado (role="status"). La región existe siempre, vacía mide 0 y el mensaje
  //   no desaparece solo: lo reemplaza la acción siguiente.
  //   Para que un lector de pantalla lo diga, el texto entra a la región unos 80 ms después de pedirlo (nunca nace junto con ella) y, si ya
  //   había uno, se vacía antes: así también se anuncia el segundo «Novedad cargada.» igual al primero. `repetir` es cualquier valor que
  //   cambie cada vez que la pantalla emite un mensaje (aunque el texto sea el mismo). La barra no se achica entre uno y otro.
  // - `contenidoEstado` (opcional) pone en su lugar un contenido fijo con un control adentro ("Así lo carga el conductor: Abrir el parte diario"):
  //   al no ser un mensaje que cambia, esa barra no es `role="status"`.
  // - El interior es un contenedor de consultas (`interior`) para que las tablas cambien de disposición por su ancho.
  import type { Snippet } from "svelte";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Icono from "./Icono.svelte";
  import type { NombreIcono } from "./tipos.ts";

  let {
    titulo,
    id,
    icono,
    meta = "",
    estado = "",
    repetir,
    contenidoEstado,
    herramientas,
    controles,
    children,
  }: {
    titulo: string;
    id?: string;
    icono?: NombreIcono;
    /** Dato breve, a la derecha del título: "11 vencimientos". */
    meta?: string;
    estado?: string;
    /** Cambia cada vez que se emite un mensaje, aunque el texto sea el mismo (así se vuelve a anunciar). */
    repetir?: unknown;
    contenidoEstado?: Snippet;
    herramientas?: Snippet;
    controles?: Snippet;
    children: Snippet;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(id ?? `${uid}-titulo`);

  const anunciado = textoAnunciado(() => ({ texto: estado, repetir }));
</script>

<section class="panel" aria-labelledby={idTitulo}>
  <div class="barra" class:con-icono={icono !== undefined}>
    {#if icono !== undefined}
      <span class="icono-titulo"><Icono nombre={icono} /></span>
    {/if}
    <h2 id={idTitulo} tabindex="-1">{titulo}</h2>
    {#if meta !== ""}
      <span class="meta">{meta}</span>
    {/if}
    {#if controles !== undefined}
      <div class="controles">{@render controles()}</div>
    {/if}
  </div>
  {#if herramientas !== undefined}
    <div class="herramientas">{@render herramientas()}</div>
  {/if}
  <div class="interior">{@render children()}</div>
  {#if contenidoEstado !== undefined}
    <div class="estado">{@render contenidoEstado()}</div>
  {:else}
    <div class="estado" class:vacio={estado === ""} role="status"><span>{anunciado.valor}</span></div>
  {/if}
</section>

<style>
  .panel {
    container: panel / inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-radius: var(--r-3);
    box-shadow: var(--s-ventana);
  }
  /* Activo (foco adentro): orientación, no información. Sin hover. */
  .panel:focus-within {
    border-color: var(--c-borde-fuerte);
  }
  .panel:focus-within > .barra {
    box-shadow: inset 0 2px 0 var(--c-acento);
  }

  /* ---------- Barra de título ---------- */
  .barra {
    --sangria: 0rem; /* el dato que baja a su renglón se alinea con el título: con ícono, queda corrido su ancho */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    min-height: 2.75rem;
    padding: 0 var(--e-1) 0 var(--e-3);
    background: var(--c-ventana-barra);
    border-bottom: 1px solid var(--c-borde);
    border-radius: calc(var(--r-3) - 1px) calc(var(--r-3) - 1px) 0 0;
  }
  .barra.con-icono {
    --sangria: calc(1.25rem + var(--e-2));
  }
  .icono-titulo {
    display: inline-flex;
    flex: none;
    color: var(--c-acento);
  }
  h2 {
    flex: 0 1 auto;
    min-width: 0;
    padding-block: var(--e-2);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }
  .meta {
    margin-left: var(--e-1);
    padding-left: var(--e-3);
    border-left: 1px solid var(--c-borde-fuerte);
    font-size: var(--t-chico);
    line-height: 1rem;
    color: var(--c-texto-2);
    font-variant-numeric: tabular-nums lining-nums;
  }
  .controles {
    display: flex;
    align-items: center;
    margin-left: auto;
  }
  /* Contenedor angosto: el dato baja a un renglón propio, alineado con el título. */
  @container panel (max-width: 23.99rem) {
    .meta {
      order: 2;
      flex: 1 0 100%;
      margin: 0;
      padding: 0 0 var(--e-2) var(--sangria);
      border-left: 0;
    }
  }

  /* ---------- Herramientas (filtros, búsqueda, orden) ---------- */
  .herramientas {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
    min-height: 3.5rem;
    padding: var(--e-2) var(--e-3);
    background: var(--c-superficie);
    border-bottom: 1px solid var(--c-borde);
  }

  /* ---------- Interior ---------- */
  .interior {
    container: interior / inline-size;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    padding: var(--e-3);
  }
  @media (min-width: 40rem) {
    .herramientas {
      padding-inline: var(--e-4);
    }
    .interior {
      padding: var(--e-4);
    }
  }
  @media (min-width: 68.75rem) {
    .herramientas {
      padding-inline: var(--e-5);
    }
    .interior {
      padding: var(--e-5);
    }
  }

  /* ---------- Barra de estado ----------
     Siempre en el DOM (las regiones role="status" tienen que existir antes del texto). Vacía mide 0. */
  .estado {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-4);
    min-height: 2.5rem;
    padding: var(--e-2) var(--e-3);
    background: var(--c-ventana-barra);
    border-top: 1px solid var(--c-borde);
    border-radius: 0 0 calc(var(--r-3) - 1px) calc(var(--r-3) - 1px);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto);
  }
  .estado.vacio {
    min-height: 0;
    padding-block: 0;
    border-top-width: 0;
    background: transparent;
  }
  @media (min-width: 40rem) {
    .estado {
      padding-inline: var(--e-4);
    }
  }
  @media (min-width: 68.75rem) {
    .estado {
      padding-inline: var(--e-5);
    }
  }
  /* Texto agrandado (el panel mide 17 rem o menos): el relleno del interior y de las barras baja, así el texto conserva el ancho (S5 de la etapa 7). */
  @container panel (max-width: 17rem) {
    .interior {
      padding: var(--e-2);
    }
    .herramientas,
    .estado {
      padding-inline: var(--e-2);
    }
  }

</style>
