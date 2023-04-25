/** Decode an array buffer into an audio buffer */
async function decode(audioData: ArrayBuffer): Promise<AudioBuffer> {
  const DEFAULT_SAMPLE_RATE = 8000 // All user agents are required to support a range of 8000Hz to 96000Hz
  const MIN_SAMPLE_RATE = 3000 // Chrome, Safari can do 3kHz

  let audioCtx: AudioContext
  try {
    audioCtx = new AudioContext({
      sampleRate: MIN_SAMPLE_RATE,
    })
  } catch (_) {
    audioCtx = new AudioContext({
      sampleRate: DEFAULT_SAMPLE_RATE,
    })
  }
  const decode = audioCtx.decodeAudioData(audioData)
  decode.finally(() => audioCtx.close())
  return decode
}

/** Create an audio buffer from pre-decoded audio data */
function createBuffer(channelData: Float32Array[] | Array<number[]>, duration: number): AudioBuffer {
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

const Decoder = {
  decode,
  createBuffer,
}

export default Decoder
