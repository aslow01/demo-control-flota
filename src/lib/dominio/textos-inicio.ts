// Textos de Inicio (antes «Centro de alertas»; docs/diseno-ui.md, 6.1 y 7) y de los diálogos Renovar y Cargar documento (5.17). `redactor-ux` los revisa.

import { diaDeLaSemana, formatearFecha } from "./fechas.ts";
import type { FechaCivil, TipoDocumento } from "./tipos.ts";
import { concordar, NOMBRES_DOCUMENTO, pluralizar, textoDesgloseNoDisponibles } from "./textos-base.ts";

/** A8: la cifra «No disponibles hoy» de Inicio (bloqueadas por documentos + fuera de servicio), dicha en una frase. */
export function textoProtagonista(n: number): string {
  if (n === 0) return "Todas las unidades activas están disponibles hoy";
  return n === 1 ? "1 unidad no disponible hoy" : `${n} unidades no disponibles hoy`;
}

/** A8: "Disponibles hoy: 19 de 23 unidades activas." */
export function textoDisponibles(disponibles: number, activas: number): string {
  return `Disponibles hoy: ${disponibles} de ${pluralizar(activas, "unidad activa", "unidades activas")}.`;
}

/** T6: "Hoy es miércoles 18/11/2026 (hora de Argentina)". */
export function textoHoy(hoy: FechaCivil): string {
  return `Hoy es ${diaDeLaSemana(hoy)} ${formatearFecha(hoy)} (hora de Argentina)`;
}

/** Barra de estado después de renovar: "Quedan 10 vencimientos." */
export function textoQuedanVencimientos(n: number): string {
  if (n === 0) return "No quedan vencimientos.";
  return n === 1 ? "Queda 1 vencimiento." : `Quedan ${n} vencimientos.`;
}

/** Unidad recién agregada: "Le faltan 4 documentos". */
export function textoLeFaltan(n: number): string {
  if (n === 0) return "No le falta ningún documento";
  return n === 1 ? "Le falta 1 documento" : `Le faltan ${n} documentos`;
}

/** Rótulos fijos de Inicio (los que llevan números se arman con las funciones de abajo). */
export const TEXTO_CENTRO = {
  titulo: "Inicio",
  bajada: "Datos ficticios de una empresa inventada. Todo se guarda en este navegador.",
  protagonista: "No disponibles hoy",
  operacion: "Operación diaria",
  operacionVacia: "Sin pendientes de operación.",
  /** Barra de estado de «Operación diaria»: el botón-texto cambia la vista a Conductor, y el texto lo dice. */
  conductor: { intro: "Así lo carga el conductor:", accion: "Abrir el parte diario", aclaracion: "(cambia la vista a Conductor)" },
  vencimientos: "Vencimientos",
  vencimientosVacio: "Nada vence en los próximos 30 días.",
  grupoVacio: "No hay documentos en este grupo.",
  detalle: "Operación diaria: detalle",
  /** Etiqueta de las columnas de las listas sin valor (documento faltante). */
  sinFecha: "—",
} as const;

/** Títulos de los grupos de la lista de vencimientos (sin la cantidad) y rótulos cortos de los filtros (sección 7). */
export const TEXTO_GRUPO_VENCIMIENTOS = {
  vencidos: { titulo: "Vencidos o faltantes", filtro: "Vencidos o faltantes" },
  "7": { titulo: "Vencen en 7 días o menos", filtro: "7 días o menos" },
  "15": { titulo: "Vencen entre 8 y 15 días", filtro: "8 a 15 días" },
  "30": { titulo: "Vencen entre 16 y 30 días", filtro: "16 a 30 días" },
} as const;

/** Etiqueta de estado de cada tipo de alerta de operación (5.7). */
export const TEXTO_ESTADO_OPERACION = {
  "novedad-critica": "Crítica",
  "parte-sin-enviar": "Sin enviar",
  "sin-parte": "Sin parte",
  "novedad-abierta": "Abierta",
} as const;

