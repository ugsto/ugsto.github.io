<script>
	import './star.css';
	import init, { randomStars, plotStars } from '$lib/wasm/starry_background/pkg/starry_background';
	import { t } from '$lib/translations';
	import ThemeSwitch from '$lib/components/theme-switch.svelte';
	import { locale } from '$lib/translations';
	import LanguageSwitch from '$lib/components/language-switch.svelte';
	import { onMount } from 'svelte';
	import Carousel from '$lib/components/carousel.svelte';
	import LinkedinIcon from 'virtual:icons/mdi/linkedin';
	import GithubIcon from 'virtual:icons/mdi/github';
	import MailIcon from 'virtual:icons/mdi/mail';
	import PhoneIcon from 'virtual:icons/mdi/phone';

	onMount(() => {
		init().then(() => {
			plotStars(randomStars(50), document.getElementById('sky'));
		});
	});
</script>

<header class="bg-iris-2 dark:bg-iris-d2 shadow-xl">
	<div
		class="container flex flex-col lg:flex-row gap-4 justify-between items-center mx-auto py-4 md:py-1"
	>
		<a
			class="flex items-center rounded gap-2 w-fit pl-2 pr-4 bg-iris-4 dark:bg-iris-d9"
			href={`/${$locale}`}
		>
			<img src="/favicon.svg" alt="logo" class="py-0.5 h-16 w-16" style="font-size: 0" />
			<span class="font-mono font-bold text-2xl text-iris-12 dark:text-iris-d12 select-none">
				André Bortoli
			</span>
		</a>

		<nav aria-label="Main navigation">
			<ul class="flex gap-4">
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#about">{$t('home.navigation.about')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#projects">{$t('home.navigation.projects')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#blog">{$t('home.navigation.blog')}</a
					>
				</li>
				<li>
					<a
						class="inline-block px-3 py-2 rounded bg-iris-4 hover:bg-iris-5 dark:bg-iris-d9 dark:hover:bg-iris-d10 text-iris-12 dark:text-slate-d12"
						href="#contact">{$t('home.navigation.contact')}</a
					>
				</li>
			</ul>
		</nav>

		<div class="flex items-center gap-4">
			<LanguageSwitch />
			<ThemeSwitch />
		</div>
	</div>
</header>

<section
	id="about"
	class="relative flex flex-col items-center justify-center gap-16 w-screen min-h-screen py-4"
>
	<div
		class="container flex flex-col md:flex-row items-center justify-around py-4 rounded-2xl backdrop-blur-sm bg-iris-9/30 mx-4 overflow-hidden"
	>
		<img
			src="/profile.jpg"
			alt="profile"
			class="rounded-full h-64 w-64 my-4 mx-8 shadow-[0_0_4px_0]"
		/>
		<div>
			<h2
				class="text-2xl font-bold mb-4 text-iris-12 dark:text-iris-d12 md:rounded-l-md bg-slate-4 dark:bg-sky-d2 py-1 pl-2 pr-4 shadow dark:shadow-iris-d3"
			>
				{$t('home.hero.title')}
			</h2>
			<p
				class="text-justify text-iris-12 dark:text-iris-d11 md:rounded-l-md bg-slate-4 dark:bg-sky-d2 py-1 pl-2 pr-4 shadow dark:shadow-iris-d3"
			>
				{$t('home.hero.subtitle')}
			</p>
		</div>
	</div>
	<div
		id="sky"
		class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-sky-9 dark:bg-sky-d1"
		aria-hidden="true"
	/>
</section>

