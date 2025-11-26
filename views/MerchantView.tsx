
import React, { useState } from 'react';
import { LucideArrowRightLeft, LucideCoins, LucideScale } from 'lucide-react';
import { Resources } from '../types';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { formatNumber } from '../utils';

export const MerchantView = ({ resources, onTrade }: { resources: Resources, onTrade: (cost: Partial<Resources>, gain: Partial<Resources>) => void }) => {
    const [sellType, setSellType] = useState<'risitasium' | 'stickers' | 'sel'>('risitasium');
    const [buyType, setBuyType] = useState<'risitasium' | 'stickers' | 'sel'>('stickers');
    const [amount, setAmount] = useState(0);

    // Taux de change standard : 3 Metal = 2 Cristal = 1 Deut
    // Metal (Ris) Base 1
    // Cristal (Sti) Base 1.5 (vaut 1.5 Metal)
    // Deut (Sel) Base 3 (vaut 3 Metal)
    
    // Mais le marchand est une arnaque : Taxe du Syndicat
    const TAX_RATE = 0.3; // 30% de perte
    
    const ratios = {
        risitasium: 1,
        stickers: 1.5,
        sel: 3
    };

    const getOutputAmount = () => {
        if (sellType === buyType) return amount;
        
        const inputValueInMetal = amount * ratios[sellType];
        const outputValueInMetal = inputValueInMetal * (1 - TAX_RATE); // Apply Tax
        
        return Math.floor(outputValueInMetal / ratios[buyType]);
    };

    const handleTrade = () => {
        const cost = { [sellType]: amount };
        const gain = { [buyType]: getOutputAmount() };
        
        if (amount > 0 && resources[sellType] >= amount) {
            onTrade(cost, gain);
            setAmount(0);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">MARCHÉ NOIR</h2>
                <p className="text-slate-500 font-mono text-sm mt-1">Échanges rapides, discrets, et chers. Le Syndicat prend sa part.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* SELL */}
                <TechCard className="p-6 bg-red-900/10 border-red-900/30">
                    <h3 className="text-red-400 font-bold mb-4 uppercase text-center">Ressource à Vendre</h3>
                    <div className="flex flex-col gap-2">
                        {['risitasium', 'stickers', 'sel'].map((res) => (
                            <button 
                                key={res}
                                onClick={() => setSellType(res as any)}
                                className={`p-3 border rounded uppercase font-mono text-sm transition-all ${sellType === res ? 'bg-red-500 text-black border-red-500 font-bold' : 'bg-transparent border-slate-700 text-slate-400'}`}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4">
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))} 
                            className="w-full bg-black border border-red-900/50 p-2 text-white font-mono text-right"
                        />
                        <div className="text-xs text-right mt-1 text-slate-500">Dispo: {formatNumber(resources[sellType])}</div>
                    </div>
                </TechCard>

                {/* MIDDLE */}
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-tech-gold p-4 rounded-full text-black mb-4 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                        <LucideArrowRightLeft size={32} />
                    </div>
                    <div className="text-tech-gold font-display font-bold text-xl mb-1">TAXE SYNDICAT</div>
                    <div className="text-red-500 font-mono text-lg font-bold">{(TAX_RATE * 100)}%</div>
                    <p className="text-slate-500 text-xs max-w-[200px] mt-2">"C'est le prix de la discrétion, commandant."</p>
                </div>

                {/* BUY */}
                <TechCard className="p-6 bg-green-900/10 border-green-900/30">
                    <h3 className="text-green-400 font-bold mb-4 uppercase text-center">Ressource à Recevoir</h3>
                    <div className="flex flex-col gap-2">
                        {['risitasium', 'stickers', 'sel'].map((res) => (
                            <button 
                                key={res}
                                onClick={() => setBuyType(res as any)}
                                disabled={sellType === res}
                                className={`p-3 border rounded uppercase font-mono text-sm transition-all ${buyType === res ? 'bg-green-500 text-black border-green-500 font-bold' : 'bg-transparent border-slate-700 text-slate-400 disabled:opacity-30'}`}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 p-2 border border-green-900/50 bg-black/50 text-right">
                        <span className="text-2xl font-mono text-white">{formatNumber(getOutputAmount())}</span>
                    </div>
                </TechCard>
            </div>

            <div className="flex justify-center mt-8">
                <TechButton 
                    onClick={handleTrade} 
                    disabled={amount <= 0 || resources[sellType] < amount || sellType === buyType}
                    className="w-full md:w-1/2 py-4 text-lg"
                >
                    VALIDER L'ÉCHANGE
                </TechButton>
            </div>
        </div>
    );
};
