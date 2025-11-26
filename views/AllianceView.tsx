
import React, { useState, useEffect } from 'react';
import { LucideHandshake, LucideUsers, LucideLogOut, LucidePlus, LucideSearch, LucideShield, LucideSettings, LucideMail, LucideCheck, LucideX, LucideInfo, LucidePenTool } from 'lucide-react';
import { Alliance, User, AllianceApplication } from '../types';
import { api } from '../api';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { formatNumber } from '../utils';

export const AllianceView = () => {
    const [user, setUser] = useState<User | null>(null);
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [myAlliance, setMyAlliance] = useState<Alliance | null>(null);
    const [view, setView] = useState<'dashboard' | 'list' | 'create' | 'profile'>('list');
    const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null);

    // Forms
    const [createTag, setCreateTag] = useState('');
    const [createName, setCreateName] = useState('');
    const [applicationMsg, setApplicationMsg] = useState('');

    // Management Forms
    const [editDesc, setEditDesc] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editRecruitment, setEditRecruitment] = useState<'open' | 'application' | 'closed'>('open');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const u = await api.getSession();
        const all = await api.getAlliances();
        setUser(u);
        setAlliances(all);

        if (u && u.allianceId) {
            const myAlly = all.find(a => a.id === u.allianceId) || null;
            setMyAlliance(myAlly);
            // If we were browsing but we have an alliance, force dashboard unless viewing profile
            if (view !== 'profile') {
                setView('dashboard');
            }
            if (myAlly) {
                setEditDesc(myAlly.description);
                setEditImage(myAlly.image || '');
                setEditRecruitment(myAlly.recruitment);
            }
        } else {
            setMyAlliance(null);
            if (view === 'dashboard') setView('list');
        }
    };

    const handleCreate = async () => {
        if (!user) return;
        const res = await api.createAlliance(user, createTag, createName);
        if (res.success) {
            await loadData(); // Reload to get fresh user with allianceId
            setView('dashboard');
        } else alert(res.error);
    };

    const handleJoin = async (id: string) => {
        if (!user) return;
        const res = await api.joinAlliance(user, id);
        if (res.success) {
            await loadData();
            setView('dashboard');
        } else alert(res.error);
    };

    const handleApply = async () => {
        if (!user || !selectedAlliance) return;
        const res = await api.applyToAlliance(user, selectedAlliance.id, applicationMsg);
        if (res.success) {
            alert("Candidature envoyée au fondateur !");
            setApplicationMsg('');
            loadData(); // To refresh applications list if we are looking at it (though user can't see own app usually)
        } else {
            alert(res.error);
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        if (confirm("Êtes-vous sûr de vouloir quitter votre alliance ?")) {
            await api.leaveAlliance(user);
            await loadData();
            setView('list');
        }
    };

    const handleSaveSettings = async () => {
        if (!myAlliance) return;
        await api.updateAllianceDetails(myAlliance.id, {
            description: editDesc,
            image: editImage,
            recruitment: editRecruitment
        });
        setIsEditing(false);
        loadData();
    };

    const handleApplication = async (appId: string, accept: boolean) => {
        if (!myAlliance) return;
        await api.manageApplication(myAlliance.id, appId, accept);
        loadData();
    };

    const openProfile = (ally: Alliance) => {
        setSelectedAlliance(ally);
        setView('profile');
    };

    const backToList = () => {
        setView(myAlliance ? 'dashboard' : 'list');
        setSelectedAlliance(null);
    };

    if (!user) return <div>Chargement...</div>;
    const isFounder = myAlliance && myAlliance.founderId === user.id;

    // --- RENDER SECTIONS ---

    // 1. ALLIANCE PROFILE (Public View)
    if (view === 'profile' && selectedAlliance) {
        const isMember = user.allianceId === selectedAlliance.id;
        const canJoin = !user.allianceId && selectedAlliance.recruitment === 'open';
        const canApply = !user.allianceId && selectedAlliance.recruitment === 'application';
        const alreadyApplied = selectedAlliance.applications.some(a => a.userId === user.id);

        return (
            <div className="animate-fade-in space-y-6">
                 <button onClick={backToList} className="text-tech-blue hover:text-white mb-2 flex items-center gap-2 text-sm font-display font-bold uppercase">
                    <LucideSettings className="rotate-90" size={16}/> Retour
                </button>
                
                <TechCard className="p-0 overflow-hidden relative">
                    <div className="h-64 w-full bg-black relative">
                         {selectedAlliance.image ? (
                             <img src={selectedAlliance.image} className="w-full h-full object-cover opacity-60" />
                         ) : (
                             <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 opacity-50"></div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-space-black via-transparent to-transparent"></div>
                         <div className="absolute bottom-6 left-6">
                             <h1 className="text-5xl font-display font-black text-white mb-0 drop-shadow-lg text-glow">[{selectedAlliance.tag}]</h1>
                             <h2 className="text-2xl text-tech-gold uppercase tracking-widest font-bold">{selectedAlliance.name}</h2>
                         </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-lg font-display font-bold text-tech-blue mb-2">DESCRIPTION</h3>
                                <div className="bg-slate-900/50 p-4 rounded border border-slate-800 text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                                    {selectedAlliance.description || "Aucune description."}
                                </div>
                            </div>
                            
                            {/* Actions */}
                            {!isMember && (
                                <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                                    <h3 className="text-sm font-display font-bold text-white mb-2 uppercase">Recrutement: 
                                        <span className={`ml-2 ${selectedAlliance.recruitment === 'open' ? 'text-green-500' : selectedAlliance.recruitment === 'application' ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {selectedAlliance.recruitment === 'open' ? 'OUVERT' : selectedAlliance.recruitment === 'application' ? 'SUR CANDIDATURE' : 'FERMÉ'}
                                        </span>
                                    </h3>
                                    
                                    {canJoin && (
                                        <TechButton onClick={() => handleJoin(selectedAlliance.id)} className="w-full">REJOINDRE L'ALLIANCE</TechButton>
                                    )}

                                    {canApply && !alreadyApplied && (
                                        <div className="space-y-2">
                                            <textarea 
                                                value={applicationMsg} 
                                                onChange={e => setApplicationMsg(e.target.value)}
                                                className="w-full bg-black border border-slate-600 p-2 text-white text-sm"
                                                placeholder="Message de motivation pour le fondateur..."
                                                rows={3}
                                            />
                                            <TechButton onClick={handleApply} className="w-full" disabled={!applicationMsg}>ENVOYER CANDIDATURE</TechButton>
                                        </div>
                                    )}
                                    {alreadyApplied && (
                                        <div className="text-yellow-500 text-sm font-mono flex items-center gap-2 bg-yellow-900/20 p-2 rounded">
                                            <LucideInfo size={16}/> Votre candidature est en attente d'examen.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="bg-black/40 p-4 rounded border border-slate-800">
                                <h3 className="text-xs font-display font-bold text-slate-500 uppercase mb-4">INFORMATIONS</h3>
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Fondateur</span>
                                        <span className="text-white cursor-pointer hover:text-tech-blue flex items-center gap-1" onClick={() => alert("Messagerie en maintenance")}>
                                            <LucideMail size={12}/> Joueur_ID_{selectedAlliance.founderId.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Membres</span>
                                        <span className="text-white font-bold">{selectedAlliance.members.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Points</span>
                                        <span className="text-tech-gold font-bold">{formatNumber(selectedAlliance.points)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Création</span>
                                        <span className="text-white">{new Date(selectedAlliance.creationDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TechCard>
            </div>
        )
    }

    // 2. DASHBOARD (My Alliance)
    if (view === 'dashboard' && myAlliance) {
        return (
            <div className="animate-fade-in space-y-6">
                <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                    <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">QG DE L'ALLIANCE</h2>
                    <button onClick={() => setView('list')} className="text-slate-500 hover:text-white text-sm uppercase flex items-center gap-2">
                        <LucideSearch size={16}/> Liste des Alliances
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COL: INFO & ADMIN */}
                    <div className="lg:col-span-2 space-y-6">
                        <TechCard className="p-0 overflow-hidden relative min-h-[200px]">
                            {myAlliance.image && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: `url(${myAlliance.image})`}}></div>}
                            <div className="absolute inset-0 bg-gradient-to-r from-space-black to-transparent"></div>
                            
                            <div className="relative p-6 z-10">
                                <h1 className="text-4xl font-display font-bold text-white mb-2">[{myAlliance.tag}] {myAlliance.name}</h1>
                                
                                {isEditing ? (
                                    <div className="mt-4 bg-black/80 p-4 rounded border border-tech-gold space-y-4">
                                        <h3 className="text-tech-gold font-bold uppercase text-sm">Édition Profil</h3>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">URL Image (Bannière)</label>
                                            <input className="w-full bg-slate-900 border border-slate-700 p-2 text-white text-xs font-mono" value={editImage} onChange={e => setEditImage(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Description Publique</label>
                                            <textarea className="w-full bg-slate-900 border border-slate-700 p-2 text-white text-sm" rows={5} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Mode de Recrutement</label>
                                            <select className="w-full bg-slate-900 border border-slate-700 p-2 text-white text-sm" value={editRecruitment} onChange={e => setEditRecruitment(e.target.value as any)}>
                                                <option value="open">Ouvert (Automatique)</option>
                                                <option value="application">Sur Candidature</option>
                                                <option value="closed">Fermé</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs uppercase text-slate-400 hover:text-white">Annuler</button>
                                            <TechButton onClick={handleSaveSettings} className="text-xs">Enregistrer</TechButton>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-w-2xl bg-black/20 p-2 rounded backdrop-blur-sm border border-white/5">
                                            {myAlliance.description}
                                        </div>
                                        {isFounder && (
                                            <button onClick={() => setIsEditing(true)} className="mt-4 text-tech-gold hover:text-white text-xs uppercase flex items-center gap-1">
                                                <LucidePenTool size={12}/> Modifier les infos
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </TechCard>

                        {/* MEMBERS LIST */}
                        <TechCard className="p-6">
                            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2"><LucideUsers size={18}/> MEMBRES ({myAlliance.members.length})</h3>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                {myAlliance.members.map((memberId, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-black flex items-center justify-center text-xs font-bold text-slate-500">
                                                {memberId.slice(0,2)}
                                            </div>
                                            <div>
                                                <span className={`font-mono text-sm ${memberId === user.id ? 'text-tech-gold' : 'text-white'}`}>
                                                    {memberId === user.id ? user.username : `Commandant_${memberId.slice(-4)}`}
                                                </span>
                                                {memberId === myAlliance.founderId && <span className="ml-2 text-[10px] bg-blue-900 text-blue-400 px-1 rounded">FONDATEUR</span>}
                                            </div>
                                        </div>
                                        <button className="text-slate-600 hover:text-white"><LucideMail size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        </TechCard>
                    </div>

                    {/* RIGHT COL: ACTIONS & APPS */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-800 text-center">
                            <div className="text-slate-500 text-xs uppercase mb-1">Points Totaux</div>
                            <div className="text-2xl font-mono text-tech-gold font-bold">{formatNumber(myAlliance.points)}</div>
                        </div>

                        {/* APPLICATIONS MANAGEMENT (Founder Only) */}
                        {isFounder && (
                            <TechCard className="p-4 border-yellow-900/30 bg-yellow-900/10">
                                <h3 className="text-sm font-display font-bold text-yellow-500 mb-2 uppercase flex items-center justify-between">
                                    Candidatures 
                                    <span className="bg-yellow-500 text-black text-xs px-1.5 rounded-full">{myAlliance.applications.length}</span>
                                </h3>
                                
                                {myAlliance.applications.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">Aucune candidature en attente.</p>
                                ) : (
                                    <div className="space-y-3 mt-3">
                                        {myAlliance.applications.map(app => (
                                            <div key={app.id} className="bg-black p-3 rounded border border-slate-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-white font-bold text-sm">{app.username}</span>
                                                    <span className="text-tech-gold text-xs">{formatNumber(app.points)} pts</span>
                                                </div>
                                                <p className="text-slate-400 text-xs italic mb-3">"{app.message}"</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApplication(app.id, true)} className="flex-1 bg-green-900/30 text-green-400 border border-green-800 rounded py-1 text-xs hover:bg-green-900">ACCEPTER</button>
                                                    <button onClick={() => handleApplication(app.id, false)} className="flex-1 bg-red-900/30 text-red-400 border border-red-800 rounded py-1 text-xs hover:bg-red-900">REFUSER</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TechCard>
                        )}

                        <TechButton variant="danger" onClick={handleLeave} className="w-full flex items-center justify-center gap-2">
                            <LucideLogOut size={16}/> QUITTER L'ALLIANCE
                        </TechButton>
                    </div>
                </div>
            </div>
        );
    }

    // 3. LIST VIEW & CREATE (Default fallback)
    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">RÉSEAU DIPLOMATIQUE</h2>
                {myAlliance && (
                    <TechButton onClick={() => setView('dashboard')} variant="secondary" className="text-xs">
                        RETOUR QG
                    </TechButton>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LIST */}
                <div className="space-y-4">
                     <h3 className="text-xl font-display font-bold text-tech-blue">ALLIANCES EXISTANTES</h3>
                     {alliances.length === 0 && <p className="text-slate-500 italic">Aucune alliance formée.</p>}
                     {alliances.map(a => (
                         <TechCard key={a.id} className="p-4 flex justify-between items-center hover:border-tech-blue cursor-pointer transition-colors group" onClick={() => openProfile(a)}>
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-black border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden rounded relative">
                                    {a.image ? <img src={a.image} className="absolute inset-0 w-full h-full object-cover" /> : a.tag.slice(0,2)}
                                 </div>
                                 <div>
                                     <div className="font-bold text-white text-lg group-hover:text-tech-blue transition-colors">[{a.tag}] {a.name}</div>
                                     <div className="text-xs text-slate-400 font-mono flex gap-3">
                                         <span>{a.members.length} membres</span>
                                         <span className="text-tech-gold">{formatNumber(a.points)} pts</span>
                                     </div>
                                 </div>
                             </div>
                             {a.id === user.allianceId && <span className="text-xs bg-tech-gold text-black px-2 py-1 rounded font-bold">MA FLOTTE</span>}
                         </TechCard>
                     ))}
                </div>

                {/* CREATE (Only if no alliance) */}
                {!myAlliance && (
                    <TechCard className="p-6 h-fit bg-tech-gold/5 border-tech-gold/30 sticky top-24">
                        <h3 className="text-xl font-display font-bold text-tech-gold mb-4 flex items-center gap-2">
                            <LucidePlus /> FONDER UNE ALLIANCE
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-slate-400 mb-1">TAG (3-5 lettres)</label>
                                <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase().slice(0,5))} className="w-full bg-black border border-slate-700 p-2 text-white font-mono uppercase focus:border-tech-gold outline-none" placeholder="TAG" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-slate-400 mb-1">NOM COMPLET</label>
                                <input value={createName} onChange={e => setCreateName(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white focus:border-tech-gold outline-none" placeholder="Empire Galactique" />
                            </div>
                            <TechButton onClick={handleCreate} disabled={createTag.length < 3 || !createName} className="w-full">
                                CRÉER L'ALLIANCE (1,000 pts requis)
                            </TechButton>
                            <p className="text-[10px] text-slate-500 text-center">
                                En créant une alliance, vous devenez responsable de sa gestion et de son recrutement.
                            </p>
                        </div>
                    </TechCard>
                )}
            </div>
        </div>
    );
};
