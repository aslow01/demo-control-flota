# Diseño — Control de flota (18/11/2026)

Escrito antes del código, **desde cero**, a partir de un único enunciado: la ficha "Demo 2 — Control de flota" y las
"Reglas comunes" del documento de demos del portafolio de Matías Ariel Ormeño. No se consultó ningún sistema, repositorio,
documento ni dato de terceros. Todos los datos son ficticios.

Documentos hermanos: `docs/diseno-ui.md` (pantallas y sistema visual), `docs/stack.md` (tecnología), `docs/plan.md`
(pasos de implementación). Si algo de acá no alcanza para programar sin adivinar, es un defecto de este documento:
se pregunta antes de inventar.

---

## 1. Problema

En proyectos con muchas camionetas se escapan los vencimientos (seguro, revisión técnica, habilitaciones) y los partes
diarios quedan en papel: nadie sabe a primera hora qué unidad no puede salir, qué documento vence esta semana ni qué
novedad informó un conductor hace tres días.

La demo muestra una herramienta que responde, en una pantalla, **"¿qué no puede salir hoy y qué vence pronto?"**, y un
parte diario que el conductor completa desde el celular sin perder lo escrito.

## 2. Usuarios

| Perfil | Dónde la usa | Qué necesita | Qué hace en la demo |
| --- | --- | --- | --- |
| **Encargado de flota** | Escritorio (también celular) | Saber a primera hora qué unidades no pueden salir y por qué; planificar renovaciones; cerrar novedades. | Centro de alertas, flota, ficha de unidad, renovar documentos, resolver novedades, poner fuera de servicio o volver a servicio, corregir kilometraje, alta de unidades. |
| **Conductor** | Celular, a veces con mala señal y con guantes | Revisar la unidad **antes de salir** y cerrar el parte al terminar la jornada, en dos o tres minutos cada vez, sin perder lo escrito. | Parte diario de su unidad en dos pasos: **revisión antes de salir** (kilometraje inicial, checklist y novedades) y **cierre** (kilometraje final y combustible). Ve sus últimos partes y el vencimiento de su licencia. Con la licencia vencida o faltante no puede enviar la revisión (L1). |

Lectores del portafolio (no son usuarios de la herramienta, pero la evalúan): un **gerente de logística o
administración** (tiene que entender en 10 segundos que "nada se escapa") y un **líder técnico** (mira reglas, bordes de
fecha, accesibilidad, pruebas).

**Sin login.** El perfil se elige con un selector "Ver como: Encargado | Conductor" (y, como conductor, se elige una
persona ficticia). Es una perspectiva, no un control de acceso: la interfaz lo dice.

## 3. Alcance

| Prioridad | Qué entra |
| --- | --- |
| **P1 (mínimo, ficha)** | Flota ficticia precargada en IndexedDB; centro de alertas con vencimientos a 7, 15 y 30 días; flota; ficha de unidad con documentos e historial; parte diario con checklist, kilometraje, combustible y novedades; botón "Reiniciar demo". Sin login, sin servidor. |
| **P1 (necesario para que las reglas se vean)** | Renovar y cargar documentos; resolver novedades; fuera de servicio / volver a servicio; corrección de kilometraje; alta de unidad; borrador automático del parte. |
| **P2 (extras de la ficha)** | Exportar el parte a PDF **con la impresión del navegador** (`window.print()` y hoja de estilos de impresión: cero dependencias); modo sin conexión (PWA: `manifest` y *service worker* propios); "fecha de consulta" simulada (ver decisión D4). |
| **P3** | Fotos en el parte (guardadas como `Blob` en IndexedDB, reescaladas y recodificadas con `canvas` para quitar metadatos EXIF, que pueden traer la ubicación; tope de tamaño). |
| **Fuera** | Login, roles con permisos reales, servidor, GPS o mapas, consumo por kilómetro, órdenes de taller, costos, integración con aseguradoras o plantas de revisión, notificaciones por correo. |

## 4. Glosario

| Término | Significado en la demo |
| --- | --- |
| Unidad | Vehículo de la flota (camioneta, utilitario, camión liviano, minibús). Se identifica por **patente** y por **número interno**. |
| Documento | Algo con fecha de vencimiento, de una unidad (seguro, revisión técnica, habilitación de ingreso al proyecto, carga del matafuego) o de un conductor (licencia de conducir, habilitación de manejo). |
| Vigente | El documento que cuenta para un titular y un tipo (ver V9). Los anteriores quedan como historial. |
| Parte diario | Registro de una unidad en una fecha, en dos pasos: **revisión antes de salir** y **cierre**. Uno por unidad y por fecha. |
| Revisión antes de salir | Primer paso del parte: kilometraje al iniciar, los 10 puntos del checklist y "Otra novedad". Se envía **antes de usar la unidad**; sus novedades se abren en ese momento (A3 incluido). |
| Cierre | Segundo paso: kilometraje al terminar, nivel de combustible y litros cargados. Se envía al terminar la jornada. |
| Borrador | Parte con la revisión todavía sin enviar. Se guarda solo mientras se escribe. |
| En uso | Parte con la revisión enviada y el cierre pendiente: la unidad salió. |
| Sin salida | Parte cuya revisión informó una novedad crítica: la unidad quedó fuera de servicio, no salió, y el parte se cerró en ese momento (recorrido 0). |
| Licencia vigente para una fecha | La licencia de conducir del conductor **ampara** esa fecha: vence ese día o después y ya existía ese día (misma regla que M1, sección 16). |
| Novedad | Problema informado (desde un parte o a mano). Crítica si impide usar la unidad. |
| Fuera de servicio | Estado de una unidad que no debe usarse (taller, novedad crítica). |
| Puede salir / No puede salir | **Aptitud** calculada (no guardada) de una unidad en servicio para el día de hoy (ver A1). |
| Hoy | La fecha civil en la zona horaria de Argentina (ver T1). |
| Fecha civil | Una fecha sin hora (`AAAA-MM-DD`). Vencimientos y partes son fechas civiles. |
| Instante | Un momento exacto en UTC (`2026-11-18T17:32:00.000Z`). Los eventos del historial llevan instante. |

## 5. Modelo de datos

Tipos en TypeScript (orientativos: los nombres finales los fija el programador, sin cambiar el significado).

```ts
type FechaCivil = string; // 'AAAA-MM-DD', siempre validada con parsearFechaCivil (T4)
type Instante = string;   // ISO 8601 en UTC

interface Empresa { nombre: string; cuit: string }          // ficticia, constante del generador

interface Proyecto {
  id: string;
  nombre: string;                 // inventado
  requiereHabilitacion: boolean;  // false para la base de mantenimiento
}

interface Conductor {
  id: string;
  nombre: string;                 // inventado
  legajo: string;                 // inventado, 'L-0123'
  activo: boolean;
}

type TipoUnidad = 'camioneta' | 'utilitario' | 'camion-liviano' | 'minibus';

type EstadoOperativo =
  | { tipo: 'en-servicio' }
  | { tipo: 'fuera-de-servicio'; desde: FechaCivil; motivo: string;
      origen: 'manual' | 'novedad-critica'; novedadIds: string[] }
  | { tipo: 'baja'; desde: FechaCivil; motivo: string };

interface Unidad {
  id: string;
  patente: string;                // normalizada: 'ZK214BD' o 'ZKB482' (U1)
  interno: number;                // 1 a 999, se muestra 'Int. 07'
  marca: string; modelo: string; anio: number;
  tipo: TipoUnidad;
  proyectoId: string;
  conductorId: string | null;     // conductor asignado habitualmente
  estado: EstadoOperativo;
  creada: Instante;
}

type TipoDocumento =
  | 'seguro' | 'revision-tecnica' | 'habilitacion-proyecto' | 'matafuego'   // de unidad
  | 'licencia' | 'habilitacion-manejo';                                       // de conductor

interface Documento {
  id: string;
  titular: { tipo: 'unidad' | 'conductor'; id: string };
  tipo: TipoDocumento;
  numero: string;                 // póliza, certificado… (texto libre, ≤ 40)
  emisor: string;                 // inventado, ≤ 80, puede quedar vacío
  vence: FechaCivil;
  emitido: FechaCivil | null;
  cargado: Instante;
  reemplazaA: string | null;      // id del documento que renovó
}

type NivelCombustible = 'reserva' | 'cuarto' | 'medio' | 'tres-cuartos' | 'lleno';

type RespuestaItem =
  | { estado: 'sin-responder' }
  | { estado: 'en-orden' }
  | { estado: 'con-novedad'; descripcion: string; impideUso: boolean };

interface Parte {
  id: string;
  unidadId: string;
  fecha: FechaCivil;
  conductorId: string | null;     // null solo en borrador
  // 'borrador' = revisión sin enviar; 'en-uso' = revisión enviada, cierre pendiente; 'enviado' = cerrado (sección 17).
  // En pantalla, 'enviado' se llama «Cerrado».
  estado: 'borrador' | 'en-uso' | 'enviado';
  revisado: Instante | null;      // cuándo se envió la revisión antes de salir (null en borrador)
  sinSalida: boolean;             // true = la revisión informó una novedad crítica y el parte se cerró ahí (P16)
  kmInicio: number | null;
  kmFin: number | null;
  combustible: NivelCombustible | null;
  litrosCargados: number | null;  // null = no cargó
  checklist: Record<ItemChecklist, RespuestaItem>;
  otraNovedad: { descripcion: string; impideUso: boolean } | null;
  advertenciasAceptadas: Advertencia[];      // K6, K7, P9
  documentacionVencida: TipoDocumento[];     // calculado al enviar la revisión (P9); solo documentos de la unidad
  creado: Instante; actualizado: Instante;
  enviado: Instante | null;       // cuándo se cerró el parte (cierre); en un parte sin salida, igual a `revisado`
  autor: string;                  // nombre del perfil que lo envió
}

interface Novedad {
  id: string;
  unidadId: string;
  origen: { tipo: 'parte'; parteId: string; item: ItemChecklist | 'otra' } | { tipo: 'manual' };
  descripcion: string;            // ≤ 500
  gravedad: 'critica' | 'normal';
  fecha: FechaCivil;              // fecha del parte o de la carga
  estado: 'abierta' | 'resuelta';
  resolucion: { texto: string; instante: Instante; autor: string } | null;
}

interface CorreccionKm {
  id: string; unidadId: string;
  desde: FechaCivil;              // a partir de esta fecha vale el nuevo kilometraje base
  kmBase: number;
  motivo: string;                 // ≥ 10 caracteres
  instante: Instante; autor: string;
}

interface Evento {               // historial: solo se agrega, nunca se edita ni se borra
  id: string;
  secuencia: number;              // creciente global, desempata instantes iguales
  instante: Instante;
  unidadId: string | null;
  conductorId: string | null;
  tipo: TipoEvento;               // tabla de la sección 8
  resumen: string;                // texto listo para mostrar, en español neutro
  datos: Record<string, unknown>; // antes/después, ids relacionados
  autor: string;
}

interface Meta {                  // un solo registro, clave 'estado'
  versionEsquema: number;         // 2 (sección 17.6)
  semilla: number;                // 20261118
  fechaBase: FechaCivil;          // "hoy" del día en que se generó la flota
  modificada: boolean;            // true en cuanto el visitante cambia algo
  perfil: { tipo: 'encargado' } | { tipo: 'conductor'; conductorId: string };
}
```

### 5.1 Requisitos por titular (constante `REQUISITOS`)

| Titular | Documento | Nombre en pantalla | ¿Obligatorio? |
| --- | --- | --- | --- |
| Unidad | `seguro` | Seguro | Sí |
| Unidad | `revision-tecnica` | Revisión técnica (VTV/RTO) | Sí |
| Unidad | `matafuego` | Carga del matafuego | Sí |
| Unidad | `habilitacion-proyecto` | Habilitación de ingreso al proyecto | Sí, si su proyecto tiene `requiereHabilitacion` |
| Conductor | `licencia` | Licencia de conducir | Sí. Sin licencia vigente no se envía la revisión (L1) |
| Conductor | `habilitacion-manejo` | Habilitación de manejo en el proyecto | No (alerta si está cargada y vence) |

Simplificación consciente: la revisión técnica se pide a todas las unidades (sin exenciones por antigüedad) y la clase
de licencia no se controla. Va en el README como límite.

### 5.2 Checklist (constante `ITEMS_CHECKLIST`, en este orden)

| Id | Texto | Crítico |
| --- | --- | --- |
| `frenos` | Frenos | Sí |
| `direccion` | Dirección | Sí |
| `neumaticos` | Neumáticos y rueda de auxilio | Sí |
| `luces` | Luces y balizas | Sí |
| `cinturones` | Cinturones de seguridad | Sí |
| `niveles` | Niveles de aceite y agua | No |
| `matafuego` | Matafuego a bordo | No |
| `botiquin` | Botiquín y kit de emergencia | No |
| `documentacion` | Documentación a bordo | No |
| `cabina` | Orden y limpieza de la cabina | No |

"Crítico" significa: una novedad en ese punto deja la unidad fuera de servicio (A3) **al enviar la revisión, antes de
salir**: la unidad no sale y el parte se cierra sin salida (P16). En los no críticos, el conductor puede marcar "Impide
usar la unidad" y el efecto es el mismo.

---

## 6. Reglas de negocio (tabla verificable)

Cada regla tiene un identificador y al menos un caso de test con entrada y resultado esperado. Los tests llevan el
identificador en su nombre (`it('V4: d = 8 cae en el grupo de 15 días')`), así la tabla y la suite se pueden cruzar.
`H` = fecha de hoy en los ejemplos: **2026-11-18** (miércoles), salvo que se diga otra cosa.

### 6.1 Tiempo y fechas (T)

| ID | Regla | Caso de test |
| --- | --- | --- |
| T1 | "Hoy" es la fecha civil, en la zona `America/Argentina/Buenos_Aires`, del instante que da un **reloj inyectado** (`ahora: () => Date`). Ningún módulo de dominio llama a `new Date()` por su cuenta. | `hoyEnArgentina(2026-11-18T02:59:59.999Z)` → `2026-11-17`; `hoyEnArgentina(2026-11-18T03:00:00.000Z)` → `2026-11-18`. |
| T2 | El resultado no depende de la zona horaria del equipo. Prohibido `getDate/getMonth/getHours/getDay` locales y `toLocaleDateString` sin `timeZone`. | La suite completa corre en CI con `TZ=UTC`, `TZ=Asia/Tokyo` y `TZ=America/Los_Angeles` (matriz) y da lo mismo. |
| T3 | Sin desfase fijo de −3 horas: se usa la base de zonas horarias del navegador (`Intl.DateTimeFormat` con `timeZone`). | `hoyEnArgentina(2009-01-15T02:30:00Z)` → `2009-01-15` (Buenos Aires usó UTC−2 en el verano 2008/09; con −3 fijo daría el 14). Verificado con el `Intl` de Node 24 el 18/11/2026. |
| T4 | Fecha civil: texto `AAAA-MM-DD` validado a mano (año 2000–2100, mes 1–12, día válido para el mes y año bisiesto). **Nunca** `new Date('AAAA-MM-DD')` (se interpreta en UTC y corre un día). | `2028-02-29` válida · `2027-02-29` inválida · `2026-11-31` inválida · `2026-1-5` inválida · `18/11/2026` inválida (la interfaz convierte antes). |
| T5 | `diasEntre(a, b)` = días de calendario de `a` a `b` (con signo), calculado con `Date.UTC(año, mes − 1, día)` / 86 400 000. | (2026-12-31, 2027-01-01) = 1 · (2028-02-28, 2028-03-01) = 2 · (2027-02-28, 2027-03-01) = 1 · (H, H) = 0 · (2026-11-18, 2026-11-11) = −7. |
| T6 | Los instantes se guardan en UTC y se muestran en hora de Argentina, formato `18/11/2026 14:32`. Fechas civiles: `18/11/2026`; con día: `miércoles 18/11/2026`. | `2026-11-18T17:32:00Z` → `18/11/2026 14:32` · `2026-11-18` → `miércoles 18/11/2026`. |
| T7 | `sumarAnios(f, n)`: el 29/02 pasa a 28/02 en años no bisiestos. | `sumarAnios(2028-02-29, 1)` → `2029-02-28`. |

### 6.2 Vencimientos (V)

`d = diasEntre(hoy, vence)`.

| ID | Regla | Caso de test |
| --- | --- | --- |
| V1 | `d < 0` → **vencido**. Texto "Vencido hace N días" ("hace 1 día" en singular). Grupo `vencidos`. | vence 2026-11-17 → vencido, N = 1, "Vencido hace 1 día". vence 2026-11-15 → "Vencido hace 3 días". |
| V2 | `d = 0` → **vence hoy**: todavía vale todo el día (hasta las 23:59:59 de Argentina). Grupo `7`. Texto "Vence hoy". | vence = H → grupo `7`, "Vence hoy"; la unidad **puede salir** (A2). |
| V3 | `1 ≤ d ≤ 7` → grupo `7`. Texto "Vence mañana" (d = 1) o "Vence en N días". | d = 1 → "Vence mañana" · d = 7 → grupo `7`. |
| V4 | `8 ≤ d ≤ 15` → grupo `15`. | d = 8 → grupo `15` · d = 15 → grupo `15`. |
| V5 | `16 ≤ d ≤ 30` → grupo `30`. | d = 16 → `30` · d = 30 → `30`. |
| V6 | `d > 30` → **vigente**, sin alerta. | d = 31 → sin alerta; en la ficha: "Vigente hasta 19/12/2026". |
| V7 | Los grupos son excluyentes: cada documento cae en uno solo (o en ninguno si está vigente). | Para todo d en [−400, 400]: exactamente una clasificación. |
| V8 | Borde con hora: el cambio de grupo ocurre a las 00:00 de Argentina, no a las 00:00 UTC. | vence 2026-11-17; instante 2026-11-18T02:59Z → "Vence hoy"; instante 2026-11-18T03:00Z → "Vencido hace 1 día". |
| V9 | **Documento vigente** de un titular y un tipo = el de `vence` más tardío. Los anteriores son historial y no generan alertas. | Seguro A vence 2026-11-10 y su renovación B vence 2027-11-10 → solo B cuenta; sin alerta de seguro. |
| V10 | Una renovación tiene que vencer **después** del vigente. | Vigente 2026-11-25; renovar con 2026-11-20 → error "La renovación tiene que vencer después del 25/11/2026." Igual fecha → mismo error. 2026-11-26 → acepta. |
| V11 | Rango de vencimiento: desde 2000-01-01 hasta `sumarAnios(hoy, 10)`. | 2036-11-18 → acepta · 2036-11-19 → error "La fecha de vencimiento no puede ser posterior al 18/11/2036." |
| V12 | Documento **obligatorio faltante** (5.1) → alerta "Falta cargar", grupo `vencidos` (se trata como vencido). | Unidad de un proyecto con `requiereHabilitacion` y sin habilitación → alerta faltante. |
| V13 | La habilitación de ingreso solo se exige si el proyecto la requiere. | Unidad de la base de mantenimiento sin habilitación → sin alerta. |
| V14 | Unidades dadas de baja y conductores inactivos: sus documentos no alertan. | Unidad de baja con seguro vencido → sin alerta; el documento sigue visible en su ficha. |
| V15 | Unidades fuera de servicio: sus vencimientos **sí** alertan (hay que tenerlos al día para volver). | Unidad en taller con revisión técnica a 5 días → alerta grupo `7`. |
| V16 | Orden de la lista: grupo (`vencidos`, `7`, `15`, `30`); dentro del grupo, `d` ascendente (lo más vencido primero; los faltantes antes que los vencidos); después, patente o nombre. | Tres documentos con d = −1, faltante, −10 → orden: faltante, −10, −1. |
| V17 | Un documento no obligatorio cargado (habilitación de manejo) alerta igual que los demás si vence; si falta, no alerta. | Conductor sin habilitación de manejo → nada; con una que vence en 12 días → grupo `15`. |

### 6.3 Aptitud y estado de la unidad (A)

| ID | Regla | Caso de test |
| --- | --- | --- |
| A1 | **Puede salir** = estado `en-servicio` ∧ ningún documento obligatorio de la unidad vencido o faltante a hoy ∧ ninguna novedad crítica abierta ∧ (P19) ningún parte de hoy cerrado sin salida. Si no, **No puede salir** con la lista de motivos. Aptitud se calcula, no se guarda. | Unidad en servicio con seguro vencido → "No puede salir" con motivo "Seguro vencido hace 3 días". |
| A2 | Un documento que vence hoy no impide salir. | vence = H → "Puede salir" (y alerta "Vence hoy"). |
| A3 | Al enviar **la revisión** de un parte con una **novedad crítica** (ítem crítico con novedad o cualquier novedad con "Impide usar la unidad"), la unidad pasa a `fuera-de-servicio` con origen `novedad-critica`, motivo "Novedad crítica en el parte del 18/11/2026: Frenos" y los ids de las novedades. Invariante: nunca hay una unidad `en-servicio` con una novedad crítica abierta. (Hasta el 19/11/2026 esto pasaba recién al enviar el parte completo, al final del día: ver sección 17.) | Revisión con frenos "con novedad" → unidad fuera de servicio y parte sin salida (P16); eventos `revision-enviada`, `novedad-abierta`, `fuera-de-servicio`. Test de invariante sobre el ejemplo completo y después de cada comando. |
| A4 | "Volver a servicio" se rechaza si hay novedades críticas abiertas, y el error las nombra. | Error: "Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026)." |
| A5 | Volver a servicio con documentos vencidos **se permite** (el estado no es la aptitud): la unidad queda en servicio y "No puede salir". | Volver a servicio con seguro vencido → estado `en-servicio`, aptitud "No puede salir". |
| A6 | Poner fuera de servicio a mano exige motivo (5 a 200 caracteres). Una unidad ya fuera de servicio no se vuelve a poner (error). | Motivo vacío → "Escriba el motivo (por ejemplo, «En taller: cambio de embrague»)." |
| A7 | Dar de baja exige motivo; es **irreversible** en la demo; conserva documentos, partes e historial; la unidad sale de la flota activa, de las alertas y de los totales. No se aceptan partes de una unidad de baja. **No se da de baja una unidad con un parte en uso** (`unidad-con-parte-en-uso`): el cierre se rechaza para una unidad de baja y el parte quedaría huérfano; primero se cierra. | Baja → no aparece en "Pueden salir"/"No pueden salir"; su ficha muestra "Dada de baja el 18/11/2026: motivo". |
| A8 | **Protagonista del centro de alertas** = cantidad de unidades activas (no de baja) que hoy "no pueden salir" o están "fuera de servicio". "Disponibles: P de T" con T = activas y P = las que pueden salir. | Ejemplo: 23 activas, 2 no pueden salir, 2 fuera de servicio → "4 unidades" y "Disponibles: 19 de 23". |

### 6.4 Parte diario (P)

