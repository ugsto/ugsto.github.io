<script>
	import './star.css';
	import init, { randomStars, plotStars } from '$lib/starry_background-pkg/starry_background.js';
	import { onMount } from 'svelte';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import Title from '$lib/components/Title.svelte';
	import DisabledLinkButton from '$lib/components/DisabledLinkButton.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Paragraph from '$lib/components/Paragraph.svelte';
	import { locale, t } from '$lib/translations';

	onMount(() => {
		init().then(() => {
			plotStars(randomStars(50), document.querySelector('#stars'));
		});
	});
</script>

<svelte:head>
	<title>Andre Augusto Bortoli</title>
</svelte:head>

<main>
	<section id="intro" class="py-12 relative px-8">
		<div class="container mx-auto py-4 rounded-2xl backdrop-blur-sm bg-slate-d8/20">
			<div class="flex flex-wrap items-center">
				<ProfileAvatar />
				<div class="w-full md:w-1/2">
					<Title extraClass="md:rounded-l-2xl text-slate-d12 bg-slate-d3 py-1 pl-2 pr-4">
						{$t('home.header.title')}
					</Title>
					<Paragraph extraClass="md:rounded-l-2xl text-slate-d11 bg-slate-d3 py-1 pl-2 pr-4">
						{$t('home.header.greetings')}
					</Paragraph>
				</div>
			</div>
		</div>
		<div
			id="stars"
			class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-d3"
			aria-hidden="true"
		></div>
	</section>
</main>

{#each [{ section: 'about', enabled: true, link: `/${$locale}/about` }, { section: 'projects', enabled: false, link: '#' }, { section: 'blog', enabled: true, link: `/${$locale}/blog/1` }, { section: 'resume', enabled: false, link: '#' }] as sectionObj}
	<section id={sectionObj.section} class="py-12 px-8 bg-slate-2 dark:bg-slate-d2">
		<div class="container mx-auto">
			<Title>{$t(`home.${sectionObj.section}.title`)}</Title>
			<Paragraph>
				{$t(`home.${sectionObj.section}.description`)}
			</Paragraph>
			{#if sectionObj.enabled}
				<LinkButton href={sectionObj.link}
					>{$t(`home.${sectionObj.section}.callToAction`)}</LinkButton
				>
			{:else}
				<DisabledLinkButton>{$t(`home.${sectionObj.section}.callToAction`)}</DisabledLinkButton>
			{/if}
		</div>
	</section>
{/each}

<div class="bg-slate-2 dark:bg-slate-d2 flex-grow" />
