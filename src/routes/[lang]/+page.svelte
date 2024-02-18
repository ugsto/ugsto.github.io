<script>
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';
	import ThemeSwitch from '$lib/components/theme-switch.svelte';

	let activeSection = '';

	const sections = ['about', 'projects', 'blog', 'contact'];
	let offsets = [0];

	const checkActiveSection = () => {
		const pageOffset = window.scrollY + window.innerHeight / 3;

		offsets.forEach((offset, i) => {
			if (pageOffset >= offset && (!offsets[i + 1] || pageOffset < offsets[i + 1])) {
				activeSection = sections[i];
			}
		});
	};

	onMount(() => {
		offsets = sections.map((id) => {
			const el = document.getElementById(id);
			return el ? el.offsetTop : 0;
		});

		window.addEventListener('scroll', checkActiveSection);
		checkActiveSection();

		return () => {
			window.removeEventListener('scroll', checkActiveSection);
		};
	});
</script>

<header class="bg-slate-2 dark:bg-slate-d2">
	<div class="container flex flex-col sm:flex-row justify-between items-center mx-auto py-1">
		<a class="flex items-center rounded gap-2 w-fit p-1 bg-slate-a6 dark:bg-slate-da6" href="/">
			<img src="/favicon.svg" alt="logo" class="w-16" />
			<span class="font-mono font-bold text-2xl text-slate-12 dark:text-slate-d12 select-none">
				André Bortoli
			</span>
		</a>

		<nav aria-label="Main navigation">
			<ul class="flex gap-4">
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a6 hover:bg-slate-a7 dark:bg-slate-d6 dark:hover:bg-slate-d7 text-slate-12 dark:text-slate-d12"
						aria-current={activeSection === 'about' ? 'page' : undefined}
						href="#about">{$t('home.navigation.about')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a6 hover:bg-slate-a7 dark:bg-slate-d6 dark:hover:bg-slate-d7 text-slate-12 dark:text-slate-d12"
						aria-current={activeSection === 'projects' ? 'page' : undefined}
						href="#projects">{$t('home.navigation.projects')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a6 hover:bg-slate-a7 dark:bg-slate-d6 dark:hover:bg-slate-d7 text-slate-12 dark:text-slate-d12"
						aria-current={activeSection === 'blog' ? 'page' : undefined}
						href="#blog">{$t('home.navigation.blog')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-slate-a6 hover:bg-slate-a7 dark:bg-slate-d6 dark:hover:bg-slate-d7 text-slate-12 dark:text-slate-d12"
						aria-current={activeSection === 'contact' ? 'page' : undefined}
						href="#contact">{$t('home.navigation.contact')}</a
					>
				</li>
			</ul>
		</nav>

		<div>
			<ThemeSwitch />
		</div>
	</div>
</header>

<section id="about" class="bg-slate-8 w-screen h-screen"></section>
<section id="projects" class="bg-slate-12 w-screen h-screen"></section>
<section id="blog" class="bg-slate-8 w-screen h-screen"></section>
<section id="contact" class="bg-slate-12 w-screen h-screen"></section>
