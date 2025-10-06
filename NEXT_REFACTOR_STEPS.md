# Next Refactor Steps - Datakit Branch Logic

## Completed ✅

1. **Branch logic separation** - Removed all branch code from `useNodeForm.ts`
2. **Membership index caching** - O(N×M) → O(1) lookup using computed ref
3. **Branch field initialization** - Decoupled from generic factory, moved to `useBranchNodeForm`
4. **Race condition protection** - Removed unnecessary mutex (modal UI prevents race)

---

## Priority 1: Performance Optimizations 🚀

### 1.1 Cache `branchOptions` More Intelligently

**Current Issue:**
```typescript
const branchOptions = computed(() => {
  return state.value.nodes
    .filter(node => node.id !== nodeId)
    .filter(node => !isImplicitType(node.type))
    .filter(node => node.phase === owner.phase)
    .filter(node => !branchGroups.wouldCreateCycle(owner.id, node.id))  // ⚠️ EXPENSIVE!
    .map(node => ({ value: node.id, label: node.name }))
})
```

**Problems:**
- ❌ Recomputes on **ANY** state change (nodes, groups, edges)
- ❌ Calls `wouldCreateCycle()` for **every** candidate node (O(N) × DFS)
- ❌ In a 50-node graph: 50 DFS traversals every render
- ❌ Unnecessary when only names or positions change

**Solution A: Memoize Cycle Checks** (Recommended)
```typescript
// Cache cycle detection results per owner
const cycleCache = computed(() => {
  const cache = new Map<string, boolean>()  // key: "owner:member"
  // Pre-compute for current owner
  return cache
})
```

**Solution B: Dependency Tracking**
Only recompute when nodes, groups, or owner change - not on every state mutation.

**Estimated Impact**: 10-50x faster for large graphs

---

### 1.2 Optimize `wouldCreateCycle()` with Memoization

**Current Issue:**
```typescript
function wouldCreateCycle(ownerId: NodeId, memberId: NodeId): boolean {
  // DFS every call, no caching
  const visited = new Set<NodeId>()
  const stack: NodeId[] = [memberId]
  // ... traverse entire subgraph ...
}
```

**Problems:**
- ❌ Recomputes from scratch every call
- ❌ Same paths checked repeatedly
- ❌ O(V + E) per call, called O(N) times = O(N × (V + E))

**Solution: Build Reachability Matrix**
```typescript
// Compute once per state change
const reachabilityMatrix = computed(() => {
  const matrix = new Map<NodeId, Set<NodeId>>()
  // Build transitive closure
  for (const node of state.value.nodes) {
    matrix.set(node.id, computeReachableNodes(node.id))
  }
  return matrix
})

function wouldCreateCycle(ownerId: NodeId, memberId: NodeId): boolean {
  return reachabilityMatrix.value.get(memberId)?.has(ownerId) ?? false
}
```

**Estimated Impact**: 100x faster cycle detection

---

## Priority 2: Code Quality Improvements 🧹

### 2.1 Extract Large Functions

**Issue**: `updateBranchMembers()` is 90+ lines, does too much

**Refactor**:
```typescript
// Before: One giant function
async function updateBranchMembers(...) {
  // 90 lines of validation, cycle checking, conflict resolution, user confirmation
}

// After: Smaller, testable functions
function validateNewMembers(...) { ... }
function detectConflicts(...) { ... }
async function confirmConflicts(...) { ... }
function applyMembershipChanges(...) { ... }

async function updateBranchMembers(...) {
  const sanitized = validateNewMembers(...)
  const conflicts = detectConflicts(...)
  if (conflicts.length && !await confirmConflicts(conflicts)) return false
  return applyMembershipChanges(...)
}
```

**Benefits:**
- ✅ Easier to test individual steps
- ✅ Easier to understand
- ✅ Easier to modify

---

### 2.2 Add JSDoc for Complex Logic

**Missing documentation:**
- Why use `setsEqual()` instead of array equality?
- What's the purpose of `{ commit: false }` in setMembers?
- Why check `setsEqual(currentMembers, sanitizedMembers)` before proceeding?

