# <img src="https://user-images.githubusercontent.com/381895/226091100-f5567a28-7736-4d37-8f84-e08f297b7e1a.png" alt="logo" height="60" valign="middle" /> wavesurfer.ts

An experimental rewrite of [wavesufer.js](https://github.com/wavesurfer-js/wavesurfer.js) to play around with new ideas.

<img alt="screenshot" src="https://user-images.githubusercontent.com/381895/225539680-fc724acd-8657-458e-a558-ff1c6758ba30.png" width="800" />

Try it out:
```
npm install --save wavesurfer.js@alpha
```

## Goals

 * TypeScript API
 * Better architecture
 * Minimize the available options and provide sensible defaults
 * Improve the decoding and rendering performance

## Non-goals

Keeping backwards compatibility with earlier versions of wavesurfer.js.

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
