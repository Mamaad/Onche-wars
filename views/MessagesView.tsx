
import React, { useState } from 'react';
import { LucideMail, LucideTrash2, LucideBookOpen, LucideSwords } from 'lucide-react';
import { Report, DetailedCombatReport } from '../types';
import { TechCard } from '../components/TechCard';
import { formatNumber } from '../utils';

export const MessagesView = ({ reports, onRead }: { reports: Report[], onRead: (id: string) => void }) => {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const toggleDetail = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedReport(expandedReport === id ? null : id);
  };

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
                      <div className="flex items-center gap-2">
                          <h3 className={`font-bold ${msg.read ? 'text-slate-400' : 'text-white'}`}>{msg.title}</h3>
                          {msg.detailedCombat && (
                             <button onClick={(e) => toggleDetail(e, msg.id)} className="bg-red-900/50 text-red-400 text-xs px-2 py-0.5 rounded border border-red-800 flex items-center gap-1 hover:bg-red-800 hover:text-white">
                                 <LucideSwords size={12}/> COMBAT DÉTAILLÉ
                             </button>
                          )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{new Date(msg.date).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{msg.content}</div>
                  
                  {/* Detailed Report Expand */}
                  {expandedReport === msg.id && msg.detailedCombat && (
                      <div className="mt-4 bg-black p-4 rounded border border-slate-700 font-mono text-xs animate-fade-in">
                          <h4 className="font-bold text-center text-red-500 mb-2 uppercase">Journal de Bataille Tactique</h4>
                          
                          <div className="space-y-4">
                              {msg.detailedCombat.rounds.map(r => (
                                  <div key={r.round} className="border-t border-slate-800 pt-2">
                                      <div className="text-center font-bold text-slate-500 mb-1">- ROUND {r.round} -</div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="text-right border-r border-slate-800 pr-2">
                                              <span className="text-blue-400 font-bold block mb-1">ATTAQUANT</span>
                                              {Object.entries(r.attackerCount).map(([id, count]) => (
                                                  <div key={id} className="flex justify-end gap-2">
                                                      <span>{id}:</span>
                                                      <span className="text-white">{count}</span>
                                                      {r.attackerLosses[id] > 0 && <span className="text-red-500">(-{r.attackerLosses[id]})</span>}
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="pl-2">
                                              <span className="text-green-400 font-bold block mb-1">DÉFENSEUR</span>
                                              {Object.entries(r.defenderCount).map(([id, count]) => (
                                                  <div key={id} className="flex gap-2">
                                                      <span>{id}:</span>
                                                      <span className="text-white">{count}</span>
                                                      {r.defenderLosses[id] > 0 && <span className="text-red-500">(-{r.defenderLosses[id]})</span>}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="mt-4 border-t border-slate-700 pt-2 text-center">
                              <div className="text-lg font-bold text-white mb-1">
                                  VAINQUEUR: {msg.detailedCombat.winner.toUpperCase()}
                              </div>
                              <div className="flex justify-center gap-4 text-slate-400">
                                  <span>Débris: {formatNumber(msg.detailedCombat.debris)}</span>
                                  {msg.detailedCombat.moonCreated && <span className="text-tech-gold animate-pulse font-bold">LUNE CRÉÉE !</span>}
                              </div>
                          </div>
                      </div>
                  )}

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
