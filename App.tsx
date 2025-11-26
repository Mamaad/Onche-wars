
import React, { useState, useEffect, useRef } from 'react';
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Planet, DetailedCombatReport } from './types';
import { getCost, getProduction, getConsumption, getConstructionTime, calculateCombat } from './utils';
import { api } from './api';
import { SHIP_DB, DEFENSE_DB, QUEST_DB } from './constants';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

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
import { MerchantView } from './views/MerchantView';
import { HighscoreView } from './views/HighscoreView';
import { AllianceView } from './views/AllianceView';
import { AdminView } from './views/AdminView';
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

  const loadPlanetData = (user: User, planetId: string) => {
      const p = user.planets.find(x => x.id === planetId) || user.planets[0];
      if (!p) return;

      setResources(p.resources);
      setBuildings(p.buildings);
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

      // --- PRODUCTION ---
      let producedKarma = 0;
      let consumedKarma = 0;
      
      buildings.forEach(b => {
        if (b.level === 0) return;
        if (b.energyType === 'producer' && b.production?.type === 'karma') {
             producedKarma += getProduction(b.production.base, b.production.factor, b.level, 'karma', currentPlanet.temperature) * energyBonus;
        }
        if (b.energyType === 'consumer' && b.consumption?.type === 'karma') {
          consumedKarma += getConsumption(b.consumption.base, b.consumption.factor, b.level);
        }
      });
      
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
            const amount = getProduction(b.production.base, b.production.factor, b.level, b.production.type, currentPlanet.temperature) * deltaSeconds * efficiency;
            if (b.production.type === 'risitasium') newRis += amount;
            if (b.production.type === 'stickers') newSti += amount;
            if (b.production.type === 'sel') newSel += amount;
          }
        });

        return {
          ...prev,
          risitasium: newRis,
          stickers: newSti,
          sel: newSel,
          karma: newKarma,
          karmaMax: producedKarma,
          redpills: prev.redpills // Keep global
        };
      });

      // --- CONSTRUCTION QUEUE ---
      setConstructionQueue(prevQueue => {
          if (prevQueue.length === 0) return [];
          const currentItem = prevQueue[0];
          
          if (currentItem.startTime > 0 && now >= currentItem.endTime) {
              if (currentItem.type === 'building') {
                  setBuildings(bs => bs.map(b => b.id === currentItem.id ? {...b, level: currentItem.targetLevel} : b));
              } else if (currentItem.type === 'research') {
                  setResearch(rs => rs.map(r => r.id === currentItem.id ? {...r, level: currentItem.targetLevel} : r));
              }

              const nextQueue = prevQueue.slice(1);
              if (nextQueue.length > 0) {
                  const nextItem = nextQueue[0];
                  nextQueue[0] = { ...nextItem, startTime: now, endTime: now + (nextItem.totalDuration * 1000) };
              }
              // TRIGGER QUEST CHECK ON COMPLETION
              checkQuests();
              
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
  }, [currentUser, buildings, constructionQueue, missions, officers, resources]);


  // --- HELPERS ---
  
  const checkQuests = () => {
      // Create a temporary user object with current state to check condition
      const tempUser = { 
          ...currentUser!, 
          planets: currentUser!.planets.map(p => p.id === currentUser!.currentPlanetId ? {...p, buildings, fleet} : p),
          research 
      };

      const newCompleted: string[] = [];
      QUEST_DB.forEach(q => {
          if (!tempUser.completedQuests.includes(q.id) && q.condition(tempUser)) {
              newCompleted.push(q.id);
              // Give reward
              setResources(prev => {
                  if(!prev) return null;
                  return {
                      ...prev,
                      risitasium: prev.risitasium + (q.reward.risitasium || 0),
                      stickers: prev.stickers + (q.reward.stickers || 0),
                      sel: prev.sel + (q.reward.sel || 0),
                      redpills: prev.redpills + (q.reward.redpills || 0),
                  }
              });
              alert(`QUÊTE TERMINÉE : ${q.title} ! Récompense obtenue.`);
          }
      });
      
      if (newCompleted.length > 0) {
          setCurrentUser(prev => prev ? ({...prev, completedQuests: [...prev.completedQuests, ...newCompleted]}) : null);
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
             if (res.moonCreated) content += '\n\nUNE LUNE A ÉTÉ CRÉÉE !';
             
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
              // Fleet returns (or stays? simplified returns)
              returnFleet(m);
              // Force reload to see new planet
              api.getSession().then(u => { if(u) setCurrentUser(u); });
          }
      }
      else if (m.type === 'expedition') {
          const rand = Math.random();
          if (rand > 0.3) {
             const foundRes = { risitasium: 5000, stickers: 2000, sel: 500, karma: 0, karmaMax: 0, redpills: 0 };
             newReport = { ...newReport, type: 'expedition', title: 'Découverte !', content: 'Votre expédition a trouvé un ancien cimetière de vaisseaux.', loot: foundRes };
             returnFleet(m, foundRes);
          } else {
             newReport = { ...newReport, type: 'expedition', title: 'Trou Noir', content: 'La flotte a disparu dans la faille 410.' };
          }
      }
      else if (m.type === 'spy') {
           // Better Spy Report based on tech difference
           const spyLevel = research.find(r => r.id === 'espionnage')?.level || 0;
           // Assume enemy spy level 3 for demo
           const enemySpy = 3; 
           const diff = spyLevel - enemySpy;
           
           let content = `Scan du secteur ${m.target}.\n`;
           if (diff < 0) content += "Signal brouillé. Impossible d'analyser.";
           else {
               content += "Ressources: Métal: 12k, Cristal: 5k.\n";
               if (diff >= 2) content += "Flotte: 50 Chasseurs Légers détectés.\n";
               if (diff >= 3) content += "Défense: 10 Lanceurs de PLS.\n";
               if (diff >= 5) content += "Bâtiments: Mine de Metal niv 20.\n";
               if (diff >= 7) content += "Technologies: Laser niv 10.\n";
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

    // Check Fields
    const currentPlanet = currentUser?.planets.find(p => p.id === currentUser.currentPlanetId);
    if (currentPlanet && currentPlanet.fields.current >= currentPlanet.fields.max) {
        alert("Planète pleine ! Terraformation requise.");
        return;
    }

    const inQueue = constructionQueue.find(item => item.id === buildingId);
    const levelToBuild = inQueue ? inQueue.targetLevel + 1 : b.level + 1;
    const risCost = getCost(b.baseCost.risitasium, b.costFactor, levelToBuild - 1);
    const stiCost = getCost(b.baseCost.stickers, b.costFactor, levelToBuild - 1);
    const selCost = getCost(b.baseCost.sel, b.costFactor, levelToBuild - 1);
    const time = getConstructionTime(risCost, stiCost);

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
    
    const inQueue = constructionQueue.find(item => item.id === techId);
    const levelToBuild = inQueue ? inQueue.targetLevel + 1 : t.level + 1;
    const risCost = getCost(t.baseCost.risitasium, t.costFactor, levelToBuild - 1);
    const stiCost = getCost(t.baseCost.stickers, t.costFactor, levelToBuild - 1);
    const selCost = getCost(t.baseCost.sel, t.costFactor, levelToBuild - 1);
    const time = getConstructionTime(risCost, stiCost);

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
        checkQuests(); // Check fleet quests
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
      setFleet(prev => prev.map(s => ({ ...s, count: s.count - (shipsToRemove[s.id] || 0) })));
      setMissions(prev => [...prev, { ...missionData, id: Date.now().toString(), source: currentUser?.currentPlanetId || 'Colonie' }]); // Adjusted source
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
          // Update local state name for display in overview
          const updatedPlanets = currentUser.planets.map(p => p.id === currentUser.currentPlanetId ? {...p, name} : p);
          // Removed legacy planetName property to fix TS error
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

  const handleLogout = () => {
      syncToBackend();
      api.logout();
      setCurrentUser(null);
  };

  // --- RENDER ---
  if (loadingAuth) return <div className="min-h-screen bg-black flex items-center justify-center text-tech-gold animate-pulse">CHARGEMENT DU LIEN NEURAL...</div>;
  if (!currentUser || !resources) return <AuthView onLogin={handleLogin} />;
  
  // Update view props if needed
  const renderContent = () => {
    if (detailBuilding) {
      const currentB = buildings.find(b => b.id === detailBuilding.id) || detailBuilding;
      return <BuildingDetail building={currentB} onBack={() => setDetailBuilding(null)} currentResources={resources} />;
    }

    switch(tab) {
      case 'overview': return <Overview resources={resources} planetName={currentUser.planets.find(p => p.id === currentUser.currentPlanetId)?.name || 'Colonie'} onRename={handleRenamePlanet} user={currentUser} />;
      case 'buildings': return <Buildings buildings={buildings} resources={resources} onBuild={handleBuild} onShowDetail={setDetailBuilding} />;
      case 'techtree': return <TechTreeView buildings={buildings} research={research} fleet={fleet} />;
      case 'research': return <ResearchView research={research} buildings={buildings} resources={resources} onResearch={handleResearch} />;
      case 'shipyard': return <ShipyardView fleet={fleet} buildings={buildings} research={research} resources={resources} onBuild={(id, c) => handleUnitBuild(fleet, setFleet, id, c)} />;
      case 'defense': return <DefenseView defenses={defenses} buildings={buildings} research={research} resources={resources} onBuild={(id, c) => handleUnitBuild(defenses, setDefenses, id, c)} />;
      case 'fleet': return <FleetView fleet={fleet} missions={missions} onSendMission={handleSendMission} initialTarget={fleetParams?.target} initialMission={fleetParams?.mission} />;
      case 'officers': return <OfficerClubView officers={officers} resources={resources} onRecruit={handleRecruit} />;
      case 'merchant': return <MerchantView resources={resources} onTrade={handleTrade} />;
      case 'highscore': return <HighscoreView />;
      case 'alliance': return <AllianceView />;
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

      <div className="fixed top-4 right-4 z-[60]">
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
    </div>
  );
};

export default App;
