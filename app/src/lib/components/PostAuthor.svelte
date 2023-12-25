<script lang="ts">
	import type { Author } from '$lib/schemas/AuthorSchema';

	export let author: Author;
	export let date: Date;
	export let readingTime: number;
</script>

<div class="flex items-center gap-4">
	<img src={author.picture} alt={author.name} class="w-10 h-10 rounded-full" />
	<div class="flex flex-col">
		<span
			class="whitespace-nowrap overflow-hidden text-ellipsis w-full text-slate-12 dark:text-slate-d12"
		>
			{author.name}
		</span>
		<p class="whitespace-nowrap text-sm text-slate-11 dark:text-slate-d11">
			Published <span class="text-slate-12 dark:text-slate-d12">{date.toLocaleDateString()}</span>
			<span class="mx-1">•</span>
			{readingTime} min read
		</p>
	</div>
</div>
