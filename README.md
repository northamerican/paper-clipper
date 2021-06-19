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
import { clipperLib, clipperOffset, clipperUnite, paperClipperSimplify } from 'paper-clipper';
```

In an `async` function, create an instance of the Clipper library (usually only do this once in your app):

```js
const clipper = await clipperLib.loadNativeClipperLibInstanceAsync(
  clipperLib.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback,
);
```

### clipperOffset

As Clipper supports polygons only (ie. paths without bezier curves), paper-clipper's `clipperOffset` method will [`Path#flatten`](http://paperjs.org/reference/path/#flatten) the Paper.js Path, offset it, then apply path simplification to the resulting path.

Path simplification and smoothing is performed by the built-in `paperClipperSimplify` function which uses Paper's [`Path#simplify`](http://paperjs.org/reference/path/#simplify) method, modified to better retain edges of the input path.

```js
const path = new paper.Path(..)

// Set strokeJoin on path for styling of expanded path edges
path.strokeJoin = 'round' // or 'miter' or 'bevel'
// Set strokeCap for styling of the ends of open paths
path.strokeCap = 'round' // or 'square' or 'butt'

// Offset a Paper.js Path
// By 10 pixels
const offsetPaths = await clipperOffset(clipper)(path, 10)

// With simplification disabled
// This returns an offset path with many segments, all without handles
const offsetPaths = await clipperOffset(clipper)(path, { offset: 10, simplify: false })

// With a custom simplify method applied to the offset path
// mySimplifyFn = (path) => output path
const offsetPaths = await clipperOffset(clipper)(path, { offset: 10, simplify: mySimplifyFn })

// With tolerance applied to the built-in paperClipperSimplify method. (default: 0.25)
const offsetPaths = await clipperOffset(clipper)(path, { offset: 10, tolerance: 2 })
```

### clipperUnite

The `clipperUnite` method accepts a Paper.js Path but will discard handles, treating the path as a polygon. It offers better performance than Paper.js [`Path#unite`](http://paperjs.org/reference/path/#unite-path) when this boolean operation is needed on Paths with no segment handles.

```js
// Unite two Paper.js Paths
const paths = [new paper.Path(..), new paper.Path(..)]
const unitedPaths = await clipperUnite(clipper)(paperPaths)
```

Refer to [js-angusj-clipper](https://github.com/xaviergonz/js-angusj-clipper) and its [API reference](https://github.com/xaviergonz/js-angusj-clipper/blob/master/docs/apiReference/index.md) for documentation.

### Further development

- Clipper's other boolean operations (Intersection, Difference, Xor) could be included in the development of this library.

[![npm version](https://badge.fury.io/js/paper-clipper.svg)](https://badge.fury.io/js/paper-clipper)

![paper-clipper strands](https://i.imgur.com/ZajvDJx.png)
