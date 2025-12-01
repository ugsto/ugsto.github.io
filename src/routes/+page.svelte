<script lang="ts">
  import StarBackground from "$lib/shared/ui/StarBackground.svelte";
  import Navbar from "$lib/shared/ui/Navbar.svelte";
  import ContactCard from "$lib/home/ui/ContactCard.svelte";
  import { SOCIAL_LINKS } from "$lib/home/infrastructure/social-links";
  import * as m from "$lib/paraglide/messages";
</script>

<svelte:head>
  <title>Bortoli.phd</title>
  <meta
    name="description"
    content="Personal homepage of Andre Augusto Bortoli"
  />
</svelte:head>

<div
  class="w-full bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden relative"
>
  <StarBackground />
  <Navbar />

  <section
    class="h-screen w-full flex flex-col justify-center items-center px-4 text-center relative z-10"
  >
    <h1
      class="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight max-w-5xl leading-tight"
    >
      <span class="text-slate-400 block mb-2 sm:mb-0">{m.home_title_1()}</span>
      <span class="text-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
        {m.home_title_2()}
      </span>
    </h1>

    <div class="absolute bottom-10 animate-bounce text-slate-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
      </svg>
    </div>
  </section>

  <section
    id="contact"
    class="min-h-screen w-full flex flex-col justify-center items-center px-4 bg-slate-900/30 relative z-10 border-t border-slate-900 py-20"
  >
    <div class="max-w-5xl w-full text-center space-y-12 mb-10">
      <h2 class="text-3xl font-bold tracking-tight text-slate-100">
        {m.home_get_in_touch()}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {#each SOCIAL_LINKS as link (link.platform)}
          <ContactCard {link} />
        {/each}
      </div>
    </div>

    <footer
      class="absolute bottom-4 w-full text-center text-xs text-slate-500 py-4"
    >
      &copy; {new Date().getFullYear()}
      {m.home_footer()}
    </footer>
  </section>
</div>
