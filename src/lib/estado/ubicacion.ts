// La barra de direcciones como un objeto chico y reemplazable: así el estado de la aplicación se prueba en Node sin
// ventana. `ubicacionDelNavegador` es el único código que toca `window.location` y `history`.

export interface Ubicacion {
  /** El hash actual, con el '#' (o vacío). */
  leerHash(): string;
  /** Cambia de pantalla agregando una entrada al historial (dispara el aviso de cambio, como un clic en un enlace). */
  irA(hash: string): void;
  /** Corrige el hash sin agregar entrada ni avisar (formas canónicas y redirecciones). */
  reemplazarHash(hash: string): void;
  /** Se llama cuando cambia el hash por navegación (enlaces, atrás/adelante). Devuelve cómo dejar de escuchar. */
  alCambiar(oyente: () => void): () => void;
}

export function ubicacionDelNavegador(): Ubicacion {
  return {
    leerHash: () => window.location.hash,
    irA(hash) {
      window.location.hash = hash;
    },
    reemplazarHash(hash) {
      window.history.replaceState(window.history.state, "", hash);
    },
    alCambiar(oyente) {
      window.addEventListener("hashchange", oyente);
      return () => window.removeEventListener("hashchange", oyente);
    },
  };
}

/** Para los tests: `entradas` cuenta las entradas del historial (empieza en 1; `irA` agrega una, `reemplazarHash` no). */
export function ubicacionEnMemoria(inicial = ""): Ubicacion & { hash: string; entradas: number } {
  const oyentes = new Set<() => void>();
  const u = {
    hash: inicial,
    entradas: 1,
    leerHash: () => u.hash,
    irA(hash: string) {
      u.hash = hash;
      u.entradas += 1;
      for (const o of [...oyentes]) o();
    },
    reemplazarHash(hash: string) {
      u.hash = hash;
    },
    alCambiar(oyente: () => void) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
  return u;
}
