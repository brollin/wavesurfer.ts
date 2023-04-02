import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    copyPublicDir: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WaveSurfer',
      fileName: 'wavesurfer',
    },
    rollupOptions: {
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          wavesurfer: 'WaveSurfer',
        },
      },
    },
  },
})
