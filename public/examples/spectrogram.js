// Web Audio MediaStreamAudioSourceNode

import WaveSurfer from "wavesurfer.js";

const audio = new Audio();
audio.controls = true;
audio.src = "/examples/audio.wav";
document.body.appendChild(audio);

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: "rgb(200, 0, 200)",
  progressColor: "rgb(100, 0, 100)",
  media: audio,
  autoplay: true,
});

const audioContext = new AudioContext();
const mediaNode = audioContext.createMediaElementSource(audio);
const analyser = audioContext.createAnalyser();
mediaNode.connect(analyser);
analyser.connect(audioContext.destination);

// Draw the spectrogram
const canvas = document.createElement("canvas");
canvas.width = 512;
canvas.height = 256;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
const imageData = ctx.createImageData(canvas.width, canvas.height);
const data = imageData.data;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const draw = () => {
  // Clear the previous data to make the canvas transparent
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
  }

  analyser.getByteTimeDomainData(dataArray);
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    const x = (i * canvas.width) / bufferLength;
    const index = (x + y * canvas.width) * 4;
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  requestAnimationFrame(draw);
};

draw();
