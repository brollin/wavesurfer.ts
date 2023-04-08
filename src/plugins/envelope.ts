import BasePlugin from '../base-plugin.js'
import type { WaveSurferPluginParams } from '../index.js'

export type EnvelopePluginOptions = {
  startTime?: number
  endTime?: number
  fadeInEnd?: number
  fadeOutStart?: number
}

const defaultOptions = {
  startTime: 0,
  endTime: 0,
  fadeInEnd: 0,
  fadeOutStart: 0,
}

type EnvelopePluginEvents = {
  'fade-in-change': { time: number }
  'fade-out-change': { time: number }
  'volume-change': { volume: number }
}

class EnvelopePlugin extends BasePlugin<EnvelopePluginEvents, EnvelopePluginOptions> {
  protected options: EnvelopePluginOptions & typeof defaultOptions
  private svg: SVGElement | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private volume = 1
  private isFadingIn = false
  private isFadingOut = false

  constructor(params: WaveSurferPluginParams, options: EnvelopePluginOptions) {
    super(params, options)

    this.options = Object.assign({}, defaultOptions, options)

    this.subscriptions.push(
      this.wavesurfer.once('canplay', ({ duration }) => {
        this.options.startTime = this.options.startTime || 0
        this.options.endTime = this.options.endTime || duration
        this.options.fadeInEnd = this.options.fadeInEnd || this.options.startTime
        this.options.fadeOutStart = this.options.fadeOutStart || this.options.endTime

        this.audioContext = this.initWebAudio()
        this.initSvg()
        this.initFadeEffects()
      }),
    )
  }

