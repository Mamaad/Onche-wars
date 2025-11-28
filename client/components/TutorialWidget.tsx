
import React, { useState, useEffect } from 'react';
import { LucideCheckCircle, LucideCircle, LucideGift, LucideChevronUp, LucideChevronDown } from 'lucide-react';
import { QUEST_DB } from '../constants';
import { User } from '../types';
import { TechCard } from './TechCard';
import { TechButton } from './TechButton';

export const TutorialWidget = ({ user, onClaim }: { user: User, onClaim: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    // Find first incomplete quest
    const activeQuest = QUEST_DB.find(q => !user.completedQuests.includes(q.id));

    if (!activeQuest) return null; // All done

    // Re-check condition locally to show "Claim" button
    const isFinished = activeQuest.condition(user);

    return (
        <div className="fixed bottom-4 right-4 z-40 w-80">
            <TechCard className={`p-0 border-tech-blue/50 transition-all ${isOpen ? '' : 'h-12 overflow-hidden'}`}>
                <div 
                    className="bg-slate-900 p-3 flex justify-between items-center cursor-pointer border-b border-slate-800"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-2">
                        <LucideCircle className={`text-tech-blue ${!isFinished ? 'animate-pulse' : ''}`} size={16}/>
                        <span className="font-display font-bold text-white text-sm">TUTORIEL</span>
                    </div>
                    {isOpen ? <LucideChevronDown size={16} /> : <LucideChevronUp size={16} />}
                </div>
                
                {isOpen && (
                    <div className="p-4 bg-black/80">
                        <h4 className="font-bold text-tech-gold mb-1">{activeQuest.title}</h4>
                        <p className="text-sm text-slate-300 mb-3 font-mono">{activeQuest.description}</p>
                        
                        <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2 text-xs text-green-400 font-mono border border-slate-700 mb-3">
                            <LucideGift size={14}/>
                            Récompense: 
                            {activeQuest.reward.risitasium && ` ${activeQuest.reward.risitasium} Ris`}
                            {activeQuest.reward.stickers && ` ${activeQuest.reward.stickers} Sti`}
                            {activeQuest.reward.sel && ` ${activeQuest.reward.sel} Sel`}
                            {activeQuest.reward.redpills && ` ${activeQuest.reward.redpills} RP`}
                        </div>

                        {isFinished ? (
                            <TechButton onClick={() => onClaim(activeQuest.id)} className="w-full text-xs py-2 animate-pulse">
                                RÉCLAMER RÉCOMPENSE
                            </TechButton>
                        ) : (
                            <div className="text-xs text-slate-500 italic text-center">En attente de validation...</div>
                        )}
                    </div>
                )}
            </TechCard>
        </div>
    );
};
