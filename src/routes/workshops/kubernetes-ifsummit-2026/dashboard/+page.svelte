<script lang="ts">
  import { onMount } from "svelte";
  import StarBackground from "$lib/shared/ui/StarBackground.svelte";

  const DOCKER_LOGO = "/workshop/docker.svg";
  const K8S_LOGO = "/workshop/k8s.svg";

  // ── backend URL ─────────────────────────────────
  const DEFAULT = "https://workshop-ifsummit-2026.bortoli.phd";
  let backend = $state(DEFAULT);

  onMount(() => {
    const saved = localStorage.getItem("workshop-ocean-backend");
    if (saved) backend = saved;
  });

  // ── creatures ────────────────────────────────────
  interface Creature {
    tool: string;
    name: string;
    alive: boolean;
    hanging: boolean;
    x: number;
    y: number;
  }
  let creatures = $state<Record<string, Creature>>({});
  let connected = $state(false);

  const logos: Record<string, string> = { docker: DOCKER_LOGO, k8s: K8S_LOGO };

  // ── SSE connection ───────────────────────────────
  let es: EventSource | null = null;

  function connect() {
    es?.close();
    const baseUrl = backend.endsWith("/") ? backend : `${backend}/`;
    const streamUrl = new URL("stream", baseUrl).toString();
    es = new EventSource(streamUrl);
    es.onopen = () => (connected = true);
    es.onmessage = (e) => {
      try {
        creatures = JSON.parse(e.data);
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      connected = false;
      es!.close();
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`${backend}/state`);
          if (r.ok) creatures = await r.json();
        } catch {
          /* ignore */
        }
      }, 3000);
      return () => clearInterval(poll);
    };
  }

  $effect(() => {
    if (backend) connect();
  });

  // ── backend editor ───────────────────────────────
  let editing = $state(false);
  let input = $state("");

  function save() {
    backend = input;
    localStorage.setItem("workshop-ocean-backend", backend);
    editing = false;
  }
</script>

<svelte:head><title>Workshop Ocean</title></svelte:head>

<div
  class="fixed inset-0 overflow-hidden bg-slate-950 text-slate-200 font-sans select-none"
>
  <StarBackground />

  <!-- ocean depth gradient -->
  <div
    class="absolute inset-0 pointer-events-none z-[1]"
    style="background:linear-gradient(180deg,transparent 0%,#08334420 40%,#0a4a5a40 70%,#0d6b6b60 100%)"
  ></div>

  <!-- creatures -->
  <div class="absolute bottom-[25vh] inset-x-0 h-[45vh] z-10">
    {#each Object.entries(creatures) as [id, c] (id)}
      {@const phase = (parseInt(id.replace(/\D/g, "0")) || 0) * 1.7}
      {@const driftX = Math.sin(phase + Date.now() / 8000) * 3}
      {@const driftY = Math.cos(phase + Date.now() / 12000) * 2}
      <div
        class="absolute text-center transition-all duration-1000"
        style="left:{c.x + driftX}%;top:{c.y + driftY}%;
                  opacity:{c.alive
          ? 1
          : c.hanging
            ? 0.35
            : 0};transform:translate(-50%,-50%)"
      >
        <img
          src={logos[c.tool] || DOCKER_LOGO}
          alt={c.tool}
          class="h-12 w-auto mx-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]
                    {c.alive ? 'animate-gentle-bob' : ''}"
          style="animation-duration:{c.tool === 'docker' ? '4.5s' : '6s'}"
        />
        <div
          class="text-[11px] font-semibold text-cyan-200/80 mt-0.5 bg-black/30 px-2 py-px rounded"
        >
          {c.name}
        </div>
      </div>
    {/each}
  </div>

  <!-- SVG waves — pattern-based seamless loop -->
  <svg
    class="absolute bottom-0 inset-x-0 z-[2] pointer-events-none"
    viewBox="0 0 1440 240"
    preserveAspectRatio="none"
    style="height:35vh"
  >
    <defs>
      <pattern id="wp3" width="1440" height="240" patternUnits="userSpaceOnUse">
        <path
          d="M0,160 C180,120 360,200 540,160 C720,120 900,200 1080,160 C1260,120 1440,160 L1440,240 L0,240 Z"
          fill="rgba(13,71,88,0.3)"
        />
        <animateTransform
          attributeName="patternTransform"
          type="translate"
          from="0,0"
          to="-1440,0"
          dur="18s"
          repeatCount="indefinite"
        />
      </pattern>
      <pattern id="wp2" width="1440" height="240" patternUnits="userSpaceOnUse">
        <path
          d="M0,185 C240,130 480,210 720,175 C960,140 1200,210 1440,185 L1440,240 L0,240 Z"
          fill="rgba(18,99,117,0.35)"
        />
        <animateTransform
          attributeName="patternTransform"
          type="translate"
          from="0,0"
          to="-1440,0"
          dur="14s"
          repeatCount="indefinite"
        />
      </pattern>
      <pattern id="wp1" width="1440" height="240" patternUnits="userSpaceOnUse">
        <path
          d="M0,195 C180,155 360,220 540,190 C720,160 900,220 1080,195 C1260,170 1440,195 L1440,240 L0,240 Z"
          fill="rgba(34,140,160,0.3)"
        />
        <animateTransform
          attributeName="patternTransform"
          type="translate"
          from="0,0"
          to="-1440,0"
          dur="10s"
          repeatCount="indefinite"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wp3)" />
    <rect width="100%" height="100%" fill="url(#wp2)" />
    <rect width="100%" height="100%" fill="url(#wp1)" />
  </svg>

  <!-- HUD -->
  <div
    class="absolute top-3 right-4 z-20 text-xs text-cyan-300/50 tabular-nums"
  >
    {Object.values(creatures).filter((c) => c.alive).length} alive
  </div>
  <div
    class="absolute top-3 left-4 z-20 text-[11px] {connected
      ? 'text-emerald-400'
      : 'text-slate-500'}"
  >
    {connected ? "● live" : "◌"}
  </div>

  <!-- backend url editor -->
  <div class="absolute bottom-3 left-4 z-20 flex items-center gap-2">
    {#if editing}
      <input
        type="text"
        bind:value={input}
        onkeydown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") editing = false;
        }}
        class="w-72 bg-slate-900/90 border border-cyan-500/50 text-slate-200 text-[11px] rounded px-2 py-1
                    focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
      <button
        onclick={save}
        class="text-cyan-400 hover:text-cyan-300"
        title="Save">✓</button
      >
    {:else}
      <button
        onclick={() => {
          editing = true;
          input = backend;
        }}
        class="text-slate-600 hover:text-cyan-400 transition-colors"
        title="Edit backend URL"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
          /></svg
        >
      </button>
      <span
        class="text-[10px] text-slate-600 truncate max-w-[180px] hidden sm:inline"
        >{backend}</span
      >
    {/if}
  </div>
  <div class="absolute bottom-3 right-4 z-20 text-[10px] text-slate-700">
    workshop ocean
  </div>
</div>

<style>
  @keyframes gentle-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-8px);
    }
    70% {
      transform: translateY(4px);
    }
  }
  .animate-gentle-bob {
    animation: gentle-bob 5s ease-in-out infinite;
  }
</style>
