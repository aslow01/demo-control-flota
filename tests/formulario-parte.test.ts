// Paso 4.5 (lógica): el formulario del parte (docs/diseno-ui.md 5.12 a 5.15 y 6.5; reglas P3, P4, P10, P11, K1, K2). Los valores del formulario son siempre
// texto; acá se prueba cómo se convierten en un comando, qué falta para enviar, en qué orden se listan los errores y qué mensajes salen.
import { describe, expect, it } from "vitest";
import {
  CAMPOS_PARTE,
  agruparResumen,
  barraDeEnvio,
  OPCIONES_COMBUSTIBLE,
  comandoDeBorrador,
  comandoDeCierre,
  erroresDeNegocioParte,
  errorGeneralParte,
  faltantesDeValores,
  mismosValores,
  recorridoDe,
  reformatearKm,
  respondidos,
  validarParaEnviar,
  valoresDeParte,
  valoresIniciales,
  type ValoresParte,
} from "../src/lib/dominio/formulario-parte.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import { parte, valoresConKm } from "./ayuda.ts";

/** El texto de la barra de envío (5.14): lo único que estas pruebas miran de `barraDeEnvio`. */
const textoBarraDeEnvio = (...argumentos: Parameters<typeof barraDeEnvio>): string => barraDeEnvio(...argumentos).texto;

function borrador(valores: ValoresParte, cambios: Partial<ValoresParte> = {}) {
  return comandoDeBorrador("u1", "2026-11-18", null, { ...valores, ...cambios });
}

function cierre(valores: ValoresParte, cambios: Partial<ValoresParte> = {}) {
  return comandoDeCierre("pt1", { ...valores, ...cambios });
}

function completos(extra: Partial<ValoresParte> = {}): ValoresParte {
  const v = valoresConKm({ conductorId: "c1", kmInicio: 84320 });
  for (const clave of Object.keys(v.checklist) as (keyof ValoresParte["checklist"])[]) v.checklist[clave] = { respuesta: "en-orden", descripcion: "", impideUso: false };
  return { ...v, kmFin: "84452", combustible: "tres-cuartos", ...extra };
}

