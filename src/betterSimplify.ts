import paper from 'paper'

const geomEpsilon = 1e-4

const clearData = (item: paper.Item) => {
  item.data = {}
  return item
}

const cloneWithoutData = (item: paper.Item) => 
  clearData(item.clone({ insert: false }))

// Get part of a path from offset to offset
// Returns new path
const getPathPart = (targetPath: paper.Path, from: number, distance = Infinity) => {
  const reverse = distance < 0
  const path = cloneWithoutData(targetPath) as paper.Path
  const pathPart = path.splitAt(from) || path

  if (reverse) {
    const pathLength = path.length
    const reverseOffset = pathLength - Math.abs(distance)
    const withinPath = reverseOffset > 0

    if (withinPath) {
      const pathPartReverse = path.splitAt(reverseOffset)

      pathPartReverse.reverse()

      return pathPartReverse
    }

    path.reverse()

    return path
  } else {
    const withinPath = distance < pathPart.length

    if (withinPath) {
      pathPart.splitAt(distance)
    }

    return pathPart
  }
}

// Must be a segment with no handles
const getSegmentAngle = (segment: paper.Segment) => {
  if (!segment.path.closed && (segment.isFirst() || segment.isLast())) return null

  const { handleIn, handleOut, point, path } = segment

  const hasHandleIn = handleIn.length > geomEpsilon
  const hasHandleOut = handleOut.length > geomEpsilon

  const inPointAngleLocation = path.getLocationAt(segment.isFirst() ? path.length - 1 : segment.previous.location.offset)
  const outPointAngleLocation = path.getLocationAt(segment.isLast() ? 1 : segment.next.location.offset)

  if (!inPointAngleLocation || !outPointAngleLocation) return null

  const inPointAngle = inPointAngleLocation.point.subtract(point).angle
  const outPointAngle = outPointAngleLocation.point.subtract(point).angle

  const inAngle = hasHandleIn ? handleIn.angle : inPointAngle
  const outAngle = hasHandleOut ? handleOut.angle : outPointAngle

  const angle = 180 - Math.abs(Math.abs(inAngle - outAngle) - 180)

  return angle
}

const segmentIsAngled = (threshold = 1) => (segment: paper.Segment) => {
  const angle = getSegmentAngle(segment) as number
  const isAngled = angle > geomEpsilon && angle < (180 - threshold)

  return isAngled
}

const removeDuplicateAdjacentSegments = (path: paper.Path): paper.Path => {
  const { segments } = path
  const segmentsBefore = segments.length

  segments.forEach(segment => {
    const { next } = segment

    if (!next) return

    const duplicateSegment = segment.point.isClose(next.point, geomEpsilon)

    if (duplicateSegment) {
      next.handleIn = segment.handleIn.clone()

      segment.remove()
    }
  })

  return segmentsBefore > segments.length ? removeDuplicateAdjacentSegments(path) : path
}

const splitAtOffsets = (path: paper.Path) => (offsets: number[]) => {
  if (offsets.length === 0) return [path]
  if (offsets.length === 1 && path.closed) return [path]

  return offsets.reduce((pathParts: paper.Path[], offset, i, offsetsArr) => {
    const prevOffset = offsetsArr[i - 1] || 0
    const pathPart = getPathPart(path, prevOffset, offset - prevOffset)
    const isLast = i === offsetsArr.length - 1

    pathParts = pathParts.concat(pathPart)

    if (isLast && !path.closed) {
      const lastPathPart = getPathPart(path, offset, Infinity)

      pathParts = pathParts.concat(lastPathPart)
    }

    return pathParts
  }, [])
}

const joinPaths = (paths: paper.Path[]) => {
  if (paths.length === 0) return null

  return paths.reduce((path, pathPart, i) => {
    if (i === 0) return pathPart

    path.join(pathPart, geomEpsilon)
    return path
  })
}

const simplifyCopy = (tolerance: number) => (targetPathPart: paper.Path) => {
  const pathPart = targetPathPart.clone({ insert: false }) as paper.Path

  pathPart.simplify(tolerance)

  const hasMoreSegments = pathPart.segments.length >= targetPathPart.segments.length

  return hasMoreSegments ? targetPathPart : pathPart
}

const betterSimplify = (tolerance: number) => (targetPath: paper.Path): paper.Path => {
  const path = removeDuplicateAdjacentSegments(targetPath)
  const isClosed = path.closed

  if (path.length === 0) return targetPath

  if (isClosed) {
    path.closed = false
    path.addSegments([path.firstSegment.clone()])
  }

  const angledSegments = path.segments.filter(segmentIsAngled(45))
  const angledSegmentOffsets = angledSegments.map(
    segment => segment.location.offset
  )

  const pathParts = splitAtOffsets(path)(angledSegmentOffsets)
    .map(removeDuplicateAdjacentSegments)

  const simplifiedPathParts = pathParts
    .map(simplifyCopy(tolerance))

  const joinedPath = joinPaths(simplifiedPathParts)

  if (!joinedPath) return targetPath

  if (isClosed) {
    joinedPath.join(joinedPath)
    joinedPath.closed = true
  }

  return joinedPath
}

export default betterSimplify
