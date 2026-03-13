import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@tailwindcss/postcss'),
      ],
    },
  },
});
