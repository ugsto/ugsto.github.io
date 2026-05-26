<script lang="ts">
  import { localizeHref } from "$lib/paraglide/runtime";
  import StarBackground from "$lib/shared/ui/StarBackground.svelte";
  import K8sIdentity from "./K8sIdentity.svelte";
  import { presentationMode } from "$lib/workshop/stores/presentation.svelte";

  let {
    slugs,
    currentPath,
    homeHref,
    navTitle = "kubernetes from scratch",
    dashboardHref,
    children,
  } = $props<{
    slugs: string[] | Promise<string[]>;
    currentPath: string;
    homeHref: string;
    navTitle?: string;
    dashboardHref?: string;
    children: import("svelte").Snippet;
  }>();

  const resolvedSlugs = $derived(slugs instanceof Promise ? null : slugs);
</script>

<div class="min-h-screen bg-slate-950 text-slate-200 font-sans relative">
  <StarBackground />
  <K8sIdentity />

  <!-- Top bar -->
  <nav
    class="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/50 px-4 py-2.5 flex items-center gap-4"
  >
    <a
      href={homeHref}
      class="text-slate-400 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-1.5"
    >
      <svg
        class="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
      >
      bortoli.phd
    </a>
    <span class="text-slate-700">|</span>
    <span class="text-cyan-400 text-sm font-mono tracking-wide">{navTitle}</span
    >

    <!-- Modo apresentação toggle -->
    <button
      onclick={() => presentationMode.toggle()}
      class="ml-auto mr-2 flex items-center gap-1.5 text-xs transition-colors select-none"
      class:text-amber-400={presentationMode.enabled}
      class:text-slate-600={!presentationMode.enabled}
      title={presentationMode.enabled
        ? "Modo apresentação: texto enxuto"
        : "Modo estudo: conteúdo completo"}
    >
      <svg
        class="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <span class="hidden sm:inline"
        >{presentationMode.enabled ? "slides" : "slides"}</span
      >
    </button>

    {#if dashboardHref}
      <a
        href={dashboardHref}
        class="text-slate-500 hover:text-cyan-400 text-sm transition-colors"
      >
        dashboard
      </a>
    {/if}
  </nav>

  <div
    class="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-8 gap-8 relative z-10"
  >
    <!-- Sidebar -->
    <aside class="lg:w-52 shrink-0 hidden lg:block">
      <div class="sticky top-20">
        <h2
          class="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.2em] mb-4"
        >
          Sumário
        </h2>
        <nav
          class="space-y-0.5 text-sm max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"
        >
          {#if resolvedSlugs}
            {#each resolvedSlugs as slug}
              {@const href = `/workshops/kubernetes-ifsummit-2026/tutorial/${slug}`}
              <a
                href={localizeHref(href)}
                class="block py-1.5 px-2 rounded-md transition-colors text-[13px]
                        {currentPath === href
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'}"
              >
                {slug.replace(/-/g, " ")}
              </a>
            {/each}
          {:else}
            {#await slugs then s}
              {#each s as slug}
                {@const href = `/workshops/kubernetes-ifsummit-2026/tutorial/${slug}`}
                <a
                  href={localizeHref(href)}
                  class="block py-1.5 px-2 rounded-md transition-colors text-[13px]
                          {currentPath === href
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'}"
                >
                  {slug.replace(/-/g, " ")}
                </a>
              {/each}
            {/await}
          {/if}
        </nav>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      {@render children()}
    </main>
  </div>
</div>
