<script lang="ts">
  // 5.6 Horizonte de vencimientos (pieza firma): una regla de 0 a 30 días con una marca por vencimiento, la caja de vencidos y los tramos.
  // Solo dibuja: todo lo que muestra (en qué columna cae cada marca, de qué tramo es, el texto de lectores) lo calcula
  // `lib/dominio/horizonte.ts`; acá no hay reglas de negocio. Se usa así: `<Horizonte horizonte={horizonteCompleto(app.alertas)} />`
  // (centro de alertas), `horizonteDeUnidad(...)` (ficha, variante mediana) y `horizonteMinimo(...)` (columna "Próximo vencimiento").
  //
  // - Completa y mediana son un `role="img"` con el resumen en `aria-label`; la mínima va con `aria-hidden="true"` (el texto de la celda lo
  //   dice todo). Las marcas no son interactivas: los controles son los filtros y la lista.
  // - CSP: la posición de cada marca, rótulo y tramo sale de `style:grid-column-start` (se asigna por CSSOM); nunca un atributo `style`.
  //   El color sale de `data-tramo`, no de la gravedad.
  // - Colores forzados: las marcas pasan a `CanvasText` (llenas o con aro) y los tres tramos se distinguen por el estilo del borde
  //   (sólido, discontinuo, punteado).
  // - La mínima sin marcas (nada vence en 30 días, o ya venció) no se dibuja: la celda sigue sin horizonte (5.9, "Próximo vencimiento").
  import { TRAMOS_PISTA, ULTIMO_DIA, type Horizonte } from "../lib/dominio/horizonte.ts";

  let { horizonte }: { horizonte: Horizonte } = $props();

  const minima = $derived(horizonte.variante === "minima");
  const dibujar = $derived(!(minima && horizonte.vacio));
  const lineas = $derived(horizonte.escala.filter((m) => m.linea));
</script>

