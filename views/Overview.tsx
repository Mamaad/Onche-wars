
import React, { useState } from 'react';
import { LucideGlobe, LucideActivity, LucideShield, LucideEdit2, LucideCheck, LucideMaximize2, LucideThermometer } from 'lucide-react';
import { Resources, User } from '../types'; // Import User
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { api } from '../api';

// Pass current User to display planet stats correctly
export const Overview = ({ resources, planetName, onRename, user }: { resources: Resources, planetName: string, onRename: (name: string) => void, user: User }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(planetName);
  const [vacationLoading, setVacationLoading] = useState(false);

  const currentPlanet = user.planets.find(p => p.id === user.currentPlanetId) || user.planets[0];

  const handleSaveName = () => {
      onRename(newName);
      setIsEditing(false);
  };

  const toggleVacation = async () => {
      setVacationLoading(true);
      const updatedUser = { ...user, vacationMode: !user.vacationMode };
      await api.saveGameState(updatedUser);
      window.location.reload(); // Simple reload to refresh app state
  };

  return (
  <div className="animate-fade-in space-y-6">
    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
       <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">VUE D'ENSEMBLE</h2>
       
       <button 
         onClick={toggleVacation}
         disabled={vacationLoading}
         className={`text-xs px-3 py-1 rounded border ${user.vacationMode ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
       >
           {user.vacationMode ? 'MODE VACANCES ACTIF' : 'ACTIVER MODE VACANCES'}
       </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TechCard className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[300px] flex flex-col">
        <div className="relative h-40 bg-gradient-to-b from-slate-900 to-black border-b border-slate-800 flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
           <LucideGlobe size={120} className="text-tech-blue opacity-20 animate-pulse-slow" />
           <div className="absolute bottom-2 left-4">
             <span className="bg-green-900/30 text-green-400 border border-green-700/50 px-2 py-0.5 text-xs font-mono rounded">SÉCURISÉ</span>
           </div>
        </div>
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-4">
              {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        className="bg-black border border-tech-blue text-tech-gold font-display font-bold px-2 py-1 w-full"
                      />
                      <button onClick={handleSaveName} className="text-green-500 hover:text-white"><LucideCheck size={18}/></button>
                  </div>
              ) : (
                  <>
                    <h3 className="text-xl font-display font-bold text-tech-gold">{planetName}</h3>
                    <button onClick={() => setIsEditing(true)} className="text-slate-600 hover:text-white"><LucideEdit2 size={14}/></button>
                  </>
              )}
          </div>
          
          <ul className="space-y-3 text-slate-300 text-sm font-mono">
             <li className="flex justify-between border-b border-slate-800 pb-1">
                 <span className="text-slate-500">Diamètre</span>
                 <span className="text-white font-bold">12 800 km</span>
             </li>
             <li className="flex justify-between border-b border-slate-800 pb-1">
                 <span className="text-slate-500 flex items-center gap-2"><LucideThermometer size={14}/> Température</span>
                 <span className="text-white font-bold">{currentPlanet.temperature.min}°C / {currentPlanet.temperature.max}°C</span>
             </li>
             <li className="flex justify-between border-b border-slate-800 pb-1">
                 <span className="text-slate-500">Position</span>
                 <span className="text-white font-bold">[{currentPlanet.coords.g}:{currentPlanet.coords.s}:{currentPlanet.coords.p}]</span>
             </li>
             <li className="flex justify-between border-b border-slate-800 pb-1">
                 <span className="text-slate-500 flex items-center gap-2"><LucideMaximize2 size={14}/> Cases</span>
                 <span className={`${currentPlanet.fields.current >= currentPlanet.fields.max ? 'text-red-500' : 'text-white'} font-bold`}>
                     {currentPlanet.fields.current} / {currentPlanet.fields.max}
                 </span>
             </li>
          </ul>
        </div>
      </TechCard>

      <TechCard className="p-6">
        <h3 className="text-lg font-display font-bold text-tech-blue mb-4 flex items-center gap-2">
          <LucideActivity size={18} /> ÉVÉNEMENTS
        </h3>
        <div className="h-full flex items-center justify-center text-sm text-slate-500 font-mono border border-dashed border-slate-700 rounded bg-slate-900/50 p-4">
          // AUCUN MOUVEMENT DE FLOTTE DÉTECTÉ //
        </div>
      </TechCard>

      <TechCard className="p-6">
        <h3 className="text-lg font-display font-bold text-red-500 mb-4 flex items-center gap-2">
          <LucideShield size={18} /> RAPPORT DE COMBAT
        </h3>
        <div className="space-y-4">
           <div className="text-sm font-mono text-slate-400">
            Dernière incursion: <br/>
            <span className="text-white">Il y a 2 cycles solaires</span>
           </div>
           <TechButton variant="secondary" className="w-full text-xs">ACCÉDER AUX ARCHIVES</TechButton>
        </div>
      </TechCard>
    </div>
  </div>
  );
};
