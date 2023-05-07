// Spectrogram plugin

import WaveSurfer from '../dist/wavesurfer.js'
import Spectrogram from '../dist/plugins/spectrogram.js'

// Create an instance of WaveSurfer
const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/demo.wav',
  sampleRate: 22050,
})

// Initialize the Spectrogram plugin
ws.registerPlugin(
  Spectrogram.create({
    labels: true,
    height: 256,
  }),
)

// Play on click
ws.once('interaction', () => {
  ws.play()
})
