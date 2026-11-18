import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import type { Parte, RespuestaItem } from "../src/lib/dominio/tipos.ts";
import { checklistEnOrden, contexto, ejecutarOk, flotaDePrueba } from "./ayuda.ts";

// M6: los comandos copian lo que reciben. La interfaz reutiliza su objeto de formulario (en Svelte 5 es un proxy): si el
// estado guardara la misma referencia, mutar el formulario después cambiaría el estado por la espalda.

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;

function borradorCon(checklist: Parte["checklist"], otraNovedad: Parte["otraNovedad"]): Borrador {
  return {
    tipo: "guardarBorrador",
    parteId: null,
    unidadId: "u1",
    fecha: "2026-11-18",
    conductorId: "c1",
    kmInicio: 84320,
    kmFin: 84400,
    combustible: "medio",
    litrosCargados: null,
    checklist,
    otraNovedad,
  };
}

describe("M6: guardarBorrador no guarda por referencia lo que recibe", () => {
  it("mutar el checklist y la otra novedad después de guardar no cambia el borrador guardado", () => {
    const checklist = checklistEnOrden();
    checklist.frenos = { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false };
    const otra = { descripcion: "Ruido en la puerta", impideUso: false };
    const r = ejecutarOk(flotaDePrueba(), borradorCon(checklist, otra));
    const guardado = r.estado.partes.find((p) => p.estado === "borrador");

    // el "formulario" sigue vivo y cambia
    checklist.frenos = { estado: "en-orden" };
    checklist.luces = { estado: "sin-responder" };
    otra.descripcion = "Otra cosa";
    otra.impideUso = true;

    expect(guardado?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "Pedal blando", impideUso: false });
    expect(guardado?.checklist.luces).toEqual({ estado: "en-orden" });
    expect(guardado?.otraNovedad).toEqual({ descripcion: "Ruido en la puerta", impideUso: false });
    // lo que devuelve `cambios` es lo mismo que está en el estado
    expect(r.cambios.partes[0]?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "Pedal blando", impideUso: false });
  });

  it("mutar una respuesta con novedad (el objeto interno) tampoco lo cambia", () => {
    const frenos: RespuestaItem = { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false };
    const checklist = { ...checklistEnOrden(), frenos };
    const r = ejecutarOk(flotaDePrueba(), borradorCon(checklist, null));
    if (frenos.estado === "con-novedad") frenos.descripcion = "Cambiada";
    const guardado = r.estado.partes.find((p) => p.estado === "borrador");
    expect(guardado?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "Pedal blando", impideUso: false });
  });

  it("el parte guardado no comparte objetos con la entrada", () => {
    const checklist = checklistEnOrden();
    const otra = { descripcion: "Ruido", impideUso: false };
    const r = ejecutarOk(flotaDePrueba(), borradorCon(checklist, otra));
    const guardado = r.estado.partes.find((p) => p.estado === "borrador");
    expect(guardado?.checklist).not.toBe(checklist);
    expect(guardado?.otraNovedad).not.toBe(otra);
    for (const k of Object.keys(checklist) as (keyof typeof checklist)[]) expect(guardado?.checklist[k]).not.toBe(checklist[k]);
  });

  it("solo se guardan los campos conocidos (una propiedad de más en la entrada no pasa al estado)", () => {
    const checklist = checklistEnOrden();
    (checklist.frenos as unknown as Record<string, unknown>)["extra"] = "x";
    const otra = { descripcion: "Ruido", impideUso: false, extra: "y" };
    const r = ejecutarOk(flotaDePrueba(), borradorCon(checklist, otra));
    const guardado = r.estado.partes.find((p) => p.estado === "borrador");
    expect(guardado?.checklist.frenos).toEqual({ estado: "en-orden" });
    expect(guardado?.otraNovedad).toEqual({ descripcion: "Ruido", impideUso: false });
  });
});

describe("M6: cargarDocumento no guarda por referencia el titular", () => {
  it("mutar el titular después de cargar no cambia el documento guardado", () => {
    const titular = { tipo: "unidad" as const, id: "u1" };
    const estado = flotaDePrueba();
    estado.documentos = estado.documentos.filter((d) => !(d.titular.id === "u1" && d.tipo === "matafuego"));
    const r = ejecutarOk(estado, {
      tipo: "cargarDocumento",
      titular,
      tipoDocumento: "matafuego",
      numero: "DEMO-MF-1",
      emisor: "Recargas Demo",
      vence: "2027-05-01",
      emitido: null,
    });
    titular.id = "u2";
    const guardado = r.estado.documentos.find((d) => d.numero === "DEMO-MF-1");
    expect(guardado?.titular).toEqual({ tipo: "unidad", id: "u1" });
    expect(r.cambios.documentos[0]?.titular).toEqual({ tipo: "unidad", id: "u1" });
  });
});

describe("M6: los eventos no comparten arreglos ni objetos con el estado", () => {
  it("el evento de fuera de servicio por novedad crítica tiene su propia copia de novedadIds", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(
      e,
      { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pérdida de aceite en el motor", impideUso: true },
      contexto(),
    );
    const unidad = r.estado.unidades.find((u) => u.id === "u1");
    const evento = r.eventos.find((x) => x.tipo === "fuera-de-servicio");
    expect(unidad?.estado.tipo).toBe("fuera-de-servicio");
    expect(evento).toBeDefined();
    if (unidad?.estado.tipo !== "fuera-de-servicio") return;
    const idsEnEvento = (evento?.datos as { novedadIds: string[] }).novedadIds;
    expect(idsEnEvento).toEqual(unidad.estado.novedadIds);
    expect(idsEnEvento).not.toBe(unidad.estado.novedadIds);
  });

  it("el evento de novedad abierta no comparte el origen con la novedad", () => {
    const r = ejecutarOk(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Rayón en la puerta", impideUso: false });
    const novedad = r.estado.novedades.find((n) => n.descripcion === "Rayón en la puerta");
    const evento = r.eventos.find((x) => x.tipo === "novedad-abierta");
    const origen = (evento?.datos as { origen: unknown }).origen;
    expect(origen).toEqual(novedad?.origen);
    expect(origen).not.toBe(novedad?.origen);
  });
});
