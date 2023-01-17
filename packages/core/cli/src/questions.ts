import { kebabCase, packagePath } from './core'
import inquirer from 'inquirer'
import pc from 'picocolors'
import fs from 'fs'

export default {
  workspaceName: {
    type: 'list',
    name: 'workspace',
    message: 'Select the workspace for your new package:',
    choices: [
      'core',
      'portal',
      new inquirer.Separator(),
      'other',
    ],
    default: 'core',
  },
  packageName: (workspace: string) => ({
    type: 'input',
    name: 'name',
    message: 'What is the kebab-case name of the new package?',
    filter: async (input: string): Promise<string> => kebabCase(input).replace(/[^a-z-]/gi, ''),
    transformer: (input: string): string => {
      return `@kong-ui/${workspace}-${pc.cyan(pc.bold(input))}`
    },
    validate: async (input: string) => {
      if (!input.trim()) {
        return 'Error: A package name is required.'
      } else if (input.startsWith('-')) {
        return 'Error: The package name can not start with a dash.'
      } else if (input.endsWith('-')) {
        return 'Error: The package name can not end with a dash.'
      } else if (input.includes('--')) {
        return 'Error: The package name should not include a double-dash \'--\'.'
      } else if (fs.existsSync(packagePath(workspace, input))) {
        // Package with name already exists
        return `Error: The package '${kebabCase(input)}' already exists`
      }
      return true
    },
  }),
  confirmPackageName: {
    type: 'confirm',
    name: 'confirmName',
    message: 'Continue with the package name shown above?',
    default: false,
  },
}
