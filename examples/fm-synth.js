// A two-operator FM synth with a real-time waveform

import WaveSurfer from '../dist/wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  cursorColor: 'transparent',
  barWidth: 2,
  interact: false,
})

const audioContext = new AudioContext()
let analyser = null
let dataArray = null

function playFMNote(frequency, modulationFrequency, modulationDepth, duration) {
  // Carrier oscillator
  const carrierOsc = audioContext.createOscillator()
  carrierOsc.type = 'sine'
  carrierOsc.frequency.value = frequency

  // Modulator oscillator
  const modulatorOsc = audioContext.createOscillator()
  modulatorOsc.type = 'sine'
  modulatorOsc.frequency.value = modulationFrequency

  // Modulation depth
  const modulationGain = audioContext.createGain()
  modulationGain.gain.value = modulationDepth

  // Connect the modulator to the carrier frequency
  modulatorOsc.connect(modulationGain)
  modulationGain.connect(carrierOsc.frequency)

  // Create an output gain
  const outputGain = audioContext.createGain()
  outputGain.gain.setValueAtTime(0.8, audioContext.currentTime)
  outputGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

  // Connect carrier oscillator to output
  carrierOsc.connect(outputGain)

  analyser = audioContext.createAnalyser()
  analyser.fftSize = 512 * 2
  outputGain.connect(analyser)

  analyser.connect(audioContext.destination)

  // Start oscillators
  carrierOsc.start()
  modulatorOsc.start()

  // Stop oscillators after the duration
  carrierOsc.stop(audioContext.currentTime + duration)
  modulatorOsc.stop(audioContext.currentTime + duration)
}

function createPianoRoll() {
  const baseFrequency = 55
  const numRows = 5
  const numCols = 12

  const noteFrequency = (row, col) => {
    return baseFrequency * Math.pow(2, (col + row * numCols) / 12)
  }

  const pianoRoll = document.getElementById('pianoRoll')
  const qwerty = '`1234567890-=qwertyuiop[]\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+≠'

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const button = document.createElement('button')
      const key = qwerty[(row * numCols + col) % qwerty.length]
      button.textContent = key

      button.addEventListener('mousedown', () => {
        const frequency = noteFrequency(row, col)
        const modulationIndex = parseFloat(document.getElementById('modulationIndex').value)
        const modulationDepth = parseFloat(document.getElementById('modulationDepth').value)
        const duration = parseFloat(document.getElementById('duration').value)
        playFMNote(frequency, frequency * modulationIndex, modulationDepth, duration)
      })

      pianoRoll.appendChild(button)

      document.addEventListener('keydown', (e) => {
        if (e.key === key) {
          button.className = 'active'
          button.dispatchEvent(new MouseEvent('mousedown'))
        }
      })
      document.addEventListener('keyup', (e) => {
        if (e.key === key) {
          setTimeout(() => {
            button.className = ''
          }, duration * 1000)
        }
      })
    }
  }
}

function randomizeFmParams() {
  document.getElementById('modulationIndex').value = Math.random() * 10
  document.getElementById('modulationDepth').value = Math.random() * 200
  document.getElementById('duration').value = Math.random() * 5
}

// Draw the waveform
function drawWaveform() {
  if (!analyser) return

  if (!dataArray) {
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Float32Array(bufferLength)
  }

  // Get the waveform data from the analyser
  analyser.getFloatTimeDomainData(dataArray)

  waveform &&
    wavesurfer.load(
      '',
      [dataArray],
      parseFloat(document.getElementById('duration').value),
    )
}

function animate() {
  requestAnimationFrame(animate)
  drawWaveform()
}

createPianoRoll()
animate()
randomizeFmParams()

/*
<html>
  <style>
    label {
      display: inline-block;
      width: 150px;
    }
    #pianoRoll {
      margin-top: 1em;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(12, 6vw);
      grid-template-rows: repeat(5, 6vw);
      gap: 5px;
      user-select: none;
    }
    button {
      width: 100%;
      height: 100%;
      border: 1px solid #aaa;
      background-color: #fff;
      cursor: pointer;
    }
    button.active,
    button:active {
      background-color: #00f;
      color: #fff;
    }
  </style>
  <div>
    <label>Modulation Index:</label>
    <input type="range" min="0.5" max="10" value="2" step="0.5" id="modulationIndex">
  </div>
  <div>
    <label>Modulation Depth:</label>
    <input type="range" min="1" max="200" value="50" step="1" id="modulationDepth">
  </div>
  <div>
    <label>Duration (seconds):</label>
    <input type="range" min="0.1" max="5" value="2" step="0.1" id="duration">
  </div>
  <div id="pianoRoll"></div>
  <div id="waveform"></div>
</html>
*/
