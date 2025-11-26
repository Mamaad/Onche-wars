
export type ResourceType = 'risitasium' | 'stickers' | 'sel' | 'karma' | 'redpills';

export interface Resources {
  risitasium: number;
  stickers: number;
  sel: number;
  karma: number;
  karmaMax: number;
  redpills: number;
}

export interface Cost {
  risitasium: number;
  stickers: number;
  sel: number;
}

export interface Requirement {
  [key: string]: number; // id: level
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  baseCost: Cost;
  costFactor: number;
  basePoints: number; // NOUVEAU : Points de classement fixes
  reqs?: Requirement;
  image?: string;
}

export interface Building extends Entity {
  level: number;
  production?: { type: ResourceType; base: number; factor: number };
  consumption?: { type: ResourceType; base: number; factor: number };
  energyType?: 'consumer' | 'producer';
  reqsArray?: string[];
}

export interface Research extends Entity {
  level: number;
}

export interface Ship extends Entity {
  count: number;
  stats: {
    attack: number;
    defense: number;
    hull: number;
    capacity: number;
  }
}

export interface Defense extends Ship {
  // Defense is structured like a ship (count, stats) but doesn't fly
}

export interface Officer {
  id: string;
  name: string;
  description: string;
  cost: number; // Redpills
  bonus: string;
  active: boolean;
  image?: string;
}

export interface ConstructionItem {
  id: string;
  type: 'building' | 'research';
  startTime: number;
  endTime: number;
  totalDuration: number;
  targetLevel: number;
}

export type MissionType = 'attack' | 'transport' | 'expedition' | 'spy' | 'return' | 'recycle';

export interface FleetMission {
  id: string;
  type: MissionType;
  fleet: { [shipId: string]: number };
  source: string;
  target: string; // coords "g:s:p"
  startTime: number;
  arrivalTime: number;
  resources?: { risitasium: number; stickers: number; sel: number };
}

export interface Report {
  id: string;
  type: 'combat' | 'spy' | 'expedition';
  title: string;
  content: string; // HTML or Text content
  date: number;
  read: boolean;
  loot?: Resources;
}

// --- NEW TYPES FOR BACKEND & SOCIAL ---

export interface PointsBreakdown {
  total: number;
  buildings: number;
  research: number;
  fleet: number;
  defense: number;
  economy: number; // Points "Ressources dépensées" gardés en stat secondaire
}

export interface User {
  id: string;
  username: string;
  email?: string; // Optional
  planetName: string;
  isAdmin: boolean;
  allianceId?: string;
  points: PointsBreakdown;
  
  // Game State (to be stored in DB)
  resources: Resources;
  buildings: Building[];
  research: Research[];
  fleet: Ship[];
  defenses: Defense[];
  officers: Officer[];
  queue: ConstructionItem[];
  missions: FleetMission[];
  reports: Report[];
  lastUpdate: number;
}

export interface Alliance {
  id: string;
  tag: string;
  name: string;
  founderId: string;
  members: string[]; // User IDs
  description: string;
  creationDate: number;
}
