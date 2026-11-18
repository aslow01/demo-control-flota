// Aviso entre pestañas (docs/diseno.md, D9): cuando otra pestaña escribe, esta se entera y la interfaz muestra
// "Se hicieron cambios en otra pestaña…" con un botón "Actualizar". Acá solo se mandan y se reciben los avisos: nunca se
// recargan datos solos (se perdería lo que la persona está escribiendo) y el mensaje no lleva datos.

export const NOMBRE_CANAL = "control-flota";

/** Lo mínimo de BroadcastChannel que se usa (para poder probarlo con un canal falso). */
export interface CanalDePestanas {
  /** Registra quién recibe el dato de cada mensaje; null deja de escuchar. */
  escuchar(alRecibirDato: ((dato: unknown) => void) | null): void;
  postMessage(mensaje: unknown): void;
  close(): void;
}

export interface OpcionesAviso {
  /** Se llama cada vez que OTRA pestaña avisa un cambio. */
  alRecibir: () => void;
  /** Por defecto, el BroadcastChannel del navegador. Puede lanzar o devolver null si no existe. */
  crearCanal?: (nombre: string) => CanalDePestanas | null;
}

export interface AvisoEntrePestanas {
  /** Avisa a las otras pestañas que esta escribió. Nunca lanza: la escritura ya salió bien. */
  avisarCambio(): void;
  /** Deja de escuchar y de avisar. Se puede llamar más de una vez. */
  cerrar(): void;
}

function canalDelNavegador(nombre: string): CanalDePestanas | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const real = new BroadcastChannel(nombre);
  return {
    escuchar(alRecibirDato) {
      real.onmessage = alRecibirDato === null ? null : (evento) => alRecibirDato(evento.data);
    },
    postMessage: (mensaje) => real.postMessage(mensaje),
    close: () => real.close(),
  };
}

/** El mensaje es solo { tipo: "cambio" }; todo lo demás se ignora (viene de otra pestaña: entrada no confiable). */
function esAvisoDeCambio(dato: unknown): boolean {
  return typeof dato === "object" && dato !== null && !Array.isArray(dato) && (dato as { tipo?: unknown }).tipo === "cambio";
}

export function avisoEntrePestanas(opciones: OpcionesAviso): AvisoEntrePestanas {
  let canal: CanalDePestanas | null = null;
  try {
    canal = (opciones.crearCanal ?? canalDelNavegador)(NOMBRE_CANAL);
  } catch {
    canal = null; // sin soporte: la demo funciona igual, solo no se enteran las otras pestañas
  }
  canal?.escuchar((dato) => {
    if (esAvisoDeCambio(dato)) opciones.alRecibir();
  });
  return {
    avisarCambio() {
      try {
        canal?.postMessage({ tipo: "cambio" });
      } catch {
        // canal cerrado por el navegador: no es un error de la escritura
      }
    },
    cerrar() {
      if (canal === null) return;
      try {
        canal.escuchar(null);
        canal.close();
      } catch {
        // ya estaba cerrado
      }
      canal = null;
    },
  };
}
