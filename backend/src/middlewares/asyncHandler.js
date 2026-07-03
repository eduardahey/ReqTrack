export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function wrapControllers(controllers) {
  return Object.fromEntries(
    Object.entries(controllers).map(([name, fn]) => [name, asyncHandler(fn)])
  )
}
