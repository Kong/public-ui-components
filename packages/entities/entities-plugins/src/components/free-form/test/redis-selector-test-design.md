# RedisSelector 组件测试设计文档（简化版）

## 概述

为 `RedisSelector.vue` 组件编写 Cypress 组件测试，专注于核心功能：Shared/Dedicated 模式切换、表单数据同步、以及 renderRules 依赖处理。

## 测试环境设定

- **测试环境**: Konnect（Kong Manager 环境逻辑相同，不单独测试）
- **默认注入**: `REDIS_PARTIAL_INFO`（始终启用 Redis Partial 支持）
- **简化 Schema**:
  - 支持 `partials` 字段（数组类型）
  - 只包含一个 `config.redis` 对象字段
  - `redis` 对象只有两个字段：`host` (string) 和 `port` (number)

## 简化 Schema 结构

```typescript
const redisSchema = {
  type: 'record',
  supported_partials: {redis-ce: ["config.redis"]}
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            redis: {
              type: 'record',
              fields: [
                { host: { type: 'string' } },
                { port: { type: 'number' } },
              ],
            },
          },
        ],
      },
    },
  ],
}
```

## 编辑态 vs 创建态的关键差异

### 数据清除时的值差异
| 场景 | 创建态 (`isEditing: false`) | 编辑态 (`isEditing: true`) |
|------|---------------------------|--------------------------|
| 切换到 Shared，清除 partials | `undefined` | `null` |
| 字段隐藏，清除 partials | `undefined` | `null` |

### 默认选择模式
| 状态 | 默认模式 |
|------|---------|
| 创建态 | Shared (usePartial = true) |
| 编辑态，有 partials 数据 | Shared (usePartial = true) |
| 编辑态，有 redis 数据 | Dedicated (usePartial = false) |

### 代码逻辑
```typescript
// 组件中的关键代码
const isFormEditing = redisPartialInfo?.isEditing || false
const usePartial = ref(!isFormEditing) // 创建态默认 true，编辑态默认 false

// 清除 partial 值
partialValue!.value = isFormEditing ? null : undefined

// 字段隐藏时清除
if (newHide && partialValue.value) {
  partialValue.value = isFormEditing ? null : undefined
}
```

## 测试文件结构

```typescript
// free-form-redis-selector.cy.ts

describe('RedisSelector', () => {
  describe('创建态 (Create Mode)', () => {
    // 1. 基础渲染
    // 2. Shared 模式功能
    // 3. Dedicated 模式功能
    // 4. 模式切换与状态保持
    // 5. RenderRules 依赖处理
  })

  describe('编辑态 (Edit Mode)', () => {
    // 6. 编辑态特定行为测试
  })
})
```

## 测试用例设计

### 1. 基础渲染测试

#### 1.1 渲染 Redis 配置卡片
**测试目标**: 验证组件正确渲染 Redis 配置选择界面

**步骤**:
- 挂载 Form 组件，包含 RedisSelector
- 提供 `REDIS_PARTIAL_INFO` injection
- 验证 `redis-config-card` 存在
- 验证显示两个 radio 选项：
  - `shared-redis-config-radio` (Shared Redis Configuration)
  - `dedicated-redis-config-radio` (Dedicated Redis Configuration)
- 验证默认选中 Shared 模式（非编辑状态）

### 2. Shared 模式功能测试

#### 2.1 选择配置写入 partials 字段
**测试目标**: 选择 Redis 配置后，`partials` 字段被更新，`redis` 字段被清空

**步骤**:
- Mock 获取配置列表 API
- Mock 获取单个配置详情 API（返回 `{ id: 'redis-1', host: '127.0.0.1', port: 6379 }`）
- 挂载组件，spy `onChange` 回调
- 在 Shared 模式下选择配置 'redis-1'
- **验证**:
  - `onChange` 被调用，参数为 `{ partials: [{ id: 'redis-1' }], config: { redis: undefined } }`
  - 或者 `config.redis` 字段不存在于表单数据中
- 验证 `RedisConfigCard` 显示配置详情

#### 2.2 清除配置选择
**测试目标**: 清除选择后，`partials` 被清空

**步骤**:
- 继续上一个测试的状态（已选择配置）
- 清除 selector 选择
- **验证**: `onChange` 被调用，`partials` 为 `undefined` 或空数组

### 3. Dedicated 模式功能测试

#### 3.1 填写字段更新到 redis
**测试目标**: 在 Dedicated 模式下填写字段，`config.redis` 被更新，`partials` 被清空

