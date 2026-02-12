import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-node creates a standalone Node server in build/
    adapter: adapter()
  },
  compilerOptions: {
    warningFilter: (warning) => {
      // Suppress state_referenced_locally warnings
      if (warning.code === 'state_referenced_locally') return false
      return true
    }
  },
}

export default config
