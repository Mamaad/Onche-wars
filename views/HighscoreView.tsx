
import React, { useEffect, useState } from 'react';
import { LucideTrophy, LucideShield, LucideRocket, LucidePickaxe, LucideTestTube } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';
import { TechCard } from '../components/TechCard';
import { formatNumber } from '../utils';

export const HighscoreView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [category, setCategory] = useState<'total' | 'buildings' | 'research' | 'fleet' | 'defense'>('total');

    useEffect(() => {
        api.getHighscores().then(setUsers);
    }, []);

    const sortedUsers = [...users].sort((a, b) => b.points[category] - a.points[category]);

    const tabs = [
        { id: 'total', label: 'Général', icon: <LucideTrophy size={16}/> },
        { id: 'buildings', label: 'Bâtiments', icon: <LucidePickaxe size={16}/> },
        { id: 'research', label: 'Recherche', icon: <LucideTestTube size={16}/> },
        { id: 'fleet', label: 'Flotte', icon: <LucideRocket size={16}/> },
        { id: 'defense', label: 'Défense', icon: <LucideShield size={16}/> },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CLASSEMENT IMPÉRIAL</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCategory(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded font-display text-sm uppercase transition-all whitespace-nowrap
                            ${category === tab.id 
                                ? 'bg-tech-gold text-black font-bold' 
                                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}
                        `}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-slate-500 uppercase text-xs font-display tracking-wider">
                        <tr>
                            <th className="p-4 w-16 text-center">Rang</th>
                            <th className="p-4">Commandant</th>
                            <th className="p-4">Alliance</th>
                            <th className="p-4 text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedUsers.map((u, index) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-center font-mono text-slate-400">
                                    {index + 1}
                                </td>
                                <td className="p-4 font-bold text-white">
                                    {u.username}
                                    {u.isAdmin && <span className="ml-2 text-[10px] bg-red-900 text-red-400 px-1 rounded">ADMIN</span>}
                                </td>
                                <td className="p-4 text-slate-400 font-mono text-sm">
                                    {u.allianceId ? `[${u.allianceId}]` : '-'}
                                </td>
                                <td className="p-4 text-right font-mono text-tech-gold">
                                    {formatNumber(u.points[category])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
