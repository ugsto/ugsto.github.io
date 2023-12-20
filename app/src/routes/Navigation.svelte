<script>
	import NavigationLink from '$lib/components/NavigationLink.svelte';
</script>

<nav aria-label="primary">
	<ul class="flex space-x-4">
		<li>
			<NavigationLink href="/about">About Me</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#projects">Projects</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#blog">Blog</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#resume">Resume</NavigationLink>
		</li>
	</ul>
</nav>
