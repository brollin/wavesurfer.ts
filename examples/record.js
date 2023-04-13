// Record plugin

import WaveSurfer from '../dist/wavesurfer.js'
import RecordPlugin from '../dist/plugins/record.js'

// Create an instance of WaveSurfer
const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
})

// Initialize the Envelope plugin
const record = wavesurfer.registerPlugin(RecordPlugin.create())

// Add some controls

/*
<html>
  <style>
    button {
      margin: 0 2em 2em 0;
      min-width: 5em;
    }
  </style>
  <button id="record">Record</button>
  <button id="play" disabled>Play</button>
  <a style="display: none">Download audio</a>
</html>
*/

const recButton = document.querySelector('#record')
const playButton = document.querySelector('#play')

// Record
recButton.onclick = () => {
  if (wavesurfer.isPlaying()) {
    wavesurfer.pause()
  }

  if (record.isRecording()) {
    record.stopRecording()
    recButton.textContent = 'Record'
    playButton.disabled = false
    return
  }

  recButton.disabled = true

  record.startRecording().then(() => {
    recButton.textContent = '⏺ Stop'
    recButton.disabled = false
  })
}

// Play/pause
wavesurfer.once('canplay', () => {
  playButton.onclick = () => {
    wavesurfer.playPause()
  }
  wavesurfer.on('play', () => {
    playButton.textContent = 'Pause'
  })
  wavesurfer.on('pause', () => {
    playButton.textContent = 'Play'
  })
})

// Download link
const link = document.querySelector('a')
record.on('stopRecording', () => {
  link.href = record.getRecordedUrl()
  link.download = 'recording.webm'
  link.style.display = ''
})
record.on('startRecording', () => {
  link.href = ''
  link.download = ''
  link.style.display = 'none'
})