  makeDraggable(draggable: SVGElement, onDrag: (x: number, y: number) => void) {
    draggable.addEventListener('mousedown', (e) => {
      let x = e.clientX
      let y = e.clientY

      const move = (e: MouseEvent) => {
        const dx = e.clientX - x
        const dy = e.clientY - y
        x = e.clientX
        y = e.clientY
        onDrag(dx, dy)
      }

      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
      }

      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)

      e.preventDefault()
    })
  }

  private renderPolyline(top: number) {
    if (!this.svg) return

    const pointSize = 5 // the radius of the draggable points
    const width = this.wrapper.clientWidth
    const height = this.wrapper.clientHeight

    const duration = this.wavesurfer.getDuration()
    const start = (this.options.startTime / duration) * width
    const fadeInEnd = (this.options.fadeInEnd / duration) * width
    const fadeOutStart = (this.options.fadeOutStart / duration) * width
    const end = (this.options.endTime / duration) * width

    // A polyline representing the envelope
    const polyline = this.svg.querySelector('polyline') as SVGPolylineElement
    polyline.setAttribute(
      'points',
      `${start + pointSize / 2},${height - pointSize / 2} ${fadeInEnd + pointSize / 2},${top + pointSize / 2} ${
        fadeOutStart - pointSize / 2
      },${top + pointSize / 2} ${end - pointSize / 2},${height - pointSize / 2}`,
    )

    const circles = this.svg.querySelectorAll('circle')
    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i]
      const index = parseInt(circle.getAttribute('data-index') || '0')
      const point = polyline.points.getItem(index)
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', (point.y + pointSize / 2).toString())
    }
  }

  private initSvg() {
    const pointSize = 5 // the radius of the draggable points
    const width = this.wrapper.clientWidth
    const height = this.wrapper.clientHeight
    const duration = this.wavesurfer.getDuration()

    // SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('preserveAspectRatio', 'none')
    svg.style.position = 'absolute'
    svg.style.left = '0'
    svg.style.top = '0'
    svg.style.zIndex = '10'
    this.svg = svg

    // A polyline representing the envelope
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    polyline.setAttribute('stroke', 'rgba(0, 0, 255, 0.5)')
    polyline.setAttribute('stroke-width', '4')
    polyline.setAttribute('fill', 'transparent')
    polyline.setAttribute('style', 'cursor: ns-resize')
    svg.appendChild(polyline)

    // Initial polyline
    this.renderPolyline(0)

    // Draggable top line of the polyline
    let top = 0
    this.makeDraggable(polyline, (_, dy) => {
      if (top + dy < 0) return
      top += dy
      this.renderPolyline(top)
      this.onVolumeChange((height - top) / height)
    })

    // Drag points
    const points = polyline.points
    for (let i = 0; i < points.numberOfItems; i++) {
      const point = points.getItem(i)
      if (point.y > pointSize / 2) continue
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', (point.y + pointSize / 2).toString())
      circle.setAttribute('r', pointSize.toString())
      circle.setAttribute('fill', 'rgba(255, 255, 255, 0.5)')
      circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)')
      circle.setAttribute('stroke-width', '2')
      circle.setAttribute('data-index', i.toString())
      circle.setAttribute('style', 'cursor: ew-resize')
      svg.appendChild(circle)
    }

    // Make each point draggable
    const draggables = svg.querySelectorAll('circle')
    for (let i = 0; i < draggables.length; i++) {
      const draggable = draggables[i]
      const index = parseInt(draggable.getAttribute('data-index') || '0')

      this.makeDraggable(draggable, (dx) => {
        const point = polyline.points.getItem(index)
        const newX = point.x + dx
        const newTime = (newX / width) * duration

        if ((i === 0 && newTime > this.options.fadeOutStart) || newTime < this.options.startTime) return
        if ((i === 1 && newTime < this.options.fadeInEnd) || newTime > this.options.endTime) return

        point.x = newX
        draggable.setAttribute('cx', point.x.toString())

        if (i === 0) {
          this.options.fadeInEnd = newTime
          this.emit('fade-in-change', { time: newTime })
        } else if (i === 1) {
          this.options.fadeOutStart = newTime
          this.emit('fade-out-change', { time: newTime })
        }
      })
    }

    this.wrapper.appendChild(svg)

    return svg
  }

  public destroy() {
    this.svg?.remove()
    super.destroy()
  }

  private initWebAudio() {
    const audio = this.wavesurfer.getMediaElement()
    if (!audio) return null

    // Create an AudioContext
    const audioContext = new window.AudioContext()

    // Create a GainNode for controlling the volume
    this.gainNode = audioContext.createGain()

    // Create a MediaElementAudioSourceNode using the audio element
    const source = audioContext.createMediaElementSource(audio)

    // Connect the source to the GainNode, and the GainNode to the destination (speakers)
    source.connect(this.gainNode)
    this.gainNode.connect(audioContext.destination)

    return audioContext
  }

  private onVolumeChange(volume: number) {
    this.volume = volume
    this.emit('volume-change', { volume })
    if (!this.gainNode) return
    this.gainNode.gain.value = volume
  }

  private initFadeEffects() {
    if (!this.audioContext) return

    const unsub = this.wavesurfer.on('timeupdate', ({ currentTime }) => {
      if (!this.audioContext || !this.gainNode) return
      if (!this.wavesurfer.isPlaying()) return

      // Fade in
      if (!this.isFadingIn && currentTime >= this.options.startTime && currentTime <= this.options.fadeInEnd) {
        this.isFadingIn = true
        // Set the initial gain (volume) to 0 (silent)
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        // Set the target gain (volume) to 1 (full volume) over N seconds
        this.gainNode.gain.linearRampToValueAtTime(
          this.volume,
          this.audioContext.currentTime + (this.options.fadeInEnd - currentTime),
        )
        return
      }

      // Fade out
      if (!this.isFadingOut && currentTime >= this.options.fadeOutStart) {
        this.isFadingOut = true
        // Set the target gain (volume) to 0 (silent) over N seconds
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + (this.options.endTime - currentTime),
        )
        return
      }

      // Reset fade in/out
      if (currentTime < this.options.startTime || currentTime > this.options.fadeInEnd) {
        this.isFadingIn = false
      }
      if (currentTime < this.options.fadeOutStart || currentTime >= this.options.endTime) {
        this.isFadingOut = false
      }
    })

    this.subscriptions.push(unsub)
  }
}

export default EnvelopePlugin
