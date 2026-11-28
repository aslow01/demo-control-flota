<script lang="ts">
  // La regla de salida de Inicio (docs/diseno-ui.md, 15.6 y 15.7): cuántas unidades activas pueden salir hoy, una llave por unidad, la «Acción del día» y los cuatro renglones de lectura.
  // Interacción completa, marcado accesible y estilo propio (`<style>` de este archivo, T11). No calcula nada: todo lo que muestra lo armó `salida.ts` (`calcularSalida`) y los
  // textos vienen de los módulos de textos. Los valores que la hoja de estilos necesita llegan por `style:--x` (CSSOM: la CSP no deja el atributo `style`) y por `data-*` (15.6.8).
  //  - Una sola parada de Tab en el tablero completo (`teclado-llaves.ts`): flechas, Inicio y Fin mueven el foco; Enter abre la ficha (es un enlace); otro Tab sale.
  //  - Un solo rótulo de cota para todas las llaves: sigue al puntero (no al toque) o al foco; Escape lo oculta sin mover el foco (WCAG 1.4.13). Con el foco de teclado suma la ayuda de las flechas.
  //  - Hay DOS listas de unidades: el tablero completo (todas las activas) y el corto (solo las no disponibles, hasta ocho). La hoja de estilos muestra una y oculta la otra con `display: none` según
  //    el ancho de la regla; nunca se ven a la vez. Lo mismo con los renglones de lectura («dentro» de la mordaza o «fuera»).
  //  - El valor final está siempre en el párrafo para lectores; la cifra, la escala, el cursor, la cota y los globos son `aria-hidden`.
  //  - La región `role="status"` de la nota existe siempre (vacía); lo que se dijo al resolver una pieza entra en ella (`textoAnunciado`).
  import { aHash } from "../lib/estado/enrutador.ts";
  import type { AccionDeDocumento } from "../lib/estado/centro-alertas.ts";
  import { indiceDeEntrada, indiceTrasTecla } from "./teclado-llaves.ts";
  import type { LlaveDeSalida, RenglonDeLectura, Salida } from "../lib/estado/salida.ts";
  import { TEXTO_CENTRO, TEXTO_INICIO, TEXTO_REGLA } from "../lib/dominio/textos-inicio.ts";
  import { textoDesgloseNoDisponibles } from "../lib/dominio/textos-base.ts";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Boton from "./Boton.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Forma, { formaDeTono } from "./Forma.svelte";
  import Icono from "./Icono.svelte";
  import Llave from "./Llave.svelte";
  import Odometro from "./Odometro.svelte";
  import { TEXTO_ALERTAS, textoNombreDelSello, textoNombreDeLlave, textoNombreDeYMas } from "./textos-marco.ts";

  let {
    salida,
    idTitulo,
    recorrido,
    alRenovar,
    alProbarComoConductor,
    estado,
    repetir,
  }: {
    salida: Salida;
    /** El `id` del `h2` «Disponibles hoy»: es el destino del foco al resolver una pieza (la pantalla lo busca por este `id`). */
    idTitulo: string;
    /** El conductor del recorrido («Probar como conductor»); `null` si no hay a quién elegir (el botón no se muestra). */
    recorrido: { conductorId: string } | null;
    /** El botón de la acción de la nota: abre el diálogo de siempre (Renovar o Cargar). */
    alRenovar: (accion: AccionDeDocumento) => void;
    alProbarComoConductor: (conductorId: string) => void;
    /** Lo que se dijo al resolver una pieza desde la nota («Seguro de ZK 214 BD renovado. Disponibles hoy: 20 de 23 unidades activas.»); `""` si no hay nada que decir. */
    estado: string;
    /** Cambia con cada mensaje, aunque el texto se repita (así se vuelve a anunciar). */
    repetir: unknown;
  } = $props();

  const uid = $props.id();
  const idAyuda = `${uid}-ayuda`;
  const idFrase = `${uid}-frase-recorrido`;

  const anunciado = textoAnunciado(() => ({ texto: estado, repetir }));

  const hrefNoDisponibles = aHash({ tipo: "movilidades", filtro: "no-disponibles" });
  const desglose = $derived(textoDesgloseNoDisponibles(salida.bloqueadas, salida.fueraDeServicio));
  /** El desglose en sus dos mitades («2 bloqueadas por documentos» y «2 fuera de servicio»): el rótulo corto las parte solo en el punto medio, sin dejar «servicio» solo en un renglón. */
  const partesDelDesglose = $derived(desglose.split(" · "));
  const accion = $derived(salida.accion);

  // ---------- Tablero completo: una sola parada de Tab y rótulo de cota ----------
  let lista = $state<HTMLElement>();
  /** La última llave enfocada: ahí vuelve Tab. `null` la primera vez (entra en la primera que no sale). */
  let ultima = $state<number | null>(null);
  const parada = $derived(indiceDeEntrada(salida.llaves.map((l) => l.sale), ultima));
  /** La llave que señala el rótulo de cota; `teclado` agrega la ayuda de las flechas. `null`: sin rótulo. */
  let rotulo = $state<{ indice: number; teclado: boolean } | null>(null);
  const llaveDelRotulo = $derived(rotulo === null ? undefined : salida.llaves[rotulo.indice]);

  function alEnfocar(indice: number, conTeclado: boolean): void {
    ultima = indice;
    rotulo = { indice, teclado: conTeclado };
  }
  function alApuntar(indice: number): void {
    rotulo = { indice, teclado: rotulo?.indice === indice && rotulo.teclado };
  }
  function alTeclear(evento: KeyboardEvent): void {
    // Escape oculta el rótulo sin mover el foco (WCAG 1.4.13).
    if (evento.key === "Escape") {
      rotulo = null;
      return;
    }
    if (lista === undefined || evento.ctrlKey || evento.altKey || evento.metaKey) return;
    const enlaces = Array.from(lista.querySelectorAll<HTMLElement>("a.llave"));
    const actual = enlaces.findIndex((enlace) => enlace === evento.target);
    if (actual === -1) return;
    const destino = indiceTrasTecla(evento.key, actual, enlaces.length);
    if (destino === null) return;
    evento.preventDefault();
    enlaces[destino]?.focus();
  }
  /** El puntero salió de las llaves y del rótulo (que está dentro del tablero), o el foco salió del tablero: el rótulo se va, salvo que lo sostenga el foco. */
  function alSalirElPuntero(): void {
    if (rotulo !== null && !rotulo.teclado) rotulo = null;
  }
  function alSalirElFoco(evento: FocusEvent): void {
    const tablero = evento.currentTarget;
    const destino = evento.relatedTarget;
    if (tablero instanceof HTMLElement && destino instanceof Node && tablero.contains(destino)) return;
    rotulo = null;
  }

  const estadoDeLaLlave = (l: LlaveDeSalida): string => (l.motivo === null ? l.etiqueta : `${l.etiqueta}. ${l.motivo}`);
  /** El resto del nombre accesible del botón de la acción («Renovar» + « seguro de ZK 214 BD»), para que empiece con lo que se ve. */
  const restoDelNombre = (a: AccionDeDocumento): string => (a.nombreAccesible.startsWith(a.etiqueta) ? a.nombreAccesible.slice(a.etiqueta.length) : ` ${a.nombreAccesible}`);
