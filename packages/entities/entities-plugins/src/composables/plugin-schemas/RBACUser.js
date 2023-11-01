export default {
  name: {
    type: 'input',
    inputType: 'text',
    label: 'Name',
    required: true,
  },
  user_token: {
    type: 'input',
    inputType: 'text',
    label: 'User Token',
    required: true,
  },
  comment: {
    type: 'input',
    inputType: 'text',
    label: 'Comment',
    styleClasses: 'optional',
  },
  enabled: {
    type: 'checkbox',
    default: true,
    label: 'Enabled',
    styleClasses: 'optional',
    help: 'An RBAC User that is enabled can make API requests',
  },
}
