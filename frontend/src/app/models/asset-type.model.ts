export interface AssetType {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  assetCategory?: 'HARDWARE' | 'SOFTWARE';
  assetTypeName?: string; // For display purposes
} 