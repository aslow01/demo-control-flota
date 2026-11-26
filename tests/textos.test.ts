import { describe, expect, it } from "vitest";
import { renglonesDeAvisosAceptados } from "../src/lib/dominio/parte.ts";
import {
  ERRORES,
  RESUMEN_EVENTO,
  TEXTO_ALERTA,
  TEXTO_AVISO,
  TEXTO_ERROR_ARRANQUE,
  TEXTO_GRUPO_OPERACION,
  TEXTO_INICIO,
  TEXTO_LEYENDA_HORIZONTE,
  TEXTO_PARTE,
  TEXTO_VACIO_PANTALLAS,
  textoContextoOperacion,
  textoContextoVencimientos,
  textoLeyendaConCantidad,
  errDocumentoExistente,
  errKmCorreccionAnterior,
  errKmExcedido,
  errKmFinMenor,
  errKmSuperaSiguiente,
  errLitrosInvalidos,
  errNovedadesCriticasAbiertas,
  errParteDuplicado,
  errUnidadFueraDeServicio,
  MOTIVO_NOVEDAD_CRITICA,
  errConductorConParteSinCerrar,
  errParteAnteriorSinCerrar,
  textoParteSinCerrarDeLaUnidad,
  formatearKm,
  pluralizar,
  textoAdvertencia,
  errDocumentacionDeLaUnidad,
  textoDocumentacionDeLaUnidad,
  textoOpcionDeConductor,
  textoDisponibles,
  textoFaltantes,
  textoHoy,
  textoHorizonte,
  textoLeFaltan,
  textoProtagonista,
  textoQuedanVencimientos,
  textoUltimoRegistro,
  textoDatosDeOtraFecha,
  textoVencimiento,
} from "../src/lib/dominio/textos.ts";

describe("pluralizar", () => {
  it("singular solo con 1; cero y el resto van en plural", () => {
    expect(pluralizar(1, "día", "días")).toBe("1 día");
    expect(pluralizar(0, "día", "días")).toBe("0 días");
    expect(pluralizar(2, "día", "días")).toBe("2 días");
    expect(pluralizar(30, "unidad", "unidades")).toBe("30 unidades");
  });
});

describe("formatearKm", () => {
  it("punto de miles", () => {
    expect(formatearKm(999)).toBe("999");
    expect(formatearKm(1000)).toBe("1.000");
    expect(formatearKm(84320)).toBe("84.320");
    expect(formatearKm(2000000)).toBe("2.000.000");
  });
});

describe("textoVencimiento (V1 a V6)", () => {
  it("cada borde con su texto, en singular y plural", () => {
    expect(textoVencimiento(-1, "2026-11-17")).toBe("Vencido hace 1 día");
    expect(textoVencimiento(-2, "2026-11-16")).toBe("Vencido hace 2 días");
    expect(textoVencimiento(0, "2026-11-18")).toBe("Vence hoy");
    expect(textoVencimiento(1, "2026-11-19")).toBe("Vence mañana");
    expect(textoVencimiento(7, "2026-11-25")).toBe("Vence en 7 días");
    expect(textoVencimiento(30, "2026-12-18")).toBe("Vence en 30 días");
    expect(textoVencimiento(31, "2026-12-19")).toBe("Vigente hasta 19/12/2026");
  });

  it("concuerda en género con el documento (QA M-2): «Revisión técnica vencida», «Seguro vencido»", () => {
    const masculinos = ["seguro"] as const;
    const femeninos = ["revision-tecnica", "matafuego", "habilitacion-proyecto", "licencia", "habilitacion-manejo"] as const;
    for (const tipo of masculinos) expect(textoVencimiento(-1, "2026-11-17", tipo)).toBe("Vencido hace 1 día");
    for (const tipo of femeninos) {
      expect(textoVencimiento(-1, "2026-11-17", tipo)).toBe("Vencida hace 1 día");
      expect(textoVencimiento(-3, "2026-11-15", tipo)).toBe("Vencida hace 3 días");
      expect(textoVencimiento(0, "2026-11-18", tipo)).toBe("Vence hoy");
      expect(textoVencimiento(31, "2026-12-19", tipo)).toBe("Vigente hasta 19/12/2026");
    }
  });
});

