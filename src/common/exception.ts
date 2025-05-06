import _ from 'lodash'

export interface ErrorItem {
  msg: string
  status: number
}

export interface ErrorList {
  [key: number]: ErrorItem
}

export const errors: ErrorList = {
  1: { msg: 'Unknown error', status: 500 },
  2: { msg: 'Invalid error code', status: 400 },
  3: { msg: 'Parameter validation failed', status: 400 },
  4: { msg: 'Route not defined', status: 400 },
  5: { msg: 'Internal server error', status: 500 },
}

export const ERROR_UNKNOWN = 1
export const ERROR_CODE_INVALID = 2
export const ERROR_VALIDATE_FAILED = 3
export const ERROR_ROUTE_NOT_FOUND = 4
export const ERROR_INTERNAL = 5

export class Exception extends Error {
  code: number
  msg: string
  status: number
  info: any

  constructor(code, msg, status, info = '') {
    let errMsg
    const errCode = code || ERROR_UNKNOWN
    if (msg || errors[errCode]) {
      if (_.isObject(errors[errCode])) {
        errMsg = msg || errors[errCode].msg || ''
        status = status || errors[errCode].status || 200
      } else {
        errMsg = msg || ''
        status = status || 200
      }
    } else {
      errMsg = 'Undefined error'
      status = 500
    }

    super(errMsg)

    this.code = errCode
    this.msg = errMsg
    this.status = status
    this.info = info
  }
}