/** «En uso»: la unidad salió hoy y falta el cierre (etiqueta de «Último parte»). */
export const TEXTO_ESTADO_PARTE_EN_USO = "En uso";

/** Etiqueta de estado de un parte incompleto (P5): la revisión no se envió, o se envió y falta el cierre. */
export const TEXTO_ESTADO_PARTE_INCOMPLETO = { borrador: "Sin enviar", "en-uso": "Sin cerrar" } as const;

/** «1 parte sin enviar» · «1 parte sin cerrar» · «3 partes sin enviar o sin cerrar» (fila de «Operación diaria»). */
export function textoFilaPartesIncompletos(borradores: number, enUso: number): string {
  const n = borradores + enUso;
  const partes = n === 1 ? "parte" : "partes";
  if (enUso === 0) return `${n} ${partes} sin enviar`;
  if (borradores === 0) return `${n} ${partes} sin cerrar`;
  return `${n} ${partes} sin enviar o sin cerrar`;
}

/** Título del grupo del detalle: «Partes sin enviar» · «Partes sin cerrar» · «Partes sin enviar o sin cerrar». */
export function tituloGrupoPartesIncompletos(borradores: number, enUso: number): string {
  if (enUso === 0) return "Partes sin enviar";
  if (borradores === 0) return "Partes sin cerrar";
  return "Partes sin enviar o sin cerrar";
}

/** L6: bloque «Conductores que no pueden manejar hoy (N)» del protagonista. */
export const TEXTO_CONDUCTORES_SIN_LICENCIA = {
  titulo: (n: number) => `Conductores que no pueden manejar hoy (${n})`,
  unidad: "Unidad",
  renovar: "Renovar",
  cargar: "Cargar",
  /** M2: la licencia cargada con una emisión futura (un error de tipeo) se corrige; no hay otra salida. */
  corregir: "Corregir",
  /** Nombre accesible del botón: «Renovar licencia de Luis Ferreyra». */
  nombreAccesible: (accion: "Renovar" | "Cargar" | "Corregir", nombre: string) => `${accion} licencia de ${nombre}`,
  /** Para lectores, después de la cifra del protagonista. */
  lector: (n: number) => (n === 1 ? "1 conductor no puede manejar hoy." : `${n} conductores no pueden manejar hoy.`),
  /** Barra de estado al guardar la licencia. */
  licenciaRenovada: (nombre: string) => `Licencia de ${nombre} renovada.`,
  licenciaCargada: (nombre: string) => `Licencia de ${nombre} cargada.`,
} as const;

/** L6: el motivo de una fila, según L5 («Licencia vencida hace 3 días», «Falta cargar la licencia», «Licencia válida desde el 20/11/2026»). */
export function textoMotivoSinLicencia(
  m: { motivo: "faltante" } | { motivo: "vencida"; diasVencida: number } | { motivo: "posterior"; desde: FechaCivil },
): string {
  if (m.motivo === "faltante") return "Falta cargar la licencia";
  if (m.motivo === "vencida") return `Licencia vencida hace ${pluralizar(m.diasVencida, "día", "días")}`;
  return `Licencia válida desde el ${formatearFecha(m.desde)}`;
}

/** Título de cada grupo del detalle de operación, sin la cantidad. */
export const TEXTO_GRUPO_OPERACION = {
  "novedad-critica": "Novedades críticas",
  "parte-sin-enviar": "Partes sin enviar",
  "sin-parte": "Unidades sin parte de ayer",
  "novedad-abierta": "Novedades abiertas",
} as const;

/**
 * R3: textos de las tres pantallas del encargado en la interfaz tipo app (Inicio, Vencimientos y Operación diaria): rótulos de las cifras, leyenda del
 * horizonte, estados vacíos (título + qué va ahí) y líneas de contexto. Vocabulario del prototipo aprobado; las cifras llevan su unidad y su período.
 */
