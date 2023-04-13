// SoundCloud-style bars

import WaveSurfer from '../dist/wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio.wav',

  // Set a bar width
  barWidth: 2,
  // Optionally, specify the spacing between bars
  barGap: 1,
  // And the bar radius
  barRadius: 2,
})

wavesurfer.once('interaction', () => {
  setTimeout(() => {
    wavesurfer.play()
  }, 100)
})
