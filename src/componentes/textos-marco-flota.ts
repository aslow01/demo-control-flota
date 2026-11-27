// Textos de la pantalla Movilidades y del diálogo «Agregar unidad» (presentación; los de la lógica están en `lib/dominio/textos-flota.ts`). Se bajan con la pantalla, no con el marco.

/** Movilidades, antes «Flota» (6.2): rótulos de la pantalla que no salen del dominio. Los filtros, los órdenes, los estados y los textos de cada fila vienen de `textos.ts`. */
export const TEXTO_FLOTA_VISTA = {
  agregarUnidad: "Agregar unidad",
  /** Rótulo del campo de búsqueda (visible con poco ancho; el marcador, más corto, dice qué se puede buscar y no se corta a 360 px). */
  buscar: "Buscar",
  buscarMarcador: "Patente, modelo o conductor",
  proyecto: "Proyecto",
  ordenarPor: "Ordenar por",
  mostrar: "Mostrar",
  quitarFiltros: "Quitar filtros",
  sinConductor: "Sin conductor",
  /** L6: a continuación del nombre del conductor asignado cuya licencia no ampara hoy (en minúscula: sigue al nombre). */
  sinLicencia: "sin licencia vigente",
  /** Texto oculto de la celda que muestra «—» (un lector de pantalla diría «raya» o nada). */
  sinProyecto: "Sin proyecto",
  columnas: {
    unidad: "Unidad",
    estado: "Estado hoy",
    proximo: "Próximo vencimiento",
    km: "Kilometraje",
    /** Lo que se ve en la cabecera de la tabla completa (5.10): «Km»; el nombre completo queda para los lectores y para el rótulo de la tarjeta. */
    kmCorto: "Km",
    parte: "Último parte",
    novedades: "Novedades",
    proyecto: "Proyecto y conductor",
  },
  /** Aviso de «Agregar unidad» cuando la unidad nueva no se ve con los filtros que hay puestos. */
  nuevaOculta: "La unidad nueva no se ve con los filtros actuales.",
} as const;

/** Diálogo «Agregar unidad» (5.11, 5.15 y 5.17). El título, el botón primario, la opción «Sin conductor asignado» y los errores vienen de `textos.ts`. */
export const TEXTO_DIALOGO_UNIDAD = {
  patente: "Patente",
  ayudaPatente: "Formato AA 123 BB o ABC 123.",
  interno: "Interno",
  ayudaInterno: "Un número de 1 a 999.",
  tipo: "Tipo",
  elegirTipo: "Elija el tipo",
  marca: "Marca",
  modelo: "Modelo",
  anio: "Año",
  ayudaAnio: (minimo: number, maximo: number) => `Entre ${minimo} y ${maximo}.`,
  proyecto: "Proyecto",
  elegirProyecto: "Elija el proyecto",
  conductor: "Conductor",
  ayudaConductor: "Opcional.",
  /** Junto a la opción y en la ayuda cuando el conductor elegido ya tiene una unidad. */
  yaTiene: (patente: string) => `Ya tiene asignada la unidad ${patente}.`,
  opcionConUnidad: (nombre: string, patente: string) => `${nombre} (ya tiene ${patente})`,
  guardando: "Guardando…",
} as const;
