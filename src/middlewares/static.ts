import send from 'koa-send'
import path from 'node:path'
import { ERROR_INTERNAL } from '../common/exception.js'
import { SemoServerOptions } from '../common/types.js'

export default (opts: SemoServerOptions) => {
  return async (ctx, next) => {
    await next()
    // Static resources only support HEAD and GET methods
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

    const sendOptions = {
      root: path.resolve(opts.publicDir),
      index: opts.fileIndex,
    }

    if (ctx.body != null || ctx.status !== 404) return
    try {
      await send(ctx, ctx.path, sendOptions)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      } else {
        try {
          if (!opts.spa) {
            if (opts.file404) {
              await send(ctx, opts.file404, sendOptions)
            } else if (opts.static404) {
              ctx.body = '404 Not Found'
              ctx.status = 404
            }
          } else {
            if (opts.fileIndex) {
              await send(ctx, '/', sendOptions)
            } else {
              if (opts.file404) {
                await send(ctx, opts.file404, sendOptions)
              } else if (opts.static404) {
                ctx.body = '404 Not Found'
                ctx.status = 404
              }
            }
          }
        } catch (e) {
          ctx.error(ERROR_INTERNAL, e.message)
        }
      }
    }
  }
}
