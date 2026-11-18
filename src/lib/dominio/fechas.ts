// Fechas civiles e instantes (T1 a T7). Sin métodos locales de Date: todo es UTC o Intl con zona explícita.

import type { FechaCivil, Instante } from "./tipos.ts";

const ZONA = "America/Argentina/Buenos_Aires";
const MS_POR_DIA = 86_400_000;
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

const formatoFechaAR = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

function partesEnArgentina(ms: number): { anio: string; mes: string; dia: string; hora: string; minuto: string } {
  if (!Number.isFinite(ms)) throw new Error("Instante inválido");
  const partes: Record<string, string> = {};
  for (const p of formatoFechaAR.formatToParts(ms)) partes[p.type] = p.value;
  return {
    anio: partes["year"] ?? "",
    mes: partes["month"] ?? "",
    dia: partes["day"] ?? "",
    hora: partes["hour"] ?? "",
    minuto: partes["minute"] ?? "",
  };
}

/** T1: la fecha civil de Argentina para un instante dado por un reloj inyectado. */
export function hoyEnArgentina(ahora: Date): FechaCivil {
  const p = partesEnArgentina(ahora.getTime());
  return `${p.anio}-${p.mes}-${p.dia}`;
}

/** T1: igual que `hoyEnArgentina`, para un instante guardado como texto ISO. */
export function fechaEnArgentina(instante: Instante): FechaCivil {
  const p = partesEnArgentina(Date.parse(instante));
  return `${p.anio}-${p.mes}-${p.dia}`;
}

function bisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

function diasDelMes(anio: number, mes: number): number {
  if (mes === 2) return bisiesto(anio) ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

interface Partes {
  anio: number;
  mes: number;
  dia: number;
}

function dosDigitos(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function armar(anio: number, mes: number, dia: number): FechaCivil {
  return `${String(anio).padStart(4, "0")}-${dosDigitos(mes)}-${dosDigitos(dia)}`;
}

/** T4: valida a mano `AAAA-MM-DD` (año 2000 a 2100). Devuelve la misma fecha o `null`. Nunca interpreta el texto con el constructor de Date (corre un día). */
export function parsearFechaCivil(texto: string): FechaCivil | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (m === null) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (anio < 2000 || anio > 2100) return null;
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > diasDelMes(anio, mes)) return null;
  return texto;
}

/** Las partes de una fecha ya validada. */
function partesDe(fecha: FechaCivil): Partes {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (m === null) throw new Error(`Fecha civil inválida: ${fecha}`);
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

function diasDesdeEpoca(fecha: FechaCivil): number {
  const { anio, mes, dia } = partesDe(fecha);
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
}

/** Inversa de `diasDesdeEpoca` (algoritmo de calendario civil, sin Date). */
function fechaDesdeDias(dias: number): FechaCivil {
  const z = dias + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const dia = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  return armar(mes <= 2 ? y + 1 : y, mes, dia);
}

/** T5: días de calendario de `a` a `b`, con signo. */
export function diasEntre(a: FechaCivil, b: FechaCivil): number {
  return diasDesdeEpoca(b) - diasDesdeEpoca(a);
}

export function sumarDias(fecha: FechaCivil, dias: number): FechaCivil {
  return fechaDesdeDias(diasDesdeEpoca(fecha) + dias);
}

/** T7: suma años; el 29/02 pasa a 28/02 en los años que no son bisiestos. */
export function sumarAnios(fecha: FechaCivil, anios: number): FechaCivil {
  const { anio, mes, dia } = partesDe(fecha);
  const destino = anio + anios;
  return armar(destino, mes, Math.min(dia, diasDelMes(destino, mes)));
}

export function diaDeLaSemana(fecha: FechaCivil): (typeof DIAS_SEMANA)[number] {
  // 1970-01-01 fue jueves (4).
  const indice = (((diasDesdeEpoca(fecha) + 4) % 7) + 7) % 7;
  return DIAS_SEMANA[indice] as (typeof DIAS_SEMANA)[number];
}

/** T6: `18/11/2026`. */
export function formatearFecha(fecha: FechaCivil): string {
  const { anio, mes, dia } = partesDe(fecha);
  return `${dosDigitos(dia)}/${dosDigitos(mes)}/${anio}`;
}

/** T6: `miércoles 18/11/2026`. */
export function formatearFechaConDia(fecha: FechaCivil): string {
  return `${diaDeLaSemana(fecha)} ${formatearFecha(fecha)}`;
}

/** T6: `18/11/2026 14:32`, en hora de Argentina. */
export function formatearInstante(instante: Instante): string {
  const p = partesEnArgentina(Date.parse(instante));
  return `${p.dia}/${p.mes}/${p.anio} ${p.hora}:${p.minuto}`;
}
