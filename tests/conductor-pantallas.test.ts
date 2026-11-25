// E2-P (3.10): lo que piden las pantallas del conductor en la interfaz nueva: el aviso de que un documento de su unidad vence pronto (o hoy) y «Mis partes» como
// pantalla propia. Funciones puras sobre el estado, con la flota de prueba (u1 es de c1 y está al día).
import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Estado, Perfil, TipoDocumento } from "../src/lib/dominio/tipos.ts";
import { DIAS_DE_AVISO_DE_VENCIMIENTO, PARTES_EN_HOY, inicioDelConductor, misPartes } from "../src/lib/estado/parte.ts";
import { flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";
const COND: Perfil = { tipo: "conductor", conductorId: "c1" };
const ENC: Perfil = { tipo: "encargado" };

const inicio = (e: Estado, perfil: Perfil = COND, elegida: string | null = null) => inicioDelConductor(e, calcularAlertas(e, H), H, perfil, elegida);

/** La flota de prueba con el documento de u1 vencimiento en `dias` (0 = hoy, negativo = ya venció). */
function conVencimiento(tipo: TipoDocumento, dias: number, unidadId = "u1", base: Estado = flotaDePrueba()): Estado {
  return { ...base, documentos: base.documentos.map((d) => (d.id === `${unidadId}-${tipo}` ? { ...d, vence: sumarDias(H, dias) } : d)) };
}

describe("aviso de que un documento de la unidad vence pronto (3.10)", () => {
  it("la regla de aviso es de 7 días", () => {
    expect(DIAS_DE_AVISO_DE_VENCIMIENTO).toBe(7);
  });

  it("sin vencimientos cerca no hay aviso", () => {
    expect(inicio(flotaDePrueba())?.avisoDeUnidad).toBeNull();
  });

  it("«La revisión técnica vence hoy»: dice cuál, que es hoy, la fecha y el estado de siempre", () => {
    const v = inicio(conVencimiento("revision-tecnica", 0));
    expect(v?.hoyEstado.tipo).toBe("sin-parte");
    expect(v?.avisoDeUnidad).toEqual({
      tipoDocumento: "revision-tecnica",
      documento: "Revisión técnica",
      dias: 0,
      venceHoy: true,
      vence: "18/11/2026",
      estado: "Vence hoy",
    });
  });

  it("la unidad todavía puede salir hoy: el aviso no bloquea (A2) y el botón de empezar sigue", () => {
    const v = inicio(conVencimiento("revision-tecnica", 0));
    expect(v?.avisoAptitud).toBeNull();
    expect(v?.hoyEstado).toMatchObject({ tipo: "sin-parte", primario: { texto: "Empezar la revisión" } });
  });

  it("en 3 días: el mismo aviso, sin «hoy»", () => {
    expect(inicio(conVencimiento("seguro", 3))?.avisoDeUnidad).toEqual({
      tipoDocumento: "seguro",
      documento: "Seguro",
      dias: 3,
      venceHoy: false,
      vence: "21/11/2026",
      estado: "Vence en 3 días",
    });
  });

  it("el límite: a 7 días avisa y a 8 no", () => {
    expect(inicio(conVencimiento("matafuego", 7))?.avisoDeUnidad).toMatchObject({ dias: 7, venceHoy: false });
    expect(inicio(conVencimiento("matafuego", 8))?.avisoDeUnidad).toBeNull();
  });

  it("con varios, avisa el que vence primero", () => {
    const e = conVencimiento("seguro", 5, "u1", conVencimiento("matafuego", 2));
    expect(inicio(e)?.avisoDeUnidad).toMatchObject({ tipoDocumento: "matafuego", dias: 2 });
    const hoy = conVencimiento("revision-tecnica", 0, "u1", e);
    expect(inicio(hoy)?.avisoDeUnidad).toMatchObject({ tipoDocumento: "revision-tecnica", dias: 0 });
  });

  it("un documento ya vencido no es un aviso: bloquea y lo explica el estado «no puede salir»", () => {
    const v = inicio(conVencimiento("seguro", -1));
    expect(v?.hoyEstado.tipo).toBe("no-puede-salir");
    expect(v?.avisoDeUnidad).toBeNull();
  });

  it("la licencia del conductor no cuenta acá: tiene su propio panel", () => {
    const e = { ...flotaDePrueba(), documentos: flotaDePrueba().documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence: sumarDias(H, 2) } : d)) };
    const v = inicio(e);
    expect(v?.avisoDeUnidad).toBeNull();
    expect(v?.licencia).not.toBeNull();
  });

  it("mira la unidad que se está usando (la elegida con «Usar otra unidad»), no solo la asignada", () => {
    const e = conVencimiento("seguro", 1, "u2");
    expect(inicio(e)?.avisoDeUnidad).toBeNull();
    expect(inicio(e, COND, "u2")?.avisoDeUnidad).toMatchObject({ tipoDocumento: "seguro", dias: 1 });
  });

  it("solo cuando se puede empezar o seguir la revisión: con el parte en uso o cerrado ya no se avisa", () => {
    const base = conVencimiento("revision-tecnica", 0);
    const enUso: Estado = { ...base, partes: [...base.partes, parte({ id: "hoy-u1", fecha: H, estado: "en-uso", kmFin: null, combustible: null, enviado: null })] };
    expect(inicio(enUso)?.hoyEstado.tipo).toBe("en-uso");
    expect(inicio(enUso)?.avisoDeUnidad).toBeNull();
    const cerrado: Estado = { ...base, partes: [...base.partes, parte({ id: "hoy-u1", fecha: H })] };
    expect(inicio(cerrado)?.hoyEstado.tipo).toBe("enviado");
    expect(inicio(cerrado)?.avisoDeUnidad).toBeNull();
  });

  it("con un borrador de hoy también avisa (se puede seguir la revisión)", () => {
    const base = conVencimiento("seguro", 0);
    const conBorrador: Estado = { ...base, partes: [...base.partes, parte({ id: "borr", fecha: H, estado: "borrador", kmFin: null, combustible: null, enviado: null, revisado: null })] };
    expect(inicio(conBorrador)?.hoyEstado.tipo).toBe("borrador");
    expect(inicio(conBorrador)?.avisoDeUnidad).toMatchObject({ venceHoy: true });
  });

  it("sin unidad asignada no hay aviso", () => {
    const base = flotaDePrueba();
    const sin: Estado = { ...base, unidades: base.unidades.map((u) => (u.id === "u1" ? { ...u, conductorId: null } : u)) };
    const v = inicio(sin);
    expect(v?.hoyEstado.tipo).toBe("sin-unidad");
    expect(v?.avisoDeUnidad).toBeNull();
  });
});

