<template>
  <div class="sandbox-container">
    <h2>Label, Tooltip, &amp; No Value</h2>
    <ConfigCardItem
      :item="{
        key: 'name',
        label: 'Name',
        tooltip: 'I am empty',
        value: null,
      }"
    />

    <h2>ID</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.ID,
        key: 'id',
        label: 'ID',
        value: 'abc-123-cats-are-neat',
      }"
    />

    <h2>ID Array</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.IdArray,
        key: 'client_ids',
        label: 'Client IDs',
        value: ['abc-123-cats-are-neat', 'def-456-dogs-are-neat'],
      }"
    />

    <h2>Redacted ID</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.Redacted,
        key: 'id',
        label: 'ID',
        value: 'abc-123-cats-are-neat',
      }"
    />

    <h2>Redacted Array</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.RedactedArray,
        key: 'client_ids',
        label: 'Client IDs',
        value: ['abc-123-cats-are-neat', 'def-456-dogs-are-neat'],
      }"
    />

    <h2>Date</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.Date,
        key: 'created_at',
        label: 'Created At',
        value: 1686245746,
      }"
    />

    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.Date,
        key: 'updated_at',
        label: 'Updated At',
        value: '2023-06-07T17:01:06.000Z',
      }"
    />

    <h2>Status Badge</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.BadgeStatus,
        key: 'status',
        label: 'Status',
        value: true,
      }"
    />
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.BadgeStatus,
        key: 'status',
        label: 'Status',
        value: false,
      }"
    />

    <h2>Method Badges</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.BadgeMethod,
        key: 'methods',
        label: 'Methods',
        value: ['GET', 'PUT', 'POST', 'FOO'],
      }"
    />

    <h2>Tag Badges</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.BadgeTag,
        key: 'tags',
        label: 'Tags',
        value: ['cats', 'purr', 'meow'],
      }"
    />

    <h2>Internal Link</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.LinkInternal,
        key: 'cool_link',
        label: 'Cool Link',
        value: 'http://www.tk-is-a-cool-cat.com',
      }"
    />

    <h2>External Link</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.LinkExternal,
        key: 'cool_link',
        label: 'Cool Link',
        value: 'http://www.tk-is-a-cool-cat.com',
      }"
    />

    <h2>JSON Object</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.Json,
        key: 'cat_data',
        label: 'Cat Data',
        value: {
          name: 'TK Meowstersmith',
          species: 'Awesome cat',
          color: 'All black',
          awesome: 'true',
        },
      }"
    />

    <h2>JSON Text</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.Text,
        key: 'json-code',
        label: 'Cat Data',
        value: {
          name: 'TK Meowstersmith',
          species: 'Awesome cat',
          color: 'All black',
          awesome: 'true',
        },
      }"
    />

    <h2>JSON Object Array</h2>
    <ConfigCardItem
      :item="{
        type: ConfigurationSchemaType.JsonArray,
        key: 'cat_data',
        label: 'Cat Data',
        value: [
          {
            name: 'TK Meowstersmith',
            species: 'Awesome cat',
            color: 'All black',
            awesome: 'true',
          },
          {
            name: 'Sunny McMouser',
            species: 'Shiny cat',
            color: 'Calico - Tortoise Shell',
            awesome: 'true',
          },
          {
            name: 'Harper Joy',
            species: 'Happy yappy cat',
            color: 'Tuxedo - Black & White',
            awesome: 'true',
          },
        ],
      }"
    />

    <h2>Slots: Label &amp; Value</h2>
    <ConfigCardItem
      :item="{
        key: 'name',
        label: 'Name',
        value: 'TK Meowstersmith',
      }"
    >
      <template #label>
        Cool Cat Name
      </template>
      <template #name>
        TK (The Awesome) Meowstersmith
      </template>
    </ConfigCardItem>

    <h2>Slots: Label Tooltip</h2>
    <ConfigCardItem
      :item="{
        key: 'name',
        label: 'Name',
        value: 'TK Meowstersmith',
      }"
    >
      <template #label-tooltip>
        TK is awesome
      </template>
    </ConfigCardItem>

    <h2>Truncated Labels</h2>
    <ConfigCardItem
      :item="{
        key: 'truncated-label-1',
        label: 'Super Long Label Will Also Be Truncated With A Tooltip',
        value: 'I am a really long string but I am not truncated.',
      }"
    />
    <ConfigCardItem
      :item="{
        key: 'truncated-label-2',
        label: 'Double Tooltips! Super Long Label Will Also Be Truncated With A Tooltip',
        value: 'I am a really long string but I am not truncated.',
        tooltip: 'I am the tooltip for the supaa long label',
      }"
    />
    <ConfigCardItem
      :item="{
        key: 'truncated-label-3',
        label: 'Super Long Label Will Also Be Truncated With A Tooltip',
        value: 'I am a really long string and I am truncated.',
      }"
      truncated
    />
    <ConfigCardItem
      :item="{
        key: 'truncated-label-4',
        label: 'Double Tooltips! Super Long Label Will Also Be Truncated With A Tooltip',
        value: 'I am a really long string and I am truncated.',
        tooltip: 'I am the tooltip for the supaa long label',
      }"
      truncated
    />

    <h2>Slim card</h2>
    <div style="width: 400px;">
      <ConfigCardItem
        :item="{
          key: 'slim1',
          label: 'Name',
          value: 'I am slim',
        }"
        slim
      />
      <ConfigCardItem
        :item="{
          key: 'slim2',
          label: 'Another',
          value: 'I am also slim',
        }"
        slim
      />
      <ConfigCardItem
        :item="{
          key: 'slim3',
          label: 'Truncated',
          value: 'Will have a tooltip and be truncated, because I am too long to fit in the space allocated',
        }"
        slim
        truncated
      />
      <ConfigCardItem
        :item="{
          key: 'slim4',
          label: 'Truncated',
          value: 'Short text, no tooltip',
        }"
        slim
        truncated
      />
      <ConfigCardItem
        :item="{
          key: 'slim5',
          label: 'Not Truncated',
          value: 'I am a really long string but I am not truncated.',
        }"
        slim
      />
      <ConfigCardItem
        :item="{
          key: 'slim6',
          label: 'Super Long Label Will Also Be Truncated With A Tooltip',
          value: 'I am a really long string but I am not truncated.',
        }"
        slim
      />
      <ConfigCardItem
        :item="{
          key: 'slim7',
          label: 'Double Tooltips! Super Long Label Will Also Be Truncated With A Tooltip',
          value: 'I am a really long string but I am not truncated.',
          tooltip: 'I am the tooltip for the supaa long label',
        }"
        slim
      />
      <ConfigCardItem
        :item="{
          key: 'slim8',
          label: 'Super Long Label Will Also Be Truncated With A Tooltip',
          value: 'I am a really long string and I am truncated.',
        }"
        slim
        truncated
      />
      <ConfigCardItem
        :item="{
          key: 'slim9',
          label: 'Double Tooltips! Super Long Label Will Also Be Truncated With A Tooltip',
          value: 'I am a really long string and I am truncated.',
          tooltip: 'I am the tooltip for the supaa long label',
        }"
        slim
        truncated
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType } from '../../src'
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 40px;
}
</style>
