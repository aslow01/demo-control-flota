<script lang="ts">
  // Página de muestras de los componentes de 3.2 (solo en desarrollo, ver muestras.html). Datos ficticios.
  // Sirve para mirar cada pieza en claro y oscuro, a 360 y 1280 px, y para recorrerlas con teclado.
  import Aviso from "../componentes/Aviso.svelte";
  import Boton from "../componentes/Boton.svelte";
  import BotonConfirmar from "../componentes/BotonConfirmar.svelte";
  import Campo from "../componentes/Campo.svelte";
  import Dialogo from "../componentes/Dialogo.svelte";
  import Dato from "../componentes/Dato.svelte";
  import EnlaceAccion from "../componentes/EnlaceAccion.svelte";
  import Etiqueta from "../componentes/Etiqueta.svelte";
  import Horizonte from "../componentes/Horizonte.svelte";
  import Icono from "../componentes/Icono.svelte";
  import Panel from "../componentes/Panel.svelte";
  import Patente from "../componentes/Patente.svelte";
  import { ETIQUETAS_DE_PARTE, ICONOS, type NombreIcono, type Tono } from "../componentes/tipos.ts";
  import { SEMILLA_POR_DEFECTO, generar } from "../lib/datos/generador.ts";
  import { calcularAlertas, type Alerta } from "../lib/dominio/alertas.ts";
  import { horizonteCompleto, horizonteDeUnidad, horizonteMinimo } from "../lib/dominio/horizonte.ts";
  import { formatearPatente } from "../lib/dominio/patente.ts";
  import { textoUnidadNoPuedeSalir } from "../lib/dominio/textos-conductor.ts";
  import type { Grupo } from "../lib/dominio/vencimientos.ts";

  const colores: { grupo: string; nombres: string[] }[] = [
    {
      grupo: "Base",
      nombres: [
        "escritorio",
        "fondo",
        "superficie",
        "superficie-2",
        "ventana-barra",
        "ventana-borde",
        "borde",
        "borde-fuerte",
        "texto",
        "texto-2",
        "texto-3",
        "acento",
        "acento-hover",
        "acento-suave",
        "edicion",
        "patente-fondo",
        "patente-banda",
        "hoy",
      ],
    },
    ...(["critico", "semana", "quincena", "mes", "vigente", "neutro"] as const).map((t) => ({
      grupo: t,
      nombres: [`${t}-t`, `${t}-f`, `${t}-r`],
    })),
  ];

  const etiquetas: { tono: Tono; icono: NombreIcono; texto: string; variante?: "texto" }[] = [
    { tono: "critico", icono: "vencido", texto: "Vencido hace 3 días" },
    { tono: "critico", icono: "vencido", texto: "Vencido hace 1 día" },
    { tono: "critico", icono: "faltante", texto: "Falta cargar" },
    { tono: "semana", icono: "reloj", texto: "Vence hoy" },
    { tono: "semana", icono: "alerta", texto: "Vence mañana" },
    { tono: "semana", icono: "alerta", texto: "Vence en 6 días" },
    { tono: "quincena", icono: "calendario", texto: "Vence en 12 días" },
    { tono: "mes", icono: "anillo", texto: "Vence en 24 días" },
    { tono: "vigente", icono: "check", texto: "Vigente hasta 12/05/2027" },
    { tono: "neutro", icono: "guion", texto: "Reemplazado el 17/11/2026" },
    { tono: "vigente", icono: "check", texto: "Puede salir", variante: "texto" },
    { tono: "critico", icono: "vencido", texto: "No puede salir" },
    { tono: "semana", icono: "llave", texto: "Fuera de servicio" },
    { tono: "neutro", icono: "caja", texto: "De baja" },
    { tono: "critico", icono: "octogono", texto: "Crítica" },
    { tono: "semana", icono: "llave", texto: "Abierta" },
    { tono: "neutro", icono: "check", texto: "Resuelta el 16/11/2026" },
    // Parte y conductor (5.7, 19/11/2026): «Cerrado», «Borrador», «En uso», «Sin enviar», «Sin cerrar» y «Sin licencia vigente» salen de la misma tabla que usan las pantallas.
    ...Object.values(ETIQUETAS_DE_PARTE),
    { tono: "semana", icono: "guion", texto: "Sin parte" },
    { tono: "critico", icono: "vencido", texto: "Con documentación vencida" },
    { tono: "neutro", icono: "octogono", texto: "Punto crítico" },
  ];

  const escala: { nombre: string; variable: string; texto: string }[] = [
    { nombre: "cifra", variable: "--t-cifra", texto: "4 unidades" },
    { nombre: "h1", variable: "--t-h1", texto: "Centro de alertas" },
    { nombre: "h2", variable: "--t-h2", texto: "Vencen en 7 días o menos" },
    { nombre: "h3", variable: "--t-h3", texto: "Vencidos y faltantes (2)" },
    { nombre: "cuerpo", variable: "--t-cuerpo", texto: "Texto general de la aplicación, a 16 px." },
    { nombre: "tabla", variable: "--t-tabla", texto: "Seguro · DEMO-88-4471 · 17/11/2026" },
    { nombre: "chico", variable: "--t-chico", texto: "Ayudas, rótulos y segunda línea." },
  ];

  // Horizonte (5.6): el ejemplo del generador (semilla fija y "hoy" fijo) y casos armados a mano para los bordes.
  const HOY_MUESTRA = "2026-11-18";
  const estadoMuestra = generar(SEMILLA_POR_DEFECTO, HOY_MUESTRA);
  const alertasMuestra = calcularAlertas(estadoMuestra, HOY_MUESTRA);
  const vencimientosMuestra = alertasMuestra.alertas.filter((a) => a.categoria === "vencimientos");
  const patenteDe = (a: Alerta): string => {
    const u = estadoMuestra.unidades.find((x) => x.id === a.unidadId);
    if (u !== undefined) return formatearPatente(u.patente);
    return estadoMuestra.conductores.find((c) => c.id === a.conductorId)?.nombre ?? "";
  };

  function alertaDeEjemplo(id: string, d: number, unidadId: string): Alerta {
    const grupo: Grupo = d < 0 ? "vencidos" : d <= 7 ? "7" : d <= 15 ? "15" : "30";
    return {
      id,
      categoria: "vencimientos",
      tipo: d < 0 ? "documento-vencido" : "documento-por-vencer",
      gravedad: d < 0 ? "critica" : d <= 7 ? "media" : "baja",
      grupo,
      texto: "",
      unidadId,
      conductorId: null,
      documentoId: id,
      tipoDocumento: "seguro",
      d,
      fecha: null,
      etapaParte: null,
    };
  }
  const deEjemplo = (unidadId: string, dias: number[]): { alertas: Alerta[] } => ({
    alertas: dias.map((d, i) => alertaDeEjemplo(`${unidadId}-${i}`, d, unidadId)),
  });

  const horizonteDelEjemplo = horizonteCompleto(alertasMuestra);
  const horizonteVacio = horizonteCompleto({ alertas: [] });
  const horizonteSoloVencidos = horizonteCompleto(deEjemplo("u-x", [-3, -1]));
  // Seis el mismo día: cuatro apiladas (tres llenas y un aro) y el día 30 pegado al borde derecho.
  const horizonteApilado = horizonteCompleto(deEjemplo("u-x", [0, 5, 5, 5, 5, 5, 5, 7, 8, 15, 16, 30, 30, -2]));
  const diasUnidad = [-3, 0, 5, 5, 12, 22, 30];
  const horizonteUnidad = horizonteDeUnidad(deEjemplo("u-demo", diasUnidad), "u-demo");
  const horizonteUnidadVacio = horizonteDeUnidad(deEjemplo("u-demo", [-3]), "u-demo");
  const filasMinima: { unidad: string; texto: string; dias: number[] }[] = [
    { unidad: "ZK 214 BD", texto: "Revisión técnica · hoy", dias: [0, 6, 20] },
    { unidad: "ZYN 469", texto: "Seguro · en 6 días", dias: [6] },
    { unidad: "ZI 442 TU", texto: "Carga del matafuego · en 12 días", dias: [12, 12] },
    { unidad: "ZM 904 EB", texto: "Habilitación · en 30 días", dias: [30] },
    { unidad: "ZEP 235", texto: "Seguro vencido (sin horizonte)", dias: [-4] },
  ];
  const minimas = filasMinima.map((f, i) => ({ ...f, horizonte: horizonteMinimo(deEjemplo(`u-${i}`, f.dias), `u-${i}`) }));

  // Campos
  let texto = $state("DEMO-88-4471");
  let textoVacio = $state("");
  let km = $state("84320");
  let kmInvalido = $state("84.100");
  let litros = $state("42,5");
  let fecha = $state("2026-11-17");
  let largo = $state("Pérdida de aceite debajo del motor. ".repeat(12).trim());
  let corto = $state("");
  let proyecto = $state("a");
  let grande = $state("84320");

  // Diálogo y confirmación
  let dialogoDemo = $state(false);
  let dialogoDemoKm = $state("84320");
  let dialogoDemoTexto = $state("");
  let descartes = $state(0);

  // Botones
  let guardando = $state(false);
  let confirmar = $state(false);
  let estadoPanel = $state("Seguro renovado: vence 15/11/2027.");
