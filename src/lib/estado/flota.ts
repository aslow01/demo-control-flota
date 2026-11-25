// Flota (docs/diseno-ui.md, 5.10 y 6.2): todo lo que la pantalla dibuja, listo, con búsqueda, filtros y orden, sin DOM y sin reglas
// nuevas. Parte de `calcularAlertas`, `aptitud` y `kmActual` (las mismas que usa el resto de la aplicación), así la fila, el
// centro de alertas y la ficha no pueden contradecirse; solo decide qué columnas hay, cómo se busca, qué filtros se ofrecen y en
// qué orden salen las filas.
//
// Los enlaces vienen como `href` ya armados (`#/unidad/ZK214BD`): por eso vive junto al enrutador y no en `dominio/`.
// Uso: `app.panelDeFlota` (todas las filas, una vez por cambio de datos; `null` hasta que termina el arranque) y, en la vista,
// `vistaDeFlota(panel, consulta)` con la consulta como estado de la pantalla (`$state`), que empieza en `consultaDeRuta(app.ruta)`.

import type { Alerta, ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud, type Aptitud } from "../dominio/aptitud.ts";
import { diasEntre, formatearFecha } from "../dominio/fechas.ts";
import { kmActual } from "../dominio/kilometraje.ts";
import { formatearPatente } from "../dominio/patente.ts";
import {
  NOMBRES_DOCUMENTO,
  NOMBRES_TIPO_UNIDAD,
  TEXTO_ESTADO_OPERACION,
  TEXTO_ESTADO_PARTE_EN_USO,
  TEXTO_ESTADO_PARTE_INCOMPLETO,
  TEXTO_FALTA_CARGAR,
  TEXTO_FLOTA,
  abreviar,
  formatearKm,
  textoDescripcionUnidad,
  textoFichaDe,
  textoInterno,
  textoMostrandoUnidades,
  textoMotivosMas,
  textoNovedadesDeUnidad,
  textoPlazoCorto,
  textoResumenFlota,
  textoSinCoincidencias,
  textoVencimiento,
} from "../dominio/textos.ts";
import type { Estado, FechaCivil, Unidad } from "../dominio/tipos.ts";
import { REQUISITOS, documentoVigente, estadoDeLicencia } from "../dominio/vencimientos.ts";
import { horizonteMinimo, type FormaDeMarca, type Horizonte } from "../dominio/horizonte.ts";
import { aHash, type FiltroDeFlotaEnRuta, type Ruta } from "./enrutador.ts";

// --- Consulta ------------------------------------------------------------------------------------

/** «activas» es el de por defecto; «no-disponibles» (no pueden salir + fuera de servicio) viene de «Ver las N en la flota». */
export type IdFiltroFlota = "activas" | FiltroDeFlotaEnRuta;
export type OrdenFlota = "prioridad" | "patente" | "interno" | "proximo-vencimiento" | "ultimo-parte";

/** El valor del `select` Proyecto que no filtra. */
export const TODOS_LOS_PROYECTOS = "todos";

/** Lo que la persona eligió en la pantalla. Es estado de la vista; esto solo dice cómo se aplica. */
export interface ConsultaFlota {
  filtro: IdFiltroFlota;
  /** Lo escrito en el buscador, sin tocar. */
  busqueda: string;
  /** `TODOS_LOS_PROYECTOS` o el id de un proyecto. */
  proyecto: string;
  orden: OrdenFlota;
}

export const CONSULTA_INICIAL: ConsultaFlota = { filtro: "activas", busqueda: "", proyecto: TODOS_LOS_PROYECTOS, orden: "prioridad" };

const ORDENES: readonly OrdenFlota[] = ["prioridad", "patente", "interno", "proximo-vencimiento", "ultimo-parte"];
/** Las pastillas, en el orden del prototipo: «No disponibles hoy» (bloqueadas + fuera de servicio) va antes de sus dos partes. */
const FILTROS_BASE: readonly IdFiltroFlota[] = ["activas", "pueden-salir", "no-disponibles", "no-pueden-salir", "fuera-de-servicio", "de-baja"];

/** Lo crítico lleva el color y la forma: la forma acompaña al color para que no sea lo único que lo diga. */
const ASPECTO_DE_FILTRO: Partial<Record<IdFiltroFlota, { tono: "critico" | "semana"; forma: FormaDeMarca }>> = {
  "no-disponibles": { tono: "critico", forma: "rombo" },
  "no-pueden-salir": { tono: "critico", forma: "rombo" },
  "fuera-de-servicio": { tono: "semana", forma: "triangulo" },
};

