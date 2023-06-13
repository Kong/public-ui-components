# @kong-ui-public/i18n

- [Purpose](#purpose)
- [TypeScript Support](#typescript-support)
  - [Global Registration](#global-registration)
  - [Vue Plugin](#vue-plugin)
- [Use in application](#use-in-application)
  - [Override config while create instance](#override-config-while-create-instance)
- [Use in shared component](#use-in-shared-component)
- [Formatting messages](#formatting-messages)
  - [Where is my helpText?](#where-is-my-helptext)
  - [HTML safe formatting with `<i18n-t>`](#html-safe-formatting-with-i18n-t)
- [Formatting numbers, dates and times](#formatting-numbers-dates-and-times)
- [Additional service functions.](#additional-service-functions)
  - [te](#te)
  - [tm](#tm)

## Purpose

This is a wrapper around [FormatJS](https://formatjs.io/docs/intl) that allows consuming application and components to have access to i18n functionality such as:

- format messages
- format numbers
- format dates

## TypeScript Support

In order to provide full autocompletion for the translation keys, you need to pass the type of the `messages` object to the various init functions, as shown here:

> **Note**: For the `i18n-t` component (`Translation.ts`), the type checking and auto-completion for the `keypath` prop are still a work-in-progress due to [the issue described here](https://github.com/Kong/public-ui-components/pull/231).
>

### Global Registration

```ts
// main.ts
import { createI18n, Translation } from '@kong-ui-public/i18n'
import english from './locales/en.json'

const i18n = createI18n<typeof english>('en-us', english, {isGlobal: true})
app.use(Translation.install<typeof english>, { i18n })

// composables/index.ts
import { useI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'

export default {
  // Be sure to provide the interface when exporting
  useI18n: useI18n<typeof english>,
}

// Component.vue
import composables from './composables'
const i18n = composables.useI18n()
```

### Vue Plugin

```ts
import { Translation, createI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'

const i18n = createI18n<typeof english>('en-us', english, {isGlobal: true})
const app = createApp(App)
app.use(Translation.install<typeof english>, { i18n })

app.mount('#app')
```

## Use in application

When used in application we only need to instantiate `Intl` object once, during application hydration, and then we can use it anywhere in the app via `useI18n` composable.

in `main.ts` (application hydration code):

```ts
import { createI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'

...

// this will create Application instance of Intl object
createI18n<typeof english>('en-us', english, {isGlobal: true})
```


And then, anywhere in application code where `i18n` is needed:

```html
<template>
  {{ i18n.t('global.ok') }}
</template>

<script setup lang="ts">
import { useI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'
const i18n = useI18n<typeof english>()
</script>
```

### Override config while create instance

For some applications there is a need to create Intl instance with config settings overridden. One example of this is when application needs to define error/warning handlers.

Example:

in `main.ts` (application hydration code):

```ts
import { createI18n } from '@kong-ui-public/i18n'
import type { IntlConfigCore } from '@kong-ui-public/i18n'

import english from './locales/en.json'

...

// this will create Application instance of Intl object
createI18n<typeof english>(
    en-us',
    english,
    {
      onError: (err) {
        console.error(`this is my own i18n errorhandler ${err}`)
      },
      isGlobal: true
    })
```

and then use i18n as described above.

Third parameter to `createI18n` could be simple boolean (for backwards compatibility), or [IntlConfig object without locale and messages](https://formatjs.io/docs/intl/#intlshape)

## Use in shared component

When used in [shared component](https://github.com/Kong/shared-ui-components/pull/118/files#diff-f296a0775f650cac9ecd4b5d7ccef015ca73587be833b40eeae1e396426b0f4fR45) (outside of application code),  we need `Intl` that is local to that component, so that it is using component's own localization strings:

```html
<template>
  {{ i18n.t('component.message') }}
</template>


// assuming component is receiving locale code as a property
<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

// this will instantiate `Intl` local to this component, using component's english messages.
// TODO: load and pass messages based on language passed from consuming application
const i18n = createI18n<typeof english>(props.locale || 'en-us', english)
</script>
```

## Formatting messages

`en.json:`

```json
{
  "global": {
    "ok": "Okay"
  },
  "test": {
    "withParams": "Good {dayPart}, My name is {name}!",
    "withPluralization": "{count} {count, plural, =0 {versions} =1 {version} other {versions}} available"
  }
}
```

`code:`

```html
<template>
  Simple formatting:
    {{ i18n.t('global.ok') }}
  With parameters:
    {{ i18n.t('test.withParams', { dayPart: 'Morning', name: 'i18n' }) }}
  With pluralization:
    {{ i18n.t('test.withPluralization', { count: 0 }) }}
    {{ i18n.t('test.withPluralization', { count: 1 }) }}
    {{ i18n.t('test.withPluralization', { count: 11 }) }}
</template>


<script setup lang="ts">
import { useI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'
const i18n = useI18n<typeof english>()
</script>
```

`result:`

```txt
Simple formatting:
  Okay

With parameters:
  Good Morning, My name is i18n!

With pluralization:
  0 versions available
  1 version available
  11 version available
```

### Where is my helpText?

In `khcp-ui` there are many places where instead of using Intl function we are accessing translations string directly (from the store). Even it is not recommended way of doing thing, but because there are too many places to change, we I18n implementation is supporting this for backwards compatibility.

`en.json:`

```json
{
    "components": {
        "docUploadCard": {
            "actions": {
                "edit": "Upload New",
                "delete": "Delete"
            }
        }
    }
}
```

`code:`

```html
<template>
  {{ helpText.actions.edit }}
</template>


<script setup lang="ts">
import { useI18n } from '@kong-ui-public/i18n'
import english from './locales/en.json'

const i18n = useI18n<typeof english>()
const helpText = i18n.source.components.docUploadCard
</script>
```

_Please, do not use this method in any new code. This prevents using parameters/pluralization and other formatting features. use exposed methods instead._

### HTML safe formatting with `<i18n-t>`

#### When registered as Vue Plugin

Sometimes it is needed to render translated message with HTML as part of the parameters. For this Provided component can be used.

`en.json:`

```json
{
  "global": {
    "default": "See the news at {0}. There is a lot there.",
    "named": "{greeting}, my name is {name}. And I am {occupation}. I want {amount}"
  }
}
```

`main.ts` (registing component)

```ts
import { createI18n, Translation } from '@kong-ui-public/i18n'
import english from './locales/en.json'

...

//this will create Application instance of Intl object
const i18n = createI18n<typeof english>('en-us', english, true)
// this will register <i18n-t> component
app.use(Translation.install<typeof english>, { i18n })
```

And then, anywhere in application code where `i18n` is needed

#### Formatting default slot

`code:`

```html
<template>
  <i18n-t keypath="global.default">
      <a href="https://google.com">Google</a>
  </i18n-t>
</template>
```

`result:`

```html
<span>See the news at <a href="https://google.com">Google</a>. There is a lot there.</span>
```

#### Formatting named slots. Using tag to render into template

`code:`

```html
<template>
    <i18n-t
      tag="h1"
      keypath="global.named"
    >
      <template #greeting>
        <b>Morning</b>
      </template>

      <template #name>
        <i>Val</i>
      </template>

      <template #occupation>
        <i>Money Asker</i>
      </template>

      <template #amount>
        <div class="red">{{ i18n.formatNumber(1000, { style: 'currency', currency: 'USD' }) }}</div>
      </template>
    </i18n-t>
</template>
```

`result:`

```html
<h1><b>Morning</b>, my name is <i>Val</i>. And I am <i>Money Asker</i>. I want <div class="red">$1,000.00</div></h1>
```

#### With direct use of i18nT component

In some cases we do not have access to the Vue `app` and cannot relay on registered i18nT plugin. Working on standalone components in `public-ui-components` is of those cases. And for this your component will look like:

```html
<template>
  <i18n-t
    tag="h1"
    keypath="global.default">
      <a href="https://google.com">Google</a>
  </i18n-t>
</template>

<script setup lang="ts">
  import { createI18n, i18nTComponent } from '@kong-ui-public/i18n'
  import english from './locales/en.json'

  const i18n = createI18n<typeof english>('en-us', english)
  const i18nT = i18nTComponent<typeof english>(i18n)

</script>
```

Or in old `defineComponent` way

```html

<template>
  <i18n-t
    :i18n="i18n"
    tag="h1"
    keypath="global.default">
      <a href="https://google.com">Google</a>
  </i18n-t>
</template>


<script lang="ts">
  import { defineComponent } from 'vue'
  import { createI18n, i18nTComponent } from '../src'
  import english from './locales/en.json'

  export default defineComponent({
    components: { i18nT: i18nTComponent<typeof english>() },
    setup() {
      return {
        i18n: createI18n<typeof english>('en-us', english)
      }
    }
  })
</script>
```

## Formatting numbers, dates and times

This comes for free from FormatJS, and documentation on those methods can be found there: [FormatJS](https://formatjs.io/docs/intl)

Unit tests for I18n wrapper in kong-ui/core also has view examples as a references for those.
[FormatDate](https://github.com/Kong/shared-ui-components/blob/4a1f99d5cee2d4409f4370a9bce2377450a6429d/packages/core/src/useI18n/i18n.spec.ts#L81)
[FormatNumber](https://github.com/Kong/shared-ui-components/blob/4a1f99d5cee2d4409f4370a9bce2377450a6429d/packages/core/src/useI18n/i18n.spec.ts#L68)

Every single method listed in [FormatJS](https://formatjs.io/docs/intl) is exposed and available in i18n wrapper.

## Additional service functions.

(as previously exposed by vue18n-n)

### te

check if translation message exists

`en.json`

```json
"global": {
  "ok": "Okay"
}
```

`code:`

```ts
const { te } = useI18n()
console.log({p: te('global.ok'), n: te('global.not.ok')})
console.log()
```

`result:`

```json
{"p": true, "n": false}
```

### tm

returns array values defined for given key

`en.json`

```json
 "global": {
    "disabled": [
      "You cannot update configurations for services",
      "You cannot accept new developer portal applications",
    ]
  }
```

`code:`

```ts
const { tm } = useI18n()
console.log(te('global.disabled'))
```

`result:`

```json
[
  "You cannot update configurations for services",
  "You cannot accept new developer portal applications",
]
```
