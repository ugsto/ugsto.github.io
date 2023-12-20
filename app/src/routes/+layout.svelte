<script>
	import LinkedInIcon from 'virtual:icons/mdi/linkedin';
	import GitHubIcon from 'virtual:icons/mdi/github';

	import '../app.css';
</script>

<header class="p-5 background-blur-sm bg-indigo-a8">
	<div class="container mx-auto flex justify-between items-center">
		<a href="/" class="flex items-center">
			<img src="/assets/logo.png" alt="Logo" class="h-10" aria-hidden="true" />
			<h1 class="text-slate-d12 text-xl font-bold ml-2">André Augusto Bortoli</h1>
		</a>
		<nav aria-label="primary">
			<ul class="flex space-x-4">
				<li><a href="#about" class="text-slate-d12">About Me</a></li>
				<li><a href="#projects" class="text-slate-d12">Projects</a></li>
				<li><a href="#blog" class="text-slate-d12">Blog</a></li>
				<li><a href="#resume" class="text-slate-d12">Resume</a></li>
			</ul>
		</nav>
	</div>
</header>

<main>
	<slot />
</main>

<footer class="bg-slate-d8 text-slate-d12">
	<div class="container mx-auto flex justify-between items-center py-4">
		<div>
			<p>
				Connect with me on
				<a href="https://www.linkedin.com/in/andre-augusto-bortoli" target="_blank">
					<LinkedInIcon class="inline" />
					<span class="underline">LinkedIn</span>
				</a>
				or
				<a href="https://github.com/ugsto" target="_blank">
					<GitHubIcon class="inline" />
					<span class="underline">GitHub</span>
				</a>. For collaborations or inquiries, feel free to reach out.
			</p>
		</div>
	</div>
	<div class="text-center py-4">
		<p>© 2023 André Augusto Bortoli. All rights reserved.</p>
	</div>
</footer>
