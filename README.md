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

## Goals

 * TypeScript API
 * Better architecture
 * Minimize the available options and provide sensible defaults
 * Improve the decoding and rendering performance

## Backwards compatibility

Most options, events and methods are the same as in the previous version.

Notable method differences:
 * No `backend` option anymore – the HTML5 audio (or video) is the only playback mechanism. It's still possible, however, to connect wavesurfer to a Web Audio via MediaElementSourceNode. See this [example](https://wavesurfer-ts.pages.dev/tutorial/#/examples/webaudio.js).
 * Some methods aren't provided anymore, e.g.
   – `getFilters`/`setFilter` – because there's no Web Audio "backend"
  - `cancelAjax` – we're using `fetch` now, not XHR aka ajax
  - `loadBlob` – use `URL.createObjectURL()` to convert a blob to a URL and call `load(url)` instead
  - `un` (and `unAll`) – the `on` method returns an unsubscribe function
  - `skipBackward`, `skipForward`, `setPlayEnd` – these methods can be easily implemented using `setTime(time)`

## Architecture

Principles:
 * Modular and event-driven
 * Flexible (e.g. allow custom media elements and user-defined Web Audio graphs)
 * Extensible with plugins

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