<section id="projects" class="w-screen h-screen bg-sky-1 dark:bg-sky-d1 py-4">
	<div class="flex flex-col items-center justify-center bg-iris-5 dark:bg-iris-d3 py-1">
		<h2 class="container text-2xl font-bold text-iris-12 dark:text-iris-d12">
			{$t('home.projects.title')}
		</h2>
	</div>
	<Carousel
		id="projects-carousel"
		items={[
			{
				href: 'https://example.com',
				src: 'https://picsum.photos/200/300',
				alt: 'example',
				description: 'example'
			},
			{
				href: 'https://example.com',
				src: 'https://picsum.photos/200/301',
				alt: 'example',
				description: 'example'
			},
			{
				href: 'https://example.com',
				src: 'https://picsum.photos/200/302',
				alt: 'example',
				description: 'example'
			}
		]}
	/>
</section>

<!--
	<section id="blog" class="bg-iris-8 w-screen h-screen"></section>
-->

<section
	id="contact"
	class="flex flex-col justify-between w-screen h-screen bg-sky-1 dark:bg-sky-d1 py-4"
>
	<div class="flex flex-col items-center justify-center bg-iris-5 dark:bg-iris-d3 py-1">
		<h2 class="container text-2xl font-bold text-iris-12 dark:text-iris-d12">
			{$t('home.contact.title')}
		</h2>
	</div>
	<form
		class="container flex flex-col gap-4 mx-auto bg-iris-9/30 p-4 rounded-2xl"
		action="#"
		method="POST"
	>
		<h3 class="text-xl font-bold text-iris-12 dark:text-iris-d12">
			{$t('home.contact.email_forms.title')}
		</h3>
		<div class="flex flex-col gap-2">
			<label for="name" class="text-iris-12 dark:text-iris-d12"
				>{$t('home.contact.email_forms.fields.name.label')}</label
			>
			<input
				type="text"
				id="name"
				name="name"
				required
				class="px-3 py-2 rounded bg-iris-3 text-slate-12"
				placeholder={$t('home.contact.email_forms.fields.name.placeholder')}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="email" class="text-iris-12 dark:text-iris-d12"
				>{$t('home.contact.email_forms.fields.email.label')}</label
			>
			<input
				type="email"
				id="email"
				name="email"
				required
				class="px-3 py-2 rounded bg-iris-3 text-slate-12"
				placeholder={$t('home.contact.email_forms.fields.email.placeholder')}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="subject" class="text-iris-12 dark:text-iris-d12"
				>{$t('home.contact.email_forms.fields.subject.label')}</label
			>
			<input
				type="text"
				id="subject"
				name="subject"
				class="px-3 py-2 rounded bg-iris-3 text-slate-12"
				placeholder={$t('home.contact.email_forms.fields.subject.placeholder')}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="message" class="text-iris-12 dark:text-iris-d12"
				>{$t('home.contact.email_forms.fields.message.label')}</label
			>
			<textarea
				id="message"
				name="message"
				required
				rows="4"
				class="px-3 py-2 rounded bg-iris-3 text-slate-12"
				placeholder={$t('home.contact.email_forms.fields.message.placeholder')}
			></textarea>
		</div>
		<button
			type="submit"
			class="px-4 py-2 mt-4 w-40 rounded bg-iris-9 hover:bg-iris-10 text-iris-d12"
		>
			{$t('home.contact.email_forms.submit')}
		</button>
	</form>
	<ul class="flex items-center justify-center gap-4">
		<li>
			<a
				href="https://www.linkedin.com/in/andre-augusto-bortoli"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><LinkedinIcon /> LinkedIn</a
			>
		</li>
		<li>
			<a
				href="https://github.com/ugsto/"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><GithubIcon /> GitHub</a
			>
		</li>
		<li>
			<a
				href="tel:+55 45 98406-4088"
				target="_blank"
				class="inline-flex items-center text-iris-12 dark:text-iris-d11 gap-2 hover:underline"
				><PhoneIcon /> {$t('home.contact.phone')}</a
			>
		</li>
	</ul>
</section>

<footer class="flex flex-col w-screen bg-sky-1 dark:bg-sky-d1 py-4 px-8">
	<p class="text-iris-12 dark:text-iris-d11 text-sm mx-auto">
		© 2023-2024 André Bortoli. All Rights Reserved.
	</p>
</footer>
