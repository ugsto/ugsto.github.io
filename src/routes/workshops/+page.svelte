<script lang="ts">
  import { flip } from 'svelte/animate';
  import StarBackground from '$lib/shared/ui/StarBackground.svelte';
  import Navbar from '$lib/shared/ui/Navbar.svelte';
  import { localizeHref } from '$lib/paraglide/runtime';
  import type { PageData } from './$types';
  import * as m from '$lib/paraglide/messages';

  export let data: PageData;

  const icons: Record<string, string> = {
    k8s: '/workshop/k8s.svg',
    docker: '/workshop/docker.svg',
  };
</script>

<svelte:head>
  <title>Bortoli.phd | {m.workshops_title()}</title>
</svelte:head>

<div class="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white pb-20 overflow-x-hidden relative">
  <StarBackground />
  <Navbar />

  <main class="max-w-5xl mx-auto px-6 relative z-10 pt-10">
    <header class="mb-12 text-center">
      <h1 class="text-4xl font-bold tracking-tight text-slate-100 mb-2">
        {m.workshops_title()}
      </h1>
      <p class="text-slate-400">{m.workshops_subtitle()}</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each data.workshops as workshop (workshop.title)}
        <div
          class="group bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all duration-300"
          animate:flip
        >
          <div class="flex items-start gap-4 mb-4">
            {#if icons[workshop.icon]}
              <img src={icons[workshop.icon]} alt={workshop.icon} class="h-10 w-10 mt-0.5" />
            {/if}
            <div>
              <h2 class="text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                {workshop.title}
              </h2>
              <span class="text-xs text-slate-500">{workshop.date}</span>
            </div>
          </div>

          <p class="text-sm text-slate-400 mb-4 leading-relaxed">
            {workshop.description}
          </p>

          <div class="flex flex-wrap gap-1.5 mb-5">
            {#each workshop.tags as tag}
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/50">
                {tag}
              </span>
            {/each}
          </div>

          <div class="flex gap-3">
            <a
              href={localizeHref(workshop.tutorialSlug)}
              class="flex-1 text-center text-sm font-medium px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors"
              data-sveltekit-reload
            >
              {m.workshops_view_workshop()}
            </a>
            {#if workshop.dashboardSlug}
              <a
                href={localizeHref(workshop.dashboardSlug)}
                class="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
                title="Dashboard"
                data-sveltekit-reload
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </main>
</div>
