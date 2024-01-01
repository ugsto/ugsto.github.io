<script lang="ts">
	import NavigationLink from '$lib/components/layout/navigation-link.svelte';
	import { t, locale } from '$lib/translations';
</script>

<nav aria-label="primary">
	<ul class="flex space-x-4">
		<li>
			<NavigationLink href={`/${$locale}/about`}>{$t('common.navigation.about')}</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#">{$t('common.navigation.projects')}</NavigationLink>
		</li>
		<li>
			<NavigationLink href={`/${$locale}/blog/1`}>{$t('common.navigation.blog')}</NavigationLink>
		</li>
		<li>
			<NavigationLink href="#">{$t('common.navigation.resume')}</NavigationLink>
		</li>
	</ul>
</nav>
