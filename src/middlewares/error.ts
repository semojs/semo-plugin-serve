import _ from 'lodash'
import day from 'dayjs'
import {
  ERROR_CODE_INVALID,
  ERROR_INTERNAL,
  ERROR_UNKNOWN,
  errors,
  Exception,
} from '../common/exception.js'

export const errorMiddleware = async (ctx, next) => {
  // Default to return JSON format
  ctx.json = true

  // Default error codes definition
  ctx.errors = errors

  // Default exception class
  ctx.Exception = Exception

  // Add custom error codes
  ctx.error = (code, msg, status = 200, info = null) => {
    if (!code || !_.isInteger(code) || !_.isInteger(status)) {
      throw new ctx.Exception(ERROR_CODE_INVALID)
    }

    if (!msg) {
      if (ctx.errors[code]) {
        throw new ctx.Exception(code, null, status, info)
      } else {
        throw new ctx.Exception(ERROR_UNKNOWN, null, status, info)
      }
    } else {
      if (!_.isString(msg)) {
        throw new ctx.Exception(ERROR_INTERNAL, null, status, info)
      }
      if (!ctx.errors[code]) {
        ctx.errors[code] = { msg, status }
      }
      throw new ctx.Exception(code, msg, status, info)
    }
  }

  try {
    const startTime = new Date()
    ctx.reqId =
      day(startTime).format('YYYYMMDD_HHmm_ssSSS') +
      '_' +
      _.padStart(_.random(0, 0xffffffff).toString(16), 8, '0')
    await next()
  } catch (e) {
    if (
      process.env.SEMO_SERVE_DISABLE_ERROR_STACK !== '1' &&
      process.env.NODE_ENV !== 'production'
    ) {
      console.error(e)
    }

    if (e instanceof Exception) {
      // Prepared known error
      ctx.status = e.status
      ctx.body = {
        reqId: ctx.reqId,
        code: e.code,
        msg: e.msg,
      }

      if (e.info) {
        ctx.body.info = e.info
      }
    } else {
      // Unknown error
      ctx.status = 500
      ctx.body = {
        reqId: ctx.reqId,
        code: 1,
        msg: 'Unknown error',
      }
    }
    if (
      process.env.SEMO_SERVE_DISABLE_ERROR_STACK !== '1' &&
      process.env.NODE_ENV !== 'production'
    ) {
      ctx.body.stack = e.stack // In non-production environment, return stack trace to frontend
    }
  }
}
