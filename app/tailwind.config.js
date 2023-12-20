import {
	slate,
	slateA,
	slateDark,
	slateDarkA,
	indigo,
	indigoA,
	indigoDark,
	indigoDarkA
} from '@radix-ui/colors';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{js,ts,html,svelte}'],
	theme: {
		extend: {
			colors: {
				slate: generateScale(slate, slateA, slateDark, slateDarkA),
				indigo: generateScale(indigo, indigoA, indigoDark, indigoDarkA)
			}
		}
	},
	plugins: []
};

function colorToArray(color) {
	return Object.entries(color).map(([, v]) => v);
}

function generateScale(color, colorAlpha, colorDark, colorDarkAlpha) {
	const colorArr = colorToArray(color);
	const colorAlphaArr = colorToArray(colorAlpha);
	const colorDarkArr = colorToArray(colorDark);
	const colorDarkAlphaArr = colorToArray(colorDarkAlpha);

	const scale = Array.from({ length: 12 }, (_, i) => [
		[`${i + 1}`, colorArr[i]],
		[`a${i + 1}`, colorAlphaArr[i]],
		[`d${i + 1}`, colorDarkArr[i]],
		[`da${i + 1}`, colorDarkAlphaArr[i]]
	]).flat();

	return Object.fromEntries(scale);
}