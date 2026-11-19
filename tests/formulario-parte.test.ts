// Paso 4.5 (lógica): el formulario del parte (docs/diseno-ui.md 5.12 a 5.15 y 6.5; reglas P3, P4, P10, P11, K1, K2). Los valores del formulario son siempre
// texto; acá se prueba cómo se convierten en un comando, qué falta para enviar, en qué orden se listan los errores y qué mensajes salen.
import { describe, expect, it } from "vitest";
import {
  CAMPOS_PARTE,
  OPCIONES_COMBUSTIBLE,
  comandoDeBorrador,
  erroresDeNegocioParte,
  errorGeneralParte,
  faltantesDeValores,
  mismosValores,
  recorridoDe,
  reformatearKm,
  respondidos,
  textoBarraDeEnvio,
  validarParaEnviar,
  valoresDeParte,
  valoresIniciales,
  type ValoresParte,
} from "../src/lib/dominio/formulario-parte.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import { parte } from "./ayuda.ts";

function borrador(valores: ValoresParte, cambios: Partial<ValoresParte> = {}) {
  return comandoDeBorrador("u1", "2026-11-18", null, { ...valores, ...cambios });
}

function completos(extra: Partial<ValoresParte> = {}): ValoresParte {
  const v = valoresIniciales({ conductorId: "c1", kmInicio: 84320 });
  for (const clave of Object.keys(v.checklist) as (keyof ValoresParte["checklist"])[]) v.checklist[clave] = { respuesta: "en-orden", descripcion: "", impideUso: false };
  return { ...v, kmFin: "84452", combustible: "tres-cuartos", ...extra };
}

describe("valores iniciales y de un parte guardado (P13)", () => {
  it("P13: el borrador nuevo trae el conductor y el kilometraje inicial ya escritos; todo lo demás vacío", () => {
    const v = valoresIniciales({ conductorId: "c1", kmInicio: 84320 });
    expect(v).toMatchObject({ conductorId: "c1", kmInicio: "84.320", kmFin: "", combustible: "", litros: "", otraNovedad: { descripcion: "", impideUso: false } });
    expect(Object.values(v.checklist).every((i) => i.respuesta === "" && i.descripcion === "" && !i.impideUso)).toBe(true);
    expect(Object.keys(v.checklist)).toHaveLength(10);
  });

  it("sin kilometraje previo ni conductor, los campos arrancan vacíos", () => {
    expect(valoresIniciales({ conductorId: null, kmInicio: null })).toMatchObject({ conductorId: "", kmInicio: "" });
  });

  it("de un borrador guardado: números con punto de miles y coma decimal, y los puntos con novedad con su texto", () => {
    const p = parte({
      estado: "borrador",
      enviado: null,
      kmInicio: 84320,
      kmFin: null,
      combustible: "cuarto",
      litrosCargados: 45.5,
      checklist: { ...parte().checklist, frenos: { estado: "con-novedad", descripcion: "Ruido al frenar", impideUso: true }, luces: { estado: "sin-responder" } },
      otraNovedad: { descripcion: "Luz de patente", impideUso: false },
    });
    const v = valoresDeParte(p);
    expect(v).toMatchObject({ conductorId: "c1", kmInicio: "84.320", kmFin: "", combustible: "cuarto", litros: "45,5", otraNovedad: { descripcion: "Luz de patente", impideUso: false } });
    expect(v.checklist.frenos).toEqual({ respuesta: "con-novedad", descripcion: "Ruido al frenar", impideUso: true });
    expect(v.checklist.luces).toEqual({ respuesta: "", descripcion: "", impideUso: false });
    expect(v.checklist.cabina.respuesta).toBe("en-orden");
  });

  it("de un parte sin conductor (borrador) el conductor queda vacío", () => {
    expect(valoresDeParte(parte({ estado: "borrador", enviado: null, conductorId: null })).conductorId).toBe("");
  });

  it("mismosValores compara por contenido (no por referencia)", () => {
    const a = completos();
    expect(mismosValores(a, structuredClone(a))).toBe(true);
    expect(mismosValores(a, completos({ kmFin: "84453" }))).toBe(false);
    const b = structuredClone(a);
    b.checklist.frenos = { respuesta: "con-novedad", descripcion: "", impideUso: false };
    expect(mismosValores(a, b)).toBe(false);
  });

  it("las opciones de combustible son las cinco del selector, de la reserva al lleno (5.13)", () => {
    expect(OPCIONES_COMBUSTIBLE).toEqual([
      { valor: "reserva", etiqueta: "Reserva" },
      { valor: "cuarto", etiqueta: "1/4" },
      { valor: "medio", etiqueta: "1/2" },
      { valor: "tres-cuartos", etiqueta: "3/4" },
      { valor: "lleno", etiqueta: "Lleno" },
    ]);
  });
});

