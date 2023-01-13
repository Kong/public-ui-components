import fs from 'fs'
import path from 'path'
import { sleep, packagePath, pascalCase, packageTemplatePath, getTemplateFileList } from '.'
import { createSpinner, Spinner } from 'nanospinner'
import pc from 'picocolors'
import boxen from 'boxen'
import emoji from 'node-emoji'
import inquirer, { Answers } from 'inquirer'
import questions from '../questions'

const { workspaceName, packageName, confirmPackageName } = questions

/**
 * @description Create new files for package
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
  // eslint-disable-next-line array-callback-return
  for (const filename of packageFilesToCreate) {
    const stats = fs.statSync(filename)
    const filenamePath = filename.split('__template__/')
    const relativePath = filenamePath[1]
    const newFilePath = `${workspace}/${packagePath(workspace, packageName)}/${relativePath.replace(/Template/g, componentName)}`

    // If template files exist
    if (stats.isFile()) {
      // Check if directory exists; if not, create it
      if (!fs.existsSync(path.dirname(newFilePath))) {
        await fs.mkdirSync(`${path.dirname(newFilePath)}`, { recursive: true })
      }

      // Replace template strings
      const fileContent = fs.readFileSync(filename, 'utf8')
        .replace(/{%%PACKAGE_NAME%%}/g, packageName)
        .replace(/{%%COMPONENT_NAME%%}/g, componentName)
        .replace(/{%%WORKSPACE%%}/g, workspace)

      // TODO: Replace Vue peerDependency version in the __template__/package.json file

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
$ ${pc.cyan(`pnpm --filter "@kong-ui/${workspace}-${packageName}" {your command}`)}

# Start the sandbox dev server
$ ${pc.cyan(`pnpm --filter "@kong-ui/${workspace}-${packageName}" run dev`)}
`,
    {
      title: `@kong-ui/${workspace}-${packageName}`,
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
    title: '@kong-ui',
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
      console.log('  New workspaces must be added and configured manually.')
      console.log(`  Tag ${pc.cyan('@Kong/team-core-ui')} for help.`)
      console.log('')

      // Exit
      process.exit(0)
    }

    // Ask for the package name
    const { name } = await inquirer.prompt([packageName(workspace)])

    // Output a message confirming their package name
    console.log('  Package name: ' + pc.cyan(`@kong-ui/${workspace}-${name}`))

    // Ask the user to confirm the package name
    const { confirmName } = await inquirer.prompt([confirmPackageName])

    if (!confirmName) {
      // The user did NOT confirm the package name, so inform them that we're starting over
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
