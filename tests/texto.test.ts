// Normalización de los textos libres (U7): sin caracteres de control ni de control bidireccional, y el largo se cuenta en caracteres (puntos de código).
import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { faltantesDeRevision } from "../src/lib/dominio/parte.ts";
import { largoDeTexto, largoEnCaracteres, limpiarTexto, normalizarTexto } from "../src/lib/dominio/texto.ts";
import { REGLAS, validarTexto, validarTextoDeBorrador } from "../src/lib/dominio/validacion.ts";
import { checklistEnOrden, checklistVacio, ejecutarError, ejecutarOk, flotaDePrueba } from "./ayuda.ts";

const BIDI = ["\u202A", "\u202B", "\u202C", "\u202D", "\u202E", "\u2066", "\u2067", "\u2068", "\u2069"];

describe("limpiarTexto (U7)", () => {
  it("saca los caracteres de control (C0 salvo tabulación y salto de línea, DEL y C1)", () => {
    expect(limpiarTexto("a\u0000b\u0007c\u001Bd\u007Fe\u0085f\u009Fg")).toBe("abcdefg");
    expect(limpiarTexto("uno\ndos\ttres\r\ncuatro")).toBe("uno\ndos\ttres\r\ncuatro");
  });

  it("saca los de control bidireccional (U+202A a U+202E y U+2066 a U+2069), uno por uno", () => {
    for (const c of BIDI) expect(limpiarTexto(`ab${c}cd`), c.codePointAt(0)?.toString(16)).toBe("abcd");
    expect(limpiarTexto("ficha \u202Eodnuf\u202C")).toBe("ficha odnuf");
  });

  it("saca también los invisibles y de formato (categoría Cf): U+200B a U+200F, U+2060, U+FEFF, U+00AD, U+061C y U+FFF9 a U+FFFB", () => {
    const invisibles = ["\u200B", "\u200C", "\u200E", "\u200F", "\u2060", "\uFEFF", "\u00AD", "\u061C", "\uFFF9", "\uFFFA", "\uFFFB"];
    for (const c of invisibles) expect(limpiarTexto(`ab${c}cd`), c.codePointAt(0)?.toString(16)).toBe("abcd");
    expect(limpiarTexto("\uFEFFfrenos\u200B blandos")).toBe("frenos blandos");
  });

  it("no toca lo que sí es texto: tildes, eñes y emojis, también los compuestos (la unión de ancho cero U+200D se conserva)", () => {
    expect(limpiarTexto("Ñandú, línea 3 😀 👨\u200D👩\u200D👧")).toBe("Ñandú, línea 3 😀 👨\u200D👩\u200D👧");
    expect(limpiarTexto("👨\u200D👩\u200D👧")).toBe("👨\u200D👩\u200D👧");
  });

  it("un texto que era solo invisibles queda vacío", () => {
    expect(normalizarTexto("\u200B\uFEFF \u2060")).toBe("");
  });

  it("normalizarTexto limpia y recorta los extremos", () => {
    expect(normalizarTexto("  \u0000 hola\u202E \n")).toBe("hola");
  });
});

