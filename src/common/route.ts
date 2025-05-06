import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface ImportDirectoryOptions {
  /** Regular expression to exclude files */
  exclude?: RegExp
  /** Allowed file extensions */
  extensions?: string[]
  /** Whether to recursively process subdirectories */
  recurse?: boolean
  /** Rename function */
  rename?: (name: string) => string
}

export interface ModuleMap {
  [key: string]: any
}

/**
 * Recursively import all module files in a directory
 * @param directoryPath - Directory path to read
 * @param options - Configuration options
 * @returns Object containing all modules
 */
export const importDirectory = async function (
  directoryPath: string,
  options: ImportDirectoryOptions = {}
): Promise<ModuleMap> {
  const {
    exclude = /^\./,
    extensions = ['.js', '.ts'],
    recurse = true,
    rename = (name: string) => name,
  } = options

  const result: ModuleMap = {}

  try {
    const files = await fs.readdir(directoryPath)

    for (const file of files) {
      const fullPath = path.join(directoryPath, file)
      const stat = await fs.stat(fullPath)

      // Check if should be excluded
      if (exclude && exclude.test(file)) {
        continue
      }

      if (stat.isDirectory()) {
        // Process subdirectory
        if (recurse) {
          const nestedModules = await importDirectory(fullPath, options)
          if (Object.keys(nestedModules).length > 0) {
            const dirName = rename(file)
            result[dirName] = nestedModules
          }
        }
      } else {
        // Process file
        const ext = path.extname(file)
        if (extensions.includes(ext)) {
          const fileName = path.basename(file, ext)
          const moduleName = rename(fileName)

          try {
            // Convert file path to URL format
            const moduleUrl = new URL(fullPath, import.meta.url).href
            const module = await import(moduleUrl)
            result[moduleName] = module.default || module
          } catch (error) {
            console.error(`Error importing module ${fullPath}:`, error)
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error)
    throw error
  }

  return result
}
