class Decoder {
  audioCtx: AudioContext | null = null

  private initAudioContext(sampleRate: number) {
    this.audioCtx = new AudioContext({
      latencyHint: 'playback',
      sampleRate,
    })
  }

  constructor() {
    // Minimum sample rate supported by Web Audio API
    const DEFAULT_SAMPLE_RATE = 3000 // Chrome, Safari
    const FALLBACK_SAMPLE_RATE = 8000 // Firefox

    try {
      this.initAudioContext(DEFAULT_SAMPLE_RATE)
    } catch (e) {
      this.initAudioContext(FALLBACK_SAMPLE_RATE)
    }
  }

  public async decode(audioData: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioCtx) {
      throw new Error('AudioContext is not initialized')
    }
    return this.audioCtx.decodeAudioData(audioData)
  }

  public createBuffer(channelData: Float32Array[] | Array<number[]>, duration: number): AudioBuffer {
    // If a single array of numbers is passed, make it an array of arrays
    if (typeof channelData[0] === 'number') channelData = [channelData as unknown as number[]]

    // Normalize to -1..1
    if (channelData[0].some((n) => n > 1 || n < -1)) {
      const max = Math.max(...channelData[0])
      channelData = (channelData as Array<number[]>).map((channel) => channel.map((n) => n / max))
    }

    return {
      length: channelData[0].length,
      duration,
      numberOfChannels: channelData.length,
      sampleRate: channelData[0].length / duration,
      getChannelData: (i: number) => channelData?.[i] as Float32Array,
      copyFromChannel: AudioBuffer.prototype.copyFromChannel,
      copyToChannel: AudioBuffer.prototype.copyToChannel,
    }
  }

  destroy() {
    this.audioCtx?.close()
    this.audioCtx = null
  }
}

export default Decoder
