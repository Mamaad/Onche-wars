
import React, { useState, useEffect } from 'react';
import { LucideHandshake, LucideUsers, LucideLogOut, LucidePlus, LucideSearch } from 'lucide-react';
import { Alliance, User } from '../types';
import { api } from '../api';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';

export const AllianceView = () => {
    const [user, setUser] = useState<User | null>(null);
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [myAlliance, setMyAlliance] = useState<Alliance | null>(null);
    
    // Forms
    const [createTag, setCreateTag] = useState('');
    const [createName, setCreateName] = useState('');
    const [viewMode, setViewMode] = useState<'mine' | 'list'>('mine');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const u = await api.getSession();
        const all = await api.getAlliances();
        setUser(u);
        setAlliances(all);
        if (u && u.allianceId) {
            setMyAlliance(all.find(a => a.id === u.allianceId) || null);
        } else {
            setMyAlliance(null);
            setViewMode('list');
        }
    };

    const handleCreate = async () => {
        if (!user) return;
        const res = await api.createAlliance(user, createTag, createName);
        if (res.success) loadData();
        else alert(res.error);
    };

    const handleJoin = async (id: string) => {
        if (!user) return;
        const res = await api.joinAlliance(user, id);
        if (res.success) loadData();
        else alert(res.error);
    };

    const handleLeave = async () => {
        if (!user) return;
        if (confirm("Êtes-vous sûr de vouloir quitter votre alliance ?")) {
            await api.leaveAlliance(user);
            loadData();
        }
    };

    if (!user) return <div>Chargement...</div>;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">RÉSEAU DIPLOMATIQUE</h2>
                {myAlliance && (
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('mine')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${viewMode === 'mine' ? 'bg-tech-gold text-black' : 'bg-slate-900 border border-slate-700'}`}>Mon Alliance</button>
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${viewMode === 'list' ? 'bg-tech-gold text-black' : 'bg-slate-900 border border-slate-700'}`}>Liste</button>
                    </div>
                )}
            </div>

            {/* IF NO ALLIANCE AND MODE LIST (DEFAULT) */}
            {!myAlliance || viewMode === 'list' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LIST */}
                    <div className="space-y-4">
                         <h3 className="text-xl font-display font-bold text-tech-blue">ALLIANCES EXISTANTES</h3>
                         {alliances.length === 0 && <p className="text-slate-500 italic">Aucune alliance formée.</p>}
                         {alliances.map(a => (
                             <TechCard key={a.id} className="p-4 flex justify-between items-center hover:border-slate-600">
                                 <div>
                                     <div className="font-bold text-white text-lg">[{a.tag}] {a.name}</div>
                                     <div className="text-xs text-slate-400 font-mono">{a.members.length} membres</div>
                                 </div>
                                 {!myAlliance && (
                                     <TechButton onClick={() => handleJoin(a.id)} className="text-xs">REJOINDRE</TechButton>
                                 )}
                             </TechCard>
                         ))}
                    </div>

                    {/* CREATE */}
                    {!myAlliance && (
                        <TechCard className="p-6 h-fit bg-tech-gold/5 border-tech-gold/30">
                            <h3 className="text-xl font-display font-bold text-tech-gold mb-4 flex items-center gap-2">
                                <LucidePlus /> FONDER UNE ALLIANCE
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono text-slate-400 mb-1">TAG (3-5 lettres)</label>
                                    <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase().slice(0,5))} className="w-full bg-black border border-slate-700 p-2 text-white font-mono uppercase" placeholder="TAG" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-slate-400 mb-1">NOM COMPLET</label>
                                    <input value={createName} onChange={e => setCreateName(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white" placeholder="Empire Galactique" />
                                </div>
                                <TechButton onClick={handleCreate} disabled={createTag.length < 3 || !createName} className="w-full">CRÉER</TechButton>
                            </div>
                        </TechCard>
                    )}
                </div>
            ) : (
                /* MY ALLIANCE VIEW */
                <div className="space-y-6">
                    <TechCard className="p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-tech-gold to-transparent"></div>
                        <h1 className="text-5xl font-display font-black text-white mb-2">[{myAlliance.tag}]</h1>
                        <h2 className="text-2xl text-tech-gold uppercase tracking-widest mb-6">{myAlliance.name}</h2>
                        
                        <div className="flex justify-center gap-8 text-sm font-mono text-slate-400 border-t border-b border-slate-800 py-4 mb-6">
                            <div>
                                <span className="block text-white font-bold text-lg">{myAlliance.members.length}</span>
                                MEMBRES
                            </div>
                            <div>
                                <span className="block text-white font-bold text-lg">---</span>
                                POINTS (TODO)
                            </div>
                            <div>
                                <span className="block text-white font-bold text-lg">{new Date(myAlliance.creationDate).toLocaleDateString()}</span>
                                CRÉATION
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded text-slate-300 italic font-mono mb-6 max-w-2xl mx-auto">
                            "{myAlliance.description}"
                        </div>

                        <TechButton variant="danger" onClick={handleLeave} className="mx-auto flex items-center gap-2">
                            <LucideLogOut size={16}/> QUITTER L'ALLIANCE
                        </TechButton>
                    </TechCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TechCard className="p-6">
                            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2"><LucideUsers size={18}/> LISTE DES MEMBRES</h3>
                            <ul className="space-y-2">
                                {myAlliance.members.map((memberId, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800">
                                        <span className="text-white font-mono">{memberId === user.id ? <span className="text-tech-gold">{user.username} (Moi)</span> : `Membre ${memberId.slice(0,5)}...`}</span>
                                        {memberId === myAlliance.founderId && <span className="text-[10px] bg-blue-900 text-blue-400 px-1 rounded">FONDATEUR</span>}
                                    </li>
                                ))}
                            </ul>
                        </TechCard>

                        <TechCard className="p-6 opacity-50">
                            <h3 className="text-lg font-display font-bold text-white mb-4">MESSAGERIE INTERNE</h3>
                            <div className="h-40 flex items-center justify-center border border-dashed border-slate-700 rounded">
                                <p className="text-xs text-slate-500">CANAL SÉCURISÉ EN MAINTENANCE</p>
                            </div>
                        </TechCard>
                    </div>
                </div>
            )}
        </div>
    );
};