**步骤**:
- 挂载组件，spy `onChange`
- 点击 "Dedicated Redis Configuration" radio 切换到 Dedicated 模式
- 填写 `host` 字段为 "localhost"
- **验证**: `onChange` 被调用，参数包含 `{ config: { redis: { host: 'localhost' } }, partials: undefined }`
- 填写 `port` 字段为 6379
- **验证**: `onChange` 被调用，参数包含 `{ config: { redis: { host: 'localhost', port: 6379 } }, partials: undefined }`

### 4. 模式切换与状态保持测试

#### 4.1 从 Shared 切换到 Dedicated 再切换回来
**测试目标**: 切换模式时，各自的内部状态被保留，表单值与组件状态同步

**步骤**:
- Mock API
- 挂载组件（Shared 模式），spy `onChange`
- 选择配置 'redis-1'
- **验证 Form 数据**: `{ partials: [{ id: 'redis-1' }], config: { redis: undefined } }`
- 切换到 Dedicated 模式
- **验证 Form 数据**: `{ partials: undefined, config: { redis: undefined } }` 或 redis 字段为空
- 切换回 Shared 模式
- **验证 Form 数据**: `{ partials: [{ id: 'redis-1' }], config: { redis: undefined } }`
- 验证 selector 仍然显示 'redis-1' 被选中

#### 4.2 从 Dedicated 切换到 Shared 再切换回来
**测试目标**: 切换模式时保持 Dedicated 字段状态

**步骤**:
- 挂载组件（Dedicated 模式），spy `onChange`
- 填写 `host: "localhost"`, `port: 6379`
- **验证 Form 数据**: `{ config: { redis: { host: 'localhost', port: 6379 } }, partials: undefined }`
- 切换到 Shared 模式
- **验证 Form 数据**: `{ partials: undefined, config: { redis: undefined } }` 或 redis 被清空
- 切换回 Dedicated 模式
- **验证 Form 数据**: `{ config: { redis: { host: 'localhost', port: 6379 } }, partials: undefined }`
- 验证字段值仍然是 "localhost" 和 6379

### 5. RenderRules 依赖处理测试

#### 5.1 依赖条件不满足时清除值（Shared 模式）
**测试目标**: 当 renderRules 依赖条件导致 redis 字段隐藏时，Shared 模式下 `partials` 被清除

**步骤**:
- 创建带有依赖的 schema:
  ```typescript
  const schemaWithDependency: FormSchema = {
    type: 'record',
    fields: [
      { enable_redis: { type: 'boolean' } },
      { partials: { ... } },
      { config: { ... } },
    ],
  }
  const renderRules: RenderRules = {
    dependencies: {
      'config.redis': ['enable_redis', 'show'], // redis 字段依赖 enable_redis
    },
  }
  ```
- Mock API
- 挂载组件，spy `onChange`
- 设置 `enable_redis: true`，redis 字段可见
- 在 Shared 模式选择配置 'redis-1'
- **验证**: `partials: [{ id: 'redis-1' }]`
- 设置 `enable_redis: false`，触发 redis 字段隐藏
- **验证**: `onChange` 被调用，`partials` 变为 `undefined` 或 `null`

#### 5.2 依赖条件恢复时恢复值（Shared 模式）
**测试目标**: 字段重新显示时，恢复之前的 `partials` 值

**步骤**:
- 继续上一个测试
- 设置 `enable_redis: true`，字段重新显示
- **验证**: `onChange` 被调用，`partials` 恢复为 `[{ id: 'redis-1' }]`
- 验证 selector 显示 'redis-1' 被选中

#### 5.3 依赖条件不满足时清除值（Dedicated 模式）
**测试目标**: Dedicated 模式下，字段隐藏时 `config.redis` 值的处理

**步骤**:
- 使用带依赖的 schema
- 挂载组件（Dedicated 模式），spy `onChange`
- 设置 `enable_redis: true`
- 填写 `host: "localhost"`, `port: 6379`
- **验证**: `config: { redis: { host: 'localhost', port: 6379 } }`
- 设置 `enable_redis: false`
- **验证**: redis 字段被隐藏（这个可能由 ObjectField 自动处理，取决于实现）

#### 5.4 依赖条件恢复时保持状态（Dedicated 模式）
**测试目标**: Dedicated 模式下，字段重新显示时不自动恢复值（因为是直接编辑）

**步骤**:
- 继续上一个测试
- 设置 `enable_redis: true`，字段重新显示
- **验证**: `config.redis` 字段根据组件实现，可能是空或保持之前的值
  - 如果组件缓存了状态，验证值被恢复
  - 如果没有，验证字段为空

