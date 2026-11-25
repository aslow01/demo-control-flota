<script lang="ts">
  // UN solo juego de diálogos (Renovar / Cargar / Corregir un documento y Resolver una novedad) para Inicio, Vencimientos y Operación diaria. El estado vive en `dialogos`
  // (`dialogos-instancia.ts`, módulo de E2-P); la pantalla lo abre con `dialogos.abrirRenovar(...)`, `abrirLicencia(...)` o `abrirResolver(...)` y lo que se dice al guardar sale de
  // `dialogos.mensaje(origen)`. Este componente se monta UNA vez dentro de cada pantalla que lo usa y no dibuja nada propio: solo enlaza los dos diálogos con ese estado.
  //  - Al guardar bien, el foco va a lo que devuelva `focoDestino(origen)` (la fila que abrió el diálogo ya no existe): el título de lo que cambió.
  //  - Al cancelar (Esc, «Cancelar» o la X), no se llama a `focoDestino`: el foco vuelve al botón que lo abrió (lo hace `Dialogo`).
  //  - «Atrás» del navegador (o cualquier cambio de pantalla) cierra el diálogo abierto: `dialogos.abierto` y `dialogos.resolverAbierto` valen `false` apenas cambia `versionDePantalla`.
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
