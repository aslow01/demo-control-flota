// Generador de la flota de ejemplo (docs/diseno.md, sección 9). Determinista: `generar(semilla, fechaBase)` devuelve
// siempre lo mismo, y todas las fechas son desplazamientos desde `fechaBase`. Datos 100 % ficticios.
//
// El ORDEN de las llamadas al azar es parte del contrato: si se cambia, cambian los datos y hay que actualizar
// el hash del test del generador a propósito (con una línea en docs/registro.md).

import { sumarAnios, sumarDias, formatearFecha } from "../dominio/fechas.ts";
import { formatearPatente } from "../dominio/patente.ts";
import { ITEMS_CHECKLIST } from "../dominio/parte.ts";
import { NOMBRES_DOCUMENTO, RESUMEN_EVENTO } from "../dominio/textos.ts";
import type {
  Advertencia,
  Conductor,
  CorreccionKm,
  Documento,
  Empresa,
  Estado,
  Evento,
  FechaCivil,
  Instante,
  ItemChecklist,
  NivelCombustible,
  Novedad,
  Parte,
  Proyecto,
  RespuestaItem,
  TipoDocumento,
  TipoUnidad,
  Unidad,
} from "../dominio/tipos.ts";
import { crearAzar, type Azar } from "./azar.ts";
import { armarCuit } from "./cuit.ts";

export const SEMILLA_POR_DEFECTO = 20261118;
export const ENCARGADA = "Rocío Medina";

const cuit = armarCuit("30", "99000003");
if (cuit === null) throw new Error("CUIT ficticio inválido");
/** Empresa inventada; el CUIT es ficticio y tiene dígito verificador válido. */
export const EMPRESA: Empresa = { nombre: "Logística Andina Demo S.A.", cuit };

export const NOMBRES: readonly string[] = [
  "Andrés", "Bruno", "Camila", "Daniela", "Esteban", "Facundo", "Gabriela", "Hernán", "Ivana", "Joaquín", "Karina", "Lautaro",
  "Mariela", "Nicolás", "Olivia", "Pablo", "Renata", "Sebastián", "Tamara", "Ulises", "Valeria", "Walter", "Ximena", "Yamila",
];

export const APELLIDOS: readonly string[] = [
  "Ferreyra", "Quiroga", "Bustos", "Carrizo", "Domínguez", "Echegaray", "Funes", "Gallardo", "Herrera", "Ibáñez", "Juárez", "Luna",
  "Molina", "Núñez", "Olivera", "Paez", "Reynoso", "Sosa", "Toledo", "Vargas", "Videla", "Zárate", "Aguirre", "Barrionuevo",
];

const DIAS_DE_PARTES = 45;
const CANTIDAD_DE_CONDUCTORES = 16;

// ---------------------------------------------------------------------------------------------
// Plantilla de las 24 unidades: cada una cumple un papel en los casos garantizados (9.2)
// ---------------------------------------------------------------------------------------------

type Rol =
  | "c02" | "c03" | "c04" | "c05" | "c06" | "c07" | "c01" | "c08" | "c09" | "c10" | "c11" | "c12" | "c13"
  | "c18" | "c20" | "c14" | "c15" | "c19" | "relleno" | "c16";

type ClaveProyecto = "piedra" | "arroyo" | "base";

interface Plantilla {
  interno: number;
  tipo: TipoUnidad;
  proyecto: ClaveProyecto;
  rol: Rol;
}

