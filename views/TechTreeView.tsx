
import React from 'react';
import { LucideCheck, LucideX, LucideLock, LucideUnlock, LucideNetwork } from 'lucide-react';
import { BUILDING_DB, RESEARCH_DB, SHIP_DB } from '../constants';
import { Building, Research, Ship } from '../types';
import { TechCard } from '../components/TechCard';

export const TechTreeView = ({ buildings, research, fleet }: { buildings: Building[], research: Research[], fleet: Ship[] }) => {
  
  const getLevel = (id: string) => {
    // Check Buildings
    const building = buildings.find(b => b.id === id);
    if (building) return building.level;
    
    // Check Research
    const res = research.find(r => r.id === id);
    if (res) return res.level;

    // Ships don't act as requirements usually, but return count just in case
    return 0; 
  };

  const getEntityName = (id: string) => {
    const b = BUILDING_DB.find(x => x.id === id);
    if (b) return b.name;
    const r = RESEARCH_DB.find(x => x.id === id);
    if (r) return r.name;
    const s = SHIP_DB.find(x => x.id === id);
    if (s) return s.name;
    return id;
  };

  const TechSection = ({ title, items, type }: any) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <LucideNetwork className="text-tech-gold" size={20}/>
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item: any) => {
          let allReqsMet = true;
          
          // Conversion des requirements en tableau pour affichage
          const requirements = [];
          
          // Support Legacy (array) vs New (object)
          let reqsObj = item.reqs || {};
          // Convert legacy reqs array to object for display logic consistency if needed
          if (item.reqsArray) {
             item.reqsArray.forEach((r: string) => reqsObj[r] = 1);
          }

          if (reqsObj) {
             Object.entries(reqsObj).forEach(([reqId, reqLvl]: [string, any]) => {
                const currentLvl = getLevel(reqId);
                requirements.push({ id: reqId, reqLvl, currentLvl, met: currentLvl >= reqLvl });
                if (currentLvl < reqLvl) allReqsMet = false;
             });
          }

          const myLevel = getLevel(item.id);
          const isUnlocked = allReqsMet;
          // Ships don't have levels, they have counts. Techs/Buildings have levels.
          const isAcquired = type === 'ship' ? false : myLevel > 0;

          return (
            <TechCard key={item.id} className={`p-4 ${isUnlocked ? 'border-slate-700' : 'border-red-900/30 opacity-80'}`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className={`font-display font-bold text-lg ${isUnlocked ? (isAcquired ? 'text-tech-gold' : 'text-white') : 'text-slate-500'}`}>
                  {item.name}
                </h4>
                {isUnlocked 
                  ? <LucideUnlock size={16} className="text-green-500"/> 
                  : <LucideLock size={16} className="text-red-500"/>
                }
              </div>
              
              {requirements.length > 0 ? (
                <ul className="space-y-2">
                  {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs font-mono bg-black/40 p-1.5 rounded border border-slate-800/50">
                      <span className="text-slate-400">{getEntityName(req.id)} (Niv. {req.reqLvl})</span>
                      {req.met 
                        ? <LucideCheck size={14} className="text-green-500" />
                        : <span className="flex items-center text-red-500 gap-1"><LucideX size={14}/> <span className="text-[10px]">{req.currentLvl}/{req.reqLvl}</span></span>
                      }
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-500 italic font-mono p-2">Aucun prérequis.</div>
              )}
            </TechCard>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">ARBRE TECHNOLOGIQUE</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Base de données des prérequis pour les technologies avancées.</p>
      </div>

      <TechSection title="Bâtiments" items={BUILDING_DB} type="building" />
      <TechSection title="Recherche" items={RESEARCH_DB} type="research" />
      <TechSection title="Vaisseaux" items={SHIP_DB} type="ship" />
    </div>
  );
};