describe("protagonista y disponibles (A8)", () => {
  it("'N unidades no disponibles hoy', con singular y con cero", () => {
    expect(textoProtagonista(4)).toBe("4 unidades no disponibles hoy");
    expect(textoProtagonista(1)).toBe("1 unidad no disponible hoy");
    expect(textoProtagonista(0)).toBe("Todas las unidades activas están disponibles hoy");
  });

  it("'Disponibles hoy: 19 de 23 unidades activas.'", () => {
    expect(textoDisponibles(19, 23)).toBe("Disponibles hoy: 19 de 23 unidades activas.");
    expect(textoDisponibles(1, 1)).toBe("Disponibles hoy: 1 de 1 unidad activa.");
    expect(textoDisponibles(0, 0)).toBe("Disponibles hoy: 0 de 0 unidades activas.");
  });
});

describe("horizonte: resumen para lectores de pantalla", () => {
  it("arma la frase del diseño (5.6)", () => {
    expect(textoHorizonte({ vencidos: 2, "7": 4, "15": 3, "30": 2 })).toBe(
      "Vencimientos de los próximos 30 días: 4 en 7 días o menos, 3 entre 8 y 15 días, 2 entre 16 y 30 días. 2 documentos vencidos o faltantes.",
    );
  });

  it("singulares y ceros", () => {
    expect(textoHorizonte({ vencidos: 1, "7": 1, "15": 0, "30": 1 })).toBe(
      "Vencimientos de los próximos 30 días: 1 en 7 días o menos, 0 entre 8 y 15 días, 1 entre 16 y 30 días. 1 documento vencido o faltante.",
    );
  });

  it("sin nada: 'Nada vence en los próximos 30 días'", () => {
    expect(textoHorizonte({ vencidos: 0, "7": 0, "15": 0, "30": 0 })).toBe("Nada vence en los próximos 30 días.");
  });

  it("si solo hay vencidos lo dice", () => {
    expect(textoHorizonte({ vencidos: 3, "7": 0, "15": 0, "30": 0 })).toBe(
      "Nada vence en los próximos 30 días. 3 documentos vencidos o faltantes.",
    );
  });
});

describe("R3: textos de Inicio, Vencimientos y Operación diaria", () => {
  it("rótulos de las cifras de Inicio, con singular y plural", () => {
    expect(TEXTO_INICIO.cifraVencidos).toBe("Vencidos o faltantes");
    expect(TEXTO_INICIO.cifraProximos).toBe("Vencen en 30 días");
    expect(TEXTO_INICIO.cifraPartes).toBe("Partes pendientes");
    expect(TEXTO_INICIO.cifraNovedadCritica(1)).toBe("Novedad crítica");
    expect(TEXTO_INICIO.cifraNovedadCritica(2)).toBe("Novedades críticas");
    expect(TEXTO_INICIO.cifraNovedadCritica(0)).toBe("Novedades críticas");
  });

  it("la leyenda del horizonte usa los mismos períodos que los filtros de Vencimientos", () => {
    expect([TEXTO_LEYENDA_HORIZONTE["7"], TEXTO_LEYENDA_HORIZONTE["15"], TEXTO_LEYENDA_HORIZONTE["30"]]).toEqual(["7 días o menos", "8 a 15 días", "16 a 30 días"]);
    expect(textoLeyendaConCantidad("7 días o menos", 4)).toBe("4 documentos, 7 días o menos");
    expect(textoLeyendaConCantidad("16 a 30 días", 1)).toBe("1 documento, 16 a 30 días");
  });

  it("línea de contexto de Vencimientos: cada cifra con su unidad y su período", () => {
    expect(textoContextoVencimientos(3, 9)).toBe("3 vencidos o faltantes · 9 vencen en 30 días");
    expect(textoContextoVencimientos(1, 1)).toBe("1 vencido o faltante · 1 vence en 30 días");
    expect(textoContextoVencimientos(0, 0)).toBe("0 vencidos o faltantes · 0 vencen en 30 días");
  });

  it("línea de contexto de Operación diaria: pendientes y fecha", () => {
    expect(textoContextoOperacion(6, "2026-11-25")).toBe("6 pendientes · al 25/11/2026");
    expect(textoContextoOperacion(1, "2026-11-25")).toBe("1 pendiente · al 25/11/2026");
  });

  it("estados vacíos: dicen qué pasó y qué va a aparecer ahí", () => {
    expect(TEXTO_VACIO_PANTALLAS.vencimientos.titulo).toBe("Nada vence en los próximos 30 días.");
    expect(TEXTO_VACIO_PANTALLAS.checklists.titulo).toBe("No hay partes pendientes.");
    expect(TEXTO_VACIO_PANTALLAS.novedades.titulo).toBe("No hay novedades abiertas.");
    expect(TEXTO_VACIO_PANTALLAS.grupoSinFilas).toBe("Ninguno.");
    expect(TEXTO_INICIO.noDisponiblesVacio.ayuda).toBe("Ninguna está bloqueada por documentos ni fuera de servicio.");
    expect(TEXTO_GRUPO_OPERACION["sin-parte"]).toBe("Unidades sin parte de ayer");
  });

  it("la entrada al recorrido de Inicio: la invitación y el botón, en español neutro", () => {
    expect(TEXTO_INICIO.recorrido).toEqual({ texto: "Pruebe la demo: vea cómo un seguro vencido impide cargar el parte.", boton: "Probar como conductor" });
  });
});

