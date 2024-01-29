export interface AssetMetadata {
  sha256sum: string;
  size: number;
  type: string;
}

export interface AssetPluginMetadata extends AssetMetadata {
  type: 'plugin';
  plugin_name: string;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  metadata: AssetMetadata;
}

// FIX LATER