export const TEXTO_INICIO = {
  /** Rótulos de las cuatro cifras secundarias (la principal es `TEXTO_CENTRO.protagonista`). */
  cifraVencidos: "Vencidos o faltantes",
  cifraProximos: "Vencen en 30 días",
  cifraPartes: "Partes pendientes",
  cifraNovedadCritica: (n: number) => (n === 1 ? "Novedad crítica" : "Novedades críticas"),
  /** Bajo la cifra principal cuando vale 0. */
  sinNoDisponibles: "Ninguna unidad bloqueada ni fuera de servicio",
  /** Panel «No disponibles hoy» sin unidades: no afirma nada sobre licencias, que no entran en la cifra. */
  noDisponiblesVacio: { titulo: "Todas las unidades activas están disponibles.", ayuda: "Ninguna está bloqueada por documentos ni fuera de servicio." },
  /** Enlace del panel de vencimientos; el nombre accesible dice a dónde lleva. */
  verTodosVencimientos: { visible: "Ver todos", nombre: "Ver todos los vencimientos" },
  /** Segunda línea del panel «Operación diaria» sin pendientes (la primera es `TEXTO_CENTRO.operacionVacia`). */
  operacionVaciaAyuda: "Aquí aparecerán los partes sin enviar o sin cerrar, las unidades sin parte y las novedades abiertas.",
  /** Franja bajo el subtítulo: invita al recorrido (el parte que se traba por un seguro vencido). El botón abre «Ver como» con ese conductor ya elegido. */
  recorrido: { texto: "Pruebe la demo: vea cómo un seguro vencido impide cargar el parte.", boton: "Probar como conductor" },
} as const;

/** Leyenda del horizonte: una forma, su período y cuántos documentos hay. Los rótulos son los de los filtros de Vencimientos. */
export const TEXTO_LEYENDA_HORIZONTE = {
  vencidos: "Vencido o faltante",
  "7": TEXTO_GRUPO_VENCIMIENTOS["7"].filtro,
  "15": TEXTO_GRUPO_VENCIMIENTOS["15"].filtro,
  "30": TEXTO_GRUPO_VENCIMIENTOS["30"].filtro,
  /** Escala bajo la pista: «Hoy · 7 · 15 · 30 días». */
  escala: { hoy: "Hoy", sieteDias: "7", quinceDias: "15", treintaDias: "30 días" },
  /** Nombre accesible de la pista. */
  nombrePista: "Regla de vencimientos, de hoy a 30 días",
  /** Ayuda para quien navega con teclado o lector de pantalla. */
  ayudaTeclado: "Use las flechas para recorrerlos y Enter para ver el detalle.",
  /** Antes de elegir un punto (sin «Toque»: sirve con mouse, teclado y pantalla táctil). */
  ayudaDetalle: "Elija un punto para ver qué vence y de qué unidad.",
} as const;

/**
 * Nombre accesible de un punto de la regla de vencimientos: «ZK 214 BD, seguro: vence en 3 días» (de una unidad) o «licencia de conducir de Bruno Juárez: vence en 12 días»
 * (de un conductor). `estado` es el texto de `clasificar` («Vence en 3 días», «Vence hoy»); aquí solo se pasa a minúscula inicial.
 */
export function textoPuntoDeLaRegla(titular: { patente: string } | { conductor: string }, tipo: TipoDocumento, estado: string): string {
  const documento = NOMBRES_DOCUMENTO[tipo].toLowerCase();
  const que = "patente" in titular ? `${titular.patente}, ${documento}` : `${documento} de ${titular.conductor}`;
  return `${que}: ${estado.charAt(0).toLowerCase()}${estado.slice(1)}`;
}

/** Un número de la leyenda dicho completo: «4 documentos, 7 días o menos». */
export function textoLeyendaConCantidad(rotulo: string, n: number): string {
  return `${pluralizar(n, "documento", "documentos")}, ${rotulo.charAt(0).toLowerCase()}${rotulo.slice(1)}`;
}