| ID | Regla | Caso de test |
| --- | --- | --- |
| P1 | Un parte por unidad y por fecha (borrador o enviado). Índice único `[unidadId, fecha]`. | Segundo parte de ZK 214 BD para H → error "Ya hay un parte de ZK 214 BD para el 18/11/2026 (borrador). Ábralo para continuar." con enlace. |
| P2 | Fecha del parte: no futura y no anterior a `hoy − 7`. | H → ok · H − 7 → ok · H − 8 → error "Solo se pueden cargar partes de los últimos 7 días." · H + 1 → error "La fecha no puede ser posterior a hoy." |
| P3 | **Revisión incompleta = borrador.** Se guarda solo (500 ms después de la última tecla y al salir del campo) con cualquier subconjunto de datos; solo se valida el tipo de cada campo (un km con letras no se guarda y se avisa en el campo). El borrador no cambia el kilometraje de la unidad ni abre novedades. Lo mismo vale para los datos del cierre de un parte en uso (`guardarCierre`): se guardan solos y no cuentan hasta cerrar. | Borrador con solo `kmInicio` → se guarda; `kmActual` de la unidad no cambia (K9); ninguna novedad nueva. |
| P4 | **Enviar la revisión** exige: conductor, `kmInicio`, los 10 ítems respondidos y una descripción de 3 a 500 caracteres (sin contar espacios de los extremos) en cada ítem "con novedad" y en "Otra novedad" si se marcó. **Cerrar** exige `kmFin` y `combustible`. Si falta algo, no se envía: se listan los faltantes **en el orden del formulario** de ese paso. | Revisión sin `kmInicio` y sin `luces` → `{ faltan: ['kmInicio', 'luces'] }`, "Faltan 2 datos". Cierre sin nada → `{ faltan: ['kmFin', 'combustible'] }`. |
| P5 | Un parte con fecha **anterior a hoy** que quedó a medias genera la alerta de operación "Parte sin enviar": un **borrador** (la revisión no se envió: "sin enviar", quién lo empezó) o un parte **en uso** (la revisión se envió y falta el cierre: "sin cerrar", con quién salió). Un borrador se puede completar y enviar mientras cumpla P2; queda marcado "fuera de plazo" si la revisión se envía después de su fecha. Un parte en uso se puede cerrar en cualquier momento (P15). | Borrador de H − 1 → alerta "sin enviar"; revisión enviada hoy → evento con "fuera de plazo". Parte en uso de H − 1 → alerta "sin cerrar"; parte en uso de H → nada. |
| P6 | Una unidad `en-servicio`, creada antes de ayer, **sin parte de ayer** (en ningún estado: borrador, en uso ni cerrado) genera la alerta "Sin parte de ayer". Si hay borrador o parte en uso de ayer, solo vale P5 (no se duplica). Fuera de servicio y bajas no generan esta alerta. | Unidad en servicio sin parte de H − 1 → alerta · con borrador de H − 1 → solo "Parte sin enviar" · unidad en taller → nada. |
| P7 | Un parte **cerrado (`enviado`) es inmutable** (para todos los perfiles). En un parte **en uso**, lo de la revisión (conductor, `kmInicio`, checklist, "Otra novedad") ya no cambia; solo se completan los datos del cierre. Un parte en uso no se puede descartar. Los errores de kilometraje se corrigen con una corrección de kilometraje (K5); las novedades, resolviéndolas. | `guardarBorrador(enviado)` → error "Un parte enviado no se puede modificar." · `guardarBorrador(en uso)` → error "La revisión ya se envió: no se puede modificar." · `descartarBorrador(en uso)` → el mismo error. |
| P8 | No se empiezan partes ni se envía la revisión de unidades fuera de servicio ni de baja. (Ver decisión D3.) El **cierre** de un parte en uso sí se acepta con la unidad fuera de servicio (salió antes de que la sacaran de servicio: hay que registrar el kilometraje); con la unidad de baja, no (A7). | Unidad fuera de servicio → error "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la vuelva a servicio." · Parte en uso y unidad puesta fuera de servicio a mediodía → el cierre se acepta. |
| P9 | Si en la fecha del parte la unidad tenía un documento obligatorio **de la unidad** vencido o faltante, la revisión **se puede enviar** (registra lo que pasó), con advertencia previa que hay que aceptar. Queda `documentacionVencida` y la alerta de operación "Circuló con documentación vencida" durante 30 días desde la fecha del parte. **La licencia del conductor ya no entra acá: bloquea (L1).** Si la revisión tiene una novedad crítica, la unidad no sale (P16): no hay advertencia de P9 y `documentacionVencida` queda vacía. | Revisión de H con seguro vencido → advertencia; aceptada → en uso con `documentacionVencida: ['seguro']` y alerta crítica. A H + 31 la alerta ya no está. Seguro vencido + frenos con novedad → sin advertencia de P9, sin alerta de "circuló". |
| P10 | Litros cargados: vacío = no cargó; si no, número mayor que 0 y hasta 200, con hasta 1 decimal (coma o punto). | `0` → error "Si no cargó combustible, deje el campo vacío." · `45,5` → 45.5 · `250` → error · `12,25` → error. |
| P11 | Novedad en ítem crítico → novedad `critica`. En ítem no crítico → `normal`, salvo "Impide usar la unidad" → `critica`. "Otra novedad" igual. | `niveles` con novedad sin marcar → normal · con marca → crítica → A3. |
| P12 | Enviar la revisión y cerrar son **atómicos**: parte, novedades, cambio de estado y eventos se escriben en una sola transacción. Si falla, no queda nada a medias y el borrador (o el parte en uso) sigue intacto. | Repositorio de prueba que falla al escribir eventos → ni revisión enviada ni novedades; borrador igual al anterior; error "No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo." |
| P13 | Al empezar un parte, `kmInicio` se completa con el kilometraje actual de la unidad (K8) y el conductor con el perfil elegido o el asignado (no se pide dos veces lo que ya se sabe; WCAG 3.3.7). Con el perfil Encargado, el asignado se precarga **solo si su licencia ampara la fecha del parte** (L1); si no, queda "Elija quién conduce". | Unidad con km actual 84 320 → borrador nuevo con `kmInicio = 84320`. Asignado con licencia vencida → conductor vacío. |
| P14 | **Revisión enviada sin novedad crítica:** el parte pasa a `en-uso`, `revisado = ahora`; se abren las novedades normales; la unidad puede salir. Evento `revision-enviada`. | Revisión con `niveles` "con novedad" sin marca → en uso, 1 novedad normal abierta, unidad en servicio. |
| P15 | **Cierre:** solo de un parte en uso. Exige P4 (cierre), K2, K4 y la advertencia K7. Sin límite de fecha (P2 rige para empezar y para la revisión): un parte en uso de hace 10 días todavía se puede cerrar. No vuelve a mirar la licencia (L3) ni P9 (quedó fijado en la revisión). Pasa a `enviado`, `enviado = ahora`, `advertenciasAceptadas` = las de la revisión + las del cierre. Evento `parte-enviado`. | Parte en uso de H con fin 84 452 y combustible 3/4 → cerrado, recorrido 132, `kmActual` = 84 452. Parte en uso de H − 10 → se cierra. |
| P16 | **Revisión con novedad crítica (sin salida):** en la misma transacción, A3 (fuera de servicio) y el parte se **cierra**: `estado = 'enviado'`, `sinSalida = true`, `kmFin = kmInicio`, `combustible = null`, `litrosCargados = null`, `enviado = revisado = ahora`. No hay cierre aparte ni evento `parte-enviado`. | Revisión con frenos "con novedad" → parte cerrado sin salida, recorrido 0 ("Sin uso"); eventos `revision-enviada`, `novedad-abierta`, `fuera-de-servicio`. |
| P17 | La alerta "Circuló con documentación vencida" (P9) sale de partes **en uso o cerrados** con `documentacionVencida` no vacía y **sin** `sinSalida`. | Parte en uso de H con seguro vencido aceptado → alerta desde que se envía la revisión. |
| P18 | **Cerrar antes** (decisión de Matías del 22/11/2026). Si la unidad tiene un parte **en uso** de una fecha anterior, no se envía la revisión de una fecha posterior (`parte-anterior-sin-cerrar`): primero se cierra. Sin esta regla, la revisión de hoy arrancaba con el kilometraje de salida de ayer (el precargado) y el cierre de ayer ya no podía registrar el recorrido real (K4). Se controla después de P8, P2 y L1 (si la licencia también bloquea, gana la licencia) y antes de los faltantes (P4). El cierre **no** mira la licencia (L3): quien no tiene licencia vigente puede cerrar un parte anterior. El inicio del conductor lo lleva al cierre (estado 5 bis, `cierre-pendiente`) y la pantalla del parte dice «No se puede cargar este parte» con el aviso «Cerrar antes» y un primario hacia ese cierre. Un borrador anterior sin enviar no bloquea, y un parte en uso de una fecha posterior tampoco. | Parte en uso del 17/11 de ZK 214 BD, revisión del 18/11 → error "ZK 214 BD: el parte del martes 17/11/2026 quedó sin cerrar. Ciérrelo primero; después se puede empezar la revisión del 18/11/2026."; cerrado el del 17/11, la revisión del 18/11 se envía. |
| P19 | **Sin salida: hasta mañana** (decisión de Matías del 22/11/2026). Un parte cerrado sin salida (P16: novedad crítica en la revisión) cierra el día de esa unidad: aunque el encargado resuelva la novedad y la devuelva a servicio, ese día no hay otra revisión de la unidad (P1 ya lo impide: un parte por unidad y por fecha) y la interfaz no la ofrece: el primer botón de la ficha es «Ver el parte» y el inicio del conductor dice «Aunque el encargado resuelva la novedad hoy, la unidad vuelve a salir recién mañana.». **Todas las vistas dicen lo mismo** (QA D1 de la etapa 7, decidido por Matías): la aptitud suma el motivo «Sin salida hasta mañana (novedad crítica en la revisión de hoy)», así que la ficha, la flota y el centro de alertas muestran «No puede salir» aunque la unidad ya esté en servicio, y el diálogo de resolver no promete que vuelve a salir ese día. Es una regla conservadora, no un límite. | Frenos con novedad en la revisión de H, novedad resuelta y unidad en servicio el mismo día → ficha con «Ver el parte» (no «Cargar parte»); inicio con el aviso de «recién mañana». |
| P20 | **Un conductor, un parte en uso** (decisión de Matías del 22/11/2026). Si el conductor tiene un parte **en uso** (de cualquier fecha) en otra unidad, no puede enviar la revisión de una unidad nueva hasta cerrarlo: `parte-anterior-sin-cerrar` (el mismo código que P18), campo `conductorId`, con el parte a cerrar en `detalle`. Se controla después de P18. Una unidad de baja no cuenta (su parte ya no se puede cerrar, A7). Con el perfil Conductor el aviso «Cerrar antes» lleva al parte de la otra unidad; con el perfil Encargado el conductor se elige en el formulario y el error llega al enviar. | Luis (c1) con el parte en uso del 17/11 de ZKB 482 y la revisión de ZK 214 BD con él → error "Luis Ferreyra tiene sin cerrar el parte del martes 17/11/2026 de ZKB 482. Ciérrelo primero; después se puede enviar esta revisión." |

### 6.5 Kilometraje (K)

| ID | Regla | Caso de test |
| --- | --- | --- |
| K1 | Kilometraje: entero de 0 a 2 000 000. Acepta `84320`, `84.320` y `84 320`; rechaza decimales, negativos y letras. | `84.320` → 84320 · `84,3` → error "Escriba el kilometraje sin decimales." · `-5` → error · `2.000.001` → error. |
| K2 | `kmFin ≥ kmInicio`. Igual es válido (recorrido 0: "Sin uso"). | 84 320 → 84 319 → error "El kilometraje al terminar (84.319) es menor que al iniciar (84.320)." · 84 320 → 84 320 → ok, "Sin uso". |
| K3 | **El kilometraje no retrocede:** `kmInicio ≥` el `kmFin` del último parte enviado de fecha anterior (o el `kmBase` de una corrección posterior a ese parte). Si no, error que bloquea el envío (el borrador queda). | Último parte enviado del 17/11 terminó en 84 320; parte del 18/11 con inicio 84 319 → error "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, avise al encargado." |
| K4 | Partes fuera de orden: un parte de una fecha intermedia tiene que quedar entre sus vecinos: `kmFin ≤ kmInicio` del siguiente parte enviado. | Partes enviados del 15 (fin 80 000) y del 17 (inicio 80 500); se carga el del 16 con fin 80 600 → error "Supera el kilometraje con que empezó el parte del 17/11/2026 (80.500)." |
| K5 | **Corrección de kilometraje** (solo encargado, motivo de 10 a 200 caracteres): fija `kmBase` desde una fecha. K3 y K4 comparan solo con registros posteriores a la corrección. **No se corrige desde la fecha de un parte en uso** (`km-correccion-parte-en-uso`, campo `desde`): su kilometraje de salida no cambia (P7) y el cierre quedaría imposible; primero se cierra. | Corrección a 120 km desde H − 2 (tablero nuevo) tras 84 320 → parte de H − 1 con inicio 130 → ok. Parte en uso de H y corrección desde H → error "El parte del 18/11/2026 está en uso. Ciérrelo antes de corregir el kilometraje desde esa fecha." |
| K6 | **Salto:** `kmInicio − kmAnterior > 1 000` → advertencia (no bloquea), que hay que aceptar al enviar. Se guarda en `advertenciasAceptadas` y se ve en el historial ("1.250 km sin registrar"). | Diferencia 1 001 → advertencia · 1 000 → nada. |
| K7 | **Recorrido del día > 1 200 km** → advertencia que hay que aceptar. | 1 201 → advertencia · 1 200 → nada. |
| K8 | `kmActual(unidad)` = el kilometraje del último registro (K10) por fecha y, a igual fecha, por instante: `kmFin` de un parte cerrado, `kmInicio` de un parte en uso o `kmBase` de una corrección. Sin datos: `null` ("Sin registros"). | Parte del 17 (84 320) y corrección del 18 (120) → 120. Parte cerrado del 17 (84 320) y revisión del 18 con inicio 84 330 (en uso) → 84 330. |
| K9 | Los borradores no cuentan para K3, K4 ni K8. Los datos del cierre de un parte en uso (todavía sin cerrar) tampoco. | Borrador del 18 con fin 99 999 → `kmActual` sigue en 84 320. |
| K10 | **Registros de kilometraje:** partes cerrados (inicio y fin), partes **en uso** (solo inicio: se sabe desde la revisión) y correcciones. K3 se controla **al enviar la revisión** contra el registro anterior; K4 se controla dos veces: en la revisión, `kmInicio ≤ kmInicio` del siguiente parte (en uso o cerrado), y en el cierre, `kmFin ≤ kmInicio` del siguiente. K6 va en la revisión; K2 y K7, en el cierre. | Parte en uso del 16 (inicio 80 000) y parte cerrado del 17 (inicio 80 500): cerrar el del 16 con fin 80 600 → error K4 · revisión del 16 con inicio 80 600 si el del 17 empezó en 80 500 → error K4. |

### 6.6 Novedades (N)

| ID | Regla | Caso de test |
| --- | --- | --- |
| N1 | Una novedad queda abierta hasta que el encargado la resuelve con un texto de 5 a 500 caracteres. | Resolver con "ok" → error "Cuente en pocas palabras qué se hizo (al menos 5 caracteres)." |
| N2 | Al resolver la **última** novedad crítica abierta de una unidad que quedó fuera de servicio por novedad crítica, el diálogo ofrece "Volver a servicio ahora" (marcado). Marcado → vuelve a servicio (A4 ya se cumple) en la misma transacción. Desmarcado → sigue fuera de servicio. | Ambos caminos: estado final y eventos (`novedad-resuelta` + `vuelta-a-servicio`, o solo `novedad-resuelta`). |
| N3 | El encargado puede cargar una novedad a mano desde la ficha (texto + "Impide usar la unidad"). Si impide, vale A3. | Novedad manual crítica → unidad fuera de servicio con origen `novedad-critica`. |
| N4 | Las novedades no se borran. Las resueltas quedan en la ficha (pestaña "Resueltas") y en el historial. | Resuelta → `estado: 'resuelta'`, sigue en el repositorio. |
| N5 | Orden en el centro de alertas: críticas primero; dentro, la más antigua primero. | Crítica de H − 2, normal de H − 9, crítica de H − 5 → H − 5, H − 2, H − 9. |

### 6.7 Unidades y conductores (U)

| ID | Regla | Caso de test |
| --- | --- | --- |
| U1 | Patente: se normaliza (mayúsculas, sin espacios ni guiones). Formatos válidos: Mercosur `AA999AA` y anterior `AAA999`. Se muestra `AA 999 AA` y `AAA 999`. | `zk-214 bd` → `ZK214BD`, se ve `ZK 214 BD` · `zkb482` → `ZKB 482` · `A123BCD` → error "La patente tiene que tener el formato AA 123 BB o ABC 123." |
| U2 | Patente única entre todas las unidades, incluidas las de baja. | Alta con una patente existente → error "Ya existe una unidad con la patente ZK 214 BD (Int. 07)." |
| U3 | Número interno de 1 a 999, único entre las unidades que no están de baja. | Interno repetido → error con la patente de la otra unidad. |
| U4 | Año: de 1980 a año de hoy + 1. | 2028 con H en 2026 → error · 2027 → ok. |
| U5 | Una unidad nueva nace en servicio y sin documentos: aparece al instante en el centro de alertas con sus faltantes y "No puede salir". | Alta → 3 o 4 alertas "Falta cargar" según su proyecto. |
| U6 | Cambiar el proyecto o el conductor asignado genera un evento con antes y después; cambiar a un proyecto que requiere habilitación puede crear una alerta de faltante en el acto. | Base → Proyecto Piedra Lunar sin habilitación → alerta faltante. |
| U7 | Textos libres: se les sacan los caracteres de control (C0 salvo tabulación y salto de línea, DEL y C1) y los invisibles o de formato (categorías Unicode `Cc` y `Cf`: U+00AD, U+200B a U+200F, U+202A a U+202E, U+2060, U+2066 a U+2069, U+FEFF…, salvo la unión de ancho cero U+200D de los emojis compuestos), y se recortan los espacios de los extremos; topes de largo (motivos 200, novedades 500, número de documento 40, emisor 80) **contados en caracteres (puntos de código), no en unidades UTF-16**: un emoji cuenta 1. Un borrador del parte guarda el texto sin caracteres de control pero sin recortar. Lo que queda vacío después de limpiar cuenta como vacío. Nunca se insertan como HTML (`src/lib/dominio/texto.ts`). | Novedad de 501 caracteres → error con el tope; 300 emojis → se acepta. «Ruido», U+202E y « al frenar» juntos se guardan como `Ruido al frenar`. `<b>x</b>` se muestra literal. |

### 6.8 Historial (H)

| ID | Regla | Caso de test |
| --- | --- | --- |
| H1 | Cada comando produce exactamente los eventos de la tabla de la sección 8, en la misma transacción que el cambio. | Un test por comando: cantidad y tipos de eventos. |
| H2 | Los eventos no se editan ni se borran (el repositorio no expone esas operaciones). Solo "Reiniciar demo" vacía todo. | Tipo del repositorio sin `actualizarEvento`/`borrarEvento` (comprobado por `tsc`) y test de reinicio. |
| H3 | Orden del historial: instante descendente; a igual instante, `secuencia` descendente. | Dos eventos del mismo milisegundo → el de mayor secuencia primero. |
| H4 | El historial de una unidad de baja se conserva y se puede ver. | Baja → ficha con historial completo. |

### 6.9 Datos de la demo y persistencia (D)

| ID | Regla | Caso de test |
| --- | --- | --- |
| D1 | Generador **determinista**: `generar(semilla, fechaBase)` devuelve siempre lo mismo. Las fechas son desplazamientos desde `fechaBase`. | Dos llamadas con (20261118, 2026-11-18) → JSON idéntico (comparar hash). Con fechaBase 2026-11-25 → mismas entidades, todas las fechas corridas 7 días. |
| D2 | **Casos garantizados**: el generador planta los casos de la sección 9.2; los vencimientos aleatorios caen siempre a más de 30 días, así el centro de alertas muestra solo lo plantado. | Un test por caso plantado (C01–C20) y uno que cuenta las alertas del ejemplo. |
| D3 | Todo es ficticio y se nota: empresa con "Demo" en el nombre, patentes de una serie no emitida (9.1), nombres de una lista inventada, CUIT ficticio con dígito verificador válido. | Todas las patentes empiezan con `Z`; el CUIT pasa `cuitValido`. |
| D4 | Primera visita (base vacía): se genera con `fechaBase = hoy`. Se muestra "Preparando la flota de ejemplo…" solo si tarda más de 300 ms. | Repositorio vacío → datos del generador y `meta.modificada = false`. |
| D5 | **Fechas del ejemplo al día:** si `fechaBase < hoy` y `modificada = false`, se regenera en silencio con `fechaBase = hoy` (los casos plantados siguen a la misma distancia de hoy). Si `modificada = true`, se conservan los datos y se muestra el aviso "Los datos de ejemplo son del 10/11/2026. Al reiniciar la demo se actualizan a la fecha de hoy y se borran sus cambios." con botón "Reiniciar demo". | Ambos caminos. |
| D6 | **Reiniciar demo**: borra todo, regenera con `fechaBase = hoy`, `modificada = false`. Se conserva el perfil elegido (es de la persona, no de los datos). Confirmación previa. No existe desde la pantalla de error de arranque (ver «La pantalla de error de arranque no reinicia»). | Después de reiniciar, el ejemplo es igual al de una primera visita del mismo día y el perfil no cambió. |
| D7 | Versión de esquema guardada ≠ actual → reinicio automático con aviso "La demo se actualizó. Se cargó de nuevo la flota de ejemplo y no se conservaron los datos anteriores." | Meta con `versionEsquema: 0` → reinicio y aviso. |
| D8 | IndexedDB no disponible o falla al abrir → **modo en memoria**: la demo funciona y un aviso fijo dice "Este navegador no permite guardar datos. Puede usar la demo, pero los cambios se pierden al cerrar o recargar la página." | Fábrica de IndexedDB que lanza → arranca con el repositorio en memoria y el aviso. |
| D9 | Otra pestaña cambió los datos (`BroadcastChannel('control-flota')`) → aviso "Se hicieron cambios en otra pestaña. Esta pantalla sigue mostrando los datos anteriores hasta que actualice." con botón "Actualizar"; no se recarga sola (se perdería lo que se está escribiendo). | Canal de prueba que emite → aviso visible; los datos de esta pestaña no cambian hasta "Actualizar". |
| D10 | Error al escribir (cuota, transacción abortada) → no se aplica nada, el formulario conserva lo escrito y el mensaje lo dice. Nunca un error que desaparece solo. | Repositorio que falla → estado igual al anterior y mensaje. |
| D11 | `meta.modificada` pasa a `true` con el primer comando del visitante (no con el autoguardado de un borrador vacío ni con cambiar de perfil). | Abrir y cerrar el parte sin escribir → sigue `false`. |

### 6.10 Licencia del conductor (L) — decisión de Matías del 19/11/2026

`F` = fecha del parte. "Ampara" = misma regla que M1 (sección 16): el documento vence en `F` o después **y** ya existía en
`F` (su emisión es `F` o antes; sin emisión cargada, su carga en hora de Argentina es `F` o antes). Se miran todas las
licencias del conductor, no solo la de vencimiento más tardío.

