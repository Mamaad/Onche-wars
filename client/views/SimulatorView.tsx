
import React, { useState } from 'react';
import { LucideSwords } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { SHIP_DB, DEFENSE_DB } from '../constants';
import { calculateCombat, formatNumber } from '../utils';

export const SimulatorView = () => {
  const [attackers, setAttackers] = useState<{[id: string]: number}>({});
  const [defenders, setDefenders] = useState<{[id: string]: number}>({});
  const [defenses, setDefenses] = useState<{[id: string]: number}>({});
  const [result, setResult] = useState<any>(null);

  const handleSimulate = () => {
      // Build fleets from inputs
      const attFleet = SHIP_DB.map(s => ({...s, count: attackers[s.id] || 0}));
      const defFleet = SHIP_DB.map(s => ({...s, count: defenders[s.id] || 0}));
      const defDef = DEFENSE_DB.map(d => ({...d, count: defenses[d.id] || 0}));

      const res = calculateCombat(attFleet, defFleet, defDef);
      setResult(res);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">SIMULATEUR DE COMBAT</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TechCard className="p-4 bg-red-900/10 border-red-900/50">
            <h3 className="font-display font-bold text-red-400 mb-4">ATTAQUANT</h3>
            {SHIP_DB.map(s => (
                <div key={s.id} className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">{s.name}</span>
                    <input type="number" className="w-16 bg-black border border-slate-700 text-right text-white" 
                        onChange={e => setAttackers({...attackers, [s.id]: parseInt(e.target.value)})}
                    />
                </div>
            ))}
        </TechCard>

        <TechCard className="p-4 bg-blue-900/10 border-blue-900/50">
            <h3 className="font-display font-bold text-blue-400 mb-4">DÉFENSEUR</h3>
            {SHIP_DB.map(s => (
                <div key={s.id} className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">{s.name}</span>
                    <input type="number" className="w-16 bg-black border border-slate-700 text-right text-white"
                        onChange={e => setDefenders({...defenders, [s.id]: parseInt(e.target.value)})}
                    />
                </div>
            ))}
            <div className="border-t border-slate-700 my-4"></div>
            {DEFENSE_DB.map(d => (
                <div key={d.id} className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">{d.name}</span>
                    <input type="number" className="w-16 bg-black border border-slate-700 text-right text-white"
                        onChange={e => setDefenses({...defenses, [d.id]: parseInt(e.target.value)})}
                    />
                </div>
            ))}
        </TechCard>
      </div>

      <div className="text-center">
        <TechButton onClick={handleSimulate} className="w-full md:w-1/3 py-4 text-lg">
            <LucideSwords className="inline mr-2"/> LANCER SIMULATION
        </TechButton>
      </div>

      {result && (
          <TechCard className="p-6 text-center">
              <h3 className="text-2xl font-display font-bold mb-4">
                  RÉSULTAT: <span className={result.winner === 'attacker' ? 'text-red-500' : 'text-blue-500'}>
                      {result.winner === 'attacker' ? 'VICTOIRE ATTAQUANT' : 'VICTOIRE DÉFENSEUR'}
                  </span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-mono">
                  <div className="bg-red-900/20 p-4 rounded">
                      <div className="text-slate-400 text-xs uppercase">Coque Restante (Att)</div>
                      <div className="text-xl font-bold">{formatNumber(result.attackerRemaining)}</div>
                  </div>
                  <div className="bg-blue-900/20 p-4 rounded">
                      <div className="text-slate-400 text-xs uppercase">Coque Restante (Def)</div>
                      <div className="text-xl font-bold">{formatNumber(result.defenderRemaining)}</div>
                  </div>
              </div>
          </TechCard>
      )}
    </div>
  );
};