/** La consulta con que se abre la pantalla: el filtro y la búsqueda de la ruta (`#/movilidades?filtro=no-disponibles&q=hilux`) o los de por defecto. */
export function consultaDeRuta(ruta: Ruta): ConsultaFlota {
  if (ruta.tipo !== "movilidades") return { ...CONSULTA_INICIAL };
  return { ...CONSULTA_INICIAL, filtro: ruta.filtro ?? CONSULTA_INICIAL.filtro, busqueda: ruta.q ?? "" };
}

/** La ruta de una consulta, para escribirla en la dirección: solo viajan el filtro (si no es «activas») y la búsqueda; el proyecto y el orden son de la vista. */
export function rutaDeConsulta(consulta: ConsultaFlota): Ruta {
  const ruta: Ruta = { tipo: "movilidades" };
  if (consulta.filtro !== "activas") ruta.filtro = consulta.filtro;
  if (consulta.busqueda !== "") ruta.q = consulta.busqueda;
  return ruta;
}

/** «Quitar filtros» (vacío por filtro): vuelve a todo, menos el orden, que no es un filtro. */
export function quitarFiltros(c: ConsultaFlota): ConsultaFlota {
  return { ...CONSULTA_INICIAL, orden: c.orden };
}

// --- Filas ---------------------------------------------------------------------------------------

export interface EstadoDeFila {
  categoria: Aptitud["categoria"];
  /** «Puede salir», «No puede salir», «Fuera de servicio», «De baja». */
  etiqueta: string;
  /** El motivo principal (línea 2): «Seguro vencido hace 1 día». `null` si puede salir. */
  motivo: string | null;
  /** «y 1 motivo más»; `null` si hay uno solo o ninguno. */
  motivosMas: string | null;
  motivos: string[];
}

export interface ProximoVencimiento {
  tipo: "faltante" | "vencido" | "por-vencer" | "vigente" | "ninguno";
  /** «Seguro». `null` si no hay. */
  documento: string | null;
  /** Para faltante y vencido, la etiqueta crítica: «Falta cargar», «Vencido hace 1 día». */
  etiqueta: string | null;
  /** La línea entera: «Revisión técnica · en 6 días», «Seguro · 12/05/2027», «Vencido hace 1 día · Seguro». «—» si no hay. */
  texto: string;
  /** Días desde hoy hasta el vencimiento (negativo si ya venció); `null` si falta el documento o no hay. */
  dias: number | null;
  /** Solo `por-vencer`: la pista mínima con una marca (5.6). */
  horizonte: Horizonte | null;
}

export interface FilaFlota {
  unidadId: string;
  /** Normalizada, sin espacios (`ZK214BD`). */
  patente: string;
  patenteTexto: string;
  /** «Int. 07». */
  interno: string;
  internoNumero: number;
  proyectoId: string;
  href: string;
  /** Texto oculto del enlace: «Ficha de ZK 214 BD». */
  nombreAccesible: string;
  /** «Toyota Hilux 2022 · Camioneta». */
  descripcion: string;
  estado: EstadoDeFila;
  /** Franja izquierda solo en las que no pueden salir (crítico), fuera de servicio (semana) o de baja (neutro). */
  franja: "critico" | "semana" | "neutro" | null;
  proximoVencimiento: ProximoVencimiento;
  km: { valor: number | null; texto: string };
  ultimoParte: {
    /** El último parte **enviado**; los borradores no cuentan. */
    fecha: FechaCivil | null;
    /** `dd/mm/aaaa` o «Sin partes». */
    texto: string;
    /**
     * «Sin enviar» (hay un borrador de un día anterior), «Sin cerrar» (hay un parte en uso de un día anterior), «En uso» (la unidad salió hoy y falta el cierre) o «Sin parte» (ayer no
     * hubo ninguno), de las alertas de operación y de los partes de hoy.
     */
    etiqueta: "Sin enviar" | "Sin cerrar" | "En uso" | "Sin parte" | null;
  };
  /** L1: el conductor asignado no tiene licencia que ampare hoy (la unidad puede salir con otro conductor: A1). La vista agrega «sin licencia vigente» junto al nombre. */
  conductorSinLicencia: boolean;
  novedades: { abiertas: number; criticas: number; texto: string };
  proyecto: string | null;
  conductor: string | null;
  /** Lo que se compara al buscar (normalizado); no se muestra. */
  claveDeBusqueda: string;
}

