<script>
  export let loading = true;
  let className = "";
  export { className as class };
</script>

<div
  class="
    transition-colors duration-300
    {className}
    {loading
    ? 'animate-pulse bg-gray-300 text-transparent select-none rounded'
    : ''}
  "
  aria-busy={loading}
  aria-hidden={loading}
>
  <div class={loading ? "invisible" : ""}>
    <slot />
  </div>
</div>
