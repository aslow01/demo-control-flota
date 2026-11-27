// P19 en todas las vistas (QA D1 de la etapa 7): un parte cerrado sin salida (novedad crítica en la revisión) cierra el día de esa unidad. Un solo lugar de la lógica lo decide
// (`parteSinSalidaDeHoy`, que lee la aptitud) y la ficha, la flota, el centro de alertas, el inicio del conductor y los diálogos de resolver y de volver a servicio dicen lo mismo:
// la unidad no sale hasta mañana, aunque el encargado resuelva la novedad y la devuelva a servicio.
import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aptitud, resumenDeAptitud } from "../src/lib/dominio/aptitud.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { contextoDeVolverAServicio } from "../src/lib/dominio/formulario-ficha.ts";
import { contextoDeResolver } from "../src/lib/dominio/formulario-novedad.ts";
import { parteSinSalidaDeHoy, unidadSinSalidaHoy } from "../src/lib/dominio/parte.ts";
import { MOTIVO_APTITUD, textoNovedadResuelta } from "../src/lib/dominio/textos.ts";
import type { Estado, Perfil } from "../src/lib/dominio/tipos.ts";
import { centroDeAlertas } from "../src/lib/estado/centro-alertas.ts";
import { fichaDeUnidad } from "../src/lib/estado/ficha.ts";
import { panelDeFlota } from "../src/lib/estado/flota.ts";
import { inicioDelConductor } from "../src/lib/estado/conductor.ts";
import { checklistEnOrden, ejecutarOk, flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";
const MANANA = "2026-11-19";
const COND: Perfil = { tipo: "conductor", conductorId: "c1" };
const ENC: Perfil = { tipo: "encargado" };
const MOTIVO = "Sin salida hasta mañana (novedad crítica de hoy)";

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;

/** La revisión de hoy de ZK 214 BD con Frenos «Con novedad»: el parte queda cerrado sin salida y la unidad, fuera de servicio. */
function sinSalidaHoy(): Estado {
  const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
  const b: Borrador = { tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, checklist, otraNovedad: null };
  const g = ejecutarOk(flotaDePrueba(), b);
  return ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: g.cambios.partes[0]!.id, advertenciasAceptadas: [] }).estado;
}

/** El mismo día, con la novedad resuelta y la unidad de vuelta en servicio. */
function resueltoYDevuelto(): Estado {
  const e = sinSalidaHoy();
  return ejecutarOk(e, { tipo: "resolverNovedad", novedadId: e.novedades[0]!.id, texto: "Se cambiaron las pastillas", volverAServicio: true }).estado;
}

describe("parteSinSalidaDeHoy: el único lugar donde se decide P19", () => {
  const sin = (fecha: string, extra: Partial<Parameters<typeof parte>[0]> = {}) => parte({ id: "ss", unidadId: "u1", fecha, sinSalida: true, kmInicio: 84320, kmFin: 84320, ...extra });

  it("es el parte enviado de esa unidad, de hoy y sin salida", () => {
    expect(parteSinSalidaDeHoy([sin(H)], "u1", H)?.id).toBe("ss");
  });

  it("no es de ayer, ni de otra unidad, ni uno que salió, ni un borrador", () => {
    expect(parteSinSalidaDeHoy([sin("2026-11-17")], "u1", H)).toBeUndefined();
    expect(parteSinSalidaDeHoy([sin(H)], "u2", H)).toBeUndefined();
    expect(parteSinSalidaDeHoy([sin(H, { sinSalida: false })], "u1", H)).toBeUndefined();
    expect(parteSinSalidaDeHoy([sin(H, { estado: "borrador", enviado: null })], "u1", H)).toBeUndefined();
  });

  it("al día siguiente ya no rige", () => {
    expect(parteSinSalidaDeHoy([sin(H)], "u1", MANANA)).toBeUndefined();
  });

  it("un registro roto no lo rompe", () => {
    expect(parteSinSalidaDeHoy([null as never, { id: 5 } as never, sin(H)], "u1", H)?.id).toBe("ss");
  });
});

