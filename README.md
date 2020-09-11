# paper-clipper

Use Clipper's boolean and offsetting operations in Paper.js

[Paper.js](https://github.com/paperjs/paper.js) is a vector graphics scripting library.   
[js-angusj-clipper](https://github.com/xaviergonz/js-angusj-clipper) is a library with polygon offsetting and boolean operations. For optimal performance, it uses the original C++ version of [Clipper](https://sourceforge.net/projects/polyclipping/) via WebAssembly.

## Usage 

### Install `paper-clipper` in your project:

```
yarn add paper-clipper
```
or
```
npm install --save paper-clipper
```

### Initialize paper-clipper

Include methods from paper-clipper

```js
import { clipperLib, clipperOffset, clipperUnite } from 'paper-clipper'
```

In an `async` function:
```js
// Create an instance of the Clipper library (usually only do this once in your app)
const clipper = await clipperLib.loadNativeClipperLibInstanceAsync(
  clipperLib.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback
)

// Offset a Paper.js Path by 10 pixels
const path = new paper.Path(..)
const offsetPaths = await clipperOffset(clipper)(path, 10)

// Unite two Paper.js Paths
const paths = [new paper.Path(..), new paper.Path(..)]
const unitedPaths = await clipperUnite(clipper)(paperPaths)

```

Refer to [js-angusj-clipper](https://github.com/xaviergonz/js-angusj-clipper) and its [API reference](https://github.com/xaviergonz/js-angusj-clipper/blob/master/docs/apiReference/index.md) for documentation.

### clipperOffset

As Clipper supports polygons only (ie. paths without bezier curves), paper-clipper's `clipperOffset` method will [`flatten`](http://paperjs.org/reference/path/#flatten) the Paper.js Path, offset it, then apply path simplification returning an approximate offset path with great resolution and reliability.

### clipperUnite

The `clipperUnite` method accepts a Paper.js Path but will discard handles, treating the path as a polygon. It offers better performance than Paper.js [Path#unite](http://paperjs.org/reference/path/#unite-path) when this boolean operation is needed on Paths with no segment handles. 

### Further development

- Clipper's other boolean operations (Intersection, Difference, Xor) could be included in the development of this library.
- The built-in `betterSimplify` function that re-applies curves to the offset path could benefit from refactoring, accuracy and performance improvements. 


[![npm version](https://badge.fury.io/js/paper-clipper.svg)](https://badge.fury.io/js/paper-clipper)

![paper-clipper strands](https://i.imgur.com/ZajvDJx.png)
