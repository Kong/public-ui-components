/**
 * Sleep the provided number of milliseconds
 * @param {number} ms Number of milliseconds to wait
 * @returns {Promise}
 */
export declare const sleep: (ms?: number) => Promise<void>;
/**
 * Get the list of files recursively for a given directory.
 * @param {string} dirPath The directory path
 * @returns {Promise<string[]>} Array of file paths contained within the directory and its children
 */
export declare const getTemplateFileList: (dirPath: string) => Promise<string[]>;
//# sourceMappingURL=utils.d.ts.map