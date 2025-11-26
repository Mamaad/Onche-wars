
import React, { useState, useEffect, useRef } from 'react';
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Planet, DetailedCombatReport, Artifact } from './types';
import { getCost, getProduction, getConsumption, getConstructionTime, calculateCombat, getStorageCapacity } from './utils';
import { api } from './api';
import { SHIP_DB, DEFENSE_DB, QUEST_DB, ARTIFACT_DB } from './constants';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TutorialWidget } from './components/TutorialWidget';
import { ChatWidget } from './components/ChatWidget'; // NEW

// Views
import { AuthView } from './views/AuthView';
import { Overview } from './views/Overview';
import { Buildings } from './views/Buildings';
import { BuildingDetail } from './views/BuildingDetail';
import { GalaxyView } from './views/GalaxyView';
import { TechTreeView } from './views/TechTreeView';
import { ResearchView } from './views/ResearchView';
import { ShipyardView } from './views/ShipyardView';
import { DefenseView } from './views/DefenseView';
import { FleetView } from './views/FleetView';
import { OfficerClubView } from './views/OfficerClubView';
import { SimulatorView } from './views/SimulatorView';
import { MessagesView } from './views/MessagesView';
import { HelpView } from './views/HelpView';
import { MarketView } from './views/MarketView'; 
import { HighscoreView } from './views/HighscoreView';
import { AllianceView } from './views/AllianceView';
import { AdminView } from './views/AdminView';
import { ResourceSettingsView } from './views/ResourceSettingsView';
import { CommanderView } from './views/CommanderView'; // NEW
import { UnderConstruction } from './views/UnderConstruction';