{#if dibujar}
  <div
    class="horizonte"
    data-variante={horizonte.variante}
    role={horizonte.etiquetaAria === null ? undefined : "img"}
    aria-label={horizonte.etiquetaAria ?? undefined}
    aria-hidden={horizonte.ocultoAAyudas ? "true" : undefined}
  >
    <div class="marco">
      {#if horizonte.cajaVencidos !== null}
        <div class="caja" class:cero={!horizonte.cajaVencidos.conAlerta} data-tono={horizonte.cajaVencidos.conAlerta ? "critico" : undefined}>
          <span class="caja-rotulo">{horizonte.cajaVencidos.rotulo}</span>
          <span class="caja-cifra num">{horizonte.cajaVencidos.cifra}</span>
        </div>
      {/if}

      <div class="cuerpo">
        {#if horizonte.escala.length > 0}
          <div class="escala">
            {#each horizonte.escala as marca (marca.dia)}
              <span class="rotulo-escala" class:ultimo={marca.dia === ULTIMO_DIA} style:grid-column-start={marca.columna}>
                <span class="largo">{marca.etiqueta}</span><span class="corto">{marca.etiquetaCorta}</span>
              </span>
            {/each}
          </div>
        {/if}

        <div class="pista">
          <span class="hoy"></span>
          {#each lineas as marca (marca.dia)}
            <span class="linea" style:grid-column-start={marca.columna}></span>
          {/each}
          {#each horizonte.columnas as columna (columna.dia)}
            <div class="columna" style:grid-column-start={columna.columna}>
              {#each columna.marcas as marca (marca.alertaId)}
                <span class="marca" class:hueca={marca.hueca} data-tramo={marca.tramo}></span>
              {/each}
            </div>
          {/each}
          {#each TRAMOS_PISTA as tramo (tramo.tramo)}
            <span class="tramo" data-tramo={tramo.tramo} style:grid-column-start={tramo.columnaInicio} style:grid-column-end={tramo.columnaFin}></span>
          {/each}
          {#if horizonte.textoVacio !== null}
            <span class="vacio">{horizonte.textoVacio}</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Contenedor de consultas: la caja de vencidos pasa arriba por debajo de 30rem de ancho (5.6). */
  .horizonte {
    --alto-pista: 3rem;
    --marca-tam: 0.5rem;
    container: horizonte / inline-size;
    inline-size: 100%;
  }
  .horizonte[data-variante="mediana"] {
    --alto-pista: 2rem;
  }
  /* La mínima mide 4rem x 0.75rem: una marca de 8 px sobre el borde de 4 px. Se aloja en una celda de tabla. */
  .horizonte[data-variante="minima"] {
    --alto-pista: 0.5rem;
    container: none;
    display: inline-block;
    flex: none;
    inline-size: 4rem;
    vertical-align: middle;
  }

  .marco {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: var(--e-3);
  }
  @container horizonte (max-width: 30rem) {
    .marco {
      flex-direction: column;
      align-items: stretch;
      gap: var(--e-2);
    }
  }

  /* ---------- Caja de vencidos y faltantes ---------- */
  .caja {
    flex: none;
    inline-size: 7.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--e-1);
    padding: var(--e-2) var(--e-3);
    /* El borde fino es transparente: solo se ve en colores forzados, donde el fondo desaparece. */
    border: 1px solid transparent;
    border-inline-start: 4px solid var(--tono-r);
    border-radius: var(--r-1);
    background: var(--tono-f);
    color: var(--tono-t);
  }
  /* Con 0 va en gris y con "0". Define sus propios tonos: no hereda los de un aviso que la contenga. */
  .caja.cero {
    --tono-t: var(--c-texto-2);
    --tono-f: var(--c-superficie-2);
    --tono-r: var(--c-borde-fuerte);
  }
  .caja-rotulo {
    font-size: var(--t-rotulo);
    line-height: 1.3;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .caja-cifra {
    font-family: var(--t-familia-titulo);
    font-size: var(--t-h2);
    line-height: 1;
    font-weight: 700;
  }
  /* Mediana: compacta, el rótulo y la cifra en una línea. */
  .horizonte[data-variante="mediana"] .caja {
    inline-size: auto;
    flex-direction: row;
    align-items: center;
    gap: var(--e-2);
    padding-block: var(--e-1);
  }
  .horizonte[data-variante="mediana"] .caja-cifra {
    font-size: var(--t-h3);
  }
  @container horizonte (max-width: 30rem) {
    .caja {
      inline-size: auto;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: var(--e-2);
    }
  }

  /* ---------- Escala y pista ---------- */
  .cuerpo {
    flex: 1;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    /* Contenedor de consultas de la pista: a menos de 24rem "30 días" pasa a "30". */
    container: pista / inline-size;
  }
  .horizonte[data-variante="minima"] .cuerpo {
    container: none;
  }

  .escala,
  .pista {
    display: grid;
    grid-template-columns: repeat(31, minmax(0, 1fr));
  }
  .rotulo-escala {
    grid-row: 1;
    font-size: var(--t-chico);
    line-height: 1.2;
    color: var(--c-texto-3);
    white-space: nowrap;
    font-variant-numeric: tabular-nums lining-nums;
  }
  /* "30 días" no cabe a la derecha de la última columna: termina donde termina la pista. */
  .rotulo-escala.ultimo {
    justify-self: end;
  }
  .corto {
    display: none;
  }
  @container pista (max-width: 24rem) {
    .largo {
      display: none;
    }
    .corto {
      display: inline;
    }
  }

  .pista {
    grid-template-rows: minmax(var(--alto-pista), auto) 4px;
    background: var(--c-superficie-2);
    border-radius: var(--r-1) var(--r-1) 0 0;
    /* Transparente: solo se ve en colores forzados, donde el fondo de la pista desaparece. */
    outline: 1px solid transparent;
    outline-offset: -1px;
  }
  .horizonte[data-variante="minima"] .pista {
    padding-inline: 4px;
  }

  /* Hoy: 2 px en el borde izquierdo de la columna 0, alta como la pista. Las líneas de 7, 15 y 30: punteadas de 1 px. */
  .hoy,
  .linea {
    grid-row: 1 / -1;
    pointer-events: none;
  }
  .hoy {
    grid-column: 1;
    border-inline-start: 2px solid var(--c-hoy);
  }
  .linea {
    border-inline-start: 1px dashed var(--c-borde-fuerte);
  }

  /* Una columna por día con marcas; las marcas se apilan de abajo hacia arriba. */
  .columna {
    grid-row: 1;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 2px;
    padding-block-end: 0.375rem;
  }
  .horizonte[data-variante="minima"] .columna {
    padding-block-end: 0;
  }

  .marca {
    flex: none;
    inline-size: var(--marca-tam);
    block-size: var(--marca-tam);
    border: 2px solid var(--marca);
    border-radius: 50%;
    background: var(--marca);
    /* Aro de 2 px del color de la pista: separa las marcas vecinas. */
    box-shadow: 0 0 0 2px var(--c-superficie-2);
  }
  /* Con más de las que caben, la última es un aro del mismo color ("y más"; el número exacto está en la lista). */
  .marca.hueca {
    background: transparent;
  }
  .horizonte[data-variante="minima"] .marca {
    box-shadow: none;
  }

  /* Borde inferior de 4 px dividido en tres tramos. */
  .tramo {
    grid-row: 2;
    border-block-end: 4px solid var(--marca);
  }

  .marca[data-tramo="semana"],
  .tramo[data-tramo="semana"] {
    --marca: var(--c-semana-r);
  }
  .marca[data-tramo="quincena"],
  .tramo[data-tramo="quincena"] {
    --marca: var(--c-quincena-r);
  }
  .marca[data-tramo="mes"],
  .tramo[data-tramo="mes"] {
    --marca: var(--c-mes-r);
  }

  /* Pista sin marcas: el texto, centrado sobre ella. */
  .vacio {
    grid-column: 1 / -1;
    grid-row: 1;
    align-self: center;
    justify-self: center;
    max-inline-size: 100%;
    padding-inline: var(--e-2);
    /* Tapa las líneas punteadas que cruzan el texto. */
    background: var(--c-superficie-2);
    text-align: center;
    font-size: var(--t-chico);
    line-height: 1.3;
    color: var(--c-texto-2);
  }

  /* ---------- Colores forzados: sin colores propios; las marcas son de CanvasText y los tramos se distinguen por el borde ---------- */
  @media (forced-colors: active) {
    .pista {
      outline-color: CanvasText;
    }
    .hoy {
      border-inline-start-color: CanvasText;
    }
    .linea {
      border-inline-start-color: CanvasText;
    }
    .marca {
      border-color: CanvasText;
      background: CanvasText;
    }
    .marca.hueca {
      background: Canvas;
    }
    .tramo {
      border-block-end-color: CanvasText;
    }
    .tramo[data-tramo="quincena"] {
      border-block-end-style: dashed;
    }
    .tramo[data-tramo="mes"] {
      border-block-end-style: dotted;
    }
    .caja {
      border-color: CanvasText;
    }
  }
</style>
