// Multi-track mixer

// Import wavesurfer and plugins
import Multitrack from 'wavesurfer.js/dist/plugins/multitrack.js'

// If you prefer a CDN, use this instead:
/*
  <script>
    window.WaveSurfer = {}
  </script>
  <script src="https://unpkg.com/wavesurfer.js@alpha/dist/wavesurfer.Multitrack.min.js"></script>
  <script>
    const Multitrack = window.WaveSurfer.Multitrack
  </script>
*/

// Call Multitrack.create to initialize the multitrack mixer
// Pass the tracks array and WaveSurfer options with a container element
const multitrack = Multitrack.create(
  [
    {
      id: 0,
      draggable: true,
    },
    {
      id: 1,
      draggable: false,
      startPosition: 10,
      startCue: 0,
      endCue: null,
      url: 'https://wavesurfer-js.org/example/media/nasa.mp4',
      markers: [
        {
          time: 7,
          label: 'M1',
          color: 'hsla(600, 100%, 30%, 0.5)',
        },
        {
          time: 13,
          label: 'M2',
          color: 'hsla(400, 100%, 30%, 0.5)',
        },
        {
          time: 89,
          label: 'M3',
          color: 'hsla(200, 50%, 70%, 0.5)',
        },
      ],
      // peaks: [ [ 0, 0, 2.567, -2.454, 10.5645 ] ], // optional pre-generated peaks
    },
    {
      id: 2,
      draggable: true,
      startPosition: 1, // start time relative to the entire multitrack
      startCue: 2.1, // when the track actually starts playing (relative to the track)
      endCue: 10, // when the track ends (relative to the track)
      url: 'https://wavesurfer-js.org/example/media/demo.wav',
    },
  ],
  {
    container: document.body, // required!
    minPxPerSec: 10, // zoom level
    waveColor: '#fff',
    progressColor: '#777',
    cursorColor: '#D72F21',
    trackBackground: '#2D2D2D',
    trackBorderColor: '#7C7C7C',
    cueColor: '#aaa',
    onTrackPositionUpdate: (trackId, startPosition) => {
      console.log(`Track ${trackId} start position updated to ${startPosition}`)
    },
  },
)

// Page styles
document.body.style.background = '#161313'
document.body.style.color = '#fff'

// Play/pause button
const button = document.createElement('button')
button.textContent = 'Play'
button.style.marginTop = '1em'
document.body.appendChild(button)
button.addEventListener('click', () => {
  multitrack.isPlaying() ? multitrack.pause() : multitrack.play()
  button.textContent = multitrack.isPlaying() ? 'Pause' : 'Play'
})

// Zoom
const slider = document.createElement('input')
slider.type = 'range'
slider.value = 10
slider.min = 10
slider.max = 100
document.body.appendChild(slider)
slider.addEventListener('input', () => {
  multitrack.zoom(Number(slider.value))
})

// Destroy all wavesurfer instances on unmount
// This should be called before calling initMultiTrack again to properly clean up
window.addEventListener('beforeunload', () => {
  multitrack.destroy()
})