describe("«Ver todos» de «Mis últimos partes» (3.10)", () => {
  it("el panel de Hoy muestra tres y el enlace lleva a Mis partes", () => {
    expect(PARTES_EN_HOY).toBe(3);
    const e = flotaDePrueba();
    expect(inicio(e)?.ultimosPartes.verTodos).toEqual({ href: "#/conductor/partes" });
  });

  it("sin partes cerrados no hay enlace (nada que ver)", () => {
    const e = { ...flotaDePrueba(), partes: [] };
    expect(inicio(e)?.ultimosPartes.verTodos).toBeNull();
  });
});

describe("Mis partes como pantalla propia (3.10)", () => {
  const conSiete = (): Estado => {
    const e = flotaDePrueba();
    const partes = [] as Estado["partes"];
    for (let i = 1; i <= 7; i++) {
      const fecha = `2026-11-${String(10 + i).padStart(2, "0")}`;
      partes.push(parte({ id: `h${i}`, fecha, kmInicio: 1000, kmFin: 1000 + i * 10, unidadId: "u1", conductorId: "c1", enviado: `${fecha}T21:00:00.000Z` }));
    }
    partes.push(parte({ id: "otro", fecha: "2026-11-17", conductorId: "c2", unidadId: "u2" }));
    partes.push(parte({ id: "borr", estado: "borrador", enviado: null, fecha: "2026-11-16", conductorId: "c1", unidadId: "u1" }));
    return { ...e, partes };
  };
  const mis = (e: Estado, perfil: Perfil = COND) => misPartes(e, perfil);

  it("el encargado no tiene esta pantalla", () => {
    expect(mis(flotaDePrueba(), ENC)).toBeNull();
  });

  it("un conductor que no existe tampoco", () => {
    expect(mis(flotaDePrueba(), { tipo: "conductor", conductorId: "nadie" })).toBeNull();
  });

  it("título, el nombre del conductor y los últimos cinco partes cerrados, el más nuevo primero", () => {
    const v = mis(conSiete());
    expect(v?.titulo).toBe("Mis partes");
    expect(v?.conductor).toBe("Luis Ferreyra");
    expect(v?.filas.map((f) => f.parteId)).toEqual(["h7", "h6", "h5", "h4", "h3"]);
    expect(v?.filas[0]).toEqual({ parteId: "h7", fecha: "17/11/2026", patenteTexto: "ZK 214 BD", recorrido: "70 km", href: "#/parte/ZK214BD/2026-11-17" });
    expect(v?.vacio).toBeNull();
  });

  it("son las mismas filas que «Mis últimos partes» de Hoy: una sola lista, dos pantallas", () => {
    const e = conSiete();
    expect(mis(e)?.filas).toEqual(inicio(e)?.ultimosPartes.filas);
  });

  it("no mezcla partes de otro conductor ni borradores", () => {
    const ids = mis(conSiete())?.filas.map((f) => f.parteId) ?? [];
    expect(ids).not.toContain("otro");
    expect(ids).not.toContain("borr");
  });

  it("sin partes cerrados: el vacío de siempre y ninguna fila", () => {
    const v = mis({ ...flotaDePrueba(), partes: [] });
    expect(v?.filas).toEqual([]);
    expect(v?.vacio).toBe("Todavía no cerró partes. Los últimos cinco aparecerán aquí.");
  });

  it("un parte sin salida dice «Sin uso»", () => {
    const e = flotaDePrueba();
    const v = mis({ ...e, partes: [...e.partes, parte({ id: "x", fecha: "2026-11-16", kmInicio: 500, kmFin: 500 })] });
    expect(v?.filas.find((f) => f.parteId === "x")?.recorrido).toBe("Sin uso");
  });

  it("un parte con datos rotos no se muestra ni rompe la pantalla", () => {
    const e = flotaDePrueba();
    const roto = { ...parte({ id: "roto", fecha: "2026-11-16" }), kmInicio: "mucho" } as unknown as Estado["partes"][number];
    const v = mis({ ...e, partes: [...e.partes, roto] });
    expect(v?.filas.map((f) => f.parteId)).not.toContain("roto");
  });
});
