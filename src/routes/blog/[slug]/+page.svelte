<script lang="ts">
  import StarBackground from "$lib/shared/ui/StarBackground.svelte";
  import Navbar from "$lib/shared/ui/Navbar.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
  $: post = data.post;
</script>

<svelte:head>
  <title>{post.title} | UGSTO</title>
</svelte:head>

<div
  class="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white pb-20 overflow-x-hidden relative"
>
  <StarBackground />
  <Navbar />

  <main class="relative z-10 pt-10 md:pt-16">
    <article class="max-w-3xl mx-auto px-6">
      <a
        href="/blog"
        class="inline-flex items-center text-sm text-slate-500 hover:text-cyan-400 mb-8 transition-colors group"
      >
        <span class="mr-2 group-hover:-translate-x-1 transition-transform"
          >←</span
        > Go Back
      </a>

      <header class="mb-12">
        <div
          class="flex items-center gap-3 text-xs font-mono text-cyan-500 mb-6 uppercase tracking-wider"
        >
          {#each post.categories as category}
            <span>{category}</span>
            <span class="text-slate-700">|</span>
          {/each}
          <span>{post.date.toLocaleDateString()}</span>
          <span class="text-slate-700">|</span>
          <span>{post.readTime}</span>
        </div>

        <h1
          class="text-3xl md:text-5xl font-bold text-slate-100 leading-tight mb-8"
        >
          {post.title}
        </h1>

        <img
          src={post.thumbnail}
          alt={post.title}
          class="w-full rounded-lg mb-8"
        />
      </header>

      <div
        class="prose prose-invert prose-lg text-slate-300 max-w-none leading-relaxed"
      >
        {@html post.content}
      </div>
    </article>
  </main>
</div>
