// Zooming the waveform

import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio.wav',
  minPxPerSec: 10,
})

// Create a simple slider
/*
<html>
  Zoom: <input type="range" min="10" max="1000" value="10" />
</html>
*/
const slider = document.querySelector('input')

// Update the zoom level on slider change
wavesurfer.once('decode', () => {
  slider.oninput = (e) => {
    const minPxPerSec = Number(e.target.value)
    wavesurfer.zoom(minPxPerSec)
  }
})
