import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-node creates a standalone Node server in build/
		adapter: adapter()
	}
};

export default config;
