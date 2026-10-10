import type { Component } from 'vue'
import type { ColumnIconSet } from '@kong-ui-public/analytics-utilities'
import {
  AmazonBedrockIcon,
  AnthropicIcon,
  AzureIcon,
  CerebrasIcon,
  CohereIcon,
  DatabricksIcon,
  DeepseekIcon,
  GeminiIcon,
  GoogleVertexIcon,
  GrokIcon,
  HuggingFaceIcon,
  KimiIcon,
  MetaLlamaIcon,
  MistralIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAiIcon,
  VllmIcon,
} from '@kong/icons'

export const aiProviderIcons: Readonly<Record<string, Component>> = {
  anthropic: AnthropicIcon,
  azure: AzureIcon,
  bedrock: AmazonBedrockIcon,
  cerebras: CerebrasIcon,
  cohere: CohereIcon,
  databricks: DatabricksIcon,
  deepseek: DeepseekIcon,
  gemini: GeminiIcon,
  huggingface: HuggingFaceIcon,
  llama2: MetaLlamaIcon,
  mistral: MistralIcon,
  moonshot: KimiIcon,
  nvidia: NvidiaIcon,
  ollama: OllamaIcon,
  openai: OpenAiIcon,
  vertex: GoogleVertexIcon,
  vllm: VllmIcon,
  xai: GrokIcon,
}

const iconSets: Readonly<Record<ColumnIconSet, Readonly<Record<string, Component>>>> = {
  ai_provider: aiProviderIcons,
}

export const getColumnIcon = (iconSet: ColumnIconSet | undefined, id: string): Component | undefined => {
  if (!iconSet || !id) {
    return undefined
  }

  return iconSets[iconSet]?.[id.toLowerCase()]
}
