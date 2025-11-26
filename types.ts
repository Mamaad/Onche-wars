
export type ResourceType = 'risitasium' | 'stickers' | 'sel' | 'karma' | 'redpills';

export interface Resources {
  risitasium: number;
  stickers: number;
  sel: number;
  karma: number;
  karmaMax: number;
  redpills: number; 
  maxRis?: number; 
  maxSti?: number; 
  maxSel?: number; 
}

export interface Cost {
  risitasium: number;
  stickers: number;
  sel: number;
}

export interface Requirement {
  [key: string]: number; 
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
  baseTime?: number; 
  timeFactor?: number; 
}

export interface Building extends Entity {
  level: number;
  production?: { type: ResourceType; base: number; factor: number };
  consumption?: { type: ResourceType; base: number; factor: number };
  energyType?: 'consumer' | 'producer';
  reqsArray?: string[];
  percentage: number; 
  isMoonOnly?: boolean; // NEW: For Moon buildings
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
    rapidFire?: { [targetId: string]: number }; 
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

// NEW: Commander Talents
export interface Talent {
    id: string;
    name: string;
    description: string;
    branch: 'raider' | 'miner' | 'strategist';
    tier: number; // 1, 2, 3
    maxLevel: number;
    currentLevel: number;
    reqs?: { [talentId: string]: number };
    effect: (val: number) => string; 
}

// NEW: Artifacts
export interface Artifact {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'legendary';
    effectType: 'resource' | 'speed' | 'combat';
    quantity: number;
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
  source: string; 
  target: string; 
  startTime: number;
  arrivalTime: number;
  resources?: { risitasium: number; stickers: number; sel: number };
}

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
  type: 'combat' | 'spy' | 'expedition' | 'colonize' | 'recycle' | 'missile' | 'transport' | 'war';
  title: string;
  content: string;
  date: number;
  read: boolean;
  loot?: Resources;
  detailedCombat?: DetailedCombatReport; 
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
    fleet: Ship[]; 
    defenses: Defense[];
    queue: ConstructionItem[];
    lastUpdate: number;
    temperature: { min: number, max: number }; 
    fields: { current: number, max: number }; 
    isMoon: boolean; // NEW
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
  
  research: Research[];
  officers: Officer[];
  
  // NEW: RPG Elements
  commanderLevel: number;
  commanderXp: number;
  skillPoints: number;
  talents: Talent[];
  inventory: Artifact[];
  theme: 'default' | 'retro' | 'neon'; 

  planets: Planet[];
  currentPlanetId: string; 

  missions: FleetMission[];
  reports: Report[];
  lastUpdate?: number;
  
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

// NEW: War System
export interface War {
    id: string;
    attackerId: string; // Alliance ID
    defenderId: string; // Alliance ID
    attackerName: string;
    defenderName: string;
    startDate: number;
    status: 'pending' | 'active' | 'finished';
    scoreAttacker: number;
    scoreDefender: number;
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
  image?: string;
  recruitment: AllianceRecruitmentState;
  applications: AllianceApplication[];
  wars: War[]; // NEW
}

export interface TradeOffer {
    id: string;
    sellerId: string;
    sellerName: string;
    type: 'sell' | 'buy'; 
    offeredResource: ResourceType;
    offeredAmount: number;
    requestedResource: ResourceType;
    requestedAmount: number;
    date: number;
}

// NEW: Chat
export interface ChatMessage {
    id: string;
    sender: string;
    senderId: string;
    channel: 'global' | 'alliance' | 'trade';
    content: string;
    timestamp: number;
    allianceTag?: string;
}
