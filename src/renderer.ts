import EventEmitter from './event-emitter'

type RendererOptions = {
  container: HTMLElement | string | null
  height: number
  waveColor: string
  progressColor: string
  cursorColor?: string
  cursorWidth: number
  minPxPerSec: number
  fillParent: boolean
  barWidth?: number
  barGap?: number
  barRadius?: number
  noScrollbar?: boolean
}

type RendererEvents = {
  click: { relativeX: number }
}

class Renderer extends EventEmitter<RendererEvents> {
  private options: RendererOptions
  private container: HTMLElement
  private scrollContainer: HTMLElement
  private wrapper: HTMLElement
  private mainCanvas: HTMLCanvasElement
  private progressCanvas: HTMLCanvasElement
  private cursor: HTMLElement
  private ctx: CanvasRenderingContext2D
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor(options: RendererOptions) {
    super()

    this.options = options

    let container: HTMLElement | null = null
    if (typeof this.options.container === 'string') {
      container = document.querySelector(this.options.container)
    } else if (this.options.container instanceof HTMLElement) {
      container = this.options.container
    }
    if (!container) {
      throw new Error('Container not found')
    }

    const div = document.createElement('div')
    const shadow = div.attachShadow({ mode: 'open' })

    shadow.innerHTML = `
      <style>
        :host {
          user-select: none;
        }
        :host .scroll {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          position: relative;
          ${this.options.noScrollbar ? 'scrollbar-color: transparent;' : ''}
        }
        :host ::-webkit-scrollbar {
          display: ${this.options.noScrollbar ? 'none' : 'auto'};
        }
        :host .wrapper {
          position: relative;
          width: fit-content;
          min-width: 100%;
          z-index: 2;
        }
        :host canvas {
          display: block;
          height: ${this.options.height}px;
          min-width: 100%;
          image-rendering: pixelated;
        }
        :host .progress {
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
          clip-path: inset(0px 100% 0px 0px);
        }
        :host .cursor {
          position: absolute;
          z-index: 3;
          top: 0;
          left: 0;
          height: 100%;
          width: ${this.options.cursorWidth}px;
          background: ${this.options.cursorColor || this.options.progressColor};
        }
      </style>

      <div class="scroll">
        <div class="wrapper">
          <canvas></canvas>
          <canvas class="progress"></canvas>
          <div class="cursor"></div>
        </div>
      </div>
    `

    this.container = div
    this.scrollContainer = shadow.querySelector('.scroll') as HTMLElement
    this.wrapper = shadow.querySelector('.wrapper') as HTMLElement
    this.mainCanvas = shadow.querySelector('canvas') as HTMLCanvasElement
    this.ctx = this.mainCanvas.getContext('2d', {
      desynchronized: true,
    }) as CanvasRenderingContext2D
    this.progressCanvas = shadow.querySelector('.progress') as HTMLCanvasElement
    this.cursor = shadow.querySelector('.cursor') as HTMLElement
    container.appendChild(div)

    this.mainCanvas.addEventListener('click', (e) => {
      const rect = this.mainCanvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const relativeX = x / rect.width
      this.emit('click', { relativeX })
    })
  }

  getContainer(): HTMLElement {
    return this.scrollContainer
  }

  getWrapper(): HTMLElement {
    return this.wrapper
  }

  destroy() {
    this.container.remove()
  }

