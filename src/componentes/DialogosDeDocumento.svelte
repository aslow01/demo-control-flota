<script lang="ts">
  // ESQUELETO (E3-M, paso 0): UN solo juego de diálogos (Renovar / Cargar / Corregir un documento y Resolver una novedad) para Inicio, Vencimientos y Operación
  // diaria. El estado vive en `dialogos` (`dialogos-instancia.ts`, módulo de E2-P); las pantallas lo abren con `dialogos.abrirRenovar(...)`, `abrirLicencia(...)` o
  // `abrirResolver(...)` y lo que se dice al guardar sale de `dialogos.mensaje(origen)`. Este componente se monta UNA vez dentro de cada pantalla que lo usa.
  import type { DestinoDelFoco } from "./DialogoFormulario.svelte";
  import DialogoDocumento from "./DialogoDocumento.svelte";
  import DialogoResolver from "./DialogoResolver.svelte";
  import { dialogos } from "./dialogos-instancia.ts";
  import type { OrigenDeDialogo } from "./dialogos-documento.svelte.ts";

  let {
    focoDestino,
  }: {
    /**
     * A qué elemento va el foco tras GUARDAR (la fila que abrió el diálogo ya no existe): recibe el origen (`inicio` | `vencimientos` | `operacion`) y devuelve el título
     * donde se lee lo que pasó. Al cancelar no se llama: el foco vuelve al botón que abrió el diálogo.
     */
    focoDestino: (origen: OrigenDeDialogo) => HTMLElement | null;
  } = $props();

  const destino: DestinoDelFoco = (resultado) => {
    const origen = dialogos.destinoDelFoco(resultado);
    return origen === null ? null : focoDestino(origen);
  };
</script>

<DialogoDocumento
  bind:abierto={dialogos.abierto}
  contexto={dialogos.contexto}
  guardar={dialogos.guardar}
  alGuardar={(r) => dialogos.alGuardar(r)}
  focoDestino={destino}
/>
<DialogoResolver
  bind:abierto={dialogos.resolverAbierto}
  contexto={dialogos.contextoResolver}
  guardar={dialogos.guardarResolver}
  alGuardar={(r) => dialogos.alResolver(r)}
  focoDestino={destino}
/>
