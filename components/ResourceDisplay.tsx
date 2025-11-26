
import React from 'react';
import { formatNumber } from '../utils';

export const ResourceDisplay = ({ icon, name, value, subValue, color, border }: any) => (
  <div className={`relative flex flex-col justify-center min-w-[100px] bg-slate-900/80 px-3 py-1.5 ${border} border-t-2 border-b-0 border-l-0 border-r-0 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]`}>
    <div className={`flex items-center gap-2 text-[10px] font-display font-bold tracking-wider mb-0.5 ${color} opacity-80 uppercase`}>
      {icon} <span>{name}</span>
    </div>
    <div className="text-lg font-mono font-medium text-white leading-none">
      {formatNumber(value)}
      {subValue !== undefined && <span className="text-slate-600 text-xs ml-1">/{formatNumber(subValue)}</span>}
    </div>
    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-30"></div>
  </div>
);
