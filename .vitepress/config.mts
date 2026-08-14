import { defineConfig } from 'vitepress'
import { readdirSync, existsSync, statSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packagesDir = join(__dirname, '..', 'packages')

function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

function generateSidebar(): SidebarItem[] {
  const groups = readdirSync(packagesDir).filter((entry) => {
    const fullPath = join(packagesDir, entry)
    return statSync(fullPath).isDirectory()
  })

  const sidebar: SidebarItem[] = []

  for (const group of groups.sort()) {
    const groupPath = join(packagesDir, group)
    const packages = readdirSync(groupPath).filter((entry) => {
      return statSync(join(groupPath, entry)).isDirectory()
    })

    const groupItems: SidebarItem[] = []

    for (const pkg of packages.sort()) {
      const docsPath = join(groupPath, pkg, 'docs')
      if (!existsSync(docsPath) || !statSync(docsPath).isDirectory()) {
        continue
      }

      const mdFiles = readdirSync(docsPath)
        .filter((file) => file.endsWith('.md'))
        .sort()

      if (mdFiles.length === 0) continue

      const docItems: SidebarItem[] = mdFiles.map((file) => {
        const name = basename(file, '.md')
        return {
          text: toTitleCase(name),
          link: `/${group}/${pkg}/${name}`,
        }
      })

      groupItems.push({
        text: pkg,
        collapsed: true,
        items: docItems,
      })
    }

    if (groupItems.length > 0) {
      sidebar.push({
        text: toTitleCase(group),
        collapsed: false,
        items: groupItems,
      })
    }
  }

  return sidebar
}

function generateRewrites(): Record<string, string> {
  const rewrites: Record<string, string> = {}
  const groups = readdirSync(packagesDir).filter((entry) => {
    return statSync(join(packagesDir, entry)).isDirectory()
  })

  for (const group of groups) {
    const groupPath = join(packagesDir, group)
    const packages = readdirSync(groupPath).filter((entry) => {
      return statSync(join(groupPath, entry)).isDirectory()
    })

    for (const pkg of packages) {
      const docsPath = join(groupPath, pkg, 'docs')
      if (!existsSync(docsPath) || !statSync(docsPath).isDirectory()) {
        continue
      }

      const mdFiles = readdirSync(docsPath).filter((file) => file.endsWith('.md'))

      for (const file of mdFiles) {
        const name = basename(file, '.md')
        rewrites[`packages/${group}/${pkg}/docs/${file}`] = `${group}/${pkg}/${name}.md`
      }
    }
  }

  return rewrites
}

export default defineConfig({
  title: 'Public Components',
  description: 'Unified catalog of all public UI component packages',

  themeConfig: {
    sidebar: generateSidebar(),

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
    ],
  },

  rewrites: generateRewrites(),

  srcExclude: [
    'docs/**',
    'README.md',
    '**/README.md',
    '**/CHANGELOG.md',
    '**/LICENSE.md',
    '**/node_modules/**',
    '**/sandbox/**',
    '**/__template__/**',
  ],
})
