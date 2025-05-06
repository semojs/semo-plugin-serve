import mime from 'mime-types'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ERROR_INTERNAL } from '../common/exception.js'
import { SemoServerOptions } from '../common/types.js'

const isFileExist = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// File browser middleware
export const fileBrowser = function (opts: SemoServerOptions) {
  return async (ctx, next) => {
    await next()
    if (ctx.body) return

    // Get request path
    const reqPath = ctx.path
    // Convert request path to actual filesystem path
    const fullPath = path.resolve(
      opts.publicDir,
      decodeURIComponent(reqPath.replace(/^\//, ''))
    )
    const fileIndexExists = await isFileExist(opts.fileIndex)
    try {
      if (reqPath === '/' && fileIndexExists) {
        // If request path is empty and index.html exists, return it as homepage
        ctx.status = 200
        ctx.type = 'text/html'
        ctx.body = await fs.readFile(opts.fileIndex)
      } else {
        try {
          const stats = await fs.stat(fullPath)
          if (stats.isDirectory()) {
            // If it's a directory, first try to find index.html
            const indexPath = path.join(fullPath, 'index.html')
            const indexPathExists = await isFileExist(indexPath)
            if (indexPathExists) {
              await fs.access(indexPath)
              // If index.html exists, return it
              ctx.status = 200
              ctx.type = 'text/html'
              ctx.body = await fs.readFile(indexPath)
            } else {
              // If no index.html, show directory listing
              if (!opts.disableIndexDirectory) {
                const files = await fs.readdir(fullPath)
                const fileList = await Promise.all(
                  files.map(async (file) => {
                    const filePath = path.join(fullPath, file)
                    const stats = await fs.stat(filePath)
                    return {
                      name: file,
                      isDirectory: stats.isDirectory(),
                      size: stats.size,
                      mtime: stats.mtime.toLocaleString(),
                    }
                  })
                )

                ctx.status = 200
                // Generate HTML page
                ctx.type = 'text/html'
                ctx.body = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Index of ${reqPath}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 2em; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { text-align: left; padding: 8px; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    th { background-color: #4CAF50; color: white; }
                    a { text-decoration: none; color: #0366d6; }
                    .directory { font-weight: bold; }
                  </style>
                </head>
                <body>
                  <h2>Index of ${reqPath}</h2>
                  <table>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Last Modified</th>
                    </tr>
                    ${
                      reqPath !== '/'
                        ? `
                    <tr>
                      <td><a href="${path.join(reqPath, '..')}">../</a></td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                    `
                        : ''
                    }
                    ${fileList
                      .map(
                        (file) => `
                      <tr>
                        <td>
                          <a href="${path.join(reqPath, file.name)}" class="${file.isDirectory ? 'directory' : ''}">
                            ${file.name}${file.isDirectory ? '/' : ''}
                          </a>
                        </td>
                        <td>${file.isDirectory ? '-' : formatFileSize(file.size)}</td>
                        <td>${file.mtime}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </table>
                </body>
              </html>
            `
              } else {
                // If directory listing is disabled, return 403
                ctx.status = 403
                ctx.body = 'Directory listing is disabled'
              }
            }
          } else {
            // If it's a file, return file content directly
            ctx.type = mime.lookup(fullPath) || 'application/octet-stream'
            ctx.body = await fs.readFile(fullPath)
          }
        } catch {
          if (opts.apiPrefix && reqPath.startsWith(opts.apiPrefix)) {
            // Do nothing, give to final middleware to handle
          } else {
            // If file doesn't exist, return 404
            if (opts.file404) {
              ctx.type = 'text/html'
              ctx.body = await fs.readFile(opts.file404)
            } else if (opts.static404) {
              ctx.body = '404 Not Found'
              ctx.status = 404
            }
          }
        }
      }
    } catch (e) {
      ctx.error(ERROR_INTERNAL, e.message)
    }
  }
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
