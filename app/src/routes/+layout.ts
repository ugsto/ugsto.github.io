import { setLocale, setRoute } from '$lib/translations';
import { parsePathname } from '$lib/utils/parse-pathname';
import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ url }) => {
  const { pathname } = url;

  const { lang, route } = parsePathname(pathname);

  await setLocale(lang);
  await setRoute(route);

  return { route, lang };
};

export const prerender = true;
