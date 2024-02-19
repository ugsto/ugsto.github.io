export function changeUrlLanguage(url: string, lang: string) {
  const parsedUrl = new URL(url);
  parsedUrl.pathname = parsedUrl.pathname.replace(/^\/\w+/, `/${lang}`);

  return parsedUrl.href;
}
