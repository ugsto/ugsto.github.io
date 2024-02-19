<script>
	import { t } from '$lib/translations';
	import ThemeSwitch from '$lib/components/theme-switch.svelte';
	import { locale } from '$lib/translations';
	import LanguageSwitch from '$lib/components/language-switch.svelte';
</script>

<header class="bg-slate-2 dark:bg-slate-d2">
	<div
		class="container flex flex-col md:flex-row gap-4 justify-between items-center mx-auto py-4 md:py-1"
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

<section id="about" class="bg-slate-8 w-screen h-screen"></section>
<section id="projects" class="bg-slate-12 w-screen h-screen"></section>
<section id="blog" class="bg-slate-8 w-screen h-screen"></section>
<section id="contact" class="bg-slate-12 w-screen h-screen"></section>
