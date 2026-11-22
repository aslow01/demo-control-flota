// Paso 4.4 (lógica): diálogos de la unidad: fuera de servicio, volver a servicio, dar de baja, corregir kilometraje y cambiar proyecto o
// conductor (docs/diseno-ui.md, 5.11, 5.15 y 5.17; reglas A4 a A7, K5, U6).
import { describe, expect, it } from "vitest";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import {
  CAMPOS_ASIGNACION,
  CAMPOS_BAJA,
  CAMPOS_FUERA_DE_SERVICIO,
  CAMPOS_KILOMETRAJE,
  avisoDeAsignacion,
  comandoDeAsignacion,
  comandoDeBaja,
  comandoDeFueraDeServicio,
  comandoDeKilometraje,
  comandoDeVolverAServicio,
  contextoDeAsignacion,
  contextoDeBaja,
  contextoDeFueraDeServicio,
  contextoDeKilometraje,
  contextoDeVolverAServicio,
  erroresDeNegocioKilometraje,
  validarAsignacion,
  validarBaja,
  validarFueraDeServicio,
  validarKilometraje,
} from "../src/lib/dominio/formulario-ficha.ts";
import type { Estado, Novedad } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, contexto, conductor, flotaDePrueba, novedad } from "./ayuda.ts";

const H = "2026-11-18";

function conUnidad(e: Estado, id: string, estado: Estado["unidades"][number]["estado"]): Estado {
  return { ...e, unidades: e.unidades.map((u) => (u.id === id ? { ...u, estado } : u)) };
}

const frenos: Novedad = novedad({
  id: "n1",
  unidadId: "u1",
  gravedad: "critica",
  fecha: "2026-11-16",
  origen: { tipo: "parte", parteId: "p-frenos", item: "frenos" },
});

function fueraPorFrenos(): Estado {
  return {
    ...conUnidad(flotaDePrueba(), "u1", { tipo: "fuera-de-servicio", desde: "2026-11-16", motivo: "Novedad crítica en Frenos, parte del 16/11/2026", origen: "novedad-critica", novedadIds: ["n1"] }),
    novedades: [frenos],
  };
}

