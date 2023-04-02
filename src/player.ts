class Player {
  protected media: HTMLMediaElement
  private isExternalMedia = false
  private hasPlayedOnce = false
  private subscriptions: Array<() => void> = []

  constructor({ media, autoplay }: { media?: HTMLMediaElement; autoplay?: boolean }) {
    if (media) {
      this.media = media
      this.isExternalMedia = true
    } else {
      this.media = document.createElement('audio')
    }

    this.subscriptions.push(
      // Track the first play() call
      this.on(
        'play',
        () => {
          this.hasPlayedOnce = true
        },
        { once: true },
      ),
    )

    // Autoplay
    if (autoplay) {
      this.media.autoplay = true
    }
  }

  on(event: keyof HTMLMediaElementEventMap, callback: () => void, options?: AddEventListenerOptions): () => void {
    this.media.addEventListener(event, callback, options)
    return () => this.media.removeEventListener(event, callback)
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe()
    })

    this.media.pause()

    if (!this.isExternalMedia) {
      this.media.remove()
    }
  }

  loadUrl(src: string) {
    this.media.src = src
  }

  getCurrentTime() {
    return this.media.currentTime
  }

  play() {
    this.media.play()
  }

  pause() {
    this.media.pause()
  }

  isPlaying() {
    return this.media.currentTime > 0 && !this.media.paused && !this.media.ended
  }

  seekTo(time: number) {
    // iOS Safari requires a play() call before seeking
    if (!this.hasPlayedOnce && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      this.media.play()?.then?.(() => {
        setTimeout(() => this.media.pause(), 0)
      })
    }

    this.media.currentTime = time
  }

  getDuration() {
    return this.media.duration
  }

  getVolume() {
    return this.media.volume
  }

  setVolume(volume: number) {
    this.media.volume = volume
  }

  getMuted() {
    return this.media.muted
  }

  setMuted(muted: boolean) {
    this.media.muted = muted
  }

  getPlaybackRate(): number {
    return this.media.playbackRate
  }

  setPlaybackRate(rate: number, preservePitch?: boolean) {
    // preservePitch is true by default in most browsers
    if (preservePitch != null) {
      this.media.preservesPitch = preservePitch
    }

    this.media.playbackRate = rate
  }

  getMediaElement() {
    return this.media
  }
}

export default Player
