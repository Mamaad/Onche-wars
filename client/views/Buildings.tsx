
import React from 'react';
import { LucideZap, LucidePickaxe, LucideInfo, LucideActivity } from 'lucide-react';
import { Building, Resources } from '../types';
import { getCost, getConstructionTime, formatNumber, formatTime } from '../utils';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const Buildings = ({ buildings, resources, onBuild, onShowDetail }: any) => {
  
  // Calculate Robotics Level
  const roboticsLevel = buildings.find((b: any) => b.id === 'usine_golems')?.level || 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">INFRASTRUCTURES</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Gérez le développement industriel de votre planète.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {buildings.map((b: Building) => {
          const risCost = getCost(b.baseCost.risitasium, b.costFactor, b.level);
          const stiCost = getCost(b.baseCost.stickers, b.costFactor, b.level);
          const selCost = getCost(b.baseCost.sel, b.costFactor, b.level);
          
          // New Time Calculation
          const constructionTime = getConstructionTime(b.baseTime || 60, b.timeFactor || 1.5, b.level + 1, roboticsLevel);

          const canAfford = 
            resources.risitasium >= risCost && 
            resources.stickers >= stiCost &&
            resources.sel >= selCost;

          const reqsMet = b.reqs ? Object.entries(b.reqs).every(([reqId, reqLvl]) => {
            const requiredBuilding = buildings.find((x: Building) => x.id === reqId);
            return requiredBuilding && requiredBuilding.level >= reqLvl;
          }) : true;
          
          if (!reqsMet) return null;

          return (
            <TechCard key={b.id} className="p-1 flex flex-col sm:flex-row h-full transition-all hover:border-slate-600">
              <div 
                className="relative w-full sm:w-32 h-32 sm:h-auto bg-black shrink-0 flex items-center justify-center cursor-pointer group overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-800"
                onClick={() => onShowDetail(b)}
              >
                {b.image ? (
                  <img src={b.image} alt={b.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                  </>
                )}
                
                {/* Fallback icon if no image, or overlay icon for flavor */}
                {!b.image && (
                  b.energyType === 'producer' 
                  ? <LucideZap className="text-tech-gold relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" size={40}/> 
                  : <LucidePickaxe className="text-slate-500 group-hover:text-tech-blue relative z-10 group-hover:scale-110 transition-transform duration-300" size={40}/>
                )}
                
                <div className="absolute top-2 left-2 z-20">
                   <div className="bg-black/80 border border-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-md backdrop-blur-sm">
                     LVL {b.level}
                   </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 
                    className="text-lg font-display font-bold text-white cursor-pointer hover:text-tech-gold transition-colors uppercase tracking-wide"
                    onClick={() => onShowDetail(b)}
                  >
                    {b.name}
                  </h3>
                  <button onClick={() => onShowDetail(b)} className="text-slate-600 hover:text-tech-blue"><LucideInfo size={18}/></button>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 font-mono line-clamp-2">{b.description}</p>
                
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
                       <LucideActivity size={12}/> {formatTime(constructionTime)}
                    </div>
                    <TechButton 
                      onClick={() => onBuild(b.id)}
                      disabled={!canAfford}
                      className="flex-1 text-xs py-1.5"
                    >
                      {canAfford ? 'INITIALISER LA CONSTRUCTION' : 'RESSOURCES INSUFFISANTES'}
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