export interface OpcionDeProyecto {
  /** `TODOS_LOS_PROYECTOS` o el id del proyecto. */
  valor: string;
  etiqueta: string;
}

export interface PanelFlota {
  /** «Unidades». */
  titulo: string;
  /** Las activas (lo que dice «Unidades │ 23»). */
  cantidad: number;
  /** «23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja». */
  resumen: string;
  /** Todas las unidades, también las de baja, sin orden de pantalla (el orden lo pone `vistaDeFlota`). */
  filas: FilaFlota[];
  proyectos: OpcionDeProyecto[];
  ordenes: { id: OrdenFlota; etiqueta: string }[];
}

const ESTADO_FRANJA: Record<Aptitud["categoria"], FilaFlota["franja"]> = {
  "puede-salir": null,
  "no-puede-salir": "critico",
  "fuera-de-servicio": "semana",
  baja: "neutro",
};

/** Búsqueda (6.2): minúsculas, sin tildes, y sin espacios, guiones ni puntos, para que `zk214` encuentre `ZK 214 BD`. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Tope de lo que se lee del buscador (entrada hostil: un pegado enorme no cuesta nada) y de palabras que se comparan. */
const LARGO_MAXIMO_BUSQUEDA = 60;
const PALABRAS_MAXIMAS = 6;
/** Cuánto de lo buscado se repite en el texto de «Ninguna unidad coincide…». */
const LARGO_MAXIMO_ECO = 40;

/** Las palabras de la búsqueda, ya normalizadas; todas tienen que aparecer en la fila. */
function terminosDeBusqueda(texto: string): string[] {
  return texto
    .slice(0, LARGO_MAXIMO_BUSQUEDA)
    .split(/\s+/)
    .slice(0, PALABRAS_MAXIMAS)
    .map(normalizarBusqueda)
    .filter((t) => t !== "");
}

function proximoDeAlerta(a: Alerta, r: ResultadoAlertas, unidadId: string): ProximoVencimiento {
  const documento = a.tipoDocumento === null ? null : NOMBRES_DOCUMENTO[a.tipoDocumento];
  if (a.tipo === "documento-faltante" || a.tipo === "documento-vencido") {
    const faltante = a.tipo === "documento-faltante";
    const etiqueta = faltante || a.d === null ? TEXTO_FALTA_CARGAR : textoVencimiento(a.d, "", a.tipoDocumento ?? undefined);
    return { tipo: faltante ? "faltante" : "vencido", documento, etiqueta, texto: a.texto, dias: a.d, horizonte: null };
  }
  const d = a.d ?? 0;
  return {
    tipo: "por-vencer",
    documento,
    etiqueta: null,
    texto: `${documento ?? ""} · ${textoPlazoCorto(d)}`,
    dias: d,
    horizonte: horizonteMinimo(r, unidadId),
  };
}

/** Sin alertas, el vencimiento más cercano entre los documentos vigentes de la unidad (todos vencen a más de 30 días). */
function proximoVigente(estado: Estado, unidad: Unidad, hoy: FechaCivil): ProximoVencimiento {
  const vigentes = REQUISITOS.filter((q) => q.titular === "unidad")
    .flatMap((q) => documentoVigente(estado.documentos, { tipo: "unidad", id: unidad.id }, q.tipo) ?? [])
    .sort((a, b) => (a.vence < b.vence ? -1 : a.vence > b.vence ? 1 : 0));
  const primero = vigentes[0];
  if (primero === undefined) return sinVencimientos();
  const nombre = NOMBRES_DOCUMENTO[primero.tipo];
  return { tipo: "vigente", documento: nombre, etiqueta: null, texto: `${nombre} · ${formatearFecha(primero.vence)}`, dias: diasEntre(hoy, primero.vence), horizonte: null };
}

function sinVencimientos(): ProximoVencimiento {
  return { tipo: "ninguno", documento: null, etiqueta: null, texto: TEXTO_FLOTA.sinVencimientos, dias: null, horizonte: null };
}

