<script>
	import { onMount } from 'svelte';
	import NavButton from '$lib/components/nav-button.svelte';

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
	class="container sticky flex flex-col sm:flex-row justify-between items-center top-0 gap-4 mx-auto p-2"
>
	<a class="flex items-center gap-4 w-fit" href="/">
		<img src="/favicon.svg" alt="logo" class="h-16 w-16" /><span
			class="font-mono font-bold text-2xl select-none">André Bortoli</span
		>
	</a>

	<nav>
		<ul class="flex gap-4">
			<li><NavButton isActive={activeSection === 'about'} href="#about">Sobre</NavButton></li>
			<li>
				<NavButton isActive={activeSection === 'projects'} href="#projects">Projetos</NavButton>
			</li>
			<li><NavButton isActive={activeSection === 'blog'} href="#blog">Blog</NavButton></li>
			<li>
				<NavButton isActive={activeSection === 'contact'} href="#contact">Contato</NavButton>
			</li>
		</ul>
	</nav>
</header>

<section id="about" class="bg-slate-8 w-screen h-screen"></section>
<section id="projects" class="bg-slate-12 w-screen h-screen"></section>
<section id="blog" class="bg-slate-8 w-screen h-screen"></section>
<section id="contact" class="bg-slate-12 w-screen h-screen"></section>
