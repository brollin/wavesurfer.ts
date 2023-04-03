import Fetcher from './fetcher.js'
import Decoder from './decoder.js'
import Renderer from './renderer.js'
import Player from './player.js'
import EventEmitter, { type GeneralEventTypes } from './event-emitter.js'
import Timer from './timer.js'
import BasePlugin from './base-plugin.js'

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
  peaks?: Float32Array[]
  /** Pre-computed duration */
  duration?: number
  /** Use an existing media element instead of creating one */
  media?: HTMLMediaElement
  /** Play the audio on load */
  autoplay?: boolean
  /** Is the waveform clickable? */
  interactive?: boolean
  /** Hide scrollbar **/
  noScrollbar?: boolean
}

const defaultOptions = {
  height: 128,
  waveColor: '#999',
  progressColor: '#555',
  cursorWidth: 1,
  minPxPerSec: 0,
  fillParent: true,
  interactive: true,
}

export type WaveSurferEvents = {
  decode: { duration: number }
  canplay: { duration: number }
  ready: { duration: number }
  play: void
  pause: void
  timeupdate: { currentTime: number }
  seeking: { currentTime: number }
  seekClick: { currentTime: number }
  destroy: void
}

export type WaveSurferPluginParams = {
  wavesurfer: WaveSurfer
  container: HTMLElement
  wrapper: HTMLElement
}

class WaveSurfer extends EventEmitter<WaveSurferEvents> {
  private options: WaveSurferOptions & typeof defaultOptions

  private fetcher: Fetcher
  private decoder: Decoder
  private renderer: Renderer
  private player: Player
  private timer: Timer

  private plugins: BasePlugin<GeneralEventTypes, unknown>[] = []
  private subscriptions: Array<() => void> = []
  private decodedData: AudioBuffer | null = null

  /** Create a new WaveSurfer instance */
  public static create(options: WaveSurferOptions) {
    return new WaveSurfer(options)
  }

  /** Create a new WaveSurfer instance */
  constructor(options: WaveSurferOptions) {
    super()

    this.options = Object.assign({}, defaultOptions, options)

    this.fetcher = new Fetcher()
    this.decoder = new Decoder()
    this.timer = new Timer()

    this.player = new Player({
      media: this.options.media,
      autoplay: this.options.autoplay,
    })

    this.renderer = new Renderer({
      container: this.options.container,
      height: this.options.height,
      waveColor: this.options.waveColor,
      progressColor: this.options.progressColor,
      cursorColor: this.options.cursorColor,
      cursorWidth: this.options.cursorWidth,
      minPxPerSec: this.options.minPxPerSec,
      fillParent: this.options.fillParent,
      barWidth: this.options.barWidth,
      barGap: this.options.barGap,
      barRadius: this.options.barRadius,
      noScrollbar: this.options.noScrollbar,
    })

    this.initPlayerEvents()
    this.initRendererEvents()
    this.initTimerEvents()
    this.initReadyEvent()

    const url = this.options.url || this.options.media?.src
    if (url) {
      this.load(url, this.options.peaks, this.options.duration)
    }
  }

