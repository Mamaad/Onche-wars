
import React from 'react';
import { LucideRocket, LucidePickaxe, LucideDroplets, LucideAtom, LucideZap, LucideShield } from 'lucide-react';
import { Resources } from '../types';
import { ResourceDisplay } from './ResourceDisplay';

export const Header = ({ resources }: { resources: Resources }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-space-black/90 border-b border-slate-800 z-50 flex items-center justify-between px-6 shadow-2xl backdrop-blur-sm">
      <div className="hidden lg:flex items-center gap-3 text-tech-gold font-display font-black text-2xl tracking-widest text-glow select-none">
        <LucideRocket className="w-8 h-8 animate-pulse-slow" /> 
        <span>ONCHE<span className="text-slate-100">WARS</span></span>
      </div>
      
      <div className="flex gap-2 md:gap-4 w-full lg:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
        <ResourceDisplay 
          icon={<LucidePickaxe size={14} />} 
          name="RISITIUM" 
          value={resources.risitasium} 
          color="text-slate-300"
          border="border-slate-600"
        />
        <ResourceDisplay 
          icon={<LucideDroplets size={14} />} 
          name="STICKERS" 
          value={resources.stickers} 
          color="text-yellow-400"
          border="border-yellow-600/50"
        />
        <ResourceDisplay 
          icon={<LucideAtom size={14} />} 
          name="SEL" 
          value={resources.sel} 
          color="text-blue-400"
          border="border-blue-600/50"
        />
        <ResourceDisplay 
          icon={<LucideZap size={14} />} 
          name="KARMA" 
          value={resources.karma}
          subValue={resources.karmaMax}
          color={resources.karma >= 0 ? "text-green-400" : "text-red-500"}
          border={resources.karma >= 0 ? "border-green-600/50" : "border-red-600/50"}
        />
        <ResourceDisplay 
          icon={<LucideShield size={14} />} 
          name="REDPILL" 
          value={resources.redpills} 
          color="text-red-500"
          border="border-red-600/50"
        />
      </div>
    </div>
  );
};