### 6. 编辑态特定行为测试

#### 6.1 编辑态默认选择 Dedicated 模式
**测试目标**: 编辑状态下，默认选中 Dedicated 模式

**步骤**:
- 挂载组件，设置 `isEditing: true`
- 提供初始数据：`{ config: { redis: { host: 'localhost', port: 6379 } } }`
- **验证**: "Dedicated Redis Configuration" radio 被选中
- 验证字段显示初始值

#### 6.2 编辑态加载 Partial 数据
**测试目标**: 编辑状态下，如果有 partials 数据，应加载并显示

**步骤**:
- Mock 获取配置详情 API
- 挂载组件，设置 `isEditing: true`
- 提供初始数据：`{ partials: [{ id: 'redis-1' }] }`
- **验证**: "Shared Redis Configuration" radio 被选中
- 验证自动触发 API 调用获取配置详情
- 验证 `RedisConfigCard` 显示配置详情

#### 6.3 编辑态切换到 Shared 清除使用 null
**测试目标**: 编辑态下，从 Dedicated 切换到 Shared 时，partials 清除为 `null`

**步骤**:
- 挂载组件，设置 `isEditing: true`，spy `onChange`
- 初始为 Dedicated 模式
- 切换到 Shared 模式（未选择任何配置）
- **验证**: `onChange` 被调用，`partials` 为 `null`（而非 `undefined`）
- 验证 `config.redis` 被清空

#### 6.4 编辑态字段隐藏清除使用 null
**测试目标**: 编辑态下，字段隐藏时使用 `null` 清除 partials

**步骤**:
- 使用带依赖的 schema
- 挂载组件，设置 `isEditing: true`，spy `onChange`
- 在 Shared 模式选择配置 'redis-1'
- **验证**: `partials: [{ id: 'redis-1' }]`
- 设置 `enable_redis: false`，触发字段隐藏
- **验证**: `onChange` 被调用，`partials` 变为 `null`（而非 `undefined`）

#### 6.5 编辑态字段恢复显示时恢复 partials
**测试目标**: 编辑态下，字段恢复显示时也应恢复 partials 值

**步骤**:
- 继续上一个测试
- 设置 `enable_redis: true`，字段重新显示
- **验证**: `onChange` 被调用，`partials` 恢复为 `[{ id: 'redis-1' }]`
- 验证 selector 显示 'redis-1' 被选中

#### 6.6 编辑态与创建态的清除值对比
**测试目标**: 直接对比编辑态和创建态在相同操作下的数据差异

**步骤**:
- **创建态测试**:
  - 挂载组件（`isEditing: false`），spy `onChange`
  - Shared 模式选择配置，然后切换到 Dedicated
  - 验证 `partials` 为 `undefined`

- **编辑态测试**:
  - 挂载组件（`isEditing: true`），spy `onChange`
  - Shared 模式选择配置，然后切换到 Dedicated
  - 验证 `partials` 为 `null`

- **验证差异**: 确认创建态使用 `undefined`，编辑态使用 `null`## Helper 函数设计

```typescript
// 创建 Konnect 表单配置
const createKonnectConfig = () => ({
  app: 'konnect',
  controlPlaneId: 'test-cp-id',
  apiBaseUrl: '/us/kong-api',
})

// 创建 REDIS_PARTIAL_INFO injection
const createRedisPartialInfo = (options = {}) => ({
  isEditing: false,
  redisType: ref('redis-ce'),
  redisPath: ref('config.redis'),
  ...options,
})

// Mock 获取单个配置详情 API
const mockGetRedisConfig = (id: string, config: object, status = 200) => {
  cy.intercept(
    'GET',
    `/us/kong-api/v2/control-planes/test-cp-id/core-entities/partials/${id}`,
    {
      statusCode: status,
      body: config,
    }
  ).as('getRedisConfig')
}

// 挂载带有 RedisSelector 的 Form
const mountFormWithRedisSelector = (options: {
  schema: FormSchema
  renderRules?: RenderRules
  data?: any
  onChange?: Function
  redisPartialInfo?: any
}) => {
  const { schema, renderRules, data, onChange, redisPartialInfo } = options

  cy.mount(Form, {
    props: {
      schema,
      renderRules,
      data,
      onChange,
    },
    global: {
      provide: {
        [REDIS_PARTIAL_INFO as symbol]: redisPartialInfo || createRedisPartialInfo(),
        [FORMS_CONFIG as symbol]: createKonnectConfig(),
      },
    },
  })
}
```

## Mock 数据设计

