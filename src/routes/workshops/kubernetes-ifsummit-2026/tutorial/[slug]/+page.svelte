<script lang="ts">
  import type { PageData } from "./$types";
  import WorkshopContent from "$lib/workshop/ui/WorkshopContent.svelte";
  import { localizeHref } from "$lib/paraglide/runtime";
  import * as m from "$lib/paraglide/messages";

  let { data } = $props();
  const page = $derived(data.page);

  const partLabel = $derived(page ? `Parte ${page.part}` : "");
  const sectionLabel = $derived(page ? `Seção ${page.section}` : "");

  const prevHref = $derived(
    page?.prevSlug
      ? localizeHref(
          `/workshops/kubernetes-ifsummit-2026/tutorial/${page.prevSlug}`,
        )
      : null,
  );
  const nextHref = $derived(
    page?.nextSlug
      ? localizeHref(
          `/workshops/kubernetes-ifsummit-2026/tutorial/${page.nextSlug}`,
        )
      : null,
  );
</script>

<svelte:head>
  <title
    >{page
      ? `${page.title} · Kubernetes From Scratch`
      : "Kubernetes From Scratch"}</title
  >
</svelte:head>

<div>
  {#if !page}
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <svg
        class="w-16 h-16 text-slate-600 mb-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p class="text-slate-400 max-w-md leading-relaxed">
        {m.workshops_not_available()}
      </p>
    </div>
  {:else}
    <!-- Header -->
    <header class="mb-10">
      <div
        class="text-cyan-400/80 text-[11px] font-mono uppercase tracking-[0.15em] mb-2"
      >
        {partLabel} · {sectionLabel}
      </div>
      <h1
        class="text-3xl md:text-4xl font-light tracking-tight text-slate-100 leading-tight"
      >
        {page.title}
      </h1>
      <div class="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
        <span class="flex items-center gap-1">
          <svg
            class="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><circle cx="12" cy="12" r="10" /><polyline
              points="12 6 12 12 16 14"
            /></svg
          >
          {page.readTimeMinutes} min de leitura
        </span>
        <span class="flex items-center gap-1">
          <svg
            class="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><polyline points="16 3 21 3 21 8" /><line
              x1="4"
              y1="20"
              x2="21"
              y2="3"
            /><polyline points="21 16 21 21 16 21" /><line
              x1="15"
              y1="15"
              x2="21"
              y2="21"
            /><line x1="4" y1="4" x2="9" y2="9" /></svg
          >
          {page.handsOnMinutes} min hands-on
        </span>
      </div>
    </header>

    <!-- Conteúdo renderizado com componentes Svelte -->
    <WorkshopContent content={page.rawMd} slides={page.slidesMd} />

    <!-- Bottom navigation -->
    <nav
      class="flex justify-between items-stretch mt-16 pt-8 border-t border-slate-800/50 gap-4"
    >
      {#if prevHref}
        <a
          href={prevHref}
          class="group flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-300 transition-colors"
        >
          <svg
            class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
          >
          <span class="hidden sm:inline">Anterior</span>
        </a>
      {:else}
        <div></div>
      {/if}

      {#if nextHref}
        <a
          href={nextHref}
          class="group flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors ml-auto"
        >
          <span class="hidden sm:inline">Próximo</span>
          <svg
            class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg
          >
        </a>
      {:else}
        <div></div>
      {/if}
    </nav>
  {/if}
</div>
