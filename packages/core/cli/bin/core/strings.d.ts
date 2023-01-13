/**
 * @description Capitalize a string.
 * @param {string} str
 */
export declare const capitalize: (str: string) => string;
/**
 * @description Convert text to PascalCase
 * @param {string} str Text to be converted
 * @return {string} Converted string
 */
export declare const pascalCase: (str: string) => string;
/**
 * @description Convert text to camelCase
 * @param {string} str Text to be converted
 * @return {string} Converted string
 */
export declare const camelCase: (str: string) => string;
/**
 * @description Checks whether the given string is PascalCase.
 * @param {string} str
 */
export declare const isPascalCase: (str: string) => boolean;
/**
 * @description Transform a given string into a lowercase, kebab-case version of the string.
 * @param {string} str - The string to kebab-case.
 * @return {string} Lowercase and kebab-case version of the input string.
 */
export declare const kebabCase: (str: string) => string;
/**
 * @description Get the path (from root) to the new package in the /packages/ directory
 * @param {string} workspace workspace name
 * @param {string} name kebab-case package name
 * @return {string} Path to the new package source files
 */
export declare const packagePath: (workspace: string, name: string) => string;
/**
 * @description Get the path (from root) to the cli/src/__template__ directory
 * @return {string} Path to the cli/src/__template__ directory
 */
export declare const packageTemplatePath: () => string;
//# sourceMappingURL=strings.d.ts.map