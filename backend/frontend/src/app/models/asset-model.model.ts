export interface AssetModel {
  id?: number;
  makeId: number;
  name: string;
  ram?: string;
  storage?: string;
  processor?: string;
  status?: string;
  typeId: number;
}

export interface AssetModelWithDetails extends AssetModel {
  assetTypeName?: string;
  assetMakeName?: string;
} 