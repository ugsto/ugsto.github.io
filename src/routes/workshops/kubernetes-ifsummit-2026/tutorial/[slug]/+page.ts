import { workshopRepository } from '$lib/workshop/infrastructure/fs-workshop-repository';
import { getLocale } from '$lib/paraglide/runtime';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const slugs = await workshopRepository.getAllSlugs();
  return slugs.map((slug) => ({ slug }));
};

export const load: PageLoad = async ({ params }) => {
  const page = await workshopRepository.getBySlug(params.slug, getLocale());
  return { page };
};
