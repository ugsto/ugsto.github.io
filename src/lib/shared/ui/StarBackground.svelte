<script lang="ts">
  import { fade } from "svelte/transition";

  const stars = Array.from({ length: 50 }).map(() => ({
    top: Math.floor(Math.random() * 100),
    left: Math.floor(Math.random() * 100),
    opacity: Math.random() * 0.7 + 0.3,
    size: Math.random() * 2 + 1,
  }));
</script>

<div class="fixed inset-0 pointer-events-none z-0" transition:fade>
  {#each stars as star}
    <div
      class="absolute bg-white rounded-full opacity-0 animate-twinkle"
      style:top="{star.top}%"
      style:left="{star.left}%"
      style:width="{star.size}px"
      style:height="{star.size}px"
      style:opacity={star.opacity}
    ></div>
  {/each}
</div>