/** QA D2 (decisión de Matías del 22/11/2026): P19 cubre toda novedad crítica, también la que el encargado carga a mano con «Impide usar la unidad». */
function criticaALManoReparada(): Estado {
  const g = ejecutarOk(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pierde aceite fuerte", impideUso: true });
  return ejecutarOk(g.estado, { tipo: "resolverNovedad", novedadId: g.estado.novedades[0]!.id, texto: "Se cambió el cárter", volverAServicio: true }).estado;
}

describe("P19 ampliada: una crítica cargada a mano y reparada el mismo día también deja a la unidad sin salir hasta mañana", () => {
  it("el lugar único la reconoce, con o sin parte", () => {
    const e = criticaALManoReparada();
    expect(e.partes.some((p) => p.unidadId === "u1" && p.fecha === H)).toBe(false);
    expect(unidadSinSalidaHoy(e, "u1", H)).toBe(true);
    expect(unidadSinSalidaHoy(e, "u2", H)).toBe(false);
    expect(unidadSinSalidaHoy(e, "u1", MANANA)).toBe(false);
    expect(unidadSinSalidaHoy(resueltoYDevuelto(), "u1", H)).toBe(true);
  });

  it("la aptitud dice «no puede salir» con el motivo, y mañana «puede salir»", () => {
    const e = criticaALManoReparada();
    expect(e.unidades[0]?.estado.tipo).toBe("en-servicio");
    expect(aptitud(e.unidades[0]!, e, H)).toMatchObject({ categoria: "no-puede-salir", motivos: [{ tipo: "sin-salida-hoy", texto: MOTIVO }] });
    expect(aptitud(e.unidades[0]!, e, MANANA).categoria).toBe("puede-salir");
  });

  it("la ficha, la flota y el centro de alertas dicen lo mismo", () => {
    const e = criticaALManoReparada();
    const r = calcularAlertas(e, H);
    const f = fichaDeUnidad(e, r, H, "ZK214BD", ENC);
    if (!f.encontrada) throw new Error("sin ficha");
    expect(f.aptitud).toMatchObject({ categoria: "no-puede-salir", etiqueta: "Bloqueada", motivos: [MOTIVO] });
    expect(panelDeFlota(e, r, H).filas.find((x) => x.patente === "ZK214BD")?.estado).toMatchObject({ categoria: "no-puede-salir" });
    expect(centroDeAlertas(e, r, H, "Empresa de ejemplo").protagonista.items.find((x) => x.patente === "ZK214BD")).toMatchObject({ categoria: "no-puede-salir", motivo: MOTIVO });
  });

  it("el diálogo de resolver no promete que sale ese día (la crítica es de hoy)", () => {
    const g = ejecutarOk(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pierde aceite fuerte", impideUso: true });
    const c = contextoDeResolver(g.estado, g.estado.novedades[0]!.id, H);
    expect(c?.etiquetaVolverAServicio).toBe("Volver a servicio (sale desde mañana)");
    expect(c?.notaVolverAServicio).toContain("vuelve a salir a partir de mañana");
  });

  it("una crítica de un día anterior reparada hoy no cierra el día de hoy", () => {
    const e = criticaALManoReparada();
    expect(unidadSinSalidaHoy(e, "u1", "2026-11-20")).toBe(false);
  });

  it("una novedad normal cargada hoy no cierra el día", () => {
    const g = ejecutarOk(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Luz de patente quemada", impideUso: false });
    expect(unidadSinSalidaHoy(g.estado, "u1", H)).toBe(false);
    expect(aptitud(g.estado.unidades[0]!, g.estado, H).categoria).toBe("puede-salir");
  });
});

describe("la aptitud: devuelta a servicio, la unidad no puede salir hoy", () => {
  it("fuera de servicio por la novedad: sigue siendo «fuera de servicio»", () => {
    const e = sinSalidaHoy();
    expect(aptitud(e.unidades[0]!, e, H).categoria).toBe("fuera-de-servicio");
  });

  it("resuelta la novedad y devuelta a servicio el mismo día: «no puede salir», con el motivo de P19", () => {
    const e = resueltoYDevuelto();
    expect(e.unidades[0]?.estado.tipo).toBe("en-servicio");
    const a = aptitud(e.unidades[0]!, e, H);
    expect(a).toMatchObject({ categoria: "no-puede-salir", puedeSalir: false });
    expect(a.motivos).toEqual([{ tipo: "sin-salida-hoy", texto: MOTIVO }]);
    expect(MOTIVO_APTITUD.sinSalidaHoy).toBe(MOTIVO);
  });

  it("mañana la misma unidad puede salir", () => {
    const e = resueltoYDevuelto();
    expect(aptitud(e.unidades[0]!, e, MANANA).categoria).toBe("puede-salir");
  });

  it("se suma a los otros motivos (documentos vencidos) sin taparlos", () => {
    const e = resueltoYDevuelto();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    expect(aptitud(e.unidades[0]!, e, H).motivos.map((m) => m.tipo)).toEqual(["documento-vencido", "sin-salida-hoy"]);
  });

  it("cuenta en el resumen: no es una unidad disponible", () => {
    const e = resueltoYDevuelto();
    const r = resumenDeAptitud(e, H);
    expect(r.noPuedenSalir.map((u) => u.id)).toContain("u1");
    expect(r.disponibles).toBe(r.activas - r.protagonista);
  });
});

describe("todas las vistas dicen lo mismo", () => {
  const e = resueltoYDevuelto();
  const r = calcularAlertas(e, H);

  it("la ficha: «Bloqueada» con el motivo, y el primer botón sigue siendo «Ver el parte»", () => {
    const f = fichaDeUnidad(e, r, H, "ZK214BD", ENC);
    if (!f.encontrada) throw new Error("sin ficha");
    expect(f.aptitud).toMatchObject({ categoria: "no-puede-salir", etiqueta: "Bloqueada", motivos: [MOTIVO], linea: MOTIVO });
    expect(f.acciones.encabezado[0]).toMatchObject({ id: "cargar-parte", etiqueta: "Ver el parte" });
  });

  it("la flota: la fila no dice «Disponible»", () => {
    const fila = panelDeFlota(e, r, H).filas.find((x) => x.patente === "ZK214BD");
    expect(fila?.estado).toMatchObject({ categoria: "no-puede-salir", etiqueta: "Bloqueada" });
    expect(fila?.estado.motivos).toEqual([MOTIVO]);
  });

  it("el centro de alertas: la unidad figura entre las que no pueden salir hoy", () => {
    const item = centroDeAlertas(e, r, H, "Empresa de ejemplo").protagonista.items.find((x) => x.patente === "ZK214BD");
    expect(item).toMatchObject({ categoria: "no-puede-salir", motivo: MOTIVO });
  });

  it("el inicio del conductor: «hasta mañana»", () => {
    expect(inicioDelConductor(e, r, H, COND)?.hoyEstado).toMatchObject({ tipo: "enviado", hastaManana: "Aunque el encargado resuelva la novedad hoy, la unidad no vuelve a salir hasta mañana." });
  });

  it("mañana, la ficha y la flota dicen «Disponible»", () => {
    const rm = calcularAlertas(e, MANANA);
    const f = fichaDeUnidad(e, rm, MANANA, "ZK214BD", ENC);
    if (!f.encontrada) throw new Error("sin ficha");
    expect(f.aptitud.categoria).toBe("puede-salir");
    expect(panelDeFlota(e, rm, MANANA).filas.find((x) => x.patente === "ZK214BD")?.estado.categoria).toBe("puede-salir");
  });
});

describe("el diálogo de resolver no promete que la unidad vuelve ese día", () => {
  it("con el parte de hoy sin salida: la nota y la casilla dicen que sale desde mañana", () => {
    const e = sinSalidaHoy();
    const c = contextoDeResolver(e, e.novedades[0]!.id, H);
    expect(c?.ofreceVolverAServicio).toBe(true);
    expect(c?.notaVolverAServicio).toBe("ZK 214 BD está fuera de servicio por esta novedad. Con la casilla marcada, queda en servicio, pero no sale hoy: vuelve a salir a partir de mañana.");
    expect(c?.etiquetaVolverAServicio).toBe("Volver a servicio (sale desde mañana)");
    expect(`${c?.notaVolverAServicio} ${c?.etiquetaVolverAServicio}`).not.toMatch(/ahora|vuelve a servicio al resolverla/);
  });

  it("al día siguiente (la novedad quedó abierta de ayer) dice lo de siempre", () => {
    const e = sinSalidaHoy();
    const c = contextoDeResolver(e, e.novedades[0]!.id, MANANA);
    expect(c?.notaVolverAServicio).toBe("ZK 214 BD está fuera de servicio por esta novedad. Con la casilla marcada, vuelve a servicio al resolverla.");
    expect(c?.etiquetaVolverAServicio).toBe("Volver a servicio ahora");
  });

  it("una novedad crítica cargada a mano de un día anterior (sin parte sin salida hoy): dice lo de siempre", () => {
    const g = ejecutarOk(flotaDePrueba(), { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pierde aceite fuerte", impideUso: true });
    const c = contextoDeResolver(g.estado, g.estado.novedades[0]!.id, MANANA);
    expect(c?.notaVolverAServicio).toBe("ZK 214 BD está fuera de servicio por esta novedad. Con la casilla marcada, vuelve a servicio al resolverla.");
    expect(c?.etiquetaVolverAServicio).toBe("Volver a servicio ahora");
  });

  it("el mensaje de la barra de estado al resolver y volver dice que no sale hasta mañana", () => {
    expect(textoNovedadResuelta("Frenos", "ZK 214 BD", true, false, true)).toBe("Novedad resuelta: Frenos. ZK 214 BD vuelve a servicio, pero no sale hasta mañana.");
    expect(textoNovedadResuelta("Frenos", "ZK 214 BD", true)).toBe("Novedad resuelta: Frenos. ZK 214 BD vuelve a servicio.");
  });
});

describe("el diálogo «Volver a servicio» también lo avisa", () => {
  it("con un parte sin salida de hoy, lo dice; mañana, no", () => {
    const e = sinSalidaHoy();
    // la novedad ya se resolvió, pero la unidad sigue fuera de servicio: solo falta devolverla
    const resuelta = { ...e, novedades: e.novedades.map((n) => ({ ...n, estado: "resuelta" as const })) };
    expect(contextoDeVolverAServicio(resuelta, "u1", H)?.aviso).toBe("La unidad vuelve a servicio, pero no vuelve a salir hasta mañana: hoy tuvo una novedad crítica.");
    expect(contextoDeVolverAServicio(resuelta, "u1", MANANA)?.aviso).toBeNull();
  });
});