function armarFila(
  estado: Estado,
  r: ResultadoAlertas,
  hoy: FechaCivil,
  u: Unidad,
  alertasDeLaUnidad: readonly Alerta[],
  ultimaFecha: ReadonlyMap<string, FechaCivil>,
): FilaFlota {
  const a = aptitud(u, estado, hoy);
  const motivos = a.motivos.map((m) => m.texto);
  const patenteTexto = formatearPatente(u.patente);
  const abiertas = estado.novedades.filter((n) => n.unidadId === u.id && n.estado === "abierta");
  const criticas = abiertas.filter((n) => n.gravedad === "critica").length;
  const km = kmActual(u.id, estado.partes, estado.correccionesKm);
  const ultima = ultimaFecha.get(u.id) ?? null;
  const proyecto = estado.proyectos.find((p) => p.id === u.proyectoId)?.nombre ?? null;
  const conductor = u.conductorId === null ? null : (estado.conductores.find((c) => c.id === u.conductorId)?.nombre ?? null);
  const delVencimiento = u.estado.tipo === "baja" ? undefined : alertasDeLaUnidad.find((x) => x.categoria === "vencimientos");
  const proximo =
    u.estado.tipo === "baja" ? sinVencimientos() : delVencimiento !== undefined ? proximoDeAlerta(delVencimiento, r, u.id) : proximoVigente(estado, u, hoy);
  const incompletos = alertasDeLaUnidad.filter((x) => x.tipo === "parte-sin-enviar");
  const sinEnviar = incompletos.some((x) => x.etapaParte !== "en-uso");
  const sinCerrar = incompletos.some((x) => x.etapaParte === "en-uso");
  const enUsoHoy = estado.partes.some((p) => p.unidadId === u.id && p.estado === "en-uso" && p.fecha === hoy);
  const sinParte = alertasDeLaUnidad.some((x) => x.tipo === "sin-parte");
  // C2: la fecha es la del parte que nombra la etiqueta (el más reciente de su clase); sin etiqueta o con «Sin parte», la del último enviado.
  const ultimaDe = (lista: readonly Alerta[]): FechaCivil | null => lista.reduce<FechaCivil | null>((m, x) => (x.fecha !== null && (m === null || x.fecha > m) ? x.fecha : m), null);
  const fechaDelParte =
    sinEnviar
      ? (ultimaDe(incompletos.filter((x) => x.etapaParte !== "en-uso")) ?? ultima)
      : sinCerrar
        ? (ultimaDe(incompletos.filter((x) => x.etapaParte === "en-uso")) ?? ultima)
        : enUsoHoy
          ? hoy
          : ultima;
  const descripcion = textoDescripcionUnidad(u.marca, u.modelo, u.anio, u.tipo);
  return {
    unidadId: u.id,
    patente: u.patente,
    patenteTexto,
    interno: textoInterno(u.interno),
    internoNumero: u.interno,
    proyectoId: u.proyectoId,
    href: aHash({ tipo: "unidad", patente: u.patente }),
    nombreAccesible: textoFichaDe(patenteTexto),
    descripcion,
    estado: {
      categoria: a.categoria,
      etiqueta: TEXTO_FLOTA.estado[a.categoria],
      motivo: motivos[0] ?? null,
      motivosMas: motivos.length > 1 ? textoMotivosMas(motivos.length - 1) : null,
      motivos,
    },
    franja: ESTADO_FRANJA[a.categoria],
    proximoVencimiento: proximo,
    km: { valor: km, texto: km === null ? TEXTO_FLOTA.sinRegistros : `${formatearKm(km)} km` },
    ultimoParte: {
      fecha: fechaDelParte,
      texto: fechaDelParte === null ? TEXTO_FLOTA.sinPartes : formatearFecha(fechaDelParte),
      etiqueta: sinEnviar
        ? TEXTO_ESTADO_PARTE_INCOMPLETO.borrador
        : sinCerrar
          ? TEXTO_ESTADO_PARTE_INCOMPLETO["en-uso"]
          : enUsoHoy
            ? TEXTO_ESTADO_PARTE_EN_USO
            : sinParte
              ? TEXTO_ESTADO_OPERACION["sin-parte"]
              : null,
    },
    conductorSinLicencia: u.conductorId !== null && !estadoDeLicencia(estado.documentos, u.conductorId, hoy).vigente,
    novedades: { abiertas: abiertas.length, criticas, texto: textoNovedadesDeUnidad(abiertas.length, criticas) },
    proyecto,
    conductor,
    claveDeBusqueda: [u.patente, textoInterno(u.interno), u.marca, u.modelo, String(u.anio), NOMBRES_TIPO_UNIDAD[u.tipo], conductor ?? ""]
      .map(normalizarBusqueda)
      .join(" "),
  };
}

