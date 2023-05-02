import Pitchfinder from 'https://esm.sh/pitchfinder'
import WaveSurfer from '../dist/wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgba(200, 200, 200, 0.5)',
  progressColor: 'rgba(100, 100, 100, 0.5)',
  url: '/examples/librivox.mp3',
  minPxPerSec: 200,
})

const detectPitch = Pitchfinder.YIN({
  sampleRate: 8000,
})

wavesurfer.on('decode', () => {
  const float32Array = wavesurfer.getDecodedData().getChannelData(0)
  const bpm = float32Array.length / wavesurfer.getDuration() / 60

  const frequencies = Pitchfinder.frequencies(detectPitch, float32Array, {
    tempo: bpm,
    quantization: bpm,
  })

  // Render the frequencies on a canvas
  const baseFrequency = 350
  const height = 100
  const canvas = document.createElement('canvas')
  canvas.width = frequencies.length
  canvas.height = height
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  const ctx = canvas.getContext('2d')

  // Each frequency is a circle whose Y position is the frequency and X position is the time
  let prevY = 0
  frequencies.forEach((frequency, index) => {
    if (!frequency) return
    const y = Math.round(height - (frequency / baseFrequency) * height)

    ctx.fillStyle = y <= prevY ? '#385587' : '#C26351'
    prevY = y

    if (y === height / 2) return
    ctx.beginPath()
    ctx.arc(index, y, 1, 0, 2 * Math.PI)
    ctx.fill()
  })

  wavesurfer.renderer.getWrapper().appendChild(canvas)
})

wavesurfer.on('interaction', () => {
  wavesurfer.play()
})

const credit = document.createElement('p')
credit.align = 'right'
credit.innerHTML = 'Audio from <a href="https://librivox.org/">LibriVox</a>'
document.body.appendChild(credit)
