// Paso 4.3 (lógica): el diálogo «Agregar unidad» (docs/diseno-ui.md, 5.11, 5.15 y 5.17). Sin DOM: contexto, validación por campo con
// los validadores del dominio, comando y reparto de errores. Las reglas (U1 a U5) siguen probadas en comandos-unidades.test.ts.
import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import {
  CAMPOS_UNIDAD,
  comandoDeAgregarUnidad,
  contextoDeAgregarUnidad,
  erroresDeNegocioUnidad,
  errorGeneralUnidad,
  validarValoresUnidad,
  type ValoresUnidad,
} from "../src/lib/dominio/formulario-unidad.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, conductor, ejecutarError, ejecutarOk, flotaDePrueba, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const VALIDOS: ValoresUnidad = {
  patente: "ZK 999 AA",
  interno: "30",
  tipo: "camioneta",
  marca: "Toyota",
  modelo: "Hilux",
  anio: "2024",
  proyectoId: PROYECTO_PIEDRA.id,
  conductorId: "",
};
const VACIOS: ValoresUnidad = { patente: "", interno: "", tipo: "", marca: "", modelo: "", anio: "", proyectoId: "", conductorId: "" };

const e: Estado = flotaDePrueba();
const errores = (v: Partial<ValoresUnidad>, estado: Estado = e) => validarValoresUnidad({ ...VALIDOS, ...v }, estado, H);
const mensaje = (campo: keyof ValoresUnidad, v: Partial<ValoresUnidad>, estado: Estado = e) => errores(v, estado)?.porCampo[campo];

describe("contexto del diálogo", () => {
  const c = contextoDeAgregarUnidad(e, H);

  it("título y botón primario de 5.17; todos los campos empiezan vacíos (no hay nada que precargar)", () => {
    expect(c.titulo).toBe("Agregar unidad");
    expect(c.primario).toBe("Agregar unidad");
    expect(c.valoresIniciales).toEqual(VACIOS);
    expect(Object.keys(c.valoresIniciales)).toEqual([...CAMPOS_UNIDAD]);
  });

  it("los campos, en el orden de 5.17: patente, interno, tipo, marca, modelo, año, proyecto, conductor", () => {
    expect(CAMPOS_UNIDAD).toEqual(["patente", "interno", "tipo", "marca", "modelo", "anio", "proyectoId", "conductorId"]);
  });

  it("los tipos y los proyectos para los select", () => {
    expect(c.tipos).toEqual([
      { valor: "camioneta", etiqueta: "Camioneta" },
      { valor: "utilitario", etiqueta: "Utilitario" },
      { valor: "camion-liviano", etiqueta: "Camión liviano" },
      { valor: "minibus", etiqueta: "Minibús" },
    ]);
    expect(c.proyectos).toEqual([
      { valor: PROYECTO_PIEDRA.id, etiqueta: PROYECTO_PIEDRA.nombre },
      { valor: PROYECTO_BASE.id, etiqueta: PROYECTO_BASE.nombre },
    ]);
  });

  it("conductores: «Sin conductor asignado» primero (valor vacío) y los activos, con la unidad que ya tienen", () => {
    expect(c.conductores).toEqual([
      { valor: "", etiqueta: "Sin conductor asignado", asignadoA: null, licenciaVigente: true },
      { valor: "c1", etiqueta: "Luis Ferreyra", asignadoA: "ZK 214 BD", licenciaVigente: true },
      { valor: "c2", etiqueta: "Rosa Quiroga", asignadoA: "ZKB 482", licenciaVigente: true },
    ]);
    const mas: Estado = {
      ...e,
      conductores: [...e.conductores, conductor({ id: "c3", nombre: "Inés Paz", legajo: "L-3", activo: false }), conductor({ id: "c4", nombre: "Hugo Luna", legajo: "L-4" })],
      unidades: [...e.unidades, unidad({ id: "u9", patente: "ZAA001", interno: 99, conductorId: "c4", estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } })],
    };
    const otros = contextoDeAgregarUnidad(mas, H).conductores;
    expect(otros.map((x) => x.valor)).toEqual(["", "c1", "c2", "c4"]); // el inactivo no se ofrece
    expect(otros.find((x) => x.valor === "c4")?.asignadoA).toBeNull(); // una unidad de baja no cuenta
  });

  it("los años permitidos (U4) para la ayuda del campo: de 1980 al año que viene", () => {
    expect(c.anios).toEqual({ minimo: 1980, maximo: 2027 });
  });
});

