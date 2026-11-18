<script lang="ts">
  // Diálogo «Resolver novedad» (5.17), el mismo desde la ficha y desde el centro de alertas: lo que se está resolviendo (etiqueta, texto, origen y
  // fecha), el campo «¿Qué se hizo?» (N1) y, si corresponde (N2), la casilla «Volver a servicio ahora» marcada, con su nota y el aviso de A5.
  // No tiene reglas: el contexto lo arma `contextoDeResolver` y `guardar` es `app.resolverNovedad`.
  import type { ContextoResolver, CampoResolver, ValoresResolver } from "../lib/dominio/formulario-novedad.ts";
  import { REGLAS } from "../lib/dominio/validacion.ts";
  import type { ResultadoGuardado } from "../lib/estado/app.svelte.ts";
  import Aviso from "./Aviso.svelte";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
  import DialogoFormulario from "./DialogoFormulario.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import { TEXTO_DIALOGOS_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    abierto = $bindable(false),
    contexto,
    guardar,
    alGuardar,
    focoDestino,
  }: {
    abierto?: boolean;
    contexto: ContextoResolver | null;
    guardar: (valores: ValoresResolver) => Promise<ResultadoGuardado<CampoResolver>>;
    alGuardar: (resultado: Extract<ResultadoGuardado<CampoResolver>, { ok: true }>) => void;
    focoDestino?: () => HTMLElement | null;
  } = $props();
</script>

<DialogoFormulario
  bind:abierto
  titulo={contexto?.titulo ?? ""}
  valoresIniciales={contexto?.valoresIniciales ?? null}
  primario={contexto?.primario ?? null}
  conDescripcion
  {guardar}
  {alGuardar}
  {focoDestino}
>
  {#snippet children(f)}
    {#if contexto !== null}
      <div class="novedad" id={f.idDescripcion}>
        <p class="rotulo-novedad">{T.resolver.novedad}</p>
        <div class="cabecera">
          <Etiqueta tono={contexto.novedad.gravedad === "critica" ? "critico" : "semana"} icono={contexto.novedad.gravedad === "critica" ? "octogono" : "llave"}>
            {contexto.novedad.etiqueta}
          </Etiqueta>
          <span class="nota">{contexto.novedad.origen}{contexto.novedad.origen.includes(contexto.novedad.fecha) ? "" : ` · ${contexto.novedad.fecha}`}</span>
        </div>
        <p class="texto">{contexto.novedad.texto}</p>
      </div>
      <Campo
        etiqueta={T.resolver.campo}
        tipo="area"
        id={f.idCampo("texto")}
        bind:valor={f.valores.texto}
        requerido
        ayuda={T.resolver.ayuda(REGLAS.resolucion.min, REGLAS.resolucion.max)}
        error={f.error("texto")}
      />
      {#if contexto.ofreceVolverAServicio}
        <Casilla etiqueta={contexto.etiquetaVolverAServicio} bind:marcada={f.valores.volverAServicio} ayuda={contexto.notaVolverAServicio ?? ""}>
          {#if contexto.avisoDocumentos !== null}
            <Aviso tono="semana" icono="alerta">{contexto.avisoDocumentos}</Aviso>
          {/if}
        </Casilla>
      {/if}
    {/if}
  {/snippet}
</DialogoFormulario>

<style>
  .novedad {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-3) var(--e-4);
    background: var(--c-superficie-2);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
  }
  .rotulo-novedad {
    font-size: var(--t-rotulo);
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.3;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .texto {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
</style>