describe("P3: de los valores al comando de borrador", () => {
  it("P3: cualquier subconjunto de datos se guarda; el kilometraje acepta punto, espacio o nada (K1)", () => {
    for (const [texto, esperado] of [["84320", 84320], ["84.320", 84320], ["84 320", 84320]] as const) {
      const r = borrador(valoresIniciales({ conductorId: "c1", kmInicio: null }), { kmInicio: texto });
      expect(r.ok && r.comando.kmInicio).toBe(esperado);
    }
  });

  it("un borrador con solo el kilometraje inicial: todo lo demás nulo y el checklist sin responder", () => {
    const r = borrador(valoresIniciales({ conductorId: "c1", kmInicio: 84320 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.comando).toMatchObject({ tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: "2026-11-18", conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, otraNovedad: null });
    expect(Object.values(r.comando.checklist).every((i) => i.estado === "sin-responder")).toBe(true);
  });

  it("sin conductor elegido el comando lleva null", () => {
    const r = comandoDeBorrador("u1", "2026-11-18", "pt1", valoresIniciales({ conductorId: null, kmInicio: null }));
    expect(r.ok && r.comando).toMatchObject({ conductorId: null, parteId: "pt1", kmInicio: null });
  });

  it("P10: litros vacío es null; 45,5 y 45.5 son 45.5", () => {
    const base = completos();
    const vacio = borrador(base, { litros: "" });
    expect(vacio.ok && vacio.comando.litrosCargados).toBeNull();
    for (const t of ["45,5", "45.5"]) {
      const r = borrador(base, { litros: t });
      expect(r.ok && r.comando.litrosCargados).toBe(45.5);
    }
  });

  it("P11: «con novedad» conserva el texto tal como se escribió (sin recortar) y el «impide»; «en orden» no lleva texto aunque haya quedado escrito", () => {
    const v = completos();
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "  Ruido al frenar ", impideUso: true };
    v.checklist.niveles = { respuesta: "en-orden", descripcion: "texto que ya no vale", impideUso: true };
    const r = borrador(v);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.comando.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "  Ruido al frenar ", impideUso: true });
    expect(r.comando.checklist.niveles).toEqual({ estado: "en-orden" });
  });

  it("«Otra novedad»: vacía y sin «impide» es null; con texto, o solo con «impide», es una novedad (y faltará el texto para enviar)", () => {
    const v = completos();
    const vacia = borrador(v, { otraNovedad: { descripcion: "   ", impideUso: false } });
    expect(vacia.ok && vacia.comando.otraNovedad).toBeNull();
    const con = borrador(v, { otraNovedad: { descripcion: "Luz de patente", impideUso: false } });
    expect(con.ok && con.comando.otraNovedad).toEqual({ descripcion: "Luz de patente", impideUso: false });
    const solo = borrador(v, { otraNovedad: { descripcion: "", impideUso: true } });
    expect(solo.ok && solo.comando.otraNovedad).toEqual({ descripcion: "", impideUso: true });
  });

  it("P3: un kilometraje con letras no se guarda y se avisa en el campo; no se guarda nada del resto", () => {
    const r = borrador(completos(), { kmFin: "84x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.porCampo.kmFin).toBe(ERRORES.kmNoNumerico);
    expect(r.errores.lista).toEqual([{ campo: "kmFin", mensaje: ERRORES.kmNoNumerico }]);
    expect(r.errores.general).toBeNull();
  });

  it("K1: decimales, negativos y pasarse del tope tienen su mensaje, en el campo que corresponde (inicio o fin)", () => {
    const decimales = borrador(completos(), { kmInicio: "84,3" });
    expect(!decimales.ok && decimales.errores.porCampo.kmInicio).toBe(ERRORES.kmDecimales);
    const negativo = borrador(completos(), { kmFin: "-5" });
    expect(!negativo.ok && negativo.errores.porCampo.kmFin).toBe(ERRORES.kmNegativo);
    const tope = borrador(completos(), { kmFin: "2.000.001" });
    expect(!tope.ok && tope.errores.porCampo.kmFin).toBe("El kilometraje no puede superar 2.000.000 km.");
  });

  it("P10: litros con 0, con dos decimales, con letras o por encima de 200 se avisan en el campo de litros", () => {
    const mensajes = ["0", "12,25", "abc", "250"].map((t) => {
      const r = borrador(completos(), { litros: t });
      return r.ok ? null : r.errores.porCampo.litrosCargados;
    });
    expect(mensajes).toEqual([ERRORES.litrosCero, ERRORES.litrosDecimales, ERRORES.litrosNoNumerico, "Los litros no pueden superar 200."]);
  });

  it("un texto de más de 500 caracteres se avisa en su punto (o en «Otra novedad»)", () => {
    const v = completos();
    v.checklist.luces = { respuesta: "con-novedad", descripcion: "x".repeat(501), impideUso: false };
    const r = borrador(v, { otraNovedad: { descripcion: "y".repeat(501), impideUso: false } });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista.map((e) => e.campo)).toEqual(["luces", "otraNovedad"]);
  });

  it("varios errores salen en el orden del formulario (inicio, fin, puntos, litros)", () => {
    const r = borrador(completos(), { kmFin: "x", kmInicio: "y", litros: "z" });
    expect(!r.ok && r.errores.lista.map((e) => e.campo)).toEqual(["kmInicio", "kmFin", "litrosCargados"]);
  });
});

