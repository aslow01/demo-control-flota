// Paso 4.4 (lógica): «Corregir documento» y el `select` «Tipo» de «Cargar otro documento» (docs/diseno-ui.md, 5.17; pendiente del 4.2).
import { describe, expect, it } from "vitest";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import {
  CAMPOS_CARGAR_OTRO,
  comandoDeCargarOtro,
  comandoDeCorregir,
  contextoDeCargarOtro,
  contextoDeCorregir,
  erroresDeNegocioCargarOtro,
  tiposParaCargar,
  validarCargarOtro,
  validarValores,
} from "../src/lib/dominio/formulario-documento.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { contexto, documento, flotaDePrueba } from "./ayuda.ts";

const H = "2026-11-18";
const bien = { tipoDocumento: "habilitacion-proyecto", numero: "DEMO-HAB-1", emisor: "", vence: "2027-11-18", emitido: "" };

/** u2 (base de mantenimiento) no tiene habilitación de ingreso y no la necesita: es el caso del «otro documento». */
const e: Estado = flotaDePrueba();

describe("«Corregir documento»", () => {
  it("contexto: título, nota, valores actuales de los cuatro campos y primario", () => {
    const con = { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, numero: "DEMO-88-4471", emisor: "Seguros Puna Demo", emitido: "2026-01-05" } : d)) };
    expect(contextoDeCorregir(con, "u1-seguro")).toEqual({
      documentoId: "u1-seguro",
      titulo: "Corregir: Seguro de ZK 214 BD",
      nota: "Use esto para corregir un error de carga. Si el documento se renovó, use Renovar.",
      nombreDocumento: "Seguro",
      titularEtiqueta: "ZK 214 BD",
      valoresIniciales: { numero: "DEMO-88-4471", emisor: "Seguros Puna Demo", vence: "2027-06-30", emitido: "2026-01-05" },
      primario: "Guardar corrección",
    });
  });

  it("la emisión que no se cargó viene vacía; el documento de un conductor se nombra con su nombre", () => {
    expect(contextoDeCorregir(e, "u1-seguro")?.valoresIniciales.emitido).toBe("");
    expect(contextoDeCorregir(e, "c1-licencia")?.titulo).toBe("Corregir: Licencia de conducir de Luis Ferreyra");
  });

  it("null si el documento no existe, si es uno anterior (ya renovado) o si su unidad está de baja", () => {
    expect(contextoDeCorregir(e, "zzz")).toBeNull();
    const renovado = { ...e, documentos: [...e.documentos, documento({ id: "nuevo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2028-06-30", reemplazaA: "u1-seguro" })] };
    expect(contextoDeCorregir(renovado, "u1-seguro")).toBeNull();
    expect(contextoDeCorregir(renovado, "nuevo")).not.toBeNull();
    const baja = { ...e, unidades: e.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" } } : u)) };
    expect(contextoDeCorregir(baja, "u1-seguro")).toBeNull();
  });

  it("el comando lleva los cuatro campos (la emisión vacía es «sin emisión») y el dominio decide qué cambió", () => {
    const c = comandoDeCorregir("u1-seguro", { numero: " DEMO-X ", emisor: "Seguros Puna Demo", vence: "2027-07-30", emitido: "" });
    expect(c).toEqual({ tipo: "corregirDocumento", documentoId: "u1-seguro", numero: "DEMO-X", emisor: "Seguros Puna Demo", vence: "2027-07-30", emitido: null });
    const r = ejecutar(e, c, contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["documento-corregido"]);
    const igual = ejecutar(e, comandoDeCorregir("u1-seguro", { numero: "DEMO-u1-seguro", emisor: "Aseguradora del Sur Demo", vence: "2027-06-30", emitido: "" }), contexto());
    expect(!igual.ok && igual.error.mensaje).toBe("No hay cambios para guardar.");
  });

  it("la validación previa es la de renovar y cargar (los mismos validadores)", () => {
    const err = validarValores({ numero: "", emisor: "", vence: "2099-01-01", emitido: "no" }, H);
    expect(err?.lista.map((x) => x.campo)).toEqual(["numero", "vence", "emitido"]);
  });
});

