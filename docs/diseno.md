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
| **Conductor** | Celular, a veces con mala señal y con guantes | Completar el parte en dos o tres minutos, en dos momentos del día, sin perder lo escrito. | Parte diario de su unidad: kilometraje, revisión (checklist), combustible y novedades. Ve sus últimos partes y el vencimiento de su licencia. |

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
| Parte diario | Registro de una unidad en una fecha: kilometraje al iniciar y al terminar, revisión (checklist), combustible y novedades. Uno por unidad y por fecha. |
| Borrador | Parte guardado sin enviar. Se guarda solo mientras se escribe. |
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
  estado: 'borrador' | 'enviado';
  kmInicio: number | null;
  kmFin: number | null;
  combustible: NivelCombustible | null;
  litrosCargados: number | null;  // null = no cargó
  checklist: Record<ItemChecklist, RespuestaItem>;
  otraNovedad: { descripcion: string; impideUso: boolean } | null;
  advertenciasAceptadas: Advertencia[];      // K6, K7, P9
  documentacionVencida: TipoDocumento[];     // calculado al enviar (P9)
  creado: Instante; actualizado: Instante; enviado: Instante | null;
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
  versionEsquema: number;         // 1
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
| Conductor | `licencia` | Licencia de conducir | Sí |
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

"Crítico" significa: una novedad en ese punto deja la unidad fuera de servicio (A3). En los no críticos, el conductor
puede marcar "Impide usar la unidad" y el efecto es el mismo.

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
| A1 | **Puede salir** = estado `en-servicio` ∧ ningún documento obligatorio de la unidad vencido o faltante a hoy ∧ ninguna novedad crítica abierta. Si no, **No puede salir** con la lista de motivos. Aptitud se calcula, no se guarda. | Unidad en servicio con seguro vencido → "No puede salir" con motivo "Seguro vencido hace 3 días". |
| A2 | Un documento que vence hoy no impide salir. | vence = H → "Puede salir" (y alerta "Vence hoy"). |
| A3 | Al enviar un parte con una **novedad crítica** (ítem crítico con novedad o cualquier novedad con "Impide usar la unidad"), la unidad pasa a `fuera-de-servicio` con origen `novedad-critica`, motivo "Novedad crítica en el parte del 18/11/2026: Frenos" y los ids de las novedades. Invariante: nunca hay una unidad `en-servicio` con una novedad crítica abierta. | Parte con frenos "con novedad" → unidad fuera de servicio; eventos `parte-enviado`, `novedad-abierta`, `fuera-de-servicio`. Test de invariante sobre el ejemplo completo y después de cada comando. |
| A4 | "Volver a servicio" se rechaza si hay novedades críticas abiertas, y el error las nombra. | Error: "Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026)." |
| A5 | Volver a servicio con documentos vencidos **se permite** (el estado no es la aptitud): la unidad queda en servicio y "No puede salir". | Volver a servicio con seguro vencido → estado `en-servicio`, aptitud "No puede salir". |
| A6 | Poner fuera de servicio a mano exige motivo (5 a 200 caracteres). Una unidad ya fuera de servicio no se vuelve a poner (error). | Motivo vacío → "Escriba el motivo (por ejemplo, «En taller: cambio de embrague»)." |
| A7 | Dar de baja exige motivo; es **irreversible** en la demo; conserva documentos, partes e historial; la unidad sale de la flota activa, de las alertas y de los totales. No se aceptan partes de una unidad de baja. | Baja → no aparece en "Pueden salir"/"No pueden salir"; su ficha muestra "Dada de baja el 18/11/2026: motivo". |
| A8 | **Protagonista del centro de alertas** = cantidad de unidades activas (no de baja) que hoy "no pueden salir" o están "fuera de servicio". "Disponibles: P de T" con T = activas y P = las que pueden salir. | Ejemplo: 23 activas, 2 no pueden salir, 2 fuera de servicio → "4 unidades" y "Disponibles: 19 de 23". |

### 6.4 Parte diario (P)

