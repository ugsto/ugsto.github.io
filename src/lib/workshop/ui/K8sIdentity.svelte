<script lang="ts">
  let { variant = 'subtle' } = $props<{
    variant?: 'subtle' | 'hero';
  }>();
</script>

<!-- K8s Identity: hexágonos decorativos + grid terminal -->
<div class="k8s-identity pointer-events-none select-none" class:hero={variant === 'hero'}>
  <svg
    class="k8s-hexagons"
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Hexágono grande central — K8s pod -->
    <path
      d="M200 40 L320 110 L320 250 L200 320 L80 250 L80 110 Z"
      stroke="currentColor"
      stroke-width="0.5"
      class="hex-big"
    />
    <path
      d="M200 70 L295 125 L295 235 L200 290 L105 235 L105 125 Z"
      stroke="currentColor"
      stroke-width="0.3"
      class="hex-mid"
    />

    <!-- Hexágonos laterais — nós do cluster -->
    <path d="M120 60 L160 80 L160 120 L120 140 L80 120 L80 80 Z" stroke="currentColor" stroke-width="0.4" class="hex-node" />
    <path d="M280 180 L320 200 L320 240 L280 260 L240 240 L240 200 Z" stroke="currentColor" stroke-width="0.4" class="hex-node" />
    <path d="M100 240 L140 260 L140 300 L100 320 L60 300 L60 260 Z" stroke="currentColor" stroke-width="0.4" class="hex-node" />
    <path d="M280 310 L320 330 L320 370 L280 390 L240 370 L240 330 Z" stroke="currentColor" stroke-width="0.4" class="hex-node" />

    <!-- Linhas conectando hexágonos — rede do cluster -->
    <line x1="160" y1="100" x2="200" y2="125" stroke="currentColor" stroke-width="0.2" stroke-dasharray="3 3" class="hex-connector" />
    <line x1="200" y1="290" x2="280" y2="220" stroke="currentColor" stroke-width="0.2" stroke-dasharray="3 3" class="hex-connector" />
    <line x1="160" y1="280" x2="200" y2="290" stroke="currentColor" stroke-width="0.2" stroke-dasharray="3 3" class="hex-connector" />
    <line x1="280" y1="220" x2="280" y2="350" stroke="currentColor" stroke-width="0.2" stroke-dasharray="3 3" class="hex-connector" />

    <!-- Pontos de interseção -->
    <circle cx="200" cy="180" r="2" class="hex-dot" fill="currentColor" />
    <circle cx="260" cy="260" r="1.5" class="hex-dot" fill="currentColor" />
    <circle cx="140" cy="200" r="1.5" class="hex-dot" fill="currentColor" />
  </svg>
</div>

<style>
  .k8s-identity {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
  }

  .k8s-hexagons {
    width: 100%;
    height: 100%;
    opacity: 0.04;
    color: #326ce5;
  }

  .hex-big { opacity: 0.6; }
  .hex-mid { opacity: 0.4; }
  .hex-node { opacity: 0.3; }
  .hex-connector { opacity: 0.25; }
  .hex-dot { opacity: 0.5; }

  /* Variante hero: mais visível, para headers */
  .hero .k8s-hexagons {
    opacity: 0.08;
  }

  .hero .hex-big { opacity: 0.8; }
  .hero .hex-mid { opacity: 0.5; }
  .hero .hex-node { opacity: 0.4; }
  .hero .hex-connector { opacity: 0.4; }
  .hero .hex-dot { opacity: 0.7; }
</style>