| ID | Regla | Caso de test |
| --- | --- | --- |
| L1 | **Sin licencia vigente no se envía la revisión.** `enviarRevision` exige que alguna licencia del conductor del parte ampare `F`. Si no, error `licencia-no-vigente` (campo `conductorId`), **sin advertencia aceptable**: bloquea, con cualquier perfil y para cualquier fecha que permita P2. | Licencia vencida el H − 3, revisión de H → error. Revisión de H − 4 (todavía vigente ese día) → se acepta. |
| L2 | Vence hoy todavía vale (V2): una licencia que vence en `F` ampara `F`. "Hoy" es la fecha de Argentina (T1); el cambio de día es a las 00:00 de Argentina (03:00Z), no a las 00:00 UTC. | Vence H, revisión de H a las 23:59:59.999 de Argentina → se acepta. La misma revisión con el reloj en H + 1 a las 00:00 → la fecha del parte sigue siendo H: se acepta (ver L3 y sección 14). |
| L3 | **El cierre no vuelve a mirar la licencia:** la jornada empezó con licencia vigente. Por V2 una licencia no vence "en medio" de un día civil; solo puede pasar en una jornada que cruza la medianoche, y esa jornada pertenece a la fecha de su revisión. | Revisión de H (vence H) enviada a las 22:00; cierre a las 06:00 de H + 1 → se acepta. |
| L4 | `guardarBorrador`, `guardarCierre` y `descartarBorrador` **no** miran la licencia (P3). Un borrador cuyo conductor no tiene licencia vigente para `F` se conserva; no se puede enviar hasta que: (a) el encargado cargue o renueve una licencia que ampare `F`, (b) lo tome otro conductor con licencia vigente (perfil Conductor: quien envía se hace cargo, 4.5 (3)), o (c) se descarte. | Borrador de H con licencia vencida → `guardarBorrador` ok, `enviarRevision` error; renovación cargada hoy sin emisión → `enviarRevision` ok. Borrador de H − 1, renovación cargada hoy con emisión hoy → sigue bloqueado (no amparaba H − 1). |
| L5 | Motivo del bloqueo (para el texto): `faltante` (no tiene ninguna licencia cargada), `vencida` (la de vencimiento más tardío entre las que ya existían en `F` vence antes de `F`) o `posterior` (hay una que vence en `F` o después, pero empieza a valer después de `F`). | Sin licencias → `faltante`. Única licencia vence H − 3 → `vencida`, vence H − 3. Renovación con emisión H + 2 → `posterior`, desde H + 2. |
| L6 | **Conductores que no pueden manejar hoy:** conductores **activos** sin licencia que ampare hoy. Es una lista calculada (no se guarda), que se muestra al encargado junto al protagonista (`diseno-ui.md` 6.1); no cambia A8 (el protagonista cuenta unidades) ni la aptitud de la unidad asignada (A1 es de la unidad: puede salir con otro conductor). Los inactivos no cuentan (V14). | Ejemplo (C21) → 1 conductor. Conductor inactivo con licencia vencida → no aparece. |
| L7 | La licencia de conducir sigue alertando como vencimiento (V1–V5, titular conductor); L1 no agrega alertas nuevas. | C21 → alerta "Vencida hace 3 días · Licencia de conducir" en Vencidos y faltantes. |

---

## 7. Alertas (cálculo)

`calcularAlertas(estado, hoy)` es una función pura. Una alerta no se guarda: se recalcula con cada cambio.

| Categoría | Tipo | Gravedad | Texto (ejemplo) | Regla |
| --- | --- | --- | --- | --- |
| Vencimientos | `documento-faltante` | crítica | "Falta cargar · Habilitación de ingreso al proyecto" | V12 |
| Vencimientos | `documento-vencido` | crítica | "Vencido hace 3 días · Seguro" | V1 |
| Vencimientos | `documento-por-vencer` | según grupo | "Vence en 6 días · Revisión técnica" | V2–V5 |
| Operación | `novedad-critica` | crítica | "Frenos: ruido al frenar en bajada (parte del 16/11/2026)" | A3, N5 |
| Operación | `uso-con-documentacion-vencida` | crítica | "Circuló con el seguro vencido (parte del 12/11/2026)" | P9, P17 |
| Operación | `parte-sin-enviar` | media | Borrador: "Parte del 17/11/2026 sin enviar (empezado por L. Ferreyra)". En uso: "Parte del 17/11/2026 sin cerrar (salió con L. Ferreyra)" | P5 |
| Operación | `sin-parte` | media | "Sin parte de ayer (17/11/2026)" | P6 |
| Operación | `novedad-abierta` | media | "Luz de patente quemada · abierta hace 9 días" | N5 |

Resumen que devuelve junto con la lista: `{ noPuedenSalir: Unidad[], fueraDeServicio: Unidad[], disponibles, activas,
porGrupo: { vencidos, '7', '15', '30' }, operacion: Record<tipo, n>, conductoresSinLicencia: { conductor, motivo }[] }`
(L6, sección 17), más los puntos de la regla de vencimientos
(`{ dia: 0..30, grupo, alertaId }[]`) para dibujar el "horizonte" (ver `diseno-ui.md`).

## 8. Comandos y eventos

Toda modificación es un **comando puro**: `aplicar(estado, comando, contexto) → { cambios, eventos } | ErrorDeNegocio`,
con `contexto = { hoy, ahora, autor }`. El repositorio escribe `cambios` y `eventos` en una sola transacción. Así cada
regla se prueba sin IndexedDB.

| Comando | Quién | Eventos que produce |
| --- | --- | --- |
| `altaUnidad` | Encargado | `unidad-alta` |
| `cambiarAsignacion` | Encargado | `asignacion-cambiada` |
| `cargarDocumento` (faltante o nuevo tipo) | Encargado | `documento-cargado` |
| `renovarDocumento` | Encargado | `documento-renovado` (con vencimiento anterior y nuevo) |
| `corregirDocumento` | Encargado | `documento-corregido` (antes/después de cada campo cambiado) |
| `guardarBorrador` | Ambos | ninguno (el borrador no es historia; ver P3) |
| `enviarRevision` (reemplaza a `enviarParte`, sección 17) | Ambos | `revision-enviada` + un `novedad-abierta` por novedad + `fuera-de-servicio` si hubo crítica (A3, P16) |
| `guardarCierre` | Ambos | ninguno (P3) |
| `enviarCierre` | Ambos | `parte-enviado` |
| `descartarBorrador` | Ambos | ninguno |
| `cargarNovedad` | Encargado | `novedad-abierta` (+ `fuera-de-servicio` si es crítica) |
| `resolverNovedad` | Encargado | `novedad-resuelta` (+ `vuelta-a-servicio` si N2 marcado) |
| `ponerFueraDeServicio` | Encargado | `fuera-de-servicio` |
| `volverAServicio` | Encargado | `vuelta-a-servicio` |
| `corregirKilometraje` | Encargado | `km-corregido` |
| `darDeBaja` | Encargado | `unidad-baja` |

El perfil "Conductor" solo puede usar `guardarBorrador`, `enviarRevision`, `guardarCierre`, `enviarCierre` y
`descartarBorrador` (sobre unidades en servicio, salvo el cierre: P8).
No es seguridad (no hay servidor): es la perspectiva de la demo, y la interfaz simplemente no muestra lo demás.

## 9. Datos ficticios y generador

### 9.1 Identidades inventadas

- **Empresa:** "Logística Andina Demo S.A.", CUIT ficticio con dígito verificador válido generado por el script (se
  muestra con la palabra "ficticio"). Reutiliza `cuit.ts` de la Demo 1 (código propio de Matías, público).
- **Proyectos:** "Proyecto Piedra Lunar" y "Proyecto Arroyo Escondido" (requieren habilitación) y "Base de
  mantenimiento" (no la requiere). Nombres inventados; **antes de publicar se verifica que no coincidan con proyectos
  mineros reales** (búsqueda simple).
- **Patentes:** formato válido en una **serie que todavía no se emitió**: Mercosur `Z? 999 ??` y anterior `Z?? 999`
  (las series se asignan en orden alfabético desde el comienzo del abecedario; la Z no se alcanza en décadas —
  verificar el dato antes de publicar y decirlo en el README). Unidades de 2016 en adelante con formato Mercosur;
  anteriores, con el formato anterior.
- **Personas:** nombre y apellido combinados de dos listas inventadas (16 conductores y la encargada "Rocío Medina").
  Se rotulan "(persona ficticia)" en la barra del perfil, la ficha y el historial (decisión del 22/11/2026: no depende del género del nombre); las empresas, "(ficticia)".
- **Aseguradoras y plantas de revisión:** "Aseguradora del Sur Demo", "Seguros Puna Demo", "Planta de Revisión Técnica
  Demo N.º 3". Números de póliza inventados con prefijo `DEMO-`.
- **Marcas y modelos:** modelos comunes del mercado (pickup 4x4, utilitario, camión liviano, minibús); ver decisión D6.

### 9.2 Casos garantizados (relativos a `H = fechaBase`)

| Caso | Qué planta | Lo prueba |
| --- | --- | --- |
| C01 | Seguro de una camioneta (ZK 214 BD) que venció en H − 1 ("Vencido hace 1 día"): su parte de H − 1 es legítimo (ese día todavía valía) y hoy "No puede salir". | V1, V8, A1 |
| C02 | Revisión técnica que vence en H. | V2, A2 |
| C03 | Revisión técnica que vence en H + 1 ("mañana"). | V3 |
| C04 | Seguro que vence en H + 7. | V3 (borde) |
| C05 | Matafuego que vence en H + 8. | V4 (borde) |
| C06 | Habilitación que vence en H + 15. | V4 (borde) |
| C07 | Seguro que vence en H + 16. | V5 (borde) |
| C08 | Revisión técnica que vence en H + 30. | V5 (borde) |
| C09 | Seguro que vence en H + 31: **no** está en alertas; en la ficha, "Vigente". | V6 |
| C10 | Unidad reasignada **hoy** de la Base de mantenimiento al Proyecto Piedra Lunar, todavía sin habilitación de ingreso (sus partes anteriores eran válidos: la base no la exige). | V12, V13, U6, A1 |
| C11 | Unidad fuera de servicio por novedad crítica de frenos informada en la **revisión** del parte de H − 2: ese parte quedó cerrado sin salida (recorrido 0). | A3, A4, P16 |
| C12 | Unidad fuera de servicio a mano: "En taller: cambio de embrague", desde H − 5, con su revisión técnica a H + 5. | A6, V15 |
| C13 | Borrador de parte de H − 1 sin enviar. | P5 |
| C14 | Dos unidades en servicio sin parte de H − 1. | P6 |
| C15 | Parte de H − 4 con salto de 1 250 km aceptado. | K6 |
| C16 | Unidad dada de baja con el seguro vencido (no alerta). | V14, A7 |
| C17 | Licencia de un conductor que vence en H + 12. | V4 (conductor) |
| C18 | Revisión técnica que venció en H − 7; parte de H − 6 enviado con la advertencia aceptada; renovada ese mismo día, después del parte. | P9, V9 |
| C19 | Novedad normal abierta en H − 9 ("Luz de patente quemada"). | N5 |
| C20 | Corrección de kilometraje en H − 20 (cambio de tablero). | K5, K8 |
| C21 | Conductor activo, con una unidad asignada **en servicio y sin otros casos plantados**, cuya única licencia venció en H − 3 ("Vencida hace 3 días"). Los partes de esa unidad de H − 2 y H − 1 los firmó otro conductor activo (relevo), así ningún parte queda con un conductor sin licencia. La unidad puede salir (A1); el conductor no puede enviar la revisión (L1). | L1, L5, L6, L7, V1 (conductor) |

Relleno: 24 unidades (14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses, 1 de baja), 16 conductores,
partes cerrados de H − 45 a H − 1 para las unidades en servicio (revisión enviada entre las 06:00 y las 07:29 de
Argentina y cierre entre las 18:00 y las 19:29 del mismo día, cada uno con su evento; recorrido diario de 40 a 260 km,
nivel de combustible coherente, alguna carga), ningún parte de hoy, novedades normales ya resueltas en el pasado (para que el historial tenga vida), documentos
aleatorios con vencimientos entre H + 31 y H + 400. Las renovaciones del pasado se hicieron **antes** de vencer (salvo
C18), así ningún otro parte queda con documentación vencida. Las unidades fuera de servicio no tienen partes desde que
salieron de servicio.

**Resultado esperado del ejemplo con H = 2026-11-18** (test de coherencia de D2; si cambia, cambia a propósito):

| Medida | Valor | Casos |
| --- | --- | --- |
| Protagonista "No pueden salir hoy" | 4 (2 no pueden salir + 2 fuera de servicio) | C01, C10, C11, C12 |
| Disponibles | 19 de 23 activas | — |
| Conductores que no pueden manejar hoy (L6) | 1 | C21 |
| Vencidos y faltantes | 3 (antes del 19/11/2026: 2) | C01, C10, C21 |
| Vencen en 7 días o menos | 4 | C02, C03, C04, C12 |
| Vencen entre 8 y 15 días | 3 | C05, C06, C17 |
| Vencen entre 16 y 30 días | 2 | C07, C08 |
| Total de vencimientos ("Vencimientos · N") | 12 (antes: 11) | — |
| Pendientes de operación | 6 | C11, C18, C13, C14 (×2), C19 |
| Alertas críticas (insignia de la pestaña) | 5 (antes: 4) | C01, C10, C11, C18, C21 |

### 9.3 Azar con semilla

`azar.ts`: generador `mulberry32` propio (10 líneas), semilla `20261118`. Nada de `Math.random()` en el generador ni en
el dominio. El orden de las llamadas al azar es parte del contrato (cambiarlo cambia los datos): si se cambia, se
actualiza el test de D1 a propósito, con una línea en el registro.

## 10. Persistencia (IndexedDB)

- Base `control-flota-demo`, versión 1. Almacenes: `meta` (clave `'estado'`), `proyectos`, `conductores`, `unidades`
  (índice único `patente`), `documentos` (índices `titular` = `[titular.tipo, titular.id]` y `vence`), `partes` (índice
  **único** `unidadFecha` = `[unidadId, fecha]`, índice `fecha`), `novedades` (índices `unidadId`, `estado`),
  `correccionesKm` (índice `unidadId`), `eventos` (índices `unidadId`, `conductorId`, `instante`).
- Interfaz `Repositorio` con dos implementaciones: `RepositorioMemoria` (tests y modo D8) y `RepositorioIndexedDB`. Las
  dos pasan **la misma suite de contrato** (la de IndexedDB, con un IndexedDB falso en Node: ver `stack.md`, decisión S2).
- Lectura: al arrancar se carga todo a memoria (son unos pocos miles de registros: ~24 unidades × 45 días de partes
  ≈ 1 000 partes y ~1 500 eventos; medida esperada < 100 ms). Las pantallas leen del estado en memoria; las escrituras
  van al repositorio y, si salen bien, se aplican al estado.
- Sin `localStorage` para datos. El perfil elegido vive en `meta` (y en memoria en modo D8).

## 11. Seguridad (modelo exprés)

- **Activos:** ninguno real. Lo que el visitante escribe se queda en su navegador. Sin servidor, sin analítica, sin
  conexiones externas: CSP `default-src 'none'` con todo en `'self'` (como la Demo 1), `connect-src 'none'`.
- **Entrada:** todo texto libre pasa por los topes de U7 y se muestra como texto (Svelte escapa por defecto; **prohibido
  `{@html}`**). Números y fechas se validan con las funciones del dominio.
- **Fotos (P3, si se hacen):** solo `image/jpeg` y `image/png`, tope 10 MB y 12 MP leído del encabezado, reescaladas a
  1600 px y recodificadas (quita EXIF y ubicación). Nunca salen del navegador.
- **Dependencias:** las mínimas de `stack.md`, con versión exacta y más de 14 días publicadas; `npm audit` en CI.

## 12. Módulos

| Archivo | Hace | Puro |
| --- | --- | --- |
| `src/lib/dominio/fechas.ts` | `hoyEnArgentina`, `parsearFechaCivil`, `diasEntre`, `sumarDias`, `sumarAnios`, formatos (T1–T7). | Sí |
| `src/lib/dominio/patente.ts` | `normalizarPatente`, `formatearPatente`, `formatoDePatente` (U1). | Sí |
| `src/lib/dominio/kilometraje.ts` | `parsearKm`, `kmActual`, validaciones K2–K7. | Sí |
| `src/lib/dominio/vencimientos.ts` | `clasificar`, `documentoVigente`, `faltantes` (V1–V17), con `REQUISITOS`; `estadoDeLicencia` (L1, L5). | Sí |
| `src/lib/dominio/aptitud.ts` | `aptitud(unidad, estado, hoy)` (A1–A2, A8). | Sí |
| `src/lib/dominio/parte.ts` | `ITEMS_CHECKLIST`, `faltantesParaEnviar`, `advertencias`, `novedadesDelParte` (P1–P13). | Sí |
| `src/lib/dominio/alertas.ts` | `calcularAlertas` y el resumen (sección 7). | Sí |
| `src/lib/dominio/comandos.ts` | `aplicar` para cada comando de la sección 8. | Sí |
| `src/lib/dominio/textos.ts` | Textos de estados y errores (español neutro), en un solo lugar. | Sí |
| `src/lib/datos/azar.ts`, `generador.ts`, `cuit.ts` | Generador con semilla y casos plantados (sección 9). | Sí |
| `src/lib/persistencia/*.ts` | `Repositorio`, memoria, IndexedDB, arranque (D4–D11), aviso entre pestañas. | No |
| `src/lib/estado/*.svelte.ts` | Estado reactivo de la aplicación, reloj, perfil, ruta. | No |
| `src/rutas/*.svelte`, `src/componentes/*.svelte` | Interfaz (ver `diseno-ui.md`). | No |

## 13. Tests

Vitest, en Node. La lógica de dominio y el generador con TDD (primero el test que falla). Matriz de zonas horarias en
CI (T2). Suite de contrato del repositorio. Test de coherencia del ejemplo (D2): cantidad exacta de alertas por grupo,
protagonista y casos plantados. La interfaz se verifica en el navegador (ver `diseno-ui.md`, sección de verificación) y,
si se aprueba, con pruebas de punta a punta en una etapa posterior.

## 14. Límites conocidos (van al README)

- Sin login: el perfil es una perspectiva; cualquiera puede "ser" el encargado.
- Los datos viven en un navegador: no se comparten entre equipos ni personas.
- Requisitos simplificados (5.1): sin exenciones de revisión técnica ni clases de licencia.
- Un parte por unidad y por día (no hay turnos ni relevos de conductor en el mismo día). Una jornada que cruza la
  medianoche pertenece a la fecha de su revisión: la licencia se mira para esa fecha (L2, L3).
- Una falla que aparece **durante el uso** no tiene campo propio en el cierre: el conductor avisa y el encargado la carga
  con "Cargar novedad" (N3). Pendiente de decisión (sección 17, pregunta Q1).
- La documentación vencida **de la unidad** no bloquea la salida: avisa y queda registrada (P9). La licencia del
  conductor sí bloquea (L1). Es una asimetría elegida (sección 17, pregunta Q2).
- Un parte de un día pasado tampoco se puede enviar si el conductor no tenía licencia vigente ese día (L1): queda la
  alerta "Sin parte de ayer" o "Parte sin enviar", no un registro de que manejó sin licencia.
- Lo escrito en el parte se guarda 500 ms después de la última tecla (y al salir del campo, al enviar y al irse de la pantalla). Si se recarga o se cierra la pestaña dentro de esos 500 ms, lo último puede perderse: guardar en IndexedDB son tres idas y vueltas con el navegador y una recarga no las espera (se probó con `pagehide`: no alcanza).

## 15. Decisiones de diseño

La IA propuso alternativas con una recomendación; la columna «Quién y cuándo» dice quién decidió. «Regla de operación»
quiere decir que la regla venía del diseño de Matías y no de una propuesta de la IA.

| # | Pregunta | Decisión | Quién y cuándo |
| --- | --- | --- | --- |
| D1 | Stack | Vite + TypeScript + Svelte 5, sin SvelteKit (alternativas en `stack.md`, S1). | Matías, 18/11/2026. |
| D2 | Perfil por defecto al entrar | Encargado siempre (el centro de alertas lleva el mensaje en 10 segundos). | Matías, regla de operación (confirmada por escrito el 22/11/2026). |
| D3 | Parte de una unidad fuera de servicio | Rechazarlo (P8). Descartado: aceptarlo con advertencia (traslado al taller). | Matías, regla de operación (confirmada por escrito el 22/11/2026). |
| D4 | "Fecha de consulta" simulada para ver cambiar las alertas | Después del mínimo, con aviso fijo mientras está activa. | Matías (confirmada por escrito el 22/11/2026). |
| D5 | Exportar el parte a PDF | Después del mínimo, con la impresión del navegador (sin dependencias). | Matías (confirmada por escrito el 22/11/2026). |
| D6 | Marcas y modelos | Modelos comunes reales (dan verosimilitud y no identifican a nadie). | Matías (confirmada por escrito el 22/11/2026). |
| D7 | Licencia del repositorio | MIT, como la Demo 1. | Matías, 19/11/2026. |
| D8 | Momento del checklist del parte | Revisión antes de salir y cierre al volver (sección 17). Descartado: checklist de fin de jornada. | Matías, regla de operación, 19/11/2026. |
| D9 | Licencia de conducir vencida o faltante | Bloquea la revisión (L1 a L7). Descartado: solo un aviso que el conductor acepta. | Matías, regla de operación, 19/11/2026. |

---

## 16. Decisiones de implementación (18/11/2026, Etapa 1, pasos 2.1 a 2.3 y correcciones de la revisión)

Huecos y ambigüedades del diseño que se resolvieron al programar, siempre con el criterio más conservador. Si alguna no
convence, se cambia acá y en el código a la vez.

**Modelo y contexto**

- `Contexto` es `{ hoy, ahora, autor, nuevoId }`: se agrega `nuevoId` (generador de ids inyectado) para que los comandos
  sigan siendo puros. `hoy` es la fecha civil de Argentina y `ahora` el instante (texto ISO, **M2**: tal como lo devuelve `toISOString`, con milisegundos y `Z`); el único `new Date()` de la
  aplicación va a vivir en `estado/reloj.ts` (Etapa 3). `hoyEnArgentina` recibe un `Date`; `fechaEnArgentina`, un instante en texto.
- `Estado` es todo el contenido en memoria (`meta`, `proyectos`, `conductores`, `unidades`, `documentos`, `partes`,
  `novedades`, `correccionesKm`, `eventos`). `Cambios` (lo que escribe el repositorio) lleva altas o reemplazos por `id`,
  `partesBorrados` y `meta`; **no lleva eventos**: viajan aparte y solo se agregan (H2, comprobado por `tsc`).
- Los errores de negocio son `{ codigo, mensaje, campo?, detalle? }`: `codigo` estable para la interfaz y los tests,
  `mensaje` ya en español neutro, `campo` para marcar el campo del formulario.
- El perfil Conductor/Encargado (sección 8) **no se controla en el dominio**: es una perspectiva de la interfaz.
- Gravedad de las alertas: `critica` (vencido, faltante, novedad crítica, circuló con documentación vencida), `media`
  (vence en 7 días o menos, parte sin enviar, sin parte, novedad normal) y `baja` (grupos de 15 y 30 días, y lo que el
  proyecto no exige: ver **M4** más abajo).

**Fechas y vencimientos**

- `parsearFechaCivil` devuelve la misma fecha o `null`. Fechas anteriores a 2000 son "fecha inválida" (T4), no un error
  aparte de rango; el límite superior de V11 (hoy + 10 años) sí tiene su mensaje.
- Los documentos no obligatorios que están cargados alertan, también el de habilitación de ingreso en un proyecto que no la
  pide (generalización de V17). Si falta, no alerta. La habilitación de manejo del conductor (V17) alerta como los demás
  documentos; la de ingreso en un proyecto que no la exige alerta con gravedad `baja` (**M4**, confirmada por Matías el 18/11/2026).
- Un documento "vigente" empata por vencimiento: gana el cargado después y, si sigue el empate, el de mayor id.
- El nombre en pantalla de la revisión técnica es "Revisión técnica"; las siglas "(VTV/RTO)" de 5.1 quedan para la interfaz.

**Aptitud y alertas**

- `aptitud` devuelve cuatro categorías: `puede-salir`, `no-puede-salir`, `fuera-de-servicio` y `baja`. Una unidad fuera de
  servicio también "no puede salir", pero se cuenta aparte en A8 (protagonista = no pueden salir + fuera de servicio).
