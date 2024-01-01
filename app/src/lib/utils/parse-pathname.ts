import { defaultLocale } from '$lib/translations';

export function parsePathname(pathname: string) {
	const [, lang, ...rest] = pathname.split('/');
	const parsedLang = lang.toLowerCase().split('.').at(0) ?? defaultLocale;

	return { lang: parsedLang, route: rest.join('/') };
}
