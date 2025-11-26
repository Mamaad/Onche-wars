
import React, { useEffect, useState } from 'react';
import { LucideGlobe, LucidePickaxe, LucideAtom, LucideRocket, LucideCrosshair, LucideMessageSquare, LucideX, LucideMenu, LucideActivity, LucideNetwork, LucideShield, LucideUser, LucideGamepad2, LucideHelpCircle, LucideTrophy, LucideHandshake, LucideBriefcase, LucideSkull, LucideChevronDown, LucideSettings2, LucideMedal } from 'lucide-react';
import { TechCard } from './TechCard';
import { Building, ConstructionItem, User } from '../types';
import { formatTime } from '../utils';

export const Sidebar = ({ activeTab, setTab, isMobileOpen, setMobileOpen, buildings, queue, user, onPlanetChange }: { 
    activeTab: string, 
    setTab: any, 
    isMobileOpen: boolean, 
    setMobileOpen: any, 
    buildings: Building[], 
    queue: ConstructionItem[],
    user: User,
    onPlanetChange?: (id: string) => void
}) => {
  const [now, setNow] = useState(Date.now());

  // Update timer for progress bar
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);

  const hasBuilding = (id: string) => buildings.find((x: Building) => x.id === id && x.level > 0);
  
  const safeQueue = queue || [];

  const MENU_ITEMS = [
    { id: 'overview', label: 'COMMANDEMENT', icon: <LucideGlobe />, visible: true },
    { id: 'buildings', label: 'STRUCTURES', icon: <LucidePickaxe />, visible: true },
    { id: 'research', label: 'RECHERCHE', icon: <LucideAtom />, visible: hasBuilding('laboratoire_recherche') },
    { id: 'shipyard', label: 'CHANTIER SPATIAL', icon: <LucideRocket />, visible: hasBuilding('chantier_spatial') },
    { id: 'defense', label: 'DÉFENSE', icon: <LucideShield />, visible: hasBuilding('chantier_spatial') },
    { id: 'fleet', label: 'FLOTTE & RAIDS', icon: <LucideCrosshair />, visible: hasBuilding('chantier_spatial') },
    { id: 'galaxy', label: 'GALAXIE', icon: <LucideGlobe />, visible: true },
    { id: 'alliance', label: 'ALLIANCE', icon: <LucideHandshake />, visible: true },
    { id: 'officers', label: 'OFFICIERS', icon: <LucideUser />, visible: true },
    { id: 'commander', label: 'COMMANDANT', icon: <LucideMedal />, visible: true }, // NEW
    { id: 'merchant', label: 'COMMERCE', icon: <LucideBriefcase />, visible: true }, 
    { id: 'highscore', label: 'CLASSEMENT', icon: <LucideTrophy />, visible: true },
    { id: 'techtree', label: 'ARBRE TECH', icon: <LucideNetwork />, visible: true },
    { id: 'resources', label: 'RÉCAPITULATIF', icon: <LucideSettings2 />, visible: true },
    { id: 'simulator', label: 'SIMULATEUR', icon: <LucideGamepad2 />, visible: true },
    { id: 'messages', label: 'MESSAGERIE', icon: <LucideMessageSquare />, visible: true },
    { id: 'admin', label: 'ADMINISTRATION', icon: <LucideSkull />, visible: user.isAdmin },
  ];

  const getQueueName = (item: ConstructionItem) => {
    const b = buildings.find(x => x.id === item.id);
    return b ? `${b.name} (${item.targetLevel})` : "Recherche";
  };
  
  const currentPlanet = user.planets.find(p => p.id === user.currentPlanetId) || user.planets[0];

  return (
    <>
      <button 
        onClick={() => setMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-6 right-6 bg-tech-gold p-4 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] z-50 text-black animate-pulse"
      >
        {isMobileOpen ? <LucideX /> : <LucideMenu />}
      </button>

      <div className={`
        fixed top-20 bottom-0 left-0 w-72 bg-space-black/95 border-r border-slate-800 transition-transform duration-300 z-40 overflow-y-auto backdrop-blur-xl flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* QUEUE SECTION MOVED TO TOP */}
        <div className="p-6 pb-2 border-b border-slate-800/50">
           <TechCard className="p-4 bg-black/40">
              <p className="font-display text-xs text-slate-500 uppercase mb-2 flex justify-between items-center">
                <span>File de construction</span>
                <span className="text-xs font-mono">{safeQueue.length}/2</span>
              </p>
              
              {safeQueue.length > 0 ? (
                <div className="space-y-3">
                  {/* Active Item */}
                  <div className="text-sm text-tech-gold font-mono">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[120px]">{getQueueName(safeQueue[0])}</span>
                      <span>{formatTime(Math.max(0, (safeQueue[0].endTime - now) / 1000))}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-tech-gold h-full transition-all duration-1000 ease-linear" 
                        style={{
                            width: `${Math.min(100, Math.max(0, ((now - safeQueue[0].startTime) / (safeQueue[0].totalDuration * 1000)) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Queued Item */}
                  {safeQueue[1] && (
                    <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 flex justify-between items-center">
                       <span className="truncate max-w-[120px]">{getQueueName(safeQueue[1])}</span>
                       <span className="bg-slate-800 px-1 rounded text-[10px]">EN ATTENTE</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">Systèmes inactifs.</p>
              )}
            </TechCard>
        </div>

        <div className="flex-1 flex flex-col p-6 pt-4 gap-2">
          <div className="text-center pb-6 border-b border-slate-800/50 mb-4 relative">
             <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none"></div>
             
             {/* PLANET SELECTOR */}
             <div className="relative group cursor-pointer mb-3">
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded appearance-none font-display font-bold text-center focus:border-tech-gold outline-none"
                    value={user.currentPlanetId}
                    onChange={(e) => onPlanetChange && onPlanetChange(e.target.value)}
                 >
                     {user.planets.map(p => (
                         <option key={p.id} value={p.id}>
                             {p.isMoon ? '🌙 ' : '🪐 '} {p.name} [{p.coords.g}:{p.coords.s}:{p.coords.p}]
                         </option>
                     ))}
                 </select>
                 <LucideChevronDown className="absolute right-2 top-3 text-slate-500 pointer-events-none" size={16}/>
             </div>

             <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-black rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-slate-700 shadow-xl overflow-hidden group">
               <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{currentPlanet.isMoon ? '🌙' : '🪐'}</span>
             </div>
             <p className="text-tech-blue font-mono text-sm tracking-wider">[{currentPlanet.coords.g}:{currentPlanet.coords.s}:{currentPlanet.coords.p}]</p>
          </div>

          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              if (!item.visible) return null;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setMobileOpen(false); }}
                  className={`group relative w-full flex items-center gap-4 px-4 py-3 text-left transition-all duration-300
                    ${isActive 
                      ? 'text-tech-gold bg-gradient-to-r from-yellow-900/20 to-transparent border-l-2 border-tech-gold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
                  `}
                >
                  <span className={`transition-colors duration-300 ${isActive ? 'text-tech-gold drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'group-hover:text-tech-blue'}`}>
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
                  </span>
                  <span className="font-display font-semibold tracking-wider text-sm">{item.label}</span>
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-tech-gold blur-[2px]"></div>}
                </button>
              )
            })}
          </nav>
        </div>
          
        <div className="p-6 pt-2 bg-slate-900/30 border-t border-slate-800">
            <button
                onClick={() => { setTab('help'); setMobileOpen(false); }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded border transition-all duration-300
                  ${activeTab === 'help' 
                    ? 'bg-tech-blue text-black border-tech-blue font-bold' 
                    : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-400 hover:text-white'}
                `}
            >
              <LucideHelpCircle size={16} /> <span className="text-sm uppercase tracking-widest">Aide & Tutos</span>
            </button>
        </div>
      </div>
    </>
  );
};
