<script>
	import { t } from '$lib/translations';
	import ThemeSwitch from '$lib/components/theme-switch.svelte';
	import { locale } from '$lib/translations';
	import LanguageSwitch from '$lib/components/language-switch.svelte';
	import Carousel from '$lib/components/carousel.svelte';
	import LinkedinIcon from 'virtual:icons/mdi/linkedin';
	import GithubIcon from 'virtual:icons/mdi/github';
	import PhoneIcon from 'virtual:icons/mdi/phone';
	import StarryBackground from '$lib/components/starry-background.svelte';
</script>

<header class="bg-iris-2 dark:bg-iris-d2 shadow-xl">
	<div
		class="container flex flex-col lg:flex-row gap-4 justify-between items-center mx-auto px-2 py-4 md:py-1"
	>
		<a
			class="flex items-center rounded gap-2 w-fit pl-2 pr-4 bg-iris-4 dark:bg-iris-d9"
			href={`/${$locale}.html`}
		>
			<img src="/favicon.svg" alt="logo" class="py-0.5 h-16 w-16" style="font-size: 0" />
			<span class="font-mono font-bold text-2xl text-iris-12 dark:text-iris-d12 select-none">
				André Bortoli
			</span>
		</a>

		<nav aria-label="Main navigation">
			<ul class="flex gap-4">
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#about">{$t('home.navigation.about')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#projects">{$t('home.navigation.projects')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
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
	class="relative flex items-center justify-center min-h-screen w-screen max-w-full py-4 px-2"
>
	<div
		class="container flex flex-col md:flex-row items-center justify-around py-4 rounded-2xl backdrop-blur-sm bg-iris-9/30 overflow-hidden"
	>
		<img
			src="/profile.jpg"
			alt="profile"
			class="rounded-full h-64 w-64 my-4 mx-8 shadow-[0_0_4px_0]"
		/>
		<div>
			<h2
				class="text-2xl font-bold mb-4 text-iris-12 dark:text-iris-d12 md:rounded-l-md bg-slate-4 dark:bg-sky-d2 py-1 pl-2 pr-4 shadow dark:shadow-iris-d3"
			>
				{$t('home.hero.title')}
			</h2>
			<p
				class="text-justify text-iris-12 dark:text-iris-d11 md:rounded-l-md bg-slate-4 dark:bg-sky-d2 py-1 pl-2 pr-4 shadow dark:shadow-iris-d3"
			>
				{@html $t('home.hero.subtitle')}
			</p>
		</div>
	</div>
	<StarryBackground id="sky" />
</section>

<section
	id="projects"
	class="flex flex-col justify-between min-h-screen w-screen max-w-full bg-sky-1 dark:bg-sky-d1 py-4 px-2"
>
	<div class="flex flex-col items-center justify-center bg-iris-5 dark:bg-iris-d3 py-1">
		<h2 class="container text-2xl font-bold text-iris-12 dark:text-iris-d12 ml-4">
			{$t('home.projects.title')}
		</h2>
	</div>
	<Carousel
		id="projects-carousel"
		items={[
			{
				title: 'Griffin',
				href: 'https://github.com/ugsto/griffin',
				src: '/griffin-logo.svg',
				alt: 'Griffin project',
				description: $t('home.projects.griffin')
			},
			{
				title: 'Iemanja',
				href: 'https://github.com/ugsto/iemanjad',
				src: '/iemanja-logo.svg',
				alt: 'Iemanja project',
				description: $t('home.projects.iemanja')
			}
		]}
	/>
	<div />
</section>

<section
	id="contact"
	class="flex flex-col justify-between min-h-screen w-screen max-w-full bg-sky-1 dark:bg-sky-d1 py-4 px-2"
>
	<div class="flex flex-col items-center justify-center bg-iris-5 dark:bg-iris-d3 py-1">
		<h2 class="container text-2xl font-bold text-iris-12 dark:text-iris-d12 ml-4">
			{$t('home.contact.title')}
		</h2>
	</div>
  <p class="text-iris-12 dark:text-iris-d11 text-sm mx-auto">{$t('home.contact.whyremoveform')}</p>
	<ul class="flex items-center justify-center gap-4">
		<li>
			<a
				href="https://www.linkedin.com/in/andre-augusto-bortoli"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><LinkedinIcon /> LinkedIn</a
			>
		</li>
		<li>
			<a
				href="https://github.com/ugsto/"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><GithubIcon /> GitHub</a
			>
		</li>
		<li>
			<a
				href="tel:+55 45 98406-4088"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><PhoneIcon /> {$t('home.contact.phone')}</a
			>
		</li>
	</ul>
</section>

<footer class="flex flex-col w-screen max-w-full bg-sky-1 dark:bg-sky-d1 py-4 px-8">
	<p class="text-iris-12 dark:text-iris-d11 text-sm mx-auto">
		© 2023-2024 André Bortoli. All Rights Reserved.
	</p>
</footer>
