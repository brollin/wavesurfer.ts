// Envelope plugin
// Graphical fade-in and fade-out and volume control

/*
<html>
  <button style="margin-bottom: 2em">Play</button>
  <label>Volume: 0</label>
</html>
*/

import WaveSurfer from 'wavesurfer.js'
import EnvelopePlugin from 'wavesurfer.js/dist/plugins/envelope.js'

// Create an instance of WaveSurfer
const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio.wav',
})

// Initialize the Envelope plugin
const envelope = wavesurfer.registerPlugin(EnvelopePlugin, {
  fadeInEnd: 5,
  fadeOutStart: 15,
  volume: 0.8,
  lineColor: 'rgba(255, 0, 0, 0.5)',
  lineWidth: 4,
  dragPointFill: 'rgba(0, 255, 255, 0.8)',
  dragPointStroke: 'rgba(0, 0, 0, 0.5)',
})

// Show the current volume
const volumeLabel = document.querySelector('label')
envelope.on('volume-change', ({ volume }) => {
  volumeLabel.textContent = `Volume: ${volume}`
})
wavesurfer.on('timeupdate', () => {
  const volume = envelope.getCurrentVolume().toFixed(2)
  volumeLabel.textContent = `Volume: ${volume}`
})

// Play/pause button
const button = document.querySelector('button')
wavesurfer.once('canplay', () => {
  button.onclick = () => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play()
  }
})
wavesurfer.on('play', () => {
  button.textContent = 'Pause'
})
wavesurfer.on('pause', () => {
  button.textContent = 'Play'
})
