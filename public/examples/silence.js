// Silence detection example

import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'

// Create an instance of WaveSurfer
const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: 'https://wavesurfer-js.org/example/media/nasa.mp4',
  minPxPerSec: 100,
})

// Initialize the Regions plugin
const wsRegions = ws.registerPlugin(RegionsPlugin)

// Find regions separated by silence
const extractRegions = (audioData, duration) => {
  const minValue = 0.005
  const minSilenceDuration = 0.05
  const mergeDuration = 0.2
  const scale = duration / audioData.length
  const silentRegions = []

  // Find all silent regions longer than minSilenceDuration
  let start = 0
  let end = 0
  let isSilent = false
  for (let i = 0; i < audioData.length; i++) {
    if (audioData[i] < minValue) {
      if (!isSilent) {
        start = i
        isSilent = true
      }
    } else if (isSilent) {
      end = i
      isSilent = false
      if (scale * (end - start) > minSilenceDuration) {
        silentRegions.push({
          start: scale * start,
          end: scale * end,
        })
      }
    }
  }

  // Merge silent regions that are close together
  const mergedRegions = []
  let lastRegion = null
  for (let i = 0; i < silentRegions.length; i++) {
    if (lastRegion && silentRegions[i].start - lastRegion.end < mergeDuration) {
      lastRegion.end = silentRegions[i].end
    } else {
      lastRegion = silentRegions[i]
      mergedRegions.push(lastRegion)
    }
  }

  // Find regions that are not silent
  const regions = []
  let lastEnd = 0
  for (let i = 0; i < mergedRegions.length; i++) {
    regions.push({
      start: lastEnd,
      end: mergedRegions[i].start,
    })
    lastEnd = mergedRegions[i].end
  }

  return regions
}

// Create some regions at specific time ranges
ws.on('decode', ({ duration }) => {
  const decodedData = ws.getDecodedData()
  if (decodedData) {
    const regions = extractRegions(decodedData.getChannelData(0), duration)

    // Add regions to the waveform
    regions.forEach((region, index) => {
      wsRegions.add(region.start, region.end, index)
    })
  }
})

// Loop a region on click
wsRegions.on('region-clicked', ({ region }) => {
  ws.seekTo(region.startTime)
  ws.play()
  activeRegion = region
})

// Play on click not in a region
ws.on('seeking', () => {
  if (!activeRegion) ws.play()
})

let activeRegion = null
ws.on('timeupdate', ({ currentTime }) => {
  // When the end of the region is reached
  if (activeRegion && ws.isPlaying() && currentTime >= activeRegion.endTime) {
    // Otherwise, stop playing
    ws.pause()
    ws.seekTo(activeRegion.endTime)
    requestAnimationFrame(() => (activeRegion = null))
  }
})
