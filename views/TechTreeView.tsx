
import React, { useState } from 'react';
import { LucideCheck, LucideX, LucideLock, LucideUnlock, LucideNetwork, LucideArrowDown } from 'lucide-react';
import { BUILDING_DB, RESEARCH_DB, SHIP_DB } from '../constants';
import { Building, Research, Ship } from '../types';
import { TechCard } from '../components/TechCard';

export const TechTreeView = ({ buildings, research, fleet }: { buildings: Building[], research: Research[], fleet: Ship[] }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getLevel = (id: string) => {
    const building = buildings.find(b => b.id === id);
    if (building) return building.level;
    const res = research.find(r => r.id === id);
    if (res) return res.level;
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

  // Helper to detect if an item is a requirement for the hovered item OR if the hovered item is a requirement for it
  const isRelated = (itemId: string) => {
      if (!hoveredId) return false;
      if (itemId === hoveredId) return true;

      // Is itemId a requirement for hoveredId?
      const hoveredItem = [...BUILDING_DB, ...RESEARCH_DB, ...SHIP_DB].find(x => x.id === hoveredId);
      if (hoveredItem && hoveredItem.reqs && hoveredItem.reqs[itemId]) return true;

      // Is hoveredId a requirement for itemId?
      const currentItem = [...BUILDING_DB, ...RESEARCH_DB, ...SHIP_DB].find(x => x.id === itemId);
      if (currentItem && currentItem.reqs && currentItem.reqs[hoveredId]) return true;

      return false;
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
          const requirements = [];
          
          let reqsObj = item.reqs || {};
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

          const isUnlocked = allReqsMet;
          const isAcquired = type === 'ship' ? false : getLevel(item.id) > 0;
          const related = isRelated(item.id);

          return (
            <TechCard 
                key={item.id} 
                className={`p-4 transition-all duration-300 ${isUnlocked ? 'border-slate-700' : 'border-red-900/30 opacity-80'} ${related ? 'border-tech-blue shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-[1.02] bg-slate-900' : ''}`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
            >
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
                    <li key={idx} className={`flex items-center justify-between text-xs font-mono p-1.5 rounded border ${req.id === hoveredId ? 'bg-tech-blue/20 border-tech-blue' : 'bg-black/40 border-slate-800/50'}`}>
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
        <p className="text-slate-500 font-mono text-sm mt-1">Survolez un élément pour visualiser ses connexions.</p>
      </div>

      <TechSection title="Bâtiments" items={BUILDING_DB} type="building" />
      <TechSection title="Recherche" items={RESEARCH_DB} type="research" />
      <TechSection title="Vaisseaux" items={SHIP_DB} type="ship" />
    </div>
  );
};
