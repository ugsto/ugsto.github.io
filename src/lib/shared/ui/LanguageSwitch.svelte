<script lang="ts">
  import {
    locales,
    extractLocaleFromUrl,
    localizeUrl,
  } from "$lib/paraglide/runtime.js";
  import { page } from "$app/state";

  function switchTo(newLang: string) {
    const currentPath = page.url.toString();
    const newUrl = localizeUrl(currentPath, {
      locale: newLang,
    });
    return newUrl.toString();
  }
  const labels: Record<string, string> = {
    en: "EN",
    "pt-br": "PT",
  };
</script>

<div class="flex items-center gap-2 border-l border-slate-800 pl-4 ml-2">
  {#each locales as lang}
    <a
      href={switchTo(lang)}
      class="text-xs font-mono font-bold transition-colors {extractLocaleFromUrl(
        page.url.pathname,
      ) === lang
        ? 'text-cyan-400'
        : 'text-slate-500 hover:text-slate-300'}"
      aria-label="Switch to {lang}"
      data-sveltekit-reload
    >
      {labels[lang] || lang.toUpperCase()}
    </a>
  {/each}
</div>
