<script lang="ts">
  // 4.4 Pie: fondo del escritorio, borde superior, dos renglones. "Código fuente" no se muestra mientras el repositorio sea privado.
  // Nunca dice que la demo reproduce el sistema de una empresa ni nombra empleadores o clientes.
  import { TEXTO_PIE, URL_PORTAFOLIO } from "./textos-marco.ts";
</script>

<footer>
  <div class="interior contenedor">
    <p>{TEXTO_PIE.datos}</p>
    <p>{TEXTO_PIE.autoria} · <a href={URL_PORTAFOLIO}>{TEXTO_PIE.volverAlPortafolio}</a></p>
  </div>
</footer>

<style>
  footer {
    background: var(--c-escritorio);
    border-top: 1px solid var(--c-borde);
    font-size: var(--t-chico);
    line-height: 1.5;
    color: var(--c-texto-2);
  }
  .interior {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding-block: var(--e-5);
  }
  p {
    max-width: 62ch;
  }
  a {
    display: inline-block;
    padding-block: 0.8125rem; /* área de toque de 44 px sin cambiar el aspecto del renglón */
    margin-block: -0.8125rem;
  }
</style>
