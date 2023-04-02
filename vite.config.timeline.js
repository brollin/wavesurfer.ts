import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  publicDir: false,
  plugins: [dts()],
  build: {
    emptyOutDir: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/plugins/timeline.ts'),
      name: 'timeline',
      fileName: 'plugins/timeline',
    },
    rollupOptions: {
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          timeline: 'WaveSurfer.Timeline',
        },
      },
    },
  },
})