describe("P4: qué falta para enviar, en el orden del formulario", () => {
  it("P4: falta el fin, el combustible y «luces» → kmFin, luces, combustible; «Faltan 3 datos»", () => {
    const v = completos({ kmFin: "", combustible: "" });
    v.checklist.luces = { respuesta: "", descripcion: "", impideUso: false };
    expect(faltantesDeValores(v)).toEqual(["kmFin", "luces", "combustible"]);
    expect(textoBarraDeEnvio(v)).toBe("Faltan 3 datos");
  });

  it("completo: nada falta y la barra dice «Listo para enviar»", () => {
    expect(faltantesDeValores(completos())).toEqual([]);
    expect(textoBarraDeEnvio(completos())).toBe("Listo para enviar");
  });

  it("falta 1 dato (singular)", () => {
    expect(textoBarraDeEnvio(completos({ combustible: "" }))).toBe("Falta 1 dato");
  });

  it("sin conductor es lo primero que falta", () => {
    expect(faltantesDeValores(completos({ conductorId: "", kmInicio: "" }))).toEqual(["conductor", "kmInicio"]);
  });

  it("un punto «con novedad» sin descripción de 3 caracteres cuenta como faltante (también si solo hay espacios)", () => {
    const v = completos();
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "  ab  ", impideUso: false };
    v.checklist.direccion = { respuesta: "con-novedad", descripcion: "   ", impideUso: false };
    v.checklist.neumaticos = { respuesta: "con-novedad", descripcion: " abc ", impideUso: false };
    expect(faltantesDeValores(v)).toEqual(["frenos", "direccion"]);
  });

  it("«Otra novedad» marcada con «impide» pero sin texto falta; vacía del todo no", () => {
    expect(faltantesDeValores(completos({ otraNovedad: { descripcion: "", impideUso: true } }))).toEqual(["otraNovedad"]);
    expect(faltantesDeValores(completos({ otraNovedad: { descripcion: "", impideUso: false } }))).toEqual([]);
    expect(faltantesDeValores(completos({ otraNovedad: { descripcion: "Luz", impideUso: false } }))).toEqual([]);
  });

  it("un campo con un error de tipo no cuenta como faltante (es otro problema)", () => {
    expect(faltantesDeValores(completos({ kmFin: "abc" }))).toEqual([]);
  });

  it("respondidos: «3 de 10»", () => {
    const v = valoresIniciales({ conductorId: "c1", kmInicio: 1 });
    v.checklist.frenos.respuesta = "en-orden";
    v.checklist.luces.respuesta = "con-novedad";
    v.checklist.cabina.respuesta = "en-orden";
    expect(respondidos(v)).toBe(3);
    expect(respondidos(completos())).toBe(10);
  });
});

