// Waveform for a video

// Create a video element
/*
<html>
  <video
    src="/examples/nasa.mp4"
    crossOrigin="anonymous"
    controls
    playsinline
    width="100%"
  />
</html>
*/

import WaveSurfer from '../dist/wavesurfer.js'

// Initialize wavesurfer.js
const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  // Pass the video element in the `media` param
  media: document.querySelector('video'),
})
