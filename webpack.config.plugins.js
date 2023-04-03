import path from 'path'
import mainConfig from './webpack.config.js'

export default {
  ...mainConfig,

  entry: {
    Regions: './src/plugins/regions.ts',
    Timeline: './src/plugins/timeline.ts',
    Minimap: './src/plugins/minimap.ts',
    Multitrack: './src/plugins/multitrack.ts',
  },

  output: {
    globalObject: 'WaveSurfer',
    library: '[name]',
    libraryTarget: 'umd',
    libraryExport: 'default',
    filename: 'wavesurfer.[name].min.js',
    path: path.resolve('./dist'),
  },
}
