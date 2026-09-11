import { onMounted, ref } from 'vue'
import type { SelectItem } from '@kong/kongponents'
import type { KongManagerConfig } from '../types'
import useAxios from './useAxios'

interface TagRecord {
  tag: string
}

/**
 * Fetches the first page of tag-to-entity associations from the Admin API `/tags` endpoint
 * and returns a deduplicated list of tag names to use as select options for the tags filter.
 *
 * The `/tags` endpoint returns paginated tag-to-entity association records rather than a
 * distinct list of tag names, so this only surfaces suggestions from the first page; users can
 * still type in a tag that isn't part of the initial suggestions via `enableItemCreation`.
 */
export default function useTagsFilter(config: KongManagerConfig) {
  const tagOptions = ref<SelectItem[]>([])
  const tagsLoading = ref(false)

  const buildTagsUrl = (): string => {
    const url = `${config.apiBaseUrl}/{workspace}/tags`
    return url.replace(/\/{workspace}/gi, config.workspace ? `/${config.workspace}` : '')
  }

  const fetchTags = async (): Promise<void> => {
    tagsLoading.value = true

    try {
      const { axiosInstance } = useAxios(config.axiosRequestConfig)
      const { data } = await axiosInstance.get<{ data: TagRecord[] }>(buildTagsUrl(), {
        params: { size: 100 },
      })

      const uniqueTags = Array.from(new Set((data?.data ?? []).map((record) => record.tag).filter(Boolean)))
      tagOptions.value = uniqueTags.map((tag) => ({ label: tag, value: tag }))
    } catch (err) {
      console.error('useTagsFilter', err)
      tagOptions.value = []
    } finally {
      tagsLoading.value = false
    }
  }

  onMounted(() => {
    fetchTags()
  })

  return {
    tagOptions,
    tagsLoading,
  }
}
