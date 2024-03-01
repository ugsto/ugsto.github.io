import i18n, { type Config } from 'sveltekit-i18n';
import { br } from './br';
import { en } from './en';
import { lang } from './lang';

const config: Config = {
	translations: {
		br: {
			...br,
			lang
		},
		en: {
			...en,
			lang
		}
	}
};

export const defaultLocale = 'en';
export const { t, locale, locales, loading, setLocale, setRoute, translations, loadTranslations } =
	new i18n(config);
export const supportedLocales = locales.get().map((l) => l.toLowerCase());
