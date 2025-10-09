import { omit } from 'lodash-es'
import type { FieldName } from '../../types'
import { findFieldByName } from '../store/helpers'
import { useEditorStore } from '../store/store'

export function useVaultForm() {
  const {
    addField,
    getNodeByName,
    removeField,
    replaceConfig,
    renameField,
    disconnectOutEdges,
  } = useEditorStore()

  const vaultNode = getNodeByName('vault')

  if (!vaultNode) throw new Error('no vault node')

  const addVault = (name: FieldName, value: string) => {
    addField(vaultNode.id, 'output', name, false)
    const nextConfig = {
      ...vaultNode.config,
      [name]: value,
    }
    replaceConfig(vaultNode.id, nextConfig)
  }

  const removeVault = (name: FieldName) => {
    const field = findFieldByName(vaultNode, 'output', name)
    if (!field) return
    const isLastVault = vaultNode.fields.output.length === 1
    removeField(vaultNode.id, field.id, true, false)
    const nextConfig = omit(vaultNode.config, name)
    replaceConfig(vaultNode.id, nextConfig, !isLastVault)

    // Remove all the connections of vault node if it's the last vault
    if (isLastVault) {
      disconnectOutEdges(vaultNode.id)
    }
  }

  const updateVault = (name: FieldName, value: string, commit = true) => {
    const nextConfig = {
      ...vaultNode.config,
      [name]: value,
    }
    replaceConfig(vaultNode.id, nextConfig, commit)
  }

  const renameVault = (oldName: FieldName, newName: FieldName, commit = true) => {
    const field = findFieldByName(vaultNode, 'output', oldName)
    if (!field) return
    renameField(vaultNode.id, field.id, newName, false)
    const oldValue = vaultNode.config?.[oldName] ?? ''
    const nextConfig = {
      ...omit(vaultNode.config, oldName),
      [newName]: oldValue,
    }
    replaceConfig(vaultNode.id, nextConfig, commit)
  }

  return {
    addVault,
    removeVault,
    updateVault,
    renameVault,
  }
}