describe("otros textos de la interfaz", () => {
  it("hoy con día de la semana (T6)", () => {
    expect(textoHoy("2026-11-18")).toBe("Hoy es miércoles 18/11/2026 (hora de Argentina)");
  });

  it("último registro de kilometraje", () => {
    expect(textoUltimoRegistro(84320, "parte del 17/11/2026")).toBe("Último registro: 84.320 km (parte del 17/11/2026).");
    expect(textoUltimoRegistro(null, null)).toBe("Sin registros");
  });

  it("'Quedan N vencimientos' (barra de estado después de renovar)", () => {
    expect(textoQuedanVencimientos(10)).toBe("Quedan 10 vencimientos.");
    expect(textoQuedanVencimientos(1)).toBe("Queda 1 vencimiento.");
    expect(textoQuedanVencimientos(0)).toBe("No quedan vencimientos.");
  });

  it("unidad nueva: 'Le faltan N documentos'", () => {
    expect(textoLeFaltan(4)).toBe("Le faltan 4 documentos");
    expect(textoLeFaltan(1)).toBe("Le falta 1 documento");
    expect(textoLeFaltan(0)).toBe("No le falta ningún documento");
  });

  it("P4: faltan datos", () => {
    expect(textoFaltantes(1)).toBe("Falta 1 dato");
    expect(textoFaltantes(3)).toBe("Faltan 3 datos");
  });
});

describe("opción del conductor en el parte (C13)", () => {
  it("«{Nombre} · {P}»; sin licencia vigente, «{Nombre} (sin licencia)» (sin la patente: cabe en el campo a 360 px); sin unidad, solo el nombre", () => {
    expect(textoOpcionDeConductor("Tamara Olivera", "ZK 214 BD", false)).toBe("Tamara Olivera · ZK 214 BD");
    expect(textoOpcionDeConductor("Ivana Aguirre", "ZPA 505", true)).toBe("Ivana Aguirre (sin licencia)");
    expect(textoOpcionDeConductor("Ivana Aguirre", null, true)).toBe("Ivana Aguirre (sin licencia)");
    expect(textoOpcionDeConductor("Luis Ferreyra", null, false)).toBe("Luis Ferreyra");
  });
});

