
import React from 'react';
import { LucideSkull, LucidePickaxe } from 'lucide-react';

export const UnderConstruction = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 border border-dashed border-slate-800 rounded-xl bg-black/20">
    <div className="relative mb-6">
       <LucideSkull size={64} className="opacity-50 text-red-900" />
       <LucidePickaxe size={32} className="absolute -bottom-2 -right-2 text-tech-gold animate-bounce" />
    </div>
    <h2 className="text-2xl font-display font-bold mb-2 text-white uppercase tracking-widest">{title}</h2>
    <p className="font-mono text-sm text-tech-blue">/// MODULE EN DÉVELOPPEMENT PAR CÉLESTINS INC. ///</p>
  </div>
);