const BAJA = { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" };

describe("«Poner fuera de servicio» (A6)", () => {
  it("contexto: título, «desde hoy» como texto y motivo vacío; null si la unidad no existe, ya está fuera o está de baja", () => {
    const e = flotaDePrueba();
    expect(contextoDeFueraDeServicio(e, "u1", H)).toEqual({
      unidadId: "u1",
      titulo: "Poner fuera de servicio: ZK 214 BD",
      desde: "Desde hoy (18/11/2026).",
      valoresIniciales: { motivo: "" },
      primario: "Poner fuera de servicio",
    });
    expect(contextoDeFueraDeServicio(e, "zzz", H)).toBeNull();
    expect(contextoDeFueraDeServicio(fueraPorFrenos(), "u1", H)).toBeNull();
    expect(contextoDeFueraDeServicio(conUnidad(e, "u1", BAJA), "u1", H)).toBeNull();
  });

  it("validación con los textos del dominio (5 a 200) y comando", () => {
    expect(CAMPOS_FUERA_DE_SERVICIO).toEqual(["motivo"]);
    expect(validarFueraDeServicio({ motivo: "" })?.porCampo.motivo).toBe("Escriba el motivo (por ejemplo, «En taller: cambio de embrague»).");
    expect(validarFueraDeServicio({ motivo: "abc" })?.porCampo.motivo).toBe("El motivo tiene que tener al menos 5 caracteres.");
    expect(validarFueraDeServicio({ motivo: "x".repeat(201) })?.porCampo.motivo).toBe("El motivo no puede superar 200 caracteres.");
    expect(validarFueraDeServicio({ motivo: "En taller: cambio de embrague" })).toBeNull();
    const r = ejecutar(flotaDePrueba(), comandoDeFueraDeServicio("u1", { motivo: "En taller: cambio de embrague" }), contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["fuera-de-servicio"]);
  });
});

describe("«Volver a servicio» (A4, A5)", () => {
  it("A4: con una crítica abierta no hay botón primario; el diálogo lista las novedades y ofrece «Ver novedades»", () => {
    const c = contextoDeVolverAServicio(fueraPorFrenos(), "u1", H);
    expect(c).toEqual({
      unidadId: "u1",
      titulo: "Volver a servicio: ZK 214 BD",
      situacion: "Fuera de servicio desde el 16/11/2026: novedad crítica en Frenos, parte del 16/11/2026",
      bloqueo: {
        texto: "Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).",
        novedades: [{ novedadId: "n1", rotulo: "Frenos", origen: "parte del 16/11/2026", texto: "Frenos (parte del 16/11/2026)" }],
        verNovedades: "Ver novedades",
      },
      aviso: null,
      primario: null,
    });
  });

  it("el texto del bloqueo es el mismo que da el comando al intentarlo (una sola fuente)", () => {
    const e = fueraPorFrenos();
    const r = ejecutar(e, comandoDeVolverAServicio("u1"), contexto());
    expect(!r.ok && r.error.mensaje).toBe(contextoDeVolverAServicio(e, "u1", H)?.bloqueo?.texto);
  });

  it("sin críticas abiertas: hay primario y no hay bloqueo", () => {
    const e = { ...fueraPorFrenos(), novedades: [{ ...frenos, estado: "resuelta" as const }] };
    expect(contextoDeVolverAServicio(e, "u1", H)).toMatchObject({ bloqueo: null, aviso: null, primario: "Volver a servicio" });
  });

  it("A5: con documentos vencidos o faltantes se permite, y avisa que seguirá sin poder salir", () => {
    const base = { ...fueraPorFrenos(), novedades: [] };
    const vencido = { ...base, documentos: base.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d)) };
    expect(contextoDeVolverAServicio(vencido, "u1", H)?.aviso).toBe("La unidad vuelve a servicio, pero no puede salir hasta renovar: Seguro.");
    const faltante = { ...base, documentos: base.documentos.filter((d) => d.id !== "u1-habilitacion-proyecto") };
    expect(contextoDeVolverAServicio(faltante, "u1", H)?.aviso).toBe("La unidad vuelve a servicio, pero no puede salir hasta cargar: Habilitación de ingreso al proyecto.");
    const ambos = { ...vencido, documentos: vencido.documentos.filter((d) => d.id !== "u1-habilitacion-proyecto") };
    expect(contextoDeVolverAServicio(ambos, "u1", H)?.aviso).toBe(
      "La unidad vuelve a servicio, pero no puede salir hasta renovar o cargar: Seguro, Habilitación de ingreso al proyecto.",
    );
  });

  it("null si la unidad no existe, ya está en servicio o está de baja", () => {
    const e = flotaDePrueba();
    expect(contextoDeVolverAServicio(e, "u1", H)).toBeNull();
    expect(contextoDeVolverAServicio(e, "zzz", H)).toBeNull();
    expect(contextoDeVolverAServicio(conUnidad(e, "u1", BAJA), "u1", H)).toBeNull();
  });
});

describe("«Dar de baja» (A7)", () => {
  it("contexto: aviso de que no se deshace, primario con la patente; null si ya está de baja", () => {
    const e = flotaDePrueba();
    expect(contextoDeBaja(e, "u1")).toEqual({
      unidadId: "u1",
      titulo: "Dar de baja: ZK 214 BD",
      aviso: "No se puede deshacer en esta demo. La unidad deja de contar en la flota y en las alertas; su historial se conserva.",
      valoresIniciales: { motivo: "" },
      primario: "Dar de baja ZK 214 BD",
      peligro: true,
    });
    expect(contextoDeBaja(conUnidad(e, "u1", BAJA), "u1")).toBeNull();
    expect(contextoDeBaja(e, "zzz")).toBeNull();
  });

  it("validación y comando", () => {
    expect(CAMPOS_BAJA).toEqual(["motivo"]);
    expect(validarBaja({ motivo: " " })?.porCampo.motivo).toBe("Escriba el motivo de la baja.");
    expect(validarBaja({ motivo: "Venta de la unidad" })).toBeNull();
    const r = ejecutar(flotaDePrueba(), comandoDeBaja("u1", { motivo: "Venta de la unidad" }), contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["unidad-baja"]);
  });
});