- P6, "creada antes de ayer": la fecha de creación (en hora de Argentina) es anterior a `hoy − 1`.
- P5: un borrador de una fecha anterior a hoy alerta **mientras exista**, aunque ya no se pueda enviar (más de 7 días,
  P2): la salida es descartarlo.
- P9 (**M1, confirmada por Matías el 18/11/2026**): los documentos se evalúan **como estaban en la fecha del parte**, no con el vigente
  de hoy. Un documento ampara la fecha F si vence en F o después **y** ya existía: su emisión es F o antes y, si no tiene
  emisión cargada, su carga (día civil de Argentina) es F o antes. Se miran todos los documentos del titular y el tipo, no
  solo el de vencimiento más tardío. Consecuencia buscada: una renovación cargada con retraso, sin emisión o con emisión
  posterior, **no borra** el hecho de que el parte se hizo con el documento vencido. El valor queda guardado al enviar
  (`documentacionVencida`). Límite conocido: si el encargado carga con retraso una renovación y **sí** escribe la fecha de
  emisión real (anterior al parte), el parte no advierte, porque el vehículo ya tenía el documento.
- Texto de "Circuló con documentación vencida": "Circuló con documentación vencida: Seguro, Revisión técnica (parte del 12/11/2026)".

**Kilometraje (K3, K4, K5, K8)**

- Los registros de una unidad (partes enviados y correcciones) forman una línea de tiempo ordenada por fecha, después por
  instante, y a igual instante el parte antes que la corrección. Para un parte de la fecha F, el registro anterior es el
  último con fecha menor que F si es un parte, o con fecha menor o igual que F si es una corrección (la corrección "desde
  F" vale para el parte de F). El siguiente es el primero con fecha mayor que F; si es una corrección, K4 no compara.
- `validarKilometraje` aplica K2, K3 y K4 (bloquean) y devuelve las advertencias K6 y K7 con el kilometraje anterior.
- **M3 (confirmada por Matías el 18/11/2026):** una corrección de kilometraje con `desde` anterior a cualquier registro ya cargado (parte
  enviado u otra corrección) se **rechaza** con `km-correccion-anterior` y el mensaje «Ya hay un parte del dd/mm/aaaa,
  posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha de ese parte o una
  posterior.». Motivo: `kmActual` es el último registro por fecha, así que una corrección anterior no cambiaba el
  kilometraje actual ni K3 y K4, pero el historial decía que sí. Se eligió rechazar (lo más simple y honesto) en vez de
  recalcular. Una corrección de la misma fecha que el último parte sí se acepta (cuenta después del parte). La corrección
  generada para C20 (H − 20) es historia ya escrita, no pasa por el comando.

**Comandos**

- **M2:** `aplicar` valida el contexto antes de hacer nada y **lanza** un `Error` (es un error de programación, no de la
  persona): `hoy` tiene que ser una fecha civil válida, `ahora` un instante UTC en el formato exacto de `toISOString`, `hoy`
  tiene que coincidir con la fecha de Argentina de `ahora`, `autor` no puede estar vacío y `nuevoId` tiene que ser una
  función. `parsearInstante` (fechas.ts) es estricto: `Z` obligatoria (sin zona, `Date.parse` usaría la hora local del
  equipo, contra T2), sin desfases, y rechaza lo que el motor «corrige» (30 de febrero, hora 24). `fechaEnArgentina` y
  `formatearInstante` lanzan con un instante que no cumple. `sumarDias` exige un entero.
- **M6:** los comandos copian lo que reciben (`checklist` campo por campo, `otraNovedad`, `titular`) y guardan solo los
  campos conocidos; el `datos` de cada evento es una copia profunda (`structuredClone`) y no comparte arreglos ni objetos
  con el estado. Así un formulario reutilizado (o un proxy de Svelte 5) no cambia el estado por la espalda.
- Orden de las validaciones: existencia y estado de la unidad, estado del parte (P7), fecha (P2), duplicado (P1), tipos
  de los campos (P3). Al enviar: P8, P2, P4, K2 a K4, P9 y advertencias.
- `guardarBorrador` guarda los textos tal como se escribieron (sin recortar, tope 500) para no pelear con quien escribe;
  `enviarParte` los recorta (U7).
- D11, "borrador vacío": sin respuestas, sin fin de kilometraje, sin combustible, sin litros, sin otra novedad y con el
  kilometraje inicial igual al actual de la unidad (o vacío). Guardarlo o descartarlo no marca la demo como modificada.
- A3: la unidad queda fuera de servicio con `desde = hoy` (la fecha en que se registra), motivo "Novedad crítica en el
  parte del dd/mm/aaaa: Frenos, Dirección" (o "Novedad crítica cargada el dd/mm/aaaa: …" para una novedad a mano) y
  tope de 200 caracteres. Una crítica nueva en una unidad ya fuera de servicio por otra crítica suma su id y no repite el
  evento; en una unidad fuera de servicio a mano no cambia el estado (A4 pedirá resolverla).
- N2: `resolverNovedad` lleva `volverAServicio`; reutiliza la lógica de `volverAServicio` (A4) sobre el estado ya con la
  novedad resuelta. Si la unidad no está fuera de servicio, es un error (`ya-en-servicio`) y no se resuelve nada.
- `corregirDocumento` no puede dar vuelta el orden entre un documento y su renovación (V9, V10): el vencimiento de una
  renovación tiene que seguir siendo posterior al del documento que reemplaza, y el de un documento reemplazado, anterior
  al de su renovación. La fecha de emisión no puede ser posterior al vencimiento. Cargar un documento exige número (1 a 40).
- Topes de texto: marca y modelo 40; motivo de baja y de fuera de servicio 5 a 200; corrección de kilometraje 10 a 200;
  descripción de novedad 3 a 500; resolución 5 a 500; número 1 a 40; emisor 0 a 80.
- Una unidad de baja rechaza con `unidad-de-baja` todo comando que la modifique (asignación, documentos, novedades nuevas,
  kilometraje, partes, fuera de servicio y vuelta a servicio). Lo único que se conserva y se puede cerrar son sus novedades abiertas.

**Datos de ejemplo**

- "24 unidades (14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses, 1 de baja)": suman 23 más la de baja,
  que es una camioneta de 2012. Quedan 23 activas, como pide el protagonista "19 de 23".
- Cada unidad cumple un papel fijo en la plantilla (`generador.ts`); los demás datos (conductores, modelos, kilometraje,
  combustible, litros, novedades pasadas, renovaciones anteriores) salen del azar con semilla. La semilla por defecto es 20261118.
- Los partes de un día se "envían" entre las 18:00 y las 19:29 de Argentina; los casos con hora propia usan horas que
  caen en el mismo día civil. El evento de "hoy" (C10) es a las 00:00 de Argentina (03:00Z), para que nunca sea posterior a
  "ahora" (en la primera versión era a las 01:00 y entre las 00:00 y la 01:00 quedaba en el futuro).
- **M1:** los documentos del generador se cargan (y, si tienen emisión, se emiten) antes del primer parte de la ventana
  (H − 45): así a cada parte generado lo ampara un documento que ya existía, y volver a calcular P9 a la fecha de cada
  parte da lo guardado. Cambió el contenido del ejemplo (hash de D1).
- La corrección de kilometraje del caso C20 es "desde" H − 20 a las 09:30 de Argentina y el parte de ese día ya parte de 120.
- Hay 16 conductores activos; las habilitaciones de manejo (opcionales) están cargadas para la mitad.

**Persistencia**

- `Repositorio`: `cargar`, `reemplazarTodo`, `escribir(cambios, eventos)` (una transacción) y `vaciar`. Escribir sobre una
  base vacía es un error. Errores: `indice-unico` (patente, o `[unidadId, fecha]` de los partes), `evento-repetido` y
  `escritura-fallida`. La suite de contrato (`tests/contrato-repositorio.ts`) está lista para correrla también contra
  IndexedDB (paso 2.4, decisión S2).

**Correcciones de la revisión del dominio (18/11/2026; informe de proceso fuera del repositorio)**

Estas decisiones las tomó el agente programador (IA) trabajando solo, con el criterio más conservador. Matías confirmó
M1, M3 y M4 el 18/11/2026.

| Hallazgo | Qué se hizo |
| --- | --- |
| M1 (a confirmar) | P9 a la fecha del parte con los documentos como estaban (ver «Fechas y vencimientos»). |
| M2 | Contexto validado y instantes estrictos (ver «Comandos»). |
| M3 (a confirmar) | Corrección de kilometraje anterior a registros ya cargados: se rechaza (ver «Kilometraje»). |
| M4 (a confirmar) | La habilitación de ingreso cargada y vencida (o por vencer) en un proyecto que no la exige alerta con gravedad `baja`, no cuenta en la insignia (`criticas`) y es coherente con `aptitud` (la unidad puede salir). Se mantiene en el grupo «vencidos» (o 7/15/30) para que el encargado la vea. No se agregó un mecanismo de descarte (no existe en el diseño y habría que guardarlo); «descartable» se resolvió con gravedad baja. La habilitación de manejo del conductor (V17) conserva su gravedad. |
| M5 | `vite.config.ts` fija `TZ=Asia/Tokyo` cuando nadie la definió, antes de cargar los módulos: `npm test` ya detecta un uso de la hora local (verificado con una mutación: fallan 3 tests sin `TZ`). `tests/zona-horaria.test.ts` exige que `TZ` esté definida y que, salvo pedido explícito, no sea la de Argentina. `.github/workflows/ci.yml` (Node 24, `npm ci`, `tsc`, `npm test`, `test:tz`, `npm audit --audit-level=critical`, permisos de solo lectura); hoy Actions no corre en la cuenta por facturación. La excepción de `picomatch` (5 altas en herramientas de desarrollo, sin parche) está comentada en el archivo. |
| M6 | Copias de entrada (ver «Comandos»). |
| B1 | Test que recorre cada día de 2000-01-01 a 2100-12-31 contra `Date.UTC` (mata las mutaciones de los años de siglo). |
| B2 | `tests/endurecimiento.test.ts`: descripción de 500 caracteres, `emitido === vence`, litros 200 y 200,5, tope de 200 del motivo de A3 (con `abreviar` en `textos.ts`), desempates de `documentoVigente` y de `registrosDeKm`; la licencia que vence el día del parte (P9). Cada uno se comprobó con su mutación. |
| B3 | Se quitó `enviadoFueraDeTermino` (una sola definición, la de `enviarParte`, probada en el borde de las 00:00 de Argentina); `validarLitros` único; `licencia` ya no usa `faltantesDeConductor` en P9; se quitó el `?? "El documento"` imposible. |
| B4 | `sumarDias` exige un entero. |
| B7 | C10 a las 00:00 de Argentina; `datos.motivo` del evento de A3 guarda el motivo abreviado, igual que el estado. |
| B8 | Los textos de validación, de kilometraje, del checklist, de aptitud y de las alertas pasaron a `textos.ts`. Quedan afuera solo los mensajes del contexto mal armado (error de programación). |
| B10 | `textoEmpresa` rotula siempre el CUIT como «ficticio»; el README ya no afirma que la serie de patentes «no se emitió». |
| B11 | `CLAUDE.md` habla de «material de terceros». No se reescribió el historial. |

**Pendiente o de diseño (no se tocó):** B4 (tipos con marca para `FechaCivil`/`Instante`, uniones discriminadas de eventos y
errores, aserciones `as`); B5 (`cambiarAsignacion` rechaza un cambio solo de proyecto si el conductor ya asignado quedó
inactivo); B6 (una unidad con `proyectoId` inexistente sale como «Puede salir»: pensar si lanzar o sumar un motivo); B9
(índice único de `secuencia` en el repositorio, junto con el aviso entre pestañas D9); B3 restante (duplicación de
`checklistVacio`/`reemplazarOAgregar`, rutas «desconocido» inalcanzables, test de forma de `datos` entre el generador y los
comandos); B10 (verificar la serie de patentes y que los nombres de proyectos no coincidan con reales); B11 (el correo del
autor en los 17 primeros commits: decide Matías si reescribir el historial antes de publicar).

**Persistencia, arranque y estado de la aplicación (18/11/2026, pasos 2.4 a 2.6 y 3.1)**

- **IndexedDB (2.4).** Los almacenes de listas usan clave automática (el orden de lectura es el de inserción, igual que en la memoria)
  y un índice único `id`; reemplazar por `id` es buscar la clave en ese índice y hacer `put`. Además de los índices de la sección 10,
  todos tienen `id`. Los eventos se agregan con `add`: un id repetido es `evento-repetido`. Toda escritura es una transacción sobre
  todos los almacenes; un dato que no se puede guardar (DataCloneError) o una cuota agotada abortan todo (P12, D10).
  `reemplazarTodo` también borra el historial (es una sola transacción; `vaciar` queda para quien quiera una base vacía).
- **Arranque (2.5).** D7 vale también para un registro `meta` ilegible (fecha inválida, semilla que no es entera): se trata como
  esquema distinto. En D5 (regeneración silenciosa) y en D6 se conservan el perfil y la semilla guardada; en D7 no se arrastra
  el perfil (no se sabe leer ese formato). Si el perfil conductor apunta a alguien que ya no existe, vuelve al encargado.
  Cualquier falla del almacenamiento a mitad del arranque (abrir, leer o escribir) cae al modo memoria con el aviso de D8, sin
  avisos de D5 o D7. "Preparando la flota de ejemplo…" se pide si **todo el arranque** pasa de 300 ms, no solo la primera visita.
- **Aviso entre pestañas (2.6).** El mensaje es solo `{ tipo: "cambio" }` (sin datos); lo demás se ignora. Se avisa después de
  cada escritura exitosa (también el autoguardado de borradores y el cambio de perfil). Sin `BroadcastChannel` no pasa nada.
  En modo memoria no se crea el canal (cada pestaña tiene su propia memoria). Límite conocido: dos pestañas escribiendo a la
  vez pueden repetir un `secuencia` de evento (B9); los ids son únicos.
- **Estado reactivo (3.1).** `EstadoApp` (`src/lib/estado/app.svelte.ts`) guarda el `Estado` en `$state.raw` y lo reemplaza entero con cada
  comando. Escribe en el repositorio **antes** de cambiar el estado en memoria (D10), y los comandos se hacen de a uno (cola).
  `hoy` se refresca con `actualizarReloj()` (la vista lo llama al volver a la pestaña o cada minuto); `document.title`, el foco al
  `h1` y las redirecciones son de la vista: el estado expone `titulo`, `ruta` y `versionDePantalla` (sube al llegar a otra pantalla).
- **Perfil y rutas.** La ruta se resuelve con el perfil: el conductor solo ve `#/conductor` y `#/parte/…`; si abre una del encargado
  se lo lleva a su inicio, y al revés (diseno-ui.md, tabla de la sección 2). Una ruta mal escrita es `desconocida` (estado de error
  de la pantalla) en cualquier perfil y **no** guarda el texto que se escribió. Hash canónico: patente normalizada sin espacios.
  El perfil Conductor solo ejecuta `guardarBorrador`, `enviarParte` y `descartarBorrador`: el dominio no lo controla, lo controla `EstadoApp`
  (`sin-permiso`) como defensa extra; no es seguridad.
- **Ids nuevos.** 24 caracteres hexadecimales de `crypto.getRandomValues` (no `randomUUID`, que no existe fuera de contextos seguros).
- **Textos nuevos** (`textos.ts`): `TEXTO_AVISO` (D4, D7, D8, D9), `textoDatosDeOtraFecha` (D5), `TEXTO_ERROR_ARRANQUE` (5.19) y errores
  `noPudoGuardar`, `sinPermiso`, `sinDatos`, `noPudoActualizar`. `redactor-ux` los revisó el 18/11/2026
  (informe de proceso fuera del repositorio) y la revisión está aplicada.
- **Revisión de textos (18/11/2026).** `TEXTO_ERROR_ARRANQUE` es `{ titulo, mensaje }` (el título va en el `h1`). Cada escritura que
  falla dice lo suyo: `noPudoGuardar` (formulario), `noPudoGuardarElParte` (`guardarBorrador` y `enviarParte`),
  `noPudoReiniciar` (reiniciar con la demo cargada) y `noPudoCambiarVista` (`cambiarPerfil`). El botón del aviso D9 sigue
  siendo «Actualizar» (lo fija diseno-ui.md 5.18).
- **La pantalla de error de arranque no reinicia (18/11/2026, reemplaza a la «decisión A»).** A la fase `error` solo se llega si falla
  `reloj.momento()`, `generar` o la barra de direcciones, es decir, por un error de programación o del entorno. Los datos guardados
  no llevan a ella: se probó con perfil corrupto, listas ausentes o nulas, elementos basura y `meta` dañado, y en todos los casos
  `arrancar` termina en `lista` (o cae al ejemplo con el aviso D7, o a la memoria con el aviso D8). Por eso borrar la base desde ahí no
  arregla nada y descarta datos buenos; además `deleteDatabase` cierra las conexiones de las otras pestañas sin avisar (D9) y, si
  queda bloqueado, puede ejecutarse más tarde por su cuenta. Se quitó: `reiniciar()` sin estado cargado (arranque o fase `error`)
  devuelve `sin-datos`, no hay `borrarAlmacenamiento` ni `borrarIndexedDB`, y la vista ofrece solo «Recargar la página». El texto
  `TEXTO_ERROR_ARRANQUE.mensaje` dice «Recargue la página. Si el problema sigue, pruebe con otro navegador.».
- **«Fuera de servicio hasta que el encargado la revise» (revisión del marco, 18/11/2026).** «Revisar» no es una acción de la demo: la
  unidad vuelve cuando el encargado resuelve la novedad y usa «Volver a servicio» (A4, N2). `TEXTO_PARTE` (`textos.ts`) tiene los dos
  textos del parte con la acción real; `diseno-ui.md` (wireframe del parte, panel «Parte enviado» y tabla de textos) quedó igual.
  Falta, del lado de la vista, el mismo cambio en `TEXTO_COMO_FUNCIONA.parte` (`textos-marco.ts`). La regla P9 no cambia: la licencia vencida del conductor solo avisa al enviar el parte. **(Reemplazado el 19/11/2026: la licencia vencida o faltante bloquea la revisión, L1 y sección 17.)**
- **Listas guardadas con elementos dañados (QA, 18/11/2026).** D7 vale también para ellas: al arrancar, cada lista tiene que ser un arreglo de objetos con los campos básicos (`id` y, según la lista, `patente`, `titular`, `checklist`, etc.) y `calcularAlertas` no puede fallar con ellas; si no, se regenera el ejemplo con el aviso D7. Antes quedaban en la fase `lista` y la pantalla fallaba al dibujar (corrige lo dicho en el párrafo anterior sobre «elementos basura»).
- **«Último en escribir gana» en `meta` (QA D6): anotado, no arreglado.** `cambiarPerfil` escribe `{ ...estado.meta, perfil }` con el `meta`
  que esta pestaña tiene en memoria. Si otra pestaña reinició o modificó datos y esta todavía no pulsó «Actualizar» (aviso D9), pisa
  `fechaBase`, `modificada` y `semilla` con valores viejos. Hoy no se nota (la interfaz no modifica datos todavía); con la Etapa 4 sí:
  si la otra pestaña marcó `modificada = true`, al día siguiente el ejemplo se corre en silencio y se pierden sus cambios. Un arreglo
  seguro necesita una operación atómica en el repositorio («guardar solo el perfil», leyendo y escribiendo `meta` en la misma transacción)
  en las dos implementaciones y en la suite de contrato; no es chico. **Mitigación aplicada (18/11/2026):** `cambiarPerfil` se niega con
  `cambios-en-otra-pestana` (`ERRORES.cambiosEnOtraPestana`: «Pulse «Actualizar» en el aviso y vuelva a cambiar la vista») mientras
  `hayCambiosEnOtraPestana` sea verdadero. Queda abierto el caso de una pestaña que escribió y todavía no avisó (ventana de milisegundos).
- **Historial del navegador y cambio de perfil (QA B5, 18/11/2026).** Cambiar de perfil no es navegar: `cambiarPerfil` reemplaza la entrada
  actual del historial (`reemplazarHash`) en vez de agregar una. Así Atrás no vuelve a un hash del perfil anterior que `leerUbicacion`
  reescribiría (una pulsación sin efecto). **Límite conocido:** las entradas que se visitaron antes del cambio siguen en el historial y,
  con el otro perfil, se redirigen al inicio: puede haber una pulsación de Atrás «muerta» por cada una. No se puede borrar historial.
- **Plazo para abrir el almacenamiento (18/11/2026, QA M1).** Algunos navegadores dejan `indexedDB.open` sin responder. `arrancar`
  espera `PLAZO_ABRIR_MS` (8 s; inyectable con `plazoAbrirMs` en `OpcionesArranque` y en `DependenciasApp`) y, si vence, lo trata como
  almacenamiento no disponible: modo memoria con el aviso D8. Si la conexión llega después, se cierra. El plazo cubre solo la
  apertura, no la lectura ni la primera escritura (un primer arranque lento pero vivo no cae a memoria).
- **Perfil guardado inválido (QA B4).** Al arrancar con datos guardados, si `meta.perfil` no es el encargado ni un conductor que existe,
  el estado en memoria queda con el encargado (sin aviso). No se reescribe el almacenamiento en el arranque: la corrección viaja en
  la próxima escritura de `meta`.
- **Horizonte, lógica (paso 4.1, 18/11/2026).** `dominio/horizonte.ts` arma lo que dibuja 5.6 a partir de `calcularAlertas` (no duplica reglas).
  Lo que la especificación no fijaba: (1) *más de 4 el mismo día:* se dibujan 3 marcas llenas y la cuarta hueca («y más»); el máximo (4) cuenta la
  hueca. `ocultas` = vencimientos del día sin marca llena (los que representa el aro). (2) *Mediana:* mismo máximo de 4 apiladas (la regla
  general de 5.6); el maquetador puede bajarlo con `maxApiladas` si 2rem no alcanza. `aria-label` = el mismo de la completa, con los números de la
  unidad. (3) *Mínima:* una sola marca, la del vencimiento más próximo de la unidad (es lo que dice el texto de la celda; con 4rem de ancho no
  se distinguirían varias). Sin caja, sin escala, `aria-hidden`. Si la unidad no tiene nada en 30 días, pista sin marcas y sin texto de vacío.
  (4) *Vacío:* una pista «vacía» es la que no tiene marcas, aunque haya vencidos (la caja y el `aria-label` los dicen). (5) *Qué cuenta:* solo
  alertas de la categoría vencimientos; las de operación no. En la ficha, solo las de esa unidad (las del conductor tienen `unidadId` nulo).
- **Centro de alertas y diálogos Renovar y Cargar, lógica (paso 4.2, 18/11/2026).** `estado/centro-alertas.ts` (vista armada), `dominio/formulario-documento.ts`
  (diálogos) y `EstadoApp` (`centroDeAlertas`, `renovarDocumento`, `cargarDocumento`) no agregan reglas: reusan `calcularAlertas`, `aptitud` y los comandos.
  Lo que la especificación no fijaba, con el criterio más conservador:
  (1) *Orden del protagonista* («por prioridad», 6.1): primero las unidades en servicio que no pueden salir y después las fuera de servicio; cada grupo por patente.
  Tope de 6; «Ver las N en la flota» dice el total (N = todas las del protagonista, no las que faltan) y enlazaba a `#/flota` sin filtro porque la flota todavía no tenía el filtro «No pueden salir» + «Fuera de servicio»;
  con el paso 4.3 enlaza a `#/flota?filtro=no-disponibles` (ver la viñeta siguiente).
  (2) *«Vencimientos · 11»* cuenta también los vencidos y faltantes (2 + 4 + 3 + 2 del ejemplo), igual que «Todos» y que «Quedan 10 vencimientos».
  (3) *Fila de «novedad abierta» en Operación diaria:* dice la antigüedad de la más antigua («1 novedad abierta hace 9 días»; con varias: «3 novedades abiertas, la más
  antigua hace 9 días»). El resto de las filas solo lleva la cantidad.
  (4) *Titular de un conductor* en la lista: su nombre, «Conductor» en la segunda línea (la especificación dice «Licencia», que no vale para la habilitación de manejo) y,
  si tiene unidad asignada, el enlace a su ficha; el proyecto es el de esa unidad (si no tiene, «—»).
  (5) *Detalle de operación:* «Qué pasó» es el texto de la alerta tal como lo arma el dominio (ya incluye «parte del 16/11/2026»); «Fecha» repite esa fecha sola. «Estado»
  usa las etiquetas de 5.7 (Crítica, Abierta, Sin enviar, Sin parte, Con documentación vencida). Acciones: «Resolver» (la novedad; el diálogo es del paso 4.4, hasta
  entonces la fila ofrece su `href` de ficha), «Abrir parte» (al parte de esa fecha) y «Ver ficha».
  (6) *Diálogos.* El primario y el título siguen 5.17 («Renovar: Seguro de ZK 214 BD», «Guardar renovación», «Guardar documento»); «Cargar» lleva el mismo título con «Cargar:».
  La línea de contexto dice «póliza» para el seguro y «número» para el resto («Vigente: número DEMO-RT-1234, vence el 25/11/2026 (en 7 días).»). `contextoDeRenovar`
  devuelve `null` si el documento ya no es el vigente (se renovó en otra pestaña o ya) y `contextoDeCargar` si ya hay uno vigente: en ese caso no hay diálogo que abrir.
  El `select` «Tipo» de «Cargar otro documento» (ficha) es del paso 4.4.
  (7) *Errores por campo.* El dominio devuelve solo el primer error; para decir todo junto (resumen de 5.15) `validarValores` corre **los mismos validadores** del dominio
  sobre cada campo (número, emisor, vencimiento, emisión) antes de ejecutar; lo que depende de dos campos (V10, emisión posterior al vencimiento) lo dice el comando. Un error
  sin campo del diálogo (guardado, documento ya reemplazado, tipo ya cargado, sin permiso, sin datos) va como error general. El texto escrito no se toca.
  (8) *Foco al guardar bien:* siempre al título (`h2`) del panel de vencimientos. La fila que abrió el diálogo no puede seguir existiendo: su alerta se resuelve, o pasa a
  ser la del documento nuevo (otro id), aunque la renovación siga alertando dentro de los 30 días. Al cancelar, el foco vuelve al botón (lo resuelve la vista).
  (9) *Mensaje de la barra de estado:* «Seguro de ZK 214 BD renovado. Quedan 10 vencimientos.» (género según el documento); se arma con el estado ya actualizado.
- **Flota y «Agregar unidad», lógica (paso 4.3, 18/11/2026).** `estado/flota.ts` (filas, búsqueda, filtros y orden), `dominio/formulario-unidad.ts` (diálogo) y `EstadoApp`
  (`panelDeFlota`, `agregarUnidad`) no agregan reglas: reusan `calcularAlertas`, `aptitud`, `kmActual`, `horizonteMinimo` y `altaUnidad`. Lo único que se movió en el dominio:
  las comprobaciones de patente (U1, U2), interno (U3) y año (U4) del alta pasaron a `validacion.ts` (`validarPatenteDeAlta`, `validarInternoDeAlta`, `validarAnioDeAlta`) para que el
  formulario diga todos los errores juntos con el mismo código que el comando; el comando valida en el mismo orden de antes. Lo que la especificación no fijaba, con el criterio más conservador:
  (1) *Filtro en la ruta:* `#/flota?filtro=no-disponibles` (valores: `pueden-salir`, `no-pueden-salir`, `fuera-de-servicio`, `de-baja`, `no-disponibles`; «activas» es el de por defecto y no viaja).
  Solo la flota admite consulta; un valor desconocido, vacío o roto se ignora (es `#/flota`, y la barra de direcciones se corrige: no se repite lo escrito); en las demás pantallas un `?` sigue siendo ruta desconocida.
  Elegir un radio **no** escribe el hash (sería otra pantalla para el enrutador: bajaría el foco al `h1` y sumaría entradas al historial): la consulta es estado de la vista y arranca en `consultaDeRuta(app.ruta)`.
  (2) *«No disponibles»* (no pueden salir + fuera de servicio, las que cuenta el protagonista de 6.1) es una sexta opción de los filtros que solo aparece cuando es la elegida (6.2 dibuja cinco radios, 6.1 pide ese enlace):
  así se ve qué se está mirando y se sale eligiendo otra. Los conteos de los filtros son de la flota entera y no cambian con la búsqueda ni con el proyecto; «Mostrando X de Y unidades» usa como Y las del filtro de estado elegido.
  (3) *Búsqueda:* las palabras se separan por espacios, todas tienen que aparecer, y cada una se compara sin mayúsculas, tildes, espacios, guiones ni puntos (`zk214`, `ZK-214-BD`, `int 07`, `andres`). Mira patente, interno
  («Int. 07»), marca, modelo, año, tipo y conductor; no el proyecto (tiene su `select`). Entrada hostil: se leen como mucho 60 caracteres y 6 palabras; un texto de solo símbolos no busca nada (no filtra).
  (4) *Orden «Prioridad»:* no puede salir, fuera de servicio, puede salir y de baja al final; dentro de cada grupo, próximo vencimiento (falta un documento, vencido, por vencer del más cercano al más lejano, vigente, sin vencimientos) y patente.
  «Último parte»: el más antiguo primero (quien hace más que no envía), con las que no tienen partes antes de todas. «Patente»: alfabético; «Interno»: numérico. Un valor de orden desconocido vuelve a «Prioridad»; un proyecto que no existe, a «Todos».
  (5) *Próximo vencimiento:* sale de las alertas de la unidad (la más urgente, que es la primera): «Revisión técnica · en 6 días» (con la pista mínima), o la etiqueta crítica y el nombre si falta o está vencido. Sin alertas, el documento vigente
  que vence primero, con su fecha y sin pista («Seguro · 12/05/2027»). Una unidad **de baja** muestra «—»: sus vencimientos no alertan (V14) y se ven en su ficha.
  (6) *Último parte:* el último **enviado** (un borrador no cuenta); la etiqueta chica sale de las alertas de operación de la unidad («Sin enviar» gana sobre «Sin parte»). Sin ninguno: «Sin partes».
  (7) *Novedades:* cifra de abiertas; con críticas, «1 (crítica)», «3 (1 crítica)», «3 (2 críticas)».
  (8) *Estado:* la etiqueta de 5.7 y, en línea 2, el primer motivo de `aptitud` («Seguro vencido hace 1 día»; las fuera de servicio y de baja, el motivo del dominio: «Fuera de servicio desde 13/11/2026: …»); con más de uno, «y N motivos más».
  (9) *Vacío:* «Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.» (con filtro de estado distinto de «Activas», al final «(filtro: De baja)»); lo buscado se repite como texto, sin espacios de más y acortado a 40 caracteres.
  «Quitar filtros» vuelve a «Activas», sin búsqueda y «Todos» y deja el orden (el orden no es un filtro); se ofrece solo si hay algún filtro puesto. Sin ninguna unidad: «Todavía no hay unidades.» y se ofrece agregar.
  (10) *Agregar unidad:* todos los campos empiezan vacíos (no hay nada que precargar ni se sugiere un interno); el `select` de conductor ofrece «Sin conductor asignado» (valor vacío) y los conductores activos con la unidad que ya tienen
  (`asignadoA`, para avisarlo junto a la opción: el dominio no impide que dos unidades compartan conductor). La validación previa dice, juntos y en el orden de 5.17, patente (U1, U2), interno (U3), tipo, marca, modelo, año (U4) y «Elija el proyecto»;
  que el proyecto o el conductor existan lo dice el comando al ejecutarse (solo pasa si cambió en otra pestaña), con el campo mapeado (`tipoUnidad` del dominio es `tipo` del formulario). Interno y año aceptan solo dígitos (nada de `1e2`, `7.5` ni `-3`).
  (11) *Al guardar bien:* devuelve `ruta` y `href` de la ficha y el mensaje «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.» (la cantidad sale de las alertas de la unidad nueva, 4 en un proyecto que pide habilitación y 3 en la base).
  Desde el paso 4.4 (viñeta 13 de la ficha) **la aplicación navega sola a la ficha** y el mensaje viaja en `app.mensajeDeLlegada`; hasta el 4.4 no navegaba. El foco va al título de la ficha, que ya lo mueve el cambio de pantalla.
  (12) *Permiso y doble envío:* la validación de campos va antes que el permiso (con el perfil Conductor y datos bien escritos, el error general es «sin permiso»); dos envíos seguidos no duplican la unidad (el segundo ve la patente repetida en su campo).
- **Ficha de unidad y sus diálogos, lógica (paso 4.4, 18/11/2026).** `estado/ficha.ts` (lo que dibuja 6.3 y 5.16), `dominio/formulario-novedad.ts` (resolver y cargar novedad), `dominio/formulario-ficha.ts` (fuera de servicio, volver a servicio, dar de baja,
  corregir kilometraje, cambiar proyecto o conductor), `dominio/formulario-documento.ts` (suma «Corregir documento» y el `select` Tipo de «Cargar otro documento») y `EstadoApp` (`fichaDeUnidad`, `mensajeDeLlegada` y un método por comando) no agregan reglas: reusan `calcularAlertas`, `aptitud`,
  `kmActual`, `horizonteDeUnidad` y los comandos. Tres retoques chicos al dominio para no duplicar: `criticasAbiertasDeUnidad` (`novedades.ts`: el texto del error de A4 y el del diálogo salen de la misma función), `validarFechaNoFutura` (`validacion.ts`: la usan el comando de kilometraje y su formulario)
  y `Motivo.documento` (`aptitud.ts`: de qué documento es un motivo, para el aviso de A5). Lo que la especificación no fijaba, con el criterio más conservador:
  (1) *Acciones según estado y perfil:* en servicio, «Cargar parte» (enlace al parte de hoy) y «Poner fuera de servicio»; fuera de servicio, «Volver a servicio» (P8: sin «Cargar parte»); «Más acciones» (corregir kilometraje, cambiar proyecto o conductor, cargar novedad, dar de baja) en las dos. De baja: ninguna del encabezado,
  ni «Cargar otro documento», ni «Cargar novedad», ni «Corregir kilometraje», ni Renovar/Corregir/Cargar (el dominio los rechaza con `unidad-de-baja`); **«Resolver» sí sigue** en sus novedades abiertas (es lo único que el dominio le deja cerrar, ver «Comandos»). Con el perfil Conductor no hay ninguna (la ruta de la ficha tampoco llega).
  (2) *A4 y N2 a la vista:* `estadoOperativo.novedadesQueImpiden` lista las críticas abiertas de una unidad fuera de servicio; la acción «Volver a servicio» trae `bloqueo` (el texto de A4) y cada novedad crítica abierta `impideVolver` y `ofreceVolverAServicio`. Con C11 (ZU 899 QE): bloqueo «Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).» y la de frenos ofrece volver al resolverla.
  (3) *N2 solo si la unidad quedó fuera de servicio por una novedad crítica* y esta es la última crítica abierta; si quedó fuera a mano no se ofrece (el dominio lo permitiría, pero «Volver a servicio» está en su ficha). La casilla viene marcada cuando se ofrece; con `volverAServicio: true` forzado y sin que corresponda, el comando devuelve su error general.
  (4) *Volver a servicio:* con críticas abiertas el diálogo no tiene botón primario (`primario: null`) y lista las novedades con «Ver novedades»; si igual se intenta (`app.volverAServicio`), el error general es el mismo texto. Con documentos vencidos o faltantes (A5) el diálogo avisa «La unidad vuelve a servicio, pero no puede salir hasta renovar: Seguro.»
  («renovar» para vencidos, «cargar» para faltantes, «renovar o cargar» si hay de los dos) y el mensaje de éxito agrega «Todavía no puede salir: …».
  (5) *Documentos:* una fila por documento obligatorio de la unidad y por cada cargado (también la habilitación de ingreso en un proyecto que no la pide), en el orden de 5.1; el faltante es una fila «Falta cargar» con «Cargar»; «Corregir» y «Renovar» solo sobre el vigente; los reemplazados van en «Anteriores (N)», solo lectura. Una unidad de baja no muestra faltantes (V14).
  La cabecera cuenta filas: «4 · 1 vencido · 1 faltante». **«Cargar otro documento»** ofrece los tipos de unidad que no tienen documento vigente (incluidos los faltantes, que además tienen su botón «Cargar»); sin ninguno, no se ofrece. El `select` Tipo es el primer campo y va vacío: hay que elegir (error «Elija el tipo de documento.»).
  (6) *Novedades:* abiertas, las críticas primero y la más antigua (N5); resueltas, la resuelta más recientemente primero. Origen: «Parte del 16/11/2026, punto Frenos», «Parte del …, otra novedad» o «Cargada por el encargado». Etiquetas «Crítica», «Abierta», «Resuelta».
  (7) *Kilometraje:* los últimos 10 registros (partes enviados y correcciones), el más nuevo primero; el parte muestra «84.188 → 84.320» y el recorrido («Sin uso» si es 0) con las advertencias K6 y K7 que se aceptaron; la corrección muestra «Corrección: 120 km» y su motivo. El diálogo precarga la fecha de hoy y no acepta una futura.
  (8) *Historial:* todos los eventos de la unidad (H3, H4), 30 por página con «Ver 30 más» (`vistaDeHistorial` los recorta y agrupa por día; el primer evento nuevo es `ids[límiteAnterior]`). Filtros: Partes; Documentos; Novedades; «Estado y kilometraje» = fuera de servicio, vuelta, kilometraje corregido y baja (el alta y el cambio de asignación solo aparecen en «Todo»).
  El detalle del parte enviado y el «Antes / Después» del documento corregido se leen de `datos` con cuidado: si la forma no es la esperada el evento se muestra igual, sin detalle (queda abierto el test de forma de `datos` entre el generador y los comandos, B3). Un instante ilegible no rompe la ficha (sale sin fecha).
  (9) *Foco tras guardar* (`FocoTrasGuardar`): renovar, cargar y corregir documento → título de Documentos; resolver y cargar novedad → título de Novedades (resolver desde el centro de alertas, `titulo-del-panel`); corregir kilometraje → título de Kilometraje; poner fuera de servicio, volver, dar de baja y cambiar asignación → título de la ficha (`h1`).
  La fila o el botón que abrió el diálogo puede haber cambiado o desaparecido (5.17). Al cancelar, el foco vuelve al botón (lo resuelve la vista).
  (10) *Desde dónde se guarda:* `renovarDocumento`, `cargarDocumento` y `resolverNovedad` aceptan `donde` (`"centro"` por defecto, el comportamiento del 4.2; `"ficha"`). En la ficha el mensaje no dice «Quedan N vencimientos» (cuenta toda la flota) sino lo que se hizo («Seguro de ZK 214 BD renovado: vence el 15/11/2027.»); desde el centro, el de «Resolver» nombra la unidad («Novedad resuelta: Frenos (ZU 899 QE).»).
  (11) *Cambiar proyecto o conductor:* los valores iniciales son los de hoy; el conductor que la unidad tiene aunque haya quedado inactivo se conserva en la lista como «Nombre (inactivo)» (si no, el `select` no podría mostrarlo; al guardar, el dominio dice «El conductor no está activo»: B5 sigue abierto). `avisoDeAsignacion` dice, antes de guardar, si el proyecto elegido exige una habilitación que la unidad no tiene (U6);
  el mensaje de éxito lo repite («Proyecto actualizado. Falta cargar la habilitación de ingreso al proyecto.»). Sin nada que cambiar, error general «No hay cambios para guardar.».
  (12) *Dar de baja:* el contexto trae `peligro: true` (botón de peligro, 5.1) y el aviso de que no se deshace; el foco inicial lo decide la vista (5.17: el primer campo).
  (13) *Navegación tras «Agregar unidad» (ajusta la viñeta (11) del 4.3):* `agregarUnidad` ahora **navega a la ficha** (`app.irA`) y deja el mensaje en `app.mensajeDeLlegada`, que se va al salir de esa ficha; el resultado sigue trayendo `ruta` y `href`. «Cárguelos desde aquí» es cierto: la ficha de la unidad nueva lista los 4 faltantes (3 en la base) como filas con «Cargar» y los cargados dejan la cuenta en su lugar (probado con el estado de la aplicación).
