import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { sleep, packagePath, pascalCase, packageTemplatePath, getTemplateFileList, devDependencies, peerDependencies } from './index.js'
import type { Spinner } from 'nanospinner'
import { createSpinner } from 'nanospinner'
import pc from 'picocolors'
import boxen from 'boxen'
import * as emoji from 'node-emoji'
import type { Answers } from 'inquirer'
import inquirer from 'inquirer'
import questions from '../questions.js'

const { workspaceName, packageName, confirmPackageName } = questions

/**
 * Sanitize package/filename to exclude undesired strings
 * IMPORANT: If this function is changed, you **must** change the function in `/vite.config.shared.ts` as well.
 * @param {string} packageName The string to sanitize
 * @returns {string} The sanitized package/filename string
 */
export const sanitizePackageName = (packageName: string): string => {
  // Add additional replace rules as needed

  // Replace any variation of string 'Analytics' in assets and chunks. These are in order to preserve capitalization.
  // (Some adblock filter lists deny requests for files starting with "assets/analytics".  See MA-926 for more context.)
  const sanitizedName = (packageName || '').replace(/Analytics/g, 'Vitals').replace(/analytics/gi, 'vitals')

  return sanitizedName
}

/**
 * @description Create new files for package
 * @param {string} workspace Workspace name
 * @param {string} packageName Package name
 * @return {*}
 */
const createPackageFiles = async (workspace: string, packageName: string): Promise<void> => {
  const spinner: Spinner = createSpinner('Creating new package...').start()
  await sleep()

  const componentName = pascalCase(packageName) // e.g. DemoComponent

  //
  // SOURCE FILES
  // =========================
  const packageFilesTemplatePath = packageTemplatePath()
  const packageFilesToCreate = await getTemplateFileList(packageFilesTemplatePath)

  // Check to ensure packages/${workspace}/{packageName} directory does not already exist
  if (fs.existsSync(packagePath(workspace, packageName))) {
    spinner.error({ text: `Error: 'packages/${workspace}/${packageName}' already exists` })
    process.exit(1)
  }

  spinner.success({ text: 'Verified that the package does not already exist.' })

  spinner.start({ text: 'Creating new package directory...' })

  // Create new package directory packages/${workspace}/{packageName}
  fs.mkdirSync(packagePath(workspace, packageName), { recursive: true })

  spinner.success({ text: `Created packages/${workspace}/${pc.cyan(packageName)} directory.` })

  spinner.start({ text: 'Creating package files...' })

  // Create new files in packages/${workspace}/{packageName}

  for (const filename of packageFilesToCreate) {
    const stats = fs.statSync(filename)
    const filenamePath = filename.split('__template__/')
    if (!filenamePath[1]) {
      continue
    }
    const relativePath = filenamePath[1]
    const newFilePath = `${packagePath(workspace, packageName)}/${relativePath.replace(/Template/g, componentName)}`
    // Replace any variation of string 'Analytics' in assets and chunks. These are in order to preserve capitalization.
    // (Some adblock filter lists deny requests for files starting with "assets/analytics". See MA-926 for more context.)
    const sanitizedPackageName = sanitizePackageName(packageName)

    // If template files exist
    if (stats.isFile()) {
      // Check if directory exists; if not, create it
      if (!fs.existsSync(path.dirname(newFilePath))) {
        await fs.mkdirSync(`${path.dirname(newFilePath)}`, { recursive: true })
      }

      // Replace template strings
      const fileContent = fs.readFileSync(filename, 'utf8')
        .replace(/{%%PACKAGE_NAME%%}/g, packageName)
        // The SANITIZED_PACKAGE_NAME replaces `analytics` with `vitals`
        .replace(/{%%SANITIZED_PACKAGE_NAME%%}/g, sanitizedPackageName)
        .replace(/{%%COMPONENT_NAME%%}/g, componentName)
        .replace(/{%%WORKSPACE%%}/g, workspace)
        .replace(/{%%CURRENT_YEAR%%}/g, String(new Date().getFullYear()))
        // Conditionally modify the {packageName}/sandbox/tsconfig.json
        .replace(/{%%SANDBOX_TSCONFIG_PATHS%%}/g, workspace !== 'entities'
          ? ''
          : `,
    "paths": {
      "@entities-shared-sandbox/*": [
        "../../entities-shared/sandbox/shared/*"
      ]
    }`)

      fs.writeFileSync(newFilePath, fileContent, 'utf8')
    }
  }

  spinner.success({ text: 'Created the package files.' })

  spinner.start({ text: 'Verifying file structure...' })

  await sleep()

  const fileStructure = pc.cyan(`
    ${pc.white(`packages/${workspace}/`)}
    ${pc.white('└──')} ${packageName}/
        ├── sandbox/
        ├── src/
        │   ├── components/
        │   ├── locales/
        ├── package.json
        ├── README.md
        ├── tsconfig.build.json
        ├── tsconfig.json
        └── vite.config.ts
    `,
  )

  spinner.success({ text: 'Verified the package structure.' })

  spinner.start({ text: 'Installing package dependencies...' })
  await sleep()

  spinner.start({ text: 'Installing package devDependencies...' })
  await sleep()

  // Install devDependencies
  for (const dep of devDependencies) {
    await execSync(`pnpm --filter="@kong-ui-public/${packageName}" add -D "${dep}"`, { stdio: 'inherit' })
  }

  spinner.success({ text: 'Installed package devDependencies.' })

  spinner.start({ text: 'Adding package peerDependencies...' })
  await sleep()

  // Install peerDependencies
  for (const dep of peerDependencies) {
    await execSync(`pnpm --filter="@kong-ui-public/${packageName}" add --save-peer "${dep}"`, { stdio: 'inherit' })
  }

  spinner.success({ text: 'Added package peerDependencies.' })

  spinner.start({ text: 'Initializing repository dependencies...' })
  await sleep()

  await execSync('pnpm install', { stdio: 'inherit' })

  spinner.success({ text: 'Initialized repository dependencies.' })

  spinner.success({
    text: `Created the new '${pc.cyan(packageName)}' package and its related files:
    ${fileStructure}`,
  })

  console.log(boxen(
    `
${pc.cyan(pc.bold(`Start Coding ${emoji.get('rocket')}`))}

Check out your package files in /packages/${workspace}/${packageName}/*

Your package also comes pre-configured with a Vue
sandbox where you can interact with your component(s).

Configure the component imports and usage inside the
/packages/${workspace}/${packageName}/sandbox/ directory.

# Run commands for your package from the root
$ ${pc.cyan(`pnpm --filter "@kong-ui-public/${packageName}" {your command}`)}

# Start the sandbox dev server
$ ${pc.cyan(`pnpm --filter "@kong-ui-public/${packageName}" run dev`)}
`,
    {
      title: `@kong-ui-public/${packageName}`,
      titleAlignment: 'center',
      textAlignment: 'left',
      padding: 1,
      margin: 1,
    },
  ))
}

