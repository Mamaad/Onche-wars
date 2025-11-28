
import React, { useState, useEffect } from 'react';
import { LucideHandshake, LucideUsers, LucideLogOut, LucidePlus, LucideSearch, LucideShield, LucideSettings, LucideMail, LucideCheck, LucideX, LucideInfo, LucidePenTool, LucideSwords, LucideFlag } from 'lucide-react';
import { Alliance, User, AllianceApplication } from '../types';
import { api } from '../api';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { formatNumber } from '../utils';

export const AllianceView = () => {
    const [user, setUser] = useState<User | null>(null);
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [myAlliance, setMyAlliance] = useState<Alliance | null>(null);
    const [view, setView] = useState<'dashboard' | 'list' | 'create'>('list');
    const [activeTab, setActiveTab] = useState<'overview' | 'diplomacy'>('overview'); // NEW Tab
    
    // Forms
    const [createTag, setCreateTag] = useState('');
    const [createName, setCreateName] = useState('');
    const [applicationMsg, setApplicationMsg] = useState('');
    const [selectedAllyId, setSelectedAllyId] = useState<string | null>(null);

    // Management Forms
    const [editDesc, setEditDesc] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const refreshData = async () => {
        const u = await api.getSession();
        const a = await api.getAlliances();
        setUser(u);
        setAlliances(a);
        
        if (u && u.allianceId) {
            const myAlly = a.find(x => x.id === u.allianceId);
            setMyAlliance(myAlly || null);
            setView('dashboard'); // Force dashboard view if in alliance
        } else {
            setMyAlliance(null);
            setView('list');
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleCreate = async () => {
        if (!user) return;
        if (user.points.total < 1000) {
            alert("Il vous faut 1000 points pour créer une alliance.");
            return;
        }
        const res = await api.createAlliance(user, createTag, createName);
        if (res.success) {
            await refreshData();
        } else {
            alert(res.error);
        }
    };

    const handleApply = async (allyId: string) => {
        if (!user) return;
        const res = await api.applyToAlliance(user, allyId, applicationMsg);
        if (res.success) {
            alert("Candidature envoyée.");
            setSelectedAllyId(null);
        } else {
            alert(res.error);
        }
    };

    const handleJoinOpen = async (allyId: string) => {
        if (!user) return;
        const res = await api.joinAlliance(user, allyId);
        if (res.success) {
            await refreshData();
        } else {
            alert(res.error);
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        if (confirm("Êtes-vous sûr de vouloir quitter l'alliance ?")) {
            await api.leaveAlliance(user);
            await refreshData();
        }
    };

    const handleUpdateDesc = async () => {
        if (!myAlliance) return;
        await api.updateAllianceDetails(myAlliance.id, { description: editDesc });
        setIsEditing(false);
        refreshData();
    };

    const handleApplication = async (appId: string, accept: boolean) => {
        if (!myAlliance) return;
        await api.manageApplication(myAlliance.id, appId, accept);
        refreshData();
    };

    // --- WAR HANDLERS ---
    const handleDeclareWar = async (targetId: string) => {
        if (!myAlliance) return;
        if (confirm("Déclarer la guerre ? Le leader ennemi devra accepter.")) {
            const res = await api.declareWar(myAlliance.id, targetId);
            if(res.success) alert("Déclaration envoyée.");
            else alert(res.error);
            refreshData();
        }
    };

    const handleManageWar = async (warId: string, accept: boolean) => {
        if (!myAlliance) return;
        await api.manageWar(myAlliance.id, warId, accept);
        refreshData();
    };

    // --- RENDER HELPERS ---

    if (!user) return <div>Chargement...</div>;

    // 1. DASHBOARD (If user has alliance)
    if (myAlliance) {
        const isFounder = myAlliance.founderId === user.id;

        return (
            <div className="animate-fade-in space-y-6">
                <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">
                            [{myAlliance.tag}] {myAlliance.name}
                        </h2>
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => setActiveTab('overview')} className={`text-xs font-bold uppercase ${activeTab === 'overview' ? 'text-tech-gold' : 'text-slate-500'}`}>Aperçu</button>
                            <button onClick={() => setActiveTab('diplomacy')} className={`text-xs font-bold uppercase ${activeTab === 'diplomacy' ? 'text-tech-gold' : 'text-slate-500'}`}>Diplomatie</button>
                        </div>
                    </div>
                    <TechButton variant="danger" onClick={handleLeave} className="text-xs">
                        <LucideLogOut size={14} className="mr-2 inline"/> QUITTER
                    </TechButton>
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT COL: INFO & INTERNAL */}
                        <div className="lg:col-span-2 space-y-6">
                            <TechCard className="p-6 min-h-[200px]">
                                <div className="flex justify-between mb-4">
                                    <h3 className="text-tech-blue font-bold flex items-center gap-2">
                                        <LucideInfo size={18}/> MESSAGE INTERNE
                                    </h3>
                                    {isFounder && (
                                        <button onClick={() => { setEditDesc(myAlliance.description); setIsEditing(!isEditing); }} className="text-slate-500 hover:text-white">
                                            <LucidePenTool size={14}/>
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea 
                                            className="w-full bg-black border border-slate-700 p-2 text-slate-300 text-sm h-32"
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <TechButton variant="secondary" onClick={() => setIsEditing(false)}>Annuler</TechButton>
                                            <TechButton onClick={handleUpdateDesc}>Sauvegarder</TechButton>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap font-mono">{myAlliance.description}</p>
                                )}
                            </TechCard>

                            <TechCard className="p-6">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <LucideUsers size={18}/> MEMBRES ({myAlliance.members.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-900 text-slate-500 uppercase text-xs">
                                            <tr>
                                                <th className="p-2">Joueur</th>
                                                <th className="p-2">Rang</th>
                                                <th className="p-2 text-right">Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {myAlliance.members.map((mid, idx) => (
                                                <tr key={mid} className="hover:bg-white/5">
                                                    <td className="p-2 font-bold text-slate-300">
                                                        {mid === user.id ? <span className="text-tech-gold">{user.username} (Vous)</span> : `Membre ${mid.substring(0,5)}...`}
                                                    </td>
                                                    <td className="p-2 text-slate-500">
                                                        {mid === myAlliance.founderId ? 'Fondateur' : 'Membre'}
                                                    </td>
                                                    <td className="p-2 text-right text-slate-400">-</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TechCard>
                        </div>

                        {/* RIGHT COL: ADMIN */}
                        <div className="space-y-6">
                            <TechCard className="p-6">
                                <h3 className="text-white font-bold mb-4">INFORMATIONS</h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex justify-between">
                                        <span>Points Totaux:</span>
                                        <span className="text-white font-mono">{formatNumber(myAlliance.points)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Création:</span>
                                        <span className="text-white font-mono">{new Date(myAlliance.creationDate).toLocaleDateString()}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Recrutement:</span>
                                        <span className={`uppercase font-bold ${myAlliance.recruitment === 'open' ? 'text-green-500' : 'text-red-500'}`}>
                                            {myAlliance.recruitment === 'open' ? 'Ouvert' : myAlliance.recruitment}
                                        </span>
                                    </li>
                                </ul>
                            </TechCard>

                            {isFounder && (
                                <TechCard className="p-6 border-tech-gold/30">
                                    <h3 className="text-tech-gold font-bold mb-4 flex items-center gap-2">
                                        <LucideSettings size={18}/> GESTION
                                    </h3>
                                    
                                    <div className="mb-4">
                                        <h4 className="text-xs uppercase text-slate-500 mb-2">Candidatures ({myAlliance.applications.length})</h4>
                                        {myAlliance.applications.length === 0 ? (
                                            <p className="text-xs text-slate-600 italic">Aucune demande en attente.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {myAlliance.applications.map(app => (
                                                    <div key={app.id} className="bg-black p-2 rounded border border-slate-700 text-xs">
                                                        <div className="flex justify-between font-bold text-white mb-1">
                                                            <span>{app.username}</span>
                                                            <span>{formatNumber(app.points)} pts</span>
                                                        </div>
                                                        <p className="text-slate-400 mb-2 italic">"{app.message}"</p>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleApplication(app.id, true)} className="flex-1 bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-800 rounded py-1 flex justify-center"><LucideCheck size={12}/></button>
                                                            <button onClick={() => handleApplication(app.id, false)} className="flex-1 bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-800 rounded py-1 flex justify-center"><LucideX size={12}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TechCard>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'diplomacy' && (
                    <div className="space-y-6">
                        <TechCard className="p-6 bg-red-900/10 border-red-900/30">
                            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2"><LucideSwords size={18}/> GUERRES ACTIVES</h3>
                            {(!myAlliance.wars || myAlliance.wars.filter(w => w.status === 'active').length === 0) ? (
                                <p className="text-slate-500 italic text-sm">Paix galactique (pour l'instant).</p>
                            ) : (
                                <div className="space-y-4">
                                    {myAlliance.wars.filter(w => w.status === 'active').map(war => (
                                        <div key={war.id} className="flex items-center justify-between bg-black/50 p-4 border border-red-800 rounded">
                                            <div className="flex items-center gap-4">
                                                <div className="text-xl font-bold text-red-500">{war.attackerName}</div>
                                                <div className="text-slate-500">VS</div>
                                                <div className="text-xl font-bold text-blue-400">{war.defenderName}</div>
                                            </div>
                                            <div className="text-xs font-mono text-slate-400">
                                                Score: {formatNumber(war.scoreAttacker)} - {formatNumber(war.scoreDefender)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TechCard>

                        <TechCard className="p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><LucideMail size={18}/> REQUÊTES DIPLOMATIQUES</h3>
                            {(!myAlliance.wars || myAlliance.wars.filter(w => w.status === 'pending').length === 0) ? (
                                <p className="text-slate-500 italic text-sm">Aucune demande en attente.</p>
                            ) : (
                                <div className="space-y-2">
                                    {myAlliance.wars.filter(w => w.status === 'pending').map(war => {
                                        const isIncoming = war.defenderId === myAlliance?.id;
                                        return (
                                            <div key={war.id} className="flex items-center justify-between bg-slate-900 p-3 border border-slate-700 rounded">
                                                <div>
                                                    <span className="font-bold text-white">{isIncoming ? war.attackerName : war.defenderName}</span>
                                                    <span className="text-slate-400 text-xs ml-2">
                                                        {isIncoming ? "veut vous déclarer la guerre" : "doit accepter votre déclaration"}
                                                    </span>
                                                </div>
                                                {isIncoming && isFounder ? (
                                                    <div className="flex gap-2">
                                                        <TechButton onClick={() => handleManageWar(war.id, true)} className="text-xs py-1 bg-red-900 border-red-700">ACCEPTER LE DÉFI</TechButton>
                                                        <TechButton onClick={() => handleManageWar(war.id, false)} variant="secondary" className="text-xs py-1">REFUSER</TechButton>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">En attente...</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TechCard>

                        {isFounder && (
                            <TechCard className="p-6">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><LucideFlag size={18}/> DÉCLARER UNE GUERRE</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {alliances.filter(a => a.id !== myAlliance?.id).map(ally => (
                                        <div key={ally.id} className="flex justify-between items-center p-2 hover:bg-white/5 border-b border-slate-800">
                                            <span className="text-slate-300">[{ally.tag}] {ally.name}</span>
                                            <button 
                                                onClick={() => handleDeclareWar(ally.id)}
                                                className="text-xs bg-red-900/30 text-red-500 border border-red-800 px-2 py-1 rounded hover:bg-red-800 hover:text-white"
                                            >
                                                DÉCLARER
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </TechCard>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 2. CREATE FORM
    if (view === 'create') {
        const canCreate = user.points.total >= 1000;

        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <button onClick={() => setView('list')} className="mb-4 text-slate-500 hover:text-white flex items-center gap-2">
                    &larr; Retour à la liste
                </button>
                <TechCard className="p-8">
                    <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                        <LucidePlus className="text-tech-gold"/> FONDER UNE ALLIANCE
                    </h2>
                    
                    {!canCreate && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 mb-6 rounded text-sm font-mono">
                            <p className="font-bold flex items-center gap-2"><LucideShield size={16}/> ACCÈS REFUSÉ</p>
                            <p>Il vous faut au moins 1 000 points au classement général pour fonder une alliance.</p>
                            <p className="mt-2 text-slate-400">Vos points actuels: {formatNumber(user.points.total)}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase mb-1">Tag de l'alliance (3-5 lettres)</label>
                            <input 
                                type="text" 
                                maxLength={5}
                                value={createTag} 
                                onChange={e => setCreateTag(e.target.value.toUpperCase())} 
                                className="w-full bg-black border border-slate-700 p-3 text-white font-display font-bold tracking-widest focus:border-tech-gold outline-none"
                                placeholder="TAG"
                                disabled={!canCreate}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase mb-1">Nom de l'alliance</label>
                            <input 
                                type="text" 
                                value={createName} 
                                onChange={e => setCreateName(e.target.value)} 
                                className="w-full bg-black border border-slate-700 p-3 text-white focus:border-tech-gold outline-none"
                                placeholder="Empire Galactique"
                                disabled={!canCreate}
                            />
                        </div>
                        <TechButton onClick={handleCreate} disabled={!createTag || !createName || !canCreate} className="w-full py-3">
                            CRÉER L'ALLIANCE
                        </TechButton>
                    </div>
                </TechCard>
            </div>
        );
    }

    // 3. ALLIANCE LIST (Default)
    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">ALLIANCES</h2>
                    <p className="text-slate-500 font-mono text-sm mt-1">Rejoignez une faction ou créez la vôtre.</p>
                </div>
                <TechButton onClick={() => setView('create')}>
                    <LucidePlus size={16} className="inline mr-2"/> CRÉER UNE ALLIANCE
                </TechButton>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-slate-500 uppercase text-xs font-display tracking-wider">
                        <tr>
                            <th className="p-4">Tag</th>
                            <th className="p-4">Nom</th>
                            <th className="p-4 text-center">Membres</th>
                            <th className="p-4 text-right">Points</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {alliances.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500 italic">Aucune alliance formée pour le moment.</td>
                            </tr>
                        )}
                        {alliances.map(ally => (
                            <React.Fragment key={ally.id}>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-display font-bold text-tech-gold">[{ally.tag}]</td>
                                    <td className="p-4 font-bold text-white">{ally.name}</td>
                                    <td className="p-4 text-center text-slate-400">{ally.members.length}</td>
                                    <td className="p-4 text-right font-mono text-blue-300">{formatNumber(ally.points)}</td>
                                    <td className="p-4 text-right">
                                        {ally.recruitment !== 'closed' && (
                                            <button 
                                                onClick={() => setSelectedAllyId(selectedAllyId === ally.id ? null : ally.id)}
                                                className="text-xs bg-slate-800 hover:bg-tech-blue hover:text-black px-3 py-1 rounded border border-slate-600 transition-colors"
                                            >
                                                REJOINDRE
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {/* Application Dropdown */}
                                {selectedAllyId === ally.id && (
                                    <tr>
                                        <td colSpan={5} className="bg-black/50 p-4 border-y border-slate-700">
                                            <div className="max-w-xl mx-auto">
                                                <h4 className="text-white font-bold mb-2">Candidature pour [{ally.tag}]</h4>
                                                {ally.recruitment === 'open' ? (
                                                    <div className="text-center">
                                                        <p className="text-green-400 mb-4 text-sm">Cette alliance est en recrutement ouvert.</p>
                                                        <TechButton onClick={() => handleJoinOpen(ally.id)}>REJOINDRE DIRECTEMENT</TechButton>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-slate-400 text-xs">Message de motivation requis :</p>
                                                        <textarea 
                                                            className="w-full bg-slate-900 border border-slate-700 p-2 text-white text-sm h-20"
                                                            placeholder="Bonjour, je souhaite rejoindre votre alliance car..."
                                                            value={applicationMsg}
                                                            onChange={e => setApplicationMsg(e.target.value)}
                                                        />
                                                        <div className="flex justify-end">
                                                            <TechButton onClick={() => handleApply(ally.id)} disabled={!applicationMsg}>ENVOYER</TechButton>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
