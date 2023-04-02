import WaveSurfer from '../dist/wavesurfer.js'
import RegionsPlugin from '../dist/plugins/regions.js'

const audioUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

describe('WaveSurfer', () => {
  it('should be a function', () => {
    expect(RegionsPlugin).toBeInstanceOf(Function)
  })

  it('should instantiate with default options', async () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const wavesurfer = WaveSurfer.create({
      container: div,
      url: audioUrl,
    })

    const wsRegions = wavesurfer.registerPlugin(RegionsPlugin, {
      dragSelection: true,
    })

    expect(wsRegions).toBeInstanceOf(RegionsPlugin)

    await new Promise((resolve) => {
      wavesurfer.on('decode', resolve)
    })

    const region = wsRegions.add(1.4, 10, 'Hello', 'red')

    expect(region.element).toBeInstanceOf(HTMLElement)
    expect(region.element.style.backgroundColor).toBe('red')
    expect(region.element.textContent).toBe('Hello')

    wavesurfer.destroy()
  })
})
