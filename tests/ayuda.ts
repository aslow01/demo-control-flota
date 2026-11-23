// Fábricas de datos ficticios para los tests (nada de esto se parece a datos reales).
import { VERSION_ESQUEMA } from "../src/lib/datos/generador.ts";
import { ejecutar, type Comando, type Contexto } from "../src/lib/dominio/comandos.ts";
import type {
  Conductor,
  Documento,
  Estado,
  Novedad,
  Parte,
  Proyecto,
  RespuestaItem,
  TipoDocumento,
  Unidad,
} from "../src/lib/dominio/tipos.ts";

export const PROYECTO_PIEDRA: Proyecto = { id: "p-piedra", nombre: "Proyecto Piedra Lunar", requiereHabilitacion: true };
export const PROYECTO_BASE: Proyecto = { id: "p-base", nombre: "Base de mantenimiento", requiereHabilitacion: false };

export function unidad(parcial: Partial<Unidad> = {}): Unidad {
  return {
    id: "u1",
    patente: "ZK214BD",
    interno: 7,
    marca: "Marca",
    modelo: "Modelo",
    anio: 2020,
    tipo: "camioneta",
    proyectoId: PROYECTO_PIEDRA.id,
    conductorId: null,
    estado: { tipo: "en-servicio" },
    creada: "2026-01-02T12:00:00.000Z",
    ...parcial,
  };
}

export function conductor(parcial: Partial<Conductor> = {}): Conductor {
  return { id: "c1", nombre: "Luis Ferreyra", legajo: "L-0101", activo: true, ...parcial };
}

let contadorDoc = 0;
export function documento(parcial: Partial<Documento> = {}): Documento {
  contadorDoc += 1;
  return {
    id: `d${contadorDoc}`,
    titular: { tipo: "unidad", id: "u1" },
    tipo: "seguro",
    numero: "DEMO-1",
    emisor: "Aseguradora del Sur Demo",
    vence: "2027-06-30",
    emitido: null,
    cargado: "2026-01-02T12:00:00.000Z",
    reemplazaA: null,
    ...parcial,
  };
}

export function novedad(parcial: Partial<Novedad> = {}): Novedad {
  return {
    id: "n1",
    unidadId: "u1",
    origen: { tipo: "manual" },
    descripcion: "Ruido al frenar",
    gravedad: "normal",
    fecha: "2026-11-10",
    estado: "abierta",
    resolucion: null,
    ...parcial,
  };
}

export function checklistVacio(): Parte["checklist"] {
  const sin: RespuestaItem = { estado: "sin-responder" };
  return {
    frenos: sin,
    direccion: sin,
    neumaticos: sin,
    luces: sin,
    cinturones: sin,
    perticaBaliza: sin,
    alarmaRetroceso: sin,
    niveles: sin,
    matafuego: sin,
    botiquin: sin,
    documentacion: sin,
    cabina: sin,
    calzasAntiderrame: sin,
    radio: sin,
  };
}

export function checklistEnOrden(): Parte["checklist"] {
  const ok: RespuestaItem = { estado: "en-orden" };
  return {
    frenos: ok,
    direccion: ok,
    neumaticos: ok,
    luces: ok,
    cinturones: ok,
    perticaBaliza: ok,
    alarmaRetroceso: ok,
    niveles: ok,
    matafuego: ok,
    botiquin: ok,
    documentacion: ok,
    cabina: ok,
    calzasAntiderrame: ok,
    radio: ok,
  };
}

let contadorParte = 0;
export function parte(parcial: Partial<Parte> = {}): Parte {
  contadorParte += 1;
  return {
    id: `pt${contadorParte}`,
    unidadId: "u1",
    fecha: "2026-11-18",
    conductorId: "c1",
    estado: "enviado",
    revisado: "2026-11-18T09:00:00.000Z",
    sinSalida: false,
    kmInicio: 1000,
    kmFin: 1100,
    combustible: "medio",
    litrosCargados: null,
    checklist: checklistEnOrden(),
    otraNovedad: null,
    advertenciasAceptadas: [],
    creado: "2026-11-18T12:00:00.000Z",
    actualizado: "2026-11-18T12:00:00.000Z",
    enviado: "2026-11-18T18:00:00.000Z",
    autor: "Luis Ferreyra",
    ...parcial,
  };
}

