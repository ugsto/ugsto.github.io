import { loadTranslations } from '$lib/translations';
import { parsePathname } from '$lib/utils/parse-pathname';

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ url }) => {
  const { pathname } = url;

  const { lang, route } = parsePathname(pathname);

  await loadTranslations(lang, pathname);

  return { route, lang };
};

export const prerender = true;
