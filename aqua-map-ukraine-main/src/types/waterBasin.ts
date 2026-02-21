
export interface Location {
  rawString: string;
  fullAddress: string;
  street?: string | null;
  settlement?: string | null;
  region?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  geoDataSource: string;
}

export interface WaterBasin {
  id: string;
  lesseeName: string;
  waterBodyName: string;
  location: Location;
  purpose: string;
  fishSpecies?: string | string[] | null;
  leaseExpiry?: string | null;
}