describe("«Corregir kilometraje» (K5, M3)", () => {
  it("contexto: último registro, nota, fecha de hoy precargada y tope de la fecha; null si no hay diálogo", () => {
    const e = flotaDePrueba();
    expect(contextoDeKilometraje(e, "u1", H)).toEqual({
      unidadId: "u1",
      titulo: "Corregir kilometraje de ZK 214 BD",
      ultimoRegistro: "Último registro: 84.320 km (parte del 17/11/2026).",
      nota: "Úselo si se cambió el tablero o si un parte enviado tiene un error de kilometraje.",
      valoresIniciales: { desde: "2026-11-18", kmBase: "", motivo: "" },
      desdeMaxima: "2026-11-18",
      primario: "Guardar corrección",
    });
    expect(contextoDeKilometraje(conUnidad(e, "u1", BAJA), "u1", H)).toBeNull();
    expect(contextoDeKilometraje(e, "zzz", H)).toBeNull();
  });

  it("sin registros dice «Sin registros»", () => {
    const e = flotaDePrueba();
    expect(contextoDeKilometraje({ ...e, partes: [] }, "u1", H)?.ultimoRegistro).toBe("Sin registros");
  });

  it("los tres errores juntos y en el orden del formulario: fecha, kilometraje y motivo", () => {
    expect(CAMPOS_KILOMETRAJE).toEqual(["desde", "kmBase", "motivo"]);
    const e = validarKilometraje({ desde: "18/11/2026", kmBase: "abc", motivo: "corto" }, H);
    expect(e?.lista.map((x) => x.campo)).toEqual(["desde", "kmBase", "motivo"]);
    expect(e?.porCampo).toEqual({
      desde: "Escriba una fecha válida.",
      kmBase: "Escriba el kilometraje solo con números.",
      motivo: "El motivo tiene que tener al menos 10 caracteres.",
    });
  });

  it("fecha futura, kilometraje con decimales y motivo largo, con los textos del dominio", () => {
    const e = validarKilometraje({ desde: "2026-11-19", kmBase: "84,3", motivo: "x".repeat(201) }, H);
    expect(e?.porCampo.desde).toBe("La fecha no puede ser posterior a hoy.");
    expect(e?.porCampo.kmBase).toBe("Escriba el kilometraje sin decimales.");
    expect(e?.porCampo.motivo).toBe("El motivo no puede superar 200 caracteres.");
  });

  it("todo vacío pide la fecha, el kilometraje y el motivo", () => {
    const e = validarKilometraje({ desde: "", kmBase: "", motivo: "" }, H);
    expect(e?.lista).toHaveLength(3);
    expect(e?.porCampo.kmBase).toBe("Escriba el kilometraje.");
  });

  it("acepta 120, 84.320 y 84 320; el comando lleva el número", () => {
    for (const km of ["120", "84.320", "84 320"]) {
      expect(validarKilometraje({ desde: H, kmBase: km, motivo: "Cambio de tablero por avería" }, H)).toBeNull();
    }
    expect(comandoDeKilometraje("u1", { desde: H, kmBase: "84.320", motivo: "  Cambio de tablero por avería  " })).toEqual({
      tipo: "corregirKilometraje",
      unidadId: "u1",
      desde: H,
      kmBase: 84320,
      motivo: "  Cambio de tablero por avería  ",
    });
  });

  it("el comando guarda y produce km-corregido; M3 vuelve como error de la fecha", () => {
    const e = flotaDePrueba();
    const ok = ejecutar(e, comandoDeKilometraje("u1", { desde: H, kmBase: "120", motivo: "Cambio de tablero por avería" }), contexto());
    expect(ok.ok && ok.valor.eventos.map((x) => x.tipo)).toEqual(["km-corregido"]);
    const m3 = ejecutar(e, comandoDeKilometraje("u1", { desde: "2026-11-10", kmBase: "120", motivo: "Cambio de tablero por avería" }), contexto());
    expect(m3.ok).toBe(false);
    if (!m3.ok) expect(erroresDeNegocioKilometraje(m3.error).porCampo.desde).toMatch(/^Ya hay un parte del 17\/11\/2026/);
  });
});

