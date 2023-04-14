import Fetcher from './fetcher.js'
import Decoder from './decoder.js'
import Renderer, { type RendererStyleOptions } from './renderer.js'
import Player from './player.js'
import Timer from './timer.js'
import type { GenericPlugin } from './base-plugin.js'

export type WaveSurferOptions = {
  /** HTML element or CSS selector */
  container: HTMLElement | string | null
  /** Height of the waveform in pixels */
  height?: number
  /** The color of the waveform */
  waveColor?: string
  /** The color of the progress mask */
  progressColor?: string
  /** The color of the playpack cursor */
  cursorColor?: string
  /** The cursor with */
  cursorWidth?: number
  /** If set, the waveform will be rendered in bars like so: ▁ ▂ ▇ ▃ ▅ ▂ */
  barWidth?: number
  /** Spacing between bars in pixels */
  barGap?: number
  /** Rounded borders for bars */
  barRadius?: number
  /** Minimum pixels per second of audio (zoom) */
  minPxPerSec?: number
  /** Stretch the waveform to fill the container, true by default */
  fillParent?: boolean
  /** Audio URL */
  url?: string
  /** Pre-computed audio data */
  peaks?: Float32Array[] | Array<number[]>
  /** Pre-computed duration */
  duration?: number
  /** Use an existing media element instead of creating one */
  media?: HTMLMediaElement
  /** Play the audio on load */
  autoplay?: boolean
  /** Is the waveform clickable? */
  interact?: boolean
  /** Hide scrollbar **/
  hideScrollbar?: boolean
  /** Audio rate */
  audioRate?: number
  /** Keep scroll to the center of the waveform during playback */
  autoCenter?: boolean
  /** Initialize plugins */
  plugins?: GenericPlugin[]
}

const defaultOptions = {
  height: 128,
  waveColor: '#999',
  progressColor: '#555',
  cursorWidth: 1,
  minPxPerSec: 0,
  fillParent: true,
  interact: true,
  autoCenter: true,
}

export type WaveSurferEvents = {
  decode: { duration: number }
  canplay: { duration: number }
  ready: { duration: number }
  play: void
  pause: void
  finish: void
  timeupdate: { currentTime: number }
  seeking: { currentTime: number }
  interaction: void
  zoom: { minPxPerSec: number }
  destroy: void
}

export type WaveSurferPluginParams = {
  wavesurfer: WaveSurfer
  container: HTMLElement
  wrapper: HTMLElement
}

class WaveSurfer extends Player<WaveSurferEvents> {
  public options: WaveSurferOptions & typeof defaultOptions
  private fetcher: Fetcher
  private decoder: Decoder
  private renderer: Renderer
  private timer: Timer
  private plugins: GenericPlugin[] = []
  private decodedData: AudioBuffer | null = null
  private canPlay = false

  /** Create a new WaveSurfer instance */
  public static create(options: WaveSurferOptions) {
    return new WaveSurfer(options)
  }

  /** Create a new WaveSurfer instance */
  constructor(options: WaveSurferOptions) {
    super({
      media: options.media,
      autoplay: options.autoplay,
      playbackRate: options.audioRate,
    })

    this.options = Object.assign({}, defaultOptions, options)

    this.fetcher = new Fetcher()
    this.decoder = new Decoder()
    this.timer = new Timer()

    this.renderer = new Renderer(
      {
        container: this.options.container,
      },
      this.options,
    )

    this.initPlayerEvents()
    this.initRendererEvents()
    this.initTimerEvents()
    this.initReadyEvent()
    this.initPlugins()

    const url = this.options.url || this.options.media?.src
    if (url) {
      this.load(url, this.options.peaks, this.options.duration)
    }
  }

  public setOptions(options: Partial<RendererStyleOptions>) {
    this.options = { ...this.options, ...options }
    this.renderer.setOptions(this.options)
  }