- **Ficha de unidad y sus diálogos, pantalla (paso 4.4, 18/11/2026, maquetador).** `PantallaFicha.svelte` (orquesta) con `FichaEncabezado`, `FichaDocumentos`, `FichaNovedades`, `FichaKilometraje` y `FichaHistorial`; `DialogoFormulario` (base: valores, resumen de errores, error general, «Guardando…» y cierre) con un componente por diálogo (`DialogoResolver`, `DialogoNovedad`,
  `DialogoFueraDeServicio`, `DialogoVolver`, `DialogoBaja`, `DialogoKilometraje`, `DialogoAsignacion`, `DialogoCargarOtro`); «Corregir documento» reusa `DialogoDocumento` (la nota va como línea de contexto y suma `ayudaEmisor`). Piezas nuevas chicas: `Casilla`, `Detalles` y la variante `documentos` de `ListaTabla`; `Campo` suma `maxFecha` y `MenuMas` el botón con texto («Más acciones ▾»). Sin cambios en la lógica ni en los tokens. Lo que la especificación no fijaba, con el criterio más simple:
  (1) *Un solo mensaje a la vez, en el lugar que cambió:* el de guardar bien va a la barra de estado del panel que cambió (Documentos, Novedades, Kilometraje) o, si cambió la unidad entera (fuera de servicio, volver, baja, asignación, llegada desde «Agregar unidad»), a una región `role="status"` debajo de las acciones del encabezado; la acción siguiente lo reemplaza. El foco va adonde dice `r.foco`; al cancelar, vuelve al botón.
  (2) *Emisor:* no es una columna (6.3 la oculta por debajo de 66 rem y el panel de documentos, 8 de 12 columnas, nunca llega a ese ancho): va siempre en la segunda línea del número. Columnas: Documento · Número · Vence · Estado · Acciones (Vence antes que Estado, como en 6.3). Franja solo en las filas que no están vigentes.
  (3) *Disposición:* escritorio (desde 68,75 rem) documentos en 8 de 12 columnas, novedades y kilometraje apilados en las otras 4, historial a todo el ancho; por debajo, una columna en el orden documentos, novedades, historial, kilometraje. «Cargar parte» es un enlace al parte de hoy (la pantalla del parte es del 4.5: hasta entonces llega al marcador).
  (4) *Más acciones* es el menú 5.3 con el rótulo visible y una flecha; en teléfono las acciones del encabezado van apiladas a todo el ancho.
  (5) *Volver a servicio:* el botón no muestra el bloqueo al lado (`acciones.bloqueo` no se usa): lo explica el diálogo, que abre con el foco en el título y cuyo botón que cierra dice «Cerrar» (sin primario no hay nada que cancelar). «Ver novedades» cierra y lleva el foco al título de Novedades.
  (6) *Dar de baja:* el foco inicial es el campo del motivo (hay que escribir para seguir; no es una confirmación de un toque) y el aviso de que no se deshace describe el diálogo (`aria-describedby`), así se lee al abrir. Botón de peligro con la patente.
  (7) *Resolver:* arriba de «¿Qué se hizo?» una caja con la novedad (etiqueta, origen y, si el origen no la dice, la fecha); la casilla «Volver a servicio ahora» viene marcada con su nota y el aviso de A5 dentro. Los diálogos con texto de contexto (fuera de servicio, volver, baja, kilometraje, resolver, corregir) lo asocian con `aria-describedby`.
  (8) *Kilometraje:* tabla con encabezados solo para lectores (fecha · registro · recorrido); la fecha de un parte es el enlace al parte. Las correcciones llevan `i-km` y su motivo; los saltos aceptados, `i-alerta` en tono semana. El campo «Desde» del diálogo lleva `max` = hoy.
  (9) *Historial:* ícono `i-reloj` en el título del panel; la barra de estado dice «Mostrando 30 de 50 eventos.» (es la región viva) y se actualiza al elegir un filtro y al pedir más; cambiar de filtro vuelve al primer tramo de 30; cada evento tiene `tabindex="-1"` para recibir el foco tras «Ver 30 más». El parte enviado es un `details` con el resumen en peso normal; el documento corregido, una tabla Campo · Antes · Después.
  (10) *Novedades:* el filtro Abiertas / Resueltas es de este panel y se anuncia en una región aparte (la barra de estado es para lo que se guardó). Una crítica abierta que impide volver lleva «Impide volver a servicio hasta que se resuelva.» en tono crítico. Una resuelta muestra «Resuelta el 24/10/2026 11:42 por {autor}.» y lo que se hizo.
  (11) *Si ya no hay diálogo que abrir* (`contextoDe…` devuelve `null`: otra pestaña cambió la unidad o el documento) la barra de estado del lugar lo dice («Ese documento ya cambió. La lista está al día.», «La unidad cambió desde la última vez que se miró…», «Esa novedad ya no está abierta…» en el centro de alertas).
  (12) *Centro de alertas, «Resolver»:* abre el mismo diálogo; el mensaje («Novedad resuelta: Frenos (ZU 899 QE).») va a la barra de estado del panel «Detalle de la operación» y el foco a su título; si el detalle quedó sin filas el panel se queda mientras haya mensaje (con «Sin pendientes de operación.») y, si no, el foco va al título de «Operación diaria».
  (13) *La ficha se vuelve a crear* al llegar a otra ficha o a la misma desde otra pantalla (`{#key app.versionDePantalla}` en `App.svelte`): filtro del historial, mensajes y diálogos arrancan limpios; así el mensaje de llegada de «Agregar unidad» se lee una sola vez.
  (14) *Flota tras el alta:* `PantallaFlota` ya no se queda con el mensaje ni mueve el foco a la fila nueva; `DialogoUnidad` solo guarda y se cierra (`alGuardar` y `focoDestino` pasaron a ser opcionales). El cambio de pantalla lleva el foco al `h1` de la ficha.
  (15) *Colores forzados:* la franja de las filas de la lista-tabla solo se dibuja en las que tienen tono (antes también en las que están bien).

**Paso 4.5 — inicio del conductor y parte diario (lógica; rama `logica-4-5`)**

