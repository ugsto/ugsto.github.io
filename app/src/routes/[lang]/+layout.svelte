<script lang="ts">
	import Header from '$lib/components/layout/header.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	import '../../app.css';
</script>

<div class="flex flex-col min-h-screen overflow-x-hidden">
	<Header />

	<div class="flex flex-col flex-grow">
		<slot />
	</div>

	<Footer />
</div>
