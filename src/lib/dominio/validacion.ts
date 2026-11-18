// Validaciones de campos que usan los comandos (U7, T4, V11, K1). Funciones puras que devuelven `Resultado`.

import { diasEntre, parsearFechaCivil, sumarAnios } from "./fechas.ts";
import { KM_MAXIMO } from "./kilometraje.ts";
import { ERRORES, TEXTOS_DE_CAMPO, errTextoCorto, errTextoLargo, errVenceFueraDeRango } from "./textos.ts";
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
      regla.corto ?? errTextoCorto(regla.nombre, regla.min),
      { campo: regla.campo },
    );
  }
  if (texto.length > regla.max) {
    return fallo("texto-largo", errTextoLargo(regla.nombre, regla.max), { campo: regla.campo });
  }
  return ok(texto);
}

/** Límites de cada campo de texto; los mensajes están en `TEXTOS_DE_CAMPO` (textos.ts). */
export const REGLAS = {
  motivoFueraDeServicio: { campo: "motivo", min: 5, max: 200, ...TEXTOS_DE_CAMPO.motivoFueraDeServicio },
  motivoBaja: { campo: "motivo", min: 5, max: 200, ...TEXTOS_DE_CAMPO.motivoBaja },
  motivoKm: { campo: "motivo", min: 10, max: 200, ...TEXTOS_DE_CAMPO.motivoKm },
  novedad: { campo: "descripcion", min: 3, max: 500, ...TEXTOS_DE_CAMPO.novedad },
  resolucion: { campo: "texto", min: 5, max: 500, ...TEXTOS_DE_CAMPO.resolucion },
  numeroDocumento: { campo: "numero", min: 1, max: 40, ...TEXTOS_DE_CAMPO.numeroDocumento },
  emisor: { campo: "emisor", min: 0, max: 80, ...TEXTOS_DE_CAMPO.emisor },
  marca: { campo: "marca", min: 1, max: 40, ...TEXTOS_DE_CAMPO.marca },
  modelo: { campo: "modelo", min: 1, max: 40, ...TEXTOS_DE_CAMPO.modelo },
} satisfies Record<string, ReglaTexto>;

/** Texto de un ítem del parte mientras es borrador: se guarda como se escribió, solo se controla el tope (500). */
export function validarTextoDeBorrador(valor: string, campo: string): Resultado<string> {
  if (valor.length > REGLAS.novedad.max) {
    return fallo("texto-largo", errTextoLargo(REGLAS.novedad.nombre, REGLAS.novedad.max), { campo });
  }
  return ok(valor);
}

export function validarEntero(valor: number, min: number, max: number, campo: string, codigo: string, mensaje: string): Resultado<number> {
  if (!Number.isInteger(valor) || valor < min || valor > max) return fallo(codigo, mensaje, { campo });
  return ok(valor);
}

/** Kilometraje ya convertido a número: entero de 0 a 2.000.000 (K1). */
export function validarKmNumero(valor: number, campo: string): Resultado<number> {
  return validarEntero(valor, 0, KM_MAXIMO, campo, "km-rango", ERRORES.kmRango);
}

/** T4: fecha civil validada a mano. */
export function validarFecha(texto: string, campo: string): Resultado<FechaCivil> {
  const fecha = parsearFechaCivil(texto);
  if (fecha === null) return fallo("fecha-invalida", ERRORES.fechaInvalida, { campo });
  return ok(fecha);
}

/** V11: vencimiento desde 2000-01-01 hasta hoy + 10 años. */
export function validarVencimiento(texto: string, hoy: FechaCivil, campo = "vence"): Resultado<FechaCivil> {
  const fecha = validarFecha(texto, campo);
  if (!fecha.ok) return fecha;
  const maxima = sumarAnios(hoy, 10);
  if (diasEntre(fecha.valor, maxima) < 0) {
    return fallo("vence-fuera-de-rango", errVenceFueraDeRango(maxima), { campo });
  }
  return fecha;
}
