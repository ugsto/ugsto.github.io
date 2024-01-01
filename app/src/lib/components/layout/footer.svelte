<script>
	import LinkedInIcon from 'virtual:icons/mdi/linkedin';
	import GitHubIcon from 'virtual:icons/mdi/github';
	import EmailIcon from 'virtual:icons/mdi/email';
	import { t } from '$lib/translations';
</script>

<footer class="bg-slate-d9 dark:bg-slate-d3 text-slate-d12 dark:text-slate-d11 px-8">
	<section id="footer-contact" class="pt-4">
		<span class="block mb-2">{$t('common.footer.contact')}</span>
		<ul class="flex gap-4">
			<li>
				<a
					href="https://www.linkedin.com/in/andre-augusto-bortoli"
					target="_blank"
					class="inline-block"
					aria-label="LinkedIn"
				>
					<LinkedInIcon class="inline" />
					<span class="underline">LinkedIn</span>
				</a>
			</li>
			<li>
				<a href="https://github.com/ugsto" target="_blank" class="inline-block" aria-label="GitHub">
					<GitHubIcon class="inline" />
					<span class="underline">GitHub</span>
				</a>
			</li>
			<li>
				<a href="mailto:andre@bortoli.phd" class="inline-block" aria-label="Email">
					<EmailIcon class="inline" />
					<span class="underline">E-mail</span>
				</a>
			</li>
		</ul>
	</section>
	<section id="copyright" class="text-center py-4">
		<p>© 2024 André Augusto Bortoli. All rights reserved.</p>
	</section>
</footer>
