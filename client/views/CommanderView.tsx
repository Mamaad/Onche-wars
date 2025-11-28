
import React from 'react';
import { LucideMedal, LucideSword, LucidePickaxe, LucideBrain, LucideLock, LucideUnlock, LucideBox } from 'lucide-react';
import { User, Talent, Artifact } from '../types';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { api } from '../api';

export const CommanderView = ({ user }: { user: User }) => {
    
    const handleLearn = async (talentId: string) => {
        const res = await api.learnTalent(user, talentId);
        if (res.success) {
            window.location.reload(); // Force refresh for talent update
        } else {
            alert(res.error);
        }
    };

    const branches = {
        raider: user.talents.filter(t => t.branch === 'raider'),
        miner: user.talents.filter(t => t.branch === 'miner'),
        strategist: user.talents.filter(t => t.branch === 'strategist'),
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">PROFIL COMMANDANT</h2>
                    <p className="text-slate-500 font-mono text-sm mt-1">Niveau {user.commanderLevel} | XP: {user.commanderXp} / {user.commanderLevel * 1000}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase block">Points de Talent</span>
                    <span className="text-4xl font-mono font-bold text-tech-gold">{user.skillPoints}</span>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-tech-blue h-full transition-all" style={{ width: `${Math.min(100, (user.commanderXp / (user.commanderLevel * 1000)) * 100)}%` }}></div>
            </div>

            {/* TALENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TalentColumn title="RAIDER" icon={<LucideSword/>} talents={branches.raider} user={user} onLearn={handleLearn} color="text-red-500" border="border-red-900"/>
                <TalentColumn title="MINEUR" icon={<LucidePickaxe/>} talents={branches.miner} user={user} onLearn={handleLearn} color="text-yellow-500" border="border-yellow-900"/>
                <TalentColumn title="STRATÈGE" icon={<LucideBrain/>} talents={branches.strategist} user={user} onLearn={handleLearn} color="text-blue-500" border="border-blue-900"/>
            </div>

            {/* INVENTORY */}
            <TechCard className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <LucideBox size={18} className="text-tech-gold"/> INVENTAIRE D'ARTEFACTS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {user.inventory.length === 0 && <p className="text-slate-500 italic text-sm col-span-full">Votre inventaire est vide. Lancez des expéditions pour trouver des artefacts.</p>}
                    {user.inventory.map((item, idx) => (
                        <div key={idx} className="bg-black border border-slate-700 p-3 rounded group relative hover:border-tech-gold transition-colors">
                            <img src={item.image} alt={item.name} className="w-full h-24 object-cover mb-2 rounded opacity-70 group-hover:opacity-100"/>
                            <div className={`text-xs font-bold uppercase mb-1 ${item.rarity === 'legendary' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-slate-300'}`}>{item.name}</div>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.description}</p>
                        </div>
                    ))}
                </div>
            </TechCard>
        </div>
    );
};

const TalentColumn = ({ title, icon, talents, user, onLearn, color, border }: any) => (
    <TechCard className={`p-0 overflow-hidden border ${border}`}>
        <div className="bg-black/50 p-3 border-b border-slate-800 flex items-center justify-center gap-2 font-bold tracking-widest">
            <span className={color}>{icon}</span> <span className="text-white">{title}</span>
        </div>
        <div className="p-4 space-y-4">
            {talents.map((t: Talent) => {
                const isMaxed = t.currentLevel >= t.maxLevel;
                const canAfford = user.skillPoints > 0;
                const reqsMet = !t.reqs || Object.entries(t.reqs).every(([reqId, lvl]) => {
                    const found = user.talents.find((x: any) => x.id === reqId);
                    return found && found.currentLevel >= lvl;
                });

                return (
                    <div key={t.id} className={`p-3 rounded border ${t.currentLevel > 0 ? `bg-slate-900 ${border}` : 'bg-black border-slate-800 opacity-70'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-white text-sm">{t.name}</span>
                            <span className="text-xs text-slate-500">{t.currentLevel}/{t.maxLevel}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 h-8">{t.description}</p>
                        <p className="text-xs font-mono text-green-400 mb-2">{t.effect(t.currentLevel)}</p>
                        
                        {!isMaxed ? (
                            <button 
                                onClick={() => onLearn(t.id)}
                                disabled={!canAfford || !reqsMet}
                                className={`w-full py-1 text-xs uppercase font-bold rounded border ${canAfford && reqsMet ? 'bg-tech-blue text-black border-tech-blue hover:bg-white' : 'bg-transparent text-slate-600 border-slate-700 cursor-not-allowed'}`}
                            >
                                {reqsMet ? 'AMÉLIORER' : 'VERROUILLÉ'}
                            </button>
                        ) : (
                            <div className="text-center text-xs text-tech-gold font-bold uppercase border border-tech-gold/30 rounded py-1">MAÎTRISÉ</div>
                        )}
                    </div>
                )
            })}
        </div>
    </TechCard>
);
