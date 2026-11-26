<script lang="ts">
  // Operación diaria (`#/operacion/partes` y `#/operacion/novedades`): título y línea de contexto, las dos solapas (enlaces, una por ruta) y la hoja de la solapa elegida.
  // No tiene reglas de negocio: todo lo arma `app.centroDeAlertas.operacionDiaria` (`centro-alertas.ts`, 3.6): cada solapa trae sus grupos (también los vacíos, con «Ninguno.»)
  // y, si no tiene nada, su estado vacío.
  //  - Partes: partes sin enviar, partes sin cerrar y unidades sin parte de ayer, y al pie «Así lo carga el conductor: Abrir el parte diario» (cambia la vista a Conductor).
  //    Novedades: críticas y abiertas, cada una con «Resolver».
  //  - «Resolver» abre el diálogo compartido (`<DialogosDeDocumento>`, origen `operacion`). Al guardar bien la fila desaparece: lo que pasó se dice en la barra de la hoja y el foco
  //    va al título de la hoja (5.17). Al cancelar, el foco vuelve al botón «Resolver». «Atrás» del navegador cierra el diálogo (lo decide el estado, no esta pantalla).
  //  - Cambiar de solapa es cambiar de ruta: el foco va al `h1`, como en cualquier pantalla.
  import type { TipoAlertaOperacion } from "../lib/dominio/alertas.ts";
  import type { GrupoDeSolapa } from "../lib/estado/centro-alertas.ts";
  import { app } from "../lib/estado/instancia.ts";
  import { aspectoDeOperacion } from "./alertas-aspecto.ts";
  import Boton from "./Boton.svelte";
  import DialogosDeDocumento from "./DialogosDeDocumento.svelte";
  import { dialogos } from "./dialogos-instancia.ts";
  import Icono from "./Icono.svelte";
  import OperacionFila from "./OperacionFila.svelte";
  import OperacionSolapas from "./OperacionSolapas.svelte";
  import OperacionVacio from "./OperacionVacio.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_ALERTAS, TEXTO_NAVEGACION } from "./textos-marco.ts";

  let {
    alAbrirParte,
  }: {
    /** «Abrir el parte diario» (al pie de Partes): abre «Ver como» con el perfil Conductor ya elegido (lo resuelve el marco). */
    alAbrirParte: () => void;
  } = $props();

  const ID_TITULO = "titulo-operacion";

  const op = $derived(app.centroDeAlertas?.operacionDiaria ?? null);
  const solapa = $derived(app.ruta.tipo === "operacion" ? app.ruta.solapa : "partes");
  const actual = $derived(op?.solapas.find((s) => s.id === solapa) ?? null);
  /** El pie «Así lo carga el conductor» es de Partes: los partes los carga el conductor desde su perfil. */
  const conductor = $derived(app.centroDeAlertas?.operacion.barraEstado ?? null);
  const mensaje = $derived(dialogos.mensaje("operacion"));

  /** Qué tipo de alerta es cada grupo (de ahí salen el color y la forma del estado). */
  const TIPO_DE_GRUPO: Record<GrupoDeSolapa["id"], TipoAlertaOperacion> = {
    "sin-enviar": "parte-sin-enviar",
    "sin-cerrar": "parte-sin-enviar",
    "sin-parte": "sin-parte",
    criticas: "novedad-critica",
    abiertas: "novedad-abierta",
  };

  /** «6 pendientes · al 25/11/2026» con la cuenta en negrita. */
  const contexto = $derived.by(() => {
    if (op === null) return { cuenta: "", resto: "" };
    return op.contexto.startsWith(op.rotuloTotal) ? { cuenta: op.rotuloTotal, resto: op.contexto.slice(op.rotuloTotal.length) } : { cuenta: "", resto: op.contexto };
  });

  function resolver(novedadId: string): void {
    dialogos.abrirResolver(novedadId, "operacion");
  }
  /** Tras guardar, la fila que abrió el diálogo ya no existe: el foco va al título de la hoja, donde se lee lo que pasó. */
  function focoDestino(): HTMLElement | null {
    return document.getElementById(ID_TITULO);
  }
