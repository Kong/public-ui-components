---
date: 2026-04-08
topic: code-editor-skip-defaults
---

# Code Editor Skip Defaults

## What We're Building

在 freeform 的 Code Editor 工具栏中增加一个 "Skip Defaults" 开关。开启后，YAML 视图中会移除所有值等于 schema 定义默认值的字段，让用户看到一个干净的、贴近自己实际配置的视图。这是纯显示层的过滤——提交时所有默认值会自动合并回完整数据。

**核心约束**：过滤只在两个时机触发——进入 code mode 时（若开关已开启）或用户手动切换开关时。用户编辑期间不会因为输入了默认值而被打断。

**适用范围**：shared `CodeEditor.vue` 和 Datakit `CodeEditor.vue` 均支持此功能。两者共享同样的 `useFormShared()` + `formDataToCode()` + `onDidChangeModelContent` 模式，skip-defaults 逻辑提取为 composable 供两端复用。

## Data Layer Context

`formData`（即 `innerData`）是 **内部表示**，与用户看到的配置数据之间存在序列化层：

```
外部数据 → setValue(data) → keyIdMap.serialize() → formData (KeyId-keyed maps)
formData → keyIdMap.deserialize() → getValue() → 用户可读数据
```

- **`formData`**: map 类型字段的 key 被替换为 `kid:N`（KeyId），不可直接用于 YAML 展示或比较
- **`getValue()`**: 反序列化后的用户可读数据（真实 map key），处理了 hiddenPaths
- **`setValue(data)`**: 接受用户可读数据，内部自动 `keyIdMap.serialize()`
- **`getDefault()`**（form-context）: 调用 `getDefaultFromSchema()` 后经 `serializeIfNeeded` 包装，返回 KeyId-keyed 默认值——**不适合直接用于比较**，因为会创建新的 KeyId 与 `formData` 中的不同
- **`getDefaultFromSchema()`**（schema.ts `useSchemaHelpers`）: 递归遍历 schema tree，构建原始默认值（正常 key）。对于 `getDefault()` 无参调用，内部调用 `createRecordDefault(getSchema(), '')`，只为有 `schema.default` 或 `required` 的字段创建默认值

**结论**：skip-defaults 的所有操作（YAML 展示、默认值比较、提交合并）都应在**用户可读数据层**进行，通过 `getValue()` / `setValue()` 交互，而非直接操作 `formData`。

## Why This Approach

方案选择：将 skip-defaults 的**核心逻辑提取为 composable `useSkipDefaults()`**，由各 CodeEditor 自行接入：

- shared `CodeEditor.vue` 和 Datakit `CodeEditor.vue` 结构高度相似（都用 `useFormShared()` 获取 `formData`/`setValue`，都有 `formDataToCode()` 和 `onDidChangeModelContent`），composable 可以零重复地服务两端
- 工具栏 UI 由各 CodeEditor 自行渲染（Datakit 已有顶部 KAlert + examples 区域，工具栏风格可能不同），composable 只暴露状态和方法
- StandardLayout 无需感知此功能，slot 接口不变

**提交行为**：用户在 skip-defaults 模式下编辑的 YAML 可能缺少默认值字段。为保证提交完整性，在 `onDidChangeModelContent` 解析 YAML 后，将用户内容与 `getValue()`（反序列化后的完整数据）合并再调用 `setValue()`。`setValue()` 内部处理 keyIdMap 序列化，无需外部干预。

```typescript
// skip-defaults 开启时的 setValue 包装
const currentData = getValue()       // 反序列化、完整数据（含默认值）
const merged = { ...currentData, ...parsedYaml }  // 用户编辑覆盖
setValue(merged)                      // 内部自动 serialize
```

**注意**：这意味着用户无法通过在 YAML 中删除某个字段来"清空"它——被删除的字段会保留其之前的值（通常是默认值）。这是有意的设计：skip-defaults 是显示偏好，不是数据语义。

## Key Decisions

- **UI 位置**：工具栏在各 `CodeEditor.vue` 组件顶部，只在 code mode 下可见
- **过滤范围**：所有字段（`config.*`、`enabled`、`protocols`、`tags` 等），递归比较
- **触发时机**：仅在进入 code mode 或切换开关时重新过滤；编辑期间不实时过滤
- **持久化**：v1 不持久化，`ref(false)` 默认关闭；后续可加 localStorage
- **数据层操作**：始终通过 `getValue()` / `setValue()` 交互，不直接读写 `formData`，避免 KeyId 序列化问题
- **默认值来源**：使用 `useSchemaHelpers` 的 `getDefault()`（原始 schema 默认值，非 form-context 的 KeyId-serialized 版本）进行比较
- **相等比较**：使用 lodash `isEqual` 对字段值与 schema default 做深比较
- **反馈循环保护**：程序化更新 `code` ref 时，用 `isRegeneratingCode` guard flag 跳过 `onDidChangeModelContent`，参考 StandardLayout 中 `skipUpdateScopeCache` 模式
- **复用策略**：composable `useSkipDefaults()` 封装状态 + 逻辑，shared 和 Datakit 的 CodeEditor 各自调用

## Implementation Sketch

### 新增工具函数 `stripDefaults(data, defaults)`

```typescript
// 纯数据比较：递归移除 data 中值等于 defaults 对应字段的条目
// 两侧都是用户可读数据（正常 key），不涉及 KeyId
function stripDefaults(
  data: Record<string, any>,
  defaults: Record<string, any>
): Record<string, any>
```

