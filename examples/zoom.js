// Zooming the waveform

import WaveSurfer from '../dist/wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio.wav',
  minPxPerSec: 100,
})

// Create a simple slider
/*
<html>
  <label>Zoom: <input type="range" min="10" max="1000" value="100" /></label>
  <label><input type="checkbox" checked /> Scroll bar</label>
  <button>Play/Pause</button>
</html>
*/

// Update the zoom level on slider change
wavesurfer.once('decode', () => {
  const slider = document.querySelector('input[type="range"]')
  const checkbox = document.querySelector('input[type="checkbox"]')
  const button = document.querySelector('button')

  slider.oninput = (e) => {
    const minPxPerSec = Number(e.target.value)
    wavesurfer.zoom(minPxPerSec)
  }

  checkbox.onchange = (e) => {
    wavesurfer.setOptions({
      hideScrollbar: !e.target.checked,
    })
  }

  button.onclick = () => {
    wavesurfer.playPause()
  }
})
