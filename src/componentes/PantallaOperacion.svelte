<script lang="ts">
  // ESQUELETO (E3-M, paso 0): Operación diaria (`#/operacion/checklists` y `#/operacion/novedades`). La solapa sale de `app.ruta` (`tipo === "operacion"`, `solapa`);
  // los datos, de `app.centroDeAlertas.operacionDiaria.solapas`. Diálogos: `<DialogosDeDocumento>` con origen `operacion` («Resolver»).
  // Provisorio: muestra la pantalla de alertas de siempre. Quien lo completa lo reemplaza entero y NO toca `App.svelte`.
  import PantallaAlertas from "./PantallaAlertas.svelte";

  let {
    alAbrirParte,
  }: {
    /** Lo pide la pantalla de alertas provisoria; la definitiva no lo usa (ver `PantallaVencimientos`). */
    alAbrirParte: () => void;
  } = $props();
</script>

<PantallaAlertas {alAbrirParte} />