Ambigüedades del diseño que se resolvieron al programar `estado/parte.ts`, `estado/autoguardado.ts`, `dominio/formulario-parte.ts` y los métodos del parte de `EstadoApp`. Todas con el criterio más simple; si alguna no convence, se cambia acá y en el código a la vez.

  (1) *El borrador nace con el primer cambio, no al abrir la pantalla.* Abrir un parte y no escribir nada no escribe nada (D11): `guardarBorradorDeParte` devuelve `sinCambios` si el borrador todavía no existe y los valores siguen siendo los iniciales (se decide con `esBorradorVacio`, que ignora el conductor: elegir solo el conductor, con el perfil Encargado, no crea el borrador hasta que se escriba otra cosa). Así «Cargarlo» de un día pasado no deja un borrador (ni la alerta P5) si la persona no escribe. Un borrador que ya existe se actualiza siempre.
  (2) *Kilometraje inicial = último registro anterior a la FECHA del parte*, no el kilometraje actual de la unidad (P13 dice «actual»; para el parte de hoy es lo mismo). Para un parte de un día pasado el actual podría ser el de un parte posterior y K3 lo rechazaría. La ayuda («Último registro: 84.320 km (parte del 17/11/2026).») dice de dónde sale; sin registros, «Es el primer registro de esta unidad.» y el campo queda vacío. El «vacío» de (1) se mide contra ese mismo valor.
  (3) *Conductor del parte.* Perfil Conductor: siempre quien lo completa (el dominio manda `conductorId` del perfil aunque el borrador lo hubiera empezado otro: quien envía se hace cargo, y L1 mira SU licencia; hasta el 19/11/2026 lo hacía P9). Perfil Encargado: el del borrador o, si no hay, el asignado a la unidad (si está activo) o «Elija quién conduce»; el `select` lista los conductores activos con su unidad.
  (4) *Enviar = guardar + revisar + enviar, de a uno por la cola.* `enviarParte` primero guarda lo del formulario como borrador (lo escrito en los últimos 500 ms no se pierde; si el envío se bloquea, por ejemplo K3, el borrador queda), después lista juntos los faltantes (P4) y los errores de formato, en el orden del formulario, y por último ejecuta el comando. Con un error de formato no se guarda (ver 5) pero igual se listan los faltantes. P12: si falla el envío no queda nada a medias y el borrador sigue. Las advertencias (K6, K7, P9) vuelven como `tipo: "advertencias"` con `aceptables`: «Enviar de todos modos» (o «Cerrar de todos modos») repite la llamada con esas. Si ya estaba enviado (doble clic, otra pestaña) devuelve el mismo panel con `yaEnviado: true`, sin escribir nada.
  (5) *Autoguardado.* Un campo con un error de formato (km con letras, litros con dos decimales, texto de más de 500) **bloquea todo el guardado** hasta corregirlo (P3 dice «no se guarda y se avisa en el campo»; guardar el resto a medias dejaría un borrador distinto de lo que se ve). El indicador dice «Sin guardar: corrija los campos marcados.». Un error de escritura dice el texto de 5.15 («No se pudo guardar en este equipo. Lo escrito sigue en pantalla; no cierre la pestaña.»), uno de regla (la unidad pasó a fuera de servicio, la fecha ya no vale) dice el mensaje del dominio. Lo que falló sigue pendiente y se reintenta con el próximo cambio, al salir del campo o al `vaciar()`. El texto que se anuncia al lector (`anuncio`) cambia solo al cambiar de estado.
  (6) *Qué parte se ve.* Un parte enviado se ve SIEMPRE en lectura (P7, A7), sea cual sea la fecha o el estado de la unidad. Sin parte enviado: unidad de baja, fuera de servicio (P8) o fecha fuera de P2 → «No se puede cargar este parte» con el mensaje de la regla; si hay un borrador (que ya no se puede enviar), se ofrece descartarlo, que es la salida (P5). La ruta con la fecha mal escrita ya no llega (el enrutador la manda a «Página no encontrada»); el enlace de las pantallas de error es «Ir a Parte diario» (Conductor) o «Ir a Centro de alertas» (Encargado), y no un enlace al parte del día (la unidad puede estar fuera de servicio). Desde el 19/11/2026 la pestaña del conductor también se llama «Parte diario».
  (7) *Inicio del conductor.* La unidad es la elegida con «Usar otra unidad» (solo si está en servicio) o la asignada (la de menor interno, si no está de baja). «Pendientes» = borradores de días anteriores de las unidades asignadas o empezados por ese conductor (con «Continuarlo») + los días sin parte (P6) de las unidades asignadas (con «Cargarlo»); ordenados por fecha. «Su licencia» aparece solo si vence en 30 días o menos, está vencida o falta. «Mis últimos partes»: los cinco enviados más nuevos de ese conductor. El aviso «no puede salir» no impide empezar el parte (P9). La licencia sin vigencia, en cambio, sí lo impide (L1; desde el 19/11/2026, sección 17). Con el perfil Encargado, la misma frase no dice «Avise al encargado».
  (8) *Panel «Parte enviado».* «Combustible cargado» dice «Cargó 45,5 litros» o «No cargó»; «Novedades» agrupa («1 crítica: Frenos», «2 críticas: Frenos, Dirección; 1 normal: Otra novedad»). El aviso de que la unidad quedó fuera de servicio se muestra solo mientras la unidad sigue fuera de servicio (al abrir el parte más tarde, con la unidad ya de vuelta, no aparece). Un parte enviado fuera de plazo lo dice en la línea y en «Enviado fuera de plazo.».
  (9) *Datos con la forma rota.* El almacenamiento es entrada externa. D7 ya trata un parte sin `checklist` objeto como otro formato (vuelve al ejemplo con el aviso); para lo demás (un punto con basura, un número con texto, un combustible desconocido, advertencias mal formadas, un instante ilegible) `parteLegible` lee lo que se pueda y deja el resto vacío, y todas las pantallas del parte pasan por ahí. Un parte sin fecha, unidad, id o estado legibles no existe para las pantallas. `esBorradorVacio` no revienta con un borrador roto (descartarlo siempre funciona) y un instante ilegible deja «Borrador recuperado.» sin fecha ni hora. No se inventa ninguna hora.
  (10) *Textos nuevos* (`TEXTO_FORMULARIO_PARTE`, `TEXTO_GUARDADO`, `TEXTO_INICIO_CONDUCTOR`, `TEXTO_PANTALLA_PARTE` y las funciones de texto del final de `textos.ts`): están hechos por el programador y **los tiene que revisar `redactor-ux`** antes de maquetar. Los de errores de campo («Elija una opción para Frenos.», «Cuente qué encontró en Frenos (al menos 3 caracteres).») siguen 5.12 y 5.15.
  (11) *`EstadoApp.ejecutar`* ahora delega en `ejecutarAhora` (el mismo cuerpo, sin la cola) para que guardar y enviar el parte encadenen dos comandos dentro de UN turno de la cola; el comportamiento de `ejecutar` no cambia.

- **Correcciones de la revisión de la Etapa 4 (lógica, 18/11/2026).** Cuatro decisiones que el diseño no fijaba, con lo más simple:
  (1) *Pestaña desactualizada = solo lectura.* Mientras `hayCambiosEnOtraPestana` esté encendido, `EstadoApp.ejecutarAhora` rechaza **todo** comando (`cambios-en-otra-pestana`, sin escribir ni avisar a las otras pestañas), no solo el cambio de perfil: si no, una baja se deshace o una renovación se duplica (QA A1). Alcanza al autoguardado del parte (el indicador muestra el mismo mensaje). «Actualizar» y «Reiniciar demo» siguen funcionando (los dos apagan el aviso). Límite que queda: si el aviso entre pestañas no llega (sin `BroadcastChannel`, o dos escrituras en el mismo instante), la pestaña vieja no se entera; sin servidor no hay forma barata de comparar versiones. (Pendiente para el README: anotarlo como límite conocido; el README no tiene todavía la sección.)
  (2) *D7 mira el tipo de lo que las pantallas leen.* `FORMA_DE_ELEMENTO` (arranque) ahora pide, por lista, los campos que la ficha, la flota, el centro de alertas y el historial usan, con su tipo y sus valores posibles (`tipo` de unidad, `estado` operativo con sus campos, `origen` de la novedad, `tipo` y `datos` del evento, etc.). Un elemento que no cumple cuenta como otro formato: se regenera el ejemplo y se avisa (QA M3, código M1). **Excepción deliberada: los partes.** Solo se pide `id`, `unidadId`, `fecha`, `estado` y un `checklist` objeto; el resto lo lee `parteLegible` (punto 9 de arriba), que deja descartar o completar un borrador roto en vez de borrarlo todo.
  (3) *Red de seguridad en la pantalla.* `main` va dentro de un `<svelte:boundary>`: si una pantalla falla al dibujarse, el marco (barra, menú, pie) sigue andando y se muestra «No se pudo mostrar esta pantalla» con «Recargar la página» y «Reiniciar demo». Al cambiar de pantalla se vuelve a intentar (`reponer`). Los errores de los manejadores de eventos no los atrapa Svelte: eso lo cubre la validación del punto 2.
  (4) *Sin promesas colgadas en los diálogos.* `guardarConIndicador` (estado/guardado.ts) envuelve el guardado con `try/catch/finally`: si `guardar` rechaza o lanza, el diálogo muestra el error general «No se pudo guardar…» y se desbloquea (código M3). Y el comando de alta de unidad y el de cargar documento reciben el tipo como texto y lo estrechan en el dominio con `esTipoDeUnidad` / `esTipoDocumento` (código M4): un tipo de documento inventado ahora dice «Elija el tipo de documento.» en el campo Tipo, en lugar de «undefined no corresponde…». El campo km solo se reformatea si lo escrito es un entero bien escrito (`reformatearKm` usa `parsearKm`): `84.5` queda como está y la validación lo rechaza (QA M2).
- **Inicio del conductor y parte diario, pantallas (paso 4.5, 18/11/2026, maquetador).** `PantallaConductor` (6.4) y `PantallaParte` (6.5), esta con `ParteFormulario` (edición), `ItemRevision` (un punto del checklist), `SelectorCombustible`, `DialogoAntesDeEnviar` y `ParteEnviado` (el panel, también para el parte en lectura). Enchufadas en `App.svelte`: `#/conductor` y `#/parte/…` (esta con `{#key app.versionDePantalla}`); una dirección desconocida muestra «Página no encontrada» con el camino de vuelta (antes era el marcador «todavía no disponible»). «Cargar parte», la fecha del kilometraje, «Ver el parte completo» y «Ver como Conductor» ya llevaban a estas rutas: no hubo que tocarlos. Decisiones donde la especificación no decía (o decía otra cosa):
  (1) *Secciones con `h2`, no con `legend`:* 6.5 dibuja «1. Kilometraje», «2. Revisión…» como `legend`; son `section` con su `h2` (se navega por encabezados). Los diez puntos y el combustible sí son `fieldset` con `legend`. Las cuatro secciones van sobre una «hoja» de superficie, separadas por una línea.
  (2) *«Enviar parte» es `type="button"`:* ni Enter en un campo ni nada lo dispara por accidente; el formulario no tiene botón de envío implícito. Nunca se deshabilita (5.14).
  (3) *Los errores de «Enviar parte» no desaparecen solos con el tiempo* (9, «Errores»): el mensaje de un campo y su renglón del resumen se quedan mientras el campo tenga lo mismo que cuando se envió, y se van cuando la persona lo toca (si no, «Elija una opción» seguiría sobre un punto ya respondido); el resumen cambia su título al nuevo conteo («Revise 2 datos…») y desaparece cuando no queda nada. Los errores de formato que dice el autoguardado al salir de un campo sí se van cuando el guardado vuelve a andar. Con el diálogo «Antes de enviar» abierto, un error al enviar lo cierra y el foco va al resumen (no al botón que lo abrió).
  (4) *Autoguardado:* cada tecla (`input`) y cada cambio de radio, casilla o lista (`change`) lo programan; salir de un campo guarda ya y actualiza «Recorrido» (un `output` es un `role="status"` implícito: se actualiza solo al salir del campo, no en cada tecla). Antes de enviar, de descartar y al irse de la pantalla se guarda lo pendiente (y al ocultarse la pestaña); un parte que ya salió no se vuelve a guardar. El indicador visible dice `indicador.visible`; el `role="status"` es un `div` oculto con `indicador.anuncio`. Con un borrador recuperado y sin cambios, el indicador muestra «Borrador recuperado, guardado… a las 14:32».
  (5) *«Parte enviado» es estado de la pantalla* (`recienEnviado`): `app.parteDeLaRuta` pasa a «lectura» durante el envío, pero la pantalla se queda en el panel (con el `h1` enfocado y «Volver al inicio») hasta que la persona se va. «Imprimir o guardar en PDF» **no está**: es el paso 6.1 (`@media print`); un botón que no hace nada no se muestra.
  (6) *«Descartar borrador»* solo aparece si ya hay un borrador guardado (`parteId`); después de descartar el foco va al `h1` (el botón ya no existe) y el indicador dice «Borrador descartado.». En el inicio del conductor y en «No se puede cargar este parte» el foco va al título del panel o al `h1`, y la barra de estado (o el `role="status"`) dice lo mismo.
  (7) *Inicio del conductor sin unidad:* el `select` «Elija la unidad» va solo y «Empezar el parte» aparece cuando se elige una (un botón sin destino no se muestra). «Usar otra unidad» abre el `select` con el foco adentro y lo deja abierto aunque la unidad elegida cambie el estado del panel. Con la unidad de hoy fuera de servicio, la primera opción dice «Elija otra unidad».
  (8) *«Continuarlo» / «Cargarlo»:* el nombre accesible es «Cargarlo. ZK 214 BD: no se envió el parte de ayer (17/11/2026).» (empieza con el texto visible, WCAG 2.5.3). Las filas de «Mis últimos partes» muestran la fecha completa (`17/11/2026`) y llevan el nombre por contenido («Parte del 17/11/2026 ZK 214 BD 132 km»): `fechaCorta` y `nombreAccesible` del estado no se usaban y se borraron (con un `aria-label` distinto del texto visible no se cumple 2.5.3).
  (9) *Observación de la lógica (resuelta en la sección 17 el 19/11/2026: el panel «Hoy» mira primero el parte de hoy):* con la unidad ya fuera de servicio por el parte de hoy, el panel «Hoy» muestra el aviso de «No hace falta parte» y no «Enviado a las 18:42» + «Ver el parte» (`hoyEstado` mira primero la unidad). El parte sigue en «Mis últimos partes». Si molesta, el cambio es de `estado/parte.ts` (mirar primero si hay un parte enviado).
  (10) *Diálogo «Antes de enviar»:* el foco inicial es «Volver al parte» (no «Enviar de todos modos»); «Enviar de todos modos» pasa a «Enviando…» si tarda más de 200 ms. Cada aviso lleva su ícono y su tono (`i-vencido` crítico, `i-alerta` semana).
  (11) *Un punto sin responder* (después de intentar enviar) lleva borde izquierdo de 4 px crítico y el mensaje arriba de los segmentos; si ya eligió «Con novedad», el mensaje va sobre la descripción. El enlace del resumen lleva al primer radio o a la descripción, según el caso. Con poco ancho (menos de 22 rem) el selector de combustible pasa a `--t-chico` y no dibuja el ícono del elegido.
  (12) *Barra de envío:* a menos de 40 rem es `sticky` a todo el ancho de la pantalla (margen negativo del medianil) y `html` reserva `scroll-padding-bottom` mientras el formulario está en pantalla (2.4.11); desde 40 rem es estática.
  (13) *Textos de presentación nuevos* en `textos-marco.ts` (`TEXTO_CONDUCTOR_VISTA`, `TEXTO_PARTE_VISTA`, `TEXTO_MARCO.paginaNoEncontrada` e `irA`, `TEXTO_DIALOGO.obligatorios`, `TEXTO_ALERTAS.sinFecha`/`sinProyecto`, `TEXTO_FLOTA_VISTA.sinProyecto`): los revisa `redactor-ux`.
- **Correcciones de presentación de la revisión de la Etapa 4 (18/11/2026, maquetador).** (1) *Texto sin espacios* (QA M1): `overflow-wrap: anywhere` en lo que escribe la persona (motivo y línea de aptitud, marca y modelo, notas de la flota, motivo de la corrección de kilometraje, «Qué pasó», avisos); no se pone en toda la página porque en las tablas con columnas automáticas partiría palabras fijas. (2) *Anuncios* (accesibilidad M1 a M3): `anuncio.svelte.ts` (`textoAnunciado`) vacía y reescribe el texto con 80 ms de retraso en una región que ya existía vacía; lo usan `Panel` (con `repetir`, un valor que cambia con cada mensaje aunque el texto sea el mismo) y `FichaEncabezado` (el mensaje de llegada también entra con retraso). El historial anuncia solo lo que hace la persona (filtro, «Ver más»); su conteo y «Disponibles hoy» pasan a texto simple. (3) *Diálogo* (M4, QA B2, B3, B4, B7): «Seguir editando» devuelve el foco al control donde estaba la persona (si era «Cancelar», al primer campo) y el pie de confirmación es un grupo nombrado por «Tiene cambios sin guardar.»; el cuerpo solo es región (y se puede enfocar) si desborda, con el anillo por dentro; el segundo clic de un doble clic sobre el botón que abre un diálogo no le saca el foco. (4) *Bajas:* orden del DOM de la ficha (kilometraje antes que el historial: también cambió el orden en teléfono), patente-enlace de 44 px, «Cerrar» sin achicarse, línea «Los campos con * son obligatorios.», celdas con «—» con texto para lectores, un `div` por día en el historial (33 regiones → 8 en la ficha). (5) *Código M2 y M7:* `DialogoDocumento` y `DialogoUnidad` son un `DialogoFormulario` más (unas 190 líneas menos, `ResultadoGuardadoDocumento` quedó sin uso); `focoDestino` recibe el resultado del guardado (o `null` si se cerró sin guardar) y `cerrarEn(foco)` cubre «Ver novedades»: no hay banderas sueltas en las pantallas. *No se hizo:* accesibilidad B8 (cambiar `--c-neutro-r` a `#737980` y sumar los pares a `contraste.mjs`: es un token) y QA B1, B3, B4, D1 a D6 (son de lógica o de contenido).
- **Correcciones de presentación de la revisión del paso 4.5 (19/11/2026, maquetador).** (1) *Título de pestaña:* el `h1` de «No se puede cargar este parte», de «No se encontró la unidad» y de «Parte enviado» también es el título de la pestaña (`PantallaParte` lo informa con `bind:titulo`; `App.svelte` le suma el sufijo). (2) *Resumen de errores:* `h2` en las pantallas y `h3` en los diálogos (prop `nivel`). (3) *Obligatorios del parte:* línea «Los campos con * son obligatorios. Los puntos de revisión y el nivel de combustible también.» arriba de la hoja; los diez puntos y el combustible son `fieldset role="radiogroup"` con `aria-required` y, sin responder tras intentar enviar, `aria-invalid` (en un `input type=radio` ARIA no lo admite). (4) *«Confirmar descarte»* no vence por tiempo (WCAG 2.2.1; `diseno-ui.md` 5.1 tampoco lo pedía): se desarma con Esc, al mover el foco, al salir con el mouse y al tocar o hacer clic en otro lado. (5) *«Usar otra unidad»:* elegir una unidad se anuncia en la barra de estado del panel «Hoy»; el `select` solo parte con la unidad de hoy elegida si está entre las opciones (si está fuera de servicio, parte en «Elija otra unidad»). (6) *Diálogo:* el clic que se absorbe tras abrir o cerrar es solo el que cae a menos de 12 px del toque que lo abrió o cerró (un doble clic); un clic en otro lado, aunque sea enseguida, pasa. (7) *«Avisos aceptados»* del parte enviado, del parte en lectura y del historial se escriben en pasado (`textoAdvertenciaAceptada`); el diálogo «Antes de enviar» conserva la invitación. (8) *Historial:* cada «Ver el parte completo» lleva `aria-label` con la fecha y la hora de envío. (9) *Pantalla muy baja* (menos de 30 rem de alto: zoom 400 %, teléfono apaisado): la barra de envío del parte no se pega. (10) *Datos:* el centro de alertas expone `sinVencimiento` y `sinFecha` en cada fila para que la vista no compare el texto «—»; el nombre del conductor en la barra «Ver como» se parte (`overflow-wrap: anywhere`).
- **Correcciones de lógica de la revisión del paso 4.5 (18/11/2026, rama `logica-4-5c`).**
  (1) *Una sola vía de lectura para los partes* (código M1, QA M-1): `datosUtilizables` (arranque, D7) y `actualizar()` pasan todos los partes por `parteLegible` (`partesLegibles` en `persistencia/arranque.ts`); `calcularAlertas`, la flota, el centro de alertas y la ficha ya reciben partes con la forma completa. Lo ilegible queda vacío (`null`, lista vacía, «sin responder»), no se inventa nada. Decisión propia: un registro que `parteLegible` no puede leer como parte (estado o fecha imposibles) cuenta como otro formato (D7: se regenera el ejemplo y se avisa; en `actualizar` falla con «No se pudieron leer los cambios»): descartarlo en silencio dejaría un registro invisible en la base. Se mantiene el requisito de que `checklist` sea un objeto. `parteLegible` deja `kmFin = null` si es menor que `kmInicio` (código B5).
  (2) *Autoguardado* (código M2, accesibilidad N1, QA B7): un `guardar` que rechaza es un error de escritura (indicador en «error», lo escrito sigue pendiente, sin rechazo sin atrapar). Un dato con formato inválido mientras se escribe (el plazo de 500 ms) deja el indicador en «Sin guardar: lo escrito todavía no es válido.» y **no anuncia nada**; recién al salir del campo, al enviar o al irse (acciones de la persona, donde la vista marca el campo) dice «corrija los campos marcados» y lo anuncia.
  (3) *Perfil* (código B9): `autoguardadoDeParte` toma el perfil al abrir el formulario; un guardado en cola después de cambiar de perfil conserva el conductor y el autor de quien escribía (`ejecutarAhora` y `guardarBorradorAhora` reciben el perfil).
  (4) *Sin doble escritura* (código B8): guardar un borrador que ya está igual (solo difiere `actualizado`) no escribe; «Enviar parte» ya no repite la escritura del autoguardado. La vista no cambió.
  (5) *Concordancia* (QA M-2): `textoVencimiento(d, vence, tipo?)`, `clasificar(vence, hoy, tipo?)` y `evaluarObligatorio` dicen «Vencida» para revisión técnica, matafuego, habilitaciones y licencia, y «Vencido» para el seguro (y sin tipo).
  (6) *Mensajes* (QA B9): un kilometraje de más de 20 dígitos dice que supera 2.000.000 km; litros `1.000` o `1,000` (entero de 1 a 3 cifras, separador y tres dígitos) dicen que superan 200; `0,500` y `12,25` siguen hablando de decimales.
  (7) *Descartar* (QA B2): `descartarBorradorDeParte` devuelve también `errores` con el título «No se pudo descartar el borrador».
  (8) *Código muerto* (código B1): se borraron `fechaCorta`, `nombreAccesible`, `conductor` (del inicio), `fechaTexto`, `esHoy`, `borrador.guardadoEl` y `borrador.hora` del estado del parte, y `textoParteReciente`. *Avisos «Avise al encargado»:* no hacía falta cambiarlos: el de aptitud ya se arma con `alConductor` (el encargado no lo ve) y el de la licencia solo está en el inicio del conductor.
- **Búsqueda de prohibidos por huellas (19/11/2026).** `npm run buscar` ya no trae escritos los nombres de terceros que
  busca. `scripts/prohibidos.mjs` (módulo puro, con tests) normaliza el texto (minúsculas, sin acentos), lo parte en
  palabras y compara el SHA-256 de cada candidato contra `scripts/huellas-prohibidas.mjs`: un término de una palabra se
  busca como trozo de cada palabra (encuentra `NombreCentral` o `nombre_id`, como la búsqueda en claro), y una frase de
  dos o tres palabras como n-grama exacto, con cualquier separador. Cada huella guarda la longitud del término para no
  hashear todos los trozos. Los correos personales no tienen huella: los cubre una regla genérica (todo correo que no sea
  de `example.com/.org/.net`, de los TLD reservados `.example`, `.test`, `.invalid`, `.localhost`, ni una dirección
  `noreply`). Quien trabaja en local puede sumar términos en `.prohibidos.local` (uno por línea, `#` comenta; ignorado
  por git y por la propia búsqueda). Límites: se mira línea por línea (una frase partida en dos líneas no se ve) y una
  huella de una palabra corta se puede adivinar con un diccionario: esto evita nombrar, no es cifrado. Los términos de
  los tests son inventados.

