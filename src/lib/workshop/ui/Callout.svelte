<script lang="ts">
  let { type = 'info', title = '', children } = $props<{
    type: 'info' | 'warning' | 'tip' | 'danger';
    title?: string;
    children: import('svelte').Snippet;
  }>();

  const variants: Record<string, { border: string; bg: string; icon: string }> = {
    info:    { border: 'border-cyan-500/30', bg: 'bg-cyan-500/[0.03]', icon: 'i' },
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.03]', icon: '!' },
    tip:     { border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.03]', icon: '>' },
    danger:  { border: 'border-red-500/30', bg: 'bg-red-500/[0.03]', icon: '!!' },
  };

  const v = $derived(variants[type]);
</script>

<div class="my-5 border-l-4 rounded-r-lg p-4 {v.border} {v.bg}">
  <div class="flex gap-3">
    <span class="text-xs font-bold mt-0.5 shrink-0 w-5 text-center
                 {type === 'warning' ? 'text-amber-400' : ''}
                 {type === 'tip' ? 'text-emerald-400' : ''}
                 {type === 'danger' ? 'text-red-400' : ''}
                 {type === 'info' ? 'text-cyan-400' : ''}">
      {v.icon}
    </span>
    <div class="min-w-0">
      {#if title}
        <div class="text-sm font-semibold text-slate-200 mb-1">{title}</div>
      {/if}
      <div class="text-sm text-slate-400 space-y-2">
        {@render children()}
      </div>
    </div>
  </div>
</div>