</script>

<!-- Los cuatro renglones: dentro de la mordaza o debajo de la nota. Las dos copias salen de lo mismo; la hoja de estilos muestra una. -->
{#snippet renglones(donde: "dentro" | "fuera", lectura: readonly RenglonDeLectura[])}
  <ul class="renglones" data-donde={donde} aria-label={TEXTO_REGLA.resumen}>
    {#each lectura as r (r.id)}
      <li>
        <a href={r.href} data-tono={r.tono}>
          <Forma forma={r.forma ?? "cuadro"} tono={r.forma === null ? "neutro" : r.tono} />
          <b class="lc">{r.valor}</b>
          <span class="lr">{r.rotulo}</span>
          <Icono nombre="chevron" />
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

<section
  class="salida"
  aria-labelledby={idTitulo}
  data-campo={salida.campo}
  data-carga={salida.carga}
  data-vacia={salida.vacia ? "" : undefined}
  style:--medida={salida.medida}
  style:--act={salida.activas}
>
  <p class="solo-lectores">{salida.textoLector}</p>

  {#if salida.vacia}
    <!-- Flota vacía: el cuadro cero con un mensaje en lugar del progreso. No hay mordaza, cifra, escala ni llaves; el `h2` sigue presente y no se divide por cero. -->
    <div class="caja caja-cero">
      <h2 class="regla-titulo" id={idTitulo} tabindex="-1">{TEXTO_REGLA.titulo}</h2>
      <p class="vacia-mensaje">{TEXTO_REGLA.sinActivas}</p>
      <p class="vacia-ayuda">{TEXTO_REGLA.sinActivasAyuda}</p>
      <EnlaceAccion href={aHash({ tipo: "movilidades" })}>{TEXTO_REGLA.sinActivasEnlace}</EnlaceAccion>
    </div>
    {@render renglones("fuera", salida.renglones)}
  {:else}
    <div class="salida-cota" aria-hidden="true">
      <span class="cursor-cabeza"></span>
      <!-- La cota de la zona roja lleva el desglose (el «4» ya está en el sello): así se lee igual con 4, 3 o 1 unidades, sea cual sea el ancho de la zona. -->
      {#if salida.noDisponibles > 0}<div class="cota cota-roja"><span>{desglose}</span></div>{/if}
    </div>

    <div class="caja">
      <div class="mordaza">
        <h2 class="regla-titulo" id={idTitulo} tabindex="-1">{TEXTO_REGLA.titulo}</h2>
        <div class="cifra" aria-hidden="true"><Odometro valor={salida.disponibles} /><span class="de">/{salida.activas}</span></div>
        {@render renglones("dentro", salida.renglones)}
        <span class="registro" aria-hidden="true"></span>
      </div>
      {#if salida.noDisponibles > 0}
        <div class="zona-roja">
          <a class="sello-roja" data-uno={salida.noDisponibles === 1 ? "" : undefined} href={hrefNoDisponibles} aria-label={textoNombreDelSello(salida.noDisponibles, desglose)}>
            <b class="cartel" aria-hidden="true">{salida.noDisponibles}</b>
            <span class="se-nombre">{TEXTO_CENTRO.protagonista}</span>
          </a>
          <span class="tapa" aria-hidden="true"></span>
        </div>
      {/if}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="tablero" onpointerleave={alSalirElPuntero} onfocusout={alSalirElFoco} onkeydown={alTeclear}>
      <span class="cursor-linea" aria-hidden="true"></span>
      <div class="escala" aria-hidden="true">
        <span class="escala-marcas" data-menores={salida.marcasMenores ? undefined : "no"}></span>
        {#each salida.escala as marca (marca.valor)}
          <span class="escala-num" data-tipo={marca.tipo} style:--x={marca.x}>{marca.valor}</span>
        {/each}
      </div>

      <!-- Tablero completo: una llave por unidad activa; las que salen primero y, a la derecha del cursor, las que no. -->
      <p class="solo-lectores ayuda-llaves" id={idAyuda}>{TEXTO_REGLA.ayudaTeclado}</p>
      <ul class="llaves" bind:this={lista} aria-label={TEXTO_REGLA.listaCompleta} aria-describedby={idAyuda}>
        {#each salida.llaves as llave, i (llave.unidadId)}
          <Llave {llave} indice={i} orden={llave.pieza === null ? null : llave.pieza - 1} tabindex={i === parada ? 0 : -1} {alEnfocar} {alApuntar} />
        {/each}
      </ul>

      <!-- El único rótulo de cota (compartido): `aria-hidden`, lo mismo está en el nombre accesible de cada llave. -->
      {#if llaveDelRotulo !== undefined && rotulo !== null}
        <div class="rotulo-cota objeto" aria-hidden="true" data-origen={rotulo.teclado ? "teclado" : undefined} style:--x={(rotulo.indice + 0.5) / salida.activas}>
          <span class="rc-patente">{llaveDelRotulo.patenteTexto}</span>
          <span class="rc-interno">{llaveDelRotulo.interno}</span>
          <span class="rc-estado"><Forma forma={formaDeTono(llaveDelRotulo.tono ?? "vigente")} tono={llaveDelRotulo.tono ?? "vigente"} />{estadoDeLaLlave(llaveDelRotulo)}</span>
          {#if rotulo.teclado}<span class="rc-ayuda">{TEXTO_REGLA.ayudaTeclado}</span>{/if}
        </div>
      {/if}

      <!-- Tablero corto: solo las no disponibles (hasta ocho posiciones), cada una un enlace común con su parada de Tab. -->
      <div class="corto">
        <div class="corto-ganchos" aria-hidden="true"></div>
        {#if salida.noDisponibles > 0}
          <!-- El rótulo es solo para la vista: el desglose ya lo dice el párrafo de la regla y el nombre del sello; la lista lleva un nombre corto para no repetirlo. -->
          <p class="corto-rotulo" aria-hidden="true"><b>{TEXTO_CENTRO.protagonista}</b> <span class="parte">{partesDelDesglose[0]} ·</span> <span class="parte">{partesDelDesglose[1]}</span></p>
          <ul class="colgadas" aria-label={TEXTO_CENTRO.protagonista}>
            {#each salida.corto.chapas as llave (llave.unidadId)}
              <li>
                <a class="colgada" href={llave.href} data-tono={llave.tono ?? undefined} style:--j={(llave.pieza ?? 1) - 1} aria-label={textoNombreDeLlave(llave, false)}>
                  <span class="colgada-chapa objeto"><span class="colgada-pat" aria-hidden="true">{llave.patenteTexto}</span></span>
                </a>
              </li>
            {/each}
            {#if salida.corto.masNoDisponibles > 0}
              <li>
                <a class="colgada colgada-mas" href={hrefNoDisponibles} aria-label={textoNombreDeYMas(salida.corto.masNoDisponibles)}>
                  <span class="colgada-chapa objeto"><span class="colgada-pat">{TEXTO_ALERTAS.yMas(salida.corto.masNoDisponibles)}</span></span>
                </a>
              </li>
            {/if}
          </ul>
        {/if}
      </div>
    </div>

    <!-- La acción principal de Inicio, siempre en el flujo. La región `role="status"` existe en las tres variantes: lo que se dice al resolver entra en ella. -->
    {#if accion.variante !== "vacia"}
      <div class="accion" data-variante={accion.variante}>
        {#if accion.variante !== "en-orden"}<span class="accion-guia" aria-hidden="true" style:--x={accion.x}></span>{/if}
        <div class="accion-texto">
          {#if accion.variante === "en-orden"}
            <span class="accion-ok" aria-hidden="true"></span>
          {:else}
            <span class="globo accion-globo" data-tono={accion.unidad.tono ?? undefined} aria-hidden="true">{accion.pieza}</span>
          {/if}
          <p class="accion-rotulo">{TEXTO_REGLA.accionDelDia}</p>
          <p class="accion-frase">{accion.frase}</p>
        </div>
        {#if accion.variante !== "en-orden"}
          <div class="accion-botones">
            {#if accion.variante === "con-accion"}
              {@const a = accion.accion}
              <Boton aria-haspopup="dialog" onclick={() => alRenovar(a)}>{a.etiqueta}<span class="solo-lectores">{restoDelNombre(a)}</span></Boton>
            {:else}
              <EnlaceAccion href={accion.unidad.href} etiqueta={`${TEXTO_ALERTAS.verFicha}${TEXTO_ALERTAS.verFichaDe(accion.unidad.patenteTexto)}`}>{TEXTO_ALERTAS.verFicha}</EnlaceAccion>
            {/if}
            {#if recorrido !== null}
              {@const conductorId = recorrido.conductorId}
              <Boton variante="secundario" aria-haspopup="dialog" aria-describedby={idFrase} onclick={() => alProbarComoConductor(conductorId)}>
                {TEXTO_INICIO.recorrido.boton}<Icono nombre="flecha" />
              </Boton>
            {/if}
          </div>
          {#if recorrido !== null}<p class="accion-desc" id={idFrase}>{TEXTO_INICIO.recorrido.texto}</p>{/if}
        {/if}
        <p class="accion-estado" class:vacio={estado === ""} role="status">{anunciado.valor}</p>
      </div>
    {/if}

    {@render renglones("fuera", salida.renglones)}
  {/if}
</section>

<style>
  /* La regla de salida (docs/diseno-ui.md, 15.6 y 15.7), dirección «Pie de rey». Los cortes son de CONTENEDOR (`salida`), no de ventana: la regla no sabe si hay lateral. Los valores que cambian con los
     datos llegan por `--medida` (de 0 a 1) y `--act` (unidades activas) en la propia sección, y por `data-campo` y `data-carga`; la hoja no lleva ninguna cifra de la flota.
     Hay dos copias de los renglones y dos listas de unidades; acá se muestra una de cada par con `display: none` (sale del orden de Tab y del árbol de accesibilidad). Los colores son los de tokens.css;
     dentro de un `.objeto` (llave, chapa, rótulo de cota) los `--c-*` ya valen los de papel claro. */
  .salida {
    container: salida / inline-size;
    position: relative;
    /* Cuánto falta para llegar a la medida desde el extremo (el cuadro 0 de la entrada). El tablero y la caja miden el ancho de la regla menos 2 px de borde por lado. */
    --falta: calc((1 - var(--medida)) * (100cqi - 4px));
    /* El escalón de la caída de las que no salen: 20 ms, y menos si son muchas, para que el conjunto termine a los 880 ms (15.10). */
    --paso-caida: min(20ms, calc(60ms / max(1, (1 - var(--medida)) * var(--act) - 1)));
  }

  /* ---------- Cabeza del cursor y cota de la zona roja ---------- */
  .salida-cota {
    position: relative;
    height: 0.75rem;
    margin: 0 2px;
  }
  .cursor-cabeza {
    position: absolute;
    bottom: 0;
    left: calc(var(--medida) * 100% - 7px);
    border: 7px solid transparent;
    border-top: 9px solid var(--c-tinta);
    border-bottom: 0;
    transition: left var(--m-largo) var(--m-curva);
  }
  /* La cota: línea con topes sobre la zona roja y su rótulo (el desglose), solo con el tablero completo. */
  .cota-roja {
    position: absolute;
    right: 0;
    bottom: 6px;
    left: calc(var(--medida) * 100%);
    display: none;
    height: 18px;
    color: var(--c-crit);
    transition: left var(--m-largo) var(--m-curva);
  }
  .cota-roja::before {
    content: "";
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    border-top: 1px solid currentColor;
  }
  .cota-roja::after {
    content: "";
    position: absolute;
    inset: 2px 0;
    border-right: 1px solid currentColor;
    border-left: 1px solid currentColor;
  }
  /* El rótulo (el desglose, de unos 24 rem) no entra entre los topes de una zona de pocas unidades: va siempre alineado al borde derecho de la regla, sobre la línea, así se ve igual con 4, 3 o 1 unidades. */
  .cota-roja > span {
    position: absolute;
    right: 0;
    bottom: calc(100% - 3px);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  /* ---------- La caja: el total ---------- */
  .caja {
    position: relative;
    display: flex;
    height: 8rem;
    background: var(--c-hoja);
    border: var(--b-caja) solid var(--c-tinta);
  }
  /* La zona roja es el campo de atrás (a la derecha de la medida): así la placa del título y de la cifra de una mordaza angosta, que salen de ella, se dibujan encima. */
  .caja::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: calc((1 - var(--medida)) * 100%);
    background-color: var(--c-crit-relleno);
    background-image: var(--tx-roja);
    transition: width var(--m-largo) var(--m-curva);
  }
  /* El canto de 3 px de la mordaza, en `--c-sobre-pleno`: lo que la separa de la zona roja de día. Es el tramo del cursor dentro de la caja. */
  .caja::after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    left: max(0px, calc(var(--medida) * 100% - 3px));
    width: 3px;
    background: var(--c-sobre-pleno);
    transition: left var(--m-largo) var(--m-curva);
  }

  /* La mordaza: las disponibles. El único campo pleno de la pantalla, con grano y rejilla. Sin relleno propio (con una medida de 0 tiene que medir 0): el aire lo dan los márgenes de lo de adentro. */
  .mordaza {
    container: mordaza / inline-size;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr);
    flex: 0 0 calc(var(--medida) * 100%);
    min-width: 0;
    color: var(--c-sobre-pleno);
    background-color: var(--c-pleno);
    background-image: var(--tx-pleno);
    background-position:
      0 0,
      -1px -1px,
      -1px -1px;
    background-size:
      auto,
      48px 48px,
      48px 48px;
    transition: flex-basis var(--m-largo) var(--m-curva);
  }
  /* El título: rótulo en técnica, mayúsculas, en placa lisa (sin grano ni rejilla detrás). */
  .regla-titulo {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    margin: 8px 0 0 10px;
    padding: 0.125rem 0.375rem;
    background: var(--c-pleno);
    color: var(--c-sobre-pleno);
    font-family: var(--t-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .regla-titulo:focus-visible {
    outline: 3px solid var(--c-sobre-pleno);
    outline-offset: -1px;
  }
  /* La cifra monumental: disponibles sobre activas. Se dimensiona por el ancho de la mordaza (`cqi`), así nunca la desborda. */
  .cifra {
    grid-column: 1;
    grid-row: 2;
    align-self: end;
    justify-self: start;
    display: flex;
    align-items: flex-end;
    gap: 0.04em;
    margin: 0 0 8px 10px;
    font-size: var(--t-monumental);
    line-height: 0.74;
  }
  .de {
    padding-bottom: 0.04em;
    color: var(--c-sobre-pleno-2);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-cifra);
    font-size: max(1rem, 0.32em);
    font-weight: var(--t-peso-cifra);
    line-height: 0.8;
  }
  .registro {
    position: absolute;
    top: 12px;
    right: 16px;
    display: none;
    color: var(--c-sobre-pleno);
  }

  /* Celular (regla de menos de 37,5 rem). El título parte su renglón en vez de pasar el borde de la mordaza («DISPONIBLES / HOY»: 7,25 rem como mínimo, y la mordaza más angosta que se ve así mide 8 rem a 320 px).
     Mordaza angosta (menos de 45 % disponibles y menos de 9,75 rem de ancho): el título y la cifra salen de ella y se dibujan en una placa lisa de hoja, a la izquierda de la zona roja, que ya no es del sello:
     el sello baja a una chapa compacta a la derecha de la cifra (solo el número, o con el nombre si la zona da). La medida no se falsea. En la regla de 37,5 rem o más el corte es otro (más abajo). */
  @container salida (max-width: 37.499rem) {
    .regla-titulo {
      white-space: normal;
    }
    @container mordaza (max-width: 9.75rem) {
      .salida[data-campo="angosto"] .regla-titulo,
      .salida[data-campo="angosto"] .cifra {
        position: absolute;
        left: calc(100% + 4px);
        margin: 0;
        background: var(--c-hoja);
        color: var(--c-tinta);
        border: var(--b-fuerte) solid var(--c-tinta);
      }
      .salida[data-campo="angosto"] .regla-titulo {
        top: 8px;
        width: min-content;
      }
      .salida[data-campo="angosto"] .regla-titulo:focus-visible {
        outline-color: var(--c-foco);
      }
      .salida[data-campo="angosto"] .cifra {
        bottom: 8px;
        padding: 0.25rem 0.5rem;
      }
      .salida[data-campo="angosto"] .de {
        color: var(--c-tinta-2);
      }
    }
  }

  /* Texto muy agrandado (WCAG 1.4.4: un 200 % del texto en una pantalla de 360 px deja la regla en unos 11 rem): la mordaza y la zona roja ya no tienen sitio para el título, la cifra y el sello uno al lado del
     otro (los cortes por rem del bloque anterior se quedan sin espacio y la cifra queda debajo del sello). El título y la cifra van en sus placas de hoja, en la esquina de arriba y de abajo a la izquierda de la
     caja, sea cual sea la medida, y el sello queda anclado a la derecha, abajo; la cifra baja a 3 rem para que las dos placas entren una al lado de la otra. La medida (azul y rojo) no se falsea. */
  @container salida (max-width: 16rem) {
    .salida[data-campo] .regla-titulo,
    .salida[data-campo] .cifra {
      position: absolute;
      z-index: 2;
      left: 8px;
      margin: 0;
      background: var(--c-hoja);
      color: var(--c-tinta);
      border: var(--b-fuerte) solid var(--c-tinta);
    }
    .salida[data-campo] .regla-titulo {
      top: 8px;
      width: min-content;
    }
    .salida[data-campo] .regla-titulo:focus-visible {
      outline-color: var(--c-foco);
    }
    .salida[data-campo] .cifra {
      bottom: 8px;
      padding: 0.25rem 0.5rem;
      font-size: 3rem;
    }
    .salida[data-campo] .de {
      color: var(--c-tinta-2);
    }
  }
  /* Con menos de 9 rem (320 px con el texto al 200 %) una cifra de dos dígitos a 3 rem ya no deja lugar al sello. */
  @container salida (max-width: 9rem) {
    .salida[data-campo] .cifra {
      font-size: 2.25rem;
    }
  }

  /* ---------- Zona roja y su sello ---------- */
  .zona-roja {
    container: zona / inline-size;
    position: relative;
    z-index: 2;
    display: grid;
    flex: 1;
    align-content: end;
    justify-items: end;
    min-width: 0;
  }
  /* El sello: placa lisa roja con dos filetes, girada −1,5°. Es un enlace al filtro «No disponibles hoy». Muestra el número y, con zona para el nombre, «No disponibles hoy»; el desglose va en la cota (tablero completo) o en el rótulo del tablero corto. */
  .sello-roja {
    --aire: 5px;
    --piso: 6px;
    display: grid;
    gap: 4px;
    align-content: center;
    /* Llena la zona, pero nunca más de 12 rem: con la mordaza angosta la zona es ancha y el título y la cifra, que se dibujan sobre ella, tienen que quedar a la vista. */
    width: min(100% - 2 * var(--aire), 12rem);
    min-width: 2.75rem;
    min-height: 2.75rem;
    margin: 0 var(--aire) var(--piso);
    padding: 4px 4px 3px;
    background: var(--c-crit-relleno);
    color: var(--c-sobre-solido);
    border: var(--b-fuerte) solid var(--c-sobre-solido);
    outline: 1px solid var(--c-crit-relleno);
    text-decoration: none;
    transform: rotate(-1.5deg);
  }
  .sello-roja b {
    font-size: clamp(2.75rem, 44cqi, var(--t-cifra-grande));
    line-height: 0.78;
    text-align: center;
  }
  .se-nombre {
    display: none;
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  @media (hover: hover) {
    .sello-roja:hover {
      background: var(--c-hoja);
      color: var(--c-crit);
      text-decoration: none;
    }
  }
  .sello-roja:focus-visible {
    outline: 3px solid var(--c-foco-oscuro);
    outline-offset: -6px;
    box-shadow: 0 0 0 2px var(--c-tinta);
  }
  .sello-roja:active {
    transform: rotate(-1.5deg) translateY(1px);
  }
  @container zona (min-width: 5.5rem) {
    .sello-roja {
      --aire: 8px;
      --piso: 10px;
      padding: 8px 8px 7px;
    }
    .sello-roja b {
      text-align: left;
    }
  }
  /* El nombre entra recién con 7 rem de zona: la palabra «disponibles» mide unos 72 px y con menos se salía del sello (de 1 a 13 px). */
  @container zona (min-width: 7rem) {
    .se-nombre {
      display: block;
    }
  }
  @container zona (min-width: 11rem) {
    .sello-roja {
      --aire: 10px;
      --piso: 12px;
      padding: 10px 10px 9px;
    }
  }
  /* Regla de celular (caja de 128 px): el número del sello baja, para que entre en la caja aunque la zona sea ancha. */
  @container salida (max-width: 37.499rem) {
    .sello-roja b {
      font-size: clamp(2.75rem, 44cqi, 3.5rem);
    }
  }
  /* Celular con la mordaza angosta (menos de 45 % disponible): el título y la cifra están sobre la zona roja, a la izquierda, y el sello se corre a la derecha de ellos sin pisarlos. Primero una chapa
     con solo el número (de 2 rem, y de 2,75 rem desde 10,5 rem de zona); con 14,25 rem de zona entra también el nombre, a la derecha del título (que mide 7 rem en dos renglones). */
  @container salida (max-width: 37.499rem) {
    @container zona (min-width: 5.5rem) {
      .salida[data-campo="angosto"] .sello-roja {
        --aire: 4px;
        --piso: 6px;
        width: max-content;
        min-width: 2.75rem;
        padding: 3px 5px 2px;
        transform: none; /* sin giro: al lado de la placa del título, el giro hacía asomar la esquina (hasta 2,6 px con el espaciado de texto aumentado) */
      }
      .salida[data-campo="angosto"] .sello-roja:active {
        transform: translateY(1px);
      }
      .salida[data-campo="angosto"] .sello-roja b {
        font-size: 2rem;
        text-align: center;
      }
      .salida[data-campo="angosto"] .se-nombre {
        display: none;
      }
    }
    @container zona (min-width: 10.5rem) {
      .salida[data-campo="angosto"] .sello-roja b {
        font-size: 2.75rem;
      }
    }
    @container zona (min-width: 14.5rem) {
      .salida[data-campo="angosto"] .sello-roja {
        --aire: 8px;
        width: min(100% - 8rem - var(--aire), 12rem);
        padding: 8px 8px 7px;
      }
      .salida[data-campo="angosto"] .sello-roja b {
        text-align: left;
      }
      .salida[data-campo="angosto"] .se-nombre {
        display: block;
      }
    }
  }
  /* Texto muy agrandado (ver arriba, 16 rem): el sello es la chapa compacta con solo el número, a la derecha y abajo, sea cual sea el ancho de la zona; sin el nombre, que no entra al lado de la cifra. */
  @container salida (max-width: 16rem) {
    .salida[data-campo] .sello-roja {
      --aire: 4px;
      --piso: 6px;
      width: max-content;
      min-width: 2.75rem;
      padding: 3px 5px 2px;
      margin-inline: 0; /* con la zona apenas más ancha que la chapa, los 4 px de margen la sacaban de la caja (1 a 4 px según el texto) */
      transform: none; /* sin giro: la esquina girada asomaba unos 2 px por el borde de la caja */
    }
    .salida[data-campo] .sello-roja:active {
      transform: translateY(1px);
    }
    .salida[data-campo] .sello-roja b {
      font-size: 2rem;
      text-align: center;
    }
    .salida[data-campo] .sello-roja .se-nombre {
      display: none;
    }
  }
  /* Una sola unidad no disponible: el sello es solo el número. El nombre visible diría «No disponibles hoy» y el nombre accesible, «1 no disponible hoy» (WCAG 2.5.3, el texto visible no sería parte del
     nombre). */
  .sello-roja[data-uno] .se-nombre {
    display: none;
  }
  /* Zona roja más angosta que el sello (menos de 2,75 rem; por ejemplo una sola no disponible a 360 px): el sello sale de ella y se ancla a la esquina inferior derecha de la caja, por dentro del borde; crece
     hacia la izquierda, sobre la mordaza. Sin giro, solo el número y 44 px de alto como mínimo. Su borde blanco es lo que lo recorta sobre el cobalto. */
  @container zona (max-width: 2.749rem) {
    .sello-roja {
      position: absolute;
      right: 0;
      bottom: 0;
      width: max-content;
      height: 2.75rem;
      margin: 0;
      padding: 0 8px;
      outline: 0;
      transform: none;
    }
    .sello-roja b {
      font-size: 1.75rem;
    }
    .sello-roja:active {
      transform: translateY(1px);
    }
  }
  /* La tapa de la entrada (15.10): una placa de color pleno sobre la zona roja. En reposo mide 0; solo existe, entera, en el cuadro 0. */
  .tapa {
    position: absolute;
    z-index: 3;
    inset: 0;
    background-color: var(--c-pleno);
    background-image: var(--tx-pleno);
    background-size:
      auto,
      48px 48px,
      48px 48px;
    transform: scaleX(0);
    transform-origin: 0 50%;
    pointer-events: none;
  }

  /* ---------- Escala, cursor y tablero: miden lo mismo que el interior de la caja ---------- */
  .tablero {
    position: relative;
    margin: 0 2px;
  }
  .cursor-linea {
    position: absolute;
    z-index: 3;
    top: 0;
    left: calc(var(--medida) * 100% - 1px);
    width: 2px;
    height: calc(1.625rem + 11px);
    background: var(--c-tinta);
    pointer-events: none;
    transition: left var(--m-largo) var(--m-curva);
  }
  .escala {
    position: relative;
    height: 1.625rem;
    color: var(--c-tinta);
  }
  /* Marcas con gradientes (ningún nodo por marca): menor cada unidad, mayor cada 5. */
  .escala-marcas {
    --menor: 6px;
    position: absolute;
    inset: 0 0 auto 0;
    height: 11px;
    border-right: var(--b-fuerte) solid currentColor;
    background:
      linear-gradient(to right, currentColor 0 1px, transparent 1px) 0 0 / calc(100% / var(--act)) var(--menor) repeat-x,
      linear-gradient(to right, currentColor 0 1.5px, transparent 1.5px) 0 0 / calc(100% * 5 / var(--act)) 11px repeat-x;
  }
  .escala-marcas[data-menores="no"] {
    --menor: 0px;
  }
  .escala-num {
    position: absolute;
    top: 13px;
    left: calc(var(--x) * 100%);
    color: var(--c-tinta-2);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    /* Los extremos se alinean al borde (0: a la derecha de la marca; 1: a la izquierda); los demás se centran. */
    translate: -50% 0;
  }
  .escala-num[data-tipo="extremo"] {
    translate: calc(var(--x) * -100%) 0;
  }
  .escala-num[data-tipo="marca"] {
    display: none;
  }
  /* La lectura, en un recuadro de tinta. */
  .escala-num[data-tipo="lectura"] {
    z-index: 4;
    top: 11px;
    padding: 2px 4px;
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
    transition: left var(--m-largo) var(--m-curva);
  }

  /* ---------- Tablero completo: el riel de las llaves y el rótulo de cota ---------- */
  /* La ayuda de las flechas describe la lista completa (`aria-describedby`, que lee también un texto oculto). Si la lista no se muestra, este párrafo no se lee suelto. */
  .solo-lectores.ayuda-llaves {
    display: none;
  }
  .llaves {
    position: relative;
    display: none;
    grid-template-columns: repeat(var(--act), minmax(0, 1fr));
  }
  .llaves::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: var(--c-tinta);
  }
  /* Los globos (de las llaves que no salen, de la lista «No disponibles hoy» de Inicio y de la «Acción del día»): 20 px con el número de pieza, en el color de texto de su tono. */
  :global(.globo) {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    background: var(--c-hoja);
    color: var(--tono-t, var(--c-tinta));
    border: var(--b-control) solid currentColor;
    border-radius: var(--r-redondo);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
  }
  /* El único rótulo de cota, compartido: un objeto bajo la llave señalada, con una guía de 14 px. Se alinea al borde con `clamp()` sobre `--x` para no salirse. */
  .rotulo-cota {
    --ancho-tablero: calc(100cqi - 4px);
    --izq: clamp(0px, calc(var(--x) * var(--ancho-tablero) - 7.125rem), calc(var(--ancho-tablero) - 14.25rem));
    position: absolute;
    z-index: 6;
    top: calc(100% + 0.875rem);
    left: var(--izq);
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
    gap: 4px 8px;
    width: 14.25rem;
    padding: 8px 10px;
    background: var(--c-hoja);
    border: var(--b-fuerte) solid var(--c-tinta);
    box-shadow: var(--s-flotante);
  }
  .rotulo-cota::before {
    content: "";
    position: absolute;
    bottom: calc(100% + var(--b-fuerte));
    left: calc(var(--x) * var(--ancho-tablero) - var(--izq) - 2.25px);
    height: 14px;
    border-left: var(--b-fuerte) solid var(--c-tinta);
  }
  .rc-patente {
    font-family: var(--t-mono);
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }
  .rc-interno {
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
  }
  .rc-estado {
    display: flex;
    grid-column: 1 / -1;
    align-items: baseline;
    gap: 6px;
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.3;
  }
  .rc-estado :global(.forma) {
    align-self: center;
  }
  .rc-ayuda {
    grid-column: 1 / -1;
    padding-top: 6px;
    color: var(--c-tinta-2);
    border-top: 1px solid var(--c-filete-medio);
    font-size: var(--t-rotulo);
    line-height: 1.3;
  }

  /* ---------- Tablero corto: riel con un gancho por unidad activa y, colgadas, solo las que no salen ---------- */
  .corto-ganchos {
    height: 11px;
    background:
      linear-gradient(var(--c-tinta), var(--c-tinta)) 0 0 / 100% 3px no-repeat,
      linear-gradient(to right, transparent calc(50% - 1px), var(--c-tinta) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 3px / calc(100% / var(--act)) 8px repeat-x;
  }
  .corto-rotulo {
    margin: 8px -2px 6px;
    color: var(--c-tinta-2);
    font-size: var(--t-rotulo);
    line-height: 1.35;
  }
  /* Las dos mitades del desglose no se parten por dentro: si no entran juntas, el renglón se corta en el punto medio. */
  .corto-rotulo .parte {
    white-space: nowrap;
  }
  /* Texto muy agrandado (la regla mide 16 rem o menos): cada mitad ya no entra en un renglón y parte donde haga falta, en lugar de ensanchar la página. */
  @container salida (max-width: 16rem) {
    .corto-rotulo .parte {
      white-space: normal;
    }
  }
  .corto-rotulo b {
    margin-right: 6px;
    color: var(--c-crit);
    font-family: var(--t-mono);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .colgadas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    margin: 0 -2px;
  }
  /* El riel de cada chapa es el filete de arriba de su casilla (3 px): continuo entre casillas y, si una patente parte su renglón (texto agrandado o espaciado aumentado), el riel sigue pegado a su fila. */
  .colgadas > li {
    min-width: 0;
    border-top: 3px solid var(--c-tinta);
  }
  .colgada {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 2.5rem;
    padding-top: 8px;
    color: var(--c-tinta);
    text-decoration: none;
  }
  .colgada::before {
    content: "";
    position: absolute;
    top: 0;
    left: calc(50% - 1px);
    width: 2px;
    height: 8px;
    background: var(--c-tinta);
  }
  .colgada:focus-visible {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }
  /* Cada chapa es un objeto de papel con el precinto de su tono y un giro de ±2°. */
  .colgada-chapa {
    display: block;
    padding: 2.5px 2px;
    border: var(--b-control) solid var(--c-tinta);
    border-radius: 2px;
    box-shadow: var(--s-pieza);
    transform: rotate(2deg);
    transform-origin: 50% -8px;
  }
  .colgadas > li:nth-child(even) .colgada-chapa {
    transform: rotate(-2deg);
  }
  .colgada-pat {
    display: block;
    padding: 5px 1.5px;
    border: 1px solid transparent;
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    /* La patente parte su renglón en el espacio antes que pisar a la chapa de al lado (con el espaciado de letras aumentado, WCAG 1.4.12, o con el texto al 200 %). */
    overflow-wrap: anywhere;
  }
  /* «y N más» no tiene tono: su chapa es de papel claro también de noche (sin fondo, la tinta del objeto quedaba oscura sobre el fondo oscuro de la página). */
  .colgada-mas .colgada-chapa {
    background-color: var(--c-hoja);
  }
  .colgada[data-tono="critico"] .colgada-chapa {
    background-color: var(--c-crit-relleno);
    background-image: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--obj-tinta) 26%, transparent) 0 2px, transparent 2px 6px);
    border-color: var(--obj-contorno);
  }
  .colgada[data-tono="critico"] .colgada-pat {
    background: var(--c-crit-relleno);
    color: var(--c-sobre-solido);
    border-color: var(--c-sobre-solido);
  }
  .colgada[data-tono="neutro"] .colgada-chapa {
    background-color: var(--c-papel-2);
    background-image: repeating-linear-gradient(-45deg, var(--c-tinta-3) 0 1.5px, transparent 1.5px 6px);
  }
  .colgada[data-tono="neutro"] .colgada-pat {
    background: var(--c-hoja);
    color: var(--c-tinta);
    border-color: var(--c-tinta-3);
  }
  .colgada:active .colgada-chapa {
    translate: 0 1px;
  }
  /* Texto agrandado al 200 %: una chapa por renglón. */
  @container salida (max-width: 14rem) {
    .colgadas {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  /* ---------- Renglones de lectura: las cuatro cifras de hoy ---------- */
  .renglones {
    --icono-tam: 1rem;
    display: grid;
    /* Una columna que no crece con su contenido: con el texto al 200 % el rótulo parte su renglón en lugar de ensanchar la página. */
    grid-template-columns: minmax(0, 1fr);
  }
  .renglones a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 1.5rem;
    color: inherit;
    text-decoration: none;
  }
  .renglones :global(.icono) {
    flex: none;
  }
  .lc {
    min-width: 1.1em;
    font-family: var(--t-familia-titulo);
    font-size: 2rem;
    font-stretch: var(--t-ancho-cifra);
    font-weight: var(--t-peso-cifra);
    line-height: 1;
    text-align: right;
  }
  .lr {
    flex: 1;
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.25;
  }
  .renglones[data-donde="dentro"] {
    display: none;
  }
  /* Fuera de la mordaza: una hoja con cabeza de 1,5 px en tinta, debajo de la «Acción del día». */
  .renglones[data-donde="fuera"] {
    margin-top: 0.75rem;
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
  }
  .renglones[data-donde="fuera"] a {
    min-height: 2.75rem;
    padding: 4px 12px;
    border-bottom: 1px solid var(--c-filete);
  }
  .renglones[data-donde="fuera"] li:last-child a {
    border-bottom: 0;
  }
  .renglones[data-donde="fuera"] a:focus-visible {
    outline-offset: -3px;
  }
  .renglones[data-donde="fuera"] :global(.icono) {
    color: var(--c-tinta-3);
  }
  @media (hover: hover) {
    .renglones[data-donde="fuera"] a:hover {
      background: var(--c-papel-2);
      text-decoration: none;
    }
    .renglones[data-donde="fuera"] a:hover .lc {
      color: var(--c-pleno-texto);
    }
  }

  /* ---------- «Acción del día»: una nota de plano, siempre en el flujo ---------- */
  .accion {
    /* El alto de los botones de la nota: 40 px por debajo de 56 rem de nota (15.7); `Boton` y `EnlaceAccion` lo leen. */
    --alto-control: 2.5rem;
    position: relative;
    display: grid;
    gap: 10px;
    margin-top: 0.75rem;
    padding: 11px 12px 12px;
    background: var(--c-hoja);
    border: var(--b-fuerte) solid var(--c-tinta);
    box-shadow: var(--s-pieza);
  }
  /* La guía: une el borde de arriba de la nota con el globo de su pieza (solo con el tablero completo). */
  .accion-guia {
    position: absolute;
    bottom: calc(100% + var(--b-fuerte));
    left: calc(0.5px + var(--x) * (100% - 1px) - 0.75px);
    display: none;
    height: 0.75rem;
    border-left: var(--b-fuerte) solid var(--c-tinta);
  }
  .accion-texto {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 8px;
    row-gap: 5px;
    align-items: center;
    min-width: 0;
  }
  .accion-globo {
    display: none;
  }
  .accion-ok {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    color: var(--c-ok);
    border: 2px solid currentColor;
    border-radius: var(--r-redondo);
  }
  .accion-rotulo {
    color: var(--c-tinta-3);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .accion-frase {
    grid-column: 1 / -1;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.35;
  }
  .accion-botones {
    display: grid;
    gap: 10px;
  }
  /* El botón de la acción tiene aspecto pleno: es el único de la pantalla. */
  .accion-botones > :global(.boton[data-variante="primario"]) {
    --b-fondo: var(--c-pleno);
    --b-texto: var(--c-sobre-pleno);
    --b-borde: var(--c-pleno-borde);
    --b-fondo-hover: var(--c-pleno-hover);
  }
  .accion-desc {
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  .accion-estado {
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  /* La región `role="status"` sigue en el árbol de accesibilidad aunque esté vacía (si no, no anunciaría lo que entra), pero sin ocupar lugar. */
  .accion-estado.vacio {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  /* Nota de 26 rem o más: dos filas; los dos botones lado a lado y, bajo «Probar como conductor», su frase de invitación. */
  @container salida (min-width: 26rem) {
    .accion {
      grid-template-columns: auto auto minmax(0, 1fr);
      column-gap: 10px;
    }
    .accion-texto,
    .accion-estado {
      grid-column: 1 / -1;
    }
    .accion-botones {
      display: contents;
    }
    .accion-desc {
      grid-column: 2 / -1;
    }
  }
  /* Nota de 56 rem o más: una fila (globo, rótulo, frase; botones a la derecha), con la frase de invitación bajo «Probar como conductor». */
  @container salida (min-width: 56rem) {
    .accion {
      --alto-control: 2.25rem;
      grid-template-columns: minmax(0, 1fr) auto minmax(auto, 14.5rem);
      align-items: center;
      column-gap: 0.625rem;
      row-gap: 6px;
      padding: 10px 12px 11px 14px;
    }
    .accion-texto {
      display: flex;
      grid-column: 1;
      gap: 10px;
    }
    .accion-rotulo {
      white-space: nowrap;
    }
    .accion-frase {
      flex: 1;
      min-width: 0;
    }
    .accion-desc {
      grid-column: 3;
    }
  }

  /* ---------- El tablero completo, según la cantidad de unidades activas (`data-carga`, 15.6.3): hasta 24 desde 37,5 rem de regla; 25 a 30 desde 47,5 rem; 31 a 46 desde 70,5 rem; más, nunca ---------- */
  @container salida (min-width: 37.5rem) {
    .salida-cota {
      height: 2rem;
    }
    .caja {
      height: 12.25rem;
    }
    .cifra {
      margin: 0 0 16px 18px;
      font-size: var(--t-monumental-ancho);
    }
    .regla-titulo {
      margin: 12px 0 0 18px;
      font-size: 0.875rem;
    }
    .renglones[data-donde="fuera"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .renglones[data-donde="fuera"] li:nth-child(odd) a {
      border-right: 1px solid var(--c-filete);
    }
    .renglones[data-donde="fuera"] li:nth-last-child(-n + 2) a {
      border-bottom: 0;
    }
    .salida[data-carga="a"] .corto {
      display: none;
    }
    .salida[data-carga="a"] .llaves {
      display: grid;
    }
    .salida[data-carga="a"] .cota-roja {
      display: flex;
    }
    .salida[data-carga="a"] .cursor-linea {
      bottom: 2rem;
      height: auto;
    }
    .salida[data-carga="a"] .escala-num[data-tipo="marca"] {
      display: block;
    }
    .salida[data-carga="a"] .accion-guia {
      display: block;
    }
    .salida[data-carga="a"] .accion-globo {
      display: inline-grid;
    }
    /* Mordaza angosta: con la regla de 37,5 rem o más el título es de 14 px y el corte sube a 10,25 rem. */
    @container mordaza (max-width: 10.25rem) {
      .regla-titulo,
      .cifra {
        position: absolute;
        left: calc(100% + 0.5rem);
        margin: 0;
        background: var(--c-hoja);
        color: var(--c-tinta);
        border: var(--b-fuerte) solid var(--c-tinta);
      }
      .regla-titulo {
        top: 8px;
      }
      .regla-titulo:focus-visible {
        outline-color: var(--c-foco);
      }
      .cifra {
        bottom: 8px;
        padding: 0.25rem 0.5rem;
      }
      .de {
        color: var(--c-tinta-2);
      }
    }
  }
  @container salida (min-width: 47.5rem) {
    .salida[data-carga="b"] .corto {
      display: none;
    }
    .salida[data-carga="b"] .llaves {
      display: grid;
    }
    .salida[data-carga="b"] .cota-roja {
      display: flex;
    }
    .salida[data-carga="b"] .cursor-linea {
      bottom: 2rem;
      height: auto;
    }
    .salida[data-carga="b"] .escala-num[data-tipo="marca"] {
      display: block;
    }
    .salida[data-carga="b"] .accion-guia {
      display: block;
    }
    .salida[data-carga="b"] .accion-globo {
      display: inline-grid;
    }
  }
  @container salida (min-width: 70.5rem) {
    .salida[data-carga="c"] .corto {
      display: none;
    }
    .salida[data-carga="c"] .llaves {
      display: grid;
    }
    .salida[data-carga="c"] .cota-roja {
      display: flex;
    }
    .salida[data-carga="c"] .cursor-linea {
      bottom: 2rem;
      height: auto;
    }
    .salida[data-carga="c"] .escala-num[data-tipo="marca"] {
      display: block;
    }
    .salida[data-carga="c"] .accion-guia {
      display: block;
    }
    .salida[data-carga="c"] .accion-globo {
      display: inline-grid;
    }
  }
  /* Regla de 60 rem o más: caja alta y, con el campo ancho y menos de 47 unidades activas, los renglones de lectura dentro de la mordaza (en una placa lisa, sobre el pleno). */
  @container salida (min-width: 60rem) {
    .caja {
      height: 15.75rem;
    }
    .cifra {
      margin: 0 0 22px 22px;
    }
    .regla-titulo {
      margin: 14px 0 0 22px;
    }
    .salida[data-campo="ancho"]:not([data-carga="d"]) .registro {
      display: block;
    }
    .salida[data-campo="ancho"]:not([data-carga="d"]) .renglones[data-donde="fuera"] {
      display: none;
    }
    .salida[data-campo="ancho"]:not([data-carga="d"]) .renglones[data-donde="dentro"] {
      grid-column: 2;
      grid-row: 1 / -1;
      display: grid;
      align-self: center;
      width: min(22rem, 40cqi);
      margin-right: 25px;
      padding: 2px 12px;
      background: var(--c-pleno);
    }
    .renglones[data-donde="dentro"] a {
      min-height: 2.25rem;
      color: var(--c-sobre-pleno);
      border-bottom: 1px solid var(--c-sobre-pleno-2);
    }
    .renglones[data-donde="dentro"] li:last-child a {
      border-bottom: 0;
    }
    .renglones[data-donde="dentro"] .lc {
      font-size: 1.75rem;
    }
    /* Sobre el pleno el estado lo dicen la forma y la palabra, sin color de tono. */
    .renglones[data-donde="dentro"] :global(.forma) {
      --tono-r: var(--c-sobre-pleno);
    }
    .renglones[data-donde="dentro"] a:focus-visible {
      outline: 3px solid var(--c-sobre-pleno);
      outline-offset: -3px;
    }
    @media (hover: hover) {
      .renglones[data-donde="dentro"] a:hover {
        background: var(--c-pleno-hover);
        text-decoration: none;
      }
    }
  }

  /* ---------- Flota vacía: el cuadro cero con un mensaje en lugar del progreso ---------- */
  .caja-cero {
    display: grid;
    gap: var(--e-2);
    align-content: center;
    justify-items: start;
    height: auto;
    min-height: 8rem;
    padding: var(--e-4);
  }
  .caja-cero::before,
  .caja-cero::after {
    display: none;
  }
  .caja-cero .regla-titulo {
    margin: 0;
    padding: 0;
    background: none;
    color: var(--c-tinta);
    font-family: var(--t-familia-titulo);
    font-size: var(--t-h2);
    font-stretch: var(--t-ancho-titulo);
    font-weight: var(--t-peso-cartel);
    letter-spacing: 0;
    line-height: 1.1;
    text-transform: none;
    white-space: normal;
  }
  .caja-cero .regla-titulo:focus-visible {
    outline-color: var(--c-foco);
    outline-offset: 2px;
  }
  .vacia-mensaje {
    font-weight: 650;
  }
  .vacia-ayuda {
    color: var(--c-tinta-2);
  }

  /* ---------- Entrada (15.10): una pieza por vez, solo con `transform` y `opacity`. Las reglas existen solo con `data-entrada="completa"`; el reposo (fija, breve, quieta) es el estado final de arriba.
     `data-pausa` las deja detenidas en el primer cuadro: la caja es toda pleno, el cursor está en el extremo y las llaves cuelgan derechas. ---------- */
  :global([data-entrada="completa"]) .tapa {
    animation: cierra 540ms var(--m-curva) 120ms backwards;
  }
  :global([data-entrada="completa"]) .caja::after,
  :global([data-entrada="completa"]) .cursor-cabeza,
  :global([data-entrada="completa"]) .cursor-linea {
    animation: corre 540ms var(--m-curva) 120ms backwards;
  }
  /* El recuadro de la lectura y la cota aparecen en los últimos 120 ms del gesto: son su remate. */
  :global([data-entrada="completa"]) .escala-num[data-tipo="lectura"],
  :global([data-entrada="completa"]) .cota-roja {
    animation: aparece 120ms linear 540ms backwards;
  }
  :global([data-entrada="completa"]) .colgada-chapa {
    animation: cae 160ms var(--m-curva-resorte) calc(660ms + var(--j, 0) * var(--paso-caida)) backwards;
  }
  :global([data-entrada="completa"]) .sello-roja {
    animation: estampa 160ms var(--m-curva-resorte) 880ms backwards;
  }
  :global([data-pausa]) .tapa,
  :global([data-pausa]) .caja::after,
  :global([data-pausa]) .cursor-cabeza,
  :global([data-pausa]) .cursor-linea,
  :global([data-pausa]) .escala-num,
  :global([data-pausa]) .cota-roja,
  :global([data-pausa]) .colgada-chapa,
  :global([data-pausa]) .sello-roja {
    animation-play-state: paused;
  }
  @keyframes cierra {
    from {
      transform: scaleX(1);
    }
  }
  @keyframes corre {
    from {
      transform: translateX(var(--falta));
    }
  }
  @keyframes aparece {
    from {
      opacity: 0;
    }
  }
  @keyframes cae {
    from {
      translate: 0 -6px;
      transform: rotate(0deg);
    }
  }
  @keyframes estampa {
    from {
      scale: 1.35;
      opacity: 0;
    }
  }

  /* ---------- Colores forzados: la mordaza en `Highlight`, los bordes en `CanvasText`, sin trama; el dato no depende de un color de autor ---------- */
  @media (forced-colors: active) {
    .caja,
    .accion,
    .rotulo-cota {
      border-color: CanvasText;
    }
    .mordaza {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
    }
    .regla-titulo,
    .renglones[data-donde="dentro"] {
      background: Highlight;
      color: HighlightText;
    }
    .caja::before {
      forced-color-adjust: none;
      background: Canvas;
      background-image: repeating-linear-gradient(-45deg, CanvasText 0 2px, transparent 2px 7px);
    }
    .caja::after,
    .cursor-linea {
      forced-color-adjust: none;
      background: CanvasText;
    }
    .sello-roja {
      forced-color-adjust: none;
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }
    .colgada-chapa {
      forced-color-adjust: none;
      background: Canvas;
      border-color: CanvasText;
    }
    .colgada-pat {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }
    .tapa {
      display: none;
    }
  }
</style>