describe("5.15: el resumen de errores al enviar", () => {
  it("enviar vacío (solo con el inicio precargado y el conductor): faltan 12 datos, en el orden del formulario y con un mensaje por campo", () => {
    const e = validarParaEnviar(valoresIniciales({ conductorId: "c1", kmInicio: 84320 }));
    expect(e).not.toBeNull();
    if (e === null) return;
    expect(e.titulo).toBe("Faltan 12 datos para enviar el parte");
    expect(e.lista.map((x) => x.campo)).toEqual(["kmFin", "frenos", "direccion", "neumaticos", "luces", "cinturones", "niveles", "matafuego", "botiquin", "documentacion", "cabina", "combustible"]);
    expect(e.porCampo.kmFin).toBe("Escriba el kilometraje al terminar.");
    expect(e.porCampo.frenos).toBe("Elija una opción para Frenos.");
    expect(e.porCampo.neumaticos).toBe("Elija una opción para Neumáticos y rueda de auxilio.");
    expect(e.porCampo.combustible).toBe("Elija el nivel de combustible.");
    expect(e.general).toBeNull();
  });

  it("los mensajes de conductor, inicio, descripción corta y «Otra novedad»", () => {
    const v = completos({ conductorId: "", kmInicio: "", otraNovedad: { descripcion: "", impideUso: true } });
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "no", impideUso: false };
    const e = validarParaEnviar(v);
    expect(e?.porCampo).toEqual({
      conductor: "Elija quién conduce la unidad.",
      kmInicio: "Escriba el kilometraje al iniciar.",
      frenos: "Cuente qué encontró en Frenos (al menos 3 caracteres).",
      otraNovedad: "Cuente qué pasó en «Otra novedad» (al menos 3 caracteres) o déjela vacía.",
    });
  });

  it("completo no tiene errores", () => {
    expect(validarParaEnviar(completos())).toBeNull();
  });

  it("un error de tipo aparece junto a los faltantes y el título cuenta todo como «Revise»", () => {
    const e = validarParaEnviar(completos({ kmFin: "abc", combustible: "" }));
    expect(e?.lista.map((x) => x.campo)).toEqual(["kmFin", "combustible"]);
    expect(e?.titulo).toBe("Revise 2 datos para enviar el parte");
  });

  it("un solo problema: «Revise 1 dato»", () => {
    expect(validarParaEnviar(completos({ kmFin: "abc" }))?.titulo).toBe("Revise 1 dato para enviar el parte");
  });

  it("CAMPOS_PARTE es el orden del formulario", () => {
    expect(CAMPOS_PARTE).toEqual(["conductor", "kmInicio", "kmFin", "frenos", "direccion", "neumaticos", "luces", "cinturones", "niveles", "matafuego", "botiquin", "documentacion", "cabina", "combustible", "litrosCargados", "otraNovedad"]);
  });
});

describe("errores que devuelve el comando", () => {
  it("K3: el error de kilometraje que apunta a kmInicio va a ese campo, con el título «Revise 1 dato»", () => {
    const e = erroresDeNegocioParte({ codigo: "km-retrocede", mensaje: "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.", campo: "kmInicio" });
    expect(e.porCampo.kmInicio).toMatch(/^El último registro de ZK 214 BD es 84\.320 km/);
    expect(e.general).toBeNull();
    expect(e.titulo).toBe("Revise 1 dato para enviar el parte");
  });

  it("K2 apunta a «Al terminar» (kmFin); K4, también", () => {
    expect(erroresDeNegocioParte({ codigo: "km-fin-menor", mensaje: "m", campo: "kmFin" }).porCampo.kmFin).toBe("m");
  });

  it("un error que no es de un campo (P8, P2, guardado) queda como general, con el título «No se pudo enviar el parte»", () => {
    const e = erroresDeNegocioParte({ codigo: "unidad-fuera-de-servicio", mensaje: "La unidad está fuera de servicio." });
    expect(e).toMatchObject({ porCampo: {}, lista: [], general: "La unidad está fuera de servicio.", titulo: "No se pudo enviar el parte" });
    expect(errorGeneralParte(ERRORES.noPudoGuardarElParte).general).toBe(ERRORES.noPudoGuardarElParte);
  });

  it("un error con un campo desconocido para el formulario (fecha) es general", () => {
    expect(erroresDeNegocioParte({ codigo: "parte-fecha-futura", mensaje: "La fecha no puede ser posterior a hoy.", campo: "fecha" }).general).toBe("La fecha no puede ser posterior a hoy.");
  });
});

describe("recorrido y formato del kilometraje (5.11, 6.5)", () => {
  it("K2: 132 km, «Sin uso» con recorrido 0 y «—» si falta un dato, no es un número o el fin es menor", () => {
    expect(recorridoDe("84.320", "84.452")).toBe("132 km");
    expect(recorridoDe("84320", "84.320")).toBe("Sin uso");
    expect(recorridoDe("84.320", "")).toBe("—");
    expect(recorridoDe("", "84.452")).toBe("—");
    expect(recorridoDe("84.320", "abc")).toBe("—");
    expect(recorridoDe("84.320", "84.319")).toBe("—");
  });

  it("al salir del campo se reformatea con punto de miles; lo que no es un número se deja como está", () => {
    expect(reformatearKm("84320")).toBe("84.320");
    expect(reformatearKm(" 84 320 ")).toBe("84.320");
    expect(reformatearKm("84.320")).toBe("84.320");
    expect(reformatearKm("0")).toBe("0");
    expect(reformatearKm("abc")).toBe("abc");
    expect(reformatearKm("84,3")).toBe("84,3");
    expect(reformatearKm("")).toBe("");
  });
});
