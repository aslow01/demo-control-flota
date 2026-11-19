<script lang="ts">
  // Encabezado de la ficha (6.3): migas, la patente grande como `h1`, si puede salir y por qué, los datos de la unidad y las acciones. Sin panel:
  // va directo sobre el escritorio. No tiene reglas: todo lo arma `app.fichaDeUnidad` (lib/estado/ficha.ts). Las acciones avisan con `alAccion`.
  //  - Etiqueta de aptitud con los motivos: uno o dos van al lado; con más, «No puede salir · 3 motivos» y la lista debajo.
  //  - Datos en un `dl` en fila, con un divisor de 1 px entre uno y otro (no con «·» en el marcado); en teléfono, uno debajo de otro.
  //  - Acciones: «Cargar parte» es un enlace; las demás abren un diálogo. Una unidad de baja no tiene ninguna y muestra un aviso neutro.
  //  - La región `role="status"` de abajo existe siempre (vacía no ocupa lugar): el mensaje de lo último que se hizo desde el encabezado.
  import type { AccionDeFicha, FichaDeUnidad, IdAccionDeFicha } from "../lib/estado/ficha.ts";
  import { aspectoDeAptitud } from "./alertas-aspecto.ts";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Aviso from "./Aviso.svelte";
  import Boton from "./Boton.svelte";
  import Dato from "./Dato.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
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
  <div class="solo-angosto"><EtiquetaDemo /></div>

  <nav aria-label={T.rutaEtiqueta}>
    <ol class="migas">
      {#each ficha.migas as miga (miga.texto)}
        <li>
          {#if miga.href !== null}
            <a href={miga.href}>{miga.texto}</a>
          {:else}
            <span aria-current="page">{miga.texto}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>

  <div class="titular">
    <h1 tabindex="-1"><Patente patente={ficha.patente} tamano="grande" /></h1>
    <div class="aptitud">
      <Etiqueta tono={aspecto.tono} icono={aspecto.icono}>{ficha.aptitud.etiqueta}</Etiqueta>
      {#if ficha.aptitud.linea !== null}<span class="linea-aptitud">{ficha.aptitud.linea}</span>{/if}
    </div>
  </div>
  {#if ficha.aptitud.mostrarLista}
    <ul class="motivos" aria-label={T.motivosDe}>
      {#each ficha.aptitud.motivos as motivo (motivo)}
        <li>{motivo}</li>
      {/each}
    </ul>
  {/if}

  <p class="identidad"><span>{ficha.interno}</span><span>{ficha.descripcion}</span></p>

  {#if ficha.aviso !== null}
    <Aviso tono="neutro" icono="caja">{ficha.aviso}</Aviso>
  {/if}

  <dl class="datos">
    <Dato etiqueta={T.datos.proyecto} valor={ficha.datos.proyecto ?? T.datos.sinProyecto} />
    <Dato etiqueta={T.datos.conductor} valor={ficha.datos.conductor ?? T.datos.sinConductor} />
    <Dato etiqueta={T.datos.kilometraje} valor={ficha.datos.km.textoConFecha} />
  </dl>

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
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-3);
    min-width: 0;
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }

  /* ---------- Migas ---------- */
  .migas {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    font-size: var(--t-tabla);
  }
  .migas li {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }
  .migas li + li::before {
    content: "/";
    content: "/" / "";
    margin-inline: var(--e-2);
    color: var(--c-texto-3);
  }
  .migas a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--alto-tactil);
    min-height: var(--alto-tactil);
  }
  .migas [aria-current="page"] {
    color: var(--c-texto-2);
  }

  /* ---------- Patente y aptitud ---------- */
  .titular {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-4);
    width: 100%;
  }
  h1 {
    display: inline-flex;
    line-height: 1;
  }
  .aptitud {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
    min-width: 0;
  }
  .linea-aptitud {
    min-width: 0;
    font-weight: 600;
    color: var(--c-texto);
    /* El motivo lo escribe la persona: un texto sin espacios no tiene que ensanchar la página. */
    overflow-wrap: anywhere;
  }
  .motivos {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    padding-left: var(--e-5);
    list-style: disc;
    color: var(--c-texto);
    overflow-wrap: anywhere;
  }
  .motivos li::marker {
    color: var(--c-texto-3);
  }

  /* ---------- Identidad y datos ---------- */
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
  .datos {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    width: 100%;
  }
  @media (min-width: 40rem) {
    .datos {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--e-2) 0;
    }
    .datos :global(.dato) {
      padding-inline: var(--e-4);
      border-left: 1px solid var(--c-borde-fuerte);
    }
    .datos :global(.dato:first-child) {
      padding-left: 0;
      border-left: 0;
    }
  }

  /* ---------- Acciones ---------- */
  .acciones {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    width: 100%;
  }
  .acciones > :global(*) {
    width: 100%;
  }
  @media (min-width: 40rem) {
    .acciones {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      width: auto;
    }
    .acciones > :global(*) {
      width: auto;
    }
  }

  /* La región de estado existe siempre: vacía no ocupa lugar (ni el espacio que deja el `gap`). */
  .mensaje {
    width: 100%;
  }
  .mensaje:empty {
    margin-top: calc(var(--e-3) * -1);
  }

  @media (forced-colors: active) {
    .identidad span + span::before {
      background: CanvasText;
    }
  }
</style>
