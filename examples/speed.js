// Set the playback speed

/*
<html>
  <label>
    <input type="checkbox" checked />
    Preserve pitch
  </label>

  <div style="margin: 1em 0;">
    Speed:
    <button data-speed="0.5">x0.5</button>
    <button data-speed="1">x1</button>
    <button data-speed="2">x2</button>
    <button data-speed="4">x4</button>
  </div>
</html>
*/

import WaveSurfer from '../dist/wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/librivox.mp3',
})

let preservePitch = true
document.querySelector('input').addEventListener('change', (e) => {
  preservePitch = e.target.checked
  wavesurfer.setPlaybackRate(wavesurfer.getPlaybackRate(), preservePitch)
})

Array.from(document.querySelectorAll('button')).forEach((button) => {
  button.addEventListener('click', () => {
    wavesurfer.setPlaybackRate(parseFloat(button.dataset.speed), preservePitch)
    wavesurfer.play()
  })
})
