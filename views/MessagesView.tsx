
import React from 'react';
import { LucideMail, LucideTrash2, LucideBookOpen } from 'lucide-react';
import { Report } from '../types';
import { TechCard } from '../components/TechCard';

export const MessagesView = ({ reports, onRead }: { reports: Report[], onRead: (id: string) => void }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">MESSAGERIE</h2>
      </div>

      <div className="space-y-4">
          {reports.length === 0 && <p className="text-slate-500 italic text-center py-10">Aucun message reçu.</p>}
          
          {reports.map(msg => (
              <TechCard key={msg.id} className={`p-4 cursor-pointer transition-colors ${msg.read ? 'bg-black/40 border-slate-800' : 'bg-slate-900/80 border-tech-blue'}`} onClick={() => onRead(msg.id)}>
                  <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold ${msg.read ? 'text-slate-400' : 'text-white'}`}>{msg.title}</h3>
                      <span className="text-xs text-slate-500 font-mono">{new Date(msg.date).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{msg.content}</div>
                  {msg.loot && (
                      <div className="mt-2 text-xs text-yellow-500 font-mono border-t border-slate-700 pt-2">
                          Pillage: Ris: {msg.loot.risitasium} | Sti: {msg.loot.stickers} | Sel: {msg.loot.sel}
                      </div>
                  )}
              </TechCard>
          ))}
      </div>
    </div>
  );
};
