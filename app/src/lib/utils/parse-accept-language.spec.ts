import { describe, test, expect } from 'vitest';
import { parseAcceptLanguage } from './parse-accept-language';

describe('parseAcceptLanguage', () => {
	test('should correctly parse a single language without quality factor', () => {
		expect(parseAcceptLanguage('en')).toEqual(['en']);
	});

	test('should correctly parse multiple languages without quality factors', () => {
		expect(parseAcceptLanguage('en,fr,de')).toEqual(['en', 'fr', 'de']);
	});

	test('should correctly parse a single language with quality factor', () => {
		expect(parseAcceptLanguage('en;q=0.8')).toEqual(['en']);
	});

	test('should correctly parse multiple languages with quality factors', () => {
		expect(parseAcceptLanguage('en;q=0.8,fr;q=0.9,de;q=0.7')).toEqual(['en', 'fr', 'de']);
	});

	test('should handle quality factors and no quality factors together', () => {
		expect(parseAcceptLanguage('en,fr;q=0.9,de;q=0.7')).toEqual(['en', 'fr', 'de']);
	});

	test('should return an empty array for an empty string', () => {
		expect(parseAcceptLanguage('')).toEqual([]);
	});

	test('should handle invalid quality factors by ignoring them', () => {
		expect(parseAcceptLanguage('en;q=abc,fr;q=0.9,de')).toEqual(['en', 'fr', 'de']);
	});

	test('should handle spaces correctly', () => {
		expect(parseAcceptLanguage('en, fr;q=0.9, de;q=0.7')).toEqual(['en', 'fr', 'de']);
	});
});
