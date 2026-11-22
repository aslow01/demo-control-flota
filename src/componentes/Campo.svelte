<script lang="ts">
  // 5.11 Campo de formulario: etiqueta arriba, ayuda debajo de la etiqueta, mensaje de error entre la etiqueta y el campo
  // (patrón GOV.UK) y el control. El texto escrito se conserva siempre. No hay campos deshabilitados: si no aplica, no se muestra
  // (para mostrar un dato sin editar, usar el componente Dato).
  //
  // Tipos: texto · km (inputmode numérico, sufijo "km", al salir se reformatea con punto de miles; no es type="number") ·
  // litros (inputmode decimal, sufijo "litros") · fecha (type="date" nativo) · area (textarea de 3 renglones que crece hasta 8,
  // con contador desde 400 caracteres) · select (las <option> van como contenido).
  //
  // El valor es siempre texto (`bind:valor`): convertirlo y validarlo es del dominio, no del componente.
  import type { Snippet } from "svelte";
  import { reformatearKm } from "../lib/dominio/kilometraje.ts";
  import Icono from "./Icono.svelte";

  let {
    etiqueta,
    valor = $bindable(""),
    tipo = "texto",
    id,
    ayuda = "",
    error = "",
    sufijo,
    requerido = false,
    grande = false,
    autocomplete,
    modoEntrada,
    teclaEnter,
    mayusculas = false,
    corto = false,
    maximo = 500,
    maxFecha,
    children,
  }: {
    etiqueta: string;
    valor?: string;
    tipo?: "texto" | "km" | "litros" | "fecha" | "area" | "select";
    /** Id del control (para enlazarlo desde el resumen de errores). Si no se da, se genera uno. */
    id?: string;
    ayuda?: string;
    error?: string;
    /** Unidad fuera del campo. Por defecto "km" para `km` y "litros" para `litros`. */
    sufijo?: string;
    requerido?: boolean;
    /** Alto de 3 rem (el parte diario); sin esto, 2.75 rem. */
    grande?: boolean;
    autocomplete?: "off" | "on";
    /** Teclado del celular para un texto con dígitos (`numeric`: interno, año). Es `text` y no `number`: sin flechas ni rueda. */
    modoEntrada?: "numeric" | "text";
    /** Rótulo de la tecla Enter del teclado del celular (`enterkeyhint`): «siguiente» o «listo». Con teclado físico, `ParteFormulario` hace lo que la leyenda promete: «next» pasa al control siguiente y «done» lleva el foco al botón de envío (B3 de la etapa 7); Enter nunca envía solo. */
    teclaEnter?: "next" | "done";
    /** Patentes y similares: teclado en mayúsculas y sin corrector. */
    mayusculas?: boolean;
    /** Ancho de 10 caracteres (números cortos como el año). */
    corto?: boolean;
    /** Tope del contador del tipo `area` (la validación es del dominio). */
    maximo?: number;
    /** Tope del campo `fecha` (`AAAA-MM-DD`): el selector del navegador no deja elegir una posterior. La validación sigue siendo del dominio. */
    maxFecha?: string;
    /** Las <option> del tipo `select`. */
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  const idControl = $derived(id ?? `${uid}-campo`);
  const idAyuda = $derived(`${idControl}-ayuda`);
  const idError = $derived(`${idControl}-error`);
  const idContador = $derived(`${idControl}-contador`);

  const unidad = $derived(sufijo ?? (tipo === "km" ? "km" : tipo === "litros" ? "litros" : ""));
  const mostrarContador = $derived(tipo === "area" && valor.length >= 400);
  // El mensaje de error va primero en aria-describedby (se lee antes que la ayuda).
  const descripcion = $derived(
    [error !== "" ? idError : "", ayuda !== "" ? idAyuda : "", mostrarContador ? idContador : ""].filter((s) => s !== "").join(" ") ||
      undefined,
  );

  /** Al salir del campo de kilómetros: 84320 -> 84.320. Lo que no es un entero bien escrito (84.5, 1.2.3) se deja tal cual: lo valida el dominio. */
  function reformatear(): void {
    if (tipo === "km") valor = reformatearKm(valor);
  }
</script>

<div class="campo" data-grande={grande ? "" : undefined}>
  <label for={idControl}>{etiqueta}{#if requerido}<span class="req" aria-hidden="true"> *</span>{/if}</label>
  {#if ayuda !== ""}<p class="ayuda" id={idAyuda}>{ayuda}</p>{/if}
  {#if error !== ""}
    <p class="error" id={idError}><Icono nombre="vencido" /><span>{error}</span></p>
  {/if}
  <div class="fila">
    {#if tipo === "select"}
      <select
        id={idControl}
        bind:value={valor}
        aria-invalid={error !== "" ? "true" : undefined}
        aria-required={requerido ? "true" : undefined}
        aria-describedby={descripcion}
      >
        {@render children?.()}
      </select>
    {:else if tipo === "area"}
      <textarea
        id={idControl}
        bind:value={valor}
        rows="3"
        aria-invalid={error !== "" ? "true" : undefined}
        aria-required={requerido ? "true" : undefined}
        aria-describedby={descripcion}
      ></textarea>
    {:else}
      <input
        id={idControl}
        class:corto={corto || tipo === "km" || tipo === "litros"}
        type={tipo === "fecha" ? "date" : "text"}
        max={tipo === "fecha" ? maxFecha : undefined}
        inputmode={tipo === "km" ? "numeric" : tipo === "litros" ? "decimal" : modoEntrada}
        enterkeyhint={teclaEnter}
        autocapitalize={mayusculas ? "characters" : undefined}
        spellcheck={mayusculas ? false : undefined}
        autocomplete={autocomplete ?? (tipo === "texto" ? undefined : "off")}
        bind:value={valor}
        onblur={reformatear}
        aria-invalid={error !== "" ? "true" : undefined}
        aria-required={requerido ? "true" : undefined}
        aria-describedby={descripcion}
      />
    {/if}
    {#if unidad !== ""}<span class="sufijo">{unidad}</span>{/if}
  </div>
  {#if mostrarContador}
    <p class="contador num" id={idContador}>{valor.length} de {maximo}</p>
  {/if}
</div>

<style>
  .campo {
    --alto: var(--alto-tactil);
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .campo[data-grande] {
    --alto: var(--alto-segmento);
  }
  label {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto);
  }
  .ayuda,
  .contador {
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .contador {
    text-align: right;
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .error :global(.icono) {
    --icono-tam: 1rem;
    margin-top: 0.1rem;
  }
  /* Texto agrandado (el contenedor mide 17 rem o menos): el mensaje baja debajo de su ícono si no entra a su lado sin partir una palabra (S5 de la etapa 7). */
  @container (max-width: 17rem) {
    .error {
      flex-wrap: wrap;
    }
    .error > span:last-child {
      flex: 1 1 7rem;
      min-width: 0;
    }
  }

  .fila {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
  }
  .sufijo {
    flex: none;
    font-size: var(--t-cuerpo);
    color: var(--c-texto-2);
  }

  input,
  select,
  textarea {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: var(--alto);
    padding: 0 var(--e-3);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: var(--t-cuerpo); /* 16 px: evita el zoom automático de iOS */
    line-height: 1.5;
  }
  /* B5 de la etapa 7: la opción elegida de un `select` no se parte en renglones; si no entra (la de un conductor sin licencia vigente, a 360 px), termina en «…» y no en un «·» suelto. */
  select {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input.corto {
    flex: 0 1 auto;
    width: calc(10ch + 2 * var(--e-3) + 2px);
    font-variant-numeric: tabular-nums lining-nums;
  }
  textarea {
    height: auto;
    min-height: calc(3 * 1.5em + 2 * var(--e-2) + 2px);
    max-height: calc(8 * 1.5em + 2 * var(--e-2) + 2px);
    padding-block: var(--e-2);
    resize: vertical;
    /* Crece con el texto hasta 8 renglones donde el navegador lo permite; en los demás queda de 3 y se estira a mano. */
    field-sizing: content;
  }
  input[type="date"] {
    font-variant-numeric: tabular-nums;
  }

  @media (hover: hover) {
    input:hover,
    select:hover,
    textarea:hover {
      border-color: var(--c-texto-2);
    }
  }

  /* Inválido: borde de 2 px (el relleno baja 1 px para que el campo no se mueva) y el hover no lo apaga. */
  input[aria-invalid="true"],
  select[aria-invalid="true"],
  textarea[aria-invalid="true"],
  input[aria-invalid="true"]:hover,
  select[aria-invalid="true"]:hover,
  textarea[aria-invalid="true"]:hover {
    padding-inline: calc(var(--e-3) - 1px);
    border: 2px solid var(--c-critico-r);
  }
</style>