  private initPlayerEvents() {
    this.subscriptions.push(
      this.onMediaEvent('timeupdate', () => {
        const currentTime = this.getCurrentTime()
        this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying())
        this.emit('timeupdate', { currentTime })
      }),

      this.onMediaEvent('play', () => {
        this.emit('play')
        this.timer.start()
      }),

      this.onMediaEvent('pause', () => {
        this.emit('pause')
        this.timer.stop()

        if (this.getCurrentTime() >= this.getDuration()) {
          this.emit('finish')
        }
      }),

      this.onMediaEvent('canplay', () => {
        this.canPlay = true
        this.emit('canplay', { duration: this.getDuration() })
      }),

      this.onMediaEvent('seeking', () => {
        this.emit('seeking', { currentTime: this.getCurrentTime() })
      }),
    )
  }

  private initRendererEvents() {
    // Seek on click
    this.subscriptions.push(
      this.renderer.on('click', ({ relativeX }) => {
        if (this.options.interact) {
          this.seekTo(relativeX)
          this.emit('interaction')
        }
      }),
    )
  }

  private initTimerEvents() {
    // The timer fires every 16ms for a smooth progress animation
    this.subscriptions.push(
      this.timer.on('tick', () => {
        const currentTime = this.getCurrentTime()
        this.renderer.renderProgress(currentTime / this.getDuration(), true)
        this.emit('timeupdate', { currentTime })
      }),
    )
  }

  private initReadyEvent() {
    const emitReady = () => {
      if (this.decodedData && this.canPlay) {
        this.emit('ready', { duration: this.getDuration() })
      }
    }
    this.subscriptions.push(this.on('decode', emitReady), this.on('canplay', emitReady))
  }

  private initPlugins() {
    if (!this.options.plugins?.length) return

    this.options.plugins.forEach((plugin) => {
      this.registerPlugin(plugin)
    })
  }

  /** Register a wavesurfer.js plugin */
  public registerPlugin<T extends GenericPlugin>(plugin: T): T {
    plugin.init({
      wavesurfer: this,
      container: this.renderer.getContainer(),
      wrapper: this.renderer.getWrapper(),
    })

    this.plugins.push(plugin)

    return plugin
  }

  /** Load an audio file by URL, with optional pre-decoded audio data */
  public async load(url: string, channelData?: WaveSurferOptions['peaks'], duration?: number) {
    this.decodedData = null
    this.canPlay = false

    this.loadUrl(url)

    // Fetch and decode the audio of no pre-computed audio data is provided
    if (channelData == null) {
      const audio = await this.fetcher.load(url)
      const data = await this.decoder.decode(audio)
      this.decodedData = data
    } else {
      if (!duration) {
        duration =
          (await new Promise((resolve) => {
            this.onceMediaEvent('loadedmetadata', () => resolve(this.getDuration()))
          })) || 0
      }

      // Allow a single array of numbers
      if (typeof channelData[0] === 'number') channelData = [channelData as unknown as number[]]

      this.decodedData = {
        duration,
        numberOfChannels: channelData.length,
        sampleRate: channelData[0].length / duration,
        getChannelData: (i) => channelData?.[i],
      } as AudioBuffer
    }

    this.renderer.render(this.decodedData)

    this.emit('decode', { duration: this.decodedData.duration })
  }

  /** Zoom in or out */
  public zoom(minPxPerSec: number) {
    if (!this.decodedData) {
      throw new Error('No audio loaded')
    }
    this.renderer.zoom(minPxPerSec)
    this.emit('zoom', { minPxPerSec })
  }

  /** Get the decoded audio data */
  public getDecodedData(): AudioBuffer | null {
    return this.decodedData
  }

  public getDuration(): number {
    const audioDuration = this.getMediaElement()?.duration
    return audioDuration > 0 && audioDuration < Infinity ? audioDuration : this.decodedData?.duration || 0
  }

  /** Toggle if the waveform should react to clicks */
  public toggleInteraction(isInteractive: boolean) {
    this.options.interact = isInteractive
  }

  /** Seeks to a percentage of audio as [0..1] (0 = beginning, 1 = end) */
  public seekTo(progress: number) {
    const time = this.getDuration() * progress
    this.setTime(time)
  }

  /** Play or pause the audio */
  public playPause(): Promise<void> {
    if (this.isPlaying()) {
      this.pause()
      return Promise.resolve()
    } else {
      return this.play()
    }
  }

  /** Stop the audio and go to the beginning */
  public stop() {
    this.pause()
    this.setTime(0)
  }

  /** Skip N or -N seconds from the current positions */
  public skip(seconds: number) {
    this.setTime(this.getCurrentTime() + seconds)
  }

  /** Empty the waveform by loading a tiny silent audio */
  public empty() {
    this.load('', [[0]], 0.001)
  }

  /** Unmount wavesurfer */
  public destroy() {
    this.emit('destroy')
    this.plugins.forEach((plugin) => plugin.destroy())
    this.timer.destroy()
    this.decoder.destroy()
    this.renderer.destroy()
    super.destroy()
  }
}

export default WaveSurfer