---

## 17. Parte previo al uso y licencia que bloquea (19/11/2026, decisión de Matías) — lógica

Origen: crítica de reclutador de la Demo 2 (D1 y D2 de dominio, en el portafolio). Un gerente minero objeta dos cosas: el
checklist era de fin de jornada (la unidad salía de servicio recién al enviar el parte, a la noche, después de usarla
todo el día) y un conductor con la licencia vencida manejaba igual (solo había un aviso aceptable). Matías decidió el
19/11/2026: **el checklist es previo al uso** y **la licencia vencida o faltante bloquea**. Las reglas quedaron en las
tablas de la sección 6 (P3 a P17, K8 a K10, L1 a L7); esta sección es el contrato para programarlas con TDD. La vista
está en `diseno-ui.md` (4.2, 5.7, 6.1, 6.4, 6.5, 7 y 14).

### 17.1 Antes y después

| Tema | Hasta el 19/11/2026 | Ahora |
| --- | --- | --- |
| Envíos del parte | Uno, al final del día, con todo. | Dos: **revisión antes de salir** (`kmInicio`, checklist, "Otra novedad") y **cierre** (`kmFin`, combustible, litros). |
| Novedad crítica | Sacaba la unidad de servicio al enviar el parte (a la noche). | La saca al enviar la revisión, antes de salir; el parte se cierra sin salida (P16). |
| Novedad normal | Se abría al enviar el parte. | Se abre al enviar la revisión (P14). |
| Licencia vencida o faltante | Advertencia aceptable (P9) al enviar. | Bloquea la revisión (L1), sin advertencia aceptable. P9 queda solo para los documentos de la unidad. |
| Estados del parte | `borrador`, `enviado`. | `borrador`, `en-uso`, `enviado` (en pantalla: «Cerrado»), más `sinSalida`. |
| Kilometraje | Contaban los partes enviados. | Cuentan los cerrados y, desde la revisión, el `kmInicio` de los partes en uso (K10). |

### 17.2 Estados del parte

```
 (sin parte) --guardarBorrador--> borrador --enviarRevision (sin crítica)--> en-uso --enviarCierre--> enviado
                                    |  ^                                       |  ^
                                    |  +-- guardarBorrador                     |  +-- guardarCierre (sin evento)
                                    |
                                    +--enviarRevision (con crítica, P16)--> enviado + sinSalida
                                    +--descartarBorrador--> (sin parte)
```

Lo que no está dibujado no existe: no se descarta un parte en uso, no se edita la revisión de un parte en uso, no se
reabre un parte cerrado (P7).

### 17.3 Comandos (contrato para `comandos.ts`)

`enviarParte` se **reemplaza** por `enviarRevision`; se agregan `guardarCierre` y `enviarCierre`. `guardarBorrador` y
`descartarBorrador` siguen, con un rechazo nuevo. Los códigos de error nuevos van entre comillas invertidas; los textos van
a `textos.ts` (lista en `diseno-ui.md`, sección 7).

**`enviarRevision { parteId, advertenciasAceptadas }`**, en este orden (el primero que falla corta):

1. El parte existe (`parte-inexistente`). Si está `en-uso` → `revision-ya-enviada`; si está `enviado` →
   `parte-enviado-inmutable`.
2. P8: unidad activa y en servicio (`unidad-de-baja`, `unidad-fuera-de-servicio`).
3. P2: `validarFechaParte(parte.fecha, ctx.hoy)`.
4. Conductor del parte activo (`buscarConductorActivo`); sin conductor, va con los faltantes del paso 6.
5. **L1:** `estadoDeLicencia(documentos, conductorId, parte.fecha)`; si no es vigente → `licencia-no-vigente`, campo
   `conductorId`, `detalle: { motivo, vence?, desde? }`, mensaje `errLicenciaNoVigente(nombre, fecha, estado)` (en tercera
   persona: el dominio no sabe qué perfil está mirando). Va **antes** de P4 a propósito: es un hecho sobre quién maneja y
   no tiene sentido pedir los diez puntos a alguien que no puede salir.
5 bis. **P18:** `partePendienteDeCierre(partes, unidadId, parte.fecha)`; si la unidad tiene un parte `en-uso` de una fecha anterior → `parte-anterior-sin-cerrar` (sin campo), mensaje `errParteAnteriorSinCerrar(patente, fecha, fechaDeLaRevision)`, `detalle: { parteId, fecha }` del más antiguo. Va después de L1 (si la licencia también bloquea, gana) y antes de los faltantes: mientras no se cierre ese parte la revisión de hoy no puede tener un kilometraje de salida coherente.
5 ter. **P20:** `parteEnUsoDelConductor(estado, conductorId, unidadId)`; si el conductor tiene un parte `en-uso` en otra unidad (que no esté de baja) → `parte-anterior-sin-cerrar`, campo `conductorId`, mensaje `errConductorConParteSinCerrar(nombre, patente, fecha)`, `detalle: { parteId, fecha, unidadId }`.
6. P4 (revisión): `faltantesDeRevision(parte)` → `faltan-datos` con `detalle.faltan`, en el orden del formulario:
   `conductor`, `kmInicio`, los diez ítems, `otraNovedad`.
7. K3 y K4 de la salida: `validarKmDeSalida(...)` → `km-retrocede` (campo `kmInicio`) o `km-supera-siguiente`
   (campo `kmInicio`, mismo texto que hoy).
8. Novedades: `novedadesDelParte(parte)` (P11, sin cambios). `hayCritica` = alguna con gravedad crítica.
9. P9: si **no** `hayCritica`, `documentacionVencidaEn({ fecha, unidad, proyecto, documentos })` (solo la unidad); si
   `hayCritica`, `[]`.
10. Advertencias: `advertenciasDeRevision({ kmAnterior, kmInicio, documentacionVencida })` = K6 + P9. Si falta aceptar
    alguna → `advertencias-sin-aceptar` con `detalle.advertencias` (como hoy).
11. Escritura (una transacción, P12):
    - Sin crítica (P14): `estado: 'en-uso'`, `revisado: ahora`, `enviado: null`, `sinSalida: false`,
      `documentacionVencida`, `advertenciasAceptadas: requeridas`. Los datos de cierre que tuviera el borrador (de
      versiones viejas) se conservan como datos de cierre sin cerrar (K9).
    - Con crítica (P16): `estado: 'enviado'`, `sinSalida: true`, `kmFin: kmInicio`, `combustible: null`,
      `litrosCargados: null`, `revisado = enviado = ahora`, `documentacionVencida: []`, `advertenciasAceptadas:
      requeridas` (solo puede haber K6).
    - En los dos: checklist y "Otra novedad" recortados (U7), `actualizado: ahora`, `autor: ctx.autor`.
    - Eventos, en este orden: `revision-enviada` (`datos: { parteId, fecha, kmInicio, fueraDeTermino, sinSalida,
      advertencias }`, con `fueraDeTermino = diasEntre(fecha, hoy) > 0`), un `novedad-abierta` por novedad y, con
      crítica, el `fuera-de-servicio` de A3 (sin cambios: `efectoDeNovedadCritica`).

**`guardarCierre { parteId, kmFin, combustible, litrosCargados }`** (autoguardado del cierre):

1. Existe; si está en `borrador` → `parte-sin-revision`; si está `enviado` → `parte-enviado-inmutable`.
2. Unidad no dada de baja (`unidad-de-baja`). Fuera de servicio **sí** se acepta (P8).
3. Tipos (P3): `validarKmNumero(kmFin)`, `validarLitros`, combustible conocido. Sin control de fecha (P15).
4. Si los tres valores son iguales a los guardados → `modifica: false` y sin cambios (como B8). Si no, el parte con esos
   tres campos y `actualizado`. Sin eventos.

**`enviarCierre { parteId, advertenciasAceptadas }`:**

1. Existe; `borrador` → `parte-sin-revision`; `enviado` → `parte-enviado-inmutable`.
2. Unidad no dada de baja. Fuera de servicio se acepta. **No** se mira la licencia (L3) ni la fecha (P15).
3. P4 (cierre): `faltantesDeCierre(parte)` → `faltan-datos` (`kmFin`, `combustible`).
4. `validarKmDeCierre(...)`: K2 (`km-fin-menor`), K4 (`km-supera-siguiente`, campo `kmFin`); advertencia K7.
5. Advertencias del cierre sin aceptar → `advertencias-sin-aceptar`.
6. Escritura: `estado: 'enviado'`, `enviado: ahora`, `actualizado: ahora`, `advertenciasAceptadas: [...las de la
   revisión, ...las del cierre]`. `autor` no cambia (es quien envió la revisión); quien cierra queda como autor del
   evento. Evento `parte-enviado` con `datos: { parteId, fecha, kmInicio, kmFin, recorrido, advertencias }` (las del
   cierre). El resumen del evento dice «Parte cerrado» (texto en `RESUMEN_EVENTO`).

**`guardarBorrador`** y **`descartarBorrador`**: además de lo de hoy, un parte `en-uso` → `revision-ya-enviada`. Ninguno
de los dos mira la licencia (L4).

### 17.4 Funciones de dominio que cambian o nacen

Los nombres son orientativos (los fija el programador sin cambiar el significado).

| Archivo | Función | Contrato |
| --- | --- | --- |
| `vencimientos.ts` | `estadoDeLicencia(documentos, conductorId, fecha): EstadoLicencia` | `{ vigente: true; vence }` · `{ vigente: false; motivo: 'faltante' }` · `{ vigente: false; motivo: 'vencida'; vence }` · `{ vigente: false; motivo: 'posterior'; desde }`. Inicio de un documento = `emitido ?? fechaEnArgentina(cargado)` (el mismo criterio que `hayDocumentoQueAmpare`: reutilizarlo). Vigente si alguna licencia tiene `vence ≥ fecha` e `inicio ≤ fecha` (`vence` = la más tardía de esas). Si no: sin licencias → `faltante`; alguna con `vence ≥ fecha` pero `inicio > fecha` → `posterior` (`desde` = el menor de esos inicios); si no → `vencida` (`vence` = la más tardía de todas). **Invariante:** `vigente === hayDocumentoQueAmpare(documentos, conductor, 'licencia', fecha)`. |
| `parte.ts` | `faltantesDeRevision`, `faltantesDeCierre` | Reemplazan a `faltantesParaEnviar` (se borra). Orden del formulario de cada paso. |
| `parte.ts` | `documentacionVencidaEn({ fecha, unidad, proyecto, documentos })` | Sin `conductor`: ya no devuelve `'licencia'` (L1 la cubre). |
| `parte.ts` | `advertenciasDeRevision`, `advertenciasDeCierre` | K6 + P9, y K7. Reemplazan a `advertenciasDeEnvio`. |
| `parte.ts` | `conductorParaParte(perfil, unidad, documentos, fecha)` | P13: perfil Conductor → el del perfil (siempre: el bloqueo se muestra aparte). Perfil Encargado → el asignado solo si su licencia ampara `fecha`; si no, `null`. |
| `parte.ts` | `nuevoBorrador` | Con `revisado: null` y `sinSalida: false`. |
| `parte.ts` | `partePendienteDeCierre(partes, unidadId, fecha?)` | P18: el parte `en-uso` más antiguo de la unidad con fecha anterior a `fecha` (sin `fecha`, el más antiguo de todos); `undefined` si no hay. Lo usan `enviarRevision` (con la fecha del parte), `darDeBaja` (sin fecha), el inicio del conductor y la pantalla del parte. |
| `parte.ts` | `parteEnUsoDelConductor(estado, conductorId, exceptoUnidadId)` | P20: el parte `en-uso` más antiguo del conductor en otra unidad que no esté de baja; `undefined` si no hay. Lo usan `enviarRevision`, el inicio del conductor y la pantalla del parte (perfil Conductor). |
| `parte.ts` | `parteLegible` | Acepta `estado` `'en-uso'`; `revisado` = instante legible o `null`; `sinSalida` = `=== true`. Un parte en uso sin `revisado` legible se sigue leyendo como en uso (no se inventa la hora). |
| `kilometraje.ts` | `RegistroKm` + `{ tipo: 'salida'; fecha; instante; parteId; kmInicio }` | `registrosDeKm` agrega los partes `en-uso` con `kmInicio` y `revisado` legibles (`instante = revisado`). `kmDeRegistro(salida) = kmInicio`. `describirRegistro(salida)` = «revisión del 18/11/2026». Los cerrados siguen como `tipo: 'parte'` (también los sin salida, con recorrido 0). |
| `kilometraje.ts` | `validarKmDeSalida({ unidad, fecha, kmInicio, partes, correcciones })` | K3 contra `registroAnterior`; K4 de la salida: si `registroSiguiente` es `parte` o `salida` y `kmInicio > siguiente.kmInicio` → error. Devuelve `{ kmAnterior, advertencias: K6 }`. |
| `kilometraje.ts` | `validarKmDeCierre({ unidad, fecha, kmInicio, kmFin, partes, correcciones })` | K2; K4 contra el siguiente (`parte` o `salida`); advertencia K7. `validarKilometraje` se borra. |
| `alertas.ts` | `calcularAlertas` | P5 para `borrador` **y** `en-uso` con `fecha < hoy` (la alerta lleva de cuál de los dos es, para el texto y la etiqueta); P17 (en uso o cerrado, `documentacionVencida` no vacía, `!sinSalida`); resumen con `conductoresSinLicencia` (L6): conductores activos con `estadoDeLicencia(…, hoy)` no vigente, ordenados por nombre, cada uno con su motivo y el id de su alerta de vencimiento de licencia (la que abre «Renovar» o «Cargar»). |
| `historial.ts` | tipo de evento `revision-enviada` | Entra en el filtro «Partes», ícono `i-parte`. |
| `tipos.ts` | `Parte`, `TipoEvento`, `Comando` | Secciones 5 y 17.3. |
| `textos.ts` | textos nuevos | `diseno-ui.md`, sección 7 (tabla «Parte previo al uso y licencia»). |

### 17.5 Estado de la aplicación (`src/lib/estado`)

- **`estado/parte.ts`, inicio del conductor (6.4).** `hoyEstado` se decide en este orden (resuelve la observación (9)
  del paso 4.5): (1) sin unidad → `sin-unidad`; (2) hay parte de hoy de esa unidad y está `enviado` → `enviado` (con
  `sinSalida`, el texto de la novedad crítica en lugar de la hora de cierre); (3) está `en-uso` → `en-uso` (primario
  «Cerrar el parte»; la licencia no se mira, L3); (4) unidad fuera de servicio → `fuera-de-servicio` (como hoy); (5) la
  licencia del conductor del perfil no ampara hoy → `licencia-no-vigente` (con `descartar` si hay borrador); (5 bis) la unidad
  tiene un parte anterior en uso, o el conductor uno en otra unidad → `cierre-pendiente` (P18 y P20: `renglon1` «ZK 214 BD: el parte del martes
  17/11/2026 quedó sin cerrar.», `renglon2` «Ciérrelo primero; después podrá empezar la revisión de hoy.», `primario` «Cerrar el parte anterior» hacia el
  cierre de ese parte, y `borrador` con `descartar` si hay uno de hoy); el estado `enviado` de un parte sin salida trae además `hastaManana` (P19); (6) hay borrador → `borrador`; (7) `sin-parte`. Con `licencia-no-vigente`, el panel «Su licencia» es `null` (el aviso ya lo
  dice) y `avisoAptitud` también. «Pendientes» suma el tipo `sin-cerrar` (partes en uso de días anteriores de las
  unidades asignadas o empezados por ese conductor) con la acción «Cerrarlo». «Mis últimos partes» sigue mostrando solo
  los cerrados.
- **`estado/parte.ts`, pantalla del parte (6.5).** Modos: `revision` (sin parte o borrador), `cierre` (en uso, con el
  resumen de la revisión), `lectura` (cerrado), `no-disponible` (P8, P2, unidad de baja y, **con el perfil Conductor, la
  licencia que no ampara la fecha del parte**, con `descartar` si hay borrador; **un parte anterior de la unidad en uso (P18)** o, con el perfil Conductor, **uno suyo en otra unidad (P20)**, con `cerrarAntes` (`renglon1`,
  `renglon2` y el primario «Cerrar el parte anterior»), `nota` «Tiene una revisión empezada para el 18/11/2026: se conserva.» y `descartar` si hay
  borrador (si la licencia también bloquea, gana la licencia); un parte en uso de una unidad de baja también va acá, sin descartar). Resultado recién enviado: `revision-enviada` (puede salir) o `sin-salida`; después del
  cierre, `cerrado`. Con el perfil Encargado y un conductor sin licencia vigente, el formulario se muestra igual y el
  error llega al enviar (en el resumen, primero de la lista, y en el campo Conductor).
- **`dominio/formulario-parte.ts`.** Valores y faltantes por paso (`faltantesDeValores` de la revisión y del cierre).
  Las opciones de conductor llevan `licenciaVigente: boolean` para la fecha del parte (la vista agrega el sufijo).
- **Autoguardado.** En el paso de cierre, `guardarCierre` con el mismo plazo (500 ms) y las mismas reglas de 4.5 (5).
- **`EstadoApp`.** `enviarRevisionDeParte`, `guardarCierreDeParte` y `enviarCierreDeParte` (con la cola y las
  advertencias como hoy). El perfil Conductor puede los cinco comandos del parte (sección 8).
- **`estado/centro-alertas.ts`.** `protagonista.conductores`: filas `{ conductorId, nombre, motivo, unidad: { patente,
  href } | null, accion: { tipo: 'renovar' | 'cargar', alertaId } | null }`, vacía si no hay; frase para lectores «1
  conductor no puede manejar hoy.». La fila de «Operación diaria» y el grupo del detalle de `parte-sin-enviar` cambian de
  texto según sean borradores, partes en uso o ambos (sección 7 de `diseno-ui.md`).
- **`estado/flota.ts` y `estado/ficha.ts`.** Por fila y en el encabezado de la ficha: `conductorSinLicencia: boolean`
  (licencia del conductor asignado para hoy). En la ficha, el historial con paso variable (D2 (b) de la revisión
  visual): `PASO_HISTORIAL_ANGOSTO = 10` y `PASO_HISTORIAL_ANCHO = 30`; la vista dice cuál usa. El kilometraje de la
  ficha lista también el parte en uso («84.452 → en uso»).
- **Diálogo «¿Quién completa el parte?».** Cada conductor con `licenciaVigente` para hoy (sigue siendo elegible: es un
  punto de vista).

### 17.6 Datos de ejemplo y persistencia

- **`versionEsquema` pasa a 2.** Con datos guardados de la versión 1, D7 regenera el ejemplo con su aviso: no se migran
  partes viejos.
- **Generador.** Todo parte pasado cerrado lleva `revisado` (06:00 a 07:29 de Argentina) y `enviado` (18:00 a 19:29 del
  mismo día), y sus dos eventos (`revision-enviada` y `parte-enviado`). C11 pasa a sin salida. C21 es nuevo (9.2). El
  orden de las llamadas al azar cambia: el hash de D1 se actualiza a propósito, con una línea en el registro.
- **`FORMA_DE_ELEMENTO` de los partes** (arranque): `estado` en los tres valores.

### 17.7 Casos borde (decididos)

| Caso | Qué pasa | Regla |
| --- | --- | --- |
| La licencia vence hoy | Vale todo el día: se envía la revisión. | L2, V2 |
| Jornada que cruza la medianoche (revisión a las 22:00 del día F, la licencia vence F; cierre a las 06:00 de F + 1) | El cierre se acepta: no mira la licencia. La revisión pertenece a F. | L3 |
| Revisión enviada a las 00:01 de F + 1 de un parte de F, con licencia que vencía F | Se acepta: es el parte de F y la licencia amparaba F. Queda «fuera de plazo». Límite conocido (sección 14). | L1, L2, P5 |
| Borrador de hoy y la licencia está vencida | El borrador queda; no se envía. El encargado renueva (carga hoy) → se desbloquea en el acto. | L4 |
| Borrador de ayer y la renovación se carga hoy con emisión hoy | Sigue bloqueado: ayer no tenía licencia. Salida: descartarlo. | L4, M1 |
| La renovación se carga con emisión futura | `posterior`: bloquea hasta esa fecha; el texto dice desde cuándo vale. | L5 |
| El conductor del perfil toma un borrador empezado por otro | Se mira **su** licencia (4.5 (3)). | L1 |
| El encargado carga el parte con un conductor sin licencia | Mismo bloqueo; el conductor asignado no se precarga. | L1, P13 |
| Conductor inactivo | No aparece en la lista de L6 ni se puede elegir (como hoy). | L6 |
| Revisión con novedad crítica y seguro vencido | Sin advertencia de P9 ni alerta «Circuló»: la unidad no salió. | P9, P16 |
| La unidad pasa a fuera de servicio (a mano o por una novedad cargada) mientras el parte está en uso | El cierre se acepta. | P8 |
| El conductor tiene un parte en uso en una unidad y quiere empezar la revisión de otra | No se puede (P20): el inicio y la pantalla del parte muestran el aviso «Cerrar antes» con el parte de la otra unidad; con el perfil Encargado el error llega al enviar, en el campo Conductor. | P20 |
| La unidad quedó sin salida (P16), el encargado resuelve la novedad y la devuelve a servicio el mismo día | La unidad no vuelve a salir ese día, en todas las vistas: ficha con «No puede salir» (motivo «Sin salida hasta mañana…») y «Ver el parte», flota y centro de alertas con «No puede salir», inicio con «Aunque el encargado resuelva la novedad hoy, la unidad vuelve a salir recién mañana.». El diálogo de resolver dice «Volver a servicio (sale recién mañana)» y la barra de estado, «…vuelve a servicio, pero no sale hasta mañana.». Al día siguiente vuelve a «Puede salir». | P19, P1 |
| Se intenta dar de baja una unidad con un parte en uso | Se rechaza (`unidad-con-parte-en-uso`): primero se cierra el parte. Un parte en uso de una unidad ya de baja (datos viejos) no se puede cerrar (A7), no alerta y la pantalla dice «No se puede cargar este parte», sin descartar. | A7, P5, P18 |
| La unidad tiene un parte en uso de ayer y se quiere empezar el de hoy | No se puede (P18): el inicio muestra «Antes de empezar la revisión de hoy, cierre el parte del 17/11/2026.» con el botón «Cerrar el parte del 17/11/2026»; la pantalla del parte de hoy dice «No se puede cargar este parte» con el mismo enlace. Un borrador de hoy se conserva y se puede descartar. | P18 |
| Se corrige el kilometraje desde la fecha de un parte en uso | Se rechaza (`km-correccion-parte-en-uso`): primero se cierra. | K5 |
| Parte en uso de hace más de 7 días | Se puede cerrar (P15) y alerta «sin cerrar» mientras exista. | P5, P15 |
| Dos pestañas: una envía la revisión mientras la otra autoguarda el borrador | La otra recibe `revision-ya-enviada` (o el aviso D9 la pone antes en solo lectura). | P7, D9 |

### 17.8 Tests a escribir (TDD: primero el que falla)

Cada nombre lleva el identificador de la regla. Archivos probables entre paréntesis.

*Licencia (`tests/vencimientos-requisitos.test.ts` o uno nuevo, `tests/licencia.test.ts`)*

