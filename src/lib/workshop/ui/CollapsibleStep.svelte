<script lang="ts">
  let { step, title, children } = $props<{
    step: number;
    title: string;
    children: import('svelte').Snippet;
  }>();

  let open = $state(false);
</script>

<details bind:open class="group border border-slate-800/70 rounded-xl overflow-hidden my-3
                          bg-slate-900/30 hover:border-slate-700/50 transition-all duration-200">
  <summary class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none
                   text-slate-400 hover:text-slate-200 transition-colors list-none"
           onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') open = !open }}>
    <span class="flex items-center justify-center w-6 h-6 rounded-full
                 bg-gradient-to-br from-cyan-500/30 to-blue-500/20
                 text-cyan-300 text-[11px] font-bold shrink-0
                 border border-cyan-500/20">
      {step}
    </span>
    <span class="text-sm font-medium flex-1">{title}</span>
    <svg class="w-3.5 h-3.5 text-slate-600 group-open:rotate-180 transition-transform duration-200 shrink-0"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  </summary>
  <div class="px-4 pb-4 pt-1 text-sm text-slate-400 leading-relaxed space-y-3
              border-t border-slate-800/30">
    {@render children()}
  </div>
</details>
