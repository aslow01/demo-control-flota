// Roles explícitos de la lista-tabla (5.9). Con poco ancho la tabla pasa a tarjetas (`display: block` / `grid`) y algunos
// lectores de pantalla dejan de ver la tabla si el elemento cambia de `display`: los roles escritos a mano la mantienen.
// Van como objetos para esparcir (`{...CELDA}`): con el rol igual al nativo, Svelte avisaría de un rol redundante.
export const TABLA = { role: "table" } as const;
export const GRUPO_DE_FILAS = { role: "rowgroup" } as const;
export const FILA = { role: "row" } as const;
export const ENCABEZADO_DE_COLUMNA = { role: "columnheader" } as const;
export const ENCABEZADO_DE_GRUPO = { role: "rowheader" } as const;
export const CELDA = { role: "cell" } as const;
