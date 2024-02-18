<script>
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';

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

<header
	class="container sm:sticky flex flex-col sm:flex-row justify-between items-center top-0 gap-4 mx-auto p-2 bg-slate-2 rounded-b-xl"
>
	<a class="flex items-center gap-4 w-fit" href="/">
		<img src="/favicon.svg" alt="logo" class="h-16 w-16" /><span
			class="font-mono font-bold text-2xl select-none">André Bortoli</span
		>
	</a>

	<nav aria-label="Main navigation">
		<ul class="flex gap-4">
			<li>
				<a
					class="inline-block px-3 py-2 rounded hover:bg-slate-4 bg-slate-3 text-slate-12"
					aria-current={activeSection === 'about' ? 'page' : undefined}
					href="#about">{$t('navigation.about')}</a
				>
			</li>
			<li>
				<a
					class="inline-block px-3 py-2 rounded hover:bg-slate-4 bg-slate-3 text-slate-12"
					aria-current={activeSection === 'projects' ? 'page' : undefined}
					href="#projects">Projetos</a
				>
			</li>
			<li>
				<a
					class="inline-block px-3 py-2 rounded hover:bg-slate-4 bg-slate-3 text-slate-12"
					aria-current={activeSection === 'blog' ? 'page' : undefined}
					href="#blog">Blog</a
				>
			</li>
			<li>
				<a
					class="inline-block px-3 py-2 rounded hover:bg-slate-4 bg-slate-3 text-slate-12"
					aria-current={activeSection === 'contact' ? 'page' : undefined}
					href="#contact">Contato</a
				>
			</li>
		</ul>
	</nav>
</header>

<section id="about" class="bg-slate-8 w-screen h-screen"></section>
<section id="projects" class="bg-slate-12 w-screen h-screen"></section>
<section id="blog" class="bg-slate-8 w-screen h-screen"></section>
<section id="contact" class="bg-slate-12 w-screen h-screen"></section>
