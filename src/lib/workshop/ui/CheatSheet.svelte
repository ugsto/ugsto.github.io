<script lang="ts">
  import type { WorkshopCommand } from '$lib/workshop/domain/models';

  let { title = 'Cheat Sheet', commands = [] } = $props<{
    title?: string;
    commands: WorkshopCommand[];
  }>();

  let open = $state(false);
</script>

<details bind:open class="group border border-slate-700/50 rounded-xl overflow-hidden my-6
                          bg-gradient-to-br from-slate-900/40 to-slate-800/20">
  <summary class="flex items-center gap-2 px-4 py-3 cursor-pointer select-none
                   text-cyan-300 hover:text-cyan-200 transition-colors text-sm font-medium list-none"
           onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') open = !open }}>
    <svg class="w-4 h-4 text-cyan-500/70 shrink-0" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="12" y2="17"/>
    </svg>
    <span>{title}</span>
    <span class="text-[10px] text-slate-600 font-normal">({commands.length} comandos)</span>
    <svg class="w-3.5 h-3.5 text-slate-600 group-open:rotate-180 transition-transform duration-200 ml-auto shrink-0"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  </summary>
  <div class="px-4 pb-4 space-y-1.5 border-t border-slate-800/30">
    {#each commands as { cmd, desc }}
      <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm py-1.5
                  border-b border-slate-800/20 last:border-0">
        <code class="text-cyan-200 bg-slate-950/70 px-2 py-0.5 rounded font-mono text-[12px] shrink-0">{cmd}</code>
        <span class="text-slate-500 text-xs">{desc}</span>
      </div>
    {/each}
  </div>
</details>
