<script>
	import Logo from '$lib/components/Logo.svelte';
	import Navigation from '$lib/components/layout/Navigation.svelte';
	import ActionButtons from '$lib/components/layout/ActionButtons.svelte';
</script>

<header class="p-5 bg-indigo-a8 dark:bg-indigo-d8">
	<div
		class="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center container mx-auto"
	>
		<Logo />
		<Navigation />
		<ActionButtons />
	</div>
</header>
