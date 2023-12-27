export default {
  fields: [
    {
      type: 'array',
      showRemoveButton: false,
      newElementButtonLabelClasses: 'kong-form-new-element-button-label',
      itemContainerComponent: 'FieldArrayCardContainer',
      fieldClasses: 'array-card-container-wrapper',

      newElementButtonLabel: '+ Add Client JWK',
      items: {
        type: 'object',
        schema: {
          fields: [
            {
              model: 'kid',
              label: 'kid',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'issuer',
              label: 'issuer',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'kty',
              label: 'kty',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'use',
              label: 'use',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'key_ops',
              label: 'key_ops',
              type: 'array',
              fieldItemsClasses: 'jwk-array-input-wrapper',
              showRemoveButton: true,
              removeElementButtonLabel: 'Remove',
              items: {
                type: 'input',
                inputType: 'string',
              },
            },
            {
              model: 'alg',
              label: 'alg',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'x5u',
              label: 'x5u',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'x5c',
              label: 'x5c',
              type: 'array',
              fieldItemsClasses: 'jwk-array-input-wrapper',
              showRemoveButton: true,
              removeElementButtonLabel: 'Remove',
              items: {
                type: 'input',
                inputType: 'string',
              },
            },
            {
              model: 'x5t',
              label: 'x5t',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'x5t#S256',
              label: 'x5t#S256',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'k',
              label: 'k',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'x',
              label: 'x',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'y',
              label: 'y',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'crv',
              label: 'crv',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'n',
              label: 'n',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'e',
              label: 'e',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'd',
              label: 'd',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'p',
              label: 'p',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'q',
              label: 'q',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'dp',
              label: 'dp',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'dq',
              label: 'dq',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'qi',
              label: 'qi',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'oth',
              label: 'oth',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 'r',
              label: 'r',
              type: 'input',
              inputType: 'string',
            },
            {
              model: 't',
              label: 't',
              type: 'input',
              inputType: 'string',
            },
          ],
        },
      },

      model: 'config-client_jwk',
      label: 'Client JWK',
      order: 0,
      disabled: false,
      link: 'https://docs.konghq.com/hub/kong-inc/openid-connect/#jwk-record',
    },
    {
      type: 'array',
      showRemoveButton: false,
      newElementButtonLabelClasses: 'kong-form-new-element-button-label',
      itemContainerComponent: 'FieldArrayCardContainer',
      fieldClasses: 'array-card-container-wrapper',

      newElementButtonLabel: '+ Add Cluster Node',
      items: {
        type: 'object',
        schema: {
          fields: [{
            label: 'IP',
            model: 'ip',
            type: 'input',
            inputType: 'text',
          }, {
            label: 'Port',
            model: 'port',
            type: 'input',
            inputType: 'number',
          }],
        },
      },

      model: 'config-session_redis_cluster_nodes',
      label: 'Session Redis Cluster Nodes',
      order: 0,
      disabled: false,
      link: 'https://docs.konghq.com/hub/kong-inc/openid-connect/#host-record',
    },
  ],
}