describe("B3: un texto sin nada visible no es una descripción", () => {
  // Braille en blanco, relleno hangul, unión de ancho cero sola, selector de variación y signo combinador de grafema: no son Cc ni Cf (salvo la unión), no se ven y no son texto.
  const huecos: [string, string][] = [
    ["braille en blanco", "⠀"],
    ["relleno hangul", "ㅤ"],
    ["relleno hangul de media anchura", "ﾠ"],
    ["relleno de jamo", "ᅟᅠ"],
    ["unión de ancho cero", "‍"],
    ["selector de variación", "️"],
    ["combinador de grafema", "͏"],
  ];

  it.each(huecos)("normalizarTexto: solo %s queda vacío", (_nombre, c) => {
    expect(normalizarTexto(c.repeat(5))).toBe("");
    expect(normalizarTexto(` ${c}${c} `)).toBe("");
  });

  it("validarTexto los rechaza como vacíos, con el mensaje del campo (también si el mínimo es 0 se guarda vacío)", () => {
    for (const [nombre, c] of huecos) {
      const r = validarTexto(c.repeat(5), REGLAS.novedad);
      expect(r.ok, nombre).toBe(false);
      if (!r.ok) expect(r.error.codigo, nombre).toBe("descripcion-vacio");
    }
    const emisor = validarTexto("⠀ㅤ", REGLAS.emisor);
    expect(emisor.ok && emisor.valor).toBe("");
  });

  it("no toca lo que sí tiene algo visible: una letra con un relleno, un emoji compuesto, un emoji con selector, el braille con puntos", () => {
    expect(normalizarTexto("a⠀")).toBe("a⠀");
    expect(normalizarTexto("👨‍👩")).toBe("👨‍👩");
    expect(normalizarTexto("❤️")).toBe("❤️");
    expect(normalizarTexto("⠁")).toBe("⠁");
    expect(normalizarTexto("123")).toBe("123");
    expect(normalizarTexto("...")).toBe("...");
  });

  it("P4: una descripción de puro relleno no alcanza para enviar la revisión (el punto sigue faltando)", () => {
    const parte = { conductorId: "c1", kmInicio: 1, checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "⠀".repeat(8), impideUso: false } }, otraNovedad: null };
    expect(faltantesDeRevision(parte)).toEqual(["frenos"]);
  });

  it("al cargar una novedad se rechaza igual", () => {
    expect(ejecutarError(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "ㅤㅤㅤㅤ", impideUso: false }).codigo).toBe("descripcion-vacio");
  });
});

describe("B2: el contador del área de texto cuenta lo mismo que la regla del tope", () => {
  it("largoDeTexto cuenta caracteres sin los de control ni los invisibles, y sin recortar", () => {
    expect(largoDeTexto("😀".repeat(300))).toBe(300);
    expect(largoDeTexto("a\u0000b‮c​")).toBe(3);
    expect(largoDeTexto("  ab  ")).toBe(6);
  });

  it("300 emojis (600 unidades UTF-16) valen 300 en el contador y en el borrador; 501 no pasan", () => {
    expect(largoDeTexto("😀".repeat(300))).toBeLessThanOrEqual(500);
    expect(validarTextoDeBorrador("😀".repeat(300), "descripcion").ok).toBe(true);
    expect(largoDeTexto("😀".repeat(501))).toBe(501);
    expect(validarTextoDeBorrador("😀".repeat(501), "descripcion").ok).toBe(false);
  });
});

describe("largoEnCaracteres (U7)", () => {
  it("cuenta puntos de código, no unidades UTF-16", () => {
    expect(largoEnCaracteres("abc")).toBe(3);
    expect(largoEnCaracteres("😀".repeat(300))).toBe(300);
    expect("😀".repeat(300).length).toBe(600);
    expect(largoEnCaracteres("")).toBe(0);
  });
});

