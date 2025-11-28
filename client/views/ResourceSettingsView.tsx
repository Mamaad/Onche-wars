
import React from 'react';
import { LucideZap, LucideActivity, LucidePickaxe, LucideDroplets, LucideAtom } from 'lucide-react';
import { Building, Resources, User } from '../types';
import { getProduction, getConsumption, formatNumber } from '../utils';
import { TechCard } from '../components/TechCard';

export const ResourceSettingsView = ({ 
    buildings, 
    resources, 
    user,
    onUpdatePercent 
}: { 
    buildings: Building[], 
    resources: Resources, 
    user: User,
    onUpdatePercent: (id: string, percent: number) => void 
}) => {
    const currentPlanet = user.planets.find(p => p.id === user.currentPlanetId) || user.planets[0];
    const energyBonus = user.officers.find(o => o.id === 'off_celestin' && o.active) ? 1.1 : 1.0;

    const resourceTypes = [
        { type: 'risitasium', label: 'RISITIUM', icon: <LucidePickaxe size={14} className="text-slate-300"/>, color: 'text-slate-300' },
        { type: 'stickers', label: 'STICKERS', icon: <LucideDroplets size={14} className="text-yellow-400"/>, color: 'text-yellow-400' },
        { type: 'sel', label: 'SEL', icon: <LucideAtom size={14} className="text-blue-400"/>, color: 'text-blue-400' },
        { type: 'karma', label: 'KARMA', icon: <LucideZap size={14} className="text-green-400"/>, color: 'text-green-400' },
    ];

    // Calculate Totals
    let totalEnergyProd = 0;
    let totalEnergyCons = 0;

    buildings.forEach(b => {
        if (b.level === 0) return;
        const ratio = (b.percentage || 100) / 100;
        if (b.energyType === 'producer' && b.production?.type === 'karma') {
             totalEnergyProd += getProduction(b.production.base, b.production.factor, b.level, 'karma', currentPlanet.temperature) * energyBonus * ratio;
        }
        if (b.energyType === 'consumer' && b.consumption?.type === 'karma') {
             totalEnergyCons += getConsumption(b.consumption.base, b.consumption.factor, b.level, b.percentage || 100);
        }
    });

    const energyBalance = totalEnergyProd - totalEnergyCons;
    const efficiency = energyBalance < 0 && totalEnergyProd > 0 ? Math.max(0, totalEnergyProd / totalEnergyCons) : 1;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">RÉGLAGES DE PRODUCTION</h2>
                    <p className="text-slate-500 font-mono text-sm mt-1">Optimisez le rendement de vos mines et centrales.</p>
                </div>
                <div className={`text-right font-mono ${energyBalance >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    <div className="text-xs uppercase text-slate-500">Bilan Énergétique</div>
                    <div className="text-2xl font-bold">{energyBalance >= 0 ? '+' : ''}{formatNumber(energyBalance)}</div>
                </div>
            </div>

            <TechCard className="overflow-hidden p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-xs font-display text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Bâtiment</th>
                            <th className="p-4 text-right">Prod. de base</th>
                            <th className="p-4 text-center">Rendement</th>
                            <th className="p-4 text-right">Gain / Heure</th>
                            <th className="p-4 text-right">Conso. Énergie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {buildings.map(b => {
                            if (b.level === 0 || (!b.production && !b.consumption)) return null;
                            
                            const isEnergyProducer = b.energyType === 'producer';
                            const prodType = b.production?.type || 'karma';
                            const typeInfo = resourceTypes.find(t => t.type === prodType);
                            const percentage = b.percentage || 100;

                            // Calculate Raw (Theoretical Max)
                            const rawProd = b.production ? getProduction(b.production.base, b.production.factor, b.level, prodType, currentPlanet.temperature, 100) : 0;
                            
                            // Calculate Real (With Percent & Efficiency if consumer)
                            const realProd = b.production ? getProduction(b.production.base, b.production.factor, b.level, prodType, currentPlanet.temperature, percentage) : 0;
                            
                            // Apply Efficiency for consumers (mines)
                            const effectiveProd = isEnergyProducer ? realProd : realProd * efficiency;

                            // Energy Consumption
                            const energyCons = b.consumption?.type === 'karma' 
                                ? getConsumption(b.consumption.base, b.consumption.factor, b.level, percentage) 
                                : 0;

                            return (
                                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{b.name} <span className="text-tech-blue text-xs ml-2">Lvl {b.level}</span></div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-400">
                                        {formatNumber(isEnergyProducer ? rawProd : rawProd * 3600)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 justify-center">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                step="10" 
                                                value={percentage} 
                                                onChange={(e) => onUpdatePercent(b.id, parseInt(e.target.value))}
                                                className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-tech-gold"
                                            />
                                            <span className="w-10 text-right font-mono text-white">{percentage}%</span>
                                        </div>
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold ${typeInfo?.color}`}>
                                        {b.production ? (
                                            <span className="flex items-center justify-end gap-1">
                                                {efficiency < 1 && !isEnergyProducer && <span className="text-red-500 text-xs mr-1">({Math.floor(efficiency*100)}%)</span>}
                                                +{formatNumber(isEnergyProducer ? effectiveProd : effectiveProd * 3600)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-right font-mono text-red-400">
                                        {energyCons > 0 ? `-${formatNumber(energyCons)}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </TechCard>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {resourceTypes.filter(r => r.type !== 'redpills').map(res => {
                    // Calculate total per hour for this resource
                    let hourlyTotal = 0;
                    buildings.forEach(b => {
                        if(b.level > 0 && b.production?.type === res.type) {
                            const prod = getProduction(b.production.base, b.production.factor, b.level, res.type as any, currentPlanet.temperature, b.percentage || 100);
                            if (res.type !== 'karma') hourlyTotal += prod * 3600 * efficiency;
                            else hourlyTotal += prod; // Karma displayed as static balance usually
                        }
                    });
                    
                    if (res.type === 'karma') return null; // Handled in header

                    return (
                        <TechCard key={res.type} className="p-4 flex items-center justify-between">
                            <div className={`flex items-center gap-2 font-bold ${res.color}`}>
                                {res.icon} {res.label}
                            </div>
                            <div className="text-xl font-mono text-white">
                                +{formatNumber(hourlyTotal)} <span className="text-xs text-slate-500">/ h</span>
                            </div>
                        </TechCard>
                    )
                })}
            </div>
        </div>
    );
};
