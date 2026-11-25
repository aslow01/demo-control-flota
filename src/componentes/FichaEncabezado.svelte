<script lang="ts">
  // Encabezado de la ficha (6.3, rediseño «Turno»): la patente grande como `h1`, la unidad, la banda del estado (si puede salir y por qué), los datos y las acciones.
  // Sin panel: va directo sobre el escritorio. No tiene reglas: todo lo arma `app.fichaDeUnidad` (lib/estado/ficha.ts). Las acciones avisan con `alAccion`.
  // Las migas y el rótulo «Demo con datos ficticios» ya no van acá: los pone el marco (migas en escritorio, «Atrás» y franja «Demo» en el celular).
  //  - Banda del estado: fondo y franja izquierda del tono de la aptitud; la etiqueta dice el estado (con su forma) y, debajo, el motivo en negrita. Con más de dos motivos,
  //    «3 motivos» y la lista debajo, dentro de la misma banda.
  //  - Datos en un `dl`: rótulo en mayúsculas chicas y valor debajo; en el celular, de a dos por renglón; en escritorio, en fila.
  //  - Acciones: «Cargar parte» es un enlace; las demás abren un diálogo. En el celular van de a dos y la última a todo el ancho; en escritorio, apiladas en una columna a la
  //    derecha. Una unidad de baja no tiene ninguna y muestra un aviso neutro.
  //  - La región `role="status"` de abajo existe siempre (vacía no ocupa lugar): el mensaje de lo último que se hizo desde el encabezado.
  import type { AccionDeFicha, FichaDeUnidad, IdAccionDeFicha } from "../lib/estado/ficha.ts";
  import { aspectoDeAptitud } from "./alertas-aspecto.ts";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Aviso from "./Aviso.svelte";
  import Boton from "./Boton.svelte";
  import Dato from "./Dato.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import MenuMas from "./MenuMas.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";
  import { TEXTO_FICHA } from "../lib/dominio/textos.ts";
  import type { ItemMenu } from "./tipos.ts";

  let {
    ficha,
    mensaje = "",
    repetir,
    alAccion,
  }: {
    ficha: FichaDeUnidad;
    /** Lo último que se hizo desde el encabezado («Unidad agregada…», «ZK 214 BD está fuera de servicio.»). */
    mensaje?: string;
    /** Cambia cada vez que la pantalla emite un mensaje, aunque el texto sea el mismo (así se vuelve a anunciar). */
    repetir?: unknown;
    alAccion: (id: IdAccionDeFicha) => void;
  } = $props();

  // El texto del mensaje entra a la región `role="status"` (que existe desde el principio, vacía) unos ms después: también el de llegada («Unidad agregada…»), que nace con la pantalla.
  const anunciado = textoAnunciado(() => ({ texto: mensaje, repetir }));
  const aspecto = $derived(aspectoDeAptitud(ficha.aptitud.categoria));
  const items = $derived<ItemMenu[]>(
    ficha.acciones.masAcciones.map((a: AccionDeFicha) => ({ id: a.id, texto: a.etiqueta, alActivar: () => alAccion(a.id) })),
  );
  const hayAcciones = $derived(ficha.acciones.encabezado.length > 0 || ficha.acciones.masAcciones.length > 0);
</script>

