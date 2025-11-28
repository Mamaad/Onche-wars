
import React from 'react';
import { LucideAtom, LucideInfo, LucideTestTube, LucideLock } from 'lucide-react';
import { Research, Resources, Building } from '../types';
import { getCost, getConstructionTime, formatNumber, formatTime } from '../utils';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const ResearchView = ({ research, buildings, resources, onResearch }: { research: Research[], buildings: Building[], resources: Resources, onResearch: (id: string) => void }) => {
  
  // Vérifier si le labo existe
  const labLevel = buildings.find(b => b.id === 'laboratoire_recherche')?.level || 0;

  if (labLevel === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 border border-dashed border-red-900/50 bg-black/40 rounded-xl">
              <LucideLock size={64} className="text-red-500 mb-4 opacity-50"/>
              <h2 className="text-2xl font-display font-bold text-white mb-2">LABORATOIRE REQUIS</h2>
              <p className="text-slate-400 font-mono">Vous devez construire un Laboratoire de Recherche pour accéder aux technologies.</p>
          </div>
      )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CENTRE DE RECHERCHE</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Développez de nouvelles technologies pour dominer l'univers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {research.map((t: Research) => {
          const risCost = getCost(t.baseCost.risitasium, t.costFactor, t.level);
          const stiCost = getCost(t.baseCost.stickers, t.costFactor, t.level);
          const selCost = getCost(t.baseCost.sel, t.costFactor, t.level);
          
          // New Time Calculation
          const constructionTime = getConstructionTime(t.baseTime || 100, t.timeFactor || 1.5, t.level + 1, labLevel);

          const canAfford = 
            resources.risitasium >= risCost && 
            resources.stickers >= stiCost &&
            resources.sel >= selCost;
          
          // Check Requirements
          const reqsMet = t.reqs ? Object.entries(t.reqs).every(([reqId, reqLvl]) => {
              // Check building levels
              const b = buildings.find(x => x.id === reqId);
              if (b && b.level >= reqLvl) return true;
              // Check other tech levels
              const r = research.find(x => x.id === reqId);
              if (r && r.level >= reqLvl) return true;
              return false;
          }) : true;

          if (!reqsMet) return null;

          return (
            <TechCard key={t.id} className="p-1 flex flex-col sm:flex-row h-full transition-all hover:border-slate-600">
              <div 
                className="relative w-full sm:w-32 h-32 sm:h-auto bg-black shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-800"
              >
                {t.image ? (
                  <img src={t.image} alt={t.name} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-300" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                )}
                
                {!t.image && <LucideAtom className="text-tech-blue relative z-10" size={40}/>}
                
                <div className="absolute top-2 left-2 z-20">
                   <div className="bg-black/80 border border-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-md backdrop-blur-sm">
                     LVL {t.level}
                   </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide">
                    {t.name}
                  </h3>
                  <LucideInfo size={18} className="text-slate-600"/>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 font-mono line-clamp-2">{t.description}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 p-2 rounded border border-slate-800/50">
                    <div className={`${resources.risitasium < risCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Ris: <span className="text-slate-200">{formatNumber(risCost)}</span>
                    </div>
                    <div className={`${resources.stickers < stiCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Sti: <span className="text-yellow-100">{formatNumber(stiCost)}</span>
                    </div>
                    <div className={`${resources.sel < selCost ? 'text-red-500' : 'text-slate-400'}`}>
                      Sel: <span className="text-blue-100">{formatNumber(selCost)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                       <LucideTestTube size={12}/> {formatTime(constructionTime)}
                    </div>
                    <TechButton 
                      onClick={() => onResearch(t.id)}
                      disabled={!canAfford}
                      className="flex-1 text-xs py-1.5"
                      variant="secondary"
                    >
                      {canAfford ? 'LANCER RECHERCHE' : 'RESSOURCES MANQUANTES'}
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