export const createPackage = async (): Promise<void> => {
  console.clear()
  console.log(boxen(pc.cyan(pc.bold(`${emoji.get('sparkles')} Create a new package ${emoji.get('sparkles')}`)), {
    title: '@kong-ui-public',
    titleAlignment: 'center',
    textAlignment: 'center',
    padding: 1,
    margin: 1,
  }))

  const getPackageName = async (): Promise<Answers> => {
    // Ask the user to choose a workspace
    const { workspace } = await inquirer.prompt([workspaceName])

    if (workspace === 'other') {
      // The user wants to choose a workspace that doesn't exist
      console.log('')
      console.log(pc.red(`  New workspaces must be added and configured by ${pc.bold('@Kong/team-core-ui')}.`))
      console.log('')
      console.log(`  Reach out on Slack in ${pc.cyan('#team-konnect-core-ui')}`)
      console.log(`  or tag ${pc.cyan('@Kong/team-core-ui')} on GitHub for help.`)
      console.log('')

      // Exit
      process.exit(0)
    }

    // Ask for the package name
    const { name } = await inquirer.prompt([packageName(workspace)])

    // Output a message confirming their package name
    console.log('  Package name: ' + pc.cyan(`@kong-ui-public/${name}`))

    // Ask the user to confirm the package name
    const { confirmName } = await inquirer.prompt([confirmPackageName])

    if (!confirmName) {
      // The user did NOT confirm the package name, so inform them that we're starting over
      console.clear()
      console.log('  Ok, let\'s start over...')
      console.log('')

      // Start over
      return getPackageName()
    }

    return {
      workspace,
      name,
    }
  }

  const answers = await getPackageName()

  // Create packages/* files
  await createPackageFiles(answers.workspace, answers.name)
}
