// Lo que las pantallas pesadas (la ficha, Movilidades, el parte y Hoy) le piden al estado de la aplicación para armar su vista.
// `EstadoApp` lo cumple tal cual; este tipo existe para que los módulos de esas pantallas (que se bajan al entrar, no con el marco)
// no tengan que importar la clase entera, y para que las pruebas puedan pasarles un doble.

import type { ResultadoAlertas } from "../dominio/alertas.ts";
import type { Estado, FechaCivil, Perfil } from "../dominio/tipos.ts";
import type { Ruta } from "./enrutador.ts";

export interface LecturaDeApp {
  /** Todo lo que sabe la aplicación; `null` hasta que termina el arranque. */
  readonly estado: Estado | null;
  /** Las alertas de `estado` con `hoy`; `null` hasta que termina el arranque. */
  readonly alertas: ResultadoAlertas | null;
  readonly hoy: FechaCivil;
  readonly ruta: Ruta;
  readonly perfil: Perfil;
}
