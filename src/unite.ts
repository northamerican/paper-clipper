import * as clipperLib from 'js-angusj-clipper'
import paper from 'paper'

// @ts-ignore
paper.setup()

enum FillTypes {
  evenodd = clipperLib.PolyFillType.EvenOdd,
  nonzero = clipperLib.PolyFillType.NonZero
}

const clipperOffset = (clipper: clipperLib.ClipperLibWrapper) => async (paths: paper.Path[]): Promise<paper.Path[]> => {
  const scale = 1000
  const data = paths.map(path => 
    path.segments.map(({ point }) => ({ x: Math.round(point.x * scale), y: Math.round(point.y * scale) }))
  )

  const { closed, fillRule } = paths[0]
  
  const unitedPaths = clipper.clipToPaths({
    clipType: clipperLib.ClipType.Union,
    // @ts-ignore
    subjectFillType: FillTypes[fillRule],
    subjectInputs: [{
      closed,
      data
    }]
  })

  if (!unitedPaths) return []

  return unitedPaths
    .map(path => 
      new paper.Path({
        closed,
        segments: path.map(point => ({ x: point.x / scale, y: point.y / scale }))
      })
    )
}

export default clipperOffset