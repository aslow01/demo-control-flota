import { mount } from "svelte";
import "./estilos/tokens.css";
import "./estilos/base.css";
import App from "./App.svelte";
import { app } from "./lib/estado/instancia.ts";
import { preferenciasDelNavegador } from "./lib/estado/preferencias.ts";

const raiz = document.getElementById("app");
if (raiz === null) throw new Error("Falta el elemento #app en index.html.");

// El tema y «Sin animaciones» guardados ya los puso `public/arranque.js` en <html> antes del primer pintado (este módulo llega después de bajar y ejecutar el JS de la carga inicial). Acá se aplican
// de nuevo, por el código de la aplicación, junto con `theme-color`, ANTES de montar: es lo que deja los controles de «Apariencia» y los atributos de acuerdo.
preferenciasDelNavegador().aplicar();
mount(App, { target: raiz });
// El arranque (abrir IndexedDB, cargar o generar el ejemplo) corre en paralelo; las pantallas leen `app.fase`.
void app.iniciar();
