import { OverviewIcon, RuntimesIcon, PeopleIcon, CogIcon } from '@kong/icons'

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
