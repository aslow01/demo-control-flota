// Repositorio en memoria: para los tests y para el modo sin IndexedDB (D8). Guarda copias, nunca referencias,
// y aplica las escrituras sobre una copia de trabajo que solo se confirma si todo sale bien (P12).

import type { Cambios } from "../dominio/estado.ts";
import type { Estado, Evento } from "../dominio/tipos.ts";
import { ErrorDeRepositorio, type Repositorio } from "./repositorio.ts";

interface OpcionesMemoria {
  /** Para probar fallas (P12, D10): `"eventos"` hace fallar la escritura justo al guardar los eventos. */
  falla?: "eventos" | null;
}

function reemplazarOAgregar<T extends { id: string }>(lista: T[], nuevos: readonly T[]): T[] {
  const resultado = [...lista];
  for (const n of nuevos) {
    const i = resultado.findIndex((x) => x.id === n.id);
    if (i >= 0) resultado[i] = n;
    else resultado.push(n);
  }
  return resultado;
}

export class RepositorioMemoria implements Repositorio {
  falla: "eventos" | null;
  private guardado: Estado | null = null;

  constructor(opciones: OpcionesMemoria = {}) {
    this.falla = opciones.falla ?? null;
  }

  async cargar(): Promise<Estado | null> {
    return this.guardado === null ? null : structuredClone(this.guardado);
  }

  async reemplazarTodo(estado: Estado): Promise<void> {
    this.guardado = structuredClone(estado);
  }

  async vaciar(): Promise<void> {
    this.guardado = null;
  }

  async escribir(cambios: Cambios, eventos: readonly Evento[]): Promise<void> {
    // Copia de trabajo: si algo falla, `this.guardado` queda intacto.
    if (this.guardado === null) {
      throw new ErrorDeRepositorio("escritura-fallida", "La base está vacía: primero hay que cargar los datos (reemplazarTodo).");
    }
    const base: Estado = structuredClone(this.guardado);
    const nuevo = structuredClone({ cambios, eventos });

    const borrados = new Set(nuevo.cambios.partesBorrados);
    const siguiente: Estado = {
      ...base,
      meta: nuevo.cambios.meta ?? base.meta,
      unidades: reemplazarOAgregar(base.unidades, nuevo.cambios.unidades),
      documentos: reemplazarOAgregar(base.documentos, nuevo.cambios.documentos),
      partes: reemplazarOAgregar(base.partes.filter((p) => !borrados.has(p.id)), nuevo.cambios.partes),
      novedades: reemplazarOAgregar(base.novedades, nuevo.cambios.novedades),
      correccionesKm: reemplazarOAgregar(base.correccionesKm, nuevo.cambios.correccionesKm),
      eventos: [...base.eventos],
    };

    // Índices únicos: patente, y [unidadId, fecha] en los partes (P1).
    const patentes = new Set<string>();
    for (const u of siguiente.unidades) {
      if (patentes.has(u.patente)) throw new ErrorDeRepositorio("indice-unico", `Ya existe una unidad con la patente ${u.patente}.`);
      patentes.add(u.patente);
    }
    const claves = new Set<string>();
    for (const p of siguiente.partes) {
      const clave = `${p.unidadId}|${p.fecha}`;
      if (claves.has(clave)) {
        throw new ErrorDeRepositorio("indice-unico", `Ya hay un parte de la unidad ${p.unidadId} para el ${p.fecha}.`);
      }
      claves.add(clave);
    }

    // Eventos: solo se agregan; un id repetido nunca pisa a otro (H2).
    const ids = new Set(siguiente.eventos.map((e) => e.id));
    for (const e of nuevo.eventos) {
      if (ids.has(e.id)) throw new ErrorDeRepositorio("evento-repetido", `El evento ${e.id} ya existe: el historial no se modifica.`);
      ids.add(e.id);
      siguiente.eventos.push(e);
    }
    if (this.falla === "eventos") {
      throw new ErrorDeRepositorio("escritura-fallida", "No se pudo escribir en el almacenamiento. No se aplicó ningún cambio.");
    }

    this.guardado = siguiente;
  }
}
