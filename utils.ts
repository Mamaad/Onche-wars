
import { ResourceType, Ship, Defense, User, PointsBreakdown, Building, Research } from './types';
import { BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB } from './constants';

export const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return Math.floor(num).toString();
};

export const getCost = (base: number, factor: number, level: number) => {
  return Math.floor(base * Math.pow(factor, level));
};

export const getProduction = (base: number, factor: number, level: number, type?: ResourceType) => {
  const raw = base * level * Math.pow(factor, level);
  if (type === 'karma') return Math.floor(raw);
  return Math.floor(raw * 0.06);
};

export const getConsumption = (base: number, factor: number, level: number) => {
  return Math.floor(base * level * Math.pow(factor, level));
};

export const getConstructionTime = (costRis: number, costSti: number) => {
  const seconds = (costRis + costSti) / 2500; // Accéléré pour le test
  return seconds < 1 ? 1 : Math.round(seconds);
};

export const formatTime = (seconds: number) => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ${Math.floor(seconds%60)}s`;
  return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
};

// --- POINTS CALCULATION (NEW SYSTEM) ---

// Points = BasePoints * Level (pour Bâtiments et Recherche)
// Points = BasePoints * Count (pour Flotte et Défense)
// Economy Points (Secondaire) = 1 point / 1000 ressources dépensées

const calculateEconomyPoints = (baseCost: {risitasium: number, stickers: number, sel: number}, factor: number, level: number) => {
  let totalSpent = 0;
  for(let i=1; i<=level; i++) {
     totalSpent += getCost(baseCost.risitasium, factor, i-1);
     totalSpent += getCost(baseCost.stickers, factor, i-1);
     totalSpent += getCost(baseCost.sel, factor, i-1);
  }
  return Math.floor(totalSpent / 1000);
};

export const calculateUserPoints = (user: User): PointsBreakdown => {
  let p_build = 0;
  let p_eco_build = 0;
  user.buildings.forEach(b => {
     const db = BUILDING_DB.find(x => x.id === b.id);
     if(db && b.level > 0) {
        // Points de classement : Somme des points pour chaque niveau
        // Exemple: Mine Niv 2 (Base 1). Niv 1 (1pt) + Niv 2 (2pts) = 3pts Total ??
        // NON : Le user demande "Niveau 4 rapporte 1 pts, Niveau 5 rapporte 2 pts".
        // Interprétation standard : Le "bâtiment au niveau X" vaut "Y points".
        // Formule choisie : BasePoints * Niveau (linéaire simple) ou BasePoints * (Level^Factor) ?
        // Restons simple : BasePoints * Level. Une mine lvl 10 (base 1) vaudra 10 pts. Une Etoile Noire (base 10000) vaudra 10000.
        
        p_build += (db.basePoints * b.level);
        p_eco_build += calculateEconomyPoints(db.baseCost, db.costFactor, b.level);
     }
  });

  let p_research = 0;
  let p_eco_research = 0;
  user.research.forEach(r => {
     const db = RESEARCH_DB.find(x => x.id === r.id);
     if(db && r.level > 0) {
        p_research += (db.basePoints * r.level);
        p_eco_research += calculateEconomyPoints(db.baseCost, db.costFactor, r.level);
     }
  });

  let p_fleet = 0;
  let p_eco_fleet = 0;
  user.fleet.forEach(s => {
      const db = SHIP_DB.find(x => x.id === s.id);
      if(db && s.count > 0) {
          p_fleet += (db.basePoints * s.count);
          
          const unitCost = db.baseCost.risitasium + db.baseCost.stickers + db.baseCost.sel;
          p_eco_fleet += Math.floor((unitCost * s.count) / 1000);
      }
  });

  let p_defense = 0;
  let p_eco_defense = 0;
  user.defenses.forEach(d => {
      const db = DEFENSE_DB.find(x => x.id === d.id);
      if(db && d.count > 0) {
          p_defense += (db.basePoints * d.count);
          
          const unitCost = db.baseCost.risitasium + db.baseCost.stickers + db.baseCost.sel;
          p_eco_defense += Math.floor((unitCost * d.count) / 1000);
      }
  });

  return {
    total: p_build + p_research + p_fleet + p_defense,
    buildings: p_build,
    research: p_research,
    fleet: p_fleet,
    defense: p_defense,
    economy: p_eco_build + p_eco_research + p_eco_fleet + p_eco_defense
  };
};

// Combat Simulator Logic (Simplified OGame style)
export const calculateCombat = (attackerFleet: Ship[], defenderFleet: Ship[], defenses: Defense[]) => {
  let attackerPower = attackerFleet.reduce((acc, s) => acc + (s.stats.attack * s.count), 0);
  let attackerHull = attackerFleet.reduce((acc, s) => acc + (s.stats.hull * s.count), 0);
  
  let defenderPower = defenderFleet.reduce((acc, s) => acc + (s.stats.attack * s.count), 0) + 
                      defenses.reduce((acc, d) => acc + (d.stats.attack * d.count), 0);
                      
  let defenderHull = defenderFleet.reduce((acc, s) => acc + (s.stats.hull * s.count), 0) +
                     defenses.reduce((acc, d) => acc + (d.stats.hull * d.count), 0);

  // Random variations
  attackerPower *= (0.8 + Math.random() * 0.4);
  defenderPower *= (0.8 + Math.random() * 0.4);

  const rounds = 6;
  let winner = 'draw';
  
  // Simplified Battle: Apply damage to total hull
  for (let i = 0; i < rounds; i++) {
     defenderHull -= attackerPower / rounds;
     attackerHull -= defenderPower / rounds;

     if (defenderHull <= 0) { winner = 'attacker'; break; }
     if (attackerHull <= 0) { winner = 'defender'; break; }
  }

  // Debris Calculation (30% of ships destroyed to debris)
  // Simplified for this mock: Random debris based on fleet size
  const totalFleetSize = attackerFleet.reduce((a,b)=>a+b.count,0) + defenderFleet.reduce((a,b)=>a+b.count,0);
  const debris = Math.floor(totalFleetSize * 1000 * Math.random());
  
  // Moon Chance: 1% per 100,000 debris, max 20%
  const moonChance = Math.min(20, Math.floor(debris / 100000));
  const moonCreated = Math.random() * 100 < moonChance;
  
  return { 
    winner, 
    attackerRemaining: Math.max(0, attackerHull), 
    defenderRemaining: Math.max(0, defenderHull),
    moonCreated,
    moonChance,
    debris
  };
};
