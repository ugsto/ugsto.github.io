<script lang="ts">
  import { marked, type Token, type Tokens } from 'marked';
  import CommandBlock from './CommandBlock.svelte';
  import Callout from './Callout.svelte';
  import CheatSheet from './CheatSheet.svelte';
  import type { WorkshopCommand } from '$lib/workshop/domain/models';
  import { presentationMode } from '$lib/workshop/stores/presentation.svelte';

  let { content, slides } = $props<{ content: string; slides: string }>();

  function extractCheatsheet(md: string): { md: string; commands: WorkshopCommand[] } {
    const commands: WorkshopCommand[] = [];
    const cleaned = md.replace(/^```cheatsheet\s*\n([\s\S]*?)```/gm, (_m, body: string) => {
      body.trim().split('\n').filter(l => l.trim()).forEach(line => {
        const sep = line.indexOf('|');
        if (sep > 0) {
          commands.push({ cmd: line.slice(0, sep).trim(), desc: line.slice(sep + 1).trim() });
        }
      });
      return '';
    });
    return { md: cleaned, commands };
  }

  const source = $derived(presentationMode.enabled ? slides : content);
  const { commands } = $derived(extractCheatsheet(source));
  const tokens = $derived(marked.lexer(extractCheatsheet(source).md));

  function parseCallout(text: string): { type: 'info' | 'warning' | 'tip' | 'danger'; title: string; body: string } | null {
    const match = text.match(/^(⚠️|🚨|❗|!!)\s*(.*?)(?:\n|$)/);
    if (match) {
      const body = text.slice(match[0].length).trim();
      return { type: 'warning', title: match[2] || '', body };
    }
    const tipMatch = text.match(/^(💡|✅|✔️)\s*(.*?)(?:\n|$)/);
    if (tipMatch) {
      const body = text.slice(tipMatch[0].length).trim();
      return { type: 'tip', title: tipMatch[2] || '', body };
    }
    const infoMatch = text.match(/^(ℹ️|📘|📌)\s*(.*?)(?:\n|$)/);
    if (infoMatch) {
      const body = text.slice(infoMatch[0].length).trim();
      return { type: 'info', title: infoMatch[2] || '', body };
    }
    const dangerMatch = text.match(/^(🔥|⛔|❌)\s*(.*?)(?:\n|$)/);
    if (dangerMatch) {
      const body = text.slice(dangerMatch[0].length).trim();
      return { type: 'danger', title: dangerMatch[2] || '', body };
    }
    return null;
  }

  function renderInline(tokenList: Token[]): string {
    return tokenList.map(t => {
      if (t.type === 'text') return (t as Tokens.Text).text;
      if (t.type === 'strong') return `<strong>${renderInline((t as Tokens.Strong).tokens)}</strong>`;
      if (t.type === 'em') return `<em>${renderInline((t as Tokens.Em).tokens)}</em>`;
      if (t.type === 'codespan') return `<code>${(t as Tokens.Codespan).text}</code>`;
      if (t.type === 'link') return `<a href="${(t as Tokens.Link).href}">${renderInline((t as Tokens.Link).tokens)}</a>`;
      if (t.type === 'del') return `<del>${renderInline((t as Tokens.Del).tokens)}</del>`;
      return (t as { raw?: string }).raw ?? '';
    }).join('');
  }

  function renderInlineTokens(tokenList: Token[] | undefined): string {
    if (!tokenList) return '';
    return renderInline(tokenList);
  }

  function isShellLang(lang: string | undefined): boolean {
    if (!lang) return false;
    const l = lang.toLowerCase();
    return l === 'bash' || l === 'sh' || l === 'shell' || l === 'zsh' || l === 'console';
  }

  function getBlockquoteText(token: Tokens.Blockquote): string {
    return token.tokens
      .map(t => {
        if (t.type === 'paragraph') return renderInlineTokens(t.tokens);
        if (t.type === 'text') return t.text;
        return '';
      })
      .join('\n')
      .trim();
  }
</script>