/** Arma todas las filas. `r` es `calcularAlertas(estado, hoy)` (en un componente, `app.alertas`). */
export function panelDeFlota(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil): PanelFlota {
  const alertasPorUnidad = new Map<string, Alerta[]>();
  for (const a of r.alertas) {
    if (a.unidadId === null) continue;
    alertasPorUnidad.set(a.unidadId, [...(alertasPorUnidad.get(a.unidadId) ?? []), a]);
  }
  const ultimaFecha = new Map<string, FechaCivil>();
  for (const p of estado.partes) {
    if (p.estado !== "enviado") continue;
    const actual = ultimaFecha.get(p.unidadId);
    if (actual === undefined || p.fecha > actual) ultimaFecha.set(p.unidadId, p.fecha);
  }
  const filas = estado.unidades.map((u) => armarFila(estado, r, hoy, u, alertasPorUnidad.get(u.id) ?? [], ultimaFecha));
  const cuenta = (c: Aptitud["categoria"]) => filas.filter((f) => f.estado.categoria === c).length;
  const baja = cuenta("baja");
  return {
    titulo: TEXTO_FLOTA.panel,
    cantidad: filas.length - baja,
    resumen: textoResumenFlota({
      activas: filas.length - baja,
      pueden: cuenta("puede-salir"),
      noPueden: cuenta("no-puede-salir"),
      fuera: cuenta("fuera-de-servicio"),
      baja,
    }),
    filas,
    proyectos: [
      { valor: TODOS_LOS_PROYECTOS, etiqueta: TEXTO_FLOTA.todosLosProyectos },
      ...estado.proyectos.map((p) => ({ valor: p.id, etiqueta: p.nombre })),
    ],
    ordenes: ORDENES.map((id) => ({ id, etiqueta: TEXTO_FLOTA.ordenes[id] })),
  };
}

// --- Vista: filtros, búsqueda y orden ------------------------------------------------------------

export interface FiltroDeFlota {
  id: IdFiltroFlota;
  etiqueta: string;
  /** En la flota entera, sin tener en cuenta la búsqueda ni el proyecto. */
  cantidad: number;
  /** Solo las pastillas de lo crítico llevan tono y forma. */
  tono: "critico" | "semana" | null;
  forma: FormaDeMarca | null;
  /** La dirección del filtro, con la búsqueda de ahora: la pastilla es un enlace. */
  href: string;
  /** Es el filtro elegido (`aria-current`). */
  actual: boolean;
}

export type VacioDeFlota =
  | { tipo: "sin-unidades"; texto: string }
  /** `conQuitarFiltros`: hay algún filtro puesto que «Quitar filtros» saca. */
  | { tipo: "por-filtro"; texto: string; conQuitarFiltros: boolean };

export interface VistaFlota {
  /** Los seis de 6.2 y del prototipo: activas, disponibles, no disponibles hoy, bloqueadas, fuera de servicio y de baja. */
  filtros: FiltroDeFlota[];
  filas: FilaFlota[];
  mostradas: number;
  /** Las unidades del filtro de estado elegido (sin la búsqueda ni el proyecto): «Mostrando 1 de 23». */
  total: number;
  /** Para la región `role="status"` (con 500 ms de pausa al escribir): «Mostrando 23 de 23 unidades.» */
  anuncio: string;
  vacio: VacioDeFlota | null;
  hayFiltros: boolean;
}

function pasaFiltro(f: FilaFlota, filtro: IdFiltroFlota): boolean {
  const c = f.estado.categoria;
  switch (filtro) {
    case "activas":
      return c !== "baja";
    case "pueden-salir":
      return c === "puede-salir";
    case "no-pueden-salir":
      return c === "no-puede-salir";
    case "fuera-de-servicio":
      return c === "fuera-de-servicio";
    case "de-baja":
      return c === "baja";
    case "no-disponibles":
      return c === "no-puede-salir" || c === "fuera-de-servicio";
  }
}

