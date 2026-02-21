export interface Lot {
  lot_type: string;
  lot_id: string;
  contract: {
    winner: string;
    publication_date: string;
  };
  permit: {
    date: string;
    number: string;
  };
  lot_share_percentage: number;
  total_bioresource_limit: number;
  species_limits: { [key: string]: number };
  fishing_gear: string[];
  vessels: {
    name: string;
    register_number: string;
    type: string;
  }[];
  location: string;
}

export interface AggregatedFisheryData {
  [winnerName: string]: Lot[];
}