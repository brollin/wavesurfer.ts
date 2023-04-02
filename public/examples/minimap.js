// Timeline plugin

import WaveSurfer from 'wavesurfer.js'
import MinimapPlugin from 'wavesurfer.js/dist/plugins/minimap.js'

// Create an instance of WaveSurfer
const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: 'https://wavesurfer-js.org/example/media/demo.wav',
  minPxPerSec: 100,
})

// Initialize the Timeline plugin
const minimap = ws.registerPlugin(MinimapPlugin, {
  height: 50,
  waveColor: '#ddd',
  progressColor: '#999',
})

ws.on('seeking', () => {
  ws.play()
})
