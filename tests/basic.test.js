import WaveSurfer from '../dist/wavesurfer.js'

const audioUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

describe('WaveSurfer', () => {
  it('should be a function', () => {
    expect(WaveSurfer).toBeInstanceOf(Function)
    expect(WaveSurfer.create).toBeInstanceOf(Function)
  })

  it('should instantiate with default options', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const wavesurfer = WaveSurfer.create({
      container: div,
    })

    expect(wavesurfer).toBeInstanceOf(WaveSurfer)
    expect(wavesurfer.getDuration()).toBe(0)
    expect(wavesurfer.getVolume()).toBe(1)
    expect(wavesurfer.getDecodedData()).toBe(null)
    expect(div.clientHeight).toBe(0)

    wavesurfer.destroy()
  })

  it('should render a waveform', async () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const wavesurfer = WaveSurfer.create({
      container: div,
      url: audioUrl,
    })

    expect(wavesurfer).toBeInstanceOf(WaveSurfer)

    const { duration } = await new Promise((resolve) => {
      wavesurfer.on('decode', resolve)
    })

    expect(duration).toBe(21.2)

    expect(wavesurfer.getDuration()).toBe(duration)
    expect(wavesurfer.getVolume()).toBe(1)
    expect(wavesurfer.getDecodedData().duration).toBe(duration)

    wavesurfer.destroy()
  })

  it('should seek and play', async () => {
    const wavesurfer = WaveSurfer.create({
      container: document.body,
      url: audioUrl,
    })

    expect(wavesurfer).toBeInstanceOf(WaveSurfer)

    await new Promise((resolve) => {
      wavesurfer.on('decode', resolve)
    })

    expect(wavesurfer.getCurrentTime()).toBe(0)

    wavesurfer.seekTo(5)

    expect(wavesurfer.getCurrentTime()).toBe(5)

    wavesurfer.play()

    wavesurfer.destroy()
  })

  it('should zoom', async () => {
    const wavesurfer = WaveSurfer.create({
      container: document.body,
      url: audioUrl,
      minPxPerSec: 10,
    })

    expect(wavesurfer).toBeInstanceOf(WaveSurfer)

    await new Promise((resolve) => {
      wavesurfer.on('decode', resolve)
    })

    expect(wavesurfer.zoom(100))

    wavesurfer.destroy()
  })
})
