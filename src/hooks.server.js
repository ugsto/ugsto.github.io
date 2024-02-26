import { parsePathname } from '$lib/utils/parse-pathname';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  const { url } = event;
  const { pathname } = url;
  const { lang } = parsePathname(pathname);

  return resolve(
    { ...event, locals: { lang } },
    {
      transformPageChunk({ html }) {
        return html.replace(/<html.*>/, `<html lang="${lang}">`);
      }
    }
  );
};

export const prerender = true;
