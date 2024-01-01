<script>
	import Paragraph from '$lib/components/Paragraph.svelte';
	import Title from '$lib/components/Title.svelte';
	import { t } from '$lib/translations';
</script>

<div class="py-12 px-8 bg-slate-2 dark:bg-slate-d2 flex-grow">
	<section id="about" class="container mx-auto">
		<Title>{$t('about.title')}</Title>
		<Paragraph extraClass="mb-2">{$t('about.greeting')}</Paragraph>

		{#each $t('about.content').split('\n') as content}
			<Paragraph>{content}</Paragraph>
		{/each}
	</section>
</div>