describe("validación por campo (todo junto, en el orden del formulario)", () => {
  it("valores correctos: sin errores (también con conductor y con espacios de más)", () => {
    expect(errores({})).toBeNull();
    expect(errores({ conductorId: "c1", patente: "  zk-999-aa ", interno: " 030 ", marca: "  Toyota ", anio: " 2024 " })).toBeNull();
  });

  it("todo vacío: un error por campo obligatorio (el conductor no lo es), con mensajes propios", () => {
    const r = validarValoresUnidad(VACIOS, e, H);
    expect(r?.lista).toEqual([
      { campo: "patente", mensaje: "Escriba la patente." },
      { campo: "interno", mensaje: "Escriba el número interno." },
      { campo: "tipo", mensaje: "Elija el tipo de unidad." },
      { campo: "marca", mensaje: "Escriba la marca." },
      { campo: "modelo", mensaje: "Escriba el modelo." },
      { campo: "anio", mensaje: "Escriba el año." },
      { campo: "proyectoId", mensaje: "Elija el proyecto." },
    ]);
    expect(r?.general).toBeNull();
    expect(r?.porCampo.patente).toBe("Escriba la patente.");
  });

  it("U1: el formato de la patente (con el mensaje del dominio)", () => {
    expect(mensaje("patente", { patente: "A123BCD" })).toBe("La patente tiene que tener el formato AA 123 BB o ABC 123.");
    expect(mensaje("patente", { patente: "x".repeat(100_000) })).toBe("La patente tiene que tener el formato AA 123 BB o ABC 123.");
    expect(errores({ patente: "zkb-482" })?.porCampo.patente).toMatch(/^Ya existe una unidad/); // formato válido
  });

  it("U2: patente repetida, sin importar mayúsculas, espacios ni guiones; las de baja también cuentan", () => {
    expect(mensaje("patente", { patente: "zk 214 bd" })).toBe("Ya existe una unidad con la patente ZK 214 BD (Int. 07).");
    const conBaja: Estado = { ...e, unidades: [...e.unidades, unidad({ id: "u3", patente: "ZAA001", interno: 50, estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } })] };
    expect(mensaje("patente", { patente: "ZAA001" }, conBaja)).toBe("Ya existe una unidad con la patente ZAA 001 (Int. 50).");
  });

  it("U3: el interno, entero de 1 a 999, y sin repetir entre las que no están de baja", () => {
    for (const interno of ["abc", "0", "1000", "7.5", "-3", "1e2", "٣", "99999999999999999999"]) {
      expect(mensaje("interno", { interno }), interno).toBe("El número interno tiene que ser un entero de 1 a 999.");
    }
    expect(mensaje("interno", { interno: " 07 " })).toBe("Ya existe una unidad con el número interno 7 (ZK 214 BD).");
    const conBaja: Estado = { ...e, unidades: [...e.unidades, unidad({ id: "u3", patente: "ZAA001", interno: 50, estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } })] };
    expect(errores({ interno: "50" }, conBaja)).toBeNull();
  });

  it("U4: el año, entero de 1980 a hoy + 1", () => {
    expect(mensaje("anio", { anio: "2028" })).toBe("El año tiene que estar entre 1980 y 2027.");
    expect(mensaje("anio", { anio: "1979" })).toBe("El año tiene que estar entre 1980 y 2027.");
    expect(mensaje("anio", { anio: "20.5" })).toBe("El año tiene que estar entre 1980 y 2027.");
    expect(mensaje("anio", { anio: "dos mil" })).toBe("El año tiene que estar entre 1980 y 2027.");
    expect(errores({ anio: "2027" })).toBeNull();
    expect(errores({ anio: "1980" })).toBeNull();
  });

  it("U7: marca y modelo se recortan y tienen tope (40)", () => {
    expect(mensaje("marca", { marca: "x".repeat(41) })).toBe("La marca no puede superar 40 caracteres.");
    expect(mensaje("modelo", { modelo: "   " })).toBe("Escriba el modelo.");
    expect(errores({ marca: "x".repeat(40) })).toBeNull();
    expect(errores({ modelo: "<b>x</b>" })).toBeNull(); // se guarda y se muestra como texto
  });

  it("tipo: solo los cuatro conocidos", () => {
    expect(mensaje("tipo", { tipo: "tractor" })).toBe("Elija el tipo de unidad.");
    expect(mensaje("tipo", { tipo: "__proto__" })).toBe("Elija el tipo de unidad.");
  });

  it("varios errores a la vez: la lista sale en el orden del formulario aunque se rompan al revés", () => {
    const r = errores({ anio: "1900", interno: "0", patente: "ZZ" });
    expect(r?.lista.map((x) => x.campo)).toEqual(["patente", "interno", "anio"]);
  });

  it("no cambia los valores que recibe", () => {
    const v = { ...VALIDOS, patente: "  zk 999 aa " };
    const copia = { ...v };
    validarValoresUnidad(v, e, H);
    comandoDeAgregarUnidad(v);
    expect(v).toEqual(copia);
  });
});

