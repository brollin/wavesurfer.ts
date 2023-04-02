import 'whatwg-fetch'
import AudioContext from './AudioContext.js'

window.AudioContext = AudioContext

HTMLMediaElement.prototype.pause = () => {
}
HTMLMediaElement.prototype.play = () => {
}