const App = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- GAME STATE (Synced from Current Planet) ---
  const [tab, setTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [fleetParams, setFleetParams] = useState<any>(null);
  
  // These are copies of the CURRENT PLANET data for easier binding
  const [resources, setResources] = useState<Resources | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [fleet, setFleet] = useState<Ship[]>([]);
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [constructionQueue, setConstructionQueue] = useState<ConstructionItem[]>([]);
  
  // Global User Data
  const [research, setResearch] = useState<Research[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [missions, setMissions] = useState<FleetMission[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const lastTickRef = useRef<number>(Date.now());
  const saveIntervalRef = useRef<number>(Date.now());

  // --- INITIAL LOAD (Auth Check) ---
  useEffect(() => {
      api.getSession().then(user => {
          if (user) {
              setCurrentUser(user);
              loadPlanetData(user, user.currentPlanetId);
          }
          setLoadingAuth(false);
      });
  }, []);

  // APPLY THEME
  useEffect(() => {
      if(currentUser?.theme) {
          document.body.className = `scanlines overflow-x-hidden theme-${currentUser.theme}`;
      }
  }, [currentUser?.theme]);

  const loadPlanetData = (user: User, planetId: string) => {
      const p = user.planets.find(x => x.id === planetId) || user.planets[0];
      if (!p) return;

      setResources(p.resources);
      // Ensure buildings have percentage property (migration fix)
      const hydratedBuildings = p.buildings.map(b => ({...b, percentage: b.percentage !== undefined ? b.percentage : 100}));
      setBuildings(hydratedBuildings);
      setFleet(p.fleet);
      setDefenses(p.defenses);
      setConstructionQueue(p.queue);

      setResearch(user.research);
      setOfficers(user.officers);
      setMissions(user.missions);
      setReports(user.reports);
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      loadPlanetData(user, user.currentPlanetId);
  };

  const handlePlanetChange = (planetId: string) => {
      if (!currentUser) return;
      // Force sync current state to old planet before switching
      syncToBackend(); 
      
      const updatedUser = { ...currentUser, currentPlanetId: planetId };
      setCurrentUser(updatedUser);
      loadPlanetData(updatedUser, planetId);
  };

  // --- GAME LOOP ---
  useEffect(() => {
    if (!currentUser || !resources) return;
    if (currentUser.vacationMode) return; // Stop loop in vacation mode

    const tickRate = 1000; 
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // --- OFFICERS BONUSES ---
      const energyBonus = officers.find(o => o.id === 'off_celestin' && o.active) ? 1.1 : 1.0;
      const currentPlanet = currentUser.planets.find(p => p.id === currentUser.currentPlanetId) || currentUser.planets[0];

      // --- TALENT BONUSES ---
      const minerLevel = currentUser.talents.find(t => t.id === 't_mine_boost')?.currentLevel || 0;
      const mineBonus = 1 + (minerLevel * 0.02);

      // --- PRODUCTION ---
      let producedKarma = 0;
      let consumedKarma = 0;
      
      // Calculate Storage Limits
      const hangarRis = buildings.find(b => b.id === 'hangar_risitasium')?.level || 0;
      const hangarSti = buildings.find(b => b.id === 'hangar_stickers')?.level || 0;
      const hangarSel = buildings.find(b => b.id === 'reservoir_sel')?.level || 0;
      
      const maxRis = getStorageCapacity(hangarRis);
      const maxSti = getStorageCapacity(hangarSti);
      const maxSel = getStorageCapacity(hangarSel);

      // Building Energy
      buildings.forEach(b => {
        if (b.level === 0) return;
        const percent = b.percentage || 100;
        
        if (b.energyType === 'producer' && b.production?.type === 'karma') {
             producedKarma += getProduction(b.production.base, b.production.factor, b.level, 'karma', currentPlanet.temperature, percent) * energyBonus;
        }
        if (b.energyType === 'consumer' && b.consumption?.type === 'karma') {
          consumedKarma += getConsumption(b.consumption.base, b.consumption.factor, b.level, percent);
        }
      });

      // Solar Satellite Energy
      const sats = fleet.find(s => s.id === 'satellite_solaire');
      if (sats && sats.count > 0) {
          const satEnergy = sats.count * Math.floor(30 * (1 + (currentPlanet.temperature.max / 200)));
          producedKarma += satEnergy;
      }
      
      const availableKarma = producedKarma - consumedKarma;
      const efficiency = availableKarma < 0 && producedKarma > 0 
        ? Math.max(0, producedKarma / consumedKarma) 
        : 1;

      setResources(prev => {
        if (!prev) return null;
        let newRis = prev.risitasium;
        let newSti = prev.stickers;
        let newSel = prev.sel;
        const newKarma = availableKarma;

        buildings.forEach(b => {
          if (b.level > 0 && b.production) {
            const percent = b.percentage || 100;
            // Apply Mine Bonus from Talents
            const talentMulti = (b.id.includes('mine') || b.id.includes('extracteur') || b.id.includes('raffineur')) ? mineBonus : 1;
            
            const amount = getProduction(b.production.base, b.production.factor, b.level, b.production.type, currentPlanet.temperature, percent) * deltaSeconds * efficiency * talentMulti;
            
            if (b.production.type === 'risitasium') newRis = Math.min(maxRis, newRis + amount);
            if (b.production.type === 'stickers') newSti = Math.min(maxSti, newSti + amount);
            if (b.production.type === 'sel') newSel = Math.min(maxSel, newSel + amount);
          }
        });

        // Add Storage Caps to state for UI
        return {
          ...prev,
          risitasium: newRis,
          stickers: newSti,
          sel: newSel,
          karma: newKarma,
          karmaMax: producedKarma,
          redpills: prev.redpills,
          maxRis, // Pass caps for UI
          maxSti,
          maxSel
        } as any; // TS bypass for dynamic properties
      });

      // --- CONSTRUCTION QUEUE ---
      setConstructionQueue(prevQueue => {
          if (prevQueue.length === 0) return [];
          const currentItem = prevQueue[0];
          
          if (currentItem.startTime > 0 && now >= currentItem.endTime) {
              if (currentItem.type === 'building') {
                  setBuildings(bs => bs.map(b => b.id === currentItem.id ? {...b, level: currentItem.targetLevel} : b));
                  // XP Gain for Building
                  if(currentUser) {
                      const gain = currentItem.targetLevel * 10;
                      currentUser.commanderXp += gain;
                  }
              } else if (currentItem.type === 'research') {
                  setResearch(rs => rs.map(r => r.id === currentItem.id ? {...r, level: currentItem.targetLevel} : r));
                  // XP Gain for Research
                  if(currentUser) {
                      const gain = currentItem.targetLevel * 20;
                      currentUser.commanderXp += gain;
                  }
              }

              const nextQueue = prevQueue.slice(1);
              if (nextQueue.length > 0) {
                  const nextItem = nextQueue[0];
                  nextQueue[0] = { ...nextItem, startTime: now, endTime: now + (nextItem.totalDuration * 1000) };
              }
              return nextQueue;
          }
          
          if (currentItem.startTime === 0) {
              return [ { ...currentItem, startTime: now, endTime: now + (currentItem.totalDuration * 1000) }, ...prevQueue.slice(1) ];
          }
          return prevQueue;
      });

      // --- MISSIONS ---
      setMissions(prevMissions => {
          const completed = prevMissions.filter(m => m.arrivalTime <= now);
          const active = prevMissions.filter(m => m.arrivalTime > now);

          completed.forEach(m => {
              if (m.type === 'return') {
                  setFleet(prev => prev.map(s => ({ ...s, count: s.count + (m.fleet[s.id] || 0) })));
                  if (m.resources) {
                      setResources(res => res ? ({
                          ...res,
                          risitasium: res.risitasium + (m.resources?.risitasium || 0),
                          stickers: res.stickers + (m.resources?.stickers || 0),
                          sel: res.sel + (m.resources?.sel || 0),
                      }) : null);
                  }
              } else {
                  processMissionArrival(m);
              }
          });
          return active;
      });

      // --- SYNC TO "BACKEND" ---
      if (now - saveIntervalRef.current > 5000) {
          syncToBackend();
          saveIntervalRef.current = now;
      }

    }, tickRate);

    return () => clearInterval(interval);
  }, [currentUser, buildings, constructionQueue, missions, officers, resources, fleet]);


  // --- HELPERS ---
  
  const handleClaimQuest = (questId: string) => {
      if (!currentUser) return;
      const quest = QUEST_DB.find(q => q.id === questId);
      if (!quest) return;

      // Re-verify condition on current state to be safe
      const tempUser = { 
          ...currentUser!, 
          planets: currentUser!.planets.map(p => p.id === currentUser!.currentPlanetId ? {...p, buildings, fleet} : p),
          research 
      };

      if (quest.condition(tempUser)) {
          setResources(prev => {
              if(!prev) return null;
              return {
                  ...prev,
                  risitasium: prev.risitasium + (quest.reward.risitasium || 0),
                  stickers: prev.stickers + (quest.reward.stickers || 0),
                  sel: prev.sel + (quest.reward.sel || 0),
                  redpills: prev.redpills + (quest.reward.redpills || 0),
              }
          });
          
          // Optimistic Update
          setCurrentUser(prev => prev ? ({...prev, completedQuests: [...prev.completedQuests, quest.id]}) : null);
          
          // Save immediately
          const userToSave = { ...tempUser, completedQuests: [...tempUser.completedQuests, quest.id] };
          api.saveGameState(userToSave);
      }
  };

  const syncToBackend = () => {
      if (!currentUser || !resources) return;
      
      const currentPlanetIndex = currentUser.planets.findIndex(p => p.id === currentUser.currentPlanetId);
      if (currentPlanetIndex !== -1) {
          currentUser.planets[currentPlanetIndex] = {
              ...currentUser.planets[currentPlanetIndex],
              resources,
              buildings,
              fleet,
              defenses,
              queue: constructionQueue
          };
      }

      const updatedUser: User = {
          ...currentUser,
          research,
          officers,
          missions,
          reports
      };
      api.saveGameState(updatedUser);
  };

  const processMissionArrival = async (m: FleetMission) => {
      let newReport: Report = {
          id: Date.now().toString(),
          date: Date.now(),
          read: false,
          type: 'combat',
          title: 'Mission Terminée',
          content: ''
      };

      if (m.type === 'attack') {
          const attackFleet = SHIP_DB.map(s => ({...s, count: m.fleet[s.id] || 0}));
          const defDef = DEFENSE_DB.map(d => ({...d, count: Math.floor(Math.random() * 5)})); 
          const res = calculateCombat(attackFleet, [], defDef);

          if (res.winner === 'attacker') {
             const loot = { risitasium: 1000 + Math.random()*2000, stickers: 500 + Math.random()*500, sel: 0, karma: 0, karmaMax: 0, redpills: 0 };
             let content = 'Vous avez écrasé la défense ennemie.';
             if (res.moonCreated) {
                 content += '\n\nUNE LUNE A ÉTÉ CRÉÉE !';
                 // Add Moon to target user (Simulation needs target user access, skipped for now or handled via backend logic)
                 // In single player simulation, we assume we attacked an AI or another player.
                 // If another player, we should add moon to their planet list in api.ts.
             }
             
             await api.updateGalaxyDebris(m.target, { risitasium: Math.floor(res.debris * 0.7), stickers: Math.floor(res.debris * 0.3), sel: 0, karma:0, karmaMax:0, redpills:0 });

             newReport = { ...newReport, title: 'Victoire !', content, loot, detailedCombat: res };
             returnFleet(m, loot);
          } else {
             newReport = { ...newReport, title: 'Défaite...', content: 'Votre flotte a été anéantie.', detailedCombat: res };
          }
      } 
      else if (m.type === 'recycle') {
          const capacity = Object.entries(m.fleet).reduce((acc, [id, count]) => {
              const ship = SHIP_DB.find(s => s.id === id);
              return acc + (ship ? ship.stats.capacity * count : 0);
          }, 0);
          
          const harvested = await api.harvestDebris(m.target, capacity);
          newReport = { ...newReport, type: 'recycle', title: 'Recyclage', content: `Vos recycleurs ont récupéré des débris sur ${m.target}.`, loot: harvested };
          returnFleet(m, harvested);
      }
      else if (m.type === 'colonize') {
          if (currentUser) {
              const [g,s,p] = m.target.split(':').map(Number);
              await api.colonizePlanet(currentUser, {g, s, p});
              newReport = { ...newReport, type: 'colonize', title: 'Colonisation réussie', content: `Une nouvelle colonie a été fondée en [${m.target}].` };
              returnFleet(m);
              api.getSession().then(u => { if(u) setCurrentUser(u); });
          }
      }
      else if (m.type === 'expedition') {
          const rand = Math.random();
          let content = '';
          let loot = undefined;

          if (rand > 0.6) {
             // Resources
             loot = { risitasium: 5000, stickers: 2000, sel: 500, karma: 0, karmaMax: 0, redpills: 0 };
             content = 'Votre expédition a trouvé un ancien cimetière de vaisseaux. Des ressources ont été récupérées.';
          } else if (rand > 0.4) {
             // Artifact
             const artifact = ARTIFACT_DB[Math.floor(Math.random() * ARTIFACT_DB.length)];
             content = `INCROYABLE ! L'expédition a découvert un artefact rare : ${artifact.name}.`;
             // Add artifact to user inventory
             if(currentUser) {
                 currentUser.inventory.push(artifact);
             }
          } else if (rand > 0.2) {
             content = 'L\'expédition n\'a rien trouvé d\'intéressant à part des photos de chats cosmiques.';
          } else {
             content = 'La flotte a disparu dans la faille 410. Aucun survivant.';
             // Fleet lost, don't return
             setReports(prev => [...prev, { ...newReport, type: 'expedition', title: 'Trou Noir', content }]);
             return;
          }
          
          newReport = { ...newReport, type: 'expedition', title: 'Rapport d\'Expédition', content, loot };
          returnFleet(m, loot);
      }
      else if (m.type === 'spy') {
           const spyLevel = research.find(r => r.id === 'espionnage')?.level || 0;
           const talentSpy = currentUser?.talents.find(t => t.id === 't_spy_tech')?.currentLevel || 0;
           
           const enemySpy = 3; // Mock enemy spy level
           const diff = (spyLevel + talentSpy) - enemySpy;
           
           let content = `Rapport du secteur ${m.target}.\n`;
           content += `Niveau Espionnage: ${spyLevel + talentSpy} vs ${enemySpy}\n-------------------\n`;

           if (diff < 0) content += "Signal brouillé. La flotte a été détectée et détruite.";
           else {
               content += "Ressources: [Ris: 12 400] [Sti: 5 000] [Sel: 1 200]\n";
               
               if (diff >= 2) {
                   content += "\nFLOTTE:\n- Chasseur Léger: 50\n- Croiseur: 12\n";
               } else {
                   content += "\nFlotte: Données insuffisantes.\n";
               }

               if (diff >= 3) {
                   content += "\nDÉFENSE:\n- Lanceur de PLS: 100\n- Laser GneuGneu: 20\n";
               } else {
                   content += "\nDéfense: Données insuffisantes.\n";
               }

               if (diff >= 5) {
                   content += "\nBÂTIMENTS:\n- Mine de Métal: 20\n- Usine de Golems: 5\n";
               } else {
                   content += "\nBâtiments: Données insuffisantes.\n";
               }

               if (diff >= 7) {
                   content += "\nTECHNOLOGIES:\n- Laser: 10\n- Bouclier: 8\n";
               } else {
                   content += "\nTechnologies: Données insuffisantes.\n";
               }
           }

           newReport = { ...newReport, type: 'spy', title: 'Rapport d\'espionnage', content };
           returnFleet(m);
      }
      else if (m.type === 'transport') {
           returnFleet(m);
      }

      setReports(prev => [newReport, ...prev]);
  };

  const returnFleet = (m: FleetMission, loot?: any) => {
      const returnMission: FleetMission = {
          ...m,
          id: Date.now().toString() + '_ret',
          type: 'return',
          source: m.target,
          target: m.source,
          startTime: Date.now(),
          arrivalTime: Date.now() + (m.arrivalTime - m.startTime),
          resources: loot
      };
      setMissions(prev => [...prev, returnMission]);
  };

  // --- HANDLERS (Same logic, just updating state) ---
  const handleBuild = (buildingId: string) => {
    if (constructionQueue.length >= 2 || !resources) return; 
    const b = buildings.find(x => x.id === buildingId);
    if (!b) return;

    const currentPlanet = currentUser?.planets.find(p => p.id === currentUser.currentPlanetId);
    
    // Moon Check
    if (b.isMoonOnly && !currentPlanet?.isMoon) {
        alert("Ce bâtiment ne peut être construit que sur une Lune.");
        return;
    }
    if (currentPlanet?.isMoon && !b.isMoonOnly && !['base_lunaire', 'phalange_capteur', 'porte_saut', 'usine_golems', 'silo_missiles'].includes(b.id)) {
        // Restriction for moon buildings
        // Simplified: Allow standard facilities on moon? Usually no mines.
        if (b.production) {
            alert("Impossible de construire des mines sur une Lune.");
            return;
        }
    }

    // Check Fields
    if (currentPlanet && currentPlanet.fields.current >= currentPlanet.fields.max) {
        alert("Planète pleine ! Terraformation ou Base Lunaire requise.");
        return;
    }

    // Get Robotics Factory Level for speed
    const roboticsLevel = buildings.find(b => b.id === 'usine_golems')?.level || 0;

    const inQueue = constructionQueue.find(item => item.id === buildingId);
    const levelToBuild = inQueue ? inQueue.targetLevel + 1 : b.level + 1;
    const risCost = getCost(b.baseCost.risitasium, b.costFactor, levelToBuild - 1);
    const stiCost = getCost(b.baseCost.stickers, b.costFactor, levelToBuild - 1);
    const selCost = getCost(b.baseCost.sel, b.costFactor, levelToBuild - 1);
    
    const time = getConstructionTime(b.baseTime || 60, b.timeFactor || 1.5, levelToBuild, roboticsLevel);

    if (resources.risitasium >= risCost && resources.stickers >= stiCost && resources.sel >= selCost) {
      setResources(prev => prev ? ({ ...prev, risitasium: prev.risitasium - risCost, stickers: prev.stickers - stiCost, sel: prev.sel - selCost }) : null);

      const newItem: ConstructionItem = {
          id: buildingId,
          type: 'building',
          startTime: 0,
          endTime: 0,
          totalDuration: time,
          targetLevel: levelToBuild
      };
      if (constructionQueue.length === 0) {
          newItem.startTime = Date.now();
          newItem.endTime = Date.now() + (time * 1000);
      }
      setConstructionQueue(prev => [...prev, newItem]);
    }
  };

  const handleResearch = (techId: string) => {
    if (constructionQueue.length >= 2 || !resources) return;
    const t = research.find(x => x.id === techId);
    if (!t) return;
    
    const roboticsLevel = buildings.find(b => b.id === 'laboratoire_recherche')?.level || 0;

    const inQueue = constructionQueue.find(item => item.id === techId);
    const levelToBuild = inQueue ? inQueue.targetLevel + 1 : t.level + 1;
    const risCost = getCost(t.baseCost.risitasium, t.costFactor, levelToBuild - 1);
    const stiCost = getCost(t.baseCost.stickers, t.costFactor, levelToBuild - 1);
    const selCost = getCost(t.baseCost.sel, t.costFactor, levelToBuild - 1);
    
    const time = getConstructionTime(t.baseTime || 100, t.timeFactor || 1.5, levelToBuild, roboticsLevel); 

    if (resources.risitasium >= risCost && resources.stickers >= stiCost && resources.sel >= selCost) {
      setResources(prev => prev ? ({ ...prev, risitasium: prev.risitasium - risCost, stickers: prev.stickers - stiCost, sel: prev.sel - selCost }) : null);
      const newItem: ConstructionItem = {
        id: techId,
        type: 'research',
        startTime: 0,
        endTime: 0,
        totalDuration: time,
        targetLevel: levelToBuild
      };
      if (constructionQueue.length === 0) {
          newItem.startTime = Date.now();
          newItem.endTime = Date.now() + (time * 1000);
      }
      setConstructionQueue(prev => [...prev, newItem]);
    }
  };

  const handleUnitBuild = (db: Ship[] | Defense[], setDb: any, id: string, count: number) => {
    const s = db.find(x => x.id === id);
    if (!s || count <= 0 || !resources) return;
    const totalRis = s.baseCost.risitasium * count;
    const totalSti = s.baseCost.stickers * count;
    const totalSel = s.baseCost.sel * count;

    if (resources.risitasium >= totalRis && resources.stickers >= totalSti && resources.sel >= totalSel) {
        setResources(prev => prev ? ({ ...prev, risitasium: prev.risitasium - totalRis, stickers: prev.stickers - totalSti, sel: prev.sel - totalSel }) : null);
        setDb((prev: any) => prev.map((unit: any) => unit.id === id ? { ...unit, count: unit.count + count } : unit));
    }
  };

  const handleRecruit = (id: string) => {
      const off = officers.find(o => o.id === id);
      if(!off || off.active || !resources || resources.redpills < off.cost) return;
      setResources(prev => prev ? ({...prev, redpills: prev.redpills - off.cost}) : null);
      setOfficers(prev => prev.map(o => o.id === id ? {...o, active: true} : o));
  };

  const handleSendMission = (missionData: any) => {
      const shipsToRemove = missionData.fleet;
      const fuelCost = Math.abs(missionData.resources.sel || 0);
      
      setResources(prev => {
          if (!prev) return null;
          return { ...prev, sel: prev.sel - fuelCost };
      });

      setFleet(prev => prev.map(s => ({ ...s, count: s.count - (shipsToRemove[s.id] || 0) })));
      
      const cleanMission = { ...missionData, resources: { risitasium: 0, stickers: 0, sel: 0 }, id: Date.now().toString(), source: currentUser?.currentPlanetId || 'Colonie' };
      
      setMissions(prev => [...prev, cleanMission]);
      setTab('overview');
  };

  const handleTrade = (cost: Partial<Resources>, gain: Partial<Resources>) => {
      setResources(prev => {
          if (!prev) return null;
          return {
              ...prev,
              risitasium: prev.risitasium - (cost.risitasium || 0) + (gain.risitasium || 0),
              stickers: prev.stickers - (cost.stickers || 0) + (gain.stickers || 0),
              sel: prev.sel - (cost.sel || 0) + (gain.sel || 0),
          };
      });
  };

  const handleRenamePlanet = (name: string) => {
      if(currentUser) {
          const updatedPlanets = currentUser.planets.map(p => p.id === currentUser.currentPlanetId ? {...p, name} : p);
          const updatedUser = { ...currentUser, planets: updatedPlanets }; 
          setCurrentUser(updatedUser);
          api.saveGameState(updatedUser);
      }
  };

  const handleNavigate = (targetTab: string, params: any) => {
      setFleetParams(params);
      setTab(targetTab);
  };

  const handleReadMessage = (id: string) => {
      setReports(prev => prev.map(r => r.id === id ? {...r, read: true} : r));
  };

  const handleUpdatePercent = (id: string, percent: number) => {
      setBuildings(prev => prev.map(b => b.id === id ? { ...b, percentage: percent } : b));
  };

  const handleLogout = () => {
      syncToBackend();
      api.logout();
      setCurrentUser(null);
  };

  // --- RENDER ---
  if (loadingAuth) return <div className="min-h-screen bg-black flex items-center justify-center text-tech-gold animate-pulse">CHARGEMENT DU LIEN NEURAL...</div>;
  if (!currentUser || !resources) return <AuthView onLogin={handleLogin} />;
  
  const renderContent = () => {
    if (detailBuilding) {
      const currentB = buildings.find(b => b.id === detailBuilding.id) || detailBuilding;
      const roboticsLevel = buildings.find(b => b.id === 'usine_golems')?.level || 0;
      return <BuildingDetail building={currentB} onBack={() => setDetailBuilding(null)} currentResources={resources} roboticsLevel={roboticsLevel} />;
    }

    switch(tab) {
      case 'overview': return <Overview resources={resources} planetName={currentUser.planets.find(p => p.id === currentUser.currentPlanetId)?.name || 'Colonie'} onRename={handleRenamePlanet} user={currentUser} />;
      case 'buildings': return <Buildings buildings={buildings} resources={resources} onBuild={handleBuild} onShowDetail={setDetailBuilding} />;
      case 'techtree': return <TechTreeView buildings={buildings} research={research} fleet={fleet} />;
      case 'resources': return <ResourceSettingsView buildings={buildings} resources={resources} user={currentUser} onUpdatePercent={handleUpdatePercent} />;
      case 'research': return <ResearchView research={research} buildings={buildings} resources={resources} onResearch={handleResearch} />;
      case 'shipyard': return <ShipyardView fleet={fleet} buildings={buildings} research={research} resources={resources} onBuild={(id, c) => handleUnitBuild(fleet, setFleet, id, c)} user={currentUser}/>;
      case 'defense': return <DefenseView defenses={defenses} buildings={buildings} research={research} resources={resources} onBuild={(id, c) => handleUnitBuild(defenses, setDefenses, id, c)} />;
      case 'fleet': return <FleetView fleet={fleet} missions={missions} onSendMission={handleSendMission} initialTarget={fleetParams?.target} initialMission={fleetParams?.mission} resources={resources} />;
      case 'officers': return <OfficerClubView officers={officers} resources={resources} onRecruit={handleRecruit} />;
      case 'merchant': return <MarketView resources={resources} onTrade={handleTrade} user={currentUser} />; 
      case 'highscore': return <HighscoreView />;
      case 'alliance': return <AllianceView />;
      case 'commander': return <CommanderView user={currentUser} />; // NEW
      case 'admin': return currentUser.isAdmin ? <AdminView /> : <UnderConstruction title="ACCÈS REFUSÉ" />;
      case 'simulator': return <SimulatorView />;
      case 'messages': return <MessagesView reports={reports} onRead={handleReadMessage} />;
      case 'galaxy': return <GalaxyView onNavigate={handleNavigate} user={currentUser} />;
      case 'help': return <HelpView />;
      default: return <UnderConstruction title="SECTEUR INCONNU" />;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-tech-gold selection:text-black pb-20 md:pb-0">
      <Header resources={resources} />
      
      <Sidebar 
        activeTab={tab} 
        setTab={(t: string) => { setTab(t); setDetailBuilding(null); }} 
        isMobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        buildings={buildings}
        queue={constructionQueue}
        user={currentUser}
        onPlanetChange={handlePlanetChange}
      />

      <div className="fixed top-4 right-4 z-[60] flex gap-2">
         {/* Skin Selector */}
         <select 
            value={currentUser.theme || 'default'} 
            onChange={(e) => {
                const u = {...currentUser, theme: e.target.value as any};
                setCurrentUser(u);
                api.saveGameState(u);
            }}
            className="bg-slate-900 text-slate-400 border border-slate-700 text-xs rounded px-2 outline-none"
         >
             <option value="default">Theme: Default</option>
             <option value="retro">Theme: Retro 8-Bit</option>
             <option value="neon">Theme: Cyberpunk Neon</option>
         </select>

         <button onClick={handleLogout} className="bg-red-900/50 text-red-500 border border-red-800 px-3 py-1 text-xs uppercase rounded hover:bg-red-800 hover:text-white transition-colors">Déconnexion</button>
      </div>

      <main className={`
        pt-24 px-4 md:px-8 pb-8 transition-all duration-300
        md:ml-72 min-h-screen
      `}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* WIDGETS */}
      <TutorialWidget user={currentUser} onClaim={handleClaimQuest} />
      <ChatWidget user={currentUser} />
    </div>
  );
};

export default App;
