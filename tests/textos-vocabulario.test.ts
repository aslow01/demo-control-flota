// Vocabulario único del porte «tipo app» (E0-R): los nombres de las pantallas y los textos del marco nuevo que todavía no usa ninguna pantalla.
// Estos tests fijan las palabras que decidió Matías (25/11/2026), para que E1 las tome de acá y no las repita en otro lado.
import { describe, expect, it } from "vitest";
import {
  TEXTO_APARIENCIA,
  TEXTO_LATERAL,
  TEXTO_MAS,
  TEXTO_NAVEGACION,
  TEXTO_NOMBRES_DE_LA_REGLA,
  TEXTO_SELLO_DE_DATOS,
  textoNombreDeLlave,
  textoNombreDeYMas,
  textoNombreDelSello,
} from "../src/componentes/textos-marco.ts";
import {
  NOMBRES_DE_PANTALLA,
  TEXTO_FLOTA,
  TEXTO_INICIO,
  TEXTO_REGLA,
  TEXTO_VEREDICTO,
  textoAnuncioAlResolver,
  textoCota,
  textoDesgloseNoDisponibles,
  textoDisponibles,
  textoDocumentoRenovado,
  textoLectorDeLaRegla,
  textoProtagonista,
  textoProtagonistaLector,
} from "../src/lib/dominio/textos.ts";

describe("nombres de las pantallas del marco nuevo", () => {
  it("las secciones del encargado y del conductor", () => {
    expect([NOMBRES_DE_PANTALLA.inicio, NOMBRES_DE_PANTALLA.movilidades, NOMBRES_DE_PANTALLA.operacion, NOMBRES_DE_PANTALLA.vencimientos, NOMBRES_DE_PANTALLA.mas]).toEqual([
      "Inicio",
      "Movilidades",
      "Operación diaria",
      "Vencimientos",
      "Más",
    ]);
    expect([NOMBRES_DE_PANTALLA.operacionPartes, NOMBRES_DE_PANTALLA.operacionNovedades]).toEqual(["Partes", "Novedades"]);
    expect([NOMBRES_DE_PANTALLA.conductor, NOMBRES_DE_PANTALLA.conductorPartes]).toEqual(["Hoy", "Mis partes"]);
  });

  it("la unidad y el parte llevan su dato", () => {
    expect(NOMBRES_DE_PANTALLA.unidad("ZK 214 BD")).toBe("Unidad ZK 214 BD");
    expect(NOMBRES_DE_PANTALLA.parteDelDia("miércoles 18/11/2026")).toBe("Parte del miércoles 18/11/2026");
  });
});

describe("vocabulario único: «No disponibles hoy» = bloqueadas por documentos + fuera de servicio", () => {
  it("la cifra, el desglose y los filtros dicen las mismas palabras", () => {
    expect(textoProtagonista(4)).toBe("4 unidades no disponibles hoy");
    expect(textoDesgloseNoDisponibles(2, 2)).toBe("2 bloqueadas por documentos · 2 fuera de servicio");
    expect(TEXTO_FLOTA.filtros["no-disponibles"]).toBe("No disponibles hoy");
    expect(TEXTO_FLOTA.filtros["no-pueden-salir"]).toBe("Bloqueadas por documentos");
    expect(TEXTO_FLOTA.filtros["pueden-salir"]).toBe("Disponibles");
    expect(TEXTO_FLOTA.estado).toMatchObject({ "puede-salir": "Disponible", "no-puede-salir": "Bloqueada", "fuera-de-servicio": "Fuera de servicio" });
  });
});

describe("textos del marco nuevo", () => {
  it("«Volver a …», el chip del perfil y las insignias, con singular y plural", () => {
    expect(TEXTO_NAVEGACION.volverA("Movilidades")).toBe("Volver a Movilidades");
    expect(TEXTO_NAVEGACION.chipPerfil("Encargado")).toBe("Ver como Encargado, cambiar perfil");
    expect(TEXTO_NAVEGACION.insignias.alertasCriticas(1)).toBe("1 alerta crítica");
    expect(TEXTO_NAVEGACION.insignias.alertasCriticas(4)).toBe("4 alertas críticas");
    expect(TEXTO_NAVEGACION.insignias.vencidosOFaltantes(3)).toBe("3 vencidos o faltantes");
    expect(TEXTO_NAVEGACION.insignias.pendientes(1)).toBe("1 pendiente");
    expect(TEXTO_NAVEGACION.insignias.abiertas(2)).toBe("2 abiertas");
    expect(TEXTO_NAVEGACION.insignias.noDisponibles(1)).toBe("1 no disponible hoy");
    expect(TEXTO_NAVEGACION.insignias.noDisponibles(4)).toBe("4 no disponibles hoy");
  });

  it("«Más» y «Ver como»", () => {
    expect(TEXTO_MAS.verComo.titulo).toBe("Ver como");
    expect(TEXTO_MAS.verComo.conductorDescripcion("Tamara Olivera", "ZK 214 BD")).toBe("Tamara Olivera (persona ficticia) · unidad ZK 214 BD");
    expect(TEXTO_MAS.laDemo.titulo).toBe("La demo");
  });
});

