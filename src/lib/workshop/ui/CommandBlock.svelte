<script lang="ts">
  let { command, label = '', output = '' } = $props<{
    command: string;
    label?: string;
    output?: string;
  }>();

  let copied = $state(false);

  async function copyCmd() {
    await navigator.clipboard.writeText(command);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<div class="my-4 rounded-xl overflow-hidden border border-slate-800/70 bg-slate-950/80
            shadow-[0_0_20px_rgba(50,108,229,0.03)]">
  {#if label}
    <div class="px-4 py-1.5 text-[10px] text-slate-500 font-medium
                border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
      <span class="uppercase tracking-wider">{label}</span>
      <button onclick={copyCmd}
              class="text-slate-600 hover:text-cyan-400 transition-colors text-[9px]
                     uppercase tracking-wider">
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  {/if}
  <div class="flex">
    <!-- linha de prompt -->
    <div class="flex items-stretch">
      <div class="w-8 flex items-start justify-end pt-3 pr-1">
        <span class="text-emerald-500/60 text-xs font-mono">$</span>
      </div>
    </div>
    <pre class="flex-1 px-2 py-3 text-[13px] text-cyan-100 overflow-x-auto font-mono leading-relaxed
                whitespace-pre-wrap break-all">{command}</pre>
  </div>
  {#if output}
    <div class="border-t border-slate-800/50 px-4 py-2 text-xs text-slate-500 font-mono
                bg-slate-950/50 max-h-48 overflow-y-auto">
      {output}
    </div>
  {/if}
</div>
