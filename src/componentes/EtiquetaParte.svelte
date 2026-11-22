<script lang="ts">
  // Etiqueta de estado de un parte o de un conductor (5.7, filas «Cerrado», «Borrador», «En uso», «Sin enviar», «Sin cerrar» y «Sin licencia vigente»): el texto, el tono y el ícono
  // salen de `ETIQUETAS_DE_PARTE` (tipos.ts); la pantalla elige cuál según el estado que le da la lógica. `texto` reemplaza al de la tabla cuando la frase lleva un dato propio
  // («Cerrado a las 18:42», «En uso desde las 06:52»): el tono y el ícono no cambian.
  import Etiqueta from "./Etiqueta.svelte";
  import { ETIQUETAS_DE_PARTE, type EtiquetaDeParte } from "./tipos.ts";

  let { tipo, texto }: { tipo: EtiquetaDeParte; texto?: string } = $props();

  const e = $derived(ETIQUETAS_DE_PARTE[tipo]);
</script>

<Etiqueta tono={e.tono} icono={e.icono}>{texto ?? e.texto}</Etiqueta>