// ---------- Textos nuevos de la piel «Pie de rey» (etapa 2, docs/diseno-ui.md 15.14) ----------

/** Todas las cadenas (a cualquier profundidad) de un objeto de textos; las funciones se prueban aparte. */
function cadenas(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (valor !== null && typeof valor === "object") return Object.values(valor).flatMap(cadenas);
  return [];
}

describe("regla de salida: los textos de la tabla 15.14", () => {
  it("rótulos fijos", () => {
    expect(TEXTO_REGLA.titulo).toBe("Disponibles hoy");
    expect(TEXTO_REGLA.titulo.length).toBeLessThanOrEqual(15); // el corte de la mordaza angosta está calculado para 15 caracteres
    expect(TEXTO_REGLA.accionDelDia).toBe("Acción del día");
    expect(TEXTO_REGLA.accionDelDia.length).toBeLessThanOrEqual(16);
    expect(TEXTO_REGLA.listaCompleta).toBe("Unidades activas");
    expect(TEXTO_REGLA.resumen).toBe("Resumen de hoy");
    expect(TEXTO_REGLA.ayudaTeclado).toBe("Use las flechas para recorrer las unidades.");
    expect(TEXTO_REGLA.ayudaTeclado.length).toBeLessThanOrEqual(60);
  });

  it("flota vacía: mensaje, ayuda y enlace (no reutiliza «Todavía no hay unidades.»)", () => {
    expect(TEXTO_REGLA.sinActivas).toBe("No hay unidades activas.");
    expect(TEXTO_REGLA.sinActivasAyuda).toBe("Aquí se verá cuántas pueden salir hoy.");
    expect(TEXTO_REGLA.sinActivasEnlace).toBe("Agregar una unidad en Movilidades");
    expect(TEXTO_REGLA.sinActivas).not.toBe(TEXTO_FLOTA.sinUnidades);
  });

  it("cota de la zona roja, con singular y plural, y sin pasarse de 12 caracteres", () => {
    expect(textoCota(4)).toBe("4 unidades");
    expect(textoCota(1)).toBe("1 unidad");
    expect(textoCota(100)).toBe("100 unidades");
    expect(textoCota(100).length).toBeLessThanOrEqual(12);
  });

  it("párrafo para lectores (filas 2 y 2b): valor final y desglose", () => {
    expect(textoLectorDeLaRegla(19, 23, 2, 2)).toBe(
      "Disponibles hoy: 19 de 23 unidades activas. 4 unidades no disponibles hoy: 2 bloqueadas por documentos · 2 fuera de servicio.",
    );
    expect(textoLectorDeLaRegla(22, 23, 0, 1)).toBe("Disponibles hoy: 22 de 23 unidades activas. 1 unidad no disponible hoy: 0 bloqueadas por documentos · 1 fuera de servicio.");
    expect(textoLectorDeLaRegla(23, 23, 0, 0)).toBe("Disponibles hoy: 23 de 23 unidades activas. Ninguna unidad bloqueada ni fuera de servicio.");
    // Se arma con las mismas piezas que el resto de la aplicación: no hay dos copias que puedan separarse.
    expect(textoLectorDeLaRegla(19, 23, 2, 2).startsWith(textoDisponibles(19, 23))).toBe(true);
    expect(textoLectorDeLaRegla(19, 23, 2, 2)).toContain(textoProtagonista(4));
    expect(textoLectorDeLaRegla(23, 23, 0, 0)).toContain(TEXTO_INICIO.sinNoDisponibles);
  });

  it("anuncio al resolver (fila 20): el mensaje que ya da el diálogo y la medida nueva", () => {
    expect(textoAnuncioAlResolver(textoDocumentoRenovado("seguro", "ZK 214 BD"), 20, 23)).toBe("Seguro de ZK 214 BD renovado. Disponibles hoy: 20 de 23 unidades activas.");
  });

  it("«en orden» (fila 19) es la frase que ya existe", () => {
    expect(textoProtagonistaLector(0)).toBe("Todas las unidades activas están disponibles hoy.");
  });
});

