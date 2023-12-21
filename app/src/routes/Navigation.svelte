<script>
	import NavigationLink from '$lib/components/NavigationLink.svelte';
</script>

<nav aria-label="primary">
	<ul class="flex space-x-4">
		<li>
			<NavigationLink href="/about">About Me</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#">Projects</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#">Blog</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#">Resume</NavigationLink>
		</li>
	</ul>
</nav>
