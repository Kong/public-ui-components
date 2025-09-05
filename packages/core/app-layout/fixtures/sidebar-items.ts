import type { GroupConfigMap } from '../src/types'

export const topItems = [
  {
    name: 'Overview',
    key: 'overview',
    to: { name: 'overview' },
  },
  {
    name: 'Gateway Manager',
    key: 'runtime-manager',
    to: { name: 'runtime-manager' },
    label: 'runtime-group-name',
    items: [
      {
        name: 'Runtime Instances',
        to: { name: 'runtime-instances' },
      },
    ],
  },
]

export const bottomItems = [
  {
    name: 'Organization',
    key: 'organization',
    to: { name: 'organization' },
    items: [
      {
        name: 'Teams',
        to: { name: 'teams' },
      },
      {
        name: 'Users',
        to: { name: 'users' },
      },
    ],
  },
  {
    name: 'Settings',
    key: 'settings',
    to: { name: 'settings' },
    items: [
      {
        name: 'Billing and Usage',
        to: { name: 'billing-settings' },
      },
      {
        name: 'Auth Settings',
        to: { name: 'auth-settings' },
      },
    ],
  },
]
export const groupCounts = {
  connectivity: 1,
  applications: 2,
}
export const groupedItems = [
  {
    name: 'Overview',
    key: 'overview',
    to: { name: 'overview' },
  },
  {
    name: 'Gateway Manager',
    key: 'runtime-manager',
    group: 'connectivity',
    to: { name: 'runtime-manager' },
    label: 'runtime-group-name',
    items: [
      {
        name: 'Runtime Instances',
        to: { name: 'runtime-instances' },
      },
    ],
  },
  {
    name: 'Service Hub',
    key: 'servicehub',
    group: 'applications',
    to: { name: 'servicehub' },
    label: 'Deloreans',
    items: [
      {
        name: 'Overview',
        to: '/sidebar/?service-overview',
      },
      {
        name: 'Versions',
        to: '/sidebar/?service-versions',
      },
    ],
  },
  {
    name: 'Dev Portal',
    key: 'dev-portal',
    to: '/sidebar/?dev-portal',
    group: 'applications',
    items: [
      {
        name: 'Published Services',
        to: '/sidebar/?published-services',
      },
      {
        name: 'Appearance',
        to: '/sidebar/?appearance',
      },
    ],
  },
]

export const groupConfig: GroupConfigMap = {
  connectivity: {
    label: 'Connectivity',
    collapsible: true,
    collapsed: false,
  },
  applications: {
    label: 'Applications',
    collapsible: true,
    collapsed: true,
  },
}
