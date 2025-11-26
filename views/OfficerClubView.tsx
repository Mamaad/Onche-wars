
import React from 'react';
import { LucideUser, LucideCheck } from 'lucide-react';
import { Officer, Resources } from '../types';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const OfficerClubView = ({ officers, resources, onRecruit }: { officers: Officer[], resources: Resources, onRecruit: (id: string) => void }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CLUB DES OFFICIERS</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Recrutez l'élite pour booster votre empire.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {officers.map(officer => (
            <TechCard key={officer.id} className={`p-0 flex flex-col ${officer.active ? 'border-tech-gold ring-1 ring-tech-gold/50' : ''}`}>
                <div className="h-48 relative overflow-hidden bg-slate-900">
                    <img src={officer.image} alt={officer.name} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    {officer.active && (
                        <div className="absolute top-2 right-2 bg-green-500 text-black font-bold px-2 py-1 rounded text-xs flex items-center gap-1">
                            <LucideCheck size={12}/> ACTIF
                        </div>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-display font-bold text-white mb-1">{officer.name}</h3>
                    <p className="text-tech-gold text-sm font-bold mb-4">{officer.bonus}</p>
                    <p className="text-slate-400 text-xs mb-6 flex-1">{officer.description}</p>
                    
                    <TechButton 
                        onClick={() => onRecruit(officer.id)}
                        disabled={officer.active || resources.redpills < officer.cost}
                        variant={officer.active ? 'secondary' : 'primary'}
                        className="w-full"
                    >
                        {officer.active ? 'RECRUTÉ' : `ENGAGER (${officer.cost} Redpills)`}
                    </TechButton>
                </div>
            </TechCard>
        ))}
      </div>
    </div>
  );
};