  private initPlayerEvents() {
    this.subscriptions.push(
      this.player.on('timeupdate', () => {
        const currentTime = this.getCurrentTime()
        this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying())
        this.emit('timeupdate', { currentTime })
      }),

      this.player.on('play', () => {
        this.emit('play')
        this.timer.start()
      }),

      this.player.on('pause', () => {
        this.emit('pause')
        this.timer.stop()
      }),

      this.player.on('canplay', () => {
        this.emit('canplay', { duration: this.getDuration() })
      }),

      this.player.on('seeking', () => {
        this.emit('seeking', { currentTime: this.getCurrentTime() })
      }),
    )
  }

  private initRendererEvents() {
    // Seek on click
    this.subscriptions.push(
      this.renderer.on('click', ({ relativeX }) => {
        if (this.options.interactive) {
          const time = this.getDuration() * relativeX
          this.seekTo(time)
          this.emit('seekClick', { currentTime: this.getCurrentTime() })
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
    let isDecoded = false
    let isPlayable = false

    const emitReady = () => {
      if (isDecoded && isPlayable) {
        this.emit('ready', { duration: this.getDuration() })
      }
    }

    this.subscriptions.push(
      this.on('decode', () => {
        isDecoded = true
        emitReady()
      }),
      this.on('canplay', () => {
        isPlayable = true
        emitReady()
      }),
      this.player.on('waiting', () => {
        isPlayable = false
        isDecoded = false
      }),
    )
  }

  /** Load an audio file by URL, with optional pre-decoded audio data */
  public async load(url: string, channelData?: Float32Array[], duration?: number) {
    this.player.loadUrl(url)

    // Fetch and decode the audio of no pre-computed audio data is provided
    if (channelData == null) {
      const audio = await this.fetcher.load(url)
      const data = await this.decoder.decode(audio)
      this.decodedData = data
    } else {
      if (!duration) {
        duration =
          (await new Promise((resolve) => {
            this.player.on('canplay', () => resolve(this.getDuration()), {
              once: true,
            })
          })) || 0
      }

      this.decodedData = {
        duration,
        numberOfChannels: channelData.length,
        sampleRate: channelData[0].length / duration,
        getChannelData: (i) => channelData[i],
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
    this.renderer.zoom(this.decodedData, minPxPerSec)
  }

  /** Start playing the audio */
  public play() {
    this.player.play()
  }

  /** Pause the audio */
  public pause() {
    this.player.pause()
  }

  /** Skip to a time position in seconds */
  public seekTo(time: number) {
    this.player.seekTo(time)
  }

  /** Check if the audio is playing */
  public isPlaying(): boolean {
    return this.player.isPlaying()
  }

  /** Get the duration of the audio in seconds */
  public getDuration(): number {
    return this.player.getDuration() || this.decodedData?.duration || 0
  }

  /** Get the current audio position in seconds */
  public getCurrentTime(): number {
    return this.player.getCurrentTime()
  }

  /** Get the audio volume */
  public getVolume(): number {
    return this.player.getVolume()
  }

  /** Set the audio volume */
  public setVolume(volume: number) {
    this.player.setVolume(volume)
  }

  /** Get the audio muted state */
  public getMuted(): boolean {
    return this.player.getMuted()
  }

  /** Mute or unmute the audio */
  public setMuted(muted: boolean) {
    this.player.setMuted(muted)
  }

  /** Get playback rate */
  public getPlaybackRate(): number {
    return this.player.getPlaybackRate()
  }

  /** Set playback rate, with an optional parameter to NOT preserve the pitch if false */
  public setPlaybackRate(rate: number, preservePitch?: boolean) {
    this.player.setPlaybackRate(rate, preservePitch)
  }

  /** Register and initialize a plugin */
  public registerPlugin<T extends BasePlugin<GeneralEventTypes, Options>, Options>(
    CustomPlugin: new (params: WaveSurferPluginParams, options: Options) => T,
    options: Options,
  ): T {
    const plugin = new CustomPlugin(
      {
        wavesurfer: this,
        container: this.renderer.getContainer(),
        wrapper: this.renderer.getWrapper(),
      },
      options,
    )

    this.plugins.push(plugin)

    return plugin
  }

  /** Get the decoded audio data */
  public getDecodedData(): AudioBuffer | null {
    return this.decodedData
  }

  /** Get the raw media element */
  public getMediaElement(): HTMLMediaElement | null {
    return this.player.getMediaElement()
  }

  /** Unmount wavesurfer */
  public destroy() {
    this.emit('destroy')
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.plugins.forEach((plugin) => plugin.destroy())
    this.timer.destroy()
    this.player.destroy()
    this.decoder.destroy()
    this.renderer.destroy()
  }
}

export default WaveSurfer
