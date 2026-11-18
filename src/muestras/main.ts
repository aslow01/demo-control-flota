// Entrada de la página de muestras (muestras.html). SOLO desarrollo: no la importa nada de src/ ni es entrada del build.
import { mount } from "svelte";
import "../estilos/tokens.css";
import "../estilos/base.css";
import indexHtml from "../../index.html?raw";
import Muestras from "./Muestras.svelte";

// El sprite de íconos vive en index.html (una sola fuente). Se copia desde ahí para no repetirlo.
const documento = new DOMParser().parseFromString(indexHtml, "text/html");
const sprite = documento.querySelector("svg.sprite");
if (sprite === null) throw new Error("index.html no tiene el sprite de íconos (svg.sprite).");
document.body.prepend(document.importNode(sprite, true));

const raiz = document.getElementById("app");
if (raiz === null) throw new Error("Falta el elemento #app en muestras.html.");
mount(Muestras, { target: raiz });
