<script lang="ts">
  // Diálogo «Ver como» (5.2 y 5.17): elige el perfil (Encargado o Conductor) y, con Conductor, quién completa el parte: lista de conductores activos (ficticios) con su unidad, en radios.
  // El cambio se aplica al pulsar «Aplicar» (WCAG 3.2.2: elegir un radio no cambia la pantalla). Es solo un punto de vista de la demo: no hay usuarios ni contraseñas.
  // En el renglón 2, junto a la unidad, el conductor cuya licencia no ampara hoy (L1) lleva el rombo crítico + «Sin licencia vigente» (texto crítico, sin fondo). Sigue siendo elegible (es un punto
  // de vista): así el visitante encuentra el caso del bloqueo.
  // M1: los conductores que permiten probar un caso (`paraProbar`) van primero, cada uno con su marca «Para probar: …» como tercer renglón de la etiqueta (así la lee el lector de pantalla
  // junto al nombre y la unidad), y una línea «Los demás conductores» los separa del resto. Siguen siendo opciones del mismo grupo de radios.
  // El foco inicial va al perfil de ahora. «Aplicar» no se deshabilita: con Conductor y sin elección muestra el error en el diálogo.
  // Quien lo usa recibe la lista armada y hace el cambio de perfil (`alConfirmar`); si falla, `error` se muestra acá y el diálogo sigue abierto.
  import { untrack } from "svelte";
  import Boton from "./Boton.svelte";
  import Dialogo from "./Dialogo.svelte";
  import Forma from "./Forma.svelte";
  import { TEXTO_ELEGIR_CONDUCTOR as T, TEXTO_MARCO, TEXTO_MAS } from "./textos-marco.ts";
  import { ETIQUETAS_DE_PARTE, type OpcionConductor } from "./tipos.ts";

  type TipoPerfil = "encargado" | "conductor";

  let {
    abierto = $bindable(false),
    perfilInicial = "encargado",
    conductores,
    elegidoInicial = null,
    cargando = false,
    error = "",
    focoDestino,
    alConfirmar,
  }: {
    abierto?: boolean;
    /** El perfil con el que arranca la elección: el de ahora, o Conductor si se abrió desde «Abrir el parte diario». */
    perfilInicial?: TipoPerfil;
    conductores: OpcionConductor[];
    /** El conductor del perfil actual, si el perfil es Conductor. */
    elegidoInicial?: string | null;
    cargando?: boolean;
    error?: string;
    focoDestino?: () => HTMLElement | null;
    alConfirmar: (perfil: { tipo: "encargado" } | { tipo: "conductor"; conductorId: string }) => void;
  } = $props();

  const V = TEXTO_MAS.verComo;
  const uid = $props.id();
  const idError = $derived(`${uid}-error`);
  const idAyuda = $derived(`${uid}-ayuda`);

  let tipo = $state<TipoPerfil>("encargado");
  let elegido = $state<string | null>(null);
  let sinElegir = $state(false);
  let lista = $state<HTMLElement | null>(null);

  // Cada vez que se abre, parte del perfil y el conductor actuales y sin errores.
  // `untrack`: si el perfil cambia con el diálogo abierto (al confirmar), no se reinicia lo elegido.
  $effect(() => {
    if (abierto) {
      tipo = untrack(() => perfilInicial);
      elegido = untrack(() => elegidoInicial);
      sinElegir = false;
    }
  });

  const sugeridos = $derived(conductores.filter((c) => c.paraProbar != null));
  const resto = $derived(conductores.filter((c) => c.paraProbar == null));
  const idFoco = $derived(elegido ?? sugeridos[0]?.id ?? conductores[0]?.id ?? null);
  const mensaje = $derived(sinElegir && tipo === "conductor" ? T.elegir : error);

  const perfiles: { valor: TipoPerfil; texto: string; ayuda: string }[] = [
    { valor: "encargado", texto: TEXTO_MARCO.perfilEncargado, ayuda: V.encargadoAyuda },
    { valor: "conductor", texto: TEXTO_MARCO.perfilConductor, ayuda: V.conductorAyuda },
  ];

  function aplicar(): void {
    if (tipo === "encargado") return alConfirmar({ tipo: "encargado" });
    if (elegido === null) {
      sinElegir = true;
      lista?.querySelector<HTMLElement>("[data-foco-lista]")?.focus();
      return;
    }
    alConfirmar({ tipo: "conductor", conductorId: elegido });
  }
</script>

