// Svelte 5 sin SvelteKit. Todos los componentes en modo runes (`$state`, `$derived`, `$props`).
// Reglas de CSP, `{@html}` y transiciones: docs/stack.md sección 4; las vigila `npm run buscar`.
export default {
  compilerOptions: {
    runes: true,
  },
};