| ID | Regla | Caso de test |
| --- | --- | --- |
| P1 | Un parte por unidad y por fecha (borrador o enviado). Índice único `[unidadId, fecha]`. | Segundo parte de ZK 214 BD para H → error "Ya hay un parte de ZK 214 BD para el 18/11/2026 (borrador). Ábralo para continuar." con enlace. |
| P2 | Fecha del parte: no futura y no anterior a `hoy − 7`. | H → ok · H − 7 → ok · H − 8 → error "Solo se pueden cargar partes de los últimos 7 días." · H + 1 → error "La fecha no puede ser posterior a hoy." |
| P3 | **Parte incompleto = borrador.** Se guarda solo (500 ms después de la última tecla y al salir del campo) con cualquier subconjunto de datos; solo se valida el tipo de cada campo (un km con letras no se guarda y se avisa en el campo). El borrador no cambia el kilometraje de la unidad ni abre novedades. | Borrador con solo `kmInicio` → se guarda; `kmActual` de la unidad no cambia (K9); ninguna novedad nueva. |
| P4 | **Enviar** exige: conductor, `kmInicio`, `kmFin`, `combustible`, los 10 ítems respondidos y una descripción de 3 a 500 caracteres (sin contar espacios de los extremos) en cada ítem "con novedad" y en "Otra novedad" si se marcó. Si falta algo, no se envía: se listan los faltantes **en el orden del formulario**. | Falta `kmFin`, `combustible` y el ítem `luces` → resultado `{ faltan: ['kmFin', 'luces', 'combustible'] }`, texto "Faltan 3 datos". |
| P5 | Un borrador con fecha **anterior a hoy** genera la alerta de operación "Parte sin enviar" (unidad, fecha, quién lo empezó). Se puede completar y enviar mientras cumpla P2; queda marcado "Enviado fuera de término" si se envía después de su fecha. | Borrador de H − 1 → alerta; enviado hoy → evento con "fuera de término". |
| P6 | Una unidad `en-servicio`, creada antes de ayer, **sin parte de ayer** (ni enviado ni borrador) genera la alerta "Sin parte de ayer". Si hay borrador de ayer, solo vale P5 (no se duplica). Fuera de servicio y bajas no generan esta alerta. | Unidad en servicio sin parte de H − 1 → alerta · con borrador de H − 1 → solo "Parte sin enviar" · unidad en taller → nada. |
| P7 | Un parte **enviado es inmutable** (para todos los perfiles). Los errores de kilometraje se corrigen con una corrección de kilometraje (K5); las novedades, resolviéndolas. | `editarParte(enviado)` → error "Un parte enviado no se puede modificar." |
| P8 | No se aceptan partes de unidades fuera de servicio ni de baja. (Ver decisión D3.) | Unidad fuera de servicio → error "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la vuelva a servicio." |
| P9 | Si en la fecha del parte la unidad tenía un documento obligatorio vencido o faltante, o el conductor tenía la licencia vencida o faltante, el parte **se puede enviar** (registra lo que pasó), con advertencia previa que hay que aceptar. Queda `documentacionVencida` y la alerta de operación "Circuló con documentación vencida" durante 30 días desde la fecha del parte. | Parte de H con seguro vencido → advertencia; aceptada → enviado con `documentacionVencida: ['seguro']` y alerta crítica. A H + 31 la alerta ya no está. |
| P10 | Litros cargados: vacío = no cargó; si no, número mayor que 0 y hasta 200, con hasta 1 decimal (coma o punto). | `0` → error "Si no cargó combustible, deje el campo vacío." · `45,5` → 45.5 · `250` → error · `12,25` → error. |
| P11 | Novedad en ítem crítico → novedad `critica`. En ítem no crítico → `normal`, salvo "Impide usar la unidad" → `critica`. "Otra novedad" igual. | `niveles` con novedad sin marcar → normal · con marca → crítica → A3. |
| P12 | El envío es **atómico**: parte, novedades, cambio de estado y eventos se escriben en una sola transacción. Si falla, no queda nada a medias y el borrador sigue intacto. | Repositorio de prueba que falla al escribir eventos → ni parte enviado ni novedades; borrador igual al anterior; error "No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo." |
| P13 | Al empezar un parte, `kmInicio` se completa con el kilometraje actual de la unidad (K8) y el conductor con el perfil elegido o el asignado (no se pide dos veces lo que ya se sabe; WCAG 3.3.7). | Unidad con km actual 84 320 → borrador nuevo con `kmInicio = 84320`. |

### 6.5 Kilometraje (K)

