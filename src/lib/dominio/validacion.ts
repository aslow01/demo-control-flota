// Validaciones de campos que usan los comandos (U7, T4, V11, K1). Funciones puras que devuelven `Resultado`.

import { diasEntre, formatearFecha, parsearFechaCivil, sumarAnios } from "./fechas.ts";
import { KM_MAXIMO } from "./kilometraje.ts";
import { fallo, ok, type FechaCivil, type Resultado } from "./tipos.ts";

export interface ReglaTexto {
  /** Nombre del campo en el formulario. */
  campo: string;
  /** Cómo se nombra en los mensajes, con artículo: "El motivo", "La descripción". */
  nombre: string;
  min: number;
  max: number;
  /** Mensaje cuando el campo queda vacío (después de recortar). */
  vacio: string;
  /** Mensaje cuando es más corto que `min` (por defecto, el genérico). */
  corto?: string;
}

/** U7: recorta los espacios de los extremos y controla el largo. Nunca interpreta el texto como HTML. */
export function validarTexto(valor: string, regla: ReglaTexto): Resultado<string> {
  const texto = valor.trim();
  if (texto.length === 0) {
    if (regla.min === 0) return ok("");
    return fallo(`${regla.campo}-vacio`, regla.vacio, { campo: regla.campo });
  }
  if (texto.length < regla.min) {
    return fallo(
      "texto-corto",
      regla.corto ?? `${regla.nombre} tiene que tener al menos ${regla.min} caracteres.`,
      { campo: regla.campo },
    );
  }
  if (texto.length > regla.max) {
    return fallo("texto-largo", `${regla.nombre} no puede superar ${regla.max} caracteres.`, { campo: regla.campo });
  }
  return ok(texto);
}

export const REGLAS = {
  motivoFueraDeServicio: {
    campo: "motivo",
    nombre: "El motivo",
    min: 5,
    max: 200,
    vacio: "Escriba el motivo (por ejemplo, «En taller: cambio de embrague»).",
  },
  motivoBaja: { campo: "motivo", nombre: "El motivo", min: 5, max: 200, vacio: "Escriba el motivo de la baja." },
  motivoKm: { campo: "motivo", nombre: "El motivo", min: 10, max: 200, vacio: "Escriba el motivo de la corrección." },
  novedad: { campo: "descripcion", nombre: "La descripción", min: 3, max: 500, vacio: "Escriba qué pasó." },
  resolucion: {
    campo: "texto",
    nombre: "El texto",
    min: 5,
    max: 500,
    vacio: "Cuente en pocas palabras qué se hizo (al menos 5 caracteres).",
    corto: "Cuente en pocas palabras qué se hizo (al menos 5 caracteres).",
  },
  numeroDocumento: { campo: "numero", nombre: "El número", min: 1, max: 40, vacio: "Escriba el número del documento." },
  emisor: { campo: "emisor", nombre: "El emisor", min: 0, max: 80, vacio: "" },
  marca: { campo: "marca", nombre: "La marca", min: 1, max: 40, vacio: "Escriba la marca." },
  modelo: { campo: "modelo", nombre: "El modelo", min: 1, max: 40, vacio: "Escriba el modelo." },
} satisfies Record<string, ReglaTexto>;

/** Texto de un ítem del parte mientras es borrador: se guarda como se escribió, solo se controla el tope (500). */
export function validarTextoDeBorrador(valor: string, campo: string): Resultado<string> {
  if (valor.length > REGLAS.novedad.max) {
    return fallo("texto-largo", `La descripción no puede superar ${REGLAS.novedad.max} caracteres.`, { campo });
  }
  return ok(valor);
}

export function validarEntero(valor: number, min: number, max: number, campo: string, codigo: string, mensaje: string): Resultado<number> {
  if (!Number.isInteger(valor) || valor < min || valor > max) return fallo(codigo, mensaje, { campo });
  return ok(valor);
}

/** Kilometraje ya convertido a número: entero de 0 a 2.000.000 (K1). */
export function validarKmNumero(valor: number, campo: string): Resultado<number> {
  return validarEntero(valor, 0, KM_MAXIMO, campo, "km-rango", "Escriba un kilometraje entero de 0 a 2.000.000.");
}

/** T4: fecha civil validada a mano. */
export function validarFecha(texto: string, campo: string): Resultado<FechaCivil> {
  const fecha = parsearFechaCivil(texto);
  if (fecha === null) return fallo("fecha-invalida", "Escriba una fecha válida.", { campo });
  return ok(fecha);
}

/** V11: vencimiento desde 2000-01-01 hasta hoy + 10 años. */
export function validarVencimiento(texto: string, hoy: FechaCivil, campo = "vence"): Resultado<FechaCivil> {
  const fecha = validarFecha(texto, campo);
  if (!fecha.ok) return fecha;
  const maxima = sumarAnios(hoy, 10);
  if (diasEntre(fecha.valor, maxima) < 0) {
    return fallo("vence-fuera-de-rango", `La fecha de vencimiento no puede ser posterior al ${formatearFecha(maxima)}.`, { campo });
  }
  return fecha;
}
