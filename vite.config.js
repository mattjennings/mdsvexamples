import { sveltekit } from '@sveltejs/kit/vite'
import examples from './src/lib/vite.js'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit(), examples],
  resolve: {
    alias: {
      $routes: '/src/routes'
    }
  }
}

export default config