  private delay(fn: () => void, delayMs = 100): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    return new Promise((resolve) => {
      this.timeout = setTimeout(() => {
        resolve(fn())
      }, delayMs)
    })
  }

  private async renderPeaks(channelData: Float32Array[], width: number, height: number) {
    const { devicePixelRatio } = window
    const { ctx } = this
    const barWidth = this.options.barWidth != null ? this.options.barWidth * devicePixelRatio : 1
    const barGap =
      this.options.barGap != null ? this.options.barGap * devicePixelRatio : this.options.barWidth ? barWidth / 2 : 0
    const barRadius = this.options.barRadius ?? 0

    const leftChannel = channelData[0]
    const len = leftChannel.length
    const barCount = Math.floor(width / (barWidth + barGap))
    const barIndexScale = barCount / len
    const halfHeight = height / 2
    const isMono = channelData.length === 1
    const rightChannel = isMono ? leftChannel : channelData[1]
    const useNegative = isMono && rightChannel.some((v) => v < 0)

    const draw = (start: number, end: number) => {
      let prevX = 0
      let prevLeft = 0
      let prevRight = 0

      ctx.beginPath()
      ctx.fillStyle = this.options.waveColor

      // Firefox shim until 2023.04.11
      if (!ctx.roundRect) ctx.roundRect = ctx.fillRect

      for (let i = start; i < end; i++) {
        const barIndex = Math.round(i * barIndexScale)

        if (barIndex > prevX) {
          const leftBarHeight = Math.round(prevLeft * halfHeight)
          const rightBarHeight = Math.round(prevRight * halfHeight)

          ctx.roundRect(
            prevX * (barWidth + barGap),
            halfHeight - leftBarHeight,
            barWidth,
            leftBarHeight + rightBarHeight || 1,
            barRadius,
          )

          prevX = barIndex
          prevLeft = 0
          prevRight = 0
        }

        const leftValue = useNegative ? leftChannel[i] : Math.abs(leftChannel[i])
        const rightValue = useNegative ? rightChannel[i] : Math.abs(rightChannel[i])

        if (leftValue > prevLeft) {
          prevLeft = leftValue
        }
        // If stereo, both channels are drawn as max values
        // If mono with negative values, the bottom channel will be the min negative values
        if (useNegative ? rightValue < -prevRight : rightValue > prevRight) {
          prevRight = rightValue < 0 ? -rightValue : rightValue
        }
      }

      ctx.fill()
      ctx.closePath()
    }

    // Clear the canvas
    ctx.clearRect(0, 0, width, height)

    // Draw the currently visible part of the waveform
    const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
    const scale = len / scrollWidth
    const start = Math.floor(scrollLeft * scale)
    const end = Math.ceil((scrollLeft + clientWidth) * scale)
    draw(start, end)

    // Draw the progress mask
    this.createProgressMask()

    // Draw the rest of the waveform with a timeout for better performance
    if (start > 0) {
      await this.delay(() => {
        draw(0, start)
      })
    }
    if (end < len) {
      await this.delay(() => {
        draw(end, len)
      })
    }

    // Redraw the progress mask
    this.delay(() => {
      this.createProgressMask()
    })
  }

  private createProgressMask() {
    const progressCtx = this.progressCanvas.getContext('2d', {
      desynchronized: true,
    }) as CanvasRenderingContext2D

    // Set the canvas to the same size as the main canvas
    this.progressCanvas.width = this.mainCanvas.width
    this.progressCanvas.height = this.mainCanvas.height

    // Copy the waveform image to the progress canvas
    // The main canvas itself is used as the source image
    progressCtx.drawImage(this.mainCanvas, 0, 0)
    // Set the composition method to draw only where the waveform is drawn
    progressCtx.globalCompositeOperation = 'source-in'
    progressCtx.fillStyle = this.options.progressColor
    // This rectangle acts as a mask thanks to the composition method
    progressCtx.fillRect(0, 0, this.progressCanvas.width, this.progressCanvas.height)
  }

  render(audioData: AudioBuffer) {
    // Determine the width of the canvas
    const { devicePixelRatio } = window
    const parentWidth = this.options.fillParent ? this.scrollContainer.clientWidth * devicePixelRatio : 0
    const scrollWidth = audioData.duration * this.options.minPxPerSec
    const isScrolling = scrollWidth > parentWidth
    const width = Math.max(1, isScrolling ? scrollWidth : parentWidth)
    const { height } = this.options

    this.mainCanvas.width = width
    this.mainCanvas.height = height
    this.mainCanvas.style.width = Math.floor(scrollWidth / devicePixelRatio) + 'px'

    // First two channels are used
    const channelData = [audioData.getChannelData(0)]
    if (audioData.numberOfChannels > 1) {
      channelData.push(audioData.getChannelData(1))
    }

    this.renderPeaks(channelData, width, height)
  }

  zoom(audioData: AudioBuffer, minPxPerSec: number) {
    // Remember the current cursor position
    const oldCursorPosition = this.cursor.getBoundingClientRect().left

    this.options.minPxPerSec = minPxPerSec
    this.render(audioData)

    // Adjust the scroll position so that the cursor stays in the same place
    const newCursortPosition = this.cursor.getBoundingClientRect().left
    this.scrollContainer.scrollLeft += newCursortPosition - oldCursorPosition
  }

  renderProgress(progress: number, autoCenter = false) {
    this.progressCanvas.style.clipPath = `inset(0 ${100 - progress * 100}% 0 0)`
    this.cursor.style.left = `${progress * 100}%`
    this.cursor.style.marginLeft =
      progress > 0
        ? Math.round(progress * 100) === 100
          ? `-${this.cursor.offsetWidth}px`
          : `-${this.cursor.offsetWidth / 2}px`
        : ''

    if (autoCenter) {
      const center = this.container.clientWidth / 2
      const fullWidth = this.mainCanvas.clientWidth
      if (fullWidth * progress >= center) {
        this.scrollContainer.scrollLeft = fullWidth * progress - center
      }
    }
  }
}

export default Renderer
