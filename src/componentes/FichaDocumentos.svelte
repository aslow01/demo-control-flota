<script lang="ts">
  // Panel «Documentos» de la ficha (6.3): el Horizonte mediano con solo los documentos de la unidad, la tabla (Documento · Número y emisor · Vence ·
  // Estado · Acciones; una fila por documento obligatorio y por cada cargado, los que faltan con «Falta cargar» y «Cargar») y «Cargar otro documento».
  // No tiene reglas: todo lo arma `ficha.documentos`. Las acciones avisan con `alAccion` (que abre el diálogo) y `alCargarOtro`.
  //  - «Anteriores (N)» es un `details` de solo lectura dentro de la celda de estado (la tabla completa nunca se ve acá: ver más abajo).
  //  - Emisor: la especificación lo pone en una columna que se oculta por debajo de 66 rem; el panel nunca llega a ese ancho (ocupa 8 de 12 columnas),
  //    así que va siempre debajo del número.
  import type { AccionDeDocumentoEnFicha, FilaDocumento, PanelDocumentos } from "../lib/estado/ficha.ts";
  import Boton from "./Boton.svelte";
  import Detalles from "./Detalles.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Horizonte from "./Horizonte.svelte";
  import Icono from "./Icono.svelte";
  import ListaTabla, { type GrupoDeLista } from "./ListaTabla.svelte";
  import { CELDA, ENCABEZADO_DE_FILA } from "./lista-roles.ts";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    documentos,
    idTitulo,
    estado = "",
    repetir,
    alAccion,
    alCargarOtro,
  }: {
    documentos: PanelDocumentos;
    /** Id del `h2` (destino del foco tras guardar). */
    idTitulo: string;
    /** El mensaje de lo último que se hizo acá. */
    estado?: string;
    /** Cambia cada vez que la pantalla emite un mensaje, aunque el texto sea el mismo (así se vuelve a anunciar). */
    repetir?: unknown;
    alAccion: (accion: AccionDeDocumentoEnFicha) => void;
    alCargarOtro: () => void;
  } = $props();

  const columnas = [
    { id: "documento", titulo: T.documentos.columnas.documento },
    { id: "numero", titulo: T.documentos.columnas.numero },
    { id: "vence", titulo: T.documentos.columnas.vence },
    { id: "estado", titulo: T.documentos.columnas.estado },
    { id: "accion", titulo: T.documentos.columnas.accion },
  ];
  const grupos = $derived<GrupoDeLista<FilaDocumento>[]>([{ clave: "documentos", titulo: "", tono: "neutro", filas: documentos.filas }]);

  const ASPECTO: Record<FilaDocumento["estado"]["tono"], { tono: Tono; icono: NombreIcono }> = {
    critico: { tono: "critico", icono: "vencido" },
    semana: { tono: "semana", icono: "alerta" },
    quincena: { tono: "quincena", icono: "calendario" },
    mes: { tono: "mes", icono: "anillo" },
    vigente: { tono: "vigente", icono: "check" },
  };
  function aspectoDe(f: FilaDocumento): { tono: Tono; icono: NombreIcono } {
    if (f.estado.tipo === "faltante") return { tono: "critico", icono: "faltante" };
    return ASPECTO[f.estado.tono];
  }

  /** El resto del nombre accesible de una acción, después del texto visible: «Renovar» + « seguro de ZK 214 BD». */
  function sufijoAccesible(nombreAccesible: string, visible: string): string {
    return nombreAccesible.startsWith(visible) ? nombreAccesible.slice(visible.length) : ` ${nombreAccesible}`;
  }
</script>

<Panel id={idTitulo} titulo={documentos.titulo} icono="documento" meta={documentos.rotuloCantidad} {estado} {repetir}>
  <Horizonte horizonte={documentos.horizonte} />
  {#if documentos.filas.length === 0}
    <p class="vacio"><Icono nombre="guion" />{T.documentos.sinDocumentos}</p>
  {:else}
    <ListaTabla
      variante="documentos"
      titulo={documentos.titulo}
      {columnas}
      {grupos}
      claveDeFila={(f) => f.clave}
      tonoDeFila={(f) => (f.estado.tono === "vigente" ? undefined : f.estado.tono)}
    >
      {#snippet fila(f: FilaDocumento)}
        {@const aspecto = aspectoDe(f)}
        <td {...ENCABEZADO_DE_FILA} data-col="documento">
          <span class="doc">{f.nombre}</span>
        </td>
        <td {...CELDA} data-col="numero" data-etiqueta={T.documentos.numeroDe}>
          {#if f.numero !== null}
            <span class="numero codigo">{f.numero}</span>
            {#if f.emisor !== null}<span class="nota">{f.emisor}</span>{/if}
          {:else}
            <span class="nota">{T.documentos.sinNumero}</span>
          {/if}
        </td>
        <td {...CELDA} data-col="vence" data-etiqueta={T.documentos.venceEl}>{f.vence}</td>
        <!-- «Anteriores (N)» va dentro de la celda de estado (no en una sexta celda: las demás filas tienen cinco y la tabla quedaría con una columna sin encabezado). -->
        <td {...CELDA} data-col="estado">
          <span class="apilado">
            <span><Etiqueta tono={aspecto.tono} icono={aspecto.icono}>{f.estado.texto}</Etiqueta></span>
            {#if f.rotuloAnteriores !== null}
              <Detalles resumen={f.rotuloAnteriores}>
                <ul class="anteriores">
                  {#each f.anteriores as a (a.documentoId)}
                    <li>{T.documentos.anterior(a)}</li>
                  {/each}
                </ul>
              </Detalles>
            {/if}
          </span>
        </td>
        <td {...CELDA} data-col="accion">
          {#if f.acciones.length > 0}
            <div class="acciones-fila">
              {#each f.acciones as a (a.tipo)}
                <Boton variante="secundario" onclick={() => alAccion(a)}>
                  {a.etiqueta}<span class="solo-lectores">{sufijoAccesible(a.nombreAccesible, a.etiqueta)}</span>
                </Boton>
              {/each}
            </div>
          {/if}
        </td>
      {/snippet}
    </ListaTabla>
  {/if}
  {#if documentos.cargarOtro !== null}
    <div class="otro"><Boton variante="secundario" onclick={alCargarOtro}>{documentos.cargarOtro.etiqueta}</Boton></div>
  {/if}
</Panel>

<style>
  .doc {
    display: block;
    font-weight: 600;
  }
  .numero {
    display: block;
    overflow-wrap: anywhere;
  }
  .nota {
    display: block;
  }
  .apilado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  .anteriores {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    color: var(--c-texto-2);
  }
  .acciones-fila {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  /* Tarjeta angosta (menos de 24 rem): los botones se reparten el ancho; con más lugar, miden lo que dice su texto, como en el prototipo. */
  @container lista (max-width: 23.99rem) {
    .acciones-fila > :global(*) {
      flex: 1;
    }
  }
  .otro {
    display: flex;
  }
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
</style>
