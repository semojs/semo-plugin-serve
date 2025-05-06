import { ERROR_ROUTE_NOT_FOUND } from '../common/exception.js'

// Middleware for handling unmatched routes
export async function notFoundMiddleware(ctx, next) {
  await next()
  if (!ctx.body) {
    // Only executed when no previous middleware set ctx.body
    ctx.error(ERROR_ROUTE_NOT_FOUND, `Undefined route ${ctx.path}`, 400)
  }
}