describe("el comando", () => {
  it("convierte el texto del formulario: interno y año a número, conductor vacío a «sin conductor»", () => {
    expect(comandoDeAgregarUnidad(VALIDOS)).toEqual({
      tipo: "altaUnidad",
      patente: "ZK 999 AA",
      interno: 30,
      marca: "Toyota",
      modelo: "Hilux",
      anio: 2024,
      tipoUnidad: "camioneta",
      proyectoId: PROYECTO_PIEDRA.id,
      conductorId: null,
    });
    expect(comandoDeAgregarUnidad({ ...VALIDOS, conductorId: "c2", interno: " 07 " })).toMatchObject({ conductorId: "c2", interno: 7 });
  });

  it("U5: lo que se valida bien se ejecuta, y la unidad nace en servicio y sin documentos (4 faltantes en Piedra Lunar, 3 en la base)", () => {
    for (const [proyectoId, faltantes] of [[PROYECTO_PIEDRA.id, 4], [PROYECTO_BASE.id, 3]] as const) {
      const r = ejecutarOk(e, comandoDeAgregarUnidad({ ...VALIDOS, proyectoId }));
      const nueva = r.estado.unidades.at(-1);
      expect(nueva).toMatchObject({ patente: "ZK999AA", interno: 30, estado: { tipo: "en-servicio" }, proyectoId });
      const f = calcularAlertas(r.estado, H).alertas.filter((a) => a.unidadId === nueva?.id && a.tipo === "documento-faltante");
      expect(f).toHaveLength(faltantes);
    }
  });

  it("valores rotos que se saltan la validación previa los rechaza el dominio igual (sin excepción)", () => {
    expect(ejecutarError(e, comandoDeAgregarUnidad({ ...VALIDOS, tipo: "tractor" })).campo).toBe("tipoUnidad");
    expect(ejecutarError(e, comandoDeAgregarUnidad({ ...VALIDOS, interno: "abc" })).campo).toBe("interno");
    expect(ejecutarError(e, comandoDeAgregarUnidad({ ...VALIDOS, anio: "" })).campo).toBe("anio");
  });
});

describe("errores de negocio repartidos para el formulario", () => {
  it("el campo del dominio pasa al campo del formulario (tipoUnidad → tipo)", () => {
    const r = erroresDeNegocioUnidad(ejecutarError(e, comandoDeAgregarUnidad({ ...VALIDOS, proyectoId: "no-existe" })));
    expect(r).toEqual({
      porCampo: { proyectoId: "No se encontró el proyecto. Vuelva a la lista e intente de nuevo." },
      lista: [{ campo: "proyectoId", mensaje: "No se encontró el proyecto. Vuelva a la lista e intente de nuevo." }],
      general: null,
    });
    expect(erroresDeNegocioUnidad(ejecutarError(e, comandoDeAgregarUnidad({ ...VALIDOS, conductorId: "no-existe" }))).porCampo.conductorId).toBe(
      "No se encontró el conductor. Vuelva a la lista e intente de nuevo.",
    );
    expect(erroresDeNegocioUnidad({ codigo: "tipo-unidad-invalido", mensaje: "Elija el tipo de unidad.", campo: "tipoUnidad" }).porCampo.tipo).toBe("Elija el tipo de unidad.");
  });

  it("un error sin campo del formulario es general; el general de verdad también", () => {
    expect(erroresDeNegocioUnidad({ codigo: "escritura-fallida", mensaje: "No se pudo guardar." })).toEqual({ porCampo: {}, lista: [], general: "No se pudo guardar." });
    expect(erroresDeNegocioUnidad({ codigo: "x", mensaje: "Algo.", campo: "otraCosa" })).toEqual({ porCampo: {}, lista: [], general: "Algo." });
    expect(erroresDeNegocioUnidad({ codigo: "x", mensaje: "Algo.", campo: "__proto__" }).general).toBe("Algo.");
    expect(errorGeneralUnidad("Sin permiso.")).toEqual({ porCampo: {}, lista: [], general: "Sin permiso." });
  });
});
