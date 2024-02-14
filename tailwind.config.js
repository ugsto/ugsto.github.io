import * as radixColors from '@radix-ui/colors';

/**
 * @param {Record<string, Record<string, string>>} colors
 * @returns {string[]}
 */
function getColorNames(colors) {
	const COLOR_NAME_REGEX = /^[a-z]+$/;
	const names = Object.keys(colors).filter((colorName) => COLOR_NAME_REGEX.test(colorName));

	const validNames = names.filter((colorName) => {
		const color = colors[colorName];
		const colorAlpha = colors[`${colorName}A`];
		const colorDark = colors[`${colorName}Dark`];
		const colorDarkAlpha = colors[`${colorName}DarkA`];

		return (
			color !== undefined &&
			colorAlpha !== undefined &&
			colorDark !== undefined &&
			colorDarkAlpha !== undefined
		);
	});

	return validNames;
}

/**
 * @param {Record<string, Record<string, string>>} colors
 * @param {string} colorName
 * @returns {Record<string, string>}
 */
function getColorScale(colors, colorName) {
	const colorArr = Object.values(colors[colorName]);
	const colorAlphaArr = Object.values(colors[`${colorName}A`]);
	const colorDarkArr = Object.values(colors[`${colorName}Dark`]);
	const colorDarkAlphaArr = Object.values(colors[`${colorName}DarkA`]);

	const scale = Array.from({ length: colorArr.length }, (_, i) => [
		[`${i + 1}`, colorArr[i]],
		[`a${i + 1}`, colorAlphaArr[i]],
		[`d${i + 1}`, colorDarkArr[i]],
		[`da${i + 1}`, colorDarkAlphaArr[i]]
	]).flat();

	return Object.fromEntries(scale);
}

/**
 * @type {Record<string, string>}
 */
const colors = getColorNames(radixColors)
	.filter((c) => c == 'slate')
	.reduce(
		(acc, colorName) => ({
			...acc,
			[colorName]: getColorScale(radixColors, colorName)
		}),
		{}
	);

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{js,ts,html,svelte}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors
		}
	},
	plugins: []
};
