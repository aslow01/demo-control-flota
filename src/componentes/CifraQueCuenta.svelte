<script lang="ts">
  // La cifra cobre de Inicio: al abrir la demo y al reiniciarla cuenta de 0 a su valor (650 ms, componentes/movimiento.ts); el resto del tiempo es el número tal cual.
  // Solo dibuja el texto (va dentro del `<span>` de la cifra, que el lector de pantalla se salta): el valor final está en un texto aparte, así no se anuncia ningún
  // número intermedio. Con `prefers-reduced-motion: reduce` no cuenta.
  import { tick, untrack } from "svelte";
  import { alPedirseLaCuenta, consumirCuenta, contarHasta } from "./movimiento.ts";

  let { valor }: { valor: number } = $props();

  const alAbrir = consumirCuenta();
  let visible = $state(alAbrir ? 0 : untrack(() => valor));
  let primera = true;
  let cortar: (() => void) | null = null;

  function contar(hasta: number): void {
    cortar?.();
    cortar = contarHasta(hasta, (n) => (visible = n), () => (cortar = null));
  }

  // Mientras cuenta, un valor nuevo cambia el destino; fuera de eso se muestra enseguida.
  $effect(() => {
    const v = valor;
    untrack(() => {
      if (primera && alAbrir) contar(v);
      else if (cortar !== null) contar(v);
      else visible = v;
      primera = false;
    });
    return () => cortar?.();
  });
  $effect(() =>
    alPedirseLaCuenta(() => {
      if (consumirCuenta()) void tick().then(() => contar(valor));
    }),
  );
</script>

{visible}