/** Línea de contexto de Vencimientos: «3 vencidos o faltantes · 9 vencen en 30 días» (los vencidos no se cuentan en los de 30 días). */
export function textoContextoVencimientos(vencidos: number, proximos: number): string {
  return `${pluralizar(vencidos, "vencido o faltante", "vencidos o faltantes")} · ${textoRotuloVencimientos(proximos)}`;
}

/** Línea de contexto de Operación diaria: «6 pendientes · al 25/11/2026». */
export function textoContextoOperacion(pendientes: number, hoy: FechaCivil): string {
  return `${textoPendientes(pendientes)} · al ${formatearFecha(hoy)}`;
}

/** Estados vacíos de Vencimientos y de las dos solapas de Operación: qué pasó y qué va a aparecer ahí. */
export const TEXTO_VACIO_PANTALLAS = {
  vencimientos: { titulo: "Nada vence en los próximos 30 días.", ayuda: "Cuando un documento entre en esa ventana, aparecerá aquí con su fecha." },
  partes: { titulo: "No hay partes pendientes.", ayuda: "Si un conductor deja un parte sin enviar o sin cerrar, o una unidad queda sin parte, aparecerá aquí." },
  novedades: { titulo: "No hay novedades abiertas.", ayuda: "Las novedades que se cargan en un parte o en una ficha aparecerán aquí hasta que se resuelvan." },
  /** Un grupo sin filas dentro de una lista con otros grupos (por ejemplo, «Partes sin cerrar (0)»). */
  grupoSinFilas: "Ninguno.",
} as const;

/** «Unidades» junto a la cifra del protagonista: «1 unidad», «4 unidades» (con 0, «unidades»). */
export function palabraUnidades(n: number): "unidad" | "unidades" {
  return n === 1 ? "unidad" : "unidades";
}

/** Para lectores de pantalla: la frase completa en un solo texto, con punto final. */
export function textoProtagonistaLector(n: number): string {
  return `${textoProtagonista(n)}.`;
}

/** «Ver las 9 no disponibles en Movilidades». */
export function textoVerTodasEnLaFlota(n: number): string {
  return `Ver las ${n} no disponibles en Movilidades`;
}

/** Cabecera del panel de operación: «6 pendientes». */
export function textoPendientes(n: number): string {
  return pluralizar(n, "pendiente", "pendientes");
}

/** Cabecera del panel de vencimientos: «9 vencen en 30 días» (solo los que vencen en 30 días o menos; los vencidos o faltantes van aparte, con su propia cifra). */
export function textoRotuloVencimientos(n: number): string {
  return `${n} ${n === 1 ? "vence" : "vencen"} en 30 días`;
}

/** Región `role="status"` del filtro (5.8): «Mostrando 4 de 11 vencimientos.». */
export function textoMostrando(mostrados: number, total: number): string {
  return `Mostrando ${mostrados} de ${pluralizar(total, "vencimiento", "vencimientos")}.`;
}

/** Título de un grupo con su cantidad: «Vencidos o faltantes (2)». */
export function textoGrupoConCantidad(titulo: string, n: number): string {
  return `${titulo} (${n})`;
}

/** Fila del panel de operación diaria: «1 novedad crítica abierta», «2 unidades sin parte de ayer». */
export function textoFilaOperacion(tipo: keyof typeof TEXTO_ESTADO_OPERACION, n: number, diasLaMasAntigua: number | null): string {
  const uno = n === 1;
  switch (tipo) {
    case "novedad-critica":
      return `${n} ${uno ? "novedad crítica abierta" : "novedades críticas abiertas"}`;
    case "parte-sin-enviar":
      return `${n} ${uno ? "parte" : "partes"} sin enviar`;
    case "sin-parte":
      return `${n} ${uno ? "unidad" : "unidades"} sin parte de ayer`;
    case "novedad-abierta": {
      const antiguedad = diasLaMasAntigua === null ? "" : ` hace ${pluralizar(diasLaMasAntigua, "día", "días")}`;
      if (uno) return `1 novedad abierta${antiguedad}`;
      return `${n} novedades abiertas${antiguedad === "" ? "" : `, la más antigua${antiguedad}`}`;
    }
  }
}