describe("«Cargar otro documento»: el select «Tipo»", () => {
  it("ofrece los tipos de unidad que todavía no tienen documento vigente, en el orden de los requisitos", () => {
    expect(tiposParaCargar(e, "u2")).toEqual(["habilitacion-proyecto"]);
    const sinNada = { ...e, documentos: e.documentos.filter((d) => d.titular.id !== "u1") };
    expect(tiposParaCargar(sinNada, "u1")).toEqual(["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"]);
  });

  it("no ofrece nada si la unidad ya los tiene todos (no hay botón «Cargar otro documento»), o si no existe o está de baja", () => {
    expect(tiposParaCargar(e, "u1")).toEqual([]);
    expect(tiposParaCargar(e, "zzz")).toEqual([]);
    const baja = { ...e, unidades: e.unidades.map((u) => (u.id === "u2" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" } } : u)) };
    expect(tiposParaCargar(baja, "u2")).toEqual([]);
  });

  it("contexto: título con la patente, los tipos con su nombre, sin tipo elegido y el primario de «Cargar»", () => {
    expect(contextoDeCargarOtro(e, "u2")).toEqual({
      unidadId: "u2",
      titulo: "Cargar documento de ZKB 482",
      titularEtiqueta: "ZKB 482",
      tipos: [{ valor: "habilitacion-proyecto", etiqueta: "Habilitación de ingreso al proyecto" }],
      valoresIniciales: { tipoDocumento: "", numero: "", emisor: "", vence: "", emitido: "" },
      primario: "Guardar documento",
    });
    expect(contextoDeCargarOtro(e, "u1")).toBeNull();
  });

  it("validación: el tipo se elige primero (campo 1 del formulario) y lo demás se revisa junto", () => {
    expect(CAMPOS_CARGAR_OTRO).toEqual(["tipoDocumento", "numero", "emisor", "vence", "emitido"]);
    const err = validarCargarOtro({ tipoDocumento: "", numero: "", emisor: "", vence: "", emitido: "" }, e, "u2", H);
    expect(err?.lista.map((x) => x.campo)).toEqual(["tipoDocumento", "numero", "vence"]);
    expect(err?.porCampo.tipoDocumento).toBe("Elija el tipo de documento.");
    expect(validarCargarOtro({ ...bien, tipoDocumento: "seguro" }, e, "u2", H)?.porCampo.tipoDocumento).toBe("Elija el tipo de documento.");
    expect(validarCargarOtro({ ...bien, tipoDocumento: "licencia" }, e, "u2", H)?.porCampo.tipoDocumento).toBe("Elija el tipo de documento.");
    expect(validarCargarOtro(bien, e, "u2", H)).toBeNull();
  });

  it("el comando es el de cargar documento de esa unidad, con el tipo elegido", () => {
    const c = comandoDeCargarOtro("u2", bien);
    expect(c).toMatchObject({ tipo: "cargarDocumento", titular: { tipo: "unidad", id: "u2" }, tipoDocumento: "habilitacion-proyecto", numero: "DEMO-HAB-1", emitido: null });
    const r = ejecutar(e, c, contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["documento-cargado"]);
  });

  it("el error del dominio sobre el tipo (ya cargado en otra pestaña) va al campo Tipo; el resto, a su campo o general", () => {
    const r = ejecutar(e, comandoDeCargarOtro("u1", { ...bien, tipoDocumento: "seguro" }), contexto());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(erroresDeNegocioCargarOtro(r.error).porCampo.tipoDocumento).toMatch(/^Ya hay cargado un documento «Seguro»/);
    const venc = ejecutar(e, comandoDeCargarOtro("u2", { ...bien, vence: "2099-01-01" }), contexto());
    if (!venc.ok) expect(erroresDeNegocioCargarOtro(venc.error).porCampo.vence).toBeDefined();
  });
});
