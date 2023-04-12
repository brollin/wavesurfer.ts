import EventEmitter, { type GeneralEventTypes } from './event-emitter.js'

class Player<T extends GeneralEventTypes> extends EventEmitter<T> {
  protected media: HTMLMediaElement
  protected subscriptions: Array<() => void> = []
  private isExternalMedia = false
  private hasPlayedOnce = false

  constructor({ media, autoplay }: { media?: HTMLMediaElement; autoplay?: boolean }) {
    super()

    if (media) {
      this.media = media
      this.isExternalMedia = true
    } else {
      this.media = document.createElement('audio')
    }

    this.subscriptions.push(
      // Track the first play() call
      this.onceMediaEvent('play', () => {
        this.hasPlayedOnce = true
      }),
    )

    // Autoplay
    if (autoplay) {
      this.media.autoplay = true
    }
  }

  protected onMediaEvent(
    event: keyof HTMLMediaElementEventMap,
    callback: () => void,
    options?: AddEventListenerOptions,
  ): () => void {
    this.media.addEventListener(event, callback, options)
    return () => this.media.removeEventListener(event, callback)
  }

  protected onceMediaEvent(event: keyof HTMLMediaElementEventMap, callback: () => void): () => void {
    return this.onMediaEvent(event, callback, { once: true })
  }

  protected loadUrl(src: string) {
    this.media.src = src
  }

  public destroy() {
    this.media.pause()

    this.subscriptions.forEach((unsubscribe) => unsubscribe())

    if (!this.isExternalMedia) {
      this.media.remove()
    }
  }

  /** Start playing the audio */
  public play() {
    this.media.play()
  }

  /** Pause the audio */
  public pause() {
    this.media.pause()
  }

  /** Check if the audio is playing */
  public isPlaying() {
    return this.media.currentTime > 0 && !this.media.paused && !this.media.ended
  }

  /** Skip to a time position in seconds */
  public seekTo(time: number) {
    // iOS Safari requires a play() call before seeking
    if (!this.hasPlayedOnce && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      this.media.play()?.then?.(() => {
        setTimeout(() => this.media.pause(), 10)
      })
    }

    this.media.currentTime = time
  }

  /** Get the duration of the audio in seconds */
  public getDuration() {
    return this.media.duration
  }

  /** Get the current audio position in seconds */
  public getCurrentTime() {
    return this.media.currentTime
  }

  /** Get the audio volume */
  public getVolume() {
    return this.media.volume
  }

  /** Set the audio volume */
  public setVolume(volume: number) {
    this.media.volume = volume
  }

  /** Get the audio muted state */
  public getMuted() {
    return this.media.muted
  }

  /** Mute or unmute the audio */
  public setMuted(muted: boolean) {
    this.media.muted = muted
  }

  /** Get the playback speed */
  public getPlaybackRate(): number {
    return this.media.playbackRate
  }

  /** Set the playback speed, pass an optional false to NOT preserve the pitch */
  public setPlaybackRate(rate: number, preservePitch?: boolean) {
    // preservePitch is true by default in most browsers
    if (preservePitch != null) {
      this.media.preservesPitch = preservePitch
    }
    this.media.playbackRate = rate
  }

  /** Get the HTML media element */
  public getMediaElement() {
    return this.media
  }
}

export default Player