/** Nombre accesible de los botones de documentos (lista de vencimientos y ficha): «Renovar seguro de ZK 214 BD». */
export function textoAccionDocumento(accion: "Renovar" | "Cargar" | "Corregir", tipo: TipoDocumento, titular: string): string {
  const nombre = NOMBRES_DOCUMENTO[tipo];
  return `${accion} ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)} de ${titular}`;
}

/** Barra de estado después de renovar: «Seguro de ZK 214 BD renovado.» */
export function textoDocumentoRenovado(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "renovado", "renovada")}.`;
}

/** Barra de estado después de cargar: «Habilitación de ingreso al proyecto de ZP 088 KC cargada.» */
export function textoDocumentoCargado(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "cargado", "cargada")}.`;
}

/** Diálogo «Renovar documento» (5.17). */
export const TEXTO_RENOVAR = {
  titulo: (nombre: string, titular: string) => `Renovar: ${nombre} de ${titular}`,
  primario: "Guardar renovación",
  /** «Actual: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día).» */
  vigente: (numero: string, estado: string, sustantivo: string) => `Actual: ${sustantivo} ${numero}, ${estado}.`,
  vencio: (vence: FechaCivil, dias: number) => `venció el ${formatearFecha(vence)} (hace ${pluralizar(dias, "día", "días")})`,
  venceHoy: (vence: FechaCivil) => `vence hoy (${formatearFecha(vence)})`,
  vence: (vence: FechaCivil, dias: number) => `vence el ${formatearFecha(vence)} (en ${pluralizar(dias, "día", "días")})`,
} as const;

/** Cómo se llama el documento junto a su número en la línea de contexto: la póliza de un seguro; el resto, «número». */
export const SUSTANTIVO_NUMERO_DOCUMENTO: Partial<Record<TipoDocumento, string>> = { seguro: "póliza" };

/** Diálogo «Cargar documento» (5.17). */
export const TEXTO_CARGAR = {
  titulo: (nombre: string, titular: string) => `Cargar: ${nombre} de ${titular}`,
  primario: "Guardar documento",
} as const;

/** Textos de las novedades de la ficha que también usa «Resolver novedad» (Inicio y Operación diaria): `TEXTO_FICHA.novedades`. */
export const TEXTO_NOVEDADES_DE_FICHA = {
  titulo: "Novedades",
  abiertas: "Abiertas",
  resueltas: "Resueltas",
  vacioAbiertas: "Sin novedades abiertas.",
  vacioResueltas: "Sin novedades resueltas.",
  resolver: "Resolver",
  cargar: "Cargar novedad",
  etiquetaCritica: "Crítica",
  etiquetaAbierta: "Abierta",
  etiquetaResuelta: "Resuelta",
  manual: "Cargada por el encargado",
} as const;

/**
 * De dónde salió la novedad: «Parte del 16/11/2026, punto Frenos» o «Cargada por el encargado». `item` es el rótulo del punto, o `null` para «Otra novedad».
 */
export function textoOrigenEnFicha(origen: { tipo: "parte"; item: string | null } | { tipo: "manual" }, fecha: FechaCivil): string {
  if (origen.tipo === "manual") return TEXTO_NOVEDADES_DE_FICHA.manual;
  return origen.item === null ? `Parte del ${formatearFecha(fecha)}, otra novedad` : `Parte del ${formatearFecha(fecha)}, punto ${origen.item}`;
}

