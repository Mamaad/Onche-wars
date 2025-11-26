
import React, { useState, useMemo } from 'react';
import { LucideGlobe, LucideChevronLeft, LucideChevronRight, LucidePickaxe, LucideEye, LucideMail, LucideCrosshair, LucideMessageSquare, LucideSkull } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const GalaxyView = ({ onNavigate }: { onNavigate: (tab: string, params: any) => void }) => {
  const [coords, setCoords] = useState({ g: 1, s: 42 });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  const changeSystem = (delta: number) => {
    setCoords(prev => ({ ...prev, s: Math.max(1, Math.min(499, prev.s + delta)) }));
  };

  const systemData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const pos = i + 1;
      const seed = coords.g * 1000 + coords.s * 100 + pos;
      const isColonized = (seed * 9301 + 49297) % 100 < 40; 
      
      if (!isColonized) return { pos, colonized: false };

      return {
        pos,
        colonized: true,
        image: `p${(pos % 5) + 1}`,
        name: (pos === 6 && coords.s === 42) ? 'Planète Mère' : `Colonie ${pos}`,
        player: (pos === 6 && coords.s === 42) ? 'Commandant' : `Khey_${(seed * 7) % 1000}`,
        alliance: (seed % 6 === 0) ? "NOEL" : (seed % 4 === 0) ? "YKK" : "",
        rank: (seed % 500) + 1,
        status: (seed % 25 === 0) ? 'i' : (seed % 60 === 0) ? 'v' : '',
        debris: (seed % 10 === 0) ? { metal: 1000, crystal: 500 } : null,
        moon: (seed % 15 === 0),
        coords: { g: coords.g, s: coords.s, p: pos }
      };
    });
  }, [coords]);

  const handleAction = (type: string, targetData: any) => {
      if (type === 'attack') {
          onNavigate('fleet', { target: targetData.coords, mission: 'attack' });
      } else if (type === 'spy') {
          // Send spy mission immediately or via fleet view
          onNavigate('fleet', { target: targetData.coords, mission: 'spy' });
      } else if (type === 'transport') {
          onNavigate('fleet', { target: targetData.coords, mission: 'transport' });
      }
      setSelectedEntity(null);
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
                      {planet.debris && (
                        <div 
                            onClick={() => onNavigate('fleet', { target: planet.coords, mission: 'recycle' })}
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-900/20 text-green-500 border border-green-900/50 cursor-pointer hover:bg-green-900/40 hover:scale-110 transition-transform" 
                            title="Recycler Champ de débris"
                        >
                          <LucidePickaxe size={12}/>
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
                  <td colSpan={7} className="px-4 text-slate-800 italic text-xs font-mono uppercase tracking-widest">-- Secteur Vide --</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Entity Modal / Popup */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedEntity(null)}>
            <TechCard className="w-full max-w-md p-6 bg-slate-900 border-tech-blue shadow-[0_0_50px_rgba(14,165,233,0.2)]" onClick={(e: any) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white">{selectedEntity.name}</h3>
                        <p className="text-tech-blue font-mono">[{selectedEntity.coords.g}:{selectedEntity.coords.s}:{selectedEntity.coords.p}]</p>
                    </div>
                    <button onClick={() => setSelectedEntity(null)} className="text-slate-500 hover:text-white"><LucideCrosshair className="rotate-45" size={24}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2 bg-black/40 p-3 rounded border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase">Joueur</p>
                        <p className="text-lg font-bold text-white">{selectedEntity.player}</p>
                    </div>
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
                        className="flex items-center justify-center gap-2"
                    >
                        <LucideMessageSquare size={16}/> MESSAGE
                    </TechButton>
                     <TechButton 
                        variant="disabled" 
                        className="flex items-center justify-center gap-2 col-span-2 border-red-900/30 text-red-900"
                    >
                        <LucideSkull size={16}/> BLACKLISTER
                    </TechButton>
                </div>
            </TechCard>
        </div>
      )}
    </div>
  );
};
