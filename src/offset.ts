import * as clipperLib from 'js-angusj-clipper'
import paper from 'paper'
import simplify from 'simplify-js'
import betterSimplify from './betterSimplify'

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

const clipperOffset = (clipper: clipperLib.ClipperLibWrapper) => async (path: paper.Path, offset: number, tolerance: number = 0.5): Promise<paper.Path[]> => {
  const { closed, strokeJoin, strokeCap } = path
  const pathCopy = path.clone() as paper.Path
  pathCopy.flatten(1)
  
  const data = pathCopy.segments.map(({ point }) => 
    ({ 
      x: Math.round(point.x * scale), 
      y: Math.round(point.y * scale) 
    })
  )

  const offsetPaths = clipper.offsetToPaths({
    delta: offset * scale,
    arcTolerance: 0.25 * scale,
    offsetInputs: [{
      // @ts-ignore
      joinType: JoinTypes[strokeJoin],
      // @ts-ignore
      endType: closed ? EndTypes.closed : endTypes[strokeCap],
      data
    }]
  })

  if (!offsetPaths) return []

  return offsetPaths
    .map(offsetPath => 
      new paper.Path({
        closed,
        segments: simplify(offsetPath.map(point => ({ 
          x: point.x / scale, 
          y: point.y / scale 
        })), tolerance)
      })
    )
    .map(betterSimplify(0.25))
    .filter(offsetPath => offsetPath.length)
}

export default clipperOffset
