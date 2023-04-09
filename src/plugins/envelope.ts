import BasePlugin from '../base-plugin.js'
import type { WaveSurferPluginParams } from '../index.js'

export type EnvelopePluginOptions = {
  startTime?: number
  endTime?: number
  fadeInEnd?: number
  fadeOutStart?: number
  lineWidth?: string
  lineColor?: string
  dragPointFill?: string
  dragPointStroke?: string
}

const defaultOptions = {
  startTime: 0,
  endTime: 0,
  fadeInEnd: 0,
  fadeOutStart: 0,
  lineWidth: 4,
  lineColor: 'rgba(0, 0, 255, 0.5)',
  dragPointFill: 'rgba(255, 255, 255, 0.8)',
  dragPointStroke: 'rgba(255, 255, 255, 0.8)',
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
    this.options.lineColor = this.options.lineColor || defaultOptions.lineColor
    this.options.dragPointFill = this.options.dragPointFill || defaultOptions.dragPointFill
    this.options.dragPointStroke = this.options.dragPointStroke || defaultOptions.dragPointStroke

    this.subscriptions.push(
      this.wavesurfer.once('decode', ({ duration }) => {
        this.options.startTime = this.options.startTime || 0
        this.options.endTime = this.options.endTime || duration
        this.options.fadeInEnd = this.options.fadeInEnd || this.options.startTime
        this.options.fadeOutStart = this.options.fadeOutStart || this.options.endTime

        this.initWebAudio()
        this.initSvg()
        this.initFadeEffects()
      }),
    )

    let delay: ReturnType<typeof setTimeout>
    this.subscriptions.push(
      this.wavesurfer.on('zoom', () => {
        if (delay) clearTimeout(delay)
        delay = setTimeout(() => {
          this.svg?.remove()
          this.initSvg()
        }, 100)
      }),
    )
  }

  private makeDraggable(draggable: SVGElement, onDrag: (dx: number, dy: number) => void) {
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

  private renderPolyline() {
    if (!this.svg) return

    const pointSize = 5 // the radius of the draggable points
    const polyline = this.svg.querySelector('polyline') as SVGPolylineElement
    const points = polyline.points
    const top = points.getItem(1).y + pointSize / 2

    const line = this.svg.querySelector('line') as SVGLineElement
    line.setAttribute('x1', points.getItem(1).x.toString())
    line.setAttribute('x2', points.getItem(2).x.toString())
    line.setAttribute('y1', top.toString())
    line.setAttribute('y2', top.toString())

    const circles = this.svg.querySelectorAll('circle')
    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i]
      const index = parseInt(circle.getAttribute('data-index') || '0')
      const point = polyline.points.getItem(index)
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', top.toString())
    }
  }

  private initSvg() {
    const pointSize = 5 // the radius of the draggable points
    const width = this.wrapper.clientWidth
    const height = this.wrapper.clientHeight
    const duration = this.wavesurfer.getDuration()
    const top = height - this.volume * height

    // SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('preserveAspectRatio', 'none')
    svg.setAttribute('style', 'position: absolute; left: 0; top: 0; z-index: 4; pointer-events: none;')
    this.svg = svg

    // A polyline representing the envelope
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    polyline.setAttribute('points', '0,0 0,0 0,0 0,0')
    polyline.setAttribute('stroke', this.options.lineColor)
    polyline.setAttribute('stroke-width', this.options.lineWidth)
    polyline.setAttribute('fill', 'none')
    polyline.setAttribute('style', 'pointer-events: none')
    svg.appendChild(polyline)

    // Draggable top line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('stroke', 'transparent')
    line.setAttribute('stroke-width', (this.options.lineWidth * 3).toString())
    line.setAttribute('style', 'cursor: ns-resize; pointer-events: all;')
    svg.appendChild(line)

    const points = polyline.points
    const start = (this.options.startTime / duration) * width
    const fadeInEnd = (this.options.fadeInEnd / duration) * width
    const fadeOutStart = (this.options.fadeOutStart / duration) * width
    const end = (this.options.endTime / duration) * width
    points.getItem(0).x = start + pointSize / 2
    points.getItem(0).y = height - pointSize / 2
    points.getItem(1).x = fadeInEnd + pointSize / 2
    points.getItem(1).y = top + pointSize / 2
    points.getItem(2).x = fadeOutStart - pointSize / 2
    points.getItem(2).y = top + pointSize / 2
    points.getItem(3).x = end - pointSize / 2
    points.getItem(3).y = height - pointSize / 2

    const onTopDrag = (dy: number) => {
      const top = points.getItem(1).y
      if (top + dy < 0) return
      points.getItem(1).y += dy
      points.getItem(2).y += dy
      this.renderPolyline()
      this.onVolumeChange((height - top) / height)
    }

    // Draggable top line of the polyline
    this.makeDraggable(line, (_, dy) => onTopDrag(dy))

    // Initial polyline
    this.renderPolyline()

    // Drag points
    for (let i = 0; i < points.numberOfItems; i++) {
      const point = points.getItem(i)
      if (point.y > pointSize / 2) continue
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', (point.y + pointSize / 2).toString())
      circle.setAttribute('r', pointSize.toString())
      circle.setAttribute('fill', this.options.dragPointFill)
      circle.setAttribute('stroke', this.options.dragPointStroke || this.options.dragPointFill)
      circle.setAttribute('stroke-width', '2')
      circle.setAttribute('data-index', i.toString())
      circle.setAttribute('style', 'cursor: ew-resize; pointer-events: all;')
      svg.appendChild(circle)
    }

    // Make each point draggable
    const draggables = svg.querySelectorAll('circle')
    for (let i = 0; i < draggables.length; i++) {
      const draggable = draggables[i]
      const index = parseInt(draggable.getAttribute('data-index') || '0')

      this.makeDraggable(draggable, (dx, dy) => {
        const point = polyline.points.getItem(index)
        const newX = point.x + dx
        const newTime = (newX / width) * duration

        if ((i === 0 && newTime > this.options.fadeOutStart) || newTime < this.options.startTime) return
        if ((i === 1 && newTime < this.options.fadeInEnd) || newTime > this.options.endTime) return

        point.x = newX

        if (i === 0) {
          this.options.fadeInEnd = newTime
          this.emit('fade-in-change', { time: newTime })
        } else if (i === 1) {
          this.options.fadeOutStart = newTime
          this.emit('fade-out-change', { time: newTime })
        }

        if (Math.abs(dy) > 1) {
          onTopDrag(dy)
        } else {
          this.renderPolyline()
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
    this.gainNode.gain.value = audio.volume

    // Create a MediaElementAudioSourceNode using the audio element
    const source = audioContext.createMediaElementSource(audio)

    // Connect the source to the GainNode, and the GainNode to the destination (speakers)
    source.connect(this.gainNode)
    this.gainNode.connect(audioContext.destination)

    this.audioContext = audioContext
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

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

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
      if (!this.isFadingOut && currentTime >= this.options.fadeOutStart && currentTime <= this.options.endTime) {
        this.isFadingOut = true
        // Set the target gain (volume) to 0 (silent) over N seconds
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + (this.options.endTime - currentTime),
        )
        return
      }

      // Reset fade in/out
      let cancelRamp = false
      if (this.isFadingIn && (currentTime < this.options.startTime || currentTime > this.options.fadeInEnd)) {
        this.isFadingIn = false
        cancelRamp = true
      }
      if (this.isFadingOut && (currentTime < this.options.fadeOutStart || currentTime >= this.options.endTime)) {
        this.isFadingOut = false
        cancelRamp = true
      }
      if (cancelRamp) {
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime)
        this.gainNode.gain.value = this.volume
      }
    })

    this.subscriptions.push(unsub)
  }
}

export default EnvelopePlugin
