import { mount } from "svelte";
import App from "./App.svelte";
import { app } from "./lib/estado/instancia.ts";

const raiz = document.getElementById("app");
if (raiz === null) throw new Error("Falta el elemento #app en index.html.");

mount(App, { target: raiz });
// El arranque (abrir IndexedDB, cargar o generar el ejemplo) corre en paralelo; las pantallas leen `app.fase`.
void app.iniciar();
