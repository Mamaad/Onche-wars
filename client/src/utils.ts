
import { ResourceType, Ship, Defense, User, PointsBreakdown, Building, Research, CombatRound, DetailedCombatReport } from './types';
import { BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB, RAPID_FIRE } from './constants';

export const formatNumber = (num: number) => {
  // Format: 1 000 000 (Espaces, pas de virgules, pas de décimales)
  return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const getCost = (base: number, factor: number, level: number) => {
  return Math.floor(base * Math.pow(factor, level));
};

export const getProduction = (base: number, factor: number, level: number, type?: ResourceType, temperature?: { min: number, max: number }, percentage: number = 100) => {
  const raw = base * level * Math.pow(factor, level);
  const ratio = percentage / 100;
  
  // Temperature Logic
  if (temperature) {
      const avgTemp = (temperature.min + temperature.max) / 2;
      
      if (type === 'karma') {
          // Solar energy bonus up to +50% at 100°C
          const tempBonus = 1 + (avgTemp / 200);
          return Math.floor(raw * Math.max(0.1, tempBonus) * ratio); // Apply ratio here
      }
      
      if (type === 'sel') {
          // Deut (Sel) consumption/production affected by temp
          const tempFactor = 1.44 - 0.004 * temperature.max;
          // CRITICAL FIX: Applied speed factor to Salt as well
          return Math.floor(raw * Math.max(0.1, tempFactor) * 0.09 * ratio);
      }
  }

  if (type === 'karma') return Math.floor(raw * ratio);
  
  // --- GLOBAL SPEED FACTOR ---
  // C'est ici qu'on règle la vitesse de l'économie entière du jeu
  return Math.floor(raw * 0.09 * ratio); 
};

export const getConsumption = (base: number, factor: number, level: number, percentage: number = 100) => {
  return Math.floor(base * level * Math.pow(factor, level) * (percentage / 100));
};

export const getStorageCapacity = (level: number) => {
    // Base 100k for level 1
    // Formula: 100000 * 3 ^ (level - 1) (Triple per level)
    if (level === 0) return 10000; // Base planet storage
    return Math.floor(100000 * Math.pow(3, level - 1));
};

export const getConstructionTime = (baseTime: number, timeFactor: number, targetLevel: number, roboticsLevel: number = 0) => {
  // New Logic: Decoupled from cost.
  // Time = BaseTime * (TimeFactor ^ (Level - 1))
  // Speedup: / (Robotics + 1)
  
  const levelIndex = Math.max(0, targetLevel - 1);
  const rawSeconds = baseTime * Math.pow(timeFactor, levelIndex);
  const seconds = rawSeconds * (1 / (roboticsLevel + 1));
  
  return seconds < 1 ? 1 : Math.round(seconds);
};

export const formatTime = (seconds: number) => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ${Math.floor(seconds%60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
  return `${Math.floor(seconds/86400)}j ${Math.floor((seconds%86400)/3600)}h`;
};

export const calculateFuelConsumption = (fleet: {[id: string]: number}, distance: number) => {
    // Simple Formula: 10 + (TotalCapacity / 5000) * Distance (1 System = 1 Unit Distance)
    let totalCapacity = 0;
    Object.entries(fleet).forEach(([id, count]) => {
        const ship = SHIP_DB.find(s => s.id === id);
        if (ship) totalCapacity += ship.stats.capacity * count;
    });
    
    return Math.floor(10 + (totalCapacity / 5000) * distance);
};

// --- POINTS CALCULATION ---

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
  let p_fleet = 0;
  let p_eco_fleet = 0;
  let p_defense = 0;
  let p_eco_defense = 0;

  // Points from Planets (Buildings, Fleet, Defense)
  user.planets.forEach(planet => {
      planet.buildings.forEach(b => {
          const db = BUILDING_DB.find(x => x.id === b.id);
          if(db && b.level > 0) {
              p_build += (db.basePoints * b.level);
              p_eco_build += calculateEconomyPoints(db.baseCost, db.costFactor, b.level);
          }
      });

      planet.fleet.forEach(s => {
          const db = SHIP_DB.find(x => x.id === s.id);
          if(db && s.count > 0) {
              p_fleet += (db.basePoints * s.count);
              const unitCost = db.baseCost.risitasium + db.baseCost.stickers + db.baseCost.sel;
              p_eco_fleet += Math.floor((unitCost * s.count) / 1000);
          }
      });

      planet.defenses.forEach(d => {
          const db = DEFENSE_DB.find(x => x.id === d.id);
          if(db && d.count > 0) {
              p_defense += (db.basePoints * d.count);
              const unitCost = db.baseCost.risitasium + db.baseCost.stickers + db.baseCost.sel;
              p_eco_defense += Math.floor((unitCost * d.count) / 1000);
          }
      });
  });

  // Points from Account (Research)
  let p_research = 0;
  let p_eco_research = 0;
  user.research.forEach(r => {
     const db = RESEARCH_DB.find(x => x.id === r.id);
     if(db && r.level > 0) {
        p_research += (db.basePoints * r.level);
        p_eco_research += calculateEconomyPoints(db.baseCost, db.costFactor, r.level);
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

// --- COMBAT SYSTEM V2 (Detailed) ---

interface CombatEntity {
    uuid: string;
    id: string;
    hull: number;
    shield: number;
    maxHull: number;
    maxShield: number;
    attack: number;
    type: string;
    rapidFire: { [key: string]: number };
}

export const calculateCombat = (attackerFleet: Ship[], defenderFleet: Ship[], defenses: Defense[]): DetailedCombatReport => {
  // Expand fleet into individual units for simulation
  let attackers: CombatEntity[] = [];
  attackerFleet.forEach(s => {
      for(let i=0; i<s.count; i++) attackers.push({ 
          uuid: Math.random().toString(36),
          id: s.id, 
          hull: s.stats.hull, 
          maxHull: s.stats.hull,
          shield: s.stats.defense, 
          maxShield: s.stats.defense,
          attack: s.stats.attack, 
          type: s.id,
          rapidFire: s.stats.rapidFire || {}
      });
  });

  let defenders: CombatEntity[] = [];
  defenderFleet.forEach(s => {
      for(let i=0; i<s.count; i++) defenders.push({ 
          uuid: Math.random().toString(36),
          id: s.id, 
          hull: s.stats.hull, 
          maxHull: s.stats.hull,
          shield: s.stats.defense, 
          maxShield: s.stats.defense,
          attack: s.stats.attack, 
          type: s.id,
          rapidFire: s.stats.rapidFire || {}
      });
  });
  defenses.forEach(d => {
      for(let i=0; i<d.count; i++) defenders.push({ 
          uuid: Math.random().toString(36),
          id: d.id, 
          hull: d.stats.hull, 
          maxHull: d.stats.hull,
          shield: d.stats.defense, 
          maxShield: d.stats.defense,
          attack: d.stats.attack, 
          type: d.id,
          rapidFire: {}
      });
  });

  const roundsLog: CombatRound[] = [];
  const rounds = 6;
  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  
  const initialAttackerValue = attackers.reduce((a, b) => a + b.maxHull, 0); // Simplified value tracking
  const initialDefenderValue = defenders.reduce((a, b) => a + b.maxHull, 0);

  // Helper to count ships by ID
  const countShips = (entities: CombatEntity[]) => {
      const counts: {[id: string]: number} = {};
      entities.forEach(e => counts[e.id] = (counts[e.id] || 0) + 1);
      return counts;
  };

  for (let r = 0; r < rounds; r++) {
      if (attackers.length === 0) { winner = 'defender'; break; }
      if (defenders.length === 0) { winner = 'attacker'; break; }

      const startAttackerCount = countShips(attackers);
      const startDefenderCount = countShips(defenders);

      // Attackers shoot Defenders
      processSalvo(attackers, defenders);
      // Defenders shoot Attackers
      processSalvo(defenders, attackers);

      const endAttackerCount = countShips(attackers.filter(u => u.hull > 0));
      const endDefenderCount = countShips(defenders.filter(u => u.hull > 0));

      // Calculate losses for this round
      const attackerLosses: any = {};
      Object.keys(startAttackerCount).forEach(k => attackerLosses[k] = startAttackerCount[k] - (endAttackerCount[k] || 0));
      
      const defenderLosses: any = {};
      Object.keys(startDefenderCount).forEach(k => defenderLosses[k] = startDefenderCount[k] - (endDefenderCount[k] || 0));

      roundsLog.push({
          round: r + 1,
          attackerCount: startAttackerCount,
          defenderCount: startDefenderCount,
          attackerLosses,
          defenderLosses
      });

      // Clean up dead units
      attackers = attackers.filter(u => u.hull > 0);
      defenders = defenders.filter(u => u.hull > 0);
      
      // Recharge Shields
      attackers.forEach(u => u.shield = u.maxShield);
      defenders.forEach(u => u.shield = u.maxShield);
  }

  if (attackers.length > 0 && defenders.length === 0) winner = 'attacker';
  else if (defenders.length > 0 && attackers.length === 0) winner = 'defender';
  else winner = 'draw';

  // Calculate Debris (30% of Hull lost)
  const lostAttackerValue = initialAttackerValue - attackers.reduce((a, b) => a + b.maxHull, 0);
  const lostDefenderValue = initialDefenderValue - defenders.reduce((a, b) => a + b.maxHull, 0);
  const debris = Math.floor((lostAttackerValue + lostDefenderValue) * 0.3);

  const moonChance = Math.min(20, Math.floor(debris / 100000));
  const moonCreated = Math.random() * 100 < moonChance;

  return {
      rounds: roundsLog,
      winner,
      debris,
      moonCreated,
      loot: { risitasium: 0, stickers: 0, sel: 0, karma: 0, karmaMax: 0, redpills: 0 } // Calculated later
  };
};

const processSalvo = (shooters: CombatEntity[], targets: CombatEntity[]) => {
    shooters.forEach(shooter => {
        let targetsToShoot = 1;
        
        while (targetsToShoot > 0 && targets.length > 0) {
            const targetIndex = Math.floor(Math.random() * targets.length);
            const target = targets[targetIndex];
            
            // Damage Logic
            if (target.hull > 0) {
                if (target.shield < shooter.attack) {
                    const damage = shooter.attack - target.shield;
                    target.hull -= damage;
                    // Explosion logic simplified: if hull < 0, marked for death.
                } else {
                    // Shield absorbed it, maybe small damage? Simplified: absorbed.
                    target.shield -= Math.floor(shooter.attack / 100); // Tiny shield damage
                }
            }

            targetsToShoot--;

            // Check RapidFire
            const rfChance = shooter.rapidFire[target.type]; 
            if (rfChance) {
                const chance = (rfChance - 1) / rfChance;
                if (Math.random() < chance) {
                    targetsToShoot++;
                }
            }
        }
    });
};
