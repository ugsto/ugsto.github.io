<script>
	import './star.css';
	import init, { randomStars, plotStars } from '$lib/starry_background-pkg/starry_background.js';
	import { onMount } from 'svelte';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';

	onMount(() => {
		init().then(() => {
			plotStars(randomStars(50), document.querySelector('#stars'));
		});
	});
</script>

<svelte:head>
	<title>Andre Augusto Bortoli</title>
</svelte:head>

<section id="intro" class="py-12 relative px-8">
	<div class="container mx-auto py-4 rounded-2xl backdrop-blur-sm bg-slate-da9/20">
		<div class="flex flex-wrap items-center">
			<ProfileAvatar />
			<div class="w-full md:w-1/2">
				<h2
					class="md:rounded-l-2xl text-slate-d12 text-2xl font-bold mb-4 bg-slate-d8 py-1 pl-2 pr-4"
				>
					In the syntax of the universe, every bit ressonates
				</h2>
				<p class="md:rounded-l-2xl text-slate-d11 bg-slate-d8 py-1 pl-2 pr-4">
					Greetings, I'm André, Software and Cybersecurity Engineer, someone who harbors an
					enthusiasm for the intersection of cutting-edge technology and academic research. In my
					toolbox lies a diverse skill set that encompasses project management, programming and
					DevOps. While I'm not coding, you can find me philosophizing or playing chess.
				</p>
			</div>
		</div>
	</div>
	<div
		id="stars"
		class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-d8"
		aria-hidden="true"
	></div>
</section>

<section id="about" class="py-12 px-8">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">About Me</h2>
		<p class="text-slate-11">
			Driven by a passion for technology and security, I've cultivated a diverse skill set
			encompassing project management, programming, and DevOps. Outside the office, I enjoy
			exploring the latest tech trends and contributing to open-source projects. Discover more about
			me clicking on the button below.
		</p>
		<a href="/about" class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block"
			>Learn More</a
		>
	</div>
</section>

<section id="projects" class="py-12 px-8">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Highlighted Projects</h2>
		<p class="text-slate-11">Exciting projects are on the way. Check back soon!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>View All Projects</span
		>
	</div>
</section>

<section id="blog" class="py-12 px-8">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Blog</h2>
		<p class="text-slate-11">Blog updates are coming soon. Stay tuned!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>Visit My Blog</span
		>
	</div>
</section>

<section id="resume" class="py-12 px-8">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Resume</h2>
		<p class="text-slate-11">My resume will be available shortly. Thanks for your patience!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>Download Resume</span
		>
	</div>
</section>
