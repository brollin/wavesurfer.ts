/**
 * The Timeline plugin adds timestamps and notches under the waveform.
 */

import BasePlugin, { type WaveSurferPluginParams } from '../base-plugin.js'

export type TimelinePluginOptions = {
  /** The height of the timeline in pixels, defaults to 20 */
  height?: number
  /** HTML container for the timeline, defaults to wavesufer's container */
  container?: HTMLElement
  /** The duration of the timeline in seconds, defaults to wavesurfer's duration */
  duration?: number
  /** Interval between ticks in seconds */
  timeInterval?: number
  /** Interval between numeric labels */
  primaryLabelInterval?: number
  /** Interval between secondary numeric labels */
  secondaryLabelInterval?: number
}

const defaultOptions = {
  height: 20,
}

export type TimelinePluginEvents = {
  ready: []
}

class TimelinePlugin extends BasePlugin<TimelinePluginEvents, TimelinePluginOptions> {
  private timelineWrapper: HTMLElement
  protected options: TimelinePluginOptions & typeof defaultOptions

  constructor(options: TimelinePluginOptions) {
    super(options)

    this.options = Object.assign({}, defaultOptions, options)
    this.timelineWrapper = this.initTimelineWrapper()
  }

  public static create(options: TimelinePluginOptions) {
    return new TimelinePlugin(options)
  }

  /** Called by wavesurfer, don't call manually */
  init(params: WaveSurferPluginParams) {
    super.init(params)

    if (!this.wavesurfer || !this.wrapper) {
      throw Error('WaveSurfer is not initialized')
    }

    const container = this.options.container ?? this.wrapper
    container.appendChild(this.timelineWrapper)

    if (this.options.duration) {
      this.initTimeline(this.options.duration)
    } else {
      this.subscriptions.push(
        this.wavesurfer.on('decode', (duration) => {
          this.initTimeline(duration)
        }),
      )
    }
  }

  /** Unmount */
  public destroy() {
    this.timelineWrapper.remove()
    super.destroy()
  }

  private initTimelineWrapper(): HTMLElement {
    return document.createElement('div')
  }

  private formatTime(seconds: number): string {
    if (seconds / 60 > 1) {
      // calculate minutes and seconds from seconds count
      const minutes = Math.round(seconds / 60)
      seconds = Math.round(seconds % 60)
      const paddedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`
      return `${minutes}:${paddedSeconds}`
    }
    const rounded = Math.round(seconds * 1000) / 1000
    return `${rounded}`
  }

  // Return how many seconds should be between each notch
  private defaultTimeInterval(pxPerSec: number): number {
    if (pxPerSec >= 25) {
      return 1
    } else if (pxPerSec * 5 >= 25) {
      return 5
    } else if (pxPerSec * 15 >= 25) {
      return 15
    }
    return Math.ceil(0.5 / pxPerSec) * 60
  }

  // Return the cadence of notches that get labels in the primary color.
  private defaultPrimaryLabelInterval(pxPerSec: number): number {
    if (pxPerSec >= 25) {
      return 10
    } else if (pxPerSec * 5 >= 25) {
      return 6
    } else if (pxPerSec * 15 >= 25) {
      return 4
    }
    return 4
  }

  // Return the cadence of notches that get labels in the secondary color.
  private defaultSecondaryLabelInterval(pxPerSec: number): number {
    if (pxPerSec >= 25) {
      return 5
    } else if (pxPerSec * 5 >= 25) {
      return 2
    } else if (pxPerSec * 15 >= 25) {
      return 2
    }
    return 2
  }

  private initTimeline(duration: number) {
    const pxPerSec = this.timelineWrapper.scrollWidth / duration
    const timeInterval = this.options.timeInterval ?? this.defaultTimeInterval(pxPerSec)
    const primaryLabelInterval = this.options.primaryLabelInterval ?? this.defaultPrimaryLabelInterval(pxPerSec)
    const secondaryLabelInterval = this.options.secondaryLabelInterval ?? this.defaultSecondaryLabelInterval(pxPerSec)

    const timeline = document.createElement('div')
    timeline.setAttribute(
      'style',
      `
      height: ${this.options.height}px;
      overflow: hidden;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: ${this.options.height / 2}px;
      white-space: nowrap;
    `,
    )

    const notchEl = document.createElement('div')
    notchEl.setAttribute(
      'style',
      `
      width: 1px;
      height: 50%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow: visible;
      border-left: 1px solid currentColor;
      opacity: 0.25;
    `,
    )

    for (let i = 0; i < duration; i += timeInterval) {
      const notch = notchEl.cloneNode() as HTMLElement
      const isPrimary = i % primaryLabelInterval === 0
      const isSecondary = i % secondaryLabelInterval === 0

      if (isPrimary || isSecondary) {
        notch.style.height = '100%'
        notch.style.textIndent = '3px'
        notch.textContent = this.formatTime(i)
        if (isPrimary) notch.style.opacity = '1'
      }

      timeline.appendChild(notch)
    }

    this.timelineWrapper.appendChild(timeline)

    this.emit('ready')
  }
}

export default TimelinePlugin
