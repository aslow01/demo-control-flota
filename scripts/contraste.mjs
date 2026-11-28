// Mide los contrastes de la paleta (docs/diseno-ui.md, secciones 3.3 y 15.3.3) leyendo los valores reales de src/estilos/tokens.css,
// en claro y en oscuro. Fórmula de luminancia relativa de WCAG 2.x. Sale con código 1 si algún par falla o no se puede medir.
// Uso: npm run contraste. Un par "justo" (menos de 0,3 por encima del mínimo) se marca con "~" para mirarlo antes de tocar la paleta.
//
// tokens.css se puede escribir de dos maneras y el script lee las dos:
//   1. `light-dark(claro, oscuro)` en cada token, dentro de `:root`;
//   2. dos bloques: `:root { … }` con los valores claros y los oscuros repetidos en
//      `@media (prefers-color-scheme: dark) { :root:not([data-modo="claro"]) { … } }` y en `:root[data-modo="oscuro"] { … }`.
// Los demás bloques (`.objeto { … }`, componentes) se ignoran: lo que se mide es lo que vale en `:root`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Un par es «justo» si queda a menos de esto por encima de su mínimo. */
export const MARGEN_JUSTO = 0.3;

// ---------- Lectura de tokens ----------

/** Parte `texto` por las comas que no están dentro de paréntesis. */
function partirComas(texto) {
  const partes = [];
  let profundidad = 0;
  let inicio = 0;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === "(") profundidad++;
    else if (c === ")") profundidad--;
    else if (c === "," && profundidad === 0) {
      partes.push(texto.slice(inicio, i).trim());
      inicio = i + 1;
    }
  }
  partes.push(texto.slice(inicio).trim());
  return partes;
}

/** Los bloques `prelude { cuerpo }` del nivel superior de `texto` (el cuerpo de un @media se vuelve a recorrer aparte). */
function bloques(texto) {
  const salida = [];
  let inicio = 0;
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (c === ";") {
      inicio = i + 1;
    } else if (c === "{") {
      let profundidad = 1;
      let j = i + 1;
      while (j < texto.length && profundidad > 0) {
        if (texto[j] === "{") profundidad++;
        else if (texto[j] === "}") profundidad--;
        j++;
      }
      salida.push({ prelude: texto.slice(inicio, i).trim().replace(/\s+/g, " "), cuerpo: texto.slice(i + 1, j - 1) });
      inicio = j;
      i = j;
      continue;
    }
    i++;
  }
  return salida;
}