describe("advertencias antes de enviar (K6, K7) y documentación de la unidad (P21)", () => {
  it("K6: salto de kilometraje", () => {
    expect(textoAdvertencia({ tipo: "salto-km", km: 1250 })).toBe("1.250 km sin registrar desde el último parte");
  });

  it("K7: recorrido largo", () => {
    expect(textoAdvertencia({ tipo: "recorrido-largo", km: 1350 })).toBe("Recorrido del día inusualmente largo: 1.350 km");
  });

  const CTX = { patente: "ZK 214 BD", venceron: { seguro: "2026-11-17", "revision-tecnica": "2026-11-01", matafuego: null, "habilitacion-proyecto": null } } as const;

  it("P21 (C6): un renglón por documento, con la fecha en que venció o «Falta cargar», y qué hacer según quién lo lee", () => {
    expect(errDocumentacionDeLaUnidad(["seguro"], CTX, false)).toBe(
      "El seguro de ZK 214 BD venció el 17/11/2026. La unidad no puede salir. Renueve la documentación antes de enviar la revisión.",
    );
    expect(errDocumentacionDeLaUnidad(["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"], CTX, true)).toBe(
      "El seguro de ZK 214 BD venció el 17/11/2026. La revisión técnica de ZK 214 BD venció el 01/11/2026. Falta cargar la carga del matafuego de ZK 214 BD. " +
        "Falta cargar la habilitación de ingreso al proyecto de ZK 214 BD. La unidad no puede salir. Avise al encargado.",
    );
    expect(textoDocumentacionDeLaUnidad(["seguro"], CTX)).toBe("El seguro de ZK 214 BD venció el 17/11/2026. La unidad no puede salir.");
  });

  it("registro de una revisión enviada: los avisos de kilómetros son un renglón de tono semana y se leen igual que en el diálogo", () => {
    expect(renglonesDeAvisosAceptados({ advertenciasAceptadas: [{ tipo: "recorrido-largo", km: 1350 }, { tipo: "salto-km", km: 1180 }] })).toEqual([
      { tono: "semana", texto: textoAdvertencia({ tipo: "recorrido-largo", km: 1350 }) },
      { tono: "semana", texto: textoAdvertencia({ tipo: "salto-km", km: 1180 }) },
    ]);
    expect(renglonesDeAvisosAceptados({ advertenciasAceptadas: [] })).toEqual([]);
  });
});

describe("«Cerrar antes» y P20: un parte de hoy está en uso, no «quedó sin cerrar» (QA B1 de la etapa 7)", () => {
  it("el parte de otro día sigue diciendo que quedó sin cerrar, con el día de la semana", () => {
    expect(textoParteSinCerrarDeLaUnidad("ZI 442 TU", "2026-11-21", "2026-11-22")).toBe("ZI 442 TU: el parte del sábado 21/11/2026 quedó sin cerrar.");
    expect(errParteAnteriorSinCerrar("ZI 442 TU", "2026-11-21", "2026-11-22")).toBe(
      "ZI 442 TU: el parte del sábado 21/11/2026 quedó sin cerrar. Ciérrelo primero; después se puede empezar la revisión del 22/11/2026.",
    );
    expect(errConductorConParteSinCerrar("Luis Ferreyra", "ZKB 482", "2026-11-17", "2026-11-18")).toBe(
      "Luis Ferreyra tiene sin cerrar el parte del martes 17/11/2026 de ZKB 482. Ciérrelo primero; después se puede enviar esta revisión.",
    );
  });

  it("el parte de hoy está en uso", () => {
    expect(textoParteSinCerrarDeLaUnidad("ZI 442 TU", "2026-11-22", "2026-11-22")).toBe("ZI 442 TU: el parte de hoy está en uso.");
    expect(errConductorConParteSinCerrar("Luis Ferreyra", "ZKB 482", "2026-11-18", "2026-11-18")).toBe(
      "Luis Ferreyra tiene en uso el parte de hoy de ZKB 482. Ciérrelo primero; después se puede enviar esta revisión.",
    );
  });
});

