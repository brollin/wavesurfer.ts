# <img src="https://user-images.githubusercontent.com/381895/226091100-f5567a28-7736-4d37-8f84-e08f297b7e1a.png" alt="logo" height="60" valign="middle" /> wavesurfer.ts

An experimental rewrite of [wavesufer.js](https://github.com/wavesurfer-js/wavesurfer.js) to play around with new ideas.

<img alt="screenshot" src="https://user-images.githubusercontent.com/381895/225539680-fc724acd-8657-458e-a558-ff1c6758ba30.png" width="800" />

Try it out:
```
npm install --save wavesurfer.js@alpha
```

Import like so:

```
import WaveSurfer from 'wavesurfer.js'
```

TypeScript types are now provided from the package itself, so no need to install `@types/wavesurfer.js`.

## Goals

 * TypeScript API
 * Better architecture
 * Minimize the available options and provide sensible defaults
 * Improve the decoding and rendering performance

## Migrating from v6 and lower

Most options, events and methods are the same as in the previous version.

### Notable differences
 * No `backend` option anymore – the HTML5 audio (or video) is the only playback mechanism. It's still possible, however, to connect wavesurfer to a Web Audio via MediaElementSourceNode. See this [example](https://wavesurfer-ts.pages.dev/tutorial/#/examples/webaudio.js).
 * No Markers plugin – use the Regions plugin with the startTime equal to the endTime
 * Plugins have different APIs

### Removed methods
 * `getFilters`, `setFilter` – because there's no Web Audio "backend"
 * `cancelAjax` – we're using `fetch` now, not XHR aka ajax
 * `loadBlob` – use `URL.createObjectURL()` to convert a blob to a URL and call `load(url)` instead
 * `un`, `unAll` – the `on` method now returns an unsubscribe function. E.g. `const unsubscribe = wavesurfer.on('ready', () => ...)`
 * `skipForward`, `skipBackward`, `setPlayEnd` – these methods can be easily implemented using `setTime(time)`
 * `exportPCM` is renamed to `getDecodedData` and doesn't take any params
 * `toggleMute` is now called `setMute(true | false)`
 * `setHeight`, `setWaveColor`, `setCursorColor` and similar – use `setOptions` with the corresponding params instead. E.g. `wavesurfer.setOptions({ height: 300, waveColor: '#abc' })`

See the complete [documentation of the new API](https://wavesurfer-ts.pages.dev/docs/classes/wavesurfer.WaveSurfer).

## Development

Install dev dependencies:

```
yarn
```

Start the TypeScript compiler in watch mode and an HTTP server:

```
yarn start
```

This will open http://localhost:9090/tutorial in your browser with live reload.

## Feedback

Your feedback is very welcome here: https://github.com/wavesurfer-js/wavesurfer.js/discussions/2684
