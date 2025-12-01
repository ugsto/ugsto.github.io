<script lang="ts">
  import { fade } from "svelte/transition";
  import StarBackground from "$lib/shared/ui/StarBackground.svelte";
  import Navbar from "$lib/shared/ui/Navbar.svelte";
  import PostCard from "$lib/blog/ui/PostCard.svelte";
  import FeaturedPostCard from "$lib/blog/ui/FeaturedPostCard.svelte";
  import type { PageData } from "./$types";
  import * as m from "$lib/paraglide/messages";

  export let data: PageData;

  const categories = [m.blog_all(), ...data.categories];

  let searchQuery = "";
  let selectedCategory = m.blog_all();

  $: filteredPosts = data.posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === m.blog_all() ||
      post.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });
  $: isDefaultView = searchQuery === "" && selectedCategory === m.blog_all();
  $: gridPosts = isDefaultView
    ? filteredPosts.filter((p) => !p.isFeatured)
    : filteredPosts;
</script>

<svelte:head>
  <title>Bortoli.phd | {m.blog_title()}</title>
</svelte:head>

<div
  class="min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white pb-20 overflow-x-hidden relative"
>
  <StarBackground />
  <Navbar />

  <main class="max-w-6xl mx-auto px-6 relative z-10 pt-10">
    <header class="mb-12 text-center md:text-left">
      <h1 class="text-4xl font-bold tracking-tight text-slate-100 mb-2">
        {m.blog_title()}
      </h1>
      <p class="text-slate-400">{m.blog_subtitle()}</p>
    </header>

    {#if isDefaultView && data.featuredPost}
      <FeaturedPostCard post={data.featuredPost} />
    {/if}

    <div
      class="sticky top-20 z-40 bg-slate-950/95 backdrop-blur py-4 mb-8 border-y border-slate-900/50 flex flex-col md:flex-row gap-4 justify-between items-center w-full"
    >
      <div
        class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar"
      >
        {#each categories as category}
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border {selectedCategory ===
            category
              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}"
            on:click={() => (selectedCategory = category)}
          >
            {category}
          </button>
        {/each}
      </div>

      <div class="relative w-full md:w-64">
        <input
          type="text"
          placeholder={m.blog_search_placeholder()}
          bind:value={searchQuery}
          class="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
        />
        <div
          class="absolute right-3 top-2.5 pointer-events-none text-slate-500"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><circle cx="11" cy="11" r="8"></circle><line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            ></line></svg
          >
        </div>
      </div>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
      transition:fade
    >
      {#each gridPosts as post (post.slug)}
        <PostCard {post} />
      {/each}
    </div>

    {#if gridPosts.length === 0}
      <div class="text-center py-20 text-slate-500">
        <p>{m.blog_no_results()}</p>
        <button
          class="text-cyan-400 mt-2 hover:underline"
          on:click={() => {
            searchQuery = "";
            selectedCategory = "All";
          }}
        >
          {m.blog_clear_filters()}
        </button>
      </div>
    {/if}
  </main>
</div>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
