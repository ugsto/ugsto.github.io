<script lang="ts">
  import type { BlogPostSummary } from "$lib/blog/domain/models";
  import { localizeHref } from "$lib/paraglide/runtime";
  import Skeleton from "./Skeleton.svelte";

  export let post: BlogPostSummary;

  let imageLoaded: boolean = false;
</script>

<section class="mb-16 w-full">
  <h2 class="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">
    Featured Article
  </h2>

  <div
    class="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors duration-300 group"
  >
    <div class="flex flex-col md:flex-row">
      <Skeleton
        loading={!imageLoaded}
        class="h-64 md:h-auto md:w-1/2 flex-shrink-0"
      >
        <img
          src={post.thumbnail}
          alt={post.title}
          class="w-full h-full object-cover"
          onload={() => (imageLoaded = true)}
          onerror={() => (imageLoaded = true)}
        />
      </Skeleton>

      <div class="p-8 md:p-12 md:w-1/2 flex flex-col justify-center">
        <div
          class="flex items-center gap-4 text-xs font-mono text-slate-400 mb-4"
        >
          <div class="flex gap-1">
            {#each post.categories as category}
              <span
                class="text-cyan-400 after:content-['|'] after:ml-1 after:text-slate-400 last:after:hidden"
              >
                {category}
              </span>
            {/each}
          </div>
          <span>•</span>
          <span>{post.date.toLocaleDateString()}</span>
        </div>

        <h3
          class="text-3xl font-bold text-white mb-4 group-hover:text-cyan-100 transition-colors"
        >
          {post.title}
        </h3>

        <p class="text-slate-400 text-lg mb-6">{post.excerpt}</p>

        <div
          class="inline-flex items-center text-sm font-bold text-cyan-400 gap-2"
        >
          Read Article <span
            class="group-hover:translate-x-1 transition-transform">→</span
          >
        </div>
      </div>
    </div>

    <a
      href={localizeHref(`/blog/${post.slug}`)}
      class="absolute inset-0 z-20"
      aria-label="Read {post.title}"
      data-sveltekit-reload
    ></a>
  </div>
</section>