describe("U7 en los comandos: el tope de 500 se cuenta en caracteres y los textos se guardan limpios", () => {
  const nueva = (descripcion: string): Comando => ({ tipo: "cargarNovedad", unidadId: "u1", descripcion, impideUso: false });
  type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;
  const borrador = (parcial: Partial<Borrador> = {}): Borrador => ({
    tipo: "guardarBorrador",
    parteId: null,
    unidadId: "u1",
    fecha: "2026-11-18",
    conductorId: "c1",
    kmInicio: 84320,
    kmFin: null,
    combustible: null,
    litrosCargados: null,
    checklist: checklistVacio(),
    otraNovedad: null,
    ...parcial,
  });

  it("300 emojis son 300 caracteres: pasan; 501 no", () => {
    const e = flotaDePrueba();
    expect(ejecutarOk(e, nueva("😀".repeat(300))).estado.novedades[0]?.descripcion).toBe("😀".repeat(300));
    expect(ejecutarOk(e, nueva("😀".repeat(500))).estado.novedades).toHaveLength(1);
    expect(ejecutarError(e, nueva("😀".repeat(501))).mensaje).toBe("La descripción no puede superar 500 caracteres.");
  });

  it("una novedad con caracteres de control y de dirección se guarda sin ellos", () => {
    const r = ejecutarOk(flotaDePrueba(), nueva("  Ruido\u0000 al frenar\u202E, mucho\u0007  "));
    expect(r.estado.novedades[0]?.descripcion).toBe("Ruido al frenar, mucho");
    expect(r.eventos[0]?.resumen).not.toMatch(/[\u0000-\u0008\u202A-\u202E]/);
  });

  it("lo que queda vacío después de limpiar cuenta como vacío", () => {
    const err = ejecutarError(flotaDePrueba(), nueva("\u0000\u202E \u0007"));
    expect(err.codigo).toBe("descripcion-vacio");
    expect(err.campo).toBe("descripcion");
  });

  it("el largo mínimo se cuenta después de limpiar", () => {
    expect(ejecutarError(flotaDePrueba(), nueva("a\u0000b")).codigo).toBe("texto-corto");
  });

  it("los otros textos libres también: motivo de fuera de servicio, de baja y de corrección", () => {
    const e = flotaDePrueba();
    const f = ejecutarOk(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller\u202E: embrague" });
    const u = f.estado.unidades.find((x) => x.id === "u1")?.estado;
    expect(u?.tipo === "fuera-de-servicio" && u.motivo).toBe("En taller: embrague");
    const b = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u2", motivo: "Venta\u0000 de la unidad" });
    expect(b.eventos[0]?.resumen).toBe("ZKB 482 dada de baja: Venta de la unidad");
    const k = ejecutarOk(e, { tipo: "corregirKilometraje", unidadId: "u1", desde: "2026-11-18", kmBase: 120, motivo: "Cambio\u2067 de tablero" });
    expect(k.estado.correccionesKm[0]?.motivo).toBe("Cambio de tablero");
  });

  it("un borrador guarda los textos sin caracteres de control ni de dirección y sin recortar; el tope es de 500 caracteres", () => {
    const e = flotaDePrueba();
    const checklist = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: " ruido\u0000\u202E ", impideUso: false } };
    const r = ejecutarOk(e, borrador({ checklist, otraNovedad: { descripcion: "vidrio\u2066 rayado", impideUso: false } }));
    const p = r.estado.partes.at(-1);
    expect(p?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: " ruido ", impideUso: false });
    expect(p?.otraNovedad?.descripcion).toBe("vidrio rayado");
    const emojis = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: "😀".repeat(500), impideUso: false } };
    expect(ejecutarOk(e, borrador({ checklist: emojis })).estado.partes.at(-1)?.checklist.frenos).toMatchObject({ descripcion: "😀".repeat(500) });
    const largo = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: "😀".repeat(501), impideUso: false } };
    expect(ejecutarError(e, borrador({ checklist: largo })).codigo).toBe("texto-largo");
  });

  it("la revisión enviada guarda las descripciones limpias y recortadas, y las abre como novedades", () => {
    const e = flotaDePrueba();
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "  pierde aceite\u0000\u202E  ", impideUso: false } };
    const g = ejecutarOk(e, borrador({ checklist }));
    const id = g.cambios.partes[0]?.id ?? "";
    // aunque un borrador viejo tuviera caracteres de control guardados, la revisión los saca
    const sucio = { ...g.estado, partes: g.estado.partes.map((p) => (p.id === id ? { ...p, checklist: { ...p.checklist, niveles: { estado: "con-novedad" as const, descripcion: "  pierde aceite\u0000\u202E  ", impideUso: false } } } : p)) };
    const r = ejecutarOk(sucio, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: [] });
    expect(r.estado.novedades[0]?.descripcion).toBe("pierde aceite");
    expect(r.estado.partes.find((p) => p.id === id)?.checklist.niveles).toEqual({ estado: "con-novedad", descripcion: "pierde aceite", impideUso: false });
  });
});
