// Huellas (SHA-256 del término normalizado) de los nombres de terceros que el repositorio no puede contener.
// NO se escriben los términos acá ni en ningún otro archivo del repositorio: ver `prohibidos.mjs`.
// Para sumar uno: `node -e "import('./scripts/prohibidos.mjs').then(m => console.log(m.crearHuella(process.argv[1])))" "término"`
// y pegar el resultado (sin dejar el término en el historial de la terminal compartida ni en ningún archivo).
// Los correos personales no llevan huella: los cubre la regla genérica de `correosNoPermitidos`.
export const HUELLAS = [
  { longitud: 6, huella: "0000000000000000000000000000000000000000000000000000000000000000" },
  { longitud: 5, huella: "0000000000000000000000000000000000000000000000000000000000000000" },
];