{#snippet opcion(c: OpcionConductor)}
  <li>
    <label class="opcion">
      <input
        type="radio"
        name="conductor-del-parte"
        value={c.id}
        checked={elegido === c.id}
        data-foco-lista={c.id === idFoco ? "" : undefined}
        onchange={() => {
          elegido = c.id;
          sinElegir = false;
        }}
      />
      <span class="datos">
        <span class="nombre">{c.nombre}</span>
        <span class="renglon-2">
          <span class="nota">{c.unidad === null ? T.sinUnidad : T.unidad(c.unidad)}</span>
          {#if !c.licenciaVigente && !(c.paraProbar?.sinLicencia ?? false)}
            <span class="sin-licencia"><Forma forma="rombo" tono="critico" />{ETIQUETAS_DE_PARTE["sin-licencia-vigente"].texto}</span>
          {/if}
        </span>
        {#if c.paraProbar != null}
          <span class="para-probar">{c.paraProbar.etiqueta}</span>
        {/if}
      </span>
    </label>
  </li>
{/snippet}

<Dialogo titulo={V.titulo} bind:abierto bloqueado={cargando} descripcionId={idAyuda} {focoDestino}>
  <p id={idAyuda} class="nota">{V.ayudaDialogo}</p>

  <fieldset>
    <legend class="nota">{V.leyendaPerfil}</legend>
    <ul class="lista">
      {#each perfiles as p (p.valor)}
        <li>
          <label class="opcion">
            <input
              type="radio"
              name="perfil-ver-como"
              value={p.valor}
              checked={tipo === p.valor}
              data-foco-inicial={p.valor === perfilInicial ? "" : undefined}
              onchange={() => {
                tipo = p.valor;
                sinElegir = false;
              }}
            />
            <span class="datos">
              <span class="nombre">{p.texto}</span>
              <span class="nota">{p.ayuda}</span>
            </span>
          </label>
        </li>
      {/each}
    </ul>
  </fieldset>

  {#if tipo === "conductor"}
    <fieldset aria-describedby={mensaje !== "" ? idError : undefined}>
      <legend class="nota">{T.titulo}</legend>
      {#if mensaje !== ""}
        <p class="error" id={idError} role="alert"><Forma forma="rombo" tono="critico" /><span>{mensaje}</span></p>
      {/if}
      <div bind:this={lista}>
        {#if sugeridos.length > 0}
          <ul class="lista">
            {#each sugeridos as c (c.id)}
              {@render opcion(c)}
            {/each}
          </ul>
          {#if resto.length > 0}<p class="nota separador">{T.losDemas}</p>{/if}
        {/if}
        {#if resto.length > 0}
          <ul class="lista">
            {#each resto as c (c.id)}
              {@render opcion(c)}
            {/each}
          </ul>
        {/if}
      </div>
    </fieldset>
  {:else if mensaje !== ""}
    <p class="error" id={idError} role="alert"><Forma forma="rombo" tono="critico" /><span>{mensaje}</span></p>
  {/if}

  {#snippet pie()}
    <Boton {cargando} onclick={aplicar}>{V.aplicar}</Boton>
  {/snippet}
</Dialogo>

<style>
  fieldset {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  legend {
    padding: 0;
    margin-bottom: var(--e-2);
    font-weight: 600;
  }
  /* Las opciones forman una lista con borde (como las de «Más»): filas de 56 px, una sobre otra. */
  .lista {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
  }
  .lista li + li {
    border-top: 1px solid var(--c-borde);
  }
  .opcion {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: 3.5rem;
    padding: var(--e-2) var(--e-4);
    cursor: pointer;
  }
  /* La elegida lleva el riel de tinta (la tinta es la acción) y el fondo de la superficie hundida; el color de estado queda para el estado. */
  .opcion:has(input:checked) {
    background: var(--c-superficie-2);
    box-shadow: inset 4px 0 0 var(--c-acento);
  }
  .opcion:has(input:focus-visible) {
    outline: 3px solid var(--c-foco);
    outline-offset: -3px;
  }
  @media (hover: hover) {
    .opcion:hover {
      background: var(--c-superficie-2);
    }
  }
  input {
    flex: none;
    width: 1.375rem;
    height: 1.375rem;
    margin: 0;
    accent-color: var(--c-acento);
  }
  input:focus-visible {
    outline: none;
  }
  .datos {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nombre {
    font-weight: 500;
  }
  .renglon-2 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 var(--e-3);
  }
  .sin-licencia {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 650;
    color: var(--c-critico-t);
  }
  .para-probar {
    font-size: var(--t-chico);
    font-weight: 600;
    color: var(--c-pendiente-t);
  }
  .separador {
    margin-block: var(--e-3) 0;
    padding-top: var(--e-3);
    border-top: 1px solid var(--c-borde-fuerte);
    font-weight: 600;
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 650;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .error :global(.forma) {
    margin-top: 0.3125rem;
  }
</style>
