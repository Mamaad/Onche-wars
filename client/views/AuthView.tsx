
import React, { useState } from 'react';
import { LucideRocket, LucideAlertTriangle } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';
import { TechButton } from '../components/TechButton';

export const AuthView = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await api.login(username, password);
                if (res.success && res.user) onLogin(res.user);
                else setError(res.error || "Erreur de connexion");
            } else {
                const res = await api.register(username, password, email || undefined);
                if (res.success && res.user) onLogin(res.user);
                else setError(res.error || "Erreur d'inscription");
            }
        } catch (err) {
            setError("Erreur serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-space-black via-space-black/80 to-transparent"></div>
            
            <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-slate-700 p-8 shadow-[0_0_50px_rgba(251,191,36,0.1)] rounded-xl">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-tech-gold/10 border border-tech-gold/30 mb-4 animate-pulse-slow">
                        <LucideRocket size={48} className="text-tech-gold" />
                    </div>
                    <h1 className="text-4xl font-display font-black text-white tracking-widest text-glow">ONCHE<span className="text-tech-gold">WARS</span></h1>
                    <p className="text-slate-400 font-mono mt-2 text-sm">CONQUÊTE SPATIALE & DÉCADENCE</p>
                </div>

                <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded">
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold uppercase transition-all rounded ${isLogin ? 'bg-tech-blue text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Connexion</button>
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold uppercase transition-all rounded ${!isLogin ? 'bg-tech-gold text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Inscription</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Pseudo</label>
                        <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-tech-blue focus:outline-none rounded" placeholder="Commandant..." />
                    </div>
                    
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Email <span className="text-slate-600">(Facultatif)</span></label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-tech-blue focus:outline-none rounded" placeholder="contact@empire.com" />
                            <p className="text-[10px] text-yellow-500/80 mt-1 flex items-center gap-1">
                                <LucideAlertTriangle size={10}/> Sans email, impossible de récupérer le compte en cas de perte du mot de passe.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Mot de passe</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 text-white focus:border-tech-blue focus:outline-none rounded" placeholder="••••••••" />
                    </div>

                    {error && <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm text-center font-mono">{error}</div>}

                    <TechButton className="w-full py-3 mt-4" disabled={loading}>
                        {loading ? 'CHARGEMENT...' : (isLogin ? 'INITIALISER LE LIEN NEURAL' : 'CRÉER UNE NOUVELLE COLONIE')}
                    </TechButton>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-600 font-mono">SERVER: UBUNTU-24.04-LTS // NODE: V1.0.0</p>
                </div>
            </div>
        </div>
    );
};