export function estadoVacio(parcial: Partial<Estado> = {}): Estado {
  return {
    meta: {
      versionEsquema: VERSION_ESQUEMA,
      semilla: 1,
      fechaBase: "2026-11-18",
      modificada: false,
      perfil: { tipo: "encargado" },
    },
    proyectos: [PROYECTO_PIEDRA, PROYECTO_BASE],
    conductores: [],
    unidades: [],
    documentos: [],
    partes: [],
    novedades: [],
    correccionesKm: [],
    eventos: [],
    ...parcial,
  };
}

// ---- Para los tests de comandos ----------------------------------------------------------------

// Un solo contador para todos los contextos de un archivo de tests: dos llamadas a contexto() no repiten ids.
let contadorDeIds = 0;

export function contexto(parcial: Partial<Contexto> = {}): Contexto {
  return {
    hoy: "2026-11-18",
    ahora: "2026-11-18T15:00:00.000Z",
    autor: "Rocío Medina",
    nuevoId: () => `id${++contadorDeIds}`,
    ...parcial,
  };
}

/**
 * Flota chica y sana para probar comandos: dos conductores, la unidad u1 (ZK 214 BD, Piedra Lunar, conductor c1)
 * y la u2 (ZKB 482, Base de mantenimiento), todas con sus documentos al día y un parte enviado ayer cada una.
 */
export function flotaDePrueba(): Estado {
  const docsDe = (id: string, conHabilitacion: boolean): Documento[] => {
    const tipos: TipoDocumento[] = ["seguro", "revision-tecnica", "matafuego"];
    if (conHabilitacion) tipos.push("habilitacion-proyecto");
    return tipos.map((tipo) =>
      documento({
        id: `${id}-${tipo}`,
        titular: { tipo: "unidad", id },
        tipo,
        numero: `DEMO-${id}-${tipo}`,
        vence: "2027-06-30",
      }),
    );
  };
  const licencia = (c: string): Documento =>
    documento({ id: `${c}-licencia`, titular: { tipo: "conductor", id: c }, tipo: "licencia", vence: "2027-06-30" });
  return estadoVacio({
    conductores: [conductor({ id: "c1", nombre: "Luis Ferreyra" }), conductor({ id: "c2", nombre: "Rosa Quiroga", legajo: "L-0102" })],
    unidades: [
      unidad({ id: "u1", patente: "ZK214BD", interno: 7, conductorId: "c1" }),
      unidad({ id: "u2", patente: "ZKB482", interno: 8, proyectoId: PROYECTO_BASE.id, conductorId: "c2" }),
    ],
    documentos: [...docsDe("u1", true), ...docsDe("u2", false), licencia("c1"), licencia("c2")],
    partes: [
      parte({ id: "p-u1-ayer", unidadId: "u1", fecha: "2026-11-17", kmInicio: 84000, kmFin: 84320, enviado: "2026-11-17T18:00:00.000Z" }),
      parte({ id: "p-u2-ayer", unidadId: "u2", fecha: "2026-11-17", kmInicio: 5000, kmFin: 5100, enviado: "2026-11-17T18:00:00.000Z", conductorId: "c2" }),
    ],
  });
}

/** Ejecuta un comando que tiene que salir bien (o hace fallar el test con el mensaje de negocio). */
export function ejecutarOk(estado: Estado, comando: Comando, ctx: Contexto = contexto()) {
  const r = ejecutar(estado, comando, ctx);
  if (!r.ok) throw new Error(`El comando ${comando.tipo} falló: ${r.error.codigo} — ${r.error.mensaje}`);
  return r.valor;
}

/** Ejecuta un comando que tiene que ser rechazado y devuelve el error. */
export function ejecutarError(estado: Estado, comando: Comando, ctx: Contexto = contexto()) {
  const r = ejecutar(estado, comando, ctx);
  if (r.ok) throw new Error(`El comando ${comando.tipo} se aceptó y tenía que fallar`);
  return r.error;
}
