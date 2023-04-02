import EventEmitter, { type GeneralEventTypes } from './event-emitter'
import WaveSurfer, { type WaveSurferPluginParams } from './index'

export class BasePlugin<EventTypes extends GeneralEventTypes, Options> extends EventEmitter<EventTypes> {
  protected wavesurfer: WaveSurfer
  protected container: ShadowRoot | HTMLElement
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