| ID | Regla | Caso de test |
| --- | --- | --- |
| K1 | Kilometraje: entero de 0 a 2 000 000. Acepta `84320`, `84.320` y `84 320`; rechaza decimales, negativos y letras. | `84.320` → 84320 · `84,3` → error "Escriba el kilometraje sin decimales." · `-5` → error · `2.000.001` → error. |
| K2 | `kmFin ≥ kmInicio`. Igual es válido (recorrido 0: "Sin uso"). | 84 320 → 84 319 → error "El kilometraje al terminar (84.319) es menor que al iniciar (84.320)." · 84 320 → 84 320 → ok, "Sin uso". |
| K3 | **El kilometraje no retrocede:** `kmInicio ≥` el `kmFin` del último parte enviado de fecha anterior (o el `kmBase` de una corrección posterior a ese parte). Si no, error que bloquea el envío (el borrador queda). | Último parte enviado del 17/11 terminó en 84 320; parte del 18/11 con inicio 84 319 → error "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, avise al encargado." |
| K4 | Partes fuera de orden: un parte de una fecha intermedia tiene que quedar entre sus vecinos: `kmFin ≤ kmInicio` del siguiente parte enviado. | Partes enviados del 15 (fin 80 000) y del 17 (inicio 80 500); se carga el del 16 con fin 80 600 → error "Supera el kilometraje con que empezó el parte del 17/11/2026 (80.500)." |
| K5 | **Corrección de kilometraje** (solo encargado, motivo de 10 a 200 caracteres): fija `kmBase` desde una fecha. K3 y K4 comparan solo con registros posteriores a la corrección. | Corrección a 120 km desde H − 2 (tablero nuevo) tras 84 320 → parte de H − 1 con inicio 130 → ok. |
| K6 | **Salto:** `kmInicio − kmAnterior > 1 000` → advertencia (no bloquea), que hay que aceptar al enviar. Se guarda en `advertenciasAceptadas` y se ve en el historial ("1.250 km sin registrar"). | Diferencia 1 001 → advertencia · 1 000 → nada. |
| K7 | **Recorrido del día > 1 200 km** → advertencia que hay que aceptar. | 1 201 → advertencia · 1 200 → nada. |
| K8 | `kmActual(unidad)` = `kmFin` del último parte enviado (por fecha y, a igual fecha, por instante de envío), o el `kmBase` de la corrección más reciente si es posterior. Sin datos: `null` ("Sin registros"). | Parte del 17 (84 320) y corrección del 18 (120) → 120. |
| K9 | Los borradores no cuentan para K3, K4 ni K8. | Borrador del 18 con fin 99 999 → `kmActual` sigue en 84 320. |

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
| U7 | Textos libres: se recortan los espacios de los extremos; topes de largo (motivos 200, novedades 500, número de documento 40, emisor 80). Nunca se insertan como HTML. | Novedad de 501 caracteres → error con el tope. `<b>x</b>` se muestra literal. |

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
| D5 | **Fechas del ejemplo al día:** si `fechaBase < hoy` y `modificada = false`, se regenera en silencio con `fechaBase = hoy` (los casos plantados siguen a la misma distancia de hoy). Si `modificada = true`, se conservan los datos y se muestra el aviso "Los datos de ejemplo son del 10/11/2026. Reinicie la demo para verlos con las fechas de hoy." con botón "Reiniciar demo". | Ambos caminos. |
| D6 | **Reiniciar demo**: borra todo, regenera con `fechaBase = hoy`, `modificada = false`. Se conserva el perfil elegido (es de la persona, no de los datos). Confirmación previa. | Después de reiniciar, el ejemplo es igual al de una primera visita del mismo día y el perfil no cambió. |
| D7 | Versión de esquema guardada ≠ actual → reinicio automático con aviso "La demo se actualizó y se volvió a cargar la flota de ejemplo." | Meta con `versionEsquema: 0` → reinicio y aviso. |
| D8 | IndexedDB no disponible o falla al abrir → **modo en memoria**: la demo funciona y un aviso fijo dice "Este navegador no permite guardar datos: puede usar la demo, pero los cambios se pierden al cerrar la pestaña." | Fábrica de IndexedDB que lanza → arranca con el repositorio en memoria y el aviso. |
| D9 | Otra pestaña cambió los datos (`BroadcastChannel('control-flota')`) → aviso "Hubo cambios en otra pestaña." con botón "Actualizar"; no se recarga sola (se perdería lo que se está escribiendo). | Canal de prueba que emite → aviso visible; los datos de esta pestaña no cambian hasta "Actualizar". |
| D10 | Error al escribir (cuota, transacción abortada) → no se aplica nada, el formulario conserva lo escrito y el mensaje lo dice. Nunca un error que desaparece solo. | Repositorio que falla → estado igual al anterior y mensaje. |
| D11 | `meta.modificada` pasa a `true` con el primer comando del visitante (no con el autoguardado de un borrador vacío ni con cambiar de perfil). | Abrir y cerrar el parte sin escribir → sigue `false`. |