1. L5: sin licencias → `faltante`.
2. L5: única licencia que vence H − 3, fecha H → `vencida` con `vence` H − 3.
3. L2: vence = fecha → vigente.
4. L5: vieja vencida + renovación con emisión H + 2 → `posterior` desde H + 2; con fecha H + 2 → vigente.
5. L4 y M1: renovación sin emisión cargada hoy → vigente para H, `posterior` para H − 1.
6. Carga a las `2026-11-18T02:59:59.999Z` cuenta como 17/11 (Argentina): ampara el 17.
7. Dos licencias (una vencida y una vigente) → vigente, `vence` = la más tardía.
8. Invariante: en una tabla de 20 combinaciones, `vigente === hayDocumentoQueAmpare(...)`.

*Revisión (`tests/comandos-parte.test.ts`)*

9. P14: revisión completa sin novedades → `en-uso`, `revisado = ahora`, `enviado = null`, un solo evento `revision-enviada`.
10. P4: a la revisión le faltan `kmInicio` y `luces` → `['kmInicio', 'luces']` (no pide `kmFin` ni combustible).
11. L1: licencia vencida → `licencia-no-vigente`, campo `conductorId`, sin cambios ni eventos.
12. L1: licencia vencida **y** faltan datos → gana `licencia-no-vigente`.
13. L1: el mismo bloqueo con autor encargado.
14. L1: parte de H − 4 con licencia vencida en H − 3 → se acepta.
15. L4: `guardarBorrador` y `descartarBorrador` con conductor sin licencia → ok.
16. L4: tras `cargarDocumento` o `renovarDocumento` de la licencia hoy, la revisión de hoy pasa; la de ayer sigue bloqueada.
17. P16: frenos con novedad → `enviado`, `sinSalida`, `kmFin = kmInicio`, combustible y litros `null`, `enviado = revisado`; unidad fuera de servicio; eventos `revision-enviada`, `novedad-abierta`, `fuera-de-servicio` en ese orden; sin `parte-enviado`.
18. P16 + P9: seguro vencido y frenos con novedad → sin advertencia `documentacion-vencida`, `documentacionVencida = []`.
19. P9: seguro vencido sin críticas → advertencia; aceptada → `en-uso` con `['seguro']`.
20. P9: `documentacionVencidaEn` nunca devuelve `'licencia'`.
21. K6 en la revisión: salto de 1 001 → advertencia; 1 000 → nada.
22. K3 en la revisión: inicio menor que el último registro → `km-retrocede`.
23. K10 (K4 de la salida): revisión de una fecha intermedia con inicio mayor que el inicio del siguiente → `km-supera-siguiente` en `kmInicio`.
24. P8 y P2 en la revisión: unidad fuera de servicio; fecha H − 8.
25. P7: `enviarRevision` sobre `en-uso` → `revision-ya-enviada`; sobre `enviado` → `parte-enviado-inmutable`.
26. P5: revisión de H − 1 enviada hoy → `fueraDeTermino: true` en el evento.

*Cierre (`tests/comandos-parte.test.ts`)*

27. `guardarCierre` sobre borrador → `parte-sin-revision`; sobre cerrado → `parte-enviado-inmutable`.
28. K9: `guardarCierre` no cambia `kmActual`.
29. P3: `guardarCierre` con un km que no es entero → error de tipo; sin cambios → `modifica: false`.
30. P15: cierre completo → `enviado`, recorrido en el evento `parte-enviado`, `kmActual = kmFin`.
31. P4: cierre sin nada → `['kmFin', 'combustible']`.
32. K2 y K4 en el cierre (con el siguiente parte en uso).
33. K7: recorrido de 1 201 → advertencia; aceptada → `advertenciasAceptadas` = revisión + cierre.
34. P8: unidad puesta fuera de servicio a mano después de la revisión → el cierre se acepta.
35. A7: unidad de baja → `unidad-de-baja` en `guardarCierre` y en `enviarCierre`.
36. P15: parte en uso de H − 10 → se cierra.
37. L3: el reloj pasa a F + 1 y la licencia vencía F → el cierre se acepta.
38. P7: `guardarBorrador` y `descartarBorrador` sobre `en-uso` → `revision-ya-enviada`.
39. P12: repositorio que falla al escribir eventos en la revisión y en el cierre → nada a medias (`tests/parte-app.test.ts`).

*Kilometraje y alertas (`tests/kilometraje.test.ts`, `tests/alertas.test.ts`)*

40. K8 y K10: un parte en uso es registro (`kmActual` = su `kmInicio`); sin `revisado` legible no cuenta.
41. `describirRegistro` de una salida → «revisión del 18/11/2026».
42. P5: en uso de H − 1 → alerta `parte-sin-enviar` del tipo «sin cerrar»; en uso de H → nada.
43. P6: unidad con parte en uso de ayer → sin alerta `sin-parte`.
44. P17: sin salida con `documentacionVencida` (dato viejo) → sin alerta; en uso con seguro vencido → alerta.
45. L6: `conductoresSinLicencia` del ejemplo = 1 (C21); un inactivo con licencia vencida no cuenta; orden por nombre.

*Generador, arranque y coherencia (`tests/generador.test.ts`, `tests/arranque.test.ts`, `tests/invariantes-historial.test.ts`, `tests/partes-rotos.test.ts`)*

46. D2: los números nuevos del ejemplo (3 vencidos y faltantes, 12 vencimientos, 5 críticas, 1 conductor, protagonista 4).
47. C21: conductor activo con licencia vencida en H − 3 y unidad asignada que puede salir; partes de H − 2 y H − 1 con otro conductor activo y con licencia vigente.
48. C11: el parte de H − 2 está cerrado sin salida, con recorrido 0.
49. Invariante del ejemplo: todo parte cerrado tiene `revisado ≤ enviado` en el mismo día civil, y eventos `revision-enviada` y `parte-enviado` (sin salida: solo el primero).
50. L1 sobre la historia: ningún parte en uso o cerrado del ejemplo tiene un conductor sin licencia que ampare su fecha.
51. D1: el hash nuevo, cambiado a propósito.
52. D7: datos con `versionEsquema: 1` → regenera con aviso.
53. `parteLegible`: `en-uso` se lee; estado desconocido → `null`; `revisado` ilegible → `null`; `sinSalida: "sí"` → `false`.

*Estado (`tests/parte-vista.test.ts`, `tests/centro-alertas-app.test.ts`, `tests/flota.test.ts`, `tests/ficha.test.ts`)*

54. Inicio: el orden de `hoyEstado` (los siete casos de 17.5), incluidos «sin salida con la unidad fuera de servicio» → `enviado` y «licencia vencida con parte en uso» → `en-uso`.
55. Inicio: `licencia-no-vigente` deja `licencia` y `avisoAptitud` en `null`; con borrador ofrece descartar.
56. Pendientes: parte en uso de ayer → `sin-cerrar` con «Cerrarlo» y su nombre accesible.
57. Pantalla del parte: perfil Conductor sin licencia para la fecha → `no-disponible` con el texto de L1 y `descartar` si hay borrador; perfil Encargado → formulario.
58. P13: con el perfil Encargado, el asignado sin licencia no se precarga.
59. Centro de alertas: fila de C21 en `protagonista.conductores` con el `alertaId` de su licencia; texto de la fila de operación con borradores, con partes en uso y con ambos.
60. Flota y ficha: `conductorSinLicencia` de la unidad de C21; historial con paso 10 y 30 («Ver 10 más»).

*Correcciones de la revisión del 22/11/2026 (tests en los mismos archivos)*

61. P18: un parte en uso anterior de la misma unidad bloquea `enviarRevision` (`parte-anterior-sin-cerrar`, el más antiguo si hay varios); no bloquea a otra unidad, ni un parte en uso posterior; va antes de L1; cerrado el anterior, la revisión se envía y el cierre anterior sigue siendo posible con el kilometraje real (`tests/comandos-parte.test.ts`).
62. P18 y P20 en el estado: inicio `cierre-pendiente` (con y sin borrador, el más antiguo, con el orden de 17.5) y pantalla del parte `no-disponible` con el enlace al cierre, para los dos perfiles (`tests/parte-vista.test.ts`); P18 va después de L1; el cierre no mira la licencia; P20 en el comando (`tests/comandos-parte.test.ts`) y en el envío de la aplicación, antes que los faltantes (`tests/parte-app.test.ts`); P19: `hastaManana` en el inicio.
63. K5: una corrección desde la fecha de un parte en uso → `km-correccion-parte-en-uso`; desde una fecha anterior sigue valiendo `km-correccion-anterior` (`tests/comandos-unidades.test.ts`).
64. A7: dar de baja una unidad con un parte en uso → `unidad-con-parte-en-uso` (`tests/comandos-unidades.test.ts`).
65. U7: `limpiarTexto`, `normalizarTexto` y `largoEnCaracteres`; el tope de 500 cuenta caracteres (300 emojis pasan, 501 no) y los textos de novedades, motivos y borradores se guardan sin caracteres de control ni de dirección (`tests/texto.test.ts`).
66. D1 de la revisión de diseño: el resumen de errores agrupa los puntos sin completar (más de 3 → un solo enlace «Faltan 10 puntos de la revisión» al primero; 3 o menos, uno por punto) y `agruparResumen` se puede volver a aplicar a lo que sigue vigente; C5: la barra dice «Revise N datos» con un error de reglas vigente del último intento (`tests/formulario-parte.test.ts`).
67. C1 (S1): `PanelParteEnviado.conDocumentacionVencida` y la línea «Sale con documentación vencida: quedó registrado.» (con y sin fuera de plazo); C6: un renglón por documento en el aviso y en «Avisos aceptados», con la fecha en que venció o «Falta cargar» (`contextoDeDocumentacion`, `tests/textos.test.ts`, `tests/parte.test.ts`, `tests/parte-vista.test.ts`, `tests/parte-app.test.ts`).
68. C2: la fecha de «Último parte» de la flota es la del parte que nombra la etiqueta (`tests/flota.test.ts`).
69. M2 y B2: toda fila de «Conductores que no pueden manejar hoy» trae su acción completa (renovar, cargar o corregir una emisión futura); corregida la emisión, la fila desaparece (`tests/centro-alertas.test.ts`).
70. C16: el primer botón de la ficha según el parte (cargar, cerrar, cerrar el anterior, ver; sin salida hasta mañana) (`tests/ficha.test.ts`); P19: `hastaManana` en el inicio (`tests/parte-vista.test.ts`).
71. C13 y B5: `textoOpcionDeConductor` y la licencia de las opciones evaluada con fecha y documentos juntos; B1: `parteLegible` con un cierre de kilometraje final menor que el inicial (`tests/textos.test.ts`, `tests/parte-vista.test.ts`, `tests/parte.test.ts`).

### 17.9 Tareas del programador (en orden)

1. Tipos y textos: `Parte` (`en-uso`, `revisado`, `sinSalida`), `TipoEvento` (`revision-enviada`), `Comando` (`enviarRevision`, `guardarCierre`, `enviarCierre`) y los textos de `diseno-ui.md`, sección 7 — `src/lib/dominio/tipos.ts`, `src/lib/dominio/textos.ts`.
2. `estadoDeLicencia` con sus tests (1 a 8) — `src/lib/dominio/vencimientos.ts`.
3. Kilometraje con salidas (40, 41 y los de K de la revisión y del cierre) — `src/lib/dominio/kilometraje.ts`.
4. `parte.ts`: faltantes y advertencias por paso, `documentacionVencidaEn` sin licencia, `conductorParaParte`, `nuevoBorrador`, `parteLegible` (10, 20, 53, 58) — `src/lib/dominio/parte.ts`.
5. Comandos `enviarRevision`, `guardarCierre`, `enviarCierre` y los rechazos nuevos (9 a 39) — `src/lib/dominio/comandos.ts`; reescribir los tests de `enviarParte` con el comando que corresponda.
6. Alertas P5, P6, P17 y `conductoresSinLicencia` (42 a 45) — `src/lib/dominio/alertas.ts`; historial — `src/lib/dominio/historial.ts`.
7. Generador (C11, C21, revisiones y eventos), `versionEsquema` 2 y forma de los partes en el arranque (46 a 53) — `src/lib/datos/generador.ts`, `src/lib/persistencia/arranque.ts`.
8. Estado: inicio del conductor, pantalla del parte por modos, formulario y autoguardado por paso, `EstadoApp`, centro de alertas, flota y ficha (54 a 60) — `src/lib/estado/parte.ts`, `src/lib/dominio/formulario-parte.ts`, `src/lib/dominio/formulario.ts`, `src/lib/estado/autoguardado.ts`, `src/lib/estado/app.svelte.ts`, `src/lib/estado/centro-alertas.ts`, `src/lib/estado/flota.ts`, `src/lib/estado/ficha.ts`.
9. Tipos de las props nuevas para el maquetador — `src/componentes/tipos.ts` (lo escribe el programador primero; sección 11 de `diseno-ui.md`).
10. Verificación: `npm run check`, `npm test`, `npm run test:tz`, `npm run buscar`; las invariantes de A3 y de L1 sobre el ejemplo después de cada comando.

### 17.10 Preguntas para Matías (resueltas el 22/11/2026)

Matías aceptó las cuatro recomendaciones de Q1, Q2, Q4 y Q5 el 22/11/2026. Q3 queda para una tanda aparte.

| # | Pregunta | Recomendación (aceptada salvo Q3) |
| --- | --- | --- |
| Q1 | ¿El cierre tiene un campo «¿Pasó algo durante el uso?» (una falla a mitad de la jornada que, con «Impide usar», saque la unidad de servicio al cerrar)? | No por ahora: es un campo y un origen de novedad más. Una falla en ruta se avisa y el encargado la carga con «Cargar novedad» (N3). Queda como límite (sección 14). |
| Q2 | ¿La documentación vencida **de la unidad** también bloquea la revisión, como la licencia? | No, por ahora: la unidad «No puede salir» ya lo dice en las dos vistas, y P9 deja el registro «Circuló con documentación vencida», que es lo que el encargado usa para pedir explicaciones. Si un gerente lo objeta, es cambiar P9 por un bloqueo igual a L1. |
| Q3 | ¿La habilitación de manejo del proyecto pasa a obligatoria cuando el proyecto exige habilitación de ingreso (la otra mitad de la crítica D2)? | Sí, en una tanda aparte: misma lógica que V13 y que L1, con su caso plantado. No entró en esta decisión. |
| Q4 | C21 cambia los números del ejemplo (3 vencidos y faltantes, 12 vencimientos, 5 alertas críticas). ¿Se acepta? | Sí: sin un caso plantado el bloqueo no se ve en la demo. Hay que actualizar el README y la ficha de la web que citan «2 vencidos» y «4 + 3 + 2». |
| Q5 | Un parte de un día pasado, con la licencia vencida ese día: ¿se bloquea (lo elegido) o se registra con aviso (como antes)? | Bloquear: una sola regla, fácil de explicar («sin licencia no se envía la revisión»). La falta queda a la vista igual, como «Sin parte de ayer» o «Parte sin enviar». |

### 17.11 Decisiones de implementación (22/11/2026, programador)

Respuestas a las preguntas: Q1 no (el cierre no tiene campo de novedad), Q2 no (la documentación de la unidad sigue siendo una advertencia, P9), Q3 fuera de esta tanda, Q4 sí
(los números nuevos del ejemplo) y Q5 bloquear. Lo que la especificación no dice y se resolvió con lo más simple:

- **Datos de cierre de un borrador (K9).** `enviarRevision` conserva `kmFin`, `combustible` y `litrosCargados` que traiga el borrador (de una versión vieja); al formulario del
  cierre llegan como valores iniciales. El formulario de la revisión no los muestra y sus errores de formato no bloquean la revisión (`convertir` filtra por paso).
- **Ejemplo (C21).** La unidad es la Int. 16 (`rol c21`), asignada al último conductor; C14 pasó a las unidades Int. 17 y Int. 20. En H - 2 y H - 1 firma el primer conductor
  (relevo) y, para que ningún otro parte tenga un conductor sin licencia, un conductor elegido al azar que resulte ser el de C21 se cambia por el primero en esos días. Se agregó un
  sorteo por parte (el minuto de la revisión): cambió el hash de D1 (`43e7d988`) y los kilometrajes del ejemplo (ZYN 469 termina el 17/11 en 141.711 km).
- **`Alerta.etapaParte`.** `parte-sin-enviar` lleva `"borrador" | "en-uso"` (para «sin enviar» / «sin cerrar»); las demás, `null`. `ResumenAlertas.conductoresSinLicencia` trae
  `{ conductorId, nombre, motivo: EstadoLicencia, alertaId }`; `alertaId` es `null` si no hay alerta de vencimiento de esa licencia (por ejemplo, una licencia nueva que todavía no vale).
- **Resúmenes de los eventos.** El `resumen` guardado es el del dominio («Revisión del 18/11/2026 de ZK 214 BD enviada: sale con 84.320 km»); la ficha arma el texto de la sección 7 de
  `diseno-ui.md` («Revisión antes de salir · 84.320 km · sin novedades») con el parte, y si no lo encuentra usa el guardado.
- **Un solo panel de resultado.** `PanelParteEnviado` sirve para C1, C2 y C3 (y la lectura) con un campo `variante`; `ResultadoDeEnvio` mantiene `tipo: "enviado"` y suma `paso`
  (`revision-enviada`, `sin-salida`, `cerrado`). Así la vista que ya existía sigue funcionando mientras se maqueta el resto.
- **Orden de errores del envío (app).** Como en el comando, la licencia (L1) va antes que los faltantes: la aplicación guarda el borrador, intenta enviar y, si falla por licencia, ese es
  el único error; si no, se muestran los faltantes juntos. L1 va al campo Conductor (`conductorId` → `conductor`).
- **Inicio del conductor.** `avisoAptitud` solo se calcula en los estados `borrador` y `sin-parte`; «Su licencia» es `null` en `licencia-no-vigente`. Un parte cerrado sin salida trae
  `sinSalida` (el texto del aviso crítico) además de `etiqueta`.
- **Historial de la ficha.** `vistaDeHistorial(h, filtro, limite, paso = PASO_HISTORIAL_ANCHO)`; `PASO_HISTORIAL_ANGOSTO = 10` y `PASO_HISTORIAL_ANCHO = 30`. `PASO_HISTORIAL` queda como
  alias del ancho hasta que la vista deje de importarlo. El kilometraje de la ficha suma filas `tipo: "salida"` («84.452 → en uso»).
- **`parteLegible`.** Un `revisado` ilegible queda `null` y el parte en uso se sigue leyendo como en uso; `sinSalida` solo vale con `true`. En el arranque, `FORMA_DE_ELEMENTO` de los
  partes pide `estado` en los tres valores.

### 17.12 Decisiones de la revisión del 22/11/2026 (programador, segunda tanda)

Después de las cuatro revisiones de la etapa 6 (código, QA, diseño y accesibilidad) y de las decisiones de Matías del 22/11/2026:

- **«Cerrar antes» (P18) y un conductor, un parte en uso (P20).** Las dos usan el mismo código, `parte-anterior-sin-cerrar`, y las mismas funciones de dominio
  (`partePendienteDeCierre`, `parteEnUsoDelConductor`). Orden del comando: P8, P2, conductor activo, **L1**, P18, P20, faltantes (P4). La licencia gana sobre el aviso
  «Cerrar antes» (en el comando, en el inicio y en la pantalla del parte) y el cierre no la mira (L3). Un borrador anterior no bloquea; una unidad de baja no cuenta para P20 (su
  parte no se puede cerrar, A7). Con el perfil Encargado P20 solo se ve al enviar (el conductor se elige en el formulario): error en el campo Conductor y antes de los faltantes.
- **M1 del código: una corrección desde la fecha de un parte en uso se rechaza** (`km-correccion-parte-en-uso`, K5); desde una fecha anterior sigue el rechazo de M3. **Baja con un
  parte en uso: rechazada** (`unidad-con-parte-en-uso`, A7).
- **P19, sin salida hasta mañana.** Es una regla, no un límite. El comando no cambia (P1 ya impide un segundo parte de la unidad ese día); lo nuevo es lo que se ofrece: la ficha
  dice «Ver el parte» y el inicio del conductor trae `hastaManana`. Cambio del 22/11/2026 (QA D1): la aptitud **sí** lo refleja. `parteSinSalidaDeHoy(partes, unidadId, hoy)` (`dominio/parte.ts`) es el único lugar que decide P19; `aptitud` lo lee (motivo `sin-salida-hoy`, categoría «No puede salir») y con ella la ficha, la flota y el centro de alertas; el inicio del conductor (`hastaManana`) y los diálogos de resolver y de volver a servicio lo leen de la misma función. Una novedad crítica cargada a mano y reparada el mismo día no entra: no hay un parte sin salida (QA D2, decide Matías).
- **M2 del QA (licencia con emisión futura): no se rechaza al cargarla.** La especificación de documentos la permite (L5, 17.7) y es el caso de un cambio de día o de una licencia
  que empieza a valer más tarde. La salida es que la fila del conductor siempre traiga una acción: «Corregir» (el diálogo de corregir de la ficha, sobre la licencia vigente) cuando la
  licencia vale desde una fecha futura; «Renovar» o «Cargar» en los otros dos motivos. `FilaDeConductorSinLicencia.accion` ya no es `null` ni lleva `alertaId`: es una `AccionDeDocumento` completa
  (o la variante «Corregir»).
- **D1: el resumen de errores agrupa los puntos sin completar.** Más de 3 → un solo enlace «Faltan N puntos de la revisión» al primero; la vista lo arma con `agruparResumen(lista)` y lo vuelve a armar con
  lo que sigue vigente (`ErroresDeParte` ya no trae un `resumen` aparte: era la misma agrupación dos veces). El mensaje sobre cada campo no cambia.
- **C5: la barra de envío.** `barraDeEnvio(valores, paso, camposDelIntento)`: con un error de reglas vigente del último intento dice «Revise N datos» y no «Listo».
- **C1 y C6.** `PanelParteEnviado.conDocumentacionVencida` (la especificación lo llama `conAvisos`: se eligió el nombre exacto porque K6 también es un aviso). Los avisos de documentación
  se escriben con `contextoDeDocumentacion(documentos, unidad, fecha)`: la fecha en que venció cada documento **como estaba el día del parte** (M1), no según el vigente de hoy. Los
  textos son los de la especificación visual (`diseno-ui.md`, sección 7), con «de todos modos» y el artículo del documento («El seguro de ZK 214 BD venció…», «Falta cargar la revisión técnica…»).
- **C2.** La fecha de «Último parte» es la del parte que nombra la etiqueta: el más reciente de su clase. Con una etiqueta de partes sin enviar y otra de sin cerrar a la vez, vale la de «Sin enviar».
- **C13 y B5.** `opcionesDeConductor` recibe `licencia: { fecha, documentos }` (los dos juntos); en el parte, cada opción trae `textoDeOpcion` («{Nombre} (sin licencia vigente) · {P}»).
- **U7.** `limpiarTexto` saca por categoría Unicode los de control (`Cc`) y los de formato (`Cf`), salvo tabulación, saltos de línea y U+200D. Un emoji compuesto se conserva; las marcas de
  dirección de un solo carácter (U+200E, U+200F), el espacio de ancho cero (U+200B) y el BOM (U+FEFF) se pierden. También se pierden las etiquetas de bandera de región (`Cf`, U+E0020 a U+E007F).
- **B1.** Un cierre con el kilometraje final menor que el inicial sigue sin leerse (`kmFin` queda `null`): es deliberado, para no dibujar un recorrido negativo; ahora hay un test que lo fija.
  **B3.** Sin casts en la revisión y el cierre; `advertenciasDeCierre` se borra (sus tests ya estaban en `advertenciasDeRecorrido`). **B4, B6 y B7: sin cambios** (B7 es un límite declarado en el README).
