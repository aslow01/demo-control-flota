// La aplicación de verdad: el estado con el reloj del sistema, IndexedDB del navegador, la barra de direcciones y
// BroadcastChannel. Es lo único que une el estado con las piezas del navegador; los tests usan `EstadoApp` con dobles.

import { abrirIndexedDB, borrarIndexedDB } from "../persistencia/indexeddb.ts";
import { EstadoApp } from "./app.svelte.ts";
import { crearReloj } from "./reloj.ts";
import { ubicacionDelNavegador } from "./ubicacion.ts";

export const app = new EstadoApp({
  reloj: crearReloj(),
  abrirAlmacenamiento: () => abrirIndexedDB(),
  borrarAlmacenamiento: () => borrarIndexedDB(),
  ubicacion: ubicacionDelNavegador(),
});