describe("«Cambiar proyecto o conductor» (U6)", () => {
  it("contexto: los valores actuales, los proyectos y los conductores con la unidad que ya tienen (menos la propia)", () => {
    const e = flotaDePrueba();
    const c = contextoDeAsignacion(e, "u1");
    expect(c).toMatchObject({
      unidadId: "u1",
      titulo: "Cambiar proyecto o conductor: ZK 214 BD",
      valoresIniciales: { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c1" },
      primario: "Guardar cambios",
    });
    expect(c?.proyectos).toEqual([
      { valor: PROYECTO_PIEDRA.id, etiqueta: PROYECTO_PIEDRA.nombre },
      { valor: PROYECTO_BASE.id, etiqueta: PROYECTO_BASE.nombre },
    ]);
    expect(c?.conductores).toEqual([
      { valor: "", etiqueta: "Sin conductor asignado", asignadoA: null, licenciaVigente: true },
      { valor: "c1", etiqueta: "Luis Ferreyra", asignadoA: null, licenciaVigente: true },
      { valor: "c2", etiqueta: "Rosa Quiroga", asignadoA: "ZKB 482", licenciaVigente: true },
    ]);
  });

  it("sin conductor, el valor inicial es el texto vacío; un conductor que quedó inactivo se conserva para poder mostrarlo", () => {
    const e = flotaDePrueba();
    const sin = { ...e, unidades: e.unidades.map((u) => (u.id === "u1" ? { ...u, conductorId: null } : u)) };
    expect(contextoDeAsignacion(sin, "u1")?.valoresIniciales.conductorId).toBe("");
    const inactivo = { ...e, conductores: e.conductores.map((c) => (c.id === "c1" ? { ...c, activo: false } : c)) };
    expect(contextoDeAsignacion(inactivo, "u1")?.conductores.find((x) => x.valor === "c1")).toEqual({ valor: "c1", etiqueta: "Luis Ferreyra (inactivo)", asignadoA: null, licenciaVigente: true });
    expect(contextoDeAsignacion(inactivo, "u2")?.conductores.some((x) => x.valor === "c1")).toBe(false);
  });

  it("null si la unidad no existe o está de baja", () => {
    const e = flotaDePrueba();
    expect(contextoDeAsignacion(e, "zzz")).toBeNull();
    expect(contextoDeAsignacion(conUnidad(e, "u1", BAJA), "u1")).toBeNull();
  });

  it("U6: avisa si el proyecto nuevo exige una habilitación que la unidad no tiene", () => {
    const e = flotaDePrueba();
    // u2 está en la base (no la pide) y no tiene habilitación: pasarla a Piedra Lunar la deja sin poder salir.
    expect(avisoDeAsignacion(e, "u2", { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c2" })).toBe(
      "ZKB 482 no tiene cargada la habilitación de ingreso a Proyecto Piedra Lunar: no podrá salir hasta cargarla.",
    );
    expect(avisoDeAsignacion(e, "u2", { proyectoId: PROYECTO_BASE.id, conductorId: "c2" })).toBeNull();
    expect(avisoDeAsignacion(e, "u1", { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c1" })).toBeNull(); // u1 la tiene
    expect(avisoDeAsignacion(e, "u2", { proyectoId: "no-existe", conductorId: "" })).toBeNull();
  });

  it("validación: hay que elegir proyecto; el comando es el del dominio y sin cambios es un error general", () => {
    expect(CAMPOS_ASIGNACION).toEqual(["proyectoId", "conductorId"]);
    expect(validarAsignacion({ proyectoId: "", conductorId: "" })?.porCampo.proyectoId).toBe("Elija el proyecto.");
    expect(validarAsignacion({ proyectoId: PROYECTO_BASE.id, conductorId: "" })).toBeNull();
    expect(comandoDeAsignacion("u1", { proyectoId: PROYECTO_BASE.id, conductorId: "" })).toEqual({
      tipo: "cambiarAsignacion",
      unidadId: "u1",
      proyectoId: PROYECTO_BASE.id,
      conductorId: null,
    });
    const e = flotaDePrueba();
    const bien = ejecutar(e, comandoDeAsignacion("u1", { proyectoId: PROYECTO_BASE.id, conductorId: "c2" }), contexto());
    expect(bien.ok && bien.valor.eventos.map((x) => x.tipo)).toEqual(["asignacion-cambiada"]);
    const igual = ejecutar(e, comandoDeAsignacion("u1", { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c1" }), contexto());
    expect(!igual.ok && igual.error.mensaje).toBe("No hay cambios para guardar.");
  });

  it("un conductor que no existe vuelve como error del campo Conductor", () => {
    const e = flotaDePrueba();
    const r = ejecutar(e, comandoDeAsignacion("u1", { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c9" }), contexto());
    expect(!r.ok && r.error.campo).toBe("conductorId");
    void conductor;
  });
});