**Add explanations:**
```typescript
/**
 * Checks if membership actually changed using order-insensitive comparison.
 * Uses setsEqual because [A, B] and [B, A] represent the same membership
 * but !== would treat them as different.
 */
if (setsEqual(currentMembers, sanitizedMembers)) {
  return true  // No change needed
}
```

---

### 2.3 Extract Magic Numbers

**Current**:
```typescript
:z-index="9999"
```

**Better**:
```typescript
const MODAL_Z_INDEX = 9999  // Above all editor elements
```

---

## Priority 3: Testing & Type Safety 🛡️

### 3.1 Add Unit Tests

**Critical test cases:**
```typescript
describe('branch-group-manager', () => {
  describe('wouldCreateCycle', () => {
    it('detects simple cycle: A → B → A')
    it('detects multi-hop cycle: A → B → C → A')
    it('allows valid chain: A → B → C')
    it('handles self-reference: A → A')
  })

  describe('setMembers', () => {
    it('normalizes duplicate IDs')
    it('filters invalid nodes')
    it('removes empty config objects')
    it('updates group state atomically')
  })
})
```

---

### 3.2 Strengthen Type Safety

**Issue**: Lots of `as any` casts

**Current**:
```typescript
const data = { ...base.formData.value } as any
```

**Better**:
```typescript
type BranchFormData = BaseFormData & {
  then?: NodeId[]
  else?: NodeId[]
}

const data = { ...base.formData.value } as BranchFormData
```

---

## Priority 4: User Experience 💎

### 4.1 Better Error Messages

**Current**:
```typescript
toaster({
  message: t('plugins.free-form.datakit.flow_editor.error.branch_cycle'),
  appearance: 'danger',
})
```

**Better**:
```typescript
toaster({
  message: t('plugins.free-form.datakit.flow_editor.error.branch_cycle', {
    owner: owner.name,
    member: member.name,
    path: cyclePath.join(' → ')  // "A → B → C → A"
  }),
  appearance: 'danger',
})
```

---

### 4.2 Loading States

**Issue**: Long cycle checks block UI with no feedback

**Add**:
```typescript
const isValidating = ref(false)

async function updateBranchMembers(...) {
  isValidating.value = true
  try {
    // ... validation ...
  } finally {
    isValidating.value = false
  }
}

// In template
<KMultiselect :loading="isValidating" />
```

---

## Recommended Execution Order

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Memoize `branchOptions` cycle checks
2. ✅ Add JSDoc to complex functions
3. ✅ Extract magic numbers

### Phase 2: Performance (2-3 hours)
4. ✅ Build reachability matrix for cycle detection
5. ✅ Optimize branchOptions dependency tracking

### Phase 3: Refactoring (3-4 hours)
6. ✅ Extract `updateBranchMembers` into smaller functions
7. ✅ Strengthen type safety (remove `as any`)

### Phase 4: Polish (2-3 hours)
8. ✅ Add unit tests for critical paths
9. ✅ Improve error messages with context
10. ✅ Add loading states

---

## Metrics to Track

- ⏱️ **branchOptions computation time** (target: <5ms for 100 nodes)
- ⏱️ **Cycle detection time** (target: <1ms per check)
- 📦 **Code complexity** (target: max 10 cyclomatic complexity per function)
- 🧪 **Test coverage** (target: >80% for branch-group-manager)

---

## Questions to Consider

1. Should we limit graph size? (e.g., max 1000 nodes)
2. Should cycle detection be async for huge graphs?
3. Should we debounce branchOptions recomputation?
4. Should we add a "repair" function to fix inconsistent state?

---

## Next Step

**Which priority do you want to tackle first?**

- **Priority 1** (Performance) - Biggest impact for large graphs
- **Priority 2** (Code Quality) - Easier to understand/maintain
- **Priority 3** (Testing) - Prevent regressions
- **Priority 4** (UX) - Better user experience

I recommend starting with **Priority 1.1** (memoize branchOptions) as it's:
- High impact (10-50x faster)
- Low risk (no breaking changes)
- Quick to implement (~30 min)
- Immediately testable
