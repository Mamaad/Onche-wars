
import React, { useEffect, useState } from 'react';
import { LucideSkull, LucideCheckCircle, LucideBan } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';
import { TechCard } from '../components/TechCard';

export const AdminView = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        api.getAllUsers().then(setUsers);
    }, []);

    const handleBan = (id: string) => {
        // Mock ban logic
        alert(`Utilisateur ${id} banni (simulation)`);
    };

    const handleGiveRes = (id: string) => {
        const user = users.find(u => u.id === id);
        if (!user) return;
        
        // Give resources to the first planet or current planet
        const targetPlanetId = user.currentPlanetId || user.planets[0]?.id;
        const newPlanets = user.planets.map(p => {
             if(p.id === targetPlanetId) {
                 return {
                     ...p,
                     resources: { risitasium: 1000000, stickers: 1000000, sel: 1000000, karma: 1000, karmaMax: 1000, redpills: 1000 }
                 }
             }
             return p;
        });

        api.adminUpdateUser(id, { 
            planets: newPlanets
        });
        
        // Optimistically update local state
        setUsers(users.map(u => u.id === id ? { ...u, planets: newPlanets } : u));
        
        alert('Ressources envoyées sur la planète active.');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-red-900/50 pb-4 bg-red-900/10 p-4 rounded">
                <h2 className="text-3xl font-display font-bold text-red-500 tracking-widest flex items-center gap-3">
                    <LucideSkull size={32}/> CONSOLE ADMIN
                </h2>
                <p className="text-red-400 font-mono text-sm mt-1">Accès Restreint - Niveau 5</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users.map(u => (
                    <TechCard key={u.id} className="p-4 flex items-center justify-between border-slate-800">
                        <div>
                            <div className="font-bold text-white">{u.username} <span className="text-slate-500 text-xs">({u.id})</span></div>
                            <div className="text-xs text-slate-400 font-mono">{u.email || 'No Email'} | Planète: {u.planets.find(p => p.id === u.currentPlanetId)?.name || 'Inconnue'}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleGiveRes(u.id)} className="p-2 bg-blue-900/30 text-blue-400 border border-blue-900 rounded hover:bg-blue-900">
                                + RESSOURCES
                            </button>
                            <button onClick={() => handleBan(u.id)} className="p-2 bg-red-900/30 text-red-400 border border-red-900 rounded hover:bg-red-900">
                                <LucideBan size={16}/> BAN
                            </button>
                        </div>
                    </TechCard>
                ))}
            </div>
        </div>
    );
};