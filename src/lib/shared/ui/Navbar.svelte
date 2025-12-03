<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import LanguageSwitch from "./LanguageSwitch.svelte";
  import * as m from "$lib/paraglide/messages";
  import { localizeHref } from "$lib/paraglide/runtime";
</script>

<nav
  class="w-full px-6 py-2 flex justify-between items-center sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/50"
>
  <a
    href={localizeHref("/")}
    class="font-bold tracking-tighter text-slate-100 hover:text-cyan-400 transition-colors"
    aria-label="Home"
    data-sveltekit-reload
  >
    <img
      src={favicon}
      width={42}
      alt="Logo, a single bit surrounded by circular lines spaced by a small gap"
    />
  </a>
  <ul class="flex gap-6 text-sm font-medium">
    <li>
      <a
        href={localizeHref("/#contact")}
        class="hover:text-cyan-400 transition-colors"
        data-sveltekit-reload
      >
        {m.nav_contact()}
      </a>
    </li>
    <li>
      <a
        href={localizeHref("/blog")}
        class="hover:text-cyan-400 transition-colors"
        data-sveltekit-reload
      >
        {m.nav_blog()}
      </a>
    </li>
  </ul>
  <LanguageSwitch />
</nav>