describe("valores iniciales y de un parte guardado (P13)", () => {
  it("P13: el borrador nuevo trae el conductor ya elegido y el kilometraje inicial vacío (el odómetro lo escribe quien sale); todo lo demás vacío", () => {
    const v = valoresIniciales({ conductorId: "c1" });
    expect(v).toMatchObject({ conductorId: "c1", kmInicio: "", kmFin: "", combustible: "", litros: "", otraNovedad: { descripcion: "", impideUso: false } });
    expect(Object.values(v.checklist).every((i) => i.respuesta === "" && i.descripcion === "" && !i.impideUso)).toBe(true);
    expect(Object.keys(v.checklist)).toHaveLength(14);
  });

  it("sin conductor, el campo arranca vacío", () => {
    expect(valoresIniciales({ conductorId: null })).toMatchObject({ conductorId: "", kmInicio: "" });
  });

  it("P13: con el inicio vacío, enviar la revisión lo pide por su nombre (el campo es obligatorio)", () => {
    const e = validarParaEnviar({ ...completos(), kmInicio: "" });
    expect(e?.lista.map((x) => x.campo)).toEqual(["kmInicio"]);
    expect(e?.porCampo.kmInicio).toBe("Escriba el kilometraje al iniciar.");
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
      const r = borrador(valoresConKm({ conductorId: "c1", kmInicio: null }), { kmInicio: texto });
      expect(r.ok && r.comando.kmInicio).toBe(esperado);
    }
  });

  it("un borrador con solo el kilometraje inicial: todo lo demás nulo y el checklist sin responder", () => {
    const r = borrador(valoresConKm({ conductorId: "c1", kmInicio: 84320 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.comando).toMatchObject({ tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: "2026-11-18", conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, otraNovedad: null });
    expect(Object.values(r.comando.checklist).every((i) => i.estado === "sin-responder")).toBe(true);
  });

  it("sin conductor elegido el comando lleva null", () => {
    const r = comandoDeBorrador("u1", "2026-11-18", "pt1", valoresConKm({ conductorId: null, kmInicio: null }));
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

  it("P3: un kilometraje de inicio con letras no se guarda y se avisa en el campo; no se guarda nada del resto", () => {
    const r = borrador(completos(), { kmInicio: "84x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.porCampo.kmInicio).toBe(ERRORES.kmNoNumerico);
    expect(r.errores.lista).toEqual([{ campo: "kmInicio", mensaje: ERRORES.kmNoNumerico }]);
    expect(r.errores.general).toBeNull();
  });

  it("P3: los datos del cierre (un kmFin de una versión vieja, mal escrito) no bloquean el borrador de la revisión", () => {
    expect(borrador(completos(), { kmFin: "84x", litros: "abc" }).ok).toBe(true);
  });

  it("K1: decimales y pasarse del tope tienen su mensaje en el kilometraje de inicio", () => {
    const decimales = borrador(completos(), { kmInicio: "84,3" });
    expect(!decimales.ok && decimales.errores.porCampo.kmInicio).toBe(ERRORES.kmDecimales);
    const tope = borrador(completos(), { kmInicio: "2.000.001" });
    expect(!tope.ok && tope.errores.porCampo.kmInicio).toBe("El kilometraje no puede superar 2.000.000 km.");
  });

  it("un texto de más de 500 caracteres se avisa en su punto (o en «Otra novedad»)", () => {
    const v = completos();
    v.checklist.luces = { respuesta: "con-novedad", descripcion: "x".repeat(501), impideUso: false };
    const r = borrador(v, { otraNovedad: { descripcion: "y".repeat(501), impideUso: false } });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista.map((e) => e.campo)).toEqual(["luces", "otraNovedad"]);
  });
});

describe("P3: de los valores al comando de cierre (guardarCierre)", () => {
  it("el cierre se guarda con el fin, el combustible y los litros; los vacíos son null", () => {
    const r = cierre(completos(), { litros: "45,5" });
    expect(r).toEqual({ ok: true, comando: { tipo: "guardarCierre", parteId: "pt1", kmFin: 84452, combustible: "tres-cuartos", litrosCargados: 45.5 } });
    expect(cierre(completos(), { kmFin: "", combustible: "" })).toEqual({ ok: true, comando: { tipo: "guardarCierre", parteId: "pt1", kmFin: null, combustible: null, litrosCargados: null } });
  });

  it("P3: un kilometraje con letras no se guarda y se avisa en «Al terminar»", () => {
    const r = cierre(completos(), { kmFin: "84x" });
    expect(!r.ok && r.errores.lista).toEqual([{ campo: "kmFin", mensaje: ERRORES.kmNoNumerico }]);
    expect(!r.ok && r.errores.titulo).toBe("Revise 1 dato para cerrar el parte");
  });

  it("K1: negativos y pasarse del tope tienen su mensaje, en kmFin", () => {
    const negativo = cierre(completos(), { kmFin: "-5" });
    expect(!negativo.ok && negativo.errores.porCampo.kmFin).toBe(ERRORES.kmNegativo);
    const tope = cierre(completos(), { kmFin: "2.000.001" });
    expect(!tope.ok && tope.errores.porCampo.kmFin).toBe("El kilometraje no puede superar 2.000.000 km.");
  });

  it("P10: litros con 0, con dos decimales, con letras o por encima de 200 se avisan en el campo de litros", () => {
    const mensajes = ["0", "12,25", "abc", "250"].map((t) => {
      const r = cierre(completos(), { litros: t });
      return r.ok ? null : r.errores.porCampo.litrosCargados;
    });
    expect(mensajes).toEqual([ERRORES.litrosCero, ERRORES.litrosDecimales, ERRORES.litrosNoNumerico, "Los litros no pueden superar 200."]);
  });

  it("varios errores salen en el orden del formulario (fin, litros); lo de la revisión no cuenta", () => {
    const r = cierre(completos(), { kmFin: "x", kmInicio: "y", litros: "z" });
    expect(!r.ok && r.errores.lista.map((e) => e.campo)).toEqual(["kmFin", "litrosCargados"]);
  });
});

describe("P4: qué falta para enviar la revisión, en el orden del formulario", () => {
  it("P4: faltan el inicio y «luces» → kmInicio, luces; «Faltan 2 datos» (no pide el fin ni el combustible)", () => {
    const v = completos({ kmInicio: "", kmFin: "", combustible: "" });
    v.checklist.luces = { respuesta: "", descripcion: "", impideUso: false };
    expect(faltantesDeValores(v)).toEqual(["kmInicio", "luces"]);
    expect(textoBarraDeEnvio(v)).toBe("Faltan 2 datos");
  });

  it("completo: nada falta y la barra dice «Listo para enviar»", () => {
    expect(faltantesDeValores(completos({ kmFin: "", combustible: "" }))).toEqual([]);
    expect(textoBarraDeEnvio(completos())).toBe("Listo para enviar");
  });

  it("falta 1 dato (singular)", () => {
    expect(textoBarraDeEnvio(completos({ kmInicio: "" }))).toBe("Falta 1 dato");
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
    expect(faltantesDeValores(completos({ kmInicio: "abc" }))).toEqual([]);
  });

  it("respondidos: «3 de 14»", () => {
    const v = valoresConKm({ conductorId: "c1", kmInicio: 1 });
    v.checklist.frenos.respuesta = "en-orden";
    v.checklist.luces.respuesta = "con-novedad";
    v.checklist.cabina.respuesta = "en-orden";
    expect(respondidos(v)).toBe(3);
    expect(respondidos(completos())).toBe(14);
  });
});

describe("C5: la barra de envío no dice «Listo» con un error de reglas a la vista", () => {
  it("sin intento previo: igual que siempre", () => {
    expect(barraDeEnvio(completos())).toEqual({ texto: "Listo para enviar", lista: true });
    expect(barraDeEnvio(completos({ kmInicio: "" }))).toEqual({ texto: "Falta 1 dato", lista: false });
  });

  it("con un error de reglas vigente del último intento (L1 en el conductor): «Revise 1 dato», aunque no falte nada", () => {
    expect(barraDeEnvio(completos(), "revision", ["conductor"])).toEqual({ texto: "Revise 1 dato", lista: false });
    expect(textoBarraDeEnvio(completos(), "revision", ["conductor"])).toBe("Revise 1 dato");
  });

  it("un error del último intento que sigue siendo un faltante no se cuenta dos veces", () => {
    expect(barraDeEnvio(completos({ kmInicio: "" }), "revision", ["kmInicio"])).toEqual({ texto: "Falta 1 dato", lista: false });
  });

  it("los faltantes y un error de reglas se suman: «Revise 3 datos»", () => {
    const v = completos({ kmInicio: "" });
    v.checklist.frenos = { respuesta: "", descripcion: "", impideUso: false };
    expect(barraDeEnvio(v, "revision", ["conductor"])).toEqual({ texto: "Revise 3 datos", lista: false });
  });

  it("en el cierre: «Revise 1 dato» con K2 vigente en el kilometraje al terminar, y «Listo para cerrar» sin él", () => {
    expect(barraDeEnvio(completos(), "cierre", ["kmFin"])).toEqual({ texto: "Revise 1 dato", lista: false });
    expect(barraDeEnvio(completos(), "cierre")).toEqual({ texto: "Listo para cerrar", lista: true });
  });
});

describe("P4: qué falta para cerrar el parte", () => {
  it("un cierre sin nada: kmFin y combustible; «Faltan 2 datos»", () => {
    const v = valoresConKm({ conductorId: "c1", kmInicio: 84320 });
    expect(faltantesDeValores(v, "cierre")).toEqual(["kmFin", "combustible"]);
    expect(textoBarraDeEnvio(v, "cierre")).toBe("Faltan 2 datos");
  });

  it("completo: «Listo para cerrar»; los litros son opcionales y la revisión no se vuelve a pedir", () => {
    const v = completos();
    v.checklist.frenos = { respuesta: "", descripcion: "", impideUso: false };
    expect(faltantesDeValores(v, "cierre")).toEqual([]);
    expect(textoBarraDeEnvio(v, "cierre")).toBe("Listo para cerrar");
  });

  it("un campo con un error de tipo no cuenta como faltante, pero sí en la barra", () => {
    const v = completos({ kmFin: "abc" });
    expect(faltantesDeValores(v, "cierre")).toEqual([]);
    expect(textoBarraDeEnvio(v, "cierre")).toBe("Falta 1 dato");
  });
});

describe("5.15: el resumen de errores al enviar", () => {
  it("enviar la revisión vacía (solo con el inicio escrito y el conductor): faltan 14 datos, en el orden del formulario y con un mensaje por campo", () => {
    const e = validarParaEnviar(valoresConKm({ conductorId: "c1", kmInicio: 84320 }));
    expect(e).not.toBeNull();
    if (e === null) return;
    expect(e.titulo).toBe("Faltan 14 datos para enviar la revisión");
    expect(e.lista.map((x) => x.campo)).toEqual(["frenos", "direccion", "neumaticos", "luces", "cinturones", "perticaBaliza", "alarmaRetroceso", "niveles", "matafuego", "botiquin", "documentacion", "cabina", "calzasAntiderrame", "radio"]);
    expect(e.porCampo.frenos).toBe("Elija una opción para Frenos.");
    expect(e.porCampo.neumaticos).toBe("Elija una opción para Neumáticos y rueda de auxilio.");
    expect(e.general).toBeNull();
  });

  it("cerrar vacío: faltan 2 datos, con su mensaje por campo", () => {
    const e = validarParaEnviar(valoresConKm({ conductorId: "c1", kmInicio: 84320 }), "cierre");
    expect(e?.titulo).toBe("Faltan 2 datos para cerrar el parte");
    expect(e?.lista.map((x) => x.campo)).toEqual(["kmFin", "combustible"]);
    expect(e?.porCampo.kmFin).toBe("Escriba el kilometraje al terminar.");
    expect(e?.porCampo.combustible).toBe("Elija el nivel de combustible.");
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
    expect(validarParaEnviar(completos(), "cierre")).toBeNull();
  });

  it("un error de tipo aparece junto a los faltantes y el título cuenta todo como «Revise»", () => {
    const e = validarParaEnviar(completos({ kmFin: "abc", combustible: "" }), "cierre");
    expect(e?.lista.map((x) => x.campo)).toEqual(["kmFin", "combustible"]);
    expect(e?.titulo).toBe("Revise 2 datos para cerrar el parte");
  });

  it("un solo problema: «Revise 1 dato»", () => {
    expect(validarParaEnviar(completos({ kmInicio: "abc" }))?.titulo).toBe("Revise 1 dato para enviar la revisión");
  });

  it("D1: con más de 3 puntos sin responder el resumen es un solo enlace al primero; con 3 o menos, uno por punto", () => {
    const e = validarParaEnviar(valoresConKm({ conductorId: "c1", kmInicio: 84320 }));
    expect(e?.lista).toHaveLength(14); // el mensaje por campo no cambia: cada punto sigue diciendo qué le falta
    expect(agruparResumen(e?.lista ?? [])).toEqual([{ campo: "frenos", mensaje: "Faltan 14 puntos de la revisión" }]);

    const tres = completos();
    for (const c of ["frenos", "luces", "cabina"] as const) tres.checklist[c] = { respuesta: "", descripcion: "", impideUso: false };
    const t = validarParaEnviar(tres);
    expect(agruparResumen(t?.lista ?? [])).toEqual(t?.lista);
    expect(agruparResumen(t?.lista ?? []).map((x) => x.campo)).toEqual(["frenos", "luces", "cabina"]);

    const cuatro = completos();
    for (const c of ["frenos", "luces", "cabina", "niveles"] as const) cuatro.checklist[c] = { respuesta: "", descripcion: "", impideUso: false };
    expect(agruparResumen(validarParaEnviar(cuatro)?.lista ?? [])).toEqual([{ campo: "frenos", mensaje: "Faltan 4 puntos de la revisión" }]);
  });

  it("D1: lo que no es un punto sin completar sigue en su lugar, uno por campo, y el enlace agrupado va donde estaba el primer punto", () => {
    const v = valoresConKm({ conductorId: "", kmInicio: 84320 });
    v.kmInicio = "";
    v.otraNovedad = { descripcion: "", impideUso: true };
    const e = validarParaEnviar(v);
    expect(agruparResumen(e?.lista ?? []).map((x) => [x.campo, x.mensaje])).toEqual([
      ["conductor", "Elija quién conduce la unidad."],
      ["kmInicio", "Escriba el kilometraje al iniciar."],
      ["frenos", "Faltan 14 puntos de la revisión"],
      ["otraNovedad", "Cuente qué pasó en «Otra novedad» (al menos 3 caracteres) o déjela vacía."],
    ]);
  });

  it("D1: un punto con novedad sin descripción cuenta con los sin responder; uno con un texto demasiado largo no (es otro error)", () => {
    const v = valoresConKm({ conductorId: "c1", kmInicio: 84320 });
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "", impideUso: false };
    v.checklist.luces = { respuesta: "con-novedad", descripcion: "x".repeat(501), impideUso: false };
    const e = validarParaEnviar(v);
    expect(agruparResumen(e?.lista ?? [])).toEqual([
      { campo: "frenos", mensaje: "Faltan 13 puntos de la revisión" },
      { campo: "luces", mensaje: "La descripción no puede superar 500 caracteres." },
    ]);
  });

  it("D1: agruparResumen se puede volver a aplicar a la parte que sigue vigente (a medida que se completan los puntos)", () => {
    const e = validarParaEnviar(valoresConKm({ conductorId: "c1", kmInicio: 84320 }));
    const quedan = (e?.lista ?? []).slice(10); // quedan 4
    expect(agruparResumen(quedan)).toEqual([{ campo: "documentacion", mensaje: "Faltan 4 puntos de la revisión" }]);
    expect(agruparResumen(quedan.slice(1))).toEqual(quedan.slice(1)); // quedan 3: uno por punto
  });

  it("CAMPOS_PARTE es el orden del formulario: la revisión y después el cierre", () => {
    expect(CAMPOS_PARTE).toEqual(["conductor", "kmInicio", "frenos", "direccion", "neumaticos", "luces", "cinturones", "perticaBaliza", "alarmaRetroceso", "niveles", "matafuego", "botiquin", "documentacion", "cabina", "calzasAntiderrame", "radio", "otraNovedad", "kmFin", "combustible", "litrosCargados"]);
  });
});

describe("errores que devuelve el comando", () => {
  it("K3: el error de kilometraje que apunta a kmInicio va a ese campo, con el título «Revise 1 dato»", () => {
    const e = erroresDeNegocioParte({ codigo: "km-retrocede", mensaje: "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.", campo: "kmInicio" });
    expect(e.porCampo.kmInicio).toMatch(/^El último registro de ZK 214 BD es 84\.320 km/);
    expect(e.general).toBeNull();
    expect(e.titulo).toBe("Revise 1 dato para enviar la revisión");
  });

  it("L1: el error de licencia (campo conductorId) va al campo Conductor, primero de la lista", () => {
    const e = erroresDeNegocioParte({ codigo: "licencia-no-vigente", mensaje: "Luis Ferreyra no tiene licencia de conducir cargada. Elija otro conductor.", campo: "conductorId" });
    expect(e.porCampo.conductor).toBe("Luis Ferreyra no tiene licencia de conducir cargada. Elija otro conductor.");
    expect(e.lista[0]?.campo).toBe("conductor");
    expect(e.general).toBeNull();
  });

  it("K2 apunta a «Al terminar» (kmFin); K4, también; con el título del cierre", () => {
    const e = erroresDeNegocioParte({ codigo: "km-fin-menor", mensaje: "m", campo: "kmFin" }, "cierre");
    expect(e.porCampo.kmFin).toBe("m");
    expect(e.titulo).toBe("Revise 1 dato para cerrar el parte");
  });

  it("un error que no es de un campo (P8, P2, guardado) queda como general, con el título del paso", () => {
    const e = erroresDeNegocioParte({ codigo: "unidad-fuera-de-servicio", mensaje: "La unidad está fuera de servicio." });
    expect(e).toMatchObject({ porCampo: {}, lista: [], general: "La unidad está fuera de servicio.", titulo: "No se pudo enviar la revisión" });
    expect(erroresDeNegocioParte({ codigo: "x", mensaje: "m" }, "cierre").titulo).toBe("No se pudo cerrar el parte");
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
