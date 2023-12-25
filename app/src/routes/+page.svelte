<script>
	import './star.css';
	import init, { randomStars, plotStars } from '$lib/starry_background-pkg/starry_background.js';
	import { onMount } from 'svelte';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import Title from '$lib/components/Title.svelte';
	import DisabledLinkButton from '$lib/components/DisabledLinkButton.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import Paragraph from '$lib/components/Paragraph.svelte';

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
						In the syntax of the universe, every bit ressonates
					</Title>
					<Paragraph extraClass="md:rounded-l-2xl text-slate-d11 bg-slate-d3 py-1 pl-2 pr-4">
						Greetings, I'm André, Software and Cybersecurity Engineer, someone who harbors an
						enthusiasm for the intersection of cutting-edge technology and academic research. In my
						toolbox lies a diverse skill set that encompasses project management, programming and
						DevOps. While I'm not coding, you can find me philosophizing or playing chess.
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

<section id="about" class="py-12 px-8 bg-slate-2 dark:bg-slate-d2">
	<div class="container mx-auto">
		<Title>About Me</Title>
		<Paragraph>
			Driven by a passion for technology and security, I've cultivated a diverse skill set
			encompassing project management, programming, and DevOps. Outside the office, I enjoy
			exploring the latest tech trends. Discover more about me clicking on the button below.
		</Paragraph>
		<LinkButton href="/about">Learn More</LinkButton>
	</div>
</section>

<section id="projects" class="py-12 px-8 bg-slate-2 dark:bg-slate-d2">
	<div class="container mx-auto">
		<Title>Highlighted Projects</Title>
		<Paragraph>Exciting projects are on the way. Check back soon!</Paragraph>
		<DisabledLinkButton>View All Projects</DisabledLinkButton>
	</div>
</section>

<section id="blog" class="py-12 px-8 bg-slate-2 dark:bg-slate-d2">
	<div class="container mx-auto">
		<Title>Blog</Title>
		<Paragraph>
			Welcome to my blog! Here, I share insights and experiences cybersecurity. Whether you're a
			tech enthusiast or a fellow developer, I hope you find something of interest.
		</Paragraph>
		<LinkButton href="/blog/1">Visit My Blog</LinkButton>
	</div>
</section>

<section id="resume" class="py-12 px-8 bg-slate-2 dark:bg-slate-d2 flex-grow">
	<div class="container mx-auto">
		<Title>Resume</Title>
		<Paragraph>My resume will be available shortly. Thanks for your patience!</Paragraph>
		<DisabledLinkButton>Download Resume</DisabledLinkButton>
	</div>
</section>
