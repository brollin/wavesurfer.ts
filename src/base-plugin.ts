import EventEmitter, { type GeneralEventTypes } from './event-emitter.js'
import WaveSurfer, { type WaveSurferPluginParams } from './wavesurfer.js'

export class BasePlugin<EventTypes extends GeneralEventTypes, Options> extends EventEmitter<EventTypes> {
  protected wavesurfer: WaveSurfer
  protected container: HTMLElement
  protected wrapper: HTMLElement
  protected subscriptions: (() => void)[] = []
  protected options: Options

  constructor(params: WaveSurferPluginParams, options: Options) {
    super()
    this.wavesurfer = params.wavesurfer
    this.container = params.container
    this.wrapper = params.wrapper
    this.options = options
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
  }
}

export default BasePlugin
