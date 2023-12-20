import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Iconst from 'unplugin-icons/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		Iconst({
			compiler: 'svelte'
		})
	]
});
