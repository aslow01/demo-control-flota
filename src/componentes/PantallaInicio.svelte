<script lang="ts">
  // ESQUELETO (E3-M, paso 0): Inicio del encargado (`#/inicio`). Datos: `app.centroDeAlertas` (`cifras`, `protagonista`, `vencimientos.regla`, `operacionDiaria`).
  // Provisorio: muestra la pantalla de alertas de siempre. Quien lo completa lo reemplaza entero y NO toca `App.svelte`.
  import PantallaAlertas from "./PantallaAlertas.svelte";

  let {
    alAbrirParte,
  }: {
    /** «Abrir el parte diario»: el marco abre «Ver como» con Conductor ya elegido. */
    alAbrirParte: () => void;
  } = $props();
</script>

<PantallaAlertas {alAbrirParte} />
