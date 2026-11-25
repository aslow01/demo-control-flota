<script lang="ts">
  // ESQUELETO (E3-M, paso 0): Vencimientos (`#/vencimientos?filtro=`). El filtro sale de `app.ruta` (`tipo === "vencimientos"`, `filtro?`); los datos, de
  // `app.centroDeAlertas.vencimientos` (`regla`, `filtrosEnlace`, `grupos`). Diálogos: `<DialogosDeDocumento>` con origen `vencimientos`.
  // Provisorio: muestra la pantalla de alertas de siempre. Quien lo completa lo reemplaza entero y NO toca `App.svelte`.
  import PantallaAlertas from "./PantallaAlertas.svelte";

  let {
    alAbrirParte,
  }: {
    /** Lo pide la pantalla de alertas provisoria; la definitiva no lo usa y se puede quitar junto con el borrado de `PantallaAlertas` (ahí sí se toca `App.svelte`). */
    alAbrirParte: () => void;
  } = $props();
</script>

<PantallaAlertas {alAbrirParte} />
