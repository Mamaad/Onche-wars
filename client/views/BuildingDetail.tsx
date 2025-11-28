
import React from 'react';
import { LucideArrowLeft, LucideZap, LucidePickaxe, LucideActivity } from 'lucide-react';
import { Building, Resources } from '../types';
import { getCost, getConstructionTime, getProduction, getConsumption, formatNumber, formatTime, getStorageCapacity } from '../utils';
import { TechCard } from '../components/TechCard';

export const BuildingDetail = ({ building, onBack, currentResources, roboticsLevel }: { building: Building, onBack: () => void, currentResources: Resources, roboticsLevel: number }) => {
  const levels = [];
  const isResourceProducer = building.energyType === 'consumer' && building.production;
  const isStorage = building.id.startsWith('hangar_') || building.id === 'reservoir_sel';
  const hasProduction = building.production || isStorage;
  const hasConsumption = building.consumption;

  for (let i = 1; i <= 10; i++) {
    const lvl = building.level + i;
    const risCost = getCost(building.baseCost.risitasium, building.costFactor, lvl);
    const stiCost = getCost(building.baseCost.stickers, building.costFactor, lvl);
    
    // New Time Calculation
    const time = getConstructionTime(building.baseTime || 60, building.timeFactor || 1.5, lvl, roboticsLevel);
    
    let prod = 0;
    let prodLabel = "";

    if (building.production) {
      prod = getProduction(building.production.base, building.production.factor, lvl, building.production.type);
      prodLabel = building.production.type === 'karma' ? 'Prod. Énergie' : 'Rendement / h';
    }
    
    if (isStorage) {
        prod = getStorageCapacity(lvl);
        prodLabel = 'Capacité Max';
    }

    let cons = 0;
    if (building.consumption) cons = getConsumption(building.consumption.base, building.consumption.factor, lvl);
    
    levels.push({ lvl, prod, cons, time, prodLabel });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-tech-blue hover:text-white mb-4 transition-colors font-display text-sm uppercase tracking-wide">
        <LucideArrowLeft size={16} /> Retour Commandement
      </button>

      <TechCard className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-40 h-40 bg-black rounded-lg shrink-0 flex items-center justify-center border-2 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative group overflow-hidden">
             {building.image ? (
                <img src={building.image} alt={building.name} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
                <>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shine_3s_infinite]"></div>
                  {building.energyType === 'producer' 
                      ? <LucideZap className="text-tech-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" size={64}/> 
                      : <LucidePickaxe className="text-tech-blue drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]" size={64}/>}
                </>
             )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-display font-bold text-white uppercase">{building.name}</h2>
            <span className="bg-tech-blue/20 text-tech-blue border border-tech-blue/50 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Niveau {building.level}</span>
          </div>
          <div className="h-1 w-20 bg-tech-gold mb-4"></div>
          <p className="text-slate-300 leading-relaxed max-w-3xl font-light text-lg">{building.longDescription}</p>
        </div>
      </TechCard>

      <TechCard>
        <div className="p-4 border-b border-slate-800 bg-black/40 flex items-center gap-2">
          <LucideActivity size={16} className="text-tech-blue"/>
          <span className="font-display font-bold text-white uppercase tracking-wider">Projections & Mises à niveau</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Niveau</th>
                {hasProduction && (
                    <th className="px-6 py-4 text-right">
                    {levels[0]?.prodLabel || 'Gain'}
                    </th>
                )}
                {hasConsumption && (
                    <th className="px-6 py-4 text-right">
                    {building.consumption?.type === 'karma' ? 'Conso. Énergie' : 'Consommation'}
                    </th>
                )}
                <th className="px-6 py-4 text-right">Temps Requis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {levels.map((row) => (
                <tr key={row.lvl} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-tech-blue">LVL {row.lvl}</td>
                  {hasProduction && (
                      <td className="px-6 py-4 text-right text-green-400 font-bold">
                        {(building.production || isStorage)
                        ? (isStorage ? formatNumber(row.prod) : `+${formatNumber(isResourceProducer ? row.prod * 3600 : row.prod)}`)
                        : <span className="text-slate-700">-</span>}
                      </td>
                  )}
                  {hasConsumption && (
                      <td className="px-6 py-4 text-right text-red-400">
                        {building.consumption ? `-${formatNumber(row.cons)}` : <span className="text-slate-700">-</span>}
                      </td>
                  )}
                  <td className="px-6 py-4 text-right text-slate-400">{formatTime(row.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TechCard>
    </div>
  );
};
