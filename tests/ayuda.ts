// Fábricas de datos ficticios para los tests (nada de esto se parece a datos reales).
import type {
  Conductor,
  Documento,
  Estado,
  Novedad,
  Parte,
  Proyecto,
  RespuestaItem,
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
    niveles: sin,
    matafuego: sin,
    botiquin: sin,
    documentacion: sin,
    cabina: sin,
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
    niveles: ok,
    matafuego: ok,
    botiquin: ok,
    documentacion: ok,
    cabina: ok,
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
    kmInicio: 1000,
    kmFin: 1100,
    combustible: "medio",
    litrosCargados: null,
    checklist: checklistEnOrden(),
    otraNovedad: null,
    advertenciasAceptadas: [],
    documentacionVencida: [],
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
      versionEsquema: 1,
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
