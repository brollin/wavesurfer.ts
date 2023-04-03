// A super-basic example

import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: 'https://wavesurfer-js.org/example/media/demo.wav',
})

wavesurfer.once('seekClick', () => {
  setTimeout(() => {
    wavesurfer.play()
  }, 100)
})
