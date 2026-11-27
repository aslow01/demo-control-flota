// Textos de la ficha de unidad (presentación; los de la lógica están en `lib/dominio/textos-ficha.ts`). Se bajan con la ficha, no con el marco.

/** Ficha de unidad (6.3): rótulos de la pantalla que no salen del dominio. Los títulos de los paneles, las acciones, los estados y los textos de cada fila vienen de `textos-ficha.ts`. */
export const TEXTO_FICHA_VISTA = {
  rutaEtiqueta: "Ruta",
  motivosDe: "Motivos por los que no está disponible",
  datos: { proyecto: "Proyecto", conductor: "Conductor", kilometraje: "Kilometraje", sinConductor: "Sin conductor", sinProyecto: "—" },
  mostrar: "Mostrar",
  /** Se quiso abrir un diálogo de algo que ya cambió (otra pestaña, o la ficha estaba desactualizada). */
  yaCambio: "La unidad cambió desde la última vez que se miró. La ficha está al día.",
  documentos: {
    columnas: { documento: "Documento", numero: "Número", vence: "Vence", estado: "Estado", accion: "Acciones" },
    /** Rótulos de las celdas cuando la fila pasa a tarjeta. */
    numeroDe: "Número",
    venceEl: "Vence",
    sinNumero: "—",
    /** Cada documento reemplazado, dentro de «Anteriores (N)»: «DEMO-88-3320 · Aseguradora Cuyo · venció el 17/11/2025 · cargado el 18/11/2025». */
    anterior: (a: { numero: string; emisor: string | null; vence: string; cargado: string }) =>
      [a.numero, a.emisor, `vencía el ${a.vence}`, `cargado el ${a.cargado}`].filter((t) => t !== null).join(" · "),
    /** El documento ya no es el que se quiso abrir (se renovó o se cargó mientras tanto). */
    yaNoDisponible: "Ese documento ya cambió. La lista está al día.",
    sinDocumentos: "Esta unidad no tiene documentos cargados.",
  },
  novedades: {
    /** Lo que se anuncia al cambiar el filtro: «Novedades abiertas: 1.» */
    anuncio: (etiqueta: string, cantidad: number) => `Novedades ${etiqueta.toLowerCase()}: ${cantidad}.`,
    impideVolver: "Impide volver a servicio hasta que se resuelva.",
    resuelta: (fecha: string, autor: string) => `Resuelta el ${fecha} por ${autor}.`,
    yaResuelta: "Esa novedad ya está resuelta. La lista está al día.",
  },
  kilometraje: {
    columnas: { fecha: "Fecha", registro: "Registro", recorrido: "Recorrido" },
    motivo: (texto: string) => `Motivo: ${texto}`,
    /** Texto oculto de la celda del recorrido de un parte en uso, que muestra «—» (un lector de pantalla diría «raya» o nada). */
    sinRecorrido: "Sin recorrido",
    /** Texto oculto delante de la fecha del enlace al parte: «Parte del 17/11/2026». */
    parteDel: "Parte del ",
  },
  historial: {
    resumenDelDetalle: "Detalle del evento",
    kilometraje: "Kilometraje",
    recorrido: "Recorrido",
    combustible: "Combustible",
    litros: "Litros",
    novedades: "Novedades",
    critica: "crítica",
    fueraDePlazo: "Enviado fuera de plazo.",
    campo: "Campo",
    /** Nombre accesible de «Ver el parte completo» (hay uno por parte enviado): el texto visible, y cuándo se envió. `instante` es `dd/mm/aaaa hh:mm`. */
    verParteEnviado: (visible: string, instante: string) => {
      const [fecha = "", hora = ""] = instante.split(" ");
      return `${visible} enviado el ${fecha} a las ${hora}`;
    },
  },
} as const;
