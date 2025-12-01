<script lang="ts">
  import type { BlogPostSummary } from "$lib/blog/domain/models";
  import { localizeUrl } from "$lib/paraglide/runtime";

  export let post: BlogPostSummary;
</script>

<div
  class="relative flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:bg-slate-900 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300 group"
>
  <div class="p-6 flex flex-col flex-grow">
    <div
      class="flex justify-between items-center text-xs font-mono text-slate-500 mb-3"
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
      <span>{post.readTime.toString()}</span>
    </div>

    <h3 class="text-xl font-bold text-slate-200 mb-2 group-hover:text-white">
      {post.title}
    </h3>

    <p class="text-slate-400 text-sm line-clamp-2 flex-grow">
      {post.excerpt}
    </p>

    <div
      class="mt-4 pt-4 border-t border-slate-800/50 flex items-center text-xs text-slate-500"
    >
      {post.date.toLocaleDateString()}
    </div>
  </div>

  <a
    href={localizeUrl(`/blog/${post.slug}`).toString()}
    class="absolute inset-0 z-20"
    aria-label="Read {post.title}"
  ></a>
</div>
