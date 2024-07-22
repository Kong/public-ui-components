import fs from 'fs'

/**
 * Sleep the provided number of milliseconds
 * @param {number} ms Number of milliseconds to wait
 * @returns {Promise}
 */
export const sleep = (ms = 2200): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get the list of files recursively for a given directory.
 * @param {string} dirPath The directory path
 * @returns {Promise<string[]>} Array of file paths contained within the directory and its children
 */
export const getTemplateFileList = async (dirPath: string): Promise<string[]> => {
  let files: string[] = []
  const items = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const item of items) {
    if (item.isDirectory()) {
      files = [
        ...files,
        ...(await getTemplateFileList(`${dirPath}/${item.name}`)),
      ]
    } else {
      files.push(`${dirPath}/${item.name}`)
    }
  }

  return files
}