</script>

{#if op !== null && actual !== null}
  <div class="pantalla">
    <div class="encabezado">
      <h1 tabindex="-1">{op.titulo}</h1>
      <p class="linea">{#if contexto.cuenta !== ""}<b>{contexto.cuenta}</b>{/if}{contexto.resto}</p>
    </div>

    <div class="cuerpo">
      <OperacionSolapas nombre={op.titulo} solapas={op.solapas} activa={actual.id} />

      <div class="hoja">
        <Panel
          id={ID_TITULO}
          titulo={actual.rotulo}
          meta={actual.id === "partes" ? TEXTO_NAVEGACION.insignias.pendientes(actual.cantidad) : TEXTO_NAVEGACION.insignias.abiertas(actual.cantidad)}
          estado={mensaje.texto}
          repetir={mensaje}
          sinRelleno
        >
          {#if actual.vacio !== null}
            <OperacionVacio titulo={actual.vacio.titulo} ayuda={actual.vacio.ayuda} />
          {:else}
            {#each actual.grupos as g (g.id)}
              {@const tipo = TIPO_DE_GRUPO[g.id]}
              <section class="grupo" aria-labelledby={`grupo-${g.id}`}>
                <h3 id={`grupo-${g.id}`}>{g.tituloConCantidad}</h3>
                {#if g.sinFilas !== null}
                  <p class="sin-filas">{g.sinFilas}</p>
                {:else}
                  <ul>
                    {#each g.filas as f (f.alertaId)}
                      <OperacionFila fila={f} tono={aspectoDeOperacion(tipo).tono} conFecha={actual.id === "novedades"} alResolver={resolver} />
                    {/each}
                  </ul>
                {/if}
              </section>
            {/each}
          {/if}

          {#if actual.id === "novedades" && actual.vacio === null}
            <p class="pie-hoja">{TEXTO_ALERTAS.pieNovedades}</p>
          {/if}

          {#if actual.id === "partes" && conductor !== null}
            <div class="conductor">
              <span id="conductor-intro">{conductor.intro}</span>
              <Boton variante="texto" aria-describedby="conductor-aclaracion" onclick={alAbrirParte}>
                {conductor.accion}<Icono nombre="flecha-der" />
              </Boton>
              <span id="conductor-aclaracion" class="aclaracion">{conductor.aclaracion}</span>
            </div>
          {/if}
        </Panel>
      </div>
    </div>
  </div>

  <DialogosDeDocumento {focoDestino} />
{/if}

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    width: 100%;
    min-width: 0;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  .linea {
    color: var(--c-texto-2);
  }
  .linea b {
    color: var(--c-texto);
    font-weight: 600;
  }
  .cuerpo {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* La hoja de debajo de las solapas pierde la esquina de arriba a la izquierda (las solapas nacen ahí). */
  .hoja :global(.panel) {
    border-top-left-radius: 0;
  }

  .grupo + .grupo {
    border-top: 1px solid var(--c-borde);
  }
  .grupo h3 {
    padding: var(--e-4) var(--e-4) var(--e-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: var(--t-chico);
    font-weight: 700;
    letter-spacing: 0.06em;
    line-height: 1.3;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  .sin-filas {
    padding: var(--e-1) var(--e-4) var(--e-4);
    color: var(--c-texto-3);
  }

  /* Pie de la solapa Novedades: una línea de aclaración, con el mismo filete y tamaño que el pie de Partes. */
  .pie-hoja {
    padding: var(--e-3) var(--e-4);
    border-top: 1px solid var(--c-borde);
    font-size: var(--t-tabla);
    color: var(--c-texto-2);
  }

  /* «Así lo carga el conductor: Abrir el parte diario → (cambia la vista a Conductor)»: las tres partes juntas, en el mismo renglón si entran. */
  .conductor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--e-1);
    padding: var(--e-2) var(--e-4);
    border-top: 1px solid var(--c-borde);
    font-size: var(--t-tabla);
    color: var(--c-texto-2);
  }
  .aclaracion {
    color: var(--c-texto-2);
  }
</style>
