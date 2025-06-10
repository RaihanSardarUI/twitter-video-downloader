/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				twitter: '#1DA1F2',
				'twitter-dark': '#1A91DA',
			}
		},
	},
	plugins: [],
} 