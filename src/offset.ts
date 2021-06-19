import * as clipperLib from 'js-angusj-clipper'
import paper from 'paper'
import simplify from 'simplify-js'
import paperClipperSimplify, { paperClipperSimplifyTolerance } from './paperClipperSimplify'

// @ts-ignore
paper.setup()

enum EndTypes {
  round = clipperLib.EndType.OpenRound,
  square = clipperLib.EndType.OpenSquare,
  butt = clipperLib.EndType.OpenButt,
  closed = clipperLib.EndType.ClosedPolygon // clipperLib.EndType.ClosedLine
}

enum JoinTypes {
  miter = clipperLib.JoinType.Miter,
  round = clipperLib.JoinType.Round,
  bevel = clipperLib.JoinType.Square,
}

const scale = 1000
const simplifyJsTolerance = 0.5

type ClipperOffsetOptions = {
  offset: number
  tolerance?: number
  simplify?: ((targetPath: paper.Path) => paper.Path) | Boolean
}

type ClipperOffsetCallback = {
  (path: paper.Path, options: ClipperOffsetOptions, tolerance?: number): Promise<paper.Path[]>,
  (path: paper.Path, offset: number, tolerance?: number): Promise<paper.Path[]>
}

function clipperOffset (clipper: clipperLib.ClipperLibWrapper): ClipperOffsetCallback
function clipperOffset (clipper: clipperLib.ClipperLibWrapper) {
  return async (path: paper.Path, options: any, tolerance: number = paperClipperSimplifyTolerance): Promise<paper.Path[]> => {
    const suppliedOffset = !isNaN(options)
    const suppliedOptions = typeof options === 'object' && !isNaN(options.offset)

    if (!suppliedOffset && !suppliedOptions) {
      throw (new Error(`clipperOffset callback expects an options object or offset number as second argument. 
      ex: await clipperOffset(clipper)(path, 10)
      or  await clipperOffset(clipper)(path, { offset: 10, simplify: false })`))
    }

    const offsetOptions: ClipperOffsetOptions = suppliedOptions ? options : {
      offset: options
    }
    const { closed, strokeJoin, strokeCap, miterLimit } = path
    const pathCopy = path.clone() as paper.Path
    pathCopy.flatten(1)
    
    const data = pathCopy.segments.map(({ point }) =>
    ({
      x: Math.round(point.x * scale),
      y: Math.round(point.y * scale)
    })
    )

    const offsetPaths = clipper.offsetToPaths({
      delta: offsetOptions.offset * scale,
      miterLimit: miterLimit * scale,
      arcTolerance: 0.25 * scale,
      offsetInputs: [{
        // @ts-ignore
        joinType: JoinTypes[strokeJoin],
        // @ts-ignore
        endType: closed ? EndTypes.closed : EndTypes[strokeCap],
        data
      }]
    })

    if (!offsetPaths) return []

    const isfunction = (fn: any): fn is Function => typeof fn === 'function'
    const isUndefinedOrTrue = (opt: any) => typeof opt === "undefined" || opt === true
    
    // If simplify option is a function, then use the function provided
    const simplifyFn = isfunction(offsetOptions.simplify) ? offsetOptions.simplify
      // If simplify option is underfined or true, use built-in simplify function
      : isUndefinedOrTrue(offsetOptions.simplify) ? paperClipperSimplify(tolerance)
      // Otherwise perform no-op when processing path
      : (path: paper.Path) => path

    return offsetPaths
      .map(offsetPath =>
        new paper.Path({
          closed: true,
          // The simplify-js library performs simplifications on polygons. This improves performance before simplifying into curves with Paper.
          segments: simplify(offsetPath.map(point => ({
            x: point.x / scale,
            y: point.y / scale
          })), simplifyJsTolerance)
        })
      )
      .map(simplifyFn)
      .filter(offsetPath => offsetPath.length)
  }
}

export default clipperOffset
