<script>
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	import '../app.css';
</script>

<div class="flex flex-col min-h-screen overflow-x-hidden">
	<Header />

	<div class="flex flex-col flex-grow">
		<slot />
	</div>

	<Footer />
</div>
