
export type ResourceType = 'risitasium' | 'stickers' | 'sel' | 'karma' | 'redpills';

export interface Resources {
  risitasium: number;
  stickers: number;
  sel: number;
  karma: number;
  karmaMax: number;
  redpills: number; // Global resource usually, but kept here for simplicity
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
  basePoints: number;
  reqs?: Requirement;
  image?: string;
  // New Time Calculation props
  baseTime?: number; // Seconds for Level 1
  timeFactor?: number; // Multiplier per level
}

export interface Building extends Entity {
  level: number;
  production?: { type: ResourceType; base: number; factor: number };
  consumption?: { type: ResourceType; base: number; factor: number };
  energyType?: 'consumer' | 'producer';
  reqsArray?: string[];
  percentage: number; // 0 to 100
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
    rapidFire?: { [targetId: string]: number }; // NOUVEAU: RapidFire
  }
}

export interface Defense extends Ship {
}

export interface Officer {
  id: string;
  name: string;
  description: string;
  cost: number;
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

export type MissionType = 'attack' | 'transport' | 'expedition' | 'spy' | 'return' | 'recycle' | 'colonize';

export interface FleetMission {
  id: string;
  type: MissionType;
  fleet: { [shipId: string]: number };
  source: string; // Planet Name or Coords
  target: string; // coords "g:s:p"
  startTime: number;
  arrivalTime: number;
  resources?: { risitasium: number; stickers: number; sel: number };
}

// COMBAT LOGS
export interface CombatRound {
    round: number;
    attackerCount: { [id: string]: number };
    defenderCount: { [id: string]: number };
    attackerLosses: { [id: string]: number };
    defenderLosses: { [id: string]: number };
}

export interface DetailedCombatReport {
    rounds: CombatRound[];
    winner: 'attacker' | 'defender' | 'draw';
    debris: number;
    moonCreated: boolean;
    loot: Resources;
}

export interface Report {
  id: string;
  type: 'combat' | 'spy' | 'expedition' | 'colonize' | 'recycle' | 'missile';
  title: string;
  content: string;
  date: number;
  read: boolean;
  loot?: Resources;
  detailedCombat?: DetailedCombatReport; // Detailed object
}

export interface PointsBreakdown {
  total: number;
  buildings: number;
  research: number;
  fleet: number;
  defense: number;
  economy: number;
}

export interface Planet {
    id: string;
    name: string;
    coords: { g: number; s: number; p: number };
    resources: Resources;
    buildings: Building[];
    fleet: Ship[]; // Fleet is stationed on a planet
    defenses: Defense[];
    queue: ConstructionItem[];
    lastUpdate: number;
    temperature: { min: number, max: number }; // NEW
    fields: { current: number, max: number }; // NEW
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    reward: { risitasium?: number, stickers?: number, sel?: number, redpills?: number };
    condition: (user: User) => boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  allianceId?: string;
  points: PointsBreakdown;
  
  // Global Techs & Officers
  research: Research[];
  officers: Officer[];
  
  // Planets Management
  planets: Planet[];
  currentPlanetId: string; // ID of the planet currently being viewed/managed

  missions: FleetMission[];
  reports: Report[];
  lastUpdate?: number;
  
  // New States
  vacationMode: boolean;
  vacationModeUntil?: number;
  completedQuests: string[];
}

export type AllianceRecruitmentState = 'open' | 'application' | 'closed';

export interface AllianceApplication {
    id: string;
    userId: string;
    username: string;
    points: number;
    message: string;
    date: number;
}

export interface Alliance {
  id: string;
  tag: string;
  name: string;
  founderId: string;
  members: string[]; 
  description: string;
  creationDate: number;
  points: number;
  
  // New properties
  image?: string;
  recruitment: AllianceRecruitmentState;
  applications: AllianceApplication[];
}