---

## 7. Alertas (cálculo)

`calcularAlertas(estado, hoy)` es una función pura. Una alerta no se guarda: se recalcula con cada cambio.

| Categoría | Tipo | Gravedad | Texto (ejemplo) | Regla |
| --- | --- | --- | --- | --- |
| Vencimientos | `documento-faltante` | crítica | "Falta cargar · Habilitación de ingreso al proyecto" | V12 |
| Vencimientos | `documento-vencido` | crítica | "Vencido hace 3 días · Seguro" | V1 |
| Vencimientos | `documento-por-vencer` | según grupo | "Vence en 6 días · Revisión técnica" | V2–V5 |
| Operación | `novedad-critica` | crítica | "Frenos: ruido al frenar en bajada (parte del 16/11/2026)" | A3, N5 |
| Operación | `uso-con-documentacion-vencida` | crítica | "Circuló con el seguro vencido (parte del 12/11/2026)" | P9 |
| Operación | `parte-sin-enviar` | media | "Parte del 17/11/2026 sin enviar (empezado por L. Ferreyra)" | P5 |
| Operación | `sin-parte` | media | "Sin parte de ayer (17/11/2026)" | P6 |
| Operación | `novedad-abierta` | media | "Luz de patente quemada · abierta hace 9 días" | N5 |

Resumen que devuelve junto con la lista: `{ noPuedenSalir: Unidad[], fueraDeServicio: Unidad[], disponibles, activas,
porGrupo: { vencidos, '7', '15', '30' }, operacion: Record<tipo, n> }`, más los puntos de la regla de vencimientos
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
| `enviarParte` | Ambos | `parte-enviado` + un `novedad-abierta` por novedad + `fuera-de-servicio` si hubo crítica (A3) |
| `descartarBorrador` | Ambos | ninguno |
| `cargarNovedad` | Encargado | `novedad-abierta` (+ `fuera-de-servicio` si es crítica) |
| `resolverNovedad` | Encargado | `novedad-resuelta` (+ `vuelta-a-servicio` si N2 marcado) |
| `ponerFueraDeServicio` | Encargado | `fuera-de-servicio` |
| `volverAServicio` | Encargado | `vuelta-a-servicio` |
| `corregirKilometraje` | Encargado | `km-corregido` |
| `darDeBaja` | Encargado | `unidad-baja` |

El perfil "Conductor" solo puede usar `guardarBorrador`, `enviarParte` y `descartarBorrador` sobre unidades en servicio.
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
  Se rotulan "(ficticio)" en la ficha de persona y en el pie.
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
| C11 | Unidad fuera de servicio por novedad crítica de frenos (parte de H − 2). | A3, A4 |
| C12 | Unidad fuera de servicio a mano: "En taller: cambio de embrague", desde H − 5, con su revisión técnica a H + 5. | A6, V15 |
| C13 | Borrador de parte de H − 1 sin enviar. | P5 |
| C14 | Dos unidades en servicio sin parte de H − 1. | P6 |
| C15 | Parte de H − 4 con salto de 1 250 km aceptado. | K6 |
| C16 | Unidad dada de baja con el seguro vencido (no alerta). | V14, A7 |
| C17 | Licencia de un conductor que vence en H + 12. | V4 (conductor) |
| C18 | Revisión técnica que venció en H − 7; parte de H − 6 enviado con la advertencia aceptada; renovada ese mismo día, después del parte. | P9, V9 |
| C19 | Novedad normal abierta en H − 9 ("Luz de patente quemada"). | N5 |
| C20 | Corrección de kilometraje en H − 20 (cambio de tablero). | K5, K8 |

