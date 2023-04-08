// Timeline plugin

import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'

// Create an instance of WaveSurfer
const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio.wav',
  minPxPerSec: 100,
})

// Initialize the Timeline plugin
const timeline = ws.registerPlugin(TimelinePlugin, {
  height: 20,
})

ws.once('seekClick', () => {
  setTimeout(() => {
    ws.play()
  }, 100)
})