const PLANTILLA: readonly Plantilla[] = [
  { interno: 1, tipo: "camioneta", proyecto: "piedra", rol: "c02" },
  { interno: 2, tipo: "camioneta", proyecto: "arroyo", rol: "c03" },
  { interno: 3, tipo: "camioneta", proyecto: "piedra", rol: "c04" },
  { interno: 4, tipo: "camioneta", proyecto: "arroyo", rol: "c05" },
  { interno: 5, tipo: "camioneta", proyecto: "piedra", rol: "c06" },
  { interno: 6, tipo: "camioneta", proyecto: "arroyo", rol: "c07" },
  { interno: 7, tipo: "camioneta", proyecto: "piedra", rol: "c01" },
  { interno: 8, tipo: "camioneta", proyecto: "base", rol: "c08" },
  { interno: 9, tipo: "camioneta", proyecto: "piedra", rol: "c09" },
  { interno: 10, tipo: "camioneta", proyecto: "piedra", rol: "c10" },
  { interno: 11, tipo: "camioneta", proyecto: "arroyo", rol: "c11" },
  { interno: 12, tipo: "camioneta", proyecto: "piedra", rol: "c12" },
  { interno: 13, tipo: "camioneta", proyecto: "arroyo", rol: "c13" },
  { interno: 14, tipo: "camioneta", proyecto: "piedra", rol: "c18" },
  { interno: 15, tipo: "utilitario", proyecto: "base", rol: "c20" },
  { interno: 16, tipo: "utilitario", proyecto: "piedra", rol: "c14" },
  { interno: 17, tipo: "utilitario", proyecto: "base", rol: "c14" },
  { interno: 18, tipo: "utilitario", proyecto: "arroyo", rol: "c15" },
  { interno: 19, tipo: "camion-liviano", proyecto: "piedra", rol: "c19" },
  { interno: 20, tipo: "camion-liviano", proyecto: "arroyo", rol: "relleno" },
  { interno: 21, tipo: "camion-liviano", proyecto: "base", rol: "relleno" },
  { interno: 22, tipo: "minibus", proyecto: "piedra", rol: "relleno" },
  { interno: 23, tipo: "minibus", proyecto: "arroyo", rol: "relleno" },
  { interno: 24, tipo: "camioneta", proyecto: "base", rol: "c16" },
];

const MODELOS: Record<TipoUnidad, readonly (readonly [string, string])[]> = {
  camioneta: [
    ["Toyota", "Hilux"],
    ["Ford", "Ranger"],
    ["Volkswagen", "Amarok"],
    ["Nissan", "Frontier"],
    ["Chevrolet", "S10"],
  ],
  utilitario: [
    ["Renault", "Kangoo"],
    ["Fiat", "Fiorino"],
    ["Peugeot", "Partner"],
  ],
  "camion-liviano": [
    ["Iveco", "Daily"],
    ["Volkswagen", "Delivery"],
    ["Hyundai", "HR"],
  ],
  minibus: [
    ["Mercedes-Benz", "Sprinter"],
    ["Iveco", "Daily Minibús"],
    ["Renault", "Master"],
  ],
};

const SEGUROS = ["Aseguradora del Sur Demo", "Seguros Puna Demo"] as const;
const EMISORES: Record<Exclude<TipoDocumento, "seguro">, string> = {
  "revision-tecnica": "Planta de Revisión Técnica Demo N.º 3",
  matafuego: "Recargas Cordillera Demo",
  "habilitacion-proyecto": "Oficina de Habilitaciones Demo",
  licencia: "Dirección de Tránsito Demo",
  "habilitacion-manejo": "Seguridad Operativa Demo",
};
const PREFIJO_NUMERO: Record<TipoDocumento, string> = {
  seguro: "88",
  "revision-tecnica": "RT",
  matafuego: "MF",
  "habilitacion-proyecto": "HP",
  licencia: "LC",
  "habilitacion-manejo": "HM",
};

const NOVEDADES_PASADAS: readonly (readonly [ItemChecklist, string, string])[] = [
  ["niveles", "Falta agua en el limpiaparabrisas", "Se completó el nivel"],
  ["botiquin", "Falta una venda en el botiquín", "Se repuso el material"],
  ["cabina", "Asiento del acompañante flojo", "Se ajustó la fijación"],
  ["matafuego", "Precinto del matafuego roto", "Se colocó un precinto nuevo"],
  ["documentacion", "Falta la copia de la tarjeta verde", "Se entregó la copia"],
  ["niveles", "Nivel de aceite en el mínimo", "Se agregó aceite"],
];

// ---------------------------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------------------------

type EventoSinNumerar = Omit<Evento, "id" | "secuencia">;