Relleno: 24 unidades (14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses, 1 de baja), 16 conductores,
partes enviados de H − 45 a H − 1 para las unidades en servicio (recorrido diario de 40 a 260 km, nivel de combustible
coherente, alguna carga), novedades normales ya resueltas en el pasado (para que el historial tenga vida), documentos
aleatorios con vencimientos entre H + 31 y H + 400. Las renovaciones del pasado se hicieron **antes** de vencer (salvo
C18), así ningún otro parte queda con documentación vencida. Las unidades fuera de servicio no tienen partes desde que
salieron de servicio.

**Resultado esperado del ejemplo con H = 2026-11-18** (test de coherencia de D2; si cambia, cambia a propósito):

| Medida | Valor | Casos |
| --- | --- | --- |
| Protagonista "No pueden salir hoy" | 4 (2 no pueden salir + 2 fuera de servicio) | C01, C10, C11, C12 |
| Disponibles | 19 de 23 activas | — |
| Vencidos y faltantes | 2 | C01, C10 |
| Vencen en 7 días o menos | 4 | C02, C03, C04, C12 |
| Vencen entre 8 y 15 días | 3 | C05, C06, C17 |
| Vencen entre 16 y 30 días | 2 | C07, C08 |
| Pendientes de operación | 6 | C11, C18, C13, C14 (×2), C19 |
| Alertas críticas (insignia de la pestaña) | 4 | C01, C10, C11, C18 |

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
| `src/lib/dominio/vencimientos.ts` | `clasificar`, `documentoVigente`, `faltantes` (V1–V17), con `REQUISITOS`. | Sí |
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
- Un parte por unidad y por día (no hay turnos ni relevos de conductor en el mismo día).

## 15. Decisiones abiertas (resumen; detalle en el informe de diseño)

| # | Pregunta | Recomendación |
| --- | --- | --- |
| D1 | Stack | Vite + TypeScript + Svelte 5, sin SvelteKit (ver `stack.md`). |
| D2 | Perfil por defecto al entrar | Encargado siempre (el centro de alertas lleva el mensaje en 10 segundos). |
| D3 | Parte de una unidad fuera de servicio | Rechazarlo (P8). Alternativa: aceptarlo con advertencia (traslado al taller). |
| D4 | "Fecha de consulta" simulada para ver cambiar las alertas | P2: después del mínimo, con aviso fijo mientras está activa. |
| D5 | Exportar el parte a PDF | P2 con la impresión del navegador (sin dependencias). |
| D6 | Marcas y modelos | Modelos comunes reales (dan verosimilitud y no identifican a nadie). |
| D7 | Licencia del repositorio | MIT, como la Demo 1. |

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
  documentos; la de ingreso en un proyecto que no la exige alerta con gravedad `baja` (**M4**, a confirmar por Matías).
- Un documento "vigente" empata por vencimiento: gana el cargado después y, si sigue el empate, el de mayor id.
- El nombre en pantalla de la revisión técnica es "Revisión técnica"; las siglas "(VTV/RTO)" de 5.1 quedan para la interfaz.

**Aptitud y alertas**

- `aptitud` devuelve cuatro categorías: `puede-salir`, `no-puede-salir`, `fuera-de-servicio` y `baja`. Una unidad fuera de
  servicio también "no puede salir", pero se cuenta aparte en A8 (protagonista = no pueden salir + fuera de servicio).
- P6, "creada antes de ayer": la fecha de creación (en hora de Argentina) es anterior a `hoy − 1`.
- P5: un borrador de una fecha anterior a hoy alerta **mientras exista**, aunque ya no se pueda enviar (más de 7 días,
  P2): la salida es descartarlo.
- P9 (**M1, a confirmar por Matías**): los documentos se evalúan **como estaban en la fecha del parte**, no con el vigente
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
- **M3 (a confirmar por Matías):** una corrección de kilometraje con `desde` anterior a cualquier registro ya cargado (parte
  enviado u otra corrección) se **rechaza** con `km-correccion-anterior` y el mensaje «Ya hay un parte enviado el dd/mm/aaaa,
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

**Correcciones de la revisión del dominio (18/11/2026, `docs/revision-dominio.md`)**

Estas decisiones las tomó el programador trabajando solo, con el criterio más conservador. **A confirmar por Matías: M1, M3 y M4.**

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