</script>

<a class="saltar" href="#principal">Ir al contenido</a>

<header class="encabezado contenedor">
  <p class="rotulo">Solo desarrollo</p>
  <h1>Muestras de componentes</h1>
  <p class="parrafo nota">
    Paso 3.2. Todo es ficticio. El modo claro u oscuro sigue al dispositivo. Esta página no está en la compilación de producción.
  </p>
</header>

<main id="principal" class="contenedor pagina">
  <Panel titulo="Colores" meta="tokens.css" icono="estado">
    {#each colores as g (g.grupo)}
      <div class="grupo">
        <h3 class="nota">{g.grupo}</h3>
        <ul class="muestras-color">
          {#each g.nombres as n (n)}
            <li>
              <span class="cuadro" style:background-color={`var(--c-${n})`}></span>
              <span class="nota codigo">--c-{n}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </Panel>

  <Panel titulo="Tipografía" meta="familia del sistema, sin fuentes externas">
    {#each escala as e (e.nombre)}
      <div class="renglon-escala">
        <span class="nota codigo">{e.nombre}</span>
        <span class="texto-escala" style:font-size={`var(${e.variable})`} data-nombre={e.nombre}>{e.texto}</span>
      </div>
    {/each}
    <p class="nota">
      Cifras tabulares: <span class="num">84.320 km · 1.234 km · 0.111 km</span> · Código: <span class="codigo">DEMO-88-4471</span> ·
      Rótulo: <span class="rotulo">Próximo vencimiento</span>
    </p>
  </Panel>

  <Panel titulo="Íconos" meta="{ICONOS.length} en el sprite" icono="marca">
    <ul class="iconos">
      {#each ICONOS as nombre (nombre)}
        <li>
          <span class="icono-grande"><Icono {nombre} /></span>
          <span class="nota codigo">{nombre}</span>
        </li>
      {/each}
    </ul>
    <p class="nota">Tamaños: <span class="tam-14"><Icono nombre="check" /></span> 14 · <Icono nombre="check" /> 20 · <span class="tam-24"><Icono nombre="check" /></span> 24</p>
  </Panel>

  <Panel titulo="Patente" meta="5.5">
    <div class="fila-muestra">
      <Patente patente="ZK214BD" />
      <Patente patente="ZKB482" />
      <Patente patente="ZK214BD" tamano="grande" />
      <Patente patente="ZKB482" tamano="grande" />
    </div>
    <h3 class="fila-muestra">Ficha de la unidad: <Patente patente="ZK214BD" tamano="grande" /></h3>
    <p class="nota">Como enlace (el nombre accesible es «Ficha de ZK 214 BD»; el área de toque es de 44 px de alto):</p>
    <div class="fila-muestra">
      <Patente patente="ZK214BD" href="#/unidad/ZK214BD" />
      <Patente patente="ZKB482" href="#/unidad/ZKB482" />
      <Patente patente="ZK214BD" href="#/unidad/ZK214BD" tamano="grande" />
    </div>
    <table class="tabla-muestra">
      <caption class="solo-lectores">Ejemplo de patentes dentro de una tabla</caption>
      <thead>
        <tr><th scope="col" class="rotulo">Unidad</th><th scope="col" class="rotulo">Estado hoy</th></tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row"><Patente patente="ZK214BD" href="#/unidad/ZK214BD" /> <span class="nota">Int. 07</span></th>
          <td><Etiqueta tono="critico" icono="vencido">No puede salir</Etiqueta></td>
        </tr>
        <tr>
          <th scope="row"><Patente patente="ZKB482" href="#/unidad/ZKB482" /> <span class="nota">Int. 11</span></th>
          <td><Etiqueta tono="vigente" icono="check">Puede salir</Etiqueta></td>
        </tr>
      </tbody>
    </table>
  </Panel>

  <Panel titulo="Etiquetas de estado" meta="{etiquetas.length} de la tabla 5.7">
    <ul class="etiquetas">
      {#each etiquetas as e (e.texto)}
        <li><Etiqueta tono={e.tono} icono={e.icono} variante={e.variante}>{e.texto}</Etiqueta></li>
      {/each}
    </ul>
    <h3>Con el texto de las pantallas</h3>
    <ul class="etiquetas">
      <li><Etiqueta tono="vigente" icono="check">Cerrado a las 18:42</Etiqueta></li>
      <li><Etiqueta tono="quincena" icono="flecha-der">En uso desde las 06:52</Etiqueta></li>
    </ul>
  </Panel>

  <Panel titulo="Avisos compactos de dos renglones" meta="5.18, 6.4" icono="persona">
    <p class="nota">Bloqueo por licencia (estado 5): sin primario ni «Usar otra unidad». No es un `role="alert"`: el foco ya fue al título.</p>
    <div data-muestra="bloqueo">
      <Aviso tono="critico" icono="vencido" accion="Avise al encargado: cuando cargue una licencia vigente, podrá empezar la revisión.">No puede manejar hoy: su licencia de conducir venció el 15/11/2026.</Aviso>
    </div>
    <p class="nota">«Cerrar antes» (estado 5 bis y pantalla E): una tarea pendiente, en tono semana, con `i-lapiz`. A diferencia del bloqueo, tiene primario debajo.</p>
    <div data-muestra="cerrar-antes" class="cerrar-antes">
      <Aviso tono="semana" icono="lapiz" accion="Ciérrelo primero; después podrá empezar la revisión de hoy.">ZK 214 BD: el parte del sábado 21/11/2026 quedó sin cerrar.</Aviso>
      <div class="accion-principal"><EnlaceAccion href="#/muestras" variante="primario" tamano="grande">Cerrar el parte anterior</EnlaceAccion></div>
      <div><EnlaceAccion href="#/muestras" variante="texto">Usar otra unidad</EnlaceAccion></div>
    </div>
    <p class="nota">«No puede salir» de la unidad (estados 6 y 7 y paso 1), con el titular y la acción que arma la lógica (`textoUnidadNoPuedeSalir`):</p>
    {@const noPuedeSalir = textoUnidadNoPuedeSalir("ZK 214 BD", ["Seguro vencido hace 1 día"], true)}
    <div data-muestra="no-puede-salir"><Aviso tono="critico" icono="vencido" accion={noPuedeSalir.accion}>{noPuedeSalir.titular}</Aviso></div>
    <p class="nota">De un renglón, para un parte cerrado sin salida (estado 2):</p>
    <Aviso tono="critico" icono="octogono">Revisión de las 06:52: novedad crítica en frenos. La unidad no salió.</Aviso>
  </Panel>

  <Panel titulo="Horizonte de vencimientos" meta="5.6, paso 4.1" icono="calendario">
    <h3>Completa: el ejemplo del generador ({HOY_MUESTRA})</h3>
    <div class="muestra-horizonte" data-muestra="completa">
      <Horizonte horizonte={horizonteDelEjemplo} />
    </div>
    <table class="tabla-muestra" data-muestra="lista">
      <caption class="nota">Los vencimientos de la lista, para comparar con las marcas (día 0 = hoy).</caption>
      <thead>
        <tr><th scope="col" class="rotulo">Día</th><th scope="col" class="rotulo">Vencimiento</th><th scope="col" class="rotulo">Unidad o conductor</th></tr>
      </thead>
      <tbody>
        {#each vencimientosMuestra as a (a.id)}
          <tr>
            <th scope="row" class="num">{a.d === null ? "—" : a.d}</th>
            <td>{a.texto}</td>
            <td>{patenteDe(a)}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h3>Completa sin vencimientos próximos</h3>
    <div class="muestra-horizonte" data-muestra="vacia"><Horizonte horizonte={horizonteVacio} /></div>

    <h3>Completa con solo vencidos</h3>
    <div class="muestra-horizonte" data-muestra="solo-vencidos"><Horizonte horizonte={horizonteSoloVencidos} /></div>

    <h3>Completa con seis el mismo día (el aro hueco es «y más»)</h3>
    <div class="muestra-horizonte" data-muestra="apilada"><Horizonte horizonte={horizonteApilado} /></div>

    <h3>Mediana: ficha de una unidad (con un vencido)</h3>
    <div class="muestra-horizonte" data-muestra="mediana"><Horizonte horizonte={horizonteUnidad} /></div>
    <div class="muestra-horizonte" data-muestra="mediana-vacia"><Horizonte horizonte={horizonteUnidadVacio} /></div>

    <h3>Mínima: columna «Próximo vencimiento» de la flota</h3>
    <table class="tabla-muestra" data-muestra="minima">
      <caption class="solo-lectores">Ejemplo del horizonte mínimo en una tabla</caption>
      <thead>
        <tr><th scope="col" class="rotulo">Unidad</th><th scope="col" class="rotulo">Próximo vencimiento</th></tr>
      </thead>
      <tbody>
        {#each minimas as f (f.unidad)}
          <tr>
            <th scope="row"><span class="codigo">{f.unidad}</span></th>
            <td class="celda-minima"><Horizonte horizonte={f.horizonte} /> <span>{f.texto}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h3>Completa en un contenedor de 20 rem (la caja pasa arriba, «30 días» pasa a «30»)</h3>
    <div class="angosto muestra-horizonte" data-muestra="angosta"><Horizonte horizonte={horizonteDelEjemplo} /></div>
  </Panel>

  <Panel titulo="Botones" meta="5.1">
    <div class="fila-muestra">
      <Boton>Guardar renovación</Boton>
      <Boton variante="secundario">Cancelar</Boton>
      <Boton variante="texto">Ver novedades</Boton>
      <Boton variante="peligro">Dar de baja ZK 214 BD</Boton>
      <Boton variante="icono" icono="mas" etiqueta="Más" />
      <Boton variante="icono" icono="cerrar" etiqueta="Cerrar" />
    </div>
    <div class="fila-muestra">
      <Boton tamano="grande">Enviar parte</Boton>
      <Boton tamano="grande" variante="secundario" icono="parte">Empezar el parte</Boton>
      <Boton variante="secundario" icono="reiniciar">Reiniciar demo</Boton>
    </div>
    <div class="fila-muestra">
      <Boton cargando={guardando} onclick={() => (guardando = true)}>
        {guardando ? "Guardando…" : "Guardar documento"}
      </Boton>
      <Boton variante="texto" onclick={() => (guardando = false)}>Simular fin del guardado</Boton>
      <span class="nota">Con «Guardando…» el botón no se deshabilita (conserva el foco) pero ignora los clics.</span>
    </div>
    <div class="fila-muestra">
      <Boton variante="secundario" disabled>Volver a servicio</Boton>
      <span class="nota">No se puede: hay una novedad crítica abierta.</span>
    </div>
    <div class="fila-muestra">
      <Boton variante={confirmar ? "peligro" : "secundario"} onclick={() => (confirmar = !confirmar)}>
        {confirmar ? "Confirmar descarte" : "Descartar borrador"}
      </Boton>
      <span class="nota">Variante peligro tras el primer clic (la confirmación en dos pasos la maneja la pantalla).</span>
    </div>
  </Panel>

  <Panel titulo="Diálogo y confirmación en dos pasos" meta="5.17 y 5.1">
    <div class="fila-muestra">
      <Boton variante="secundario" onclick={() => (dialogoDemo = true)}>Abrir un diálogo con campos</Boton>
      <BotonConfirmar texto="Descartar borrador" textoConfirmar="Confirmar descarte" alConfirmar={() => (descartes += 1)} />
      <span class="nota">Descartes confirmados: <span class="num">{descartes}</span> (el segundo clic en menos de 500 ms se ignora).</span>
    </div>
    <Dialogo titulo="Corregir kilometraje" bind:abierto={dialogoDemo} hayCambios={dialogoDemoTexto !== ""}>
      <Campo etiqueta="Nuevo kilometraje" tipo="km" requerido bind:valor={dialogoDemoKm} />
      <Campo etiqueta="Motivo" tipo="area" bind:valor={dialogoDemoTexto} ayuda="Escriba algo y pruebe Esc: pide confirmar el descarte." />
      <p class="parrafo nota">{"Texto de relleno para forzar el desplazamiento interno del diálogo. ".repeat(14)}</p>
      {#snippet pie()}
        <Boton onclick={() => (dialogoDemo = false)}>Guardar corrección</Boton>
      {/snippet}
    </Dialogo>
  </Panel>

  <Panel titulo="Campos de formulario" meta="5.11">
    <div class="formulario">
      <Campo etiqueta="Número" requerido bind:valor={texto} ayuda="Como figura en la póliza." />
      <Campo etiqueta="Emisor" bind:valor={textoVacio} ayuda="Precargado con el emisor anterior." />
      <Campo
        etiqueta="Número"
        requerido
        bind:valor={corto}
        error="Escriba el número del documento."
        ayuda="Como figura en la póliza."
      />
      <Campo etiqueta="Kilometraje al terminar" tipo="km" requerido bind:valor={km} ayuda="Último registro: 84.320 km (parte del 17/11/2026)." />
      <Campo
        etiqueta="Kilometraje al terminar"
        tipo="km"
        requerido
        bind:valor={kmInvalido}
        error="El kilometraje no puede ser menor que el último registro (84.320 km)."
      />
      <Campo etiqueta="Litros cargados" tipo="litros" bind:valor={litros} ayuda="Solo si cargó combustible." />
      <Campo etiqueta="Vence" tipo="fecha" requerido bind:valor={fecha} ayuda="Formato día/mes/año." />
      <Campo etiqueta="Proyecto" tipo="select" bind:valor={proyecto}>
        <option value="a">Proyecto Cerro Demo</option>
        <option value="b">Proyecto Quebrada Ficticia</option>
        <option value="c">Sin proyecto asignado</option>
      </Campo>
      <Campo etiqueta="¿Qué encontró?" tipo="area" requerido bind:valor={largo} ayuda="Describa lo que vio, en pocas palabras." />
      <Campo etiqueta="Kilometraje (campo del parte, 48 px)" tipo="km" grande bind:valor={grande} />
      <dl class="solo-lectura">
        <Dato etiqueta="Unidad" valor="Toyota Hilux 2022 · Camioneta" />
        <Dato etiqueta="Conductor">Lucía Ferreyra (persona ficticia)</Dato>
        <Dato etiqueta="Estado"><Etiqueta tono="vigente" icono="check">Enviado</Etiqueta></Dato>
      </dl>
    </div>
  </Panel>

  <Panel titulo="Panel completo" meta="11 vencimientos" icono="documento" estado={estadoPanel}>
    {#snippet controles()}
      <Boton variante="icono" icono="ayuda" etiqueta="Ayuda de este panel" />
    {/snippet}
    {#snippet herramientas()}
      <Boton variante="secundario">Todos (11)</Boton>
      <Boton variante="secundario">7 días o menos (4)</Boton>
      <Boton variante="texto" onclick={() => (estadoPanel = estadoPanel === "" ? "Seguro renovado: vence 15/11/2027." : "")}>
        Alternar la barra de estado
      </Boton>
    {/snippet}
    <p class="parrafo">
      Interior del panel. La barra de estado de abajo existe siempre (es una región <span class="codigo">role="status"</span>); sin
      mensaje no ocupa lugar.
    </p>
    <Boton variante="secundario">Un botón para probar el foco dentro del panel</Boton>
  </Panel>

  <Panel titulo="Panel sin herramientas ni estado" icono="persona">
    <p class="parrafo">Solo barra de título e interior.</p>
  </Panel>

  <div class="angosto">
    <Panel titulo="Panel angosto" meta="dato que baja" icono="unidad" estado="Mensaje en la barra de estado.">
      <p class="nota">El contenedor mide 20 rem: el dato breve baja a su renglón.</p>
    </Panel>
  </div>
</main>

<style>
  .encabezado {
    padding-block: var(--e-5) var(--e-3);
  }
  .cerrar-antes {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-3);
  }
  .cerrar-antes > :global(.aviso) {
    align-self: stretch;
  }
  .accion-principal {
    display: flex;
    align-self: stretch;
  }
  .accion-principal :global(.enlace-accion) {
    flex: 1;
  }
  .pagina {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    padding-block: var(--e-2) var(--e-7);
  }
  @media (min-width: 40rem) {
    .pagina {
      gap: var(--e-5);
    }
  }

  .grupo {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .muestras-color {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: var(--e-2);
  }
  .muestras-color li {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
  }
  .cuadro {
    flex: none;
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
  }

  .renglon-escala {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--e-1) var(--e-4);
  }
  .renglon-escala .nota {
    flex: none;
    width: 5rem;
  }
  .texto-escala[data-nombre="cifra"] {
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .texto-escala[data-nombre="h1"] {
    font-family: var(--t-familia-titulo);
    font-weight: 700;
    line-height: 1.15;
  }
  .texto-escala[data-nombre="h2"] {
    font-family: var(--t-familia-titulo);
    font-weight: var(--t-peso-h2);
    line-height: 1.25;
  }
  .texto-escala[data-nombre="h3"] {
    font-family: var(--t-familia-titulo);
    font-weight: 600;
  }

  .iconos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: var(--e-3);
  }
  .iconos li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-1);
    text-align: center;
  }
  .icono-grande {
    --icono-tam: 1.5rem;
    display: inline-flex;
    padding: var(--e-2);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
    background: var(--c-superficie-2);
    color: var(--c-texto);
  }
  .tam-14 {
    --icono-tam: 0.875rem;
  }
  .tam-24 {
    --icono-tam: 1.5rem;
  }

  .fila-muestra {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
  }
  h3.fila-muestra {
    font-weight: 600;
  }

  .tabla-muestra {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
  }
  .tabla-muestra th,
  .tabla-muestra td {
    padding: var(--e-3) var(--e-2);
    border-top: 1px solid var(--c-borde);
    text-align: left;
    font-weight: 400;
  }
  .tabla-muestra thead th {
    border-top: 0;
    color: var(--c-texto-2);
  }

  .etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2) var(--e-3);
  }

  .formulario {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  @media (min-width: 40rem) {
    .formulario {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--e-4) var(--e-5);
    }
  }
  .solo-lectura {
    display: grid;
    gap: var(--e-3);
    margin: 0;
  }

  .angosto {
    max-width: 20rem;
  }
  .muestra-horizonte {
    padding-block: var(--e-1);
  }
  .celda-minima {
    display: flex;
    align-items: center;
    gap: var(--e-3);
  }
</style>