describe("regla de salida: nombres accesibles (filas 5, 7, 8, 8b y 11)", () => {
  it("sello: empieza con lo que se ve y resuelve el singular", () => {
    expect(textoNombreDelSello(4)).toBe("4 no disponibles hoy: ver en Movilidades");
    expect(textoNombreDelSello(1)).toBe("1 no disponible hoy: ver en Movilidades");
  });

  it("sello con el desglose a la vista: el nombre lo contiene (WCAG 2.5.3; axe, label-content-name-mismatch), así lo que se ve es parte de lo que se oye", () => {
    expect(textoNombreDelSello(4, "2 bloqueadas por documentos · 2 fuera de servicio")).toBe(
      "4 no disponibles hoy: 2 bloqueadas por documentos · 2 fuera de servicio: ver en Movilidades",
    );
  });

  it("llave disponible: patente, estado en minúscula y «Ver ficha»", () => {
    expect(textoNombreDeLlave({ patenteTexto: "ZT 301 KA", etiqueta: "Disponible", motivo: null, pieza: null })).toBe("ZT 301 KA, disponible. Ver ficha.");
  });

  it("llave no disponible: estado, motivo, número de pieza y «Ver ficha»", () => {
    const l = { patenteTexto: "ZK 214 BD", etiqueta: "Bloqueada", motivo: "Seguro vencido hace 1 día", pieza: 1 };
    expect(textoNombreDeLlave(l)).toBe("ZK 214 BD, bloqueada. Seguro vencido hace 1 día. Número 1. Ver ficha.");
    expect(textoNombreDeLlave(l, false)).toBe("ZK 214 BD, bloqueada. Seguro vencido hace 1 día. Ver ficha.");
  });

  it("un estado de varias palabras queda en minúscula", () => {
    expect(textoNombreDeLlave({ patenteTexto: "ZZ 563 DD", etiqueta: "Fuera de servicio", motivo: "Desde el 10/11/2026: en taller", pieza: 3 })).toBe(
      "ZZ 563 DD, fuera de servicio. Desde el 10/11/2026: en taller. Número 3. Ver ficha.",
    );
  });

  it("«y N más»: lo visible y el resto del nombre se leen «y 3 más no disponibles hoy: ver en Movilidades»", () => {
    expect(textoNombreDeYMas(3)).toBe("y 3 más no disponibles hoy: ver en Movilidades");
  });
});

describe("Hoy: veredictos (DE3, opción B: solo donde hay algo que decidir)", () => {
  it("los cuatro textos", () => {
    expect(TEXTO_VEREDICTO).toEqual({ sale: "Puede salir", noSale: "No puede salir hoy", sinLicencia: "Sin licencia vigente", cierrePendiente: "Cierre pendiente" });
  });

  it("caben en el pie de la llave (tope de 16 caracteres) y no repiten el aviso que sigue («No puede manejar hoy: …»)", () => {
    expect(TEXTO_VEREDICTO.sale.length).toBeLessThanOrEqual(14);
    expect(TEXTO_VEREDICTO.cierrePendiente.length).toBeLessThanOrEqual(16);
    expect(TEXTO_VEREDICTO.sinLicencia).not.toMatch(/manejar/);
  });
});

describe("marco: «Apariencia», lateral y sello", () => {
  it("apariencia: título, tema, nota y botón de movimiento", () => {
    expect(TEXTO_APARIENCIA.titulo).toBe("Apariencia");
    expect(TEXTO_APARIENCIA.tema).toEqual({ leyenda: "Tema", claro: "Claro", oscuro: "Oscuro", automatico: "Automático", automaticoCorto: "Auto" });
    expect(TEXTO_APARIENCIA.tema.automatico).toContain(TEXTO_APARIENCIA.tema.automaticoCorto); // el nombre accesible contiene el texto visible (WCAG 2.5.3)
    expect(TEXTO_APARIENCIA.notaAutomatico).toBe("Automático: sigue el tema del dispositivo.");
    expect(TEXTO_APARIENCIA.sinAnimaciones).toBe("Sin animaciones");
  });

  it("lateral (DE2): «Flota» y «Operación»; sello «Datos ficticios» (15 caracteres como máximo)", () => {
    expect(TEXTO_LATERAL).toEqual({ flota: "Flota", operacion: "Operación" });
    expect(TEXTO_SELLO_DE_DATOS).toBe("Datos ficticios");
    expect(TEXTO_SELLO_DE_DATOS.length).toBeLessThanOrEqual(15);
  });

  it("ningún nombre accesible nuevo empieza con «Ver como» (lo busca una prueba de punta a punta) ni usa voseo", () => {
    const nuevos = [
      ...cadenas(TEXTO_REGLA),
      ...cadenas(TEXTO_NOMBRES_DE_LA_REGLA),
      TEXTO_NOMBRES_DE_LA_REGLA.numero(3),
      ...cadenas(TEXTO_VEREDICTO),
      ...cadenas(TEXTO_APARIENCIA),
      ...cadenas(TEXTO_LATERAL),
      TEXTO_SELLO_DE_DATOS,
      textoNombreDelSello(4),
      textoNombreDeYMas(3),
      textoNombreDeLlave({ patenteTexto: "ZK 214 BD", etiqueta: "Bloqueada", motivo: "Seguro vencido hace 1 día", pieza: 1 }),
      textoNombreDeLlave({ patenteTexto: "ZT 301 KA", etiqueta: "Disponible", motivo: null, pieza: null }),
      textoCota(4),
    ];
    for (const texto of nuevos) {
      expect(texto, texto).not.toMatch(/^Ver como/);
      expect(texto, texto).not.toMatch(/\b(vos|tenés|podés|querés|hacé|mirá|elegí|usá|agregá)\b/i);
    }
  });
});