describe("motivo de fuera de servicio por una novedad crítica (C3)", () => {
  it("el parte se nombra solo si es de otro día que el «Desde»", () => {
    expect(MOTIVO_NOVEDAD_CRITICA.delParte("2026-11-20", "Frenos", "2026-11-20")).toBe("Novedad crítica en frenos");
    expect(MOTIVO_NOVEDAD_CRITICA.delParte("2026-11-19", "Frenos, Dirección", "2026-11-20")).toBe("Novedad crítica en frenos, dirección, parte del 19/11/2026");
  });
});

describe("errores y resúmenes que arman otros textos", () => {
  it("A4, P1, P8", () => {
    expect(errNovedadesCriticasAbiertas(["Frenos (parte del 16/11/2026)"])).toBe("Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).");
    expect(errParteDuplicado("ZK 214 BD", "2026-11-18", "borrador")).toBe("Ya hay un parte de ZK 214 BD para el 18/11/2026 (borrador). Ábralo para continuar.");
    expect(errUnidadFueraDeServicio("2026-11-13", "En taller: cambio de embrague")).toBe(
      "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la ponga de nuevo en servicio.",
    );
  });

  it("P12: el mensaje de guardado fallido del parte dice que lo escrito sigue en pantalla y pide no cerrar la pestaña", () => {
    expect(ERRORES.noPudoGuardarElParte).toBe(
      "No se pudo guardar el parte. Lo escrito sigue en pantalla; no cierre la pestaña e intente de nuevo.",
    );
  });

  it("los resúmenes del historial están en español neutro y sin voseo", () => {
    const muestras = [
      RESUMEN_EVENTO.unidadAlta("ZK 214 BD", 7),
      RESUMEN_EVENTO.fueraDeServicio("ZK 214 BD", "En taller"),
      RESUMEN_EVENTO.vueltaAServicio("ZK 214 BD"),
      RESUMEN_EVENTO.kmCorregido("ZK 214 BD", null, 120, "2026-11-18"),
      RESUMEN_EVENTO.unidadBaja("ZK 214 BD", "Venta"),
    ];
    for (const m of muestras) expect(m).not.toMatch(/\bvos\b|\bpodés\b|\bsos\b|\bhacé\b/i);
    expect(muestras[3]).toBe("Kilometraje de ZK 214 BD fijado en 120 km desde el 18/11/2026");
  });

  it("ningún texto de ERRORES termina sin punto final ni queda vacío", () => {
    for (const [clave, texto] of Object.entries(ERRORES)) {
      expect(texto.length, clave).toBeGreaterThan(5);
      expect(texto.endsWith("."), clave).toBe(true);
    }
  });
});

