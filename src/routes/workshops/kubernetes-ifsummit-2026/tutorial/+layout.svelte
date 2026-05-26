<script lang="ts">
  import { page } from "$app/stores";
  import { localizeHref } from "$lib/paraglide/runtime";
  import { workshopRepository } from "$lib/workshop/infrastructure/fs-workshop-repository";
  import WorkshopLayout from "$lib/workshop/ui/WorkshopLayout.svelte";

  let { children } = $props();

  const currentPath = $derived($page.url.pathname);
</script>

<WorkshopLayout
  slugs={workshopRepository.getAllSlugs()}
  {currentPath}
  homeHref={localizeHref("/")}
  navTitle="kubernetes from scratch"
  dashboardHref={localizeHref("/workshops/kubernetes-ifsummit-2026/dashboard")}
>
  {@render children()}
</WorkshopLayout>
