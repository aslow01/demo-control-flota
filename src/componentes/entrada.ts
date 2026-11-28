// Entrada de las vistas (docs/diseno-ui.md, 15.10). La coreografía de una vista (Inicio y Hoy) corre UNA vez por vista y por sesión y después queda fija. Este módulo solo decide EN QUÉ
// ESTADO está la vista y cuándo cambia; no mueve nada: el contenedor de la vista lleva `data-entrada` (el estado) y `data-pausa` (mientras `pausa` sea `true`) y el CSS hace el resto.
//
//  - `completa`: la primera vez que se ve esa vista en la sesión. Las animaciones nacen en pausa (`pausa: true`, el primer cuadro está diseñado para leerse) hasta que cargaron las
//    letras o pasaron 450 ms Y terminó la transición entre pantallas, si hubo una. La pausa nunca dura más que `TOPE_DE_LA_PAUSA_MS`, pase lo que pase con esas dos condiciones.
//  - `fija`: `FIJA_A_LOS_MS` después de soltarse la pausa. Ya no aplica ninguna regla de animación.
//  - `breve`: volver a una vista ya vista. Solo la transición entre pantallas que ya existe (no pasa a `fija`).
//  - `quieta`: movimiento reducido o «Sin animaciones». Todo completo y en su estado final desde el primer cuadro. No gasta la entrada.
// «Reiniciar demo» la vuelve a pedir (`reiniciar`): las vistas que ya se vieron vuelven a ser «completa» y la que sigue en pantalla arranca de nuevo sola.
// Un valor que cambia por una acción (renovar un documento) NO vuelve a correr la coreografía: solo se llama a `empezar` cuando la vista se monta.
import { esperarTransicion, quiereMenosMovimiento } from "./movimiento.ts";

export type VistaConEntrada = "inicio" | "conductor";
export type EstadoDeEntrada = "completa" | "breve" | "fija" | "quieta";

export interface SituacionDeEntrada {
  estado: EstadoDeEntrada;
  /** Las animaciones están puestas pero detenidas (`data-pausa`). Solo en `completa`. */
  pausa: boolean;
}

/** Lo más que se espera a las letras antes de soltar la pausa (15.10, condición a). */
export const ESPERA_DE_LETRAS_MS = 450;
/** Cuánto después de soltarse la pausa la vista queda fija: la coreografía dura menos de 1.050 ms. */
export const FIJA_A_LOS_MS = 1500;
/** Lo más que dura la pausa aunque la transición entre pantallas no avise que terminó (decisión propia: no hay un tope escrito en la especificación). */
export const TOPE_DE_LA_PAUSA_MS = 1000;

/** Lo que el navegador le da a la entrada; en las pruebas, un reloj y unas promesas a mano. */
export interface DependenciasDeEntrada {
  /** `prefers-reduced-motion: reduce` o «Sin animaciones» (`data-movimiento="quieto"`). Se consulta al empezar y otra vez al soltar la pausa y al quedar fija. */
  menosMovimiento(): boolean;
  /** Se cumple cuando cargaron las letras. Si se rechaza (el navegador no sabe) cuenta como «ya están». */
  letrasListas(): Promise<unknown>;
  /** Se cumple cuando no hay una transición entre pantallas en curso (enseguida, si no hay ninguna). */
  transicionTerminada(): Promise<unknown>;
  /** Pide `alCumplirse` dentro de `ms`; devuelve cómo cancelarlo. */
  esperar(ms: number, alCumplirse: () => void): () => void;
}

export interface Entrada {
  /**
   * Empieza la entrada de una vista que se acaba de montar. Avisa la situación de ahora ENSEGUIDA (antes de volver) y cada cambio después. Devuelve cómo parar: hay que
   * llamarla cuando la vista se desmonta (cuenta como vista aunque se haya ido a mitad de la coreografía).
   */
  empezar(vista: VistaConEntrada, alCambiar: (situacion: SituacionDeEntrada) => void): () => void;
  /** «Reiniciar demo»: todas las vistas vuelven a ser nuevas, y las que están en pantalla arrancan de nuevo. */
  reiniciar(): void;
}

export function crearEntrada(deps: DependenciasDeEntrada): Entrada {
  const vistas = new Set<VistaConEntrada>();
  const enPantalla = new Set<() => void>();

  return {
    empezar(vista, alCambiar) {
      let parada = false;
      let corrida = 0;
      let relojes: (() => void)[] = [];

      const avisar = (situacion: SituacionDeEntrada): void => {
        if (!parada) alCambiar({ ...situacion });
      };
      const cortar = (): void => {
        for (const cancelar of relojes) cancelar();
        relojes = [];
        corrida += 1;
      };
      const quieta = (): SituacionDeEntrada => ({ estado: "quieta", pausa: false });

      const arrancar = (): void => {
        cortar();
        const esta = corrida;
        if (deps.menosMovimiento()) return avisar(quieta());
        if (vistas.has(vista)) return avisar({ estado: "breve", pausa: false });
        vistas.add(vista);
        avisar({ estado: "completa", pausa: true });

        let letras = false;
        let transicion = false;
        let suelta = false;
        const vigente = (): boolean => !parada && esta === corrida;
        const soltar = (): void => {
          if (suelta || !vigente()) return;
          suelta = true;
          if (deps.menosMovimiento()) return avisar(quieta());
          avisar({ estado: "completa", pausa: false });
          relojes.push(deps.esperar(FIJA_A_LOS_MS, () => avisar(deps.menosMovimiento() ? quieta() : { estado: "fija", pausa: false })));
        };
        const revisar = (): void => {
          if (letras && transicion) soltar();
        };
        const cumplida = (promesa: () => Promise<unknown>, alCumplirse: () => void): void => {
          const listo = (): void => {
            if (vigente()) alCumplirse();
          };
          // Un fallo de la API (o que tire al llamarla) no deja la vista en pausa: se trata como «ya está».
          void Promise.resolve()
            .then(promesa)
            .then(listo, listo);
        };

        relojes.push(
          deps.esperar(ESPERA_DE_LETRAS_MS, () => {
            letras = true;
            revisar();
          }),
          deps.esperar(TOPE_DE_LA_PAUSA_MS, soltar),
        );
        cumplida(deps.letrasListas, () => {
          letras = true;
          revisar();
        });
        cumplida(deps.transicionTerminada, () => {
          transicion = true;
          revisar();
        });
      };

      arrancar();
      const rearmar = (): void => arrancar();
      enPantalla.add(rearmar);
      return () => {
        if (parada) return;
        parada = true;
        cortar();
        enPantalla.delete(rearmar);
      };
    },

    reiniciar() {
      vistas.clear();
      for (const rearmar of [...enPantalla]) rearmar();
    },
  };
}

/** Lo que el navegador le da a la entrada de verdad. */
export function dependenciasDelNavegador(): DependenciasDeEntrada {
  return {
    menosMovimiento: quiereMenosMovimiento,
    letrasListas: () => (document.fonts === undefined ? Promise.resolve() : document.fonts.ready),
    transicionTerminada: esperarTransicion,
    esperar(ms, alCumplirse) {
      const id = setTimeout(alCumplirse, ms);
      return () => clearTimeout(id);
    },
  };
}

/** La entrada de la página: una sola por sesión (se reinicia al recargar). */
export const entrada: Entrada = crearEntrada(dependenciasDelNavegador());
