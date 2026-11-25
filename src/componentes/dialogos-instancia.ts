// Los diálogos de documentos y de novedades de la aplicación de verdad: uno solo, compartido por Inicio, Vencimientos y Operación diaria.
// Aparte de `dialogos-documento.svelte.ts` para que los tests prueben la clase con `EstadoApp` de prueba sin tocar la ventana.

import { app } from "../lib/estado/instancia.ts";
import { DialogosDeDocumento } from "./dialogos-documento.svelte.ts";

export const dialogos = new DialogosDeDocumento(app);