describe("revisión de textos del 18/11/2026 (redactor-ux)", () => {
  it("el error de arranque tiene título (para el h1) y mensaje por separado, sin repetir la frase", () => {
    expect(TEXTO_ERROR_ARRANQUE.titulo).toBe("No se pudo iniciar la demo");
    expect(TEXTO_ERROR_ARRANQUE.mensaje).toBe("Recargue la página. Si el problema sigue, pruebe con otro navegador.");
    expect(TEXTO_ERROR_ARRANQUE.mensaje).not.toMatch(/reinici/i); // la fase de error no tiene "Reiniciar demo"
    expect(TEXTO_ERROR_ARRANQUE.mensaje).not.toContain(TEXTO_ERROR_ARRANQUE.titulo);
  });

  it("el parte dice la acción real que saca a la unidad de «fuera de servicio»: resolver la novedad y volver a servicio", () => {
    expect(TEXTO_PARTE.puntoCritico).toBe(
      "Al enviar la revisión, la unidad queda fuera de servicio y no sale, hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
    );
    expect(TEXTO_PARTE.enviadoConCritica).toBe(
      "La unidad quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
    );
    for (const texto of Object.values(TEXTO_PARTE)) expect(texto).not.toMatch(/revise/i);
  });

  it("avisos globales: dicen qué pasó y qué implica", () => {
    expect(TEXTO_AVISO.cambiosEnOtraPestana).toBe(
      "Se hicieron cambios en otra pestaña. Esta pantalla sigue mostrando los datos anteriores hasta que actualice.",
    );
    expect(textoDatosDeOtraFecha("2026-11-10")).toContain("se borran sus cambios");
  });

  it("errores de estado y de guardado: cada contexto dice lo que corresponde", () => {
    expect(ERRORES.noPudoGuardar).toBe(
      "No se pudo guardar en este equipo. No se aplicó ningún cambio y lo escrito sigue en pantalla. Intente de nuevo.",
    );
    expect(ERRORES.noPudoReiniciar).toBe("No se pudo reiniciar la demo. Se conservaron los datos que tenía. Intente de nuevo.");
    expect(ERRORES.noPudoCambiarVista).toBe("No se pudo cambiar la vista. Intente de nuevo.");
    expect(ERRORES.cambiosEnOtraPestana).toBe("Hay cambios hechos en otra pestaña. Pulse «Actualizar» en el aviso y vuelva a cambiar la vista.");
    expect(ERRORES.sinPermiso).toBe("Esta acción es solo del encargado. En «Ver como», elija «Encargado».");
    expect(ERRORES.sinDatos).toBe("La demo todavía no terminó de cargar. Espere un momento e intente de nuevo.");
    expect(ERRORES.noPudoActualizar).toBe(
      "No se pudieron leer los cambios de la otra pestaña. Intente de nuevo; si sigue fallando, recargue la página.",
    );
  });

  it("errores de reglas: con unidad y con salida", () => {
    expect(errKmSuperaSiguiente("2026-11-17", 84500)).toBe(
      "El kilometraje supera el del inicio del parte del 17/11/2026 (84.500 km). Revise el número.",
    );
    expect(errKmFinMenor(84100, 84200)).toBe("El kilometraje al terminar (84.100 km) es menor que al iniciar (84.200 km). Revise los dos números.");
    expect(errKmExcedido(2_000_000)).toBe("El kilometraje no puede superar 2.000.000 km.");
    expect(errLitrosInvalidos(120)).toBe("Escriba los litros con hasta un decimal, mayores que 0 y hasta 120.");
    expect(errDocumentoExistente("Seguro")).toBe("Ya hay cargado un documento «Seguro». Para actualizarlo, use «Renovar».");
    expect(ERRORES.documentoNoVigente).toBe("Solo se puede renovar el documento vigente. Si un dato está mal, use «Corregir».");
    expect(ERRORES.advertenciasSinAceptar).toBe("Revise las advertencias y acéptelas para enviar el parte.");
    expect(ERRORES.checklistInvalido).toBe("Hay respuestas del checklist que no se pueden guardar. Revise cada punto.");
    expect(ERRORES.otraNovedadInvalida).toBe("Revise el texto de «Otra novedad».");
  });

  it("el parte o la corrección que se cita es el de la fecha del registro, no el día en que se envió", () => {
    expect(errKmCorreccionAnterior("parte", "2026-11-17")).toBe(
      "Ya hay un parte del 17/11/2026, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha de ese parte o una posterior.",
    );
    expect(errKmCorreccionAnterior("correccion", "2026-11-17")).toBe(
      "Ya hay una corrección del 17/11/2026, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha de esa corrección o una posterior.",
    );
  });

  it("los 'no se encontró' dicen cómo seguir", () => {
    for (const clave of [
      "unidadInexistente",
      "conductorInexistente",
      "proyectoInexistente",
      "documentoInexistente",
      "parteInexistente",
      "novedadInexistente",
    ] as const) {
      expect(ERRORES[clave], clave).toMatch(/^No se encontró .+\. Vuelva a la lista e intente de nuevo\.$/);
    }
  });

  it("alerta de parte sin enviar: 'iniciado por'", () => {
    expect(TEXTO_ALERTA.parteSinEnviar("2026-11-17", "L. Ferreyra")).toBe("Parte del 17/11/2026 sin enviar (iniciado por L. Ferreyra)");
  });

  it("ningún error de ERRORES usa voseo", () => {
    for (const [clave, texto] of Object.entries(ERRORES)) expect(texto, clave).not.toMatch(/(?<!\p{L})(?:vos|podés|sos|hacé|tenés|cambiá|elegí)(?!\p{L})/iu);
  });
});