<article class="workshop-content">
  {#each tokens as token}
    {#if token.type === 'heading'}
      {@const h = token as Tokens.Heading}
      {#if h.depth === 1}
        <h1 class="text-3xl md:text-4xl font-light tracking-tight text-slate-100 leading-tight mt-10 mb-4">
          {@html renderInlineTokens(h.tokens)}
        </h1>
      {:else if h.depth === 2}
        <h2 class="text-xl font-light tracking-tight text-slate-200 mt-10 mb-4">
          {@html renderInlineTokens(h.tokens)}
        </h2>
      {:else if h.depth === 3}
        <h3 class="text-lg font-light tracking-tight text-slate-300 mt-8 mb-3">
          {@html renderInlineTokens(h.tokens)}
        </h3>
      {:else}
        <h4 class="text-base font-medium text-slate-300 mt-6 mb-2">
          {@html renderInlineTokens(h.tokens)}
        </h4>
      {/if}

    {:else if token.type === 'paragraph'}
      <p class="text-slate-400 leading-relaxed mb-4">
        {@html renderInlineTokens((token as Tokens.Paragraph).tokens)}
      </p>

    {:else if token.type === 'code'}
      {@const code = token as Tokens.Code}
      {#if isShellLang(code.lang)}
        <CommandBlock command={code.text} label={code.lang === 'console' ? 'output' : 'terminal'} />
      {:else if code.lang}
        <div class="my-4 rounded-xl overflow-hidden border border-slate-800/70 bg-slate-950/80">
          {#if code.lang !== 'plaintext'}
            <div class="px-4 py-1.5 text-[10px] text-slate-500 font-medium border-b border-slate-800/50 bg-slate-900/30 uppercase tracking-wider">
              {code.lang}
            </div>
          {/if}
          <pre class="px-4 py-3 text-[13px] text-slate-300 overflow-x-auto font-mono leading-relaxed"><code>{code.text}</code></pre>
        </div>
      {:else}
        <pre class="my-4 rounded-xl overflow-hidden border border-slate-800/70 bg-slate-950/80 px-4 py-3 text-[13px] text-slate-300 overflow-x-auto font-mono leading-relaxed"><code>{code.text}</code></pre>
      {/if}

    {:else if token.type === 'blockquote'}
      {@const bq = token as Tokens.Blockquote}
      {@const bqText = getBlockquoteText(bq)}
      {@const callout = parseCallout(bqText)}
      {#if callout}
        <Callout type={callout.type} title={callout.title || undefined}>
          {#snippet children()}
            {@html marked.parseInline(callout.body)}
          {/snippet}
        </Callout>
      {:else}
        <blockquote class="my-4 border-l-4 border-cyan-500/30 bg-cyan-500/[0.02] rounded-r-lg py-3 px-4 text-slate-400">
          {@html marked.parse(bqText)}
        </blockquote>
      {/if}

    {:else if token.type === 'list'}
      {@const list = token as Tokens.List}
      {#if list.ordered}
        <ol class="list-decimal list-outside pl-6 mb-4 space-y-1 text-slate-400">
          {#each list.items as item}
            <li class="leading-relaxed">{@html marked.parseInline(item.text)}</li>
          {/each}
        </ol>
      {:else}
        <ul class="list-disc list-outside pl-6 mb-4 space-y-1 text-slate-400">
          {#each list.items as item}
            <li class="leading-relaxed">{@html marked.parseInline(item.text)}</li>
          {/each}
        </ul>
      {/if}

    {:else if token.type === 'table'}
      {@const table = token as Tokens.Table}
      <div class="my-5 overflow-x-auto rounded-xl border border-slate-800/70">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-900/50">
              {#each table.header as cell}
                <th class="px-4 py-2.5 text-left text-slate-300 font-medium">{@html marked.parseInline(cell.text)}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each table.rows as row}
              <tr class="border-t border-slate-800/50 hover:bg-slate-900/20 transition-colors">
                {#each row as cell}
                  <td class="px-4 py-2.5 text-slate-400">{@html marked.parseInline(cell.text)}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    {:else if token.type === 'hr'}
      <hr class="my-8 border-slate-800/50" />

    {:else if token.type === 'html'}
      {@html (token as Tokens.HTML).text}

    {:else if token.type === 'space'}
      <!-- ignore -->
    {/if}
  {/each}

  {#if commands.length > 0}
    <CheatSheet commands={commands} />
  {/if}
</article>
