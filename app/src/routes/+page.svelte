<script lang="ts">
	import './star.css';
</script>

<svelte:head>
	<title>Andre Augusto Bortoli</title>
</svelte:head>

<section id="intro" class="py-12 relative">
	<div class="container mx-auto bg-slate-da9 py-4 rounded-2xl backdrop-blur-sm bg-slate-d1/30">
		<div class="flex flex-wrap items-center">
			<div class="w-full md:w-1/2 relative">
				<img
					src="/assets/profile.jpg"
					alt="Profile"
					class="rounded-full h-64 w-64 object-cover mx-auto my-4"
				/>
				<div
					class="absolute rounded-full h-64 w-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -inset-1 blur-md bg-gradient-to-br from-indigo-d8 via-indigo-8 to-indigo-d8 -z-10 overflow-hidden"
				></div>
			</div>
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
	>
		<script defer type="module">
			import init, {
				randomStars,
				plotStars
			} from '/scripts/star_background_map-pkg/star_background_map.js';

			const parent = document.querySelector('#stars');

			init().then(() => {
				plotStars(randomStars(50), parent);
			});
		</script>
	</div>
</section>

<section id="about" class="py-12">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">About Me</h2>
		<p class="text-gray-700">This section is coming soon! Stay tuned for updates.</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>Learn More</span
		>
	</div>
</section>

<section id="projects" class="py-12">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Highlighted Projects</h2>
		<p class="text-gray-700">Exciting projects are on the way. Check back soon!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>View All Projects</span
		>
	</div>
</section>

<section id="blog" class="py-12">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Blog</h2>
		<p class="text-gray-700">Blog updates are coming soon. Stay tuned!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>Visit My Blog</span
		>
	</div>
</section>

<section id="resume" class="py-12">
	<div class="container mx-auto">
		<h2 class="text-2xl font-bold mb-4">Resume</h2>
		<p class="text-gray-700">My resume will be available shortly. Thanks for your patience!</p>
		<span
			class="bg-indigo-9 text-slate-d12 px-4 py-2 rounded mt-4 inline-block opacity-50 cursor-not-allowed"
			>Download Resume</span
		>
	</div>
</section>
