<script lang="ts">
  // Encabezado de los dos pasos del parte (6.5, A y B), de arriba abajo y sin panel: 1) el enlace de vuelta y, con poco ancho, el rótulo de la demo en el mismo renglón (C1);
  // 2) el `h1` del paso («Revisión antes de salir» o «Cierre de la jornada»), que también es el título de la pestaña; 3) el renglón de contexto («Parte del miércoles 18/11/2026 · paso 1 de 2»:
  // un texto, no un indicador gráfico); 4) la patente y «Int. 07 · Toyota Hilux 2022» (sin el tipo); 5) los avisos (fuera de término, «no puede salir»; solo la revisión los trae);
  // 6) el indicador de guardado (5.15). La región `role="status"` oculta dice SOLO el texto de `anuncio`, que cambia al cambiar de estado (no en cada guardado).
  // Vive dentro del contenedor `parte` de `ParteFormulario` (las reglas `@container parte` miden ese ancho).
  import Aviso from "./Aviso.svelte";
  import EtiquetaDemo from "./EtiquetaDemo.svelte";
  import Icono from "./Icono.svelte";
  import Patente from "./Patente.svelte";

  let {
    vuelta,
    titulo,
    contexto,
    patente,
    interno,
    descripcion,
    avisoFueraDeTermino = null,
    avisoAptitud = null,
    indicador,
    indicadorConError = false,
    anuncio,
  }: {
    vuelta: { texto: string; href: string };
    titulo: string;
    contexto: string;
    patente: string;
    interno: string;
    descripcion: string;
    avisoFueraDeTermino?: string | null;
    avisoAptitud?: string | null;
    /** El texto visible del indicador de guardado; vacío = no se muestra. */
    indicador: string;
    indicadorConError?: boolean;
    anuncio: string;
  } = $props();

  // La línea del conductor no se repite acá: con perfil Conductor ya está en la barra («Tamara Olivera (ficticia)»), y con perfil Encargado es el `select`.
  // «Toyota Hilux 2022 · Camioneta»: el tipo sobra junto a la patente (se mira la unidad, no se la clasifica).
  const modelo = $derived(descripcion.includes(" · ") ? descripcion.slice(0, descripcion.lastIndexOf(" · ")) : descripcion);
  // «ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.»: la primera parte es el hecho (firme) y la última frase, la acción (más chica).
  const aviso = $derived.by(() => {
    const t = avisoAptitud ?? "";
    const corte = t.lastIndexOf(". ");
    return corte < 0 ? { titular: t, accion: "" } : { titular: t.slice(0, corte + 1), accion: t.slice(corte + 2) };
  });
</script>

<!-- Con poco ancho, el enlace de vuelta y el rótulo de la demo comparten renglón: ahorra uno entero antes del primer campo (C1). -->
<div class="fila-vuelta">
  <a class="vuelta" href={vuelta.href}><Icono nombre="flecha-izq" />{vuelta.texto}</a>
  <div class="solo-angosto"><EtiquetaDemo /></div>
</div>

<header class="encabezado">
  <h1 tabindex="-1">{titulo}</h1>
  <p class="contexto">{contexto}</p>
  <p class="identidad">
    <Patente {patente} tamano="grande" />
    <span class="datos-unidad"><span class="interno">{interno}</span><span class="modelo">{modelo}</span></span>
  </p>
  {#if avisoFueraDeTermino !== null}
    <Aviso tono="semana" icono="calendario">{avisoFueraDeTermino}</Aviso>
  {/if}
  {#if avisoAptitud !== null}
    <Aviso tono="critico" icono="vencido">
      <span class="aviso-titular largo">{aviso.titular}</span>
      {#if aviso.accion !== ""}<span class="aviso-accion largo">{aviso.accion}</span>{/if}
    </Aviso>
  {/if}
  {#if indicador !== ""}
    <p class="indicador" class:con-error={indicadorConError}><Icono nombre={indicadorConError ? "vencido" : "guardado"} /><span>{indicador}</span></p>
  {/if}
  <!-- Lo que se dice al lector de pantalla: solo cambia cuando cambia de estado, no en cada guardado. -->
  <div class="solo-lectores" role="status">{anuncio}</div>
</header>

<style>
  .fila-vuelta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 var(--e-3);
  }
  .vuelta {
    --icono-tam: 1.125rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    font-weight: 600;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    min-width: 0;
  }
  .encabezado > :global(.aviso) {
    align-self: stretch;
    padding: var(--e-2) var(--e-3);
  }
  /* El título del paso es corto («Revisión antes de salir»): con poco ancho baja a 22 px (C1) y entra en un renglón. */
  @container parte (max-width: 29.99rem) {
    .encabezado h1 {
      font-size: var(--t-h2);
    }
  }
  /* El rótulo "Demo con datos ficticios" baja acá cuando la barra superior no tiene lugar (menos de 40 rem). */
  @media (min-width: 40rem) {
    .solo-angosto {
      display: none;
    }
  }
  .contexto {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .identidad {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  /* Con poco ancho, el interno y el modelo van uno sobre otro al lado de la patente (la altura de la patente); con más lugar, en un solo renglón: «Int. 07 · Toyota Hilux 2022». */
  .datos-unidad {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: var(--t-chico);
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .interno {
    font-weight: 600;
  }
  .modelo {
    color: var(--c-texto-2);
  }
  @container parte (min-width: 30rem) {
    .datos-unidad {
      flex-direction: row;
      gap: var(--e-2);
      font-size: var(--t-cuerpo);
      line-height: 1.5;
    }
    .modelo {
      color: var(--c-texto);
    }
    .modelo::before {
      content: "· ";
      color: var(--c-texto-2);
    }
  }
  .largo {
    overflow-wrap: anywhere;
  }
  /* Aviso de que la unidad no puede salir: compacto. El hecho en firme, la acción debajo en letra chica. */
  .aviso-titular,
  .aviso-accion {
    display: block;
  }
  .aviso-titular {
    font-weight: 600;
  }
  .aviso-accion {
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  .indicador {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .indicador :global(.icono) {
    flex: none;
    margin-top: 0.1rem;
  }
  .indicador.con-error {
    font-weight: 600;
    color: var(--c-critico-t);
  }
</style>