function elegirSinRepetir<T>(azar: Azar, lista: readonly T[], cantidad: number): T[] {
  const copia = [...lista];
  // Fisher-Yates parcial: toma `cantidad` elementos distintos.
  for (let i = 0; i < cantidad; i++) {
    const j = i + azar.entero(0, copia.length - i - 1);
    const t = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = t;
  }
  return copia.slice(0, cantidad);
}

function letra(azar: Azar): string {
  return String.fromCharCode(65 + azar.entero(0, 25));
}

function crearPatente(azar: Azar, anio: number, usadas: Set<string>): string {
  for (;;) {
    const digitos = String(azar.entero(100, 999));
    const patente =
      anio >= 2016 ? `Z${letra(azar)}${digitos}${letra(azar)}${letra(azar)}` : `Z${letra(azar)}${letra(azar)}${digitos}`;
    if (!usadas.has(patente)) {
      usadas.add(patente);
      return patente;
    }
  }
}

/** Genera el estado completo de la demo. Las fechas son relativas a `fechaBase` (el "hoy" del ejemplo). */
export function generar(semilla: number, fechaBase: FechaCivil): Estado {
  const azar = crearAzar(semilla);
  const H = fechaBase;
  const d = (n: number): FechaCivil => sumarDias(H, n);
  /** Instante (UTC) en una fecha civil; las horas se eligen para que siga siendo el mismo día en Argentina. */
  const en = (fecha: FechaCivil, hora: number, minuto = 0): Instante =>
    `${fecha}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00.000Z`;

  const contadores = { u: 0, c: 0, d: 0, p: 0, n: 0, k: 0 };
  const id = (clave: keyof typeof contadores, prefijo: string, ancho: number): string =>
    `${prefijo}-${String(++contadores[clave]).padStart(ancho, "0")}`;

  const eventos: EventoSinNumerar[] = [];
  const evento = (e: EventoSinNumerar): void => {
    eventos.push(e);
  };

  // --- Proyectos -------------------------------------------------------------------------------
  const proyectos: Proyecto[] = [
    { id: "proy-piedra-lunar", nombre: "Proyecto Piedra Lunar", requiereHabilitacion: true },
    { id: "proy-arroyo-escondido", nombre: "Proyecto Arroyo Escondido", requiereHabilitacion: true },
    { id: "proy-base", nombre: "Base de mantenimiento", requiereHabilitacion: false },
  ];
  const idProyecto: Record<ClaveProyecto, string> = {
    piedra: "proy-piedra-lunar",
    arroyo: "proy-arroyo-escondido",
    base: "proy-base",
  };

  // --- Conductores -----------------------------------------------------------------------------
  const nombres = elegirSinRepetir(azar, NOMBRES, CANTIDAD_DE_CONDUCTORES);
  const apellidos = elegirSinRepetir(azar, APELLIDOS, CANTIDAD_DE_CONDUCTORES);
  const conductores: Conductor[] = nombres.map((nombre, i) => ({
    id: id("c", "c", 2),
    nombre: `${nombre} ${apellidos[i]}`,
    legajo: `L-${String(101 + i).padStart(4, "0")}`,
    activo: true,
  }));
  const nombreDe = (conductorId: string | null): string =>
    conductores.find((c) => c.id === conductorId)?.nombre ?? ENCARGADA;

  // --- Unidades --------------------------------------------------------------------------------
  const usadas = new Set<string>(["ZK214BD"]);
  const unidades: Unidad[] = [];
  const rolDe = new Map<string, Rol>();
  PLANTILLA.forEach((ficha, i) => {
    const anio = ficha.rol === "c01" ? 2022 : ficha.rol === "c16" ? 2012 : azar.entero(2012, 2025);
    const patente = ficha.rol === "c01" ? "ZK214BD" : crearPatente(azar, anio, usadas);
    const [marca, modelo] = azar.elegir(MODELOS[ficha.tipo]);
    const unidad: Unidad = {
      id: id("u", "u", 2),
      patente,
      interno: ficha.interno,
      marca,
      modelo,
      anio,
      tipo: ficha.tipo,
      proyectoId: idProyecto[ficha.proyecto],
      conductorId: i < CANTIDAD_DE_CONDUCTORES ? (conductores[i] as Conductor).id : null,
      estado: { tipo: "en-servicio" },
      creada: en(d(-(700 + azar.entero(0, 100))), 12),
    };
    unidades.push(unidad);
    rolDe.set(unidad.id, ficha.rol);
    evento({
      instante: unidad.creada,
      unidadId: unidad.id,
      conductorId: null,
      tipo: "unidad-alta",
      resumen: RESUMEN_EVENTO.unidadAlta(formatearPatente(unidad.patente), unidad.interno),
      datos: { patente: unidad.patente, interno: unidad.interno, proyectoId: unidad.proyectoId },
      autor: ENCARGADA,
    });
  });
  const porRol = (rol: Rol): Unidad => {
    const u = unidades.find((x) => rolDe.get(x.id) === rol);
    if (u === undefined) throw new Error(`Falta la unidad del rol ${rol}`);
    return u;
  };
  const pat = (u: Unidad): string => formatearPatente(u.patente);

  // --- Documentos ------------------------------------------------------------------------------
  const documentos: Documento[] = [];

  interface PedidoDocumento {
    titular: { tipo: "unidad" | "conductor"; id: string };
    unidadId: string | null;
    conductorId: string | null;
    etiqueta: string;
    tipo: TipoDocumento;
    /** Vencimiento fijado por un caso garantizado; si no, aleatorio entre H + 31 y H + 400. */
    vence: FechaCivil | null;
  }

  /** Agrega el documento y, a veces, uno anterior al que renueva (historial de renovaciones hechas antes de vencer). */
  function agregarDocumento(p: PedidoDocumento): void {
    const emisor = p.tipo === "seguro" ? azar.elegir(SEGUROS) : EMISORES[p.tipo];
    const numero = `DEMO-${PREFIJO_NUMERO[p.tipo]}-${azar.entero(1000, 9999)}`;
    const conAnterior = p.vence === null && azar.probabilidad(0.25);
    const venceAleatorio = d(azar.entero(31, 400));
    const venceAnterior = d(-azar.entero(10, 300));
    const conEmision = azar.probabilidad(0.7);
    const cargadoAleatorio = d(-azar.entero(1, 300));

    let vence: FechaCivil;
    let cargado: Instante;
    let anterior: Documento | null = null;
    if (conAnterior) {
      anterior = {
        id: id("d", "d", 4),
        titular: p.titular,
        tipo: p.tipo,
        numero: `DEMO-${PREFIJO_NUMERO[p.tipo]}-${azar.entero(1000, 9999)}`,
        emisor,
        vence: venceAnterior,
        emitido: sumarAnios(venceAnterior, -1),
        cargado: en(sumarDias(venceAnterior, -365), 12),
        reemplazaA: null,
      };
      documentos.push(anterior);
      vence = sumarAnios(venceAnterior, 1);
      cargado = en(sumarDias(venceAnterior, -azar.entero(1, 15)), 12);
    } else {
      vence = p.vence ?? venceAleatorio;
      cargado = en(cargadoAleatorio, 12);
    }
    const nuevo: Documento = {
      id: id("d", "d", 4),
      titular: p.titular,
      tipo: p.tipo,
      numero,
      emisor,
      vence,
      emitido: conEmision ? sumarAnios(vence, -1) : null,
      cargado,
      reemplazaA: anterior === null ? null : anterior.id,
    };
    documentos.push(nuevo);
    if (anterior !== null) {
      evento({
        instante: cargado,
        unidadId: p.unidadId,
        conductorId: p.conductorId,
        tipo: "documento-renovado",
        resumen: RESUMEN_EVENTO.documentoRenovado(NOMBRES_DOCUMENTO[p.tipo], p.etiqueta, anterior.vence, nuevo.vence),
        datos: {
          documentoId: nuevo.id,
          documentoAnteriorId: anterior.id,
          tipoDocumento: p.tipo,
          venceAnterior: anterior.vence,
          venceNuevo: nuevo.vence,
        },
        autor: ENCARGADA,
      });
    }
  }

  /** Vencimientos plantados por rol y tipo de documento (casos C01 a C09 y C12). */
  const VENCE_PLANTADO: Partial<Record<Rol, Partial<Record<TipoDocumento, number>>>> = {
    c01: { seguro: -1 },
    c02: { "revision-tecnica": 0 },
    c03: { "revision-tecnica": 1 },
    c04: { seguro: 7 },
    c05: { matafuego: 8 },
    c06: { "habilitacion-proyecto": 15 },
    c07: { seguro: 16 },
    c08: { "revision-tecnica": 30 },
    c09: { seguro: 31 },
    c12: { "revision-tecnica": 5 },
    c16: { seguro: -25 },
  };

  for (const u of unidades) {
    const rol = rolDe.get(u.id) as Rol;
    const proyectoExigeHabilitacion = u.proyectoId !== idProyecto.base;
    // C10 llegó hoy desde la base: nunca tuvo habilitación. C18: su revisión se arma aparte, más abajo.
    const exigeHabilitacion = proyectoExigeHabilitacion && rol !== "c10";
    const tipos: TipoDocumento[] = ["seguro", "revision-tecnica", "matafuego"];
    if (exigeHabilitacion) tipos.push("habilitacion-proyecto");
    for (const tipo of tipos) {
      if (rol === "c18" && tipo === "revision-tecnica") continue;
      const plantado = VENCE_PLANTADO[rol]?.[tipo];
      agregarDocumento({
        titular: { tipo: "unidad", id: u.id },
        unidadId: u.id,
        conductorId: null,
        etiqueta: pat(u),
        tipo,
        vence: plantado === undefined ? null : d(plantado),
      });
    }
  }

  // C18: la revisión técnica venció en H - 7; se renovó en H - 6, después de enviar el parte de ese día.
  const unidadC18 = porRol("c18");
  const revisionVieja: Documento = {
    id: id("d", "d", 4),
    titular: { tipo: "unidad", id: unidadC18.id },
    tipo: "revision-tecnica",
    numero: `DEMO-RT-${azar.entero(1000, 9999)}`,
    emisor: EMISORES["revision-tecnica"],
    vence: d(-7),
    emitido: sumarAnios(d(-7), -1),
    cargado: en(sumarDias(d(-7), -365), 12),
    reemplazaA: null,
  };
  const revisionNueva: Documento = {
    id: id("d", "d", 4),
    titular: { tipo: "unidad", id: unidadC18.id },
    tipo: "revision-tecnica",
    numero: `DEMO-RT-${azar.entero(1000, 9999)}`,
    emisor: EMISORES["revision-tecnica"],
    vence: d(358),
    emitido: d(-6),
    cargado: en(d(-6), 22, 40),
    reemplazaA: revisionVieja.id,
  };
  documentos.push(revisionVieja, revisionNueva);
  evento({
    instante: revisionNueva.cargado,
    unidadId: unidadC18.id,
    conductorId: null,
    tipo: "documento-renovado",
    resumen: RESUMEN_EVENTO.documentoRenovado(NOMBRES_DOCUMENTO["revision-tecnica"], pat(unidadC18), revisionVieja.vence, revisionNueva.vence),
    datos: {
      documentoId: revisionNueva.id,
      documentoAnteriorId: revisionVieja.id,
      tipoDocumento: "revision-tecnica",
      venceAnterior: revisionVieja.vence,
      venceNuevo: revisionNueva.vence,
    },
    autor: ENCARGADA,
  });

  // Licencias (C17: la del tercer conductor vence en H + 12) y habilitaciones de manejo (opcionales).
  conductores.forEach((c, i) => {
    agregarDocumento({
      titular: { tipo: "conductor", id: c.id },
      unidadId: null,
      conductorId: c.id,
      etiqueta: c.nombre,
      tipo: "licencia",
      vence: i === 2 ? d(12) : null,
    });
  });
  conductores.forEach((c, i) => {
    if (i % 2 === 0) {
      agregarDocumento({
        titular: { tipo: "conductor", id: c.id },
        unidadId: null,
        conductorId: c.id,
        etiqueta: c.nombre,
        tipo: "habilitacion-manejo",
        vence: null,
      });
    }
  });

  // --- Partes, novedades y correcciones --------------------------------------------------------
  const partes: Parte[] = [];
  const novedades: Novedad[] = [];
  const correccionesKm: CorreccionKm[] = [];

  const respuestaEnOrden: RespuestaItem = { estado: "en-orden" };
  const checklistCompleto = (): Parte["checklist"] => ({
    frenos: respuestaEnOrden,
    direccion: respuestaEnOrden,
    neumaticos: respuestaEnOrden,
    luces: respuestaEnOrden,
    cinturones: respuestaEnOrden,
    niveles: respuestaEnOrden,
    matafuego: respuestaEnOrden,
    botiquin: respuestaEnOrden,
    documentacion: respuestaEnOrden,
    cabina: respuestaEnOrden,
  });
  const NIVELES: readonly NivelCombustible[] = ["reserva", "cuarto", "medio", "tres-cuartos", "lleno"];

  /** Último día (relativo a H) con parte enviado, según el papel de la unidad. */
  const ULTIMO_DIA: Partial<Record<Rol, number>> = { c11: -2, c12: -6, c13: -2, c14: -2, c16: -29 };

  for (const u of unidades) {
    const rol = rolDe.get(u.id) as Rol;
    const ultimo = ULTIMO_DIA[rol] ?? -1;
    let km = azar.entero(20000, 180000);
    for (let n = -DIAS_DE_PARTES; n <= ultimo; n++) {
      const fecha = d(n);
      const conductorId = u.conductorId ?? (azar.elegir(conductores) as Conductor).id;
      const recorrido = azar.entero(40, 260);
      const combustible = azar.elegir(NIVELES);
      const litros = azar.probabilidad(0.3) ? azar.entero(200, 800) / 10 : null;
      const conNovedadPasada = n <= -12 && azar.probabilidad(0.012);
      const minutoDeEnvio = azar.entero(0, 89);

      const advertencias: Advertencia[] = [];
      const checklist = checklistCompleto();
      let otraNovedad: Parte["otraNovedad"] = null;
      let documentacionVencida: TipoDocumento[] = [];

      // C20: el tablero se cambió en H - 20; desde ahí el kilometraje parte de la base 120.
      if (rol === "c20" && n === -20) {
        const kmAnterior = km;
        km = 120;
        const correccion: CorreccionKm = {
          id: id("k", "k", 3),
          unidadId: u.id,
          desde: fecha,
          kmBase: 120,
          motivo: "Cambio de tablero por avería",
          instante: en(fecha, 12, 30),
          autor: ENCARGADA,
        };
        correccionesKm.push(correccion);
        evento({
          instante: correccion.instante,
          unidadId: u.id,
          conductorId: null,
          tipo: "km-corregido",
          resumen: RESUMEN_EVENTO.kmCorregido(pat(u), kmAnterior, 120, fecha),
          datos: { kmAnterior, kmBase: 120, desde: fecha, motivo: correccion.motivo },
          autor: ENCARGADA,
        });
      }
      // C15: un salto de 1.250 km sin registrar, aceptado al enviar.
      if (rol === "c15" && n === -4) {
        km += 1250;
        advertencias.push({ tipo: "salto-km", km: 1250 });
      }
      // C18: parte de H - 6 con la revisión técnica vencida (venció en H - 7), enviado con la advertencia aceptada.
      if (rol === "c18" && n === -6) {
        documentacionVencida = ["revision-tecnica"];
        advertencias.push({ tipo: "documentacion-vencida", documentos: ["revision-tecnica"] });
      }
      // C19: una luz de patente quemada, informada como "otra novedad" y todavía abierta.
      if (rol === "c19" && n === -9) otraNovedad = { descripcion: "Luz de patente quemada", impideUso: false };
      // C11: frenos con novedad crítica en el parte de H - 2.
      const frenosCriticos = rol === "c11" && n === -2;
      if (frenosCriticos) {
        checklist.frenos = { estado: "con-novedad", descripcion: "ruido al frenar en bajada", impideUso: false };
      }
      // Novedades pasadas (no críticas), resueltas días después.
      let pasada: (typeof NOVEDADES_PASADAS)[number] | null = null;
      let diasHastaResolver = 0;
      if (conNovedadPasada) {
        pasada = azar.elegir(NOVEDADES_PASADAS);
        diasHastaResolver = azar.entero(1, 5);
        checklist[pasada[0]] = { estado: "con-novedad", descripcion: pasada[1], impideUso: false };
      }

      const kmInicio = km;
      const kmFin = km + recorrido;
      km = kmFin;
      // entre las 21:00 y las 22:29 UTC (18:00 a 19:29 en Argentina): el mismo día civil
      const enviado = en(fecha, 21 + Math.floor(minutoDeEnvio / 60), minutoDeEnvio % 60);
      const parte: Parte = {
        id: id("p", "pt", 4),
        unidadId: u.id,
        fecha,
        conductorId,
        estado: "enviado",
        kmInicio,
        kmFin,
        combustible,
        litrosCargados: litros,
        checklist,
        otraNovedad,
        advertenciasAceptadas: advertencias,
        documentacionVencida,
        creado: en(fecha, 11, 0),
        actualizado: enviado,
        enviado,
        autor: nombreDe(conductorId),
      };
      partes.push(parte);
      evento({
        instante: enviado,
        unidadId: u.id,
        conductorId,
        tipo: "parte-enviado",
        resumen: RESUMEN_EVENTO.parteEnviado(pat(u), fecha, false, kmInicio, kmFin),
        datos: { parteId: parte.id, fecha, kmInicio, kmFin, recorrido, fueraDeTermino: false, advertencias },
        autor: parte.autor,
      });

      const abrir = (item: ItemChecklist | "otra", descripcion: string, gravedad: Novedad["gravedad"]): Novedad => {
        const nov: Novedad = {
          id: id("n", "n", 3),
          unidadId: u.id,
          origen: { tipo: "parte", parteId: parte.id, item },
          descripcion,
          gravedad,
          fecha,
          estado: "abierta",
          resolucion: null,
        };
        novedades.push(nov);
        evento({
          instante: enviado,
          unidadId: u.id,
          conductorId: null,
          tipo: "novedad-abierta",
          resumen: RESUMEN_EVENTO.novedadAbierta(
            pat(u),
            gravedad === "critica",
            item === "otra" ? descripcion : `${ITEMS_CHECKLIST.find((i) => i.id === item)?.texto}: ${descripcion}`,
          ),
          datos: { novedadId: nov.id, gravedad, origen: nov.origen },
          autor: parte.autor,
        });
        return nov;
      };

      if (otraNovedad !== null) abrir("otra", otraNovedad.descripcion, "normal");

      if (pasada !== null) {
        const nov = abrir(pasada[0], pasada[1], "normal");
        const diaResolucion = d(n + diasHastaResolver);
        const instante = en(diaResolucion, 14, azar.entero(0, 59));
        nov.estado = "resuelta";
        nov.resolucion = { texto: pasada[2], instante, autor: ENCARGADA };
        const rotulo = ITEMS_CHECKLIST.find((i) => i.id === pasada[0])?.texto ?? "";
        evento({
          instante,
          unidadId: u.id,
          conductorId: null,
          tipo: "novedad-resuelta",
          resumen: RESUMEN_EVENTO.novedadResuelta(pat(u), rotulo, pasada[2]),
          datos: { novedadId: nov.id, gravedad: "normal" },
          autor: ENCARGADA,
        });
      }

      if (frenosCriticos) {
        const nov = abrir("frenos", "ruido al frenar en bajada", "critica");
        const motivo = `Novedad crítica en el parte del ${formatearFecha(fecha)}: Frenos`;
        u.estado = { tipo: "fuera-de-servicio", desde: fecha, motivo, origen: "novedad-critica", novedadIds: [nov.id] };
        evento({
          instante: enviado,
          unidadId: u.id,
          conductorId: null,
          tipo: "fuera-de-servicio",
          resumen: RESUMEN_EVENTO.fueraDeServicio(pat(u), motivo),
          datos: { origen: "novedad-critica", motivo, novedadIds: [nov.id] },
          autor: parte.autor,
        });
      }
    }

    // C13: borrador de ayer, sin enviar.
    if (rol === "c13") {
      const checklist = checklistCompleto();
      const sin: RespuestaItem = { estado: "sin-responder" };
      for (const item of ITEMS_CHECKLIST.slice(4)) checklist[item.id] = sin;
      partes.push({
        id: id("p", "pt", 4),
        unidadId: u.id,
        fecha: d(-1),
        conductorId: u.conductorId,
        estado: "borrador",
        kmInicio: km,
        kmFin: null,
        combustible: null,
        litrosCargados: null,
        checklist,
        otraNovedad: null,
        advertenciasAceptadas: [],
        documentacionVencida: [],
        creado: en(d(-1), 12, 0),
        actualizado: en(d(-1), 12, 5),
        enviado: null,
        autor: nombreDe(u.conductorId),
      });
    }
  }

  // --- Estados de unidades que no se resuelven con un parte (C10, C12, C16) --------------------
  const unidadC10 = porRol("c10");
  const unidadC12 = porRol("c12");
  const unidadC16 = porRol("c16");
  const proyectoBase = proyectos.find((p) => p.id === idProyecto.base) as Proyecto;
  const proyectoPiedra = proyectos.find((p) => p.id === idProyecto.piedra) as Proyecto;
  evento({
    instante: en(H, 4, 0),
    unidadId: unidadC10.id,
    conductorId: unidadC10.conductorId,
    tipo: "asignacion-cambiada",
    resumen: RESUMEN_EVENTO.cambioDeProyecto(pat(unidadC10), proyectoBase.nombre, proyectoPiedra.nombre),
    datos: {
      antes: { proyectoId: proyectoBase.id, conductorId: unidadC10.conductorId },
      despues: { proyectoId: proyectoPiedra.id, conductorId: unidadC10.conductorId },
    },
    autor: ENCARGADA,
  });

  unidadC12.estado = {
    tipo: "fuera-de-servicio",
    desde: d(-5),
    motivo: "En taller: cambio de embrague",
    origen: "manual",
    novedadIds: [],
  };
  evento({
    instante: en(d(-5), 14, 0),
    unidadId: unidadC12.id,
    conductorId: null,
    tipo: "fuera-de-servicio",
    resumen: RESUMEN_EVENTO.fueraDeServicio(pat(unidadC12), "En taller: cambio de embrague"),
    datos: { origen: "manual", motivo: "En taller: cambio de embrague" },
    autor: ENCARGADA,
  });

  unidadC16.estado = { tipo: "baja", desde: d(-28), motivo: "Venta de la unidad" };
  evento({
    instante: en(d(-28), 15, 0),
    unidadId: unidadC16.id,
    conductorId: null,
    tipo: "unidad-baja",
    resumen: RESUMEN_EVENTO.unidadBaja(pat(unidadC16), "Venta de la unidad"),
    datos: { motivo: "Venta de la unidad", estadoAnterior: "en-servicio" },
    autor: ENCARGADA,
  });

  // --- Historial: orden cronológico y secuencia creciente (H3) ---------------------------------
  const ordenados = eventos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.instante === b.e.instante ? a.i - b.i : a.e.instante < b.e.instante ? -1 : 1))
    .map(({ e }, i): Evento => ({ ...e, id: `e-${String(i + 1).padStart(5, "0")}`, secuencia: i + 1 }));

  return {
    meta: { versionEsquema: 1, semilla, fechaBase, modificada: false, perfil: { tipo: "encargado" } },
    proyectos,
    conductores,
    unidades,
    documentos,
    partes,
    novedades,
    correccionesKm,
    eventos: ordenados,
  };
}