```typescript
// Mock Redis 配置详情（简化版）
const mockRedisConfigDetail = {
  id: 'redis-1',
  name: 'Test Redis Config',
  type: 'redis-ce',
  config: {
    host: '127.0.0.1',
    port: 6379,
  },
}

// 也可以直接返回扁平化的结构
const mockRedisConfigFlat = {
  id: 'redis-1',
  name: 'Test Redis Config',
  type: 'redis-ce',
  host: '127.0.0.1',
  port: 6379,
}
```

## 测试数据标识符 (data-testid)

根据组件代码，使用以下 test IDs：
- `redis-config-card`: 主配置卡片
- `redis-config-radio-group`: Radio 按钮组
- `shared-redis-config-radio`: Shared 配置 radio
- `dedicated-redis-config-radio`: Dedicated 配置 radio
- `redis-config-select`: Redis 配置选择器容器
- `redis-config-select-trigger`: Selector 触发器（RedisConfigurationSelector 内部）

## 关键实现注意事项

1. **使用 `v-show` 而非 `v-if`**
   - 组件在切换模式时使用 `v-show` 保持组件状态
   - 测试时使用 `.should('be.visible')` / `.should('not.be.visible')` 而不是 `.should('exist')`

2. **异步操作等待**
   - API 调用：使用 `cy.wait('@getRedisConfig')` 等待 API 完成
   - 表单更新：onChange 可能有延迟，使用 spy 的 `.should('have.been.called')`

3. **表单数据验证**
   - 通过 spy `onChange` 回调验证，不直接访问组件内部状态
   - 关注最终调用的参数，包含完整的表单数据对象

4. **状态缓存机制**
   - Shared 模式缓存在 `partialsSaved` ref 中
   - Dedicated 模式缓存在 `redisFieldsSaved` ref 中
   - 切换模式时，当前模式的值保存到缓存，另一个模式的值从缓存恢复

5. **编辑 vs 创建模式的清除值**（重点关注）
   - 创建模式（`isEditing: false`）：
     - 清除 partials 时使用 `undefined`
     - 默认选中 Shared 模式
   - 编辑模式（`isEditing: true`）：
     - 清除 partials 时使用 `null`
     - 默认选中 Dedicated 模式（除非初始数据有 partials）
   - 发生清除的场景：
     - 从 Dedicated 切换到 Shared（未选择配置时）
     - 字段被 renderRules 隐藏时（仅 Shared 模式）
   - 这个区别通过 `redisPartialInfo.isEditing` 判断
   - **测试时需要严格验证 `null` vs `undefined`**

6. **编辑态初始化逻辑**
   - 有 partials 数据：自动选择 Shared 模式，加载配置详情
   - 有 redis 字段数据：选择 Dedicated 模式，显示字段值
   - 两者都有：优先 partials（但实际不应该同时存在）

7. **RenderRules 依赖处理**
   - 使用 Form 组件的 renderRules 机制
   - 依赖条件控制字段的 `hide` 状态
   - 组件通过 watch `hide?.value` 响应隐藏/显示
   - **字段隐藏时**：仅在 Shared 模式下清除 partials 值
   - **字段显示时**：仅在 Shared 模式下恢复 partials 值

## 测试覆盖总结

### 创建态测试覆盖
1. ✅ 默认 Shared 模式
2. ✅ Shared → Dedicated → Shared 状态保持
3. ✅ Dedicated → Shared → Dedicated 状态保持
4. ✅ 切换清除时使用 `undefined`
5. ✅ 字段隐藏/恢复时清除/恢复使用 `undefined`

### 编辑态测试覆盖
1. ✅ 默认 Dedicated 模式（有 redis 数据时）
2. ✅ 加载 partials 数据时选择 Shared 模式
3. ✅ 切换清除时使用 `null`
4. ✅ 字段隐藏/恢复时清除/恢复使用 `null`
5. ✅ 与创建态的直接对比

### 共同测试覆盖
1. ✅ 基础渲染
2. ✅ Shared 模式选择配置
3. ✅ Dedicated 模式填写字段
4. ✅ RenderRules 依赖处理

## 参考测试模式

参考 `free-form-basic.cy.ts` 和 `free-form-render-rules.cy.ts`：

1. **清晰的测试结构**：使用嵌套 describe 分组相关测试
2. **Helper 函数**：提取重复的设置和验证逻辑
3. **Mock API**：使用 `cy.intercept` 模拟后端，使用别名等待
4. **Spy 验证**：使用 `cy.spy()` 验证回调调用和参数
5. **明确断言**：每个测试都有清晰的验证点和预期结果