/** Declaraciones `--nombre: valor` de un cuerpo (el `;` dentro de paréntesis no corta). */
function declaraciones(cuerpo) {
  const salida = [];
  let profundidad = 0;
  let inicio = 0;
  const cortes = [];
  for (let i = 0; i <= cuerpo.length; i++) {
    const c = cuerpo[i];
    if (c === "(") profundidad++;
    else if (c === ")") profundidad--;
    else if ((c === ";" && profundidad === 0) || i === cuerpo.length) {
      cortes.push(cuerpo.slice(inicio, i));
      inicio = i + 1;
    }
  }
  for (const corte of cortes) {
    const m = /^\s*--([a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/.exec(corte);
    if (m !== null) salida.push([m[1], m[2]]);
  }
  return salida;
}

const SELECTOR_BASE = /^:root(?::not\(\[data-modo=["']?claro["']?\]\))?$/;
const SELECTOR_CLARO = /^:root\[data-modo=["']?claro["']?\]$/;
const SELECTOR_OSCURO = /^:root\[data-modo=["']?oscuro["']?\]$/;

/**
 * Lee los tokens (`--c-*`, `--obj-*`, …) de un CSS en los dos modos. Devuelve los valores crudos, con alias y `color-mix` sin resolver.
 * Lanza un error con mensaje claro si no hay ningún bloque `:root`.
 */
export function leerTokens(css) {
  const texto = css.replaceAll("\r\n", "\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const claro = {};
  const oscuroExplicito = {};
  let hayRaiz = false;

  const aplicar = (cuerpo, destino) => {
    for (const [nombre, valor] of declaraciones(cuerpo)) {
      const ld = /^light-dark\(([\s\S]*)\)$/.exec(valor);
      if (ld === null) {
        if (destino === "claro" || destino === "ambos") claro[nombre] = valor;
        if (destino === "oscuro" || destino === "ambos") oscuroExplicito[nombre] = valor;
        continue;
      }
      const dos = partirComas(ld[1]);
      if (dos.length !== 2 || dos[0] === "" || dos[1] === "") throw new Error(`light-dark() mal formado en --${nombre}: ${valor}`);
      if (destino !== "oscuro") claro[nombre] = dos[0];
      if (destino !== "claro") oscuroExplicito[nombre] = dos[1];
    }
  };

  const recorrer = (fuente, enMediaOscura) => {
    for (const { prelude, cuerpo } of bloques(fuente)) {
      if (prelude.startsWith("@media")) {
        if (/prefers-color-scheme:\s*dark/.test(prelude)) recorrer(cuerpo, true);
      } else if (prelude.startsWith("@")) {
        continue;
      } else if (SELECTOR_BASE.test(prelude)) {
        hayRaiz = true;
        aplicar(cuerpo, enMediaOscura ? "oscuro" : "ambos");
      } else if (SELECTOR_OSCURO.test(prelude)) {
        hayRaiz = true;
        aplicar(cuerpo, "oscuro");
      } else if (SELECTOR_CLARO.test(prelude) && !enMediaOscura) {
        hayRaiz = true;
        aplicar(cuerpo, "claro");
      }
    }
  };
  recorrer(texto, false);

  if (!hayRaiz) throw new Error("No se encontró ningún bloque `:root` en el CSS de tokens: ¿cambió la estructura del archivo?");
  return { claro, oscuro: { ...claro, ...oscuroExplicito } };
}

// ---------- Resolución de colores ----------

/** Sigue los alias `var(--otro)` hasta un valor que no lo es (puede seguir siendo un `color-mix` con `var()` adentro). */
export function resolverToken(tokens, nombre) {
  let actual = nombre;
  for (let pasos = 0; pasos <= 16; pasos++) {
    const valor = tokens[actual];
    if (valor === undefined) throw new Error(`Falta el token --${actual}`);
    const alias = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(valor);
    if (alias === null) return valor;
    actual = alias[1];
  }
  throw new Error(`Alias circular en --${nombre}`);
}

function rgb(hex) {
  const corto = /^#([0-9a-f]{3})$/i.exec(hex);
  const largo = /^#([0-9a-f]{6})$/i.exec(hex);
  if (corto === null && largo === null) throw new Error(`Color no soportado: ${hex}`);
  const digitos = largo !== null ? largo[1] : [...corto[1]].map((d) => d + d).join("");
  const n = parseInt(digitos, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hex de un color [r, g, b] (para mostrar). */
export function aHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function colorDeValor(tokens, valor, profundidad) {
  if (profundidad > 16) throw new Error(`Alias circular al resolver ${valor}`);
  const alias = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(valor);
  if (alias !== null) return colorDeToken(tokens, alias[1], profundidad + 1);
  const mezcla = /^color-mix\(([\s\S]*)\)$/.exec(valor);
  if (mezcla === null) return rgb(valor);
  // color-mix(in srgb, A p%, B [q%]): solo el espacio sRGB, que es el que usa la hoja.
  const [espacio, a, b] = partirComas(mezcla[1]);
  if (espacio !== "in srgb" || a === undefined || b === undefined) throw new Error(`Color no soportado: ${valor}`);
  const partir = (texto) => {
    const m = /^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/.exec(texto);
    return { color: colorDeValor(tokens, m[1].trim(), profundidad + 1), pct: m[2] === undefined ? undefined : Number(m[2]) };
  };
  const pa = partir(a);
  const pb = partir(b);
  const pesoA = pa.pct ?? (pb.pct === undefined ? 50 : 100 - pb.pct);
  const pesoB = pb.pct ?? 100 - pesoA;
  const suma = pesoA + pesoB;
  return pa.color.map((c, i) => (c * pesoA + pb.color[i] * pesoB) / suma);
}

/** Color [r, g, b] de un token en un modo (`tokens` es `leerTokens(css).claro` o `.oscuro`). */
export function colorDeToken(tokens, nombre, profundidad = 0) {
  return colorDeValor(tokens, resolverToken(tokens, nombre), profundidad);
}

// ---------- Medición ----------

/** Luminancia relativa de WCAG 2.x. */
export function luminancia(color) {
  const [r, g, b] = color.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste entre dos colores (de 1 a 21; no depende del orden). */
export function razonDeContraste(a, b) {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (oscura + 0.05);
}

/** Mide un par en un modo. No lanza: un token faltante o un color no soportado vuelve como `estado: "error"`. */
export function medirPar(tokens, par) {
  try {
    const razon = razonDeContraste(colorDeToken(tokens, par.a), colorDeToken(tokens, par.b));
    const estado = razon < par.minimo ? "falla" : razon < par.minimo + MARGEN_JUSTO ? "justo" : "ok";
    return { razon, estado };
  } catch (e) {
    return { razon: null, estado: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Lee `css` y mide todos los pares en claro y en oscuro. Los pares con `solo` se miden únicamente en ese modo. */
export function medirTodo(css, pares = PARES) {
  const { claro, oscuro } = leerTokens(css);
  const filas = pares.map((par) => ({
    par,
    claro: par.solo === "oscuro" ? null : medirPar(claro, par),
    oscuro: par.solo === "claro" ? null : medirPar(oscuro, par),
  }));
  const medidas = filas.flatMap((f) => [f.claro, f.oscuro]).filter((m) => m !== null);
  const cuenta = (estado) => medidas.filter((m) => m.estado === estado).length;
  return { filas, mediciones: medidas.length, fallos: cuenta("falla"), justos: cuenta("justo"), errores: cuenta("error") };
}

// ---------- Tabla de pares ----------
// Formato de un par: { grupo, a, b, minimo, solo? }. `a` es el texto o la marca y `b` el fondo, con el nombre del token sin los dos guiones.
// `minimo` es 4,5 (texto) o 3 (marcas, bordes de controles, objetos: 1.4.11). `solo: "claro" | "oscuro"`: el par no se usa en el otro modo.

/**
 * Pares con los nombres `--c-*` de antes del rediseño (siguen siendo la interfaz: en la hoja nueva son alias). Sin repetidos y sin los que ya están en los nuevos.
 * T6 (28/11/2026) retiró los pares que la paleta «Pie de rey» deja de usar por diseño (docs/diseno-ui.md, 15.3.3 y 15.3.4), medidos antes de sacarlos:
 *   - `patente-fondo` con `acento`, `texto` y `borde-fuerte`, y `patente-fondo` con `patente-banda`: la chapa pasa a ser un objeto de papel claro con sus propios `obj-*` (los pares de objeto están en PARES_NUEVOS);
 *   - `peligro-texto` con `critico-r` (de noche 3,77) y con `peligro-hover` (de día 1,28): el botón de peligro pasa a ser de contorno (15.5.1) y ningún texto va sobre la marca crítica;
 *   - `lat-activo` con `lat` (de día 2,35): el destino activo no se reconoce por ese par (15.3.3, final).
 */
function paresVigentes(yaEstan) {
  const lista = [];
  const par = (grupo, a, b, minimo) => lista.push({ grupo, a: `c-${a}`, b: `c-${b}`, minimo });
  const tonos = ["ok", "pendiente", "revisar", "diferencia", "neutro"];
  const fondosTexto = ["superficie", "escritorio", "superficie-2", "fondo"];

  for (const f of fondosTexto) for (const t of ["texto", "texto-2", "texto-3"]) par("Texto", t, f, 4.5);
  for (const t of ["texto", "texto-2", "texto-3"]) par("Texto", t, "ventana-barra", 4.5);
  par("Texto", "texto", "acento-suave", 4.5);
  // M1: la marca «Para probar: …» del diálogo de conductores (`pendiente-t`) sobre la fila elegida (acento-suave) y con el cursor encima (superficie-2).
  par("Marca «Para probar» (M1, fila elegida)", "pendiente-t", "acento-suave", 4.5);
  par("Marca «Para probar» (M1, cursor encima)", "pendiente-t", "superficie-2", 4.5);

  for (const f of ["superficie", "superficie-2", "escritorio", "ventana-barra"]) par("Acento (enlace, texto)", "acento", f, 4.5);
  par("Botón primario", "acento-texto", "acento", 4.5);
  par("Botón primario (hover)", "acento-texto", "acento-hover", 4.5);
  par("Botón peligro (cobre sólido)", "sobre-solido", "critico-solido", 4.5);
  par("Botón secundario deshabilitado", "texto-3", "superficie", 4.5);
  par("Texto de botón de texto sobre barra", "acento", "ventana-barra", 4.5);

  for (const f of ["superficie", "superficie-2"]) par("Bordes de controles (1.4.11)", "borde-fuerte", f, 3);
  for (const t of tonos) par("Borde del botón secundario sobre los avisos (3:1)", "borde-fuerte", `${t}-f`, 3);
  par("Línea elegida del acento", "acento", "superficie", 3);
  par("Línea elegida del acento", "acento", "acento-suave", 3);

  for (const t of tonos) par("Etiqueta (texto / fondo)", `${t}-t`, `${t}-f`, 4.5);
  for (const t of tonos) par("Tono / barra de título (conteos)", `${t}-t`, "ventana-barra", 4.5);
  for (const t of tonos) par("Tono / superficie (mensajes)", `${t}-t`, "superficie", 4.5);
  par("Error en campo (texto crítico / superficie)", "critico-t", "superficie", 4.5);
  par("Error en campo (texto crítico / fondo crítico)", "critico-t", "critico-f", 4.5);
  for (const t of ["vigente", "semana", "quincena", "mes", "critico"]) par("Marca del horizonte / pista (3:1)", t === "vigente" ? "ok-r" : `${t}-r`, "superficie-2", 3);
  for (const t of ["ok", "pendiente", "revisar", "diferencia"]) par("Franja / superficie (3:1)", `${t}-r`, "superficie", 3);
  par("Borde de campo inválido / superficie (3:1)", "critico-r", "superficie", 3);
  par("Línea de hoy / pista", "hoy", "superficie-2", 3);

  for (const t of tonos) par("Foco (acento) sobre fondos de tono (3:1)", "foco", `${t}-f`, 3);
  for (const t of tonos) par("Texto / fondos de tono (segmento elegido)", "texto", `${t}-f`, 4.5);
  for (const f of ["superficie", "superficie-2", "fondo"]) par("Puede salir (variante texto, D1)", "vigente-t", f, 4.5);
  par("Texto / fondo crítico (D4, avisos)", "texto", "critico-f", 4.5);
  par("Aviso Cerrar antes (texto / fondo semana)", "texto", "semana-f", 4.5);
  par("Aviso Cerrar antes (ícono i-lapiz / fondo semana)", "semana-t", "semana-f", 4.5);
  par("Sin licencia vigente (texto crítico / fila con hover)", "critico-t", "superficie-2", 4.5);
  par("Indicador de guardado con error / fondo", "critico-t", "fondo", 4.5);
  par("Renglón de contexto del parte (texto secundario / fondo)", "texto-2", "fondo", 4.5);
  par("Resumen de la revisión (texto / fondo)", "texto", "fondo", 4.5);
  par("Marca de «De baja» (neutro-r / acento-suave, B8)", "neutro-r", "acento-suave", 3);
  par("Franja de baja con el cursor (neutro-r / superficie-2, B8)", "neutro-r", "superficie-2", 3);
  par("Foco / superficie", "foco", "superficie", 3);
  par("Foco / escritorio", "foco", "escritorio", 3);

  // Paleta «Turno» (E0-M, 25/11/2026).
  for (const f of ["superficie", "superficie-2", "escritorio"]) par("Enlace azurita (texto / fondo)", "enlace", f, 4.5);
  par("Enlace azurita (texto / fila elegida)", "enlace", "acento-suave", 4.5);
  par("Tinta: texto sobre tinta (botón, pastilla, aviso)", "sobre-tinta", "tinta", 4.5);
  par("Tinta: texto sobre tinta con el cursor encima", "sobre-tinta", "tinta-hover", 4.5);
  for (const f of ["superficie", "escritorio"]) par("Tinta / superficie (pestaña activa, barra de solapa)", "tinta", f, 3);
  par("Texto secundario / fila elegida", "texto-2", "acento-suave", 4.5);
  par("Texto terciario / fila elegida", "texto-3", "acento-suave", 4.5);
  par("Cobre sólido: leyenda chica de la cifra / fondo", "sobre-solido-2", "critico-solido", 4.5);
  par("Cobre sólido: anillo de foco / fondo (3:1)", "foco-oscuro", "critico-solido", 3);
  par("Borde de «Con novedad» (cobre / fondo, 3:1)", "critico-r", "escritorio", 3);
  par("Insignia neutra (superficie / texto secundario)", "superficie", "texto-2", 4.5);
  for (const t of ["semana", "mes", "quincena", "critico", "vigente", "neutro"]) par("Marca / fondo de su tramo (3:1)", `${t}-r`, `${t}-f`, 3);
  par("Franja de «Fuera de servicio» por taller (neutro-r / superficie, 3:1)", "neutro-r", "superficie", 3);
  par("Lateral: texto / fondo", "lat-tx", "lat", 4.5);
  par("Lateral: texto secundario / fondo", "lat-tx-2", "lat", 4.5);
  par("Lateral: ítem activo (texto / fondo del activo)", "lat-activo-tx", "lat-activo", 4.5);
  par("Lateral: anillo de foco / fondo (3:1)", "foco-oscuro", "lat", 3);

  const vistos = new Set(yaEstan.map((p) => `${p.a}|${p.b}|${p.minimo}`));
  return lista.filter((p) => {
    const clave = `${p.a}|${p.b}|${p.minimo}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

/** Los 124 pares de la sección 15.3.3 de docs/diseno-ui.md (nombres del sistema nuevo y objetos). Un par nuevo se agrega allá y acá antes de usarlo. */
function paresNuevos() {
  const lista = [];
  const par = (grupo, a, b, minimo, solo) => lista.push(solo === undefined ? { grupo, a, b, minimo } : { grupo, a, b, minimo, solo });
  const planos = ["c-papel", "c-hoja", "c-papel-2"];
  const conSuave = [...planos, "c-pleno-suave"];

  for (const t of ["c-tinta", "c-tinta-2", "c-tinta-3"]) for (const f of planos) par("Texto", t, f, 4.5);
  for (const t of ["c-tinta", "c-tinta-2", "c-tinta-3"]) par("Texto en fila elegida", t, "c-pleno-suave", 4.5);
  for (const f of conSuave) par("Enlace", "c-pleno-texto", f, 4.5);
  for (const f of [...conSuave, "c-crit-fondo", "c-aten-fondo", "c-ok-fondo"]) par("Foco (3:1)", "c-pleno-texto", f, 3);
  par("Foco sobre lo oscuro (3:1)", "c-foco-oscuro", "c-lat", 3);
  par("Foco sobre lo oscuro (3:1)", "c-foco-oscuro", "c-crit-relleno", 3);
  par("Foco sobre el pleno (3:1)", "c-sobre-pleno", "c-pleno", 3);
  par("Canto (3:1)", "c-sobre-pleno", "c-crit-relleno", 3, "claro");
  par("Campos (3:1)", "c-pleno", "c-crit-relleno", 3, "oscuro");
  par("Tinta como acción", "c-sobre-tinta", "c-tinta", 4.5);
  par("Tinta como acción", "c-sobre-tinta", "c-tinta-hover", 4.5);
  for (const f of planos) par("Canto del primario (3:1)", "c-tinta-borde", f, 3);
  for (const f of conSuave) par("Tinta como marca (3:1)", "c-tinta", f, 3);
  for (const f of [...conSuave, "c-crit-fondo"]) par("Control (3:1)", "c-control", f, 3);
  par("Deshabilitado", "c-tinta-3", "c-papel-2", 4.5);
  par("Pleno", "c-sobre-pleno", "c-pleno", 4.5);
  par("Pleno", "c-sobre-pleno-2", "c-pleno", 4.5);
  par("Pleno", "c-sobre-pleno", "c-pleno-hover", 4.5);
  par("Pleno", "c-sobre-pleno-2", "c-pleno-hover", 4.5);
  for (const f of ["c-papel", "c-hoja"]) par("Pleno como campo (3:1)", "c-pleno", f, 3);
  for (const f of [...planos, "c-crit-fondo", "c-pleno-suave"]) par("Crítico (texto)", "c-crit", f, 4.5);
  par("Crítico (texto)", "c-tinta", "c-crit-fondo", 4.5);
  par("Crítico (texto)", "c-tinta-2", "c-crit-fondo", 4.5);
  par("Crítico (relleno)", "c-sobre-solido", "c-crit-relleno", 4.5);
  for (const f of [...planos, "c-crit-fondo"]) par("Crítico (marca, 3:1)", "c-crit-marca", f, 3);
  for (const f of ["c-hoja", "c-papel"]) par("Crítico (campo, 3:1)", "c-crit-relleno", f, 3);
  for (const f of [...planos, "c-aten-fondo", "c-pleno-suave"]) par("Atención (texto)", "c-aten", f, 4.5);
  par("Atención (texto)", "c-tinta", "c-aten-fondo", 4.5);
  par("Atención (texto)", "c-tinta-2", "c-aten-fondo", 4.5);
  for (const f of [...planos, "c-aten-fondo"]) par("Atención (marca, 3:1)", "c-aten-relleno", f, 3);
  for (const f of [...planos, "c-ok-fondo", "c-pleno-suave"]) par("En orden (texto)", "c-ok", f, 4.5);
  par("En orden (texto)", "c-tinta", "c-ok-fondo", 4.5);
  par("En orden (texto)", "c-tinta-2", "c-ok-fondo", 4.5);
  for (const f of ["c-hoja", "c-papel-2", "c-pleno-suave"]) par("Mes y neutro (marca, 3:1)", "c-tinta-3", f, 3);
  par("Lateral", "c-lat-tx", "c-lat", 4.5);
  par("Lateral", "c-lat-tx-2", "c-lat", 4.5);

  // Objetos: lo que se toca y representa una cosa física (chapa, llave, rótulo de cota). De noche siguen siendo papel claro.
  par("Objeto", "obj-tinta", "obj-hoja", 4.5);
  par("Objeto", "obj-tinta", "obj-papel", 4.5);
  par("Objeto", "obj-tinta", "obj-papel-2", 4.5);
  par("Objeto", "obj-tinta-2", "obj-hoja", 4.5);
  par("Objeto", "obj-tinta-2", "obj-papel-2", 4.5);
  par("Objeto", "obj-tinta-3", "obj-hoja", 4.5);
  par("Objeto", "obj-tinta-3", "obj-papel", 4.5);
  par("Objeto", "obj-tinta", "obj-pleno-suave", 4.5);
  par("Objeto", "obj-tinta-2", "obj-pleno-suave", 4.5);
  par("Objeto", "obj-sobre-franja", "obj-franja", 4.5);
  par("Objeto", "obj-crit", "obj-crit-fondo", 4.5);
  par("Objeto", "obj-ok", "obj-ok-fondo", 4.5);
  par("Objeto", "obj-enlace", "obj-hoja", 4.5);
  par("Objeto", "obj-crit", "obj-hoja", 4.5);
  par("Objeto", "obj-aten", "obj-hoja", 4.5);
  par("Objeto", "obj-aten", "obj-aten-fondo", 4.5);
  par("Objeto", "obj-ok", "obj-hoja", 4.5);
  par("Objeto", "c-sobre-solido", "obj-crit-relleno", 4.5);
  par("Objeto (marca, 3:1)", "obj-franja", "obj-hoja", 3);
  par("Objeto (marca, 3:1)", "obj-control", "obj-hoja", 3);
  par("Objeto (marca, 3:1)", "obj-crit-relleno", "obj-hoja", 3);
  par("Objeto (marca, 3:1)", "obj-aten-relleno", "obj-hoja", 3);
  par("Objeto (marca, 3:1)", "obj-tinta-3", "obj-papel-2", 3);
  par("Objeto (marca, 3:1)", "obj-contorno", "obj-crit-relleno", 3, "oscuro");
  par("Objeto (marca, 3:1)", "obj-contorno", "obj-franja", 3, "oscuro");
  // El objeto contra el plano: de día se recorta por su contorno o su cuerpo, de noche por su papel claro.
  par("Objeto contra el plano (3:1)", "obj-tinta", "c-papel", 3, "claro");
  par("Objeto contra el plano (3:1)", "obj-tinta", "c-hoja", 3, "claro");
  for (const f of ["c-papel", "c-hoja", "c-papel-2", "c-pleno-suave"]) par("Objeto contra el plano (3:1)", "obj-hoja", f, 3, "oscuro");
  for (const f of planos) par("Objeto contra el plano (3:1)", "obj-crit-relleno", f, 3, "claro");
  par("Objeto contra el plano (3:1)", "obj-franja", "c-papel", 3, "claro");
  for (const f of planos) par("Objeto contra el plano (3:1)", "obj-contorno", f, 3, "oscuro");
  return lista;
}

export const PARES_NUEVOS = paresNuevos();
export const PARES_VIGENTES = paresVigentes(PARES_NUEVOS);
export const PARES = [...PARES_VIGENTES, ...PARES_NUEVOS];

// ---------- Programa principal ----------

function main() {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  const css = readFileSync(join(raiz, "src", "estilos", "tokens.css"), "utf8");
  const { filas, mediciones, fallos, justos, errores } = medirTodo(css);
  const fmt = (n) => n.toFixed(2).replace(".", ",");
  const celda = (m) => {
    if (m === null) return "     —";
    if (m.estado === "error") return "   ERR";
    const marca = m.estado === "falla" ? "x" : m.estado === "justo" ? "~" : " ";
    return `${marca}${fmt(m.razon).padStart(5)}`;
  };
  console.log("Contraste de la paleta (claro | oscuro). Marca: x falla, ~ justo (< 0,3 sobre el mínimo), ERR no se pudo medir, — no se usa en ese modo.\n");
  let grupoActual = "";
  for (const { par, claro, oscuro } of filas) {
    if (par.grupo !== grupoActual) {
      grupoActual = par.grupo;
      console.log(`\n${grupoActual}`);
    }
    const nombre = `${par.a} / ${par.b}`;
    console.log(`  ${nombre.padEnd(44)} ${celda(claro)}  |  ${celda(oscuro)}   (mínimo ${par.minimo})`);
  }
  const mensajes = new Set(filas.flatMap((f) => [f.claro, f.oscuro]).flatMap((m) => (m?.estado === "error" ? [m.error] : [])));
  if (mensajes.size > 0) {
    console.log(`\nNo se pudieron medir (${mensajes.size} causas distintas):`);
    for (const m of mensajes) console.log(`  - ${m}`);
  }
  console.log(`\n${mediciones} mediciones: ${fallos} fallan, ${justos} justas, ${errores} con error.`);
  process.exitCode = fallos > 0 || errores > 0 ? 1 : 0;
}

// `pathToFileURL` arma la misma URL que `import.meta.url` en Windows y en Linux (CI); así los tests importan el módulo sin que corra `main`.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(`FALLA: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 2;
  }
}