/** Barra de estado de la ficha después de renovar: «Seguro de ZK 214 BD renovado: vence el 15/11/2027.» */
export function textoDocumentoRenovadoEnFicha(tipo: TipoDocumento, titular: string, vence: FechaCivil): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "renovado", "renovada")}: vence el ${formatearFecha(vence)}.`;
}

/**
 * Después de resolver una novedad: «Novedad resuelta: Frenos.», y si la unidad volvió, lo dice. Desde el centro de alertas (donde hay
 * muchas unidades) también nombra la unidad: «Novedad resuelta: Frenos (ZU 899 QE).»
 */
export function textoNovedadResuelta(rotulo: string, patente: string, volvio: boolean, nombraLaUnidad = false, hastaManana = false): string {
  const vuelta = volvio ? ` ${patente} vuelve a servicio${hastaManana ? ", pero no sale hasta mañana" : ""}.` : "";
  return `Novedad resuelta: ${rotulo}${nombraLaUnidad ? ` (${patente})` : ""}.${vuelta}`;
}

// ---------- La regla de salida de Inicio (etapa 2, docs/diseno-ui.md 15.6, 15.7 y 15.14) ----------

/** Rótulos de la regla de salida y de la «Acción del día». Los textos que se arman con números o con otros textos son las funciones de abajo; los nombres accesibles de las llaves, del sello y de «y N más» están en `componentes/textos-marco.ts` (`TEXTO_NOMBRES_DE_LA_REGLA`), junto al «Ver ficha» que usan. */
export const TEXTO_REGLA = {
  /** `h2` de la regla: es lo que mide («Disponibles hoy») y el destino del foco al resolver. Tope de 15 caracteres: el corte de la mordaza angosta está calculado para eso. */
  titulo: "Disponibles hoy",
  /** Nombre de la lista de llaves del tablero completo (sin metáforas: quien no ve el dibujo recibe una lista de unidades). */
  listaCompleta: "Unidades activas",
  /** Nombre de la lista de los cuatro renglones de lectura. */
  resumen: "Resumen de hoy",
  /** Ayuda de teclado del tablero completo: a la vista en el rótulo de cota y, una vez, para lectores (`aria-describedby`). */
  ayudaTeclado: "Use las flechas para recorrer las unidades.",
  /** Rótulo de la nota de la acción principal de Inicio. */
  accionDelDia: "Acción del día",
  /** Flota vacía (ninguna unidad activa): no se reutiliza «Todavía no hay unidades.», que sería falso con todas las unidades de baja. */
  sinActivas: "No hay unidades activas.",
  sinActivasAyuda: "Aquí se verá cuántas pueden salir hoy.",
  sinActivasEnlace: "Agregar una unidad en Movilidades",
} as const;

/** Cota de la zona roja: «4 unidades», «1 unidad». */
export function textoCota(n: number): string {
  return `${n} ${palabraUnidades(n)}`;
}

/**
 * Párrafo de la regla para lectores, con el valor final desde el primer cuadro: «Disponibles hoy: 19 de 23 unidades activas. 4 unidades no disponibles hoy: 2 bloqueadas por
 * documentos · 2 fuera de servicio.» y, sin no disponibles, «Disponibles hoy: 23 de 23 unidades activas. Ninguna unidad bloqueada ni fuera de servicio.».
 */
export function textoLectorDeLaRegla(disponibles: number, activas: number, bloqueadas: number, fuera: number): string {
  const noDisponibles = bloqueadas + fuera;
  const resto = noDisponibles === 0 ? `${TEXTO_INICIO.sinNoDisponibles}.` : `${textoProtagonista(noDisponibles)}: ${textoDesgloseNoDisponibles(bloqueadas, fuera)}.`;
  return `${textoDisponibles(disponibles, activas)} ${resto}`;
}

/** Anuncio al resolver una pieza: el mensaje que ya da el diálogo y la medida nueva («Seguro de ZK 214 BD renovado. Disponibles hoy: 20 de 23 unidades activas.»). */
export function textoAnuncioAlResolver(mensaje: string, disponibles: number, activas: number): string {
  return `${mensaje} ${textoDisponibles(disponibles, activas)}`;
}
