
import React, { useState } from 'react';
import { LucideRocket, LucideInfo, LucideCrosshair, LucideShield, LucideBox, LucideLock, LucideRecycle } from 'lucide-react';
import { Ship, Resources, Building, Research, User } from '../types'; // ADDED User
import { formatNumber, formatTime } from '../utils';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { api } from '../api'; // ADDED api

// Updated Props to include user
export const ShipyardView = ({ fleet, buildings, research, resources, onBuild, user }: { fleet: Ship[], buildings: Building[], research: Research[], resources: Resources, onBuild: (id: string, count: number) => void, user: User }) => {
  const [counts, setCounts] = useState<{[key: string]: string}>({});
  const [mode, setMode] = useState<'build' | 'scrap'>('build'); // NEW Mode Toggle

  const updateCount = (id: string, val: string) => {
      setCounts(prev => ({...prev, [id]: val}));
  };

  const handleScrap = async (id: string, count: number) => {
      if(count <= 0) return;
      if(confirm(`Démanteler ${count} vaisseaux ? Vous récupérerez 50% des ressources.`)) {
          const res = await api.scrapShips(user, id, count);
          if(res.success && res.resources) {
              alert(`Ferraille récupérée: ${formatNumber(res.resources.risitasium)} Ris, ${formatNumber(res.resources.stickers)} Sti, ${formatNumber(res.resources.sel)} Sel`);
              window.location.reload(); // Simple refresh
          } else {
              alert("Erreur lors du démantèlement.");
          }
      }
  };

  const shipyardLevel = buildings.find(b => b.id === 'chantier_spatial')?.level || 0;

  if (shipyardLevel === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 border border-dashed border-red-900/50 bg-black/40 rounded-xl">
              <LucideLock size={64} className="text-red-500 mb-4 opacity-50"/>
              <h2 className="text-2xl font-display font-bold text-white mb-2">CHANTIER SPATIAL REQUIS</h2>
              <p className="text-slate-400 font-mono">Construisez un Chantier Spatial pour assembler votre flotte.</p>
          </div>
      )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CHANTIER SPATIAL</h2>
            <p className="text-slate-500 font-mono text-sm mt-1">Assemblage de flotte et unités défensives.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setMode('build')} className={`px-4 py-2 text-sm font-bold uppercase rounded ${mode === 'build' ? 'bg-tech-blue text-black' : 'bg-slate-900 text-slate-400'}`}>CONSTRUCTION</button>
            <button onClick={() => setMode('scrap')} className={`px-4 py-2 text-sm font-bold uppercase rounded flex items-center gap-2 ${mode === 'scrap' ? 'bg-red-500 text-black' : 'bg-slate-900 text-slate-400'}`}><LucideRecycle size={14}/> FERRAILLEUR</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {fleet.map((s: Ship) => {
          const countToBuild = parseInt(counts[s.id] || "0") || 0;
          
          const unitRisCost = s.baseCost.risitasium;
          const unitStiCost = s.baseCost.stickers;
          const unitSelCost = s.baseCost.sel;
          
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
          const reqsMet = s.reqs ? Object.entries(s.reqs).every(([reqId, reqLvl]) => {
              const b = buildings.find(x => x.id === reqId);
              if (b && b.level >= reqLvl) return true;
              const r = research.find(x => x.id === reqId);
              if (r && r.level >= reqLvl) return true;
              return false;
          }) : true;

          if (!reqsMet) return null;

          return (
            <TechCard key={s.id} className={`p-1 flex flex-col sm:flex-row h-full transition-all hover:border-slate-600 ${mode === 'scrap' ? 'border-red-900/30' : ''}`}>
              <div 
                className="relative w-full sm:w-40 h-40 sm:h-auto bg-black shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-800"
              >
                {s.image ? (
                  <img src={s.image} alt={s.name} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mode === 'scrap' ? 'opacity-40 grayscale' : 'opacity-80'}`} />
                ) : (
                   <LucideRocket className="text-slate-500 relative z-10" size={40}/>
                )}
                
                <div className="absolute top-2 left-2 z-20">
                   <div className="bg-black/80 border border-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-md backdrop-blur-sm">
                     FLOTTE: {s.count}
                   </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide">
                    {s.name}
                  </h3>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1" title="Attaque"><LucideCrosshair size={12}/> {formatNumber(s.stats.attack)}</span>
                    <span className="flex items-center gap-1" title="Défense"><LucideShield size={12}/> {formatNumber(s.stats.defense)}</span>
                    <span className="flex items-center gap-1" title="Fret"><LucideBox size={12}/> {formatNumber(s.stats.capacity)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 font-mono line-clamp-2">{s.description}</p>
                
                <div className="mt-auto space-y-3">
                  {mode === 'build' ? (
                      <>
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
                            value={counts[s.id] || ""}
                            onChange={(e) => updateCount(s.id, e.target.value)}
                            className="w-20 bg-black/50 border border-slate-700 text-white px-2 py-1.5 text-sm font-mono focus:border-tech-blue focus:outline-none"
                        />
                        <TechButton 
                          onClick={() => {
                              onBuild(s.id, countToBuild);
                              updateCount(s.id, "");
                          }}
                          disabled={!canAffordTotal || countToBuild <= 0}
                          className="flex-1 text-xs py-1.5"
                        >
                           {countToBuild > 0 ? `CONSTRUIRE (${formatTime(unitTime * countToBuild)})` : 'CONSTRUIRE'}
                        </TechButton>
                      </div>
                      </>
                  ) : (
                      <div className="flex items-center gap-3 bg-red-900/10 p-2 rounded border border-red-900/30">
                          <input 
                            type="number" 
                            min="1" 
                            max={s.count}
                            placeholder="Qté"
                            value={counts[s.id] || ""}
                            onChange={(e) => updateCount(s.id, e.target.value)}
                            className="w-20 bg-black/50 border border-red-900 text-white px-2 py-1.5 text-sm font-mono focus:border-red-500 outline-none"
                        />
                        <TechButton 
                          onClick={() => handleScrap(s.id, countToBuild)}
                          disabled={countToBuild <= 0 || countToBuild > s.count}
                          className="flex-1 text-xs py-1.5"
                          variant="danger"
                        >
                           DÉMANTELER
                        </TechButton>
                      </div>
                  )}
                </div>
              </div>
            </TechCard>
          );
        })}
      </div>
    </div>
  );
};
