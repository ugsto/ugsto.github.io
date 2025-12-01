<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import LanguageSwitch from "./LanguageSwitch.svelte";
  import * as m from "$lib/paraglide/messages";
  import { localizeUrl } from "$lib/paraglide/runtime";
</script>

<nav
  class="w-full px-6 py-2 flex justify-between items-center sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/50"
>
  <a
    href={localizeUrl("/").toString()}
    class="font-bold tracking-tighter text-slate-100 hover:text-cyan-400 transition-colors"
    aria-label="Home"
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
        href={localizeUrl("/#contact").toString()}
        class="hover:text-cyan-400 transition-colors"
      >
        {m.nav_contact()}
      </a>
    </li>
    <li>
      <a
        href={localizeUrl("/blog").toString()}
        class="hover:text-cyan-400 transition-colors"
      >
        {m.nav_blog()}
      </a>
    </li>
  </ul>
  <LanguageSwitch />
</nav>
