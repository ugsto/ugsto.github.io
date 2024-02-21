<script>
	import './star.css';
	import init, { randomStars, plotStars } from '$lib/wasm/starry_background/pkg/starry_background';
	import { t } from '$lib/translations';
	import ThemeSwitch from '$lib/components/theme-switch.svelte';
	import { locale } from '$lib/translations';
	import LanguageSwitch from '$lib/components/language-switch.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		init().then(() => {
			plotStars(randomStars(50), document.getElementById('stars'));
		});
	});
</script>

<header class="bg-slate-2 dark:bg-slate-d2">
	<div
		class="container flex flex-col lg:flex-row gap-4 justify-between items-center mx-auto py-4 md:py-1"
	>
		<a
			class="flex items-center rounded gap-2 w-fit py-1 pl-2 pr-4 bg-slate-a4 dark:bg-slate-da4"
			href={`/${$locale}`}
		>
			<img src="/favicon.svg" alt="logo" class="h-14 w-14" style="font-size: 0" />
			<span class="font-mono font-bold text-2xl text-slate-12 dark:text-slate-d12 select-none">
				André Bortoli
			</span>
		</a>

		<nav aria-label="Main navigation">
			<ul class="flex gap-4">
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a4 hover:bg-slate-a5 dark:bg-slate-da4 dark:hover:bg-slate-da5 text-slate-12 dark:text-slate-d12"
						href="#about">{$t('home.navigation.about')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a4 hover:bg-slate-a5 dark:bg-slate-da4 dark:hover:bg-slate-da5 text-slate-12 dark:text-slate-d12"
						href="#projects">{$t('home.navigation.projects')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a4 hover:bg-slate-a5 dark:bg-slate-da4 dark:hover:bg-slate-da5 text-slate-12 dark:text-slate-d12"
						href="#blog">{$t('home.navigation.blog')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a4 hover:bg-slate-a5 dark:bg-slate-da4 dark:hover:bg-slate-da5 text-slate-12 dark:text-slate-d12"
						href="#contact">{$t('home.navigation.contact')}</a
					>
				</li>
			</ul>
		</nav>

		<div class="flex items-center gap-4">
			<LanguageSwitch />
			<ThemeSwitch />
		</div>
	</div>
</header>

<section
	id="about"
	class="relative flex flex-col items-center justify-center gap-16 w-screen min-h-screen py-4"
>
	<div
		class="container flex flex-col md:flex-row items-center justify-around py-4 rounded-2xl backdrop-blur-sm bg-slate-8/20 dark:bg-slate-d8/20 mx-4"
	>
		<div class="relative min-h-64 min-w-64 mx-8">
			<img
				src="/profile.jpg"
				alt="profile"
				class="rounded-full h-64 w-64 object-cover mx-auto my-4"
			/>
			<div
				class="absolute rounded-full h-64 w-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -inset-1 blur-md bg-gradient-to-br from-indigo-d8 via-indigo-8 to-indigo-d8 -z-10 overflow-hidden"
			></div>
		</div>
		<div>
			<h2
				class="text-2xl font-bold mb-4 text-slate-d12 md:rounded-l-2xl bg-slate-d3 py-1 pl-2 pr-4"
			>
				{$t('home.hero.title')}
			</h2>
			<p class="text-justify text-slate-d11 md:rounded-l-2xl bg-slate-d3 py-1 pl-2 pr-4">
				{$t('home.hero.subtitle')}
			</p>
		</div>
	</div>
	<div
		id="stars"
		class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-d3"
		aria-hidden="true"
	></div>
</section>
<section id="projects" class="bg-slate-12 w-screen h-screen"></section>
<!--
	<section id="blog" class="bg-slate-8 w-screen h-screen"></section>
	<section id="contact" class="bg-slate-12 w-screen h-screen"></section>
-->
