// Código M3 (etapa 4): un guardado que falla de forma inesperada no puede dejar el diálogo bloqueado para siempre.
import { describe, expect, it, vi } from "vitest";
import { ESPERA_GUARDANDO_MS, guardarConIndicador } from "../src/lib/estado/guardado.ts";

function registro() {
  const llamadas: string[] = [];
  return {
    llamadas,
    alTardar: () => void llamadas.push("tardar"),
    alTerminar: () => void llamadas.push("terminar"),
    alFallar: () => {
      llamadas.push("fallar");
      return "error general";
    },
  };
}

describe("guardarConIndicador", () => {
  it("devuelve el resultado y termina (apaga el estado «guardando») sin mostrar nada si fue rápido", async () => {
    const r = registro();
    expect(await guardarConIndicador(async () => "listo", r)).toBe("listo");
    expect(r.llamadas).toEqual(["terminar"]);
  });

  it("si tarda más que la espera, avisa una vez antes de terminar", async () => {
    vi.useFakeTimers();
    try {
      const r = registro();
      const pendiente = guardarConIndicador(() => new Promise<string>((resolver) => setTimeout(() => resolver("listo"), ESPERA_GUARDANDO_MS + 50)), r);
      await vi.advanceTimersByTimeAsync(ESPERA_GUARDANDO_MS + 60);
      expect(await pendiente).toBe("listo");
      expect(r.llamadas).toEqual(["tardar", "terminar"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("si el guardado rechaza, devuelve el error general y termina igual (el diálogo no queda bloqueado)", async () => {
    const r = registro();
    const resultado = await guardarConIndicador(() => Promise.reject(new Error("algo salió mal")), r);
    expect(resultado).toBe("error general");
    expect(r.llamadas).toEqual(["fallar", "terminar"]);
  });

  it("si el guardado lanza antes de devolver la promesa, pasa lo mismo", async () => {
    const r = registro();
    const resultado = await guardarConIndicador(() => {
      throw new Error("falló en seco");
    }, r);
    expect(resultado).toBe("error general");
    expect(r.llamadas).toEqual(["fallar", "terminar"]);
  });

  it("no queda un temporizador pendiente: tras un fallo rápido el aviso de «Guardando…» nunca llega", async () => {
    vi.useFakeTimers();
    try {
      const r = registro();
      await guardarConIndicador(() => Promise.reject(new Error("x")), r);
      await vi.advanceTimersByTimeAsync(ESPERA_GUARDANDO_MS * 3);
      expect(r.llamadas).not.toContain("tardar");
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
