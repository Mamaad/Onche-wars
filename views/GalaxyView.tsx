
import React, { useState, useMemo, useEffect } from 'react';
import { LucideGlobe, LucideChevronLeft, LucideChevronRight, LucidePickaxe, LucideEye, LucideMail, LucideCrosshair, LucideFlag, LucideRadar, LucideBomb } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { api, getGalaxyDB } from '../api';
import { User, FleetMission } from '../types';

// Add user prop
export const GalaxyView = ({ onNavigate, user }: { onNavigate: (tab: string, params: any) => void, user: User }) => {
  const [coords, setCoords] = useState({ g: 1, s: 42 });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [debrisData, setDebrisData] = useState<any>({});
  
  // Phalanx/Missile State
  const [phalanxResult, setPhalanxResult] = useState<FleetMission[] | null>(null);
  const [missileMode, setMissileMode] = useState(false);
  const [missileAmount, setMissileAmount] = useState(1);
  const [primaryTarget, setPrimaryTarget] = useState('lanceur_pls');

  useEffect(() => {
      setDebrisData(getGalaxyDB());
  }, [coords]);
  
  const changeSystem = (delta: number) => {
    setCoords(prev => ({ ...prev, s: Math.max(1, Math.min(499, prev.s + delta)) }));
  };

  const systemData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const pos = i + 1;
      const seed = coords.g * 1000 + coords.s * 100 + pos;
      const isColonized = (seed * 9301 + 49297) % 100 < 40; 
      const coordKey = `${coords.g}:${coords.s}:${pos}`;
      const debris = debrisData[coordKey]?.debris;
      const hasDebris = debris && (debris.risitasium > 0 || debris.stickers > 0);

      if (!isColonized) return { pos, colonized: false, debris, hasDebris, coords: { g: coords.g, s: coords.s, p: pos } };

      return {
        pos,
        colonized: true,
        image: `p${(pos % 5) + 1}`,
        name: (pos === 6 && coords.s === 42) ? 'Planète Mère' : `Colonie ${pos}`,
        player: (pos === 6 && coords.s === 42) ? 'Commandant' : `Khey_${(seed * 7) % 1000}`,
        alliance: (seed % 6 === 0) ? "NOEL" : (seed % 4 === 0) ? "YKK" : "",
        rank: (seed % 500) + 1,
        status: (seed % 25 === 0) ? 'i' : (seed % 60 === 0) ? 'v' : '',
        debris,
        hasDebris,
        moon: (seed % 15 === 0),
        coords: { g: coords.g, s: coords.s, p: pos }
      };
    });
  }, [coords, debrisData]);

  const handleAction = async (type: string, targetData: any) => {
      if (type === 'attack') {
          const check = await api.canAttack(user, `${targetData.coords.g}:${targetData.coords.s}:${targetData.coords.p}`);
          if (!check.allowed) {
              alert(check.reason);
              return;
          }
      }
      onNavigate('fleet', { target: targetData.coords, mission: type });
      setSelectedEntity(null);
  };
  
  const handlePhalanx = async (targetCoords: any) => {
      const res = await api.scanPhalanx(user, `${targetCoords.g}:${targetCoords.s}:${targetCoords.p}`);
      if (res.success && res.missions) {
          setPhalanxResult(res.missions);
      } else {
          alert(res.error);
      }
  };

  const handleMissileAttack = async () => {
      if (!selectedEntity) return;
      const res = await api.fireMissiles(user, `${selectedEntity.coords.g}:${selectedEntity.coords.s}:${selectedEntity.coords.p}`, missileAmount, primaryTarget);
      if (res.success) {
          alert(res.report);
          setMissileMode(false);
          setSelectedEntity(null);
      } else {
          alert(res.error);
      }
  };

  return (
    <div className="animate-fade-in text-sm space-y-4 relative">
      <TechCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-display font-bold text-white tracking-widest flex items-center gap-2">
          <LucideGlobe className="text-tech-blue" /> SYSTÈME SOLAIRE
        </h2>
        
        <div className="flex items-center gap-2 bg-black/50 p-2 rounded border border-slate-700">
           <button onClick={() => changeSystem(-1)} className="p-2 hover:text-tech-gold transition-colors"><LucideChevronLeft/></button>
           <div className="flex items-center gap-2 px-4 font-mono text-lg text-tech-blue">
             <span className="text-slate-500 text-xs uppercase">Gal</span>
             <input type="number" min="1" max="9" value={coords.g} onChange={(e) => setCoords({...coords, g: parseInt(e.target.value)})} className="bg-transparent w-8 text-center text-white focus:outline-none border-b border-slate-700 focus:border-tech-blue"/>
             <span className="text-slate-600">:</span>
             <span className="text-slate-500 text-xs uppercase">Sys</span>
             <input type="number" min="1" max="499" value={coords.s} onChange={(e) => setCoords({...coords, s: parseInt(e.target.value)})} className="bg-transparent w-12 text-center text-white focus:outline-none border-b border-slate-700 focus:border-tech-blue"/>
           </div>
           <button onClick={() => changeSystem(1)} className="p-2 hover:text-tech-gold transition-colors"><LucideChevronRight/></button>
        </div>
      </TechCard>

      <div className="border border-slate-800 rounded bg-slate-900/50 backdrop-blur overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-black/80 text-xs font-display text-tech-blue uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-4 w-16 text-center">Pos</th>
              <th className="px-4 py-4 w-16">Scan</th>
              <th className="px-4 py-4">Astre</th>
              <th className="px-4 py-4 text-center">Lune</th>
              <th className="px-4 py-4 text-center">Débris</th>
              <th className="px-4 py-4">Joueur</th>
              <th className="px-4 py-4">Alliance</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {systemData.map((planet) => (
              <tr key={planet.pos} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-3 text-center font-mono text-slate-500 group-hover:text-white">{planet.pos}</td>
                
                {planet.colonized ? (
                  <>
                    <td className="px-4 py-2">
                      <div 
                        onClick={() => setSelectedEntity(planet)}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-black border border-slate-600 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-[10px] font-mono relative overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      >
                         <div className={`absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]`}></div>
                         P{planet.pos}
                      </div>
                    </td>
                    <td className="px-4 font-bold text-slate-200 group-hover:text-tech-gold transition-colors cursor-pointer" onClick={() => setSelectedEntity(planet)}>
                        {planet.name}
                    </td>
                    <td className="px-4 text-center">
                      {planet.moon && <div className="w-3 h-3 bg-slate-400 rounded-full mx-auto shadow-[0_0_5px_rgba(255,255,255,0.3)]" title="Lune présente"></div>}
                    </td>
                    <td className="px-4 text-center">
                      {planet.hasDebris && (
                        <div 
                            onClick={() => handleAction('recycle', planet)}
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-900/20 text-green-500 border border-green-900/50 cursor-pointer hover:bg-green-900/40 hover:scale-110 transition-transform relative group/debris" 
                        >
                          <LucidePickaxe size={12}/>
                          <div className="absolute bottom-full mb-1 hidden group-hover/debris:block bg-black border border-slate-700 p-1 text-[10px] whitespace-nowrap z-50">
                              M: {planet.debris.risitasium} | C: {planet.debris.stickers}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4">
                      <div 
                        className={`font-medium cursor-pointer hover:underline ${planet.player === 'Commandant' ? 'text-green-400' : 'text-blue-300'}`}
                        onClick={() => setSelectedEntity(planet)}
                      >
                        {planet.player}
                        {planet.status && <span className={`ml-2 text-[10px] uppercase px-1 rounded border ${planet.status === 'i' ? 'border-slate-600 text-slate-500' : 'border-blue-600 text-blue-500'}`}>{planet.status}</span>}
                        {planet.rank < 500 && <span className="ml-2 text-xs text-yellow-600" title="Top 500">★</span>}
                      </div>
                    </td>
                    <td className="px-4 text-slate-400 font-mono text-xs">
                      {planet.alliance && <span className="cursor-pointer hover:text-white">[{planet.alliance}]</span>}
                    </td>
                    <td className="px-4 text-right">
                      {planet.player !== 'Commandant' && (
                        <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleAction('spy', planet)} className="p-1.5 hover:bg-tech-blue hover:text-black rounded text-tech-blue border border-tech-blue/30 transition-all" title="Espionner"><LucideEye size={14}/></button>
                          <button onClick={() => handleAction('attack', planet)} className="p-1.5 hover:bg-red-500 hover:text-black rounded text-red-500 border border-red-500/30 transition-all" title="Attaquer"><LucideCrosshair size={14}/></button>
                          <button className="p-1.5 hover:bg-slate-200 hover:text-black rounded text-slate-400 border border-slate-600 transition-all" title="Message"><LucideMail size={14}/></button>
                        </div>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                      <td className="px-4 py-2" colSpan={3}>
                           <div className="flex items-center gap-2 text-slate-700 italic text-xs font-mono uppercase tracking-widest">
                               -- Secteur Vide --
                           </div>
                      </td>
                      <td className="px-4 text-center">
                          {planet.hasDebris && (
                            <div 
                                onClick={() => handleAction('recycle', planet)}
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-900/20 text-green-500 border border-green-900/50 cursor-pointer hover:bg-green-900/40" 
                            >
                              <LucidePickaxe size={12}/>
                            </div>
                          )}
                      </td>
                      <td className="px-4"></td>
                      <td className="px-4"></td>
                      <td className="px-4 text-right">
                          <button onClick={() => handleAction('colonize', planet)} className="p-1.5 hover:bg-green-500 hover:text-black rounded text-slate-600 hover:text-slate-900 border border-slate-800 transition-all opacity-0 group-hover:opacity-100" title="Coloniser"><LucideFlag size={14}/></button>
                      </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* PHALANX RESULTS MODAL */}
      {phalanxResult && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <TechCard className="w-full max-w-2xl p-6 bg-slate-900 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-500 flex items-center gap-2"><LucideRadar/> RAPPORT DE CAPTEUR</h3>
                      <button onClick={() => setPhalanxResult(null)}><LucideFlag className="rotate-45" /></button>
                  </div>
                  <div className="space-y-2 font-mono text-sm max-h-[400px] overflow-y-auto">
                      {phalanxResult.length === 0 && <p>Aucun mouvement détecté.</p>}
                      {phalanxResult.map(m => (
                          <div key={m.id} className="p-2 border border-green-900/50 bg-black/50 text-green-400">
                              <div className="flex justify-between">
                                  <span>{m.type.toUpperCase()}</span>
                                  <span>{new Date(m.arrivalTime).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-xs text-green-600">
                                  De {m.source} vers {m.target}
                              </div>
                              <div className="text-xs text-green-700">
                                  Flotte: {Object.entries(m.fleet).map(([k,v]) => `${k}: ${v}`).join(', ')}
                              </div>
                          </div>
                      ))}
                  </div>
              </TechCard>
           </div>
      )}

      {/* ENTITY MODAL */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedEntity(null)}>
            <TechCard className="w-full max-w-md p-6 bg-slate-900 border-tech-blue shadow-[0_0_50px_rgba(14,165,233,0.2)]" onClick={(e: any) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white">{selectedEntity.name}</h3>
                        <p className="text-tech-blue font-mono">[{selectedEntity.coords.g}:{selectedEntity.coords.s}:{selectedEntity.coords.p}]</p>
                    </div>
                    <button onClick={() => setSelectedEntity(null)} className="text-slate-500 hover:text-white"><LucideFlag className="rotate-45" size={24}/></button>
                </div>
                
                {missileMode ? (
                     <div className="space-y-4">
                         <div className="bg-red-900/20 border border-red-500 p-4 rounded text-center">
                             <LucideBomb className="mx-auto text-red-500 mb-2" size={32}/>
                             <h4 className="text-red-500 font-bold uppercase mb-4">Frappe Nucléaire</h4>
                             
                             <div className="mb-4">
                                 <label className="block text-xs text-slate-400 mb-1">Nombre de Missiles</label>
                                 <input type="number" min="1" value={missileAmount} onChange={e => setMissileAmount(parseInt(e.target.value))} className="w-full bg-black border border-red-800 p-2 text-white text-center"/>
                             </div>
                             
                             <div className="mb-4">
                                 <label className="block text-xs text-slate-400 mb-1">Cible Prioritaire</label>
                                 <select value={primaryTarget} onChange={e => setPrimaryTarget(e.target.value)} className="w-full bg-black border border-red-800 p-2 text-white text-sm">
                                     <option value="lanceur_pls">Lanceur de PLS</option>
                                     <option value="laser_gneugneu">Laser GneuGneu</option>
                                     <option value="canon_plasma">Projecteur de Malaise</option>
                                     <option value="bouclier_safe_space">Bouclier</option>
                                 </select>
                             </div>

                             <div className="flex gap-2">
                                 <TechButton variant="secondary" onClick={() => setMissileMode(false)} className="flex-1">ANNULER</TechButton>
                                 <TechButton variant="danger" onClick={handleMissileAttack} className="flex-1">FEU !</TechButton>
                             </div>
                         </div>
                     </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2 bg-black/40 p-3 rounded border border-slate-800">
                            <p className="text-xs text-slate-500 uppercase">Joueur</p>
                            <p className="text-lg font-bold text-white">{selectedEntity.player}</p>
                        </div>
                        {selectedEntity.player !== 'Commandant' && (
                            <>
                            <TechButton 
                                variant="danger" 
                                onClick={() => handleAction('attack', selectedEntity)}
                                className="flex items-center justify-center gap-2"
                            >
                                <LucideCrosshair size={16}/> ATTAQUER
                            </TechButton>
                            <TechButton 
                                variant="primary" 
                                onClick={() => handleAction('transport', selectedEntity)}
                                className="flex items-center justify-center gap-2"
                            >
                                <LucidePickaxe size={16}/> TRANSPORTER
                            </TechButton>
                            <TechButton 
                                variant="secondary" 
                                onClick={() => handleAction('spy', selectedEntity)}
                                className="flex items-center justify-center gap-2"
                            >
                                <LucideEye size={16}/> ESPIONNER
                            </TechButton>
                            <TechButton 
                                variant="secondary" 
                                onClick={() => handlePhalanx(selectedEntity.coords)}
                                className="flex items-center justify-center gap-2 text-green-400 border-green-900"
                            >
                                <LucideRadar size={16}/> PHALANGE
                            </TechButton>
                            <TechButton 
                                variant="secondary" 
                                onClick={() => setMissileMode(true)}
                                className="col-span-2 flex items-center justify-center gap-2 text-red-500 border-red-900 bg-red-900/10 hover:bg-red-900"
                            >
                                <LucideBomb size={16}/> FRAPPE MISSILE
                            </TechButton>
                            </>
                        )}
                    </div>
                )}
            </TechCard>
        </div>
      )}
    </div>
  );
};