<div class="encabezado">
  <div class="principal">
    <div class="titular">
      <!-- El id lo usa la lista de solapas de la pantalla como nombre (`aria-labelledby`). -->
      <h1 id="titulo-de-la-unidad" tabindex="-1"><Patente patente={ficha.patente} tamano="grande" /></h1>
      <p class="identidad"><span>{ficha.interno}</span><span>{ficha.descripcion}</span></p>
    </div>

    <div class="banda" data-tono={aspecto.tono}>
      <p class="estado"><Etiqueta tono={aspecto.tono} icono={aspecto.icono} variante="texto">{ficha.aptitud.etiqueta}</Etiqueta></p>
      {#if ficha.aptitud.linea !== null}<p class="porque">{ficha.aptitud.linea}</p>{/if}
      {#if ficha.aptitud.mostrarLista}
        <ul class="motivos" aria-label={T.motivosDe}>
          {#each ficha.aptitud.motivos as motivo (motivo)}
            <li>{motivo}</li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if ficha.aviso !== null}
      <Aviso tono="neutro" icono="caja">{ficha.aviso}</Aviso>
    {/if}

    <dl class="datos">
      <Dato etiqueta={T.datos.proyecto} valor={ficha.datos.proyecto ?? T.datos.sinProyecto} />
      <Dato etiqueta={T.datos.conductor}>
        <span class="conductor">
          <span>{ficha.datos.conductor ?? T.datos.sinConductor}</span>
          <!-- L6: la etiqueta de aptitud de la unidad no cambia por esto (A1): la unidad puede salir con otro conductor. -->
          {#if ficha.datos.conductorSinLicencia}<EtiquetaParte tipo="sin-licencia-vigente" />{/if}
        </span>
      </Dato>
      <Dato etiqueta={T.datos.kilometraje} valor={ficha.datos.km.textoConFecha} />
    </dl>
  </div>

  {#if hayAcciones}
    <div class="acciones">
      {#each ficha.acciones.encabezado as a (a.id)}
        {#if a.href !== null}
          <EnlaceAccion href={a.href}>{a.etiqueta}</EnlaceAccion>
        {:else}
          <Boton variante="secundario" onclick={() => alAccion(a.id)}>{a.etiqueta}</Boton>
        {/if}
      {/each}
      {#if items.length > 0}
        <MenuMas {items} etiqueta={TEXTO_FICHA.acciones.masAcciones} conTexto />
      {/if}
    </div>
  {/if}

  <div class="mensaje" role="status">{#if mensaje !== ""}<Aviso tono="vigente" icono="check">{anunciado.valor}</Aviso>{/if}</div>
</div>

<style>
  /* Celular y tableta: todo en una columna. Escritorio (64 rem, cuando aparece el lateral): la unidad a la izquierda y las acciones a la derecha. */
  .encabezado {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
    min-width: 0;
  }
  .principal {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
  }
  @media (min-width: 64rem) {
    .encabezado {
      grid-template-columns: minmax(0, 1fr) 15rem;
      align-items: start;
      column-gap: var(--e-6);
    }
    .mensaje {
      grid-column: 1 / -1;
    }
  }

  /* ---------- Patente y unidad ---------- */
  .titular {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    min-width: 0;
  }
  h1 {
    display: inline-flex;
    max-width: 100%;
    line-height: 1;
  }
  /* 320 px, o 360 con el texto al 200 %: la chapa de la patente es lo único que no baja de renglón; con la letra un poco más chica entra. */
  @media (max-width: 20rem) {
    .titular :global(.patente[data-tamano="grande"]) {
      --tam: 1.25rem;
    }
  }
  .identidad {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-1) 0;
    min-width: 0;
    color: var(--c-texto-2);
    overflow-wrap: anywhere; /* marca y modelo los escribe la persona */
  }
  .identidad span {
    min-width: 0;
  }
  .identidad span + span::before {
    content: "";
    display: inline-block;
    width: 1px;
    height: 1em;
    margin-inline: var(--e-3);
    background: var(--c-borde-fuerte);
    vertical-align: -0.125em;
  }

  /* ---------- Banda del estado ---------- */
  .banda {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    padding: var(--e-3) var(--e-4) var(--e-3) 0.875rem;
    background: var(--tono-f);
    border-left: 4px solid var(--tono-r);
    border-radius: 0 var(--r-1) var(--r-1) 0;
    min-width: 0;
  }
  .estado :global(.etiqueta) {
    padding-inline: 0;
    min-height: 0;
    font-size: 0.875rem;
  }
  .porque {
    font-size: var(--t-h3);
    font-weight: 700;
    line-height: 1.3;
    color: var(--c-texto);
    /* El motivo lo escribe la persona: un texto sin espacios no tiene que ensanchar la página. */
    overflow-wrap: anywhere;
  }
  .motivos {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    padding-left: var(--e-5);
    margin-top: var(--e-1);
    list-style: disc;
    color: var(--c-texto);
    overflow-wrap: anywhere;
  }
  .motivos li::marker {
    color: var(--c-texto-2);
  }

  /* ---------- Datos ---------- */
  .datos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: var(--e-3) var(--e-4);
    width: 100%;
  }
  .datos :global(dt) {
    font-size: var(--t-rotulo);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-texto-3);
  }
  .datos :global(dd) {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .conductor {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
  }
  /* De a dos por renglón; con un número impar, el último (el kilometraje con su fecha, el más largo) ocupa todo el ancho. */
  @media (max-width: 39.99rem) {
    .datos :global(.dato:last-child:nth-child(odd)) {
      grid-column: 1 / -1;
    }
  }
  @media (min-width: 40rem) {
    .datos {
      grid-template-columns: repeat(auto-fit, minmax(0, max-content));
      column-gap: var(--e-6);
    }
  }

  /* ---------- Acciones ---------- */
  .acciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: var(--e-2);
    min-width: 0;
  }
  .acciones > :global(*) {
    min-width: 0;
  }
  .acciones > :global(.boton),
  .acciones > :global(.enlace-accion) {
    width: 100%;
    padding-block: var(--e-2);
  }
  /* Con dos columnas y un número impar, la última (casi siempre «Más acciones») ocupa todo el ancho. */
  @media (max-width: 29.4rem) {
    .acciones > :global(:last-child:nth-child(odd)) {
      grid-column: 1 / -1;
    }
  }
  /* Tableta: en fila, cada botón con el ancho de su texto. */
  @media (min-width: 40rem) {
    .acciones {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    .acciones > :global(.boton),
    .acciones > :global(.enlace-accion) {
      width: auto;
    }
    .acciones > :global(.menu) {
      width: auto;
    }
  }
  @media (min-width: 64rem) {
    .acciones {
      flex-direction: column;
      align-items: stretch;
    }
    .acciones > :global(.boton),
    .acciones > :global(.enlace-accion) {
      width: 100%;
    }
  }

  /* La región de estado existe siempre: vacía no ocupa lugar (ni el espacio que deja el `gap`). */
  .mensaje {
    width: 100%;
  }
  .mensaje:empty {
    margin-top: calc(var(--e-4) * -1);
  }

  @media (forced-colors: active) {
    .identidad span + span::before {
      background: CanvasText;
    }
  }
</style>
