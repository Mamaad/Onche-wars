
import React, { useState, useEffect } from 'react';
import { LucideRocket, LucideCrosshair, LucideMapPin, LucideClock, LucideTruck, LucideAtom } from 'lucide-react';
import { Ship, FleetMission, Resources } from '../types';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { formatNumber, formatTime, calculateFuelConsumption } from '../utils';

export const FleetView = ({ fleet, missions, onSendMission, initialTarget, initialMission, resources }: { 
    fleet: Ship[], 
    missions: FleetMission[], 
    onSendMission: (mission: Partial<FleetMission>) => void,
    initialTarget?: {g: number, s: number, p: number},
    initialMission?: string,
    resources: Resources
}) => {
  const [selectedShips, setSelectedShips] = useState<{[id: string]: number}>({});
  const [target, setTarget] = useState({ g: 1, s: 42, p: 1 });
  const [missionType, setMissionType] = useState('attack');

  // Load params from props if available
  useEffect(() => {
      if (initialTarget) setTarget(initialTarget);
      if (initialMission) setMissionType(initialMission);
  }, [initialTarget, initialMission]);

  const handleSelectShip = (id: string, count: number) => {
    setSelectedShips(prev => ({...prev, [id]: count}));
  };

  const totalCapacity = fleet.reduce((acc, ship) => {
      const count = selectedShips[ship.id] || 0;
      return acc + (ship.stats.capacity * count);
  }, 0);

  const selectedCount = Object.values(selectedShips).reduce((a: number, b: number) => a + b, 0);

  // Calculate Distance & Fuel
  const distance = Math.abs(target.s - 42) + 5; // Mock distance logic relative to system 42
  const fuelCost = calculateFuelConsumption(selectedShips, distance);

  const handleSend = () => {
    if (resources.sel < fuelCost) {
        alert("Pas assez de Sel pour le carburant !");
        return;
    }

    onSendMission({
        type: missionType as any,
        fleet: selectedShips,
        target: `${target.g}:${target.s}:${target.p}`,
        startTime: Date.now(),
        arrivalTime: Date.now() + (distance * 1000 + 10000), 
        resources: { risitasium: 0, stickers: 0, sel: -fuelCost } // Deduct fuel via negative resource hack or handle in App
    });
    setSelectedShips({});
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">FLOTTE & RAIDS</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ship Selection */}
        <TechCard className="p-4">
            <h3 className="font-display font-bold text-tech-blue mb-4">SÉLECTION DE L'ESCADRON</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {fleet.map(ship => (
                    ship.count > 0 && (
                        <div key={ship.id} className="flex items-center justify-between bg-black/40 p-2 rounded border border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{ship.name}</span>
                                <span className="text-xs text-slate-500">(Disp: {ship.count})</span>
                            </div>
                            <input 
                                type="number" 
                                min="0" 
                                max={ship.count} 
                                value={selectedShips[ship.id] || 0}
                                onChange={(e) => handleSelectShip(ship.id, Math.min(ship.count, parseInt(e.target.value) || 0))}
                                className="w-16 bg-slate-900 border border-slate-700 text-right px-2 py-1 text-sm focus:border-tech-blue outline-none"
                            />
                        </div>
                    )
                ))}
                {fleet.every(s => s.count === 0) && <p className="text-slate-500 italic">Aucun vaisseau disponible.</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm font-mono">
                <span className="text-slate-400">Capacité Fret:</span>
                <span className="text-white font-bold">{formatNumber(totalCapacity)}</span>
            </div>
        </TechCard>

        {/* Target & Mission */}
        <TechCard className="p-4 flex flex-col gap-4">
            <h3 className="font-display font-bold text-tech-gold">DESTINATION & ORDRES</h3>
            
            <div className="flex items-center gap-2 bg-black/50 p-4 rounded border border-slate-700 justify-center">
               <LucideMapPin className="text-tech-blue"/>
               <input type="number" value={target.g} onChange={e => setTarget({...target, g: parseInt(e.target.value)})} className="w-10 bg-transparent text-center border-b border-slate-600 focus:border-tech-gold outline-none"/>
               <span>:</span>
               <input type="number" value={target.s} onChange={e => setTarget({...target, s: parseInt(e.target.value)})} className="w-12 bg-transparent text-center border-b border-slate-600 focus:border-tech-gold outline-none"/>
               <span>:</span>
               <input type="number" value={target.p} onChange={e => setTarget({...target, p: parseInt(e.target.value)})} className="w-10 bg-transparent text-center border-b border-slate-600 focus:border-tech-gold outline-none"/>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {['attack', 'transport', 'spy', 'expedition', 'recycle'].map(type => (
                    <button 
                        key={type}
                        onClick={() => setMissionType(type)}
                        className={`p-3 text-sm font-display uppercase tracking-wider border transition-all
                            ${missionType === type 
                                ? 'bg-tech-blue/20 border-tech-blue text-white' 
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500'}
                        `}
                    >
                        {type === 'attack' && 'Attaquer'}
                        {type === 'transport' && 'Transporter'}
                        {type === 'spy' && 'Espionner'}
                        {type === 'expedition' && 'Expédition 410'}
                        {type === 'recycle' && 'Recycler'}
                    </button>
                ))}
            </div>

            <div className="mt-auto space-y-2">
                <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-slate-800">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><LucideAtom size={12}/> Conso. Carburant</span>
                    <span className={`text-sm font-mono font-bold ${resources.sel >= fuelCost ? 'text-green-400' : 'text-red-500'}`}>
                        {formatNumber(fuelCost)} Sel
                    </span>
                </div>

                <TechButton 
                    onClick={handleSend} 
                    disabled={selectedCount === 0 || resources.sel < fuelCost} 
                    className="w-full py-3"
                >
                    <LucideRocket className="inline-block mr-2" size={16}/> LANCER LA FLOTTE
                </TechButton>
            </div>
        </TechCard>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <LucideClock className="text-tech-blue"/> MOUVEMENTS DE FLOTTE
        </h3>
        <div className="space-y-2">
            {missions.length === 0 && <p className="text-slate-500 italic">Aucune mission en cours.</p>}
            {missions.map(mission => {
                const isReturn = mission.type === 'return';
                const timeLeft = Math.max(0, (mission.arrivalTime - Date.now()) / 1000);
                
                return (
                    <div key={mission.id} className="flex items-center justify-between bg-slate-900/80 border border-slate-700 p-3 rounded">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${isReturn ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'}`}>
                                {isReturn ? <LucideTruck size={16}/> : <LucideCrosshair size={16}/>}
                            </div>
                            <div>
                                <div className="font-bold text-white uppercase text-sm">
                                    {isReturn ? 'Retour vers' : `${mission.type} vers`} <span className="text-tech-gold font-mono">{isReturn ? mission.source : mission.target}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    Vaisseaux: {Object.values(mission.fleet).reduce((a,b) => a+b, 0)}
                                </div>
                            </div>
                        </div>
                        <div className="font-mono text-xl text-white">
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};