const RANGO_CATEGORIA: Record<Aptitud["categoria"], number> = { "no-puede-salir": 0, "fuera-de-servicio": 1, "puede-salir": 2, baja: 3 };
const RANGO_VENCIMIENTO: Record<ProximoVencimiento["tipo"], number> = { faltante: 0, vencido: 1, "por-vencer": 2, vigente: 3, ninguno: 4 };

function menor(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function porVencimiento(a: FilaFlota, b: FilaFlota): number {
  const x = a.proximoVencimiento;
  const y = b.proximoVencimiento;
  return RANGO_VENCIMIENTO[x.tipo] - RANGO_VENCIMIENTO[y.tipo] || (x.dias ?? 0) - (y.dias ?? 0);
}

const COMPARADORES: Record<OrdenFlota, (a: FilaFlota, b: FilaFlota) => number> = {
  // 5.10: no puede salir, fuera de servicio, después próximo vencimiento ascendente, después patente. Las de baja, al final.
  prioridad: (a, b) => RANGO_CATEGORIA[a.estado.categoria] - RANGO_CATEGORIA[b.estado.categoria] || porVencimiento(a, b) || menor(a.patente, b.patente),
  patente: (a, b) => menor(a.patente, b.patente),
  interno: (a, b) => a.internoNumero - b.internoNumero || menor(a.patente, b.patente),
  "proximo-vencimiento": (a, b) => porVencimiento(a, b) || menor(a.patente, b.patente),
  // El más antiguo primero (quien hace más que no manda parte); sin partes, antes que todos.
  "ultimo-parte": (a, b) => menor(a.ultimoParte.fecha ?? "", b.ultimoParte.fecha ?? "") || menor(a.patente, b.patente),
};

function textoEco(busqueda: string): string {
  return abreviar(busqueda.trim().replace(/\s+/g, " "), LARGO_MAXIMO_ECO);
}

/**
 * Aplica la consulta: filtro por estado, proyecto, búsqueda y orden. No modifica el panel. Un proyecto que no existe se trata
 * como «Todos» y un orden desconocido como «Prioridad» (valores que no vienen de los `select`).
 */
export function vistaDeFlota(panel: PanelFlota, consulta: ConsultaFlota): VistaFlota {
  const cuenta = (id: IdFiltroFlota) => panel.filas.filter((f) => pasaFiltro(f, id)).length;
  const filtros: FiltroDeFlota[] = FILTROS_BASE.map((id) => ({
    id,
    etiqueta: TEXTO_FLOTA.filtros[id],
    cantidad: cuenta(id),
    tono: ASPECTO_DE_FILTRO[id]?.tono ?? null,
    forma: ASPECTO_DE_FILTRO[id]?.forma ?? null,
    href: aHash(rutaDeConsulta({ ...consulta, filtro: id })),
    actual: id === consulta.filtro,
  }));

  const proyecto = panel.proyectos.find((p) => p.valor === consulta.proyecto && p.valor !== TODOS_LOS_PROYECTOS);
  const terminos = terminosDeBusqueda(consulta.busqueda);
  const delEstado = panel.filas.filter((f) => pasaFiltro(f, consulta.filtro));
  const elegidas = delEstado.filter(
    (f) =>
      (proyecto === undefined || f.proyectoId === proyecto.valor) && terminos.every((t) => f.claveDeBusqueda.includes(t)),
  );
  const orden = ORDENES.find((o) => o === consulta.orden) ?? "prioridad";
  const filas = [...elegidas].sort(COMPARADORES[orden]);

  const hayFiltros = consulta.filtro !== "activas" || terminos.length > 0 || proyecto !== undefined;
  let vacio: VacioDeFlota | null = null;
  if (filas.length === 0) {
    vacio =
      panel.filas.length === 0
        ? { tipo: "sin-unidades", texto: TEXTO_FLOTA.sinUnidades }
        : {
            tipo: "por-filtro",
            conQuitarFiltros: hayFiltros,
            texto: textoSinCoincidencias({
              busqueda: terminos.length > 0 ? textoEco(consulta.busqueda) : null,
              proyecto: proyecto?.etiqueta ?? null,
              filtro: consulta.filtro === "activas" ? null : TEXTO_FLOTA.filtros[consulta.filtro],
            }),
          };
  }
  return {
    filtros,
    filas,
    mostradas: filas.length,
    total: delEstado.length,
    anuncio: textoMostrandoUnidades(filas.length, delEstado.length),
    vacio,
    hayFiltros,
  };
}
