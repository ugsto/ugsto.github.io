import { supportedLocales } from '$lib/translations';

export function entries() {
	return supportedLocales.map((lang) => ({ lang: lang.toLowerCase() }));
}
