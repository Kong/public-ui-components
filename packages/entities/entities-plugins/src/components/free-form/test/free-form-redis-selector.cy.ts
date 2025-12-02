import Form from '../shared/Form.vue'
import type { FormSchema } from '../../../types/plugins/form-schema'
import { REDIS_PARTIAL_INFO } from '../shared/const'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { ref } from 'vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import RedisSelector from '../shared/RedisSelector.vue'
import { FIELD_RENDERERS } from '../shared/composables'

// Helper function to create simple Redis schema for testing
const createRedisSchema = (): FormSchema => ({
  type: 'record',
  supported_partials: { 'redis-ce': ['config.redis'] },
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            redis: {
              type: 'record',
              required: true,
              fields: [
                {
                  host: {
                    type: 'string',
                  },
                },
                {
                  port: {
                    type: 'number',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
})

// Helper function to create Konnect config for testing
const createKonnectConfig = () => ({
  app: 'konnect' as const,
  apiBaseUrl: '/v2/control-planes/123',
  controlPlaneId: '123',
})

// Helper function to create Redis partial info
const createRedisPartialInfo = (isEditing = false) => ({
  isEditing,
  redisType: ref('redis-ce' as const),
  redisPath: ref('config.redis'),
})

describe('RedisSelector', () => {
  describe('创建态 (Create Mode)', () => {
    describe('1. 基础渲染测试', () => {
      it('1.1 渲染 Redis 配置卡片', () => {
        const schema = createRedisSchema()
        const redisPartialInfo = createRedisPartialInfo(false)

        cy.mount(Form, {
          props: {
            schema,
            onChange: console.log,
          },
          slots: {
            [FIELD_RENDERERS]: `
              <FieldRenderer :match="({ path }) => path === 'config.redis'">
                <RedisSelector />
              </FieldRenderer>
            `,
          },
          global: {
            provide: {
              [REDIS_PARTIAL_INFO as symbol]: redisPartialInfo,
              [FORMS_CONFIG]: createKonnectConfig(),
            },
            components: {
              FieldRenderer,
              RedisSelector,
            },
          },
        })

        // 验证 redis-config-card 存在
        cy.getTestId('redis-config-card').should('exist')

        // 验证显示两个 radio 选项
        cy.getTestId('shared-redis-config-radio')
          .should('exist')
          .should('contain', 'Shared Redis Configuration')

        cy.getTestId('dedicated-redis-config-radio')
          .should('exist')
          .should('contain', 'Dedicated Redis Configuration')

        // 验证默认选中 Shared 模式（非编辑状态）
        cy.getTestId('shared-redis-config-radio')
          .find('input[type="radio"]')
          .should('be.checked')

        cy.getTestId('dedicated-redis-config-radio')
          .find('input[type="radio"]')
          .should('not.be.checked')
      })
    })
  })
})