调用方式：
```typescript
const userData = getValue()  // 反序列化后的用户可读数据
const schemaDefaults = getDefaultFromSchema()  // 原始 schema 默认值（useSchemaHelpers 层）
const stripped = stripDefaults(omit(userData, ['__ui_data']), schemaDefaults)
```

函数放在 `shared/utils.ts` 中。

### 新增 composable `useSkipDefaults()`

```typescript
// shared/composables/skip-defaults.ts
function useSkipDefaults(options: {
  getValue: () => Record<string, any>   // form-context 的 getValue，返回反序列化数据
  setValue: (data: Record<string, any>) => void  // form-context 的 setValue，内部处理序列化
  getDefaultFromSchema: () => Record<string, any>  // useSchemaHelpers 的原始默认值
}) {
  // 返回：
  // - skipDefaults: Ref<boolean>（v1 默认 false，不持久化）
  // - isRegeneratingCode: Ref<boolean>（guard flag）
  // - toCode(): string（getValue → omit __ui_data → 可选 strip → yaml.dump）
  // - handleContentChange(config, emit): void（skipDefaults 开启时自动 merge getValue() 再 setValue）
  // - regenerateCode(code: ShallowRef<string>): void（toggle 时刷新 editor 内容）
}
```

composable 封装：
- `skipDefaults` 状态管理（v1: 普通 ref）
- `isRegeneratingCode` guard flag
- YAML 序列化逻辑（通过 `getValue()` 获取反序列化数据，可选 strip）
- `setValue` 包装逻辑（`{ ...getValue(), ...parsedYaml }` → `setValue()`）

各 CodeEditor 只需调用 composable 返回的方法，不重复实现逻辑。

### shared `CodeEditor.vue` 修改点

1. 引入 `useSkipDefaults()` composable
2. 新增工具栏 UI（KInputSwitch），绑定 `skipDefaults` ref
3. 用 composable 的 `toCode()` 替换原有 `formDataToCode()`
4. `onDidChangeModelContent` 中调用 `handleContentChange(config, emit)`
5. watch `skipDefaults` 变化时调用 `regenerateCode(code)`

### Datakit `CodeEditor.vue` 修改点

1. 引入 `useSkipDefaults()` composable
2. 在 KAlert (examples) 区域旁或上方添加工具栏 UI
3. 用 composable 的 `toCode()` 替换原有的 `formDataToCode()` 和 `dumpYaml(omit(formData, ['__ui_data']))`
4. `onDidChangeModelContent` 中调用 `handleContentChange(config, emit)`
5. watch `skipDefaults` 变化时调用 `regenerateCode(code)`
6. `setExampleCode()` 和 `handleConvertConfirm()` 中设置 `code.value` 时同样需要经过 guard flag 保护

## Resolved Questions

- **空对象处理**：required record 即使所有子字段都是默认值也保留；非 required record 设置为 null
- **数组/set 比较**：顺序敏感，使用 `isEqual` 深比较（`set` 类型如 `protocols` 语义上无序，但实现上按顺序比较——已知的权衡，需在代码中注释说明）
- **null vs 缺失**：schema default 为 `null` 且值也为 `null`，视为相等并移除
- **工具栏样式**：暂不加 tooltip
- **合并策略**：`deepMergeConfig(getValue(), parsedYaml)` **递归合并**——对象递归 merge（override key 覆盖 base），数组整体替换（用户 YAML 中的数组权威）。浅展开 `{ ...getValue(), ...parsedYaml }` 会丢失嵌套的默认值字段

## Edge Cases

- **全部字段均为默认值**（新建插件）：编辑器显示空 YAML `{}`，行为正确但可能困惑用户——后续可加提示文案
- **Undo/Redo 失步**：toggle 后程序化更新的 YAML 会进入 Monaco undo 栈，Ctrl+Z 可能还原 toggle 效果但不改变开关状态——可通过 `editor.pushUndoStop()` 缓解，作为后续优化
- **Datakit examples/paste**：`setExampleCode()` 和 `handleConvertConfirm()` 程序化设置 `code.value`，需同样受 guard flag 保护以避免触发 skip-defaults 的 merge 逻辑
- **`__ui_data` 字段**：`toCode()` 中通过 `omit` 排除，不影响 strip 逻辑
- **Feature Flag**：code mode 已由 `KM_2262_CODE_MODE` 控制，skip-defaults 隐式受其保护；如需独立灰度可后续加 `KM_2475_SKIP_DEFAULTS`
- **`getDefaultFromSchema()` 访问**：form-context 通过 `...schemaHelpers` 展开导出了 `useSchemaHelpers` 的方法，但 `getDefault` 被 form-context 自己的同名包装覆盖。composable 需要从 `useSchemaHelpers` 获取原始版本，或 form-context 额外导出 `getDefaultFromSchema`

## Files Likely to Change

| 文件 | 变更类型 |
|------|----------|
| `shared/composables/skip-defaults.ts` | **新增**：composable 封装 skip-defaults 核心逻辑 |
| `shared/CodeEditor.vue` | 修改：接入 composable、新增工具栏 UI |
| `plugins/datakit/CodeEditor.vue` | 修改：接入 composable、新增工具栏 UI |
| `shared/utils.ts` | 新增 `stripDefaults` 纯函数 |
| `shared/composables/index.ts` | 导出新 composable |
| `shared/composables/form-context.ts` | 可能需要额外导出 `getDefaultFromSchema`（原始未序列化版本） |
| i18n 文件 | 新增工具栏文案 |

## Next Steps

→ `/workflows:plan` for implementation details
