function parseEntry(entry: string) {
	const [lang, qFactor] = entry.split(';');

	if (qFactor) {
		const parsedQFactor = parseFloat(qFactor);

		if (!isNaN(parsedQFactor)) {
			return [lang, parsedQFactor] as const;
		}
	}

	return [lang, 1.0] as const;
}

export function parseAcceptLanguage(acceptLanguage: string) {
	return acceptLanguage
		.split(',')
		.map((entry) => entry.replace(/\sg/g, ' ').trim())
		.filter(Boolean)
		.map(parseEntry)
		.sort((a, b) => b[1] - a[1])
		.map((a) => a[0]);
}
