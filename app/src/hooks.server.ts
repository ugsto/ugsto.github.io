import { defaultLocale, locales } from '$lib/translations';
import { parseAcceptLanguage } from '$lib/utils/parse-accept-language';
import { parsePathname } from '$lib/utils/parse-pathname';
import type { Handle } from '@sveltejs/kit';

function resolveLocaleFromPathname(supportedLocales: string[], pathname: string) {
  const { lang } = parsePathname(pathname);

  const matchLocale = supportedLocales.find((l) => l === lang.toLowerCase());

  if (matchLocale) {
    return matchLocale;
  }

  return undefined;
}

function resolveLocaleFromHeader(supportedLocales: string[], acceptLanguage?: string) {
  if (!acceptLanguage) {
    return undefined;
  }

  const langs = parseAcceptLanguage(acceptLanguage);

  const matchLocale = supportedLocales.find((l) => langs.includes(l));

  if (matchLocale) {
    return matchLocale;
  }

  return undefined;
}

export const handle: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  const { pathname } = url;

  const supportedLocales = locales.get().map((l) => l.toLowerCase());
  const pathLocale = resolveLocaleFromPathname(supportedLocales, pathname);

  if (!pathLocale) {
    const locale =
      resolveLocaleFromHeader(
        supportedLocales,
        request.headers.get('accept-language') ?? undefined
      ) ?? defaultLocale;

    if (pathname === '/') {
      return new Response(undefined, {
        headers: { location: `/${locale}.html` },
        status: 301
      });
    }

    return new Response(undefined, {
      headers: { location: `/${locale}${pathname}` },
      status: 301
    });
  }

  return resolve(
    { ...event, locals: { lang: pathLocale } },
    { transformPageChunk: ({ html }) => html.replace(/<html.*>/, `<html lang="${pathLocale}">`) }
  );
};
