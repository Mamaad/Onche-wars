
import React, { useState } from 'react';
import { LucideShield, LucideCrosshair, LucideBox, LucideLock } from 'lucide-react';
import { Defense, Resources, Building, Research } from '../types';
import { formatNumber, formatTime } from '../utils';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const DefenseView = ({ defenses, buildings, research, resources, onBuild }: { defenses: Defense[], buildings: Building[], research: Research[], resources: Resources, onBuild: (id: string, count: number) => void }) => {
  const [counts, setCounts] = useState<{[key: string]: string}>({});

  const updateCount = (id: string, val: string) => {
      setCounts(prev => ({...prev, [id]: val}));
  };

  const shipyardLevel = buildings.find(b => b.id === 'chantier_spatial')?.level || 0;

  if (shipyardLevel === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 border border-dashed border-red-900/50 bg-black/40 rounded-xl">
              <LucideLock size={64} className="text-red-500 mb-4 opacity-50"/>
              <h2 className="text-2xl font-display font-bold text-white mb-2">CHANTIER SPATIAL REQUIS</h2>
              <p className="text-slate-400 font-mono">Construisez un Chantier Spatial pour ériger vos défenses.</p>
          </div>
      )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">DÉFENSE PLANÉTAIRE</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Systèmes de protection contre les raids ennemis.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {defenses.map((d: Defense) => {
          const countToBuild = parseInt(counts[d.id] || "0") || 0;
          
          const unitRisCost = d.baseCost.risitasium;
          const unitStiCost = d.baseCost.stickers;
          const unitSelCost = d.baseCost.sel;
          
          const totalRis = unitRisCost * Math.max(1, countToBuild);
          const totalSti = unitStiCost * Math.max(1, countToBuild);
          const totalSel = unitSelCost * Math.max(1, countToBuild);

          // Temps de base / (Niveau Chantier + 1)
          const unitTime = (unitRisCost + unitStiCost) / (50 * (shipyardLevel + 1)); 

          const canAffordOne = 
            resources.risitasium >= unitRisCost && 
            resources.stickers >= unitStiCost &&
            resources.sel >= unitSelCost;
          
          const canAffordTotal = 
             resources.risitasium >= totalRis &&
             resources.stickers >= totalSti &&
             resources.sel >= totalSel;

          // Check Requirements
          const reqsMet = d.reqs ? Object.entries(d.reqs).every(([reqId, reqLvl]) => {
              const b = buildings.find(x => x.id === reqId);
              if (b && b.level >= reqLvl) return true;
              const r = research.find(x => x.id === reqId);
              if (r && r.level >= reqLvl) return true;
              return false;
          }) : true;

          if (!reqsMet) return null;

          return (
            <TechCard key={d.id} className="p-1 flex flex-col sm:flex-row h-full transition-all hover:border-slate-600">
              <div 
                className="relative w-full sm:w-40 h-40 sm:h-auto bg-black shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-800"
              >
                {d.image ? (
                  <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-300" />
                ) : (
                   <LucideShield className="text-slate-500 relative z-10" size={40}/>
                )}
                
                <div className="absolute top-2 left-2 z-20">
                   <div className="bg-black/80 border border-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-md backdrop-blur-sm">
                     UNITÉS: {d.count}
                   </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide">
                    {d.name}
                  </h3>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1" title="Attaque"><LucideCrosshair size={12}/> {formatNumber(d.stats.attack)}</span>
                    <span className="flex items-center gap-1" title="Bouclier"><LucideShield size={12}/> {formatNumber(d.stats.defense)}</span>
                    <span className="flex items-center gap-1" title="Coque"><LucideBox size={12}/> {formatNumber(d.stats.hull)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 font-mono line-clamp-2">{d.description}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 p-2 rounded border border-slate-800/50">
                    <div className={`${resources.risitasium < unitRisCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Ris: <span className="text-slate-200">{formatNumber(unitRisCost)}</span>
                    </div>
                    <div className={`${resources.stickers < unitStiCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Sti: <span className="text-yellow-100">{formatNumber(unitStiCost)}</span>
                    </div>
                    <div className={`${resources.sel < unitSelCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Sel: <span className="text-blue-100">{formatNumber(unitSelCost)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                        type="number" 
                        min="1" 
                        placeholder="Qté"
                        value={counts[d.id] || ""}
                        onChange={(e) => updateCount(d.id, e.target.value)}
                        className="w-20 bg-black/50 border border-slate-700 text-white px-2 py-1.5 text-sm font-mono focus:border-tech-blue focus:outline-none"
                    />
                    <TechButton 
                      onClick={() => {
                          onBuild(d.id, countToBuild);
                          updateCount(d.id, "");
                      }}
                      disabled={!canAffordTotal || countToBuild <= 0}
                      className="flex-1 text-xs py-1.5"
                    >
                       {countToBuild > 0 ? `CONSTRUIRE (${formatTime(unitTime * countToBuild)})` : 'CONSTRUIRE'}
                    </TechButton>
                  </div>
                </div>
              </div>
            </TechCard>
          );
        })}
      </div>
    </div>
  );
};